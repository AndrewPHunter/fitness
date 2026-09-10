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

export function ExerciseHistoryPage({ store }: { store: AppStore }) {
  const { exerciseId = '' } = useParams();
  const [editing, setEditing] = useState<LocatedSet | null>(null);
  const [deleting, setDeleting] = useState<LocatedSet | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [inputError, setInputError] = useState('');
  const rows: LocatedSet[] = store.data.sessionLogs
    .flatMap((sessionLog) =>
      sessionLog.setLogs
        .filter((setLog) => setLog.exerciseId === exerciseId)
        .map((setLog) => ({
          setLog,
          sessionLogId: sessionLog.sessionLogId,
          programId: sessionLog.programId,
          version: sessionLog.programVersion,
          sessionId: sessionLog.sessionId,
        })),
    )
    .sort((left, right) => right.setLog.loggedAt.localeCompare(left.setLog.loggedAt));
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
      {rows.length === 0 ? (
        <div className="empty-state">
          <h2>No sets found</h2>
          <p className="muted">This exercise has no logged history on this device.</p>
          <Link className="button button-primary" to="/history">
            Back to history
          </Link>
        </div>
      ) : (
        <section className="stack">
          {rows.map((row) => {
            const program = store.data.programs.find(
              ({ program: candidate }) =>
                candidate.programId === row.programId && candidate.version === row.version,
            )?.program;
            const sessionName =
              program?.sessions.find((session) => session.sessionId === row.sessionId)?.name ??
              row.sessionId;
            return (
              <article className="surface stack" key={row.setLog.setLogId}>
                <div className="spread">
                  <div>
                    <h2>
                      {formatLoad(row.setLog.weight)} × {row.setLog.reps}
                    </h2>
                    <p className="muted">
                      {row.setLog.rpe === null ? 'RPE not recorded' : `RPE ${row.setLog.rpe}`} ·{' '}
                      {new Date(row.setLog.loggedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="badge">Set {row.setLog.setIndex + 1}</span>
                </div>
                <p>
                  <strong>
                    {program?.name ?? row.programId} v{row.version}
                  </strong>
                  <br />
                  <span className="muted">{sessionName}</span>
                </p>
                <div className="cluster">
                  <Button variant="secondary" onClick={() => beginEdit(row)}>
                    Edit set
                  </Button>
                  <Button variant="ghost" onClick={() => setDeleting(row)}>
                    Delete set
                  </Button>
                </div>
                {editing?.setLog.setLogId === row.setLog.setLogId ? (
                  <div className="surface-quiet stack">
                    <h3>Edit actual values</h3>
                    <div className="actual-fields">
                      <FormField
                        label={`Weight (${row.setLog.weight.unit})`}
                        htmlFor="history-weight"
                      >
                        <Input
                          id="history-weight"
                          inputMode="decimal"
                          type="number"
                          value={weight}
                          onChange={(event) => setWeight(event.target.value)}
                        />
                      </FormField>
                      <FormField label="Reps" htmlFor="history-reps">
                        <Input
                          id="history-reps"
                          inputMode="decimal"
                          type="number"
                          value={reps}
                          onChange={(event) => setReps(event.target.value)}
                        />
                      </FormField>
                      <FormField label="RPE" htmlFor="history-rpe">
                        <Input
                          id="history-rpe"
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
