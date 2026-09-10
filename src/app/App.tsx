import { useEffect, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DataPage } from '../features/data/DataPage';
import { AuthorPage } from '../features/authoring/AuthorPage';
import { ExerciseHistoryPage } from '../features/history/ExerciseHistoryPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { ProgramDetailPage } from '../features/programs/ProgramDetailPage';
import { ProgramsPage } from '../features/programs/ProgramsPage';
import { ActiveSessionPage } from '../features/session/ActiveSessionPage';
import { TodayPage } from '../features/session/TodayPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { downloadText } from '../platform/files/files';
import { createBrowserClipboardAdapter } from '../platform/clipboard/browserClipboardAdapter';
import { applyTheme } from '../platform/theme/applyTheme';
import { Button } from '../ui/atoms/Button';
import { AppShell } from '../ui/templates/AppShell';
import { usePersistedStore } from './PersistedProvider';

export function App() {
  const { store, fatal } = usePersistedStore();
  const clipboard = useMemo(() => createBrowserClipboardAdapter(), []);
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
        <Route path="/settings" element={<SettingsPage store={store} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <div className="visually-hidden" aria-live="polite">
        {store.notice}
      </div>
      {store.failure ? (
        <aside className="global-alert" role="alert">
          <strong>Save failed</strong>
          <p>{store.failure}</p>
          <div className="cluster">
            <a className="button button-secondary" href="#/data">
              Open Data & backup
            </a>
            <Button variant="ghost" onClick={store.clearMessages}>
              Dismiss
            </Button>
          </div>
        </aside>
      ) : null}
    </AppShell>
  );
}
