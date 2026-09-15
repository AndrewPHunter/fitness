import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allSetLogs, lastLoggedWeight, prefillWeight } from '../../domain/history/history';
import { entrySetCount, isPerSetEntry, prescribedReps } from '../../domain/program/prescription';
import type { Load, SetLog } from '../../domain/program/types';
import { plannedSetKey, plannedSets, type PlannedSet } from '../../domain/session/plannedSets';
import type { AppStore } from '../../domain/state/appStore';
import { formatLoad } from '../../domain/units/load';
import { Button } from '../../ui/atoms/Button';
import { Input } from '../../ui/atoms/Input';
import { FormField } from '../../ui/molecules/FormField';
import { ConfirmDialog } from '../../ui/organisms/ConfirmDialog';

function validRpe(value: string): boolean {
  if (value === '') return true;
  const number = Number(value);
  return number >= 1 && number <= 10 && number * 2 === Math.round(number * 2);
}

function SetLogger({
  task,
  exerciseName,
  store,
  sessionLogId,
}: {
  task: PlannedSet;
  exerciseName: string;
  store: AppStore;
  sessionLogId: string;
}) {
  const historyWeight = lastLoggedWeight(allSetLogs(store.data.sessionLogs), task.entry.exerciseId);
  const prefill = prefillWeight(
    allSetLogs(store.data.sessionLogs),
    task.entry.exerciseId,
    task.prescription.targetWeight,
  );
  const [weight, setWeight] = useState(prefill ? String(prefill.value) : '');
  const [unit, setUnit] = useState<Load['unit']>(prefill?.unit ?? store.data.settings.defaultUnit);
  const [reps, setReps] = useState(String(task.prescription.reps));
  const [rpe, setRpe] = useState('');
  const [touched, setTouched] = useState(false);
  const [inputError, setInputError] = useState('');

  const confirm = () => {
    const weightNumber = Number(weight);
    const repsNumber = Number(reps);
    if (!(weightNumber > 0) || !Number.isInteger(repsNumber) || repsNumber < 0 || !validRpe(rpe)) {
      store.clearMessages();
      setInputError(
        'Enter a weight above 0, whole-number reps of 0 or more, and optional RPE from 1–10 in 0.5 steps.',
      );
      return;
    }
    const result = store.logSet({
      sessionLogId,
      exerciseId: task.entry.exerciseId,
      blockIndex: task.blockIndex,
      entryIndex: task.entryIndex,
      setIndex: task.setIndex,
      weight: { value: weightNumber, unit },
      reps: repsNumber,
      rpe: rpe === '' ? null : Number(rpe),
    });
    if (!result.ok) setInputError(result.detail);
  };

  return (
    <section className="current-set">
      <div className="set-marker">
        <span className="set-number">{task.setIndex + 1}</span>
        <div>
          <p className="eyebrow">
            {task.isSuperset
              ? `Superset · movement ${task.entryIndex + 1}`
              : `Block ${task.blockIndex + 1}`}
          </p>
          <h2>{exerciseName}</h2>
          {isPerSetEntry(task.entry) && task.entry.notes ? (
            <p className="muted">{task.entry.notes}</p>
          ) : null}
        </div>
      </div>
      <div className="prescribed-band">
        <p className="eyebrow">Prescribed — reference only</p>
        <div className="cluster">
          <strong>
            Set {task.setIndex + 1} of {entrySetCount(task.entry)} ·{' '}
            {prescribedReps(task.prescription)} reps
          </strong>
          {task.prescription.targetWeight ? (
            <span>· {formatLoad(task.prescription.targetWeight)}</span>
          ) : null}
          {task.prescription.targetRpe !== undefined ? (
            <span>· RPE {task.prescription.targetRpe}</span>
          ) : null}
          {isPerSetEntry(task.entry) && task.prescription.restSeconds !== undefined ? (
            <span>· Rest {task.prescription.restSeconds}s</span>
          ) : null}
        </div>
        {isPerSetEntry(task.entry) && task.prescription.notes ? (
          <p>{task.prescription.notes}</p>
        ) : null}
      </div>
      <div className="stack actual-heading">
        <div className="spread">
          <p className="eyebrow">Actual — your set</p>
          <p className="unconfirmed-marker">
            <span className="state-symbol" aria-hidden="true">
              ○
            </span>
            Not saved
          </p>
        </div>
        {prefill && !touched ? (
          <p className="prefill-note">
            Dashed weight is a {historyWeight ? 'last logged' : 'prescribed'} prefill. Confirm it
            with Log set.
          </p>
        ) : null}
      </div>
      {inputError ? (
        <p role="alert" className="action-feedback action-feedback-failure">
          <span className="state-symbol" aria-hidden="true">
            !
          </span>
          Set not saved. {inputError}
        </p>
      ) : null}
      <Button wide onClick={confirm}>
        Log set
      </Button>
      <div className={`actual-fields${prefill && !touched ? ' prefilled' : ''}`}>
        <FormField label={`Weight (${unit})`} htmlFor="actual-weight">
          <Input
            id="actual-weight"
            inputMode="decimal"
            type="number"
            min="0"
            step="any"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value);
              setTouched(true);
            }}
          />
        </FormField>
        <FormField label="Reps" htmlFor="actual-reps">
          <Input
            id="actual-reps"
            inputMode="decimal"
            type="number"
            min="0"
            step="1"
            value={reps}
            onChange={(event) => {
              setReps(event.target.value);
              setTouched(true);
            }}
          />
        </FormField>
        <FormField label="RPE" htmlFor="actual-rpe" hint="Optional">
          <Input
            id="actual-rpe"
            inputMode="decimal"
            type="number"
            min="1"
            max="10"
            step="0.5"
            value={rpe}
            onChange={(event) => {
              setRpe(event.target.value);
              setTouched(true);
            }}
          />
        </FormField>
      </div>
      <div className="cluster">
        <label className="field-label" htmlFor="actual-unit">
          Recorded unit
        </label>
        <select
          id="actual-unit"
          className="select"
          style={{ width: 'auto' }}
          value={unit}
          onChange={(event) => {
            const nextUnit = event.target.value;
            if (nextUnit === 'kg' || nextUnit === 'lb') setUnit(nextUnit);
            setTouched(true);
          }}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </div>
    </section>
  );
}

