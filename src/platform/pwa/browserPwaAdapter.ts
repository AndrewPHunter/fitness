import type { PwaAdapter, PwaState } from './PwaAdapter';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export function createBrowserPwaAdapter(
  browserWindow: Window = window,
  browserNavigator: Navigator = navigator,
  basePath = import.meta.env.BASE_URL,
  enabled = import.meta.env.PROD,
): PwaAdapter {
  const listeners = new Set<(state: PwaState) => void>();
  const serviceWorkers = enabled ? browserNavigator.serviceWorker : undefined;
  let registration: ServiceWorkerRegistration | null = null;
  let registrationPromise: Promise<void> | null = null;
  let deferredInstall: BeforeInstallPromptEvent | null = null;
  let activationRequested = false;
  let state: PwaState = {
    serviceWorkerStatus: serviceWorkers ? 'checking' : 'unsupported',
    installed:
      (typeof browserWindow.matchMedia === 'function' &&
        browserWindow.matchMedia('(display-mode: standalone)').matches) ||
      (browserNavigator as NavigatorWithStandalone).standalone === true,
    installPromptAvailable: false,
    detail: serviceWorkers
      ? 'Checking the offline app shell.'
      : 'Offline installation is unavailable.',
  };

  const publish = (next: Partial<PwaState>) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener(state));
  };

  const observeInstallingWorker = (worker: ServiceWorker | null) => {
    if (!worker) return;
    publish({ serviceWorkerStatus: 'installing', detail: 'Caching the offline app shell.' });
    worker.addEventListener('statechange', () => {
      if (worker.state !== 'installed') return;
      if (serviceWorkers?.controller) {
        publish({ serviceWorkerStatus: 'waiting', detail: 'A new version is ready to install.' });
      } else {
        publish({ serviceWorkerStatus: 'ready', detail: 'The offline app shell is ready.' });
      }
    });
  };

  browserWindow.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstall = event as BeforeInstallPromptEvent;
    publish({ installPromptAvailable: true, detail: state.detail });
  });
  browserWindow.addEventListener('appinstalled', () => {
    deferredInstall = null;
    publish({ installed: true, installPromptAvailable: false });
  });
  serviceWorkers?.addEventListener('message', (event) => {
    if (event.data?.type !== 'FIELDWORK_UPDATE_ACTIVATED' || !activationRequested) return;
    publish({
      serviceWorkerStatus: 'reload-ready',
      detail: 'The update is installed and will open only when you choose to reload.',
    });
  });

  const register = async () => {
    if (!serviceWorkers) return;
    registrationPromise ??= (async () => {
      try {
        registration = await serviceWorkers.register(`${basePath}sw.js`, {
          scope: basePath,
          updateViaCache: 'none',
        });
        registration.addEventListener('updatefound', () => {
          observeInstallingWorker(registration?.installing ?? null);
        });
        if (registration.waiting) {
          publish({ serviceWorkerStatus: 'waiting', detail: 'A new version is ready to install.' });
        } else if (registration.installing) {
          observeInstallingWorker(registration.installing);
        } else {
          publish({ serviceWorkerStatus: 'ready', detail: 'The offline app shell is ready.' });
        }
      } catch (error: unknown) {
        publish({
          serviceWorkerStatus: 'failed',
          detail: `Offline setup failed. ${error instanceof Error ? error.message : 'Reload while online to retry.'}`,
        });
      }
    })();
    await registrationPromise;
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    register,
    requestInstall: async () => {
      const prompt = deferredInstall;
      if (!prompt) {
        return { ok: false, detail: 'This browser did not offer one-tap installation.' };
      }
      deferredInstall = null;
      publish({ installPromptAvailable: false });
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') return { ok: true };
        return {
          ok: false,
          detail: 'Installation was dismissed. You can use the browser menu instead.',
        };
      } catch (error: unknown) {
        return {
          ok: false,
          detail: `Installation could not start. ${error instanceof Error ? error.message : 'Use the browser menu instead.'}`,
        };
      }
    },
    activateWaitingUpdate: () => {
      const worker = registration?.waiting;
      if (!worker) return { ok: false, detail: 'The waiting update is no longer available.' };
      activationRequested = true;
      worker.postMessage({ type: 'FIELDWORK_ACTIVATE_UPDATE' });
      publish({
        serviceWorkerStatus: 'activating',
        detail: 'Installing the chosen update. This screen will not reload automatically.',
      });
      return { ok: true };
    },
    reload: () => browserWindow.location.reload(),
  };
}
