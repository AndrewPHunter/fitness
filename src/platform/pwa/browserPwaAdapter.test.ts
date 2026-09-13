import { createBrowserPwaAdapter } from './browserPwaAdapter';

function browserHarness({ standalone = false, waiting = true } = {}) {
  const windowListeners = new Map<string, EventListener[]>();
  const workerListeners = new Map<string, EventListener[]>();
  const registrationListeners = new Map<string, EventListener[]>();
  const reload = vi.fn();
  const postMessage = vi.fn();
  const waitingWorker = {
    state: 'installed',
    postMessage,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      workerListeners.set(type, [...(workerListeners.get(type) ?? []), listener]);
    }),
  } as unknown as ServiceWorker;
  const registration = {
    waiting: waiting ? waitingWorker : null,
    installing: null,
    active: waiting ? ({} as ServiceWorker) : waitingWorker,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      registrationListeners.set(type, [...(registrationListeners.get(type) ?? []), listener]);
    }),
  } as unknown as ServiceWorkerRegistration;
  const register = vi.fn(async () => registration);
  const serviceWorker = {
    controller: waiting ? ({} as ServiceWorker) : null,
    register,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      workerListeners.set(type, [...(workerListeners.get(type) ?? []), listener]);
    }),
  } as unknown as ServiceWorkerContainer;
  const browserWindow = {
    location: { reload },
    matchMedia: vi.fn(() => ({ matches: standalone })),
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      windowListeners.set(type, [...(windowListeners.get(type) ?? []), listener]);
    }),
  } as unknown as Window;
  const browserNavigator = { serviceWorker } as unknown as Navigator;
  const dispatchWindow = (type: string, event: Event) =>
    windowListeners.get(type)?.forEach((listener) => listener(event));
  const dispatchWorker = (type: string, event: Event) =>
    workerListeners.get(type)?.forEach((listener) => listener(event));

  return {
    browserWindow,
    browserNavigator,
    dispatchWindow,
    dispatchWorker,
    postMessage,
    register,
    reload,
  };
}

it('registers under the project scope and activates a waiting worker only after user action', async () => {
  const harness = browserHarness();
  const adapter = createBrowserPwaAdapter(
    harness.browserWindow,
    harness.browserNavigator,
    '/fitness/',
    true,
  );
  await adapter.register();
  expect(harness.register).toHaveBeenCalledWith('/fitness/sw.js', {
    scope: '/fitness/',
    updateViaCache: 'none',
  });
  expect(adapter.getState().serviceWorkerStatus).toBe('waiting');
  expect(harness.postMessage).not.toHaveBeenCalled();

  expect(adapter.activateWaitingUpdate()).toEqual({ ok: true });
  expect(harness.postMessage).toHaveBeenCalledWith({ type: 'FIELDWORK_ACTIVATE_UPDATE' });
  expect(adapter.getState().serviceWorkerStatus).toBe('activating');

  harness.dispatchWorker('message', {
    data: { type: 'FIELDWORK_UPDATE_ACTIVATED' },
  } as MessageEvent);
  expect(adapter.getState().serviceWorkerStatus).toBe('reload-ready');
  expect(harness.reload).not.toHaveBeenCalled();
  adapter.reload();
  expect(harness.reload).toHaveBeenCalledOnce();
});

it('offers one-tap installation only after the browser event and detects installed display mode', async () => {
  const harness = browserHarness({ standalone: false, waiting: false });
  const adapter = createBrowserPwaAdapter(
    harness.browserWindow,
    harness.browserNavigator,
    '/fitness/',
    true,
  );
  expect(adapter.getState().installPromptAvailable).toBe(false);
  expect(await adapter.requestInstall()).toEqual({
    ok: false,
    detail: 'This browser did not offer one-tap installation.',
  });

  const prompt = vi.fn(async () => undefined);
  const preventDefault = vi.fn();
  harness.dispatchWindow('beforeinstallprompt', {
    preventDefault,
    prompt,
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  } as unknown as Event);
  expect(preventDefault).toHaveBeenCalledOnce();
  expect(adapter.getState().installPromptAvailable).toBe(true);
  expect(await adapter.requestInstall()).toEqual({ ok: true });
  expect(prompt).toHaveBeenCalledOnce();

  harness.dispatchWindow('appinstalled', new Event('appinstalled'));
  expect(adapter.getState()).toMatchObject({ installed: true, installPromptAvailable: false });

  const installedHarness = browserHarness({ standalone: true, waiting: false });
  const installedAdapter = createBrowserPwaAdapter(
    installedHarness.browserWindow,
    installedHarness.browserNavigator,
    '/fitness/',
    true,
  );
  expect(installedAdapter.getState().installed).toBe(true);
});
