import { useState } from 'react';
import { Link } from 'react-router-dom';
import { allSetLogs, observedFrequency } from '../../domain/history/history';
import type { Program, Session, SessionLog } from '../../domain/program/types';
import { plannedEntryKey } from '../../domain/session/plannedSets';
import type { AppStore } from '../../domain/state/appStore';
import { formatLoad } from '../../domain/units/load';
import { Button } from '../../ui/atoms/Button';

function sessionDate(sessionLog: SessionLog): string {
  return new Date(sessionLog.startedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function WorkoutRecord({
  sessionLog,
  program,
  session,
  latest,
}: {
  sessionLog: SessionLog;
  program: Program;
  session: Session;
  latest: boolean;
}) {
  const positions = session.blocks.flatMap((block, blockIndex) =>
    block.type === 'single'
      ? [{ blockIndex, entryIndex: 0, exerciseId: block.entry.exerciseId }]
      : block.entries.map((entry, entryIndex) => ({
          blockIndex,
          entryIndex,
          exerciseId: entry.exerciseId,
        })),
  );
  const exerciseName = (exerciseId: string) =>
    program.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.name ?? exerciseId;
  const representedKeys = new Set([
    ...sessionLog.setLogs.map(plannedEntryKey),
    ...sessionLog.skippedExercises.map(plannedEntryKey),
  ]);
  const represented = positions.filter((position) =>
    representedKeys.has(plannedEntryKey(position)),
  );

  return (
    <details className="workout-record" open={latest}>
      <summary>
        <span className="workout-date">{sessionDate(sessionLog)}</span>
        <span className="workout-summary-main">
          <h2>{session.name}</h2>
          <small>
            {program.name} · v{program.version}
          </small>
        </span>
        <span className="workout-status">
          {sessionLog.completedAt === null ? 'In progress' : 'Complete'}
        </span>
      </summary>
      <div className="workout-record-body">
        <p className="muted">
          {sessionLog.setLogs.length} set{sessionLog.setLogs.length === 1 ? '' : 's'} logged
          {sessionLog.skippedExercises.length > 0
            ? ` · ${sessionLog.skippedExercises.length} exercise${sessionLog.skippedExercises.length === 1 ? '' : 's'} skipped`
            : ''}
        </p>
        {represented.length === 0 ? (
          <p>No exercise outcomes were recorded for this workout.</p>
        ) : (
          <div className="workout-movement-groups">
            {represented.map((position) => {
              const key = plannedEntryKey(position);
              const sets = sessionLog.setLogs
                .filter((setLog) => plannedEntryKey(setLog) === key)
                .sort((left, right) => left.setIndex - right.setIndex);
              const skipped = sessionLog.skippedExercises.some(
                (entry) => plannedEntryKey(entry) === key,
              );
              return (
                <section className="workout-movement" key={key}>
                  <div className="spread">
                    <h3>
                      <Link to={`/history/${position.exerciseId}`}>
                        {exerciseName(position.exerciseId)}
                      </Link>
                    </h3>
                    {skipped ? <span className="badge">Skipped</span> : null}
                  </div>
                  {sets.length > 0 ? (
                    <ol
                      className="set-table"
                      aria-label={`${exerciseName(position.exerciseId)} sets`}
                    >
                      {sets.map((setLog) => (
                        <li key={setLog.setLogId}>
                          <span>Set {setLog.setIndex + 1}</span>
                          <strong>
                            {formatLoad(setLog.weight)} × {setLog.reps}
                          </strong>
                          <span>{setLog.rpe === null ? 'RPE —' : `RPE ${setLog.rpe}`}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="muted">No sets logged · skipped for this workout</p>
                  )}
                </section>
              );
            })}
          </div>
        )}
        {sessionLog.completedAt === null ? (
          <Link className="button button-primary" to="/session/active">
            Resume workout
          </Link>
        ) : null}
      </div>
    </details>
  );
}

export function HistoryPage({ store }: { store: AppStore }) {
  const [view, setView] = useState<'workouts' | 'exercises'>('workouts');
  const sets = allSetLogs(store.data.sessionLogs);
  const exerciseIds = [...new Set(sets.map((setLog) => setLog.exerciseId))].sort();
  const workouts = [...store.data.sessionLogs].sort((left, right) => {
    const time = right.startedAt.localeCompare(left.startedAt);
    return time === 0 ? right.sessionLogId.localeCompare(left.sessionLogId) : time;
  });
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
        <h1>Your training, session by session.</h1>
        <p className="muted">
          Review whole workouts or follow one exercise across programs. Nothing here grades the
          work.
        </p>
      </header>
      <div className="history-view-switch" aria-label="History view">
        <Button
          variant={view === 'workouts' ? 'primary' : 'ghost'}
          aria-pressed={view === 'workouts'}
          onClick={() => setView('workouts')}
        >
          Workouts
        </Button>
        <Button
          variant={view === 'exercises' ? 'primary' : 'ghost'}
          aria-pressed={view === 'exercises'}
          onClick={() => setView('exercises')}
        >
          Exercises
        </Button>
      </div>
      {view === 'workouts' ? (
        workouts.length === 0 ? (
          <div className="empty-state">
            <h2>No workouts recorded yet</h2>
            <p className="muted">Start a session and its logged sets will stay grouped here.</p>
            <Link className="button button-primary" to="/">
              Start from Today
            </Link>
          </div>
        ) : (
          <section className="stack" aria-label="Workout history">
            {workouts.map((sessionLog, index) => {
              const program = store.data.programs.find(
                ({ program: candidate }) =>
                  candidate.programId === sessionLog.programId &&
                  candidate.version === sessionLog.programVersion,
              )?.program;
              const session = program?.sessions.find(
                (candidate) => candidate.sessionId === sessionLog.sessionId,
              );
              return program && session ? (
                <WorkoutRecord
                  key={sessionLog.sessionLogId}
                  sessionLog={sessionLog}
                  program={program}
                  session={session}
                  latest={index === 0}
                />
              ) : null;
            })}
          </section>
        )
      ) : exerciseIds.length === 0 ? (
        <div className="empty-state">
          <h2>No exercise history yet</h2>
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
                  <p
                    aria-label={`Last: ${formatLoad(latest.weight)} × ${latest.reps}, ${new Date(latest.loggedAt).toLocaleDateString()}`}
                  >
                    <span aria-hidden="true">
                      Last:{' '}
                      <strong>
                        {formatLoad(latest.weight)} × {latest.reps}
                      </strong>
                      <br />
                      <span className="muted">
                        {new Date(latest.loggedAt).toLocaleDateString()}
                      </span>
                    </span>
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