function LoggedSetEditor({
  setLog,
  sessionLogId,
  store,
  onDone,
}: {
  setLog: SetLog;
  sessionLogId: string;
  store: AppStore;
  onDone(): void;
}) {
  const [weight, setWeight] = useState(String(setLog.weight.value));
  const [reps, setReps] = useState(String(setLog.reps));
  const [rpe, setRpe] = useState(setLog.rpe === null ? '' : String(setLog.rpe));
  const [inputError, setInputError] = useState('');
  return (
    <div className="surface stack">
      <h3>Correct logged set</h3>
      <div className="actual-fields">
        <FormField
          label={`Weight (${setLog.weight.unit})`}
          htmlFor={`edit-weight-${setLog.setLogId}`}
        >
          <Input
            id={`edit-weight-${setLog.setLogId}`}
            inputMode="decimal"
            type="number"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </FormField>
        <FormField label="Reps" htmlFor={`edit-reps-${setLog.setLogId}`}>
          <Input
            id={`edit-reps-${setLog.setLogId}`}
            inputMode="decimal"
            type="number"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
          />
        </FormField>
        <FormField label="RPE" htmlFor={`edit-rpe-${setLog.setLogId}`}>
          <Input
            id={`edit-rpe-${setLog.setLogId}`}
            inputMode="decimal"
            type="number"
            value={rpe}
            onChange={(event) => setRpe(event.target.value)}
          />
        </FormField>
      </div>
      <div className="cluster">
        <Button
          onClick={() => {
            const weightValue = Number(weight);
            const repsValue = Number(reps);
            if (
              !(weightValue > 0) ||
              !Number.isInteger(repsValue) ||
              repsValue < 0 ||
              !validRpe(rpe)
            ) {
              store.clearMessages();
              setInputError(
                'Enter a weight above 0, whole-number reps of 0 or more, and optional RPE from 1–10 in 0.5 steps.',
              );
              return;
            }
            const result = store.updateSet(
              sessionLogId,
              setLog.setLogId,
              { value: weightValue, unit: setLog.weight.unit },
              repsValue,
              rpe === '' ? null : Number(rpe),
            );
            if (result.ok) onDone();
            else setInputError(result.detail);
          }}
        >
          Save correction
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {inputError ? (
        <p role="alert" className="error-code">
          {inputError}
        </p>
      ) : null}
    </div>
  );
}

