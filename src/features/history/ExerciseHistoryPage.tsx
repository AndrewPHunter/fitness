import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { SetLog } from '../../domain/program/types';
import type { AppStore } from '../../domain/state/appStore';
import { formatLoad } from '../../domain/units/load';
import { Button } from '../../ui/atoms/Button';
import { Input } from '../../ui/atoms/Input';
import { FormField } from '../../ui/molecules/FormField';
import { ConfirmDialog } from '../../ui/organisms/ConfirmDialog';

interface LocatedSet {
  setLog: SetLog;
  sessionLogId: string;
  programId: string;
  version: number;
  sessionId: string;
}

interface SessionGroup {
  sessionLogId: string;
  programId: string;
  version: number;
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  rows: LocatedSet[];
}

export function ExerciseHistoryPage({ store }: { store: AppStore }) {
  const { exerciseId = '' } = useParams();
  const [editing, setEditing] = useState<LocatedSet | null>(null);
  const [deleting, setDeleting] = useState<LocatedSet | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [inputError, setInputError] = useState('');
  const groups: SessionGroup[] = store.data.sessionLogs
    .map((sessionLog) => ({
      sessionLogId: sessionLog.sessionLogId,
      programId: sessionLog.programId,
      version: sessionLog.programVersion,
      sessionId: sessionLog.sessionId,
      startedAt: sessionLog.startedAt,
      completedAt: sessionLog.completedAt,
      rows: sessionLog.setLogs
        .filter((setLog) => setLog.exerciseId === exerciseId)
        .sort((left, right) => {
          const index = left.setIndex - right.setIndex;
          return index === 0 ? left.loggedAt.localeCompare(right.loggedAt) : index;
        })
        .map((setLog) => ({
          setLog,
          sessionLogId: sessionLog.sessionLogId,
          programId: sessionLog.programId,
          version: sessionLog.programVersion,
          sessionId: sessionLog.sessionId,
        })),
    }))
    .filter((group) => group.rows.length > 0)
    .sort((left, right) => {
      const time = right.startedAt.localeCompare(left.startedAt);
      return time === 0 ? right.sessionLogId.localeCompare(left.sessionLogId) : time;
    });
  const definition = [...store.data.programs]
    .reverse()
    .flatMap(({ program }) => program.exercises)
    .find((exercise) => exercise.exerciseId === exerciseId);
  const beginEdit = (row: LocatedSet) => {
    setEditing(row);
    setWeight(String(row.setLog.weight.value));
    setReps(String(row.setLog.reps));
    setRpe(row.setLog.rpe === null ? '' : String(row.setLog.rpe));
    setInputError('');
  };
  const save = () => {
    if (!editing) return;
    const weightValue = Number(weight);
    const repsValue = Number(reps);
    const rpeValue = rpe === '' ? null : Number(rpe);
    if (
      !(weightValue > 0) ||
      !Number.isInteger(repsValue) ||
      repsValue < 0 ||
      (rpeValue !== null &&
        (!(rpeValue >= 1 && rpeValue <= 10) || rpeValue * 2 !== Math.round(rpeValue * 2)))
    ) {
      store.clearMessages();
      setInputError(
        'Enter a weight above 0, whole-number reps of 0 or more, and optional RPE from 1–10 in 0.5 steps.',
      );
      return;
    }
    const result = store.updateSet(
      editing.sessionLogId,
      editing.setLog.setLogId,
      { value: weightValue, unit: editing.setLog.weight.unit },
      repsValue,
      rpeValue,
    );
    if (result.ok) setEditing(null);
    else setInputError(result.detail);
  };
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Exercise history</p>
        <h1>{definition?.name ?? exerciseId}</h1>
        <p className="exercise-id">{exerciseId}</p>
      </header>
      {groups.length === 0 ? (
        <div className="empty-state">
          <h2>No sets found</h2>
          <p className="muted">This exercise has no logged history on this device.</p>
          <Link className="button button-primary" to="/history">
            Back to history
          </Link>
        </div>
      ) : (
        <section className="stack" aria-label={`${definition?.name ?? exerciseId} workouts`}>
          {groups.map((group) => {
            const program = store.data.programs.find(
              ({ program: candidate }) =>
                candidate.programId === group.programId && candidate.version === group.version,
            )?.program;
            const sessionName =
              program?.sessions.find((session) => session.sessionId === group.sessionId)?.name ??
              group.sessionId;
            return (
              <article className="surface exercise-session" key={group.sessionLogId}>
                <header className="exercise-session-heading">
                  <div>
                    <p className="eyebrow">
                      {new Date(group.startedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <h2>{sessionName}</h2>
                    <p className="muted">
                      {program?.name ?? group.programId} · v{group.version}
                    </p>
                  </div>
                  <span className="badge">
                    {group.completedAt === null ? 'In progress' : `${group.rows.length} sets`}
                  </span>
                </header>
                <ol className="exercise-history-sets">
                  {group.rows.map((row) => (
                    <li key={row.setLog.setLogId}>
                      <div className="history-set-row">
                        <span>Set {row.setLog.setIndex + 1}</span>
                        <strong>
                          {formatLoad(row.setLog.weight)} × {row.setLog.reps}
                        </strong>
                        <span>{row.setLog.rpe === null ? 'RPE —' : `RPE ${row.setLog.rpe}`}</span>
                        <div className="history-set-actions">
                          <Button variant="secondary" onClick={() => beginEdit(row)}>
                            Edit set
                          </Button>
                          <Button variant="ghost" onClick={() => setDeleting(row)}>
                            Delete set
                          </Button>
                        </div>
                      </div>
                      {editing?.setLog.setLogId === row.setLog.setLogId ? (
                        <div className="surface-quiet stack history-set-editor">
                          <h3>Correct logged set</h3>
                          <div className="actual-fields">
                            <FormField
                              label={`Weight (${row.setLog.weight.unit})`}
                              htmlFor={`history-weight-${row.setLog.setLogId}`}
                            >
                              <Input
                                id={`history-weight-${row.setLog.setLogId}`}
                                inputMode="decimal"
                                type="number"
                                value={weight}
                                onChange={(event) => setWeight(event.target.value)}
                              />
                            </FormField>
                            <FormField label="Reps" htmlFor={`history-reps-${row.setLog.setLogId}`}>
                              <Input
                                id={`history-reps-${row.setLog.setLogId}`}
                                inputMode="decimal"
                                type="number"
                                value={reps}
                                onChange={(event) => setReps(event.target.value)}
                              />
                            </FormField>
                            <FormField label="RPE" htmlFor={`history-rpe-${row.setLog.setLogId}`}>
                              <Input
                                id={`history-rpe-${row.setLog.setLogId}`}
                                inputMode="decimal"
                                type="number"
                                value={rpe}
                                onChange={(event) => setRpe(event.target.value)}
                              />
                            </FormField>
                          </div>
                          <div className="cluster">
                            <Button onClick={save}>Save changes</Button>
                            <Button variant="ghost" onClick={() => setEditing(null)}>
                              Cancel
                            </Button>
                          </div>
                          {inputError ? (
                            <p className="error-code" role="alert">
                              {inputError}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </section>
      )}
      {deleting ? (
        <ConfirmDialog
          destructive
          title="Delete this logged set?"
          description={`This permanently removes ${formatLoad(deleting.setLog.weight)} × ${deleting.setLog.reps} for ${definition?.name ?? exerciseId}, logged ${new Date(deleting.setLog.loggedAt).toLocaleString()}. No other history will change.`}
          confirmLabel="Delete this set"
          onConfirm={() => {
            const result = store.deleteSet(deleting.sessionLogId, deleting.setLog.setLogId);
            if (result.ok) setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </main>
  );
}
