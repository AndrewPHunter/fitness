import { useState } from 'react';
import type { PwaAdapter, PwaState } from '../../platform/pwa/PwaAdapter';
import { Button } from '../../ui/atoms/Button';

export function PwaUpdateNotice({
  adapter,
  state,
  sessionInProgress,
}: {
  adapter: PwaAdapter;
  state: PwaState;
  sessionInProgress: boolean;
}) {
  const [actionFailure, setActionFailure] = useState('');

  if (state.serviceWorkerStatus === 'failed') {
    return (
      <aside className="pwa-notice pwa-notice-failure" role="alert">
        <span className="state-symbol" aria-hidden="true">
          !
        </span>
        <div>
          <strong>Offline app setup failed</strong>
          <p>{state.detail}</p>
        </div>
      </aside>
    );
  }

  if (state.serviceWorkerStatus === 'activating') {
    return (
      <aside className="pwa-notice" role="status">
        <span className="state-symbol" aria-hidden="true">
          ↻
        </span>
        <div>
          <strong>Installing the update</strong>
          <p>{state.detail}</p>
        </div>
      </aside>
    );
  }

  if (state.serviceWorkerStatus === 'waiting') {
    return (
      <aside className="pwa-notice" role="status">
        <span className="state-symbol" aria-hidden="true">
          ↑
        </span>
        <div className="stack">
          <div>
            <strong>New version available</strong>
            <p>
              {sessionInProgress
                ? 'Finish the session in progress before installing it.'
                : 'Your current version stays in place until you choose to update.'}
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={sessionInProgress}
            onClick={() => {
              if (sessionInProgress) return;
              const result = adapter.activateWaitingUpdate();
              setActionFailure(result.ok ? '' : result.detail);
            }}
          >
            {sessionInProgress ? 'Update after session' : 'Install new version'}
          </Button>
          {actionFailure ? <p role="alert">Update failed. {actionFailure}</p> : null}
        </div>
      </aside>
    );
  }

  if (state.serviceWorkerStatus === 'reload-ready') {
    return (
      <aside className="pwa-notice" role="status">
        <span className="state-symbol" aria-hidden="true">
          ✓
        </span>
        <div className="stack">
          <div>
            <strong>New version installed</strong>
            <p>
              {sessionInProgress
                ? 'Finish the session in progress before reloading into it.'
                : 'Reload when you are ready. Nothing will reload automatically.'}
            </p>
          </div>
          <Button variant="secondary" disabled={sessionInProgress} onClick={() => adapter.reload()}>
            {sessionInProgress ? 'Reload after session' : 'Reload into new version'}
          </Button>
        </div>
      </aside>
    );
  }

  return null;
}
