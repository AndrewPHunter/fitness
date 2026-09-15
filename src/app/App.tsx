import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DataPage } from '../features/data/DataPage';
import { AuthorPage } from '../features/authoring/AuthorPage';
import { ExerciseHistoryPage } from '../features/history/ExerciseHistoryPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { ProgramDetailPage } from '../features/programs/ProgramDetailPage';
import { ProgramsPage } from '../features/programs/ProgramsPage';
import { ActiveSessionPage } from '../features/session/ActiveSessionPage';
import { TodayPage } from '../features/session/TodayPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { PwaUpdateNotice } from '../features/pwa/PwaUpdateNotice';
import { usePwa } from '../features/pwa/usePwa';
import { downloadText } from '../platform/files/files';
import { createBrowserClipboardAdapter } from '../platform/clipboard/browserClipboardAdapter';
import { createBrowserPwaAdapter } from '../platform/pwa/browserPwaAdapter';
import { applyTheme } from '../platform/theme/applyTheme';
import { Button } from '../ui/atoms/Button';
import { AppShell } from '../ui/templates/AppShell';
import { usePersistedStore } from './PersistedProvider';

const pwaAdapter = createBrowserPwaAdapter();

function ActionFeedback({
  store,
}: {
  store: NonNullable<ReturnType<typeof usePersistedStore>['store']>;
}) {
  const location = useLocation();
  const previousLocation = useRef(location.key);

  useLayoutEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [location.key]);

  useEffect(() => {
    if (previousLocation.current !== location.key) {
      const state = location.state as { preserveFeedback?: boolean } | null;
      if (!state?.preserveFeedback) store.clearMessages();
    }
    previousLocation.current = location.key;
  }, [location.key, location.state, store]);

  return (
    <>
      <div className="visually-hidden" aria-live="polite">
        {store.notice}
      </div>
      {store.notice ? (
        <aside className="global-feedback global-feedback-success" aria-hidden="true">
          <span className="state-symbol">✓</span>
          <p>{store.notice}</p>
        </aside>
      ) : null}
      {store.failure ? (
        <aside className="global-feedback global-feedback-failure" role="alert">
          <span className="state-symbol" aria-hidden="true">
            !
          </span>
          <div className="stack">
            <strong>Action failed</strong>
            <p>{store.failure}</p>
            <div className="cluster">
              <a className="button button-secondary" href="#/data">
                Open Backup
              </a>
              <Button variant="ghost" onClick={store.clearMessages}>
                Dismiss
              </Button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}

export function App() {
  const { store, fatal } = usePersistedStore();
  const clipboard = useMemo(() => createBrowserClipboardAdapter(), []);
  const pwaState = usePwa(pwaAdapter);
  useEffect(() => {
    if (!store) return;
    const theme = store.data.settings.theme;
    applyTheme(theme);
  }, [store]);
  if (fatal)
    return (
      <main className="page">
        <section className="error-panel" role="alert">
          <p className="eyebrow">Storage locked</p>
          <h1>Your training data could not be opened.</h1>
          <p>Nothing was reset or changed. Download the raw stored text before troubleshooting.</p>
          <ul>
            {fatal.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          {fatal.raw ? (
            <Button
              onClick={() => downloadText(fatal.raw ?? '', 'fitness-raw-rescue.txt', 'text/plain')}
            >
              Download raw rescue copy
            </Button>
          ) : (
            <p>No readable raw value was available. Browser storage may be blocked.</p>
          )}
        </section>
      </main>
    );
  if (!store)
    return (
      <main className="page">
        <p>Loading local training data…</p>
      </main>
    );
  return (
    <AppShell>
      <PwaUpdateNotice
        adapter={pwaAdapter}
        state={pwaState}
        sessionInProgress={store.activeSession() !== null}
      />
      <Routes>
        <Route path="/" element={<TodayPage store={store} />} />
        <Route
          path="/author"
          element={
            <AuthorPage
              programs={store.data.programs}
              clipboard={clipboard}
              download={downloadText}
            />
          }
        />
        <Route path="/programs" element={<ProgramsPage store={store} />} />
        <Route path="/programs/:programId/:version" element={<ProgramDetailPage store={store} />} />
        <Route path="/session/active" element={<ActiveSessionPage store={store} />} />
        <Route path="/history" element={<HistoryPage store={store} />} />
        <Route path="/history/:exerciseId" element={<ExerciseHistoryPage store={store} />} />
        <Route path="/data" element={<DataPage store={store} />} />
        <Route
          path="/settings"
          element={<SettingsPage store={store} pwaAdapter={pwaAdapter} pwaState={pwaState} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ActionFeedback store={store} />
    </AppShell>
  );
}
