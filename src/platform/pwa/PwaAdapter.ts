export type ServiceWorkerStatus =
  | 'unsupported'
  | 'checking'
  | 'installing'
  | 'ready'
  | 'waiting'
  | 'activating'
  | 'reload-ready'
  | 'failed';

export interface PwaState {
  serviceWorkerStatus: ServiceWorkerStatus;
  installed: boolean;
  installPromptAvailable: boolean;
  detail: string;
}

export type PwaActionResult = { ok: true } | { ok: false; detail: string };

export interface PwaAdapter {
  getState(): PwaState;
  subscribe(listener: (state: PwaState) => void): () => void;
  register(): Promise<void>;
  requestInstall(): Promise<PwaActionResult>;
  activateWaitingUpdate(): PwaActionResult;
  reload(): void;
}
