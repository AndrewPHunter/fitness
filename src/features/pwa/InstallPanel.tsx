import { useState } from 'react';
import type { PwaAdapter, PwaState } from '../../platform/pwa/PwaAdapter';
import { Button } from '../../ui/atoms/Button';

const statusLabels: Record<PwaState['serviceWorkerStatus'], string> = {
  unsupported: 'Offline shell unavailable',
  checking: 'Checking offline shell',
  installing: 'Caching offline shell',
  ready: 'Offline shell ready',
  waiting: 'New version waiting',
  activating: 'Installing chosen update',
  'reload-ready': 'New version ready to open',
  failed: 'Offline shell failed',
};

const statusSymbols: Record<PwaState['serviceWorkerStatus'], string> = {
  unsupported: '!',
  checking: '…',
  installing: '↻',
  ready: '✓',
  waiting: '↑',
  activating: '↻',
  'reload-ready': '✓',
  failed: '!',
};

export function InstallPanel({ adapter, state }: { adapter: PwaAdapter; state: PwaState }) {
  const [feedback, setFeedback] = useState('');

  const requestInstall = async () => {
    const result = await adapter.requestInstall();
    setFeedback(
      result.ok
        ? 'Installation accepted. Follow any remaining browser instructions.'
        : result.detail,
    );
  };

  return (
    <section className="surface stack" aria-labelledby="installation-title">
      <div>
        <p className="eyebrow">Home Screen & offline</p>
        <h2 id="installation-title">Install Fieldwork</h2>
      </div>
      <p className="pwa-state-line">
        <span className="state-symbol" aria-hidden="true">
          {statusSymbols[state.serviceWorkerStatus]}
        </span>
        <strong>{statusLabels[state.serviceWorkerStatus]}</strong>
        <span>{state.detail}</span>
      </p>
      {state.installed ? (
        <p>
          Fieldwork is running as an installed app. Keep making JSON exports—installation reduces
          browser-storage eviction risk but is not a backup.
        </p>
      ) : state.installPromptAvailable ? (
        <div className="stack">
          <p>This browser has offered one-tap installation.</p>
          <Button onClick={requestInstall}>Install Fieldwork</Button>
        </div>
      ) : (
        <div className="stack">
          <p>
            On iPhone or iPad in Safari, tap Share, then “Add to Home Screen.” In other browsers,
            use the browser menu’s install or add-to-home-screen command.
          </p>
          <p className="muted">
            Installation reduces storage eviction risk; it does not eliminate it or replace regular
            JSON exports.
          </p>
        </div>
      )}
      {feedback ? <p role="status">{feedback}</p> : null}
    </section>
  );
}
