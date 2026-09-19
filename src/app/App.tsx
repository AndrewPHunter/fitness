import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ActiveSessionPage } from '../features/session/ActiveSessionPage';
import { TodayPage } from '../features/session/TodayPage';
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
const AuthorPage = lazy(async () => ({
  default: (await import('../features/authoring/AuthorPage')).AuthorPage,
}));
const DataPage = lazy(async () => ({
  default: (await import('../features/data/DataPage')).DataPage,
}));
const ExerciseHistoryPage = lazy(async () => ({
  default: (await import('../features/history/ExerciseHistoryPage')).ExerciseHistoryPage,
}));
const HistoryPage = lazy(async () => ({
  default: (await import('../features/history/HistoryPage')).HistoryPage,
}));
const ProgramDetailPage = lazy(async () => ({
  default: (await import('../features/programs/ProgramDetailPage')).ProgramDetailPage,
}));
const ProgramsPage = lazy(async () => ({
  default: (await import('../features/programs/ProgramsPage')).ProgramsPage,
}));
const SettingsPage = lazy(async () => ({
  default: (await import('../features/settings/SettingsPage')).SettingsPage,
}));

function RouteFallback() {
  return (
    <main className="page route-loading" aria-busy="true">
      <p>Opening local screen…</p>
    </main>
  );
}

export function ActionFeedback({
  store,
}: {
  store: NonNullable<ReturnType<typeof usePersistedStore>['store']>;
}) {
  const location = useLocation();
  const previousLocation = useRef(location.key);
  const dismissTimer = useRef<number | null>(null);
  const [exiting, setExiting] = useState(false);
  const feedback = store.failure ?? store.notice;

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

  useEffect(() => {
    setExiting(false);
    if (!feedback) return;
    const fadeTimer = window.setTimeout(() => setExiting(true), 5200);
    const clearTimer = window.setTimeout(store.clearMessages, 5500);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
      if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);
    };
  }, [feedback, store.clearMessages]);

  const dismiss = () => {
    setExiting(true);
    if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);
    dismissTimer.current = window.setTimeout(store.clearMessages, 180);
  };

  return (
    <>
      <div className="visually-hidden" aria-live="polite">
        {store.notice}
      </div>
      {store.notice ? (
        <aside
          className={`global-feedback global-feedback-success${exiting ? ' global-feedback-exiting' : ''}`}
        >
          <span className="state-symbol" aria-hidden="true">
            ✓
          </span>
          <p aria-hidden="true">{store.notice}</p>
          <Button
            className="feedback-dismiss"
            variant="ghost"
            aria-label="Dismiss notification"
            onClick={dismiss}
          >
            Dismiss
          </Button>
        </aside>
      ) : null}
      {store.failure ? (
        <aside
          className={`global-feedback global-feedback-failure${exiting ? ' global-feedback-exiting' : ''}`}
          role="alert"
        >
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
              <Button variant="ghost" onClick={dismiss}>
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
      <main className="page standalone-page">
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
      <main className="page standalone-page">
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
      <Suspense fallback={<RouteFallback />}>
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
          <Route
            path="/programs/:programId/:version"
            element={<ProgramDetailPage store={store} />}
          />
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
      </Suspense>
      <ActionFeedback store={store} />
    </AppShell>
  );
}
