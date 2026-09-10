import { useState, type ChangeEvent } from 'react';
import { toCsv } from '../../domain/export/toCsv';
import { fromExportJson, toExportJson } from '../../domain/export/jsonExport';
import type { ExportDocument, ValidationError } from '../../domain/program/types';
import type { AppStore } from '../../domain/state/appStore';
import { downloadText, readTextFile } from '../../platform/files/files';
import { Button } from '../../ui/atoms/Button';
import { ErrorPanel } from '../../ui/organisms/ErrorPanel';
import { ConfirmDialog } from '../../ui/organisms/ConfirmDialog';

function counts(store: AppStore): { programs: number; sessions: number; sets: number } {
  return {
    programs: store.data.programs.length,
    sessions: store.data.sessionLogs.length,
    sets: store.data.sessionLogs.reduce((total, log) => total + log.setLogs.length, 0),
  };
}

export function DataPage({ store }: { store: AppStore }) {
  const [backup, setBackup] = useState<ExportDocument | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [replaceConfirm, setReplaceConfirm] = useState(false);
  const usage = store.usageBytes();
  const budget = 5 * 1024 * 1024;
  const currentCounts = counts(store);

  const exportJson = () => {
    try {
      const now = store.now();
      downloadText(
        toExportJson(store.data, now),
        `fitness-export-${now.slice(0, 10)}.json`,
        'application/json',
      );
    } catch (error: unknown) {
      setErrors([
        {
          layer: 'storage',
          code: 'JSON_EXPORT_FAILED',
          path: '',
          message:
            error instanceof Error ? error.message : 'The browser could not create the backup.',
        },
      ]);
    }
  };
  const exportCsv = () => {
    try {
      downloadText(
        toCsv(store.data),
        `fitness-history-${store.now().slice(0, 10)}.csv`,
        'text/csv;charset=utf-8',
      );
    } catch (error: unknown) {
      setErrors([
        {
          layer: 'storage',
          code: 'CSV_EXPORT_FAILED',
          path: '',
          message:
            error instanceof Error
              ? error.message
              : 'Historical prescription could not be resolved.',
        },
      ]);
    }
  };
  const chooseBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBackup(null);
    setErrors([]);
    setConflicts([]);
    try {
      const result = fromExportJson(await readTextFile(file));
      if (result.ok) setBackup(result.document);
      else setErrors(result.errors);
    } catch (error: unknown) {
      setErrors([
        {
          layer: 'structural',
          code: 'FILE_READ_ERROR',
          path: '',
          message: `The backup could not be read. ${error instanceof Error ? error.message : ''}`,
        },
      ]);
    }
  };
  const merge = () => {
    if (!backup) return;
    const result = store.mergeData(backup.data);
    if (result.conflicts.length > 0) setConflicts(result.conflicts);
    else if (result.result.ok) setBackup(null);
  };
  const replace = () => {
    if (!backup) return;
    const result = store.replaceData(backup.data);
    if (result.ok) {
      setBackup(null);
      setReplaceConfirm(false);
    }
  };
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Data & backup</p>
        <h1>Your browser is the only vault.</h1>
        <p className="muted">
          The operating system can clear browser storage, especially when a site has not been used
          for a while. JSON export is the only backup.
        </p>
      </header>
      <section className="surface stack">
        <div>
          <h2>Export</h2>
          <p className="muted">
            JSON is complete and restorable. CSV is flattened for analysis and is not a backup.
          </p>
        </div>
        <div className="cluster">
          <Button onClick={exportJson}>Export JSON backup</Button>
          <Button variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </section>
      <section className="surface stack">
        <div>
          <h2>Restore or merge</h2>
          <p className="muted">
            Every program and history reference is validated before any write. No import mode is
            selected by default.
          </p>
        </div>
        <input
          className="input"
          id="backup-file"
          type="file"
          accept=".json,application/json"
          aria-label="Choose exported JSON backup"
          onChange={chooseBackup}
        />
        {backup ? (
          <div className="surface-quiet stack" aria-live="polite">
            <h3>Validated backup from {backup.exportedAt}</h3>
            <p>
              {backup.data.programs.length} program versions · {backup.data.sessionLogs.length}{' '}
              sessions ·{' '}
              {backup.data.sessionLogs.reduce((total, log) => total + log.setLogs.length, 0)} sets
            </p>
            <div className="cluster">
              <Button onClick={merge}>Merge</Button>
              <Button variant="danger" onClick={() => setReplaceConfirm(true)}>
                Replace current data
              </Button>
            </div>
          </div>
        ) : null}
      </section>
      {errors.length > 0 ? (
        <ErrorPanel title="File rejected — nothing was changed" errors={errors} />
      ) : null}
      {conflicts.length > 0 ? (
        <section className="error-panel" role="alert">
          <h2>Merge conflicts — nothing was changed</h2>
          <ul>
            {conflicts.map((conflict) => (
              <li key={conflict}>{conflict}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="surface stack">
        <h2>Storage diagnostics</h2>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-value">{usage.toLocaleString()}</span>
            <span className="stat-label">approx. bytes used</span>
          </div>
          <div className="stat">
            <span className="stat-value">{((usage / budget) * 100).toFixed(2)}%</span>
            <span className="stat-label">of assumed 5 MB</span>
          </div>
        </div>
        <p className="muted">
          Approximate only. Browser limits differ. If a save fails, export your history and prune
          data before retrying.
        </p>
      </section>
      <section className="surface-quiet stack">
        <h2>Keep it safer on iPhone</h2>
        <p>
          Add this app to your Home Screen: in Safari, tap Share, then “Add to Home Screen.” This
          can reduce storage eviction risk, but it does not replace regular JSON exports.
        </p>
      </section>
      {replaceConfirm && backup ? (
        <ConfirmDialog
          destructive
          title="Replace every local record?"
          description={`This removes ${currentCounts.programs} current program versions, ${currentCounts.sessions} sessions, and ${currentCounts.sets} logged sets, replacing them with the validated backup. This cannot be undone unless you export first.`}
          confirmLabel="Replace all local data"
          onConfirm={replace}
          onCancel={() => setReplaceConfirm(false)}
        />
      ) : null}
    </main>
  );
}
