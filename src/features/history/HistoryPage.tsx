import { Link } from 'react-router-dom';
import { allSetLogs, observedFrequency } from '../../domain/history/history';
import type { AppStore } from '../../domain/state/appStore';
import { formatLoad } from '../../domain/units/load';

export function HistoryPage({ store }: { store: AppStore }) {
  const sets = allSetLogs(store.data.sessionLogs);
  const exerciseIds = [...new Set(sets.map((setLog) => setLog.exerciseId))].sort();
  const activeProgram = store.data.activeProgram
    ? store.data.programs.find(
        ({ program }) =>
          program.programId === store.data.activeProgram?.programId &&
          program.version === store.data.activeProgram.version,
      )?.program
    : null;
  const exerciseName = (exerciseId: string) =>
    activeProgram?.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.name ??
    [...store.data.programs]
      .reverse()
      .flatMap(({ program }) => program.exercises)
      .find((exercise) => exercise.exerciseId === exerciseId)?.name ??
    exerciseId;
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">History</p>
        <h1>What happened, without a verdict.</h1>
        <p className="muted">
          Observed frequency counts training dates, not sets. Targets are shown only as authored
          context.
        </p>
      </header>
      {exerciseIds.length === 0 ? (
        <div className="empty-state">
          <h2>No training history yet</h2>
          <p className="muted">Confirmed sets will appear here across every program and version.</p>
          <Link className="button button-primary" to="/">
            Start from Today
          </Link>
        </div>
      ) : (
        <div className="history-grid">
          {exerciseIds.map((exerciseId) => {
            const history = sets
              .filter((setLog) => setLog.exerciseId === exerciseId)
              .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt));
            const latest = history[0];
            const target = activeProgram?.frequencyTargets?.find(
              (item) => item.exerciseId === exerciseId,
            )?.perWeek;
            return (
              <Link className="history-link" to={`/history/${exerciseId}`} key={exerciseId}>
                <div>
                  <h2>{exerciseName(exerciseId)}</h2>
                  <p className="exercise-id">{exerciseId}</p>
                </div>
                {latest ? (
                  <p>
                    Last:{' '}
                    <strong>
                      {formatLoad(latest.weight)} × {latest.reps}
                    </strong>
                    <br />
                    <span className="muted">{new Date(latest.loggedAt).toLocaleDateString()}</span>
                  </p>
                ) : null}
                <div className="stat-row">
                  <div className="stat">
                    <span className="stat-value">
                      {observedFrequency(sets, exerciseId, store.now(), 7, store.timezone())}
                    </span>
                    <span className="stat-label">past 7 days</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {observedFrequency(sets, exerciseId, store.now(), 14, store.timezone())}
                    </span>
                    <span className="stat-label">past 14 days</span>
                  </div>
                  {target === undefined ? null : (
                    <div className="stat">
                      <span className="stat-value">{target}</span>
                      <span className="stat-label">declared / week</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