export function ActiveSessionPage({ store }: { store: AppStore }) {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const log = store.activeSession();
  if (!log)
    return (
      <main className="page">
        <div className="empty-state">
          <h1>No session in progress</h1>
          <p className="muted">Start the next session from Today.</p>
          <Link className="button button-primary" to="/">
            Go to Today
          </Link>
        </div>
      </main>
    );
  const program = store.data.programs.find(
    ({ program: candidate }) =>
      candidate.programId === log.programId && candidate.version === log.programVersion,
  )?.program;
  const session = program?.sessions.find((candidate) => candidate.sessionId === log.sessionId);
  if (!program || !session)
    return (
      <main className="page">
        <div className="error-panel" role="alert">
          <h1>Session prescription is missing</h1>
          <p>
            The saved workout references data that cannot be found. Export your data before making
            changes.
          </p>
        </div>
      </main>
    );
  const plan = plannedSets(session);
  const loggedKeys = new Set(log.setLogs.map(plannedSetKey));
  const current = plan.find((task) => !loggedKeys.has(plannedSetKey(task)));
  const progress = plan.length === 0 ? 0 : (log.setLogs.length / plan.length) * 100;
  const complete = () => {
    const result = store.completeSession(log.sessionLogId);
    if (result.ok) navigate('/', { state: { preserveFeedback: true } });
  };
  const leaveOrDiscard = () => {
    if (log.setLogs.length === 0) {
      const result = store.discardSession(log.sessionLogId);
      if (result.ok) navigate('/', { state: { preserveFeedback: true } });
      return;
    }
    store.announce(
      `${session.name} left open · ${log.setLogs.length} logged set${log.setLogs.length === 1 ? '' : 's'} kept.`,
    );
    navigate('/', { state: { preserveFeedback: true } });
  };
  return (
    <main className="page">
      <header className="page-header">
        <div className="spread">
          <div>
            <p className="eyebrow">
              Active session · {log.setLogs.length}/{plan.length} sets
            </p>
            <h1>{session.name}</h1>
          </div>
          <Button
            variant={log.setLogs.length === 0 ? 'danger' : 'ghost'}
            onClick={() => setLeaving(true)}
          >
            {log.setLogs.length === 0 ? 'Discard' : 'Leave'}
          </Button>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Session progress"
          aria-valuenow={log.setLogs.length}
          aria-valuemin={0}
          aria-valuemax={plan.length}
        >
          <div className="progress-fill" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </header>
      <div className="active-layout">
        <div>
          {current ? (
            <SetLogger
              key={plannedSetKey(current)}
              task={current}
              exerciseName={
                program.exercises.find(
                  (exercise) => exercise.exerciseId === current.entry.exerciseId,
                )?.name ?? current.entry.exerciseId
              }
              store={store}
              sessionLogId={log.sessionLogId}
            />
          ) : (
            <section className="current-set">
              <p className="eyebrow">All prescribed sets logged</p>
              <h2>Session ready to complete</h2>
              <p className="muted">
                Review corrections below, then mark the session complete to advance the rotation.
              </p>
              <Button wide onClick={complete}>
                Complete session
              </Button>
            </section>
          )}
        </div>
        <aside className="stack">
          <h2>Saved sets</h2>
          {log.setLogs.length === 0 ? (
            <div className="empty-state">
              <p>No sets confirmed yet. Prefilled inputs are not saved automatically.</p>
            </div>
          ) : (
            <div className="logged-list">
              {log.setLogs.map((setLog) => (
                <div key={setLog.setLogId}>
                  {editing === setLog.setLogId ? (
                    <LoggedSetEditor
                      setLog={setLog}
                      sessionLogId={log.sessionLogId}
                      store={store}
                      onDone={() => setEditing(null)}
                    />
                  ) : (
                    <div className="logged-row">
                      <div>
                        <p className="saved-marker">
                          <span className="state-symbol" aria-hidden="true">
                            ✓
                          </span>
                          Saved
                        </p>
                        <strong>
                          {
                            program.exercises.find(
                              (exercise) => exercise.exerciseId === setLog.exerciseId,
                            )?.name
                          }
                        </strong>
                        <p className="muted">
                          {formatLoad(setLog.weight)} × {setLog.reps}
                          {setLog.rpe === null ? '' : ` · RPE ${setLog.rpe}`}
                        </p>
                      </div>
                      <button className="text-button" onClick={() => setEditing(setLog.setLogId)}>
                        Correct
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
      {leaving ? (
        <ConfirmDialog
          destructive={log.setLogs.length === 0}
          title={log.setLogs.length === 0 ? `Discard ${session.name}?` : 'Leave this session open?'}
          description={
            log.setLogs.length === 0
              ? 'No sets have been logged. This removes the empty session and does not advance the program rotation.'
              : `All ${log.setLogs.length} confirmed sets will stay saved. The session will remain in progress and Today will offer Resume; the rotation will not advance.`
          }
          confirmLabel={log.setLogs.length === 0 ? 'Discard empty session' : 'Leave and keep sets'}
          onConfirm={leaveOrDiscard}
          onCancel={() => setLeaving(false)}
        />
      ) : null}
    </main>
  );
}
