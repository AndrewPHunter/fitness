import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  allSetLogs,
  lastLoggedWeight,
  prefillWeight,
  previousExerciseSession,
} from '../../domain/history/history';
import { entrySetCount, isPerSetEntry, prescribedReps } from '../../domain/program/prescription';
import type { ExerciseEntry, Load, Session, SetLog } from '../../domain/program/types';
import {
  authoredBlockOrder,
  orderedPlannedSets,
  plannedEntryKey,
  plannedSetKey,
  type PlannedSet,
} from '../../domain/session/plannedSets';
import type { AppStore, ExercisePosition } from '../../domain/state/appStore';
import { formatLoad } from '../../domain/units/load';
import { Button } from '../../ui/atoms/Button';
import { Input } from '../../ui/atoms/Input';
import { FormField } from '../../ui/molecules/FormField';
import { ConfirmDialog } from '../../ui/organisms/ConfirmDialog';
import { keepControlReachable, resetPagePosition } from '../../platform/dom/keepControlReachable';

function validRpe(value: string): boolean {
  if (value === '') return true;
  const number = Number(value);
  return number >= 1 && number <= 10 && number * 2 === Math.round(number * 2);
}

interface SessionMovement extends ExercisePosition {
  entry: ExerciseEntry;
  name: string;
  isSuperset: boolean;
}

function sessionMovements(
  session: Session,
  exerciseName: (exerciseId: string) => string,
  blockOrder: number[],
): SessionMovement[] {
  return blockOrder.flatMap<SessionMovement>((blockIndex) => {
    const block = session.blocks[blockIndex];
    if (!block) return [];
    if (block.type === 'single')
      return [
        {
          blockIndex,
          entryIndex: 0,
          exerciseId: block.entry.exerciseId,
          entry: block.entry,
          name: exerciseName(block.entry.exerciseId),
          isSuperset: false,
        },
      ];
    return block.entries.map((entry, entryIndex) => ({
      blockIndex,
      entryIndex,
      exerciseId: entry.exerciseId,
      entry,
      name: exerciseName(entry.exerciseId),
      isSuperset: true,
    }));
  });
}

function ExercisePickerDialog({
  movements,
  session,
  blockOrder,
  log,
  selectedKey,
  store,
  onSelect,
  onClose,
}: {
  movements: SessionMovement[];
  session: Session;
  blockOrder: number[];
  log: NonNullable<ReturnType<AppStore['activeSession']>>;
  selectedKey: string | null;
  store: AppStore;
  onSelect(key: string): void;
  onClose(): void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const [orderFeedback, setOrderFeedback] = useState('');
  useEffect(() => {
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = dialog.current;
    const focusable = () =>
      node
        ? [
            ...node.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]'),
          ].filter((element) => element.tabIndex >= 0)
        : [];
    const heading = node?.querySelector<HTMLElement>('#exercise-picker-title');
    if (node) node.scrollTop = 0;
    (heading ?? focusable()[0])?.focus({ preventScroll: true });
    const keepFocusInside = (event: FocusEvent) => {
      if (node && event.target instanceof Node && !node.contains(event.target)) {
        focusable()[0]?.focus();
      }
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('focusin', keepFocusInside);
    node?.addEventListener('keydown', trapTab);
    return () => {
      document.removeEventListener('focusin', keepFocusInside);
      node?.removeEventListener('keydown', trapTab);
      if (invoker?.isConnected) invoker.focus();
    };
  }, [onClose]);

  const moveBlock = (position: number, direction: -1 | 1) => {
    const destination = position + direction;
    const movedBlockIndex = blockOrder[position];
    if (movedBlockIndex === undefined || destination < 0 || destination >= blockOrder.length)
      return;
    const next = [...blockOrder];
    next.splice(position, 1);
    next.splice(destination, 0, movedBlockIndex);
    const result = store.reorderWorkout(log.sessionLogId, next, movedBlockIndex);
    if (!result.ok) return;
    const names = movements
      .filter((movement) => movement.blockIndex === movedBlockIndex)
      .map((movement) => movement.name);
    setOrderFeedback(
      `${names.join(' + ')} is now ${destination + 1} of ${blockOrder.length}. Order saved.`,
    );
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={dialog}
        className="dialog exercise-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-picker-title"
        aria-describedby="exercise-picker-description"
      >
        <div className="stack">
          <h2 id="exercise-picker-title" tabIndex={-1}>
            Choose an exercise
          </h2>
          <p id="exercise-picker-description" className="muted">
            Jump to any exercise now, or adjust the saved routine order for this workout day.
          </p>
        </div>
        <section className="routine-order-section" aria-labelledby="routine-order-title">
          <div className="stack routine-order-heading">
            <h3 id="routine-order-title">Routine order</h3>
            <p className="muted">Supersets move together and keep their round-robin order.</p>
          </div>
          <ol className="routine-order-list">
            {blockOrder.map((blockIndex, position) => {
              const block = session.blocks[blockIndex];
              const names = movements
                .filter((movement) => movement.blockIndex === blockIndex)
                .map((movement) => movement.name);
              const label = names.join(' + ');
              return (
                <li className="routine-order-item" key={blockIndex}>
                  <span className="routine-order-number" aria-hidden="true">
                    {position + 1}
                  </span>
                  <span className="routine-order-label">
                    <strong>{label}</strong>
                    <small>
                      {block?.type === 'superset' ? 'Superset block' : 'Single exercise'}
                    </small>
                  </span>
                  <span className="routine-order-controls">
                    <Button
                      variant="ghost"
                      aria-label={`Move ${label} up`}
                      disabled={position === 0}
                      onClick={() => moveBlock(position, -1)}
                    >
                      Up
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={`Move ${label} down`}
                      disabled={position === blockOrder.length - 1}
                      onClick={() => moveBlock(position, 1)}
                    >
                      Down
                    </Button>
                  </span>
                </li>
              );
            })}
          </ol>
          {orderFeedback ? (
            <p className="action-feedback action-feedback-success" aria-hidden="true">
              <span className="state-symbol">✓</span>
              {orderFeedback}
            </p>
          ) : null}
        </section>
        <div className="stack exercise-jump-heading">
          <h3>Jump to exercise</h3>
          <p className="muted">
            This changes the current exercise without changing the saved order.
          </p>
        </div>
        <div className="exercise-choice-list">
          {movements.map((movement) => {
            const key = plannedEntryKey(movement);
            const logged = log.setLogs.filter((setLog) => plannedEntryKey(setLog) === key).length;
            const skipped = log.skippedExercises.some((entry) => plannedEntryKey(entry) === key);
            const complete = logged === entrySetCount(movement.entry);
            const active = selectedKey === key;
            return (
              <div className="exercise-choice" key={key}>
                <button
                  className="exercise-choice-button"
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  disabled={complete || skipped}
                  onClick={() => onSelect(key)}
                >
                  <span>
                    <strong>{movement.name}</strong>
                    <small>
                      Block {movement.blockIndex + 1}
                      {movement.isSuperset ? ` · movement ${movement.entryIndex + 1}` : ''} ·{' '}
                      {logged} of {entrySetCount(movement.entry)} sets logged
                    </small>
                  </span>
                  <span className="choice-status">
                    {skipped ? 'Skipped' : complete ? 'Complete' : active ? 'Current' : 'Choose'}
                  </span>
                </button>
                {skipped ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const result = store.restoreExercise(log.sessionLogId, movement);
                      if (result.ok) onSelect(key);
                    }}
                  >
                    Include again
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </section>
    </div>
  );
}

function SetLogger({
  task,
  exerciseName,
  store,
  sessionLogId,
  onChooseExercise,
  onSkipExercise,
}: {
  task: PlannedSet;
  exerciseName: string;
  store: AppStore;
  sessionLogId: string;
  onChooseExercise(): void;
  onSkipExercise(): void;
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
  const logAction = useRef<HTMLDivElement>(null);
  const previous = previousExerciseSession(
    store.data.sessionLogs,
    task.entry.exerciseId,
    sessionLogId,
  );

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
    else resetPagePosition();
  };

  return (
    <section className="current-set">
      <div className="spread set-heading-row">
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
        <Button variant="ghost" className="exercise-switch" onClick={onChooseExercise}>
          Switch
        </Button>
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
      {previous ? (
        <section className="previous-workout" aria-label={`Previous ${exerciseName} workout`}>
          <div className="spread">
            <p className="eyebrow">Previous workout</p>
            <time dateTime={previous.startedAt}>
              {new Date(previous.startedAt).toLocaleDateString()}
            </time>
          </div>
          <ol className="previous-set-grid">
            {previous.sets.map((setLog, index) => (
              <li key={setLog.setLogId}>
                <span>Set {index + 1}</span>
                <strong>
                  {formatLoad(setLog.weight)} × {setLog.reps}
                </strong>
                <small>{setLog.rpe === null ? 'RPE —' : `RPE ${setLog.rpe}`}</small>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
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
      <Button className="logger-skip" variant="ghost" wide onClick={onSkipExercise}>
        Skip {exerciseName} for this workout
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
            onFocus={() => keepControlReachable(logAction.current)}
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
            onFocus={() => keepControlReachable(logAction.current)}
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
            onFocus={() => keepControlReachable(logAction.current)}
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
          onFocus={() => keepControlReachable(logAction.current)}
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
      {inputError ? (
        <p role="alert" className="action-feedback action-feedback-failure">
          <span className="state-symbol" aria-hidden="true">
            !
          </span>
          Set not saved. {inputError}
        </p>
      ) : null}
      <div className="logger-primary-action" ref={logAction}>
        <Button wide onClick={confirm}>
          Log set
        </Button>
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
  const [choosingExercise, setChoosingExercise] = useState(false);
  const [selectedMovementKey, setSelectedMovementKey] = useState<string | null>(null);
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
  const exerciseName = (exerciseId: string) =>
    program.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.name ?? exerciseId;
  const savedOrder = store.data.workoutOrders.find(
    (candidate) =>
      candidate.programId === log.programId &&
      candidate.programVersion === log.programVersion &&
      candidate.sessionId === log.sessionId,
  );
  const blockOrder = savedOrder?.blockOrder ?? authoredBlockOrder(session);
  const plan = orderedPlannedSets(session, blockOrder);
  const movements = sessionMovements(session, exerciseName, blockOrder);
  const loggedKeys = new Set(log.setLogs.map(plannedSetKey));
  const skippedKeys = new Set(log.skippedExercises.map(plannedEntryKey));
  const remaining = plan.filter(
    (task) => !loggedKeys.has(plannedSetKey(task)) && !skippedKeys.has(plannedEntryKey(task)),
  );
  const selectedCurrent = selectedMovementKey
    ? remaining.find((task) => plannedEntryKey(task) === selectedMovementKey)
    : undefined;
  const current = selectedCurrent ?? remaining[0];
  const resolvedCount = plan.filter(
    (task) => loggedKeys.has(plannedSetKey(task)) || skippedKeys.has(plannedEntryKey(task)),
  ).length;
  const progress = plan.length === 0 ? 0 : (resolvedCount / plan.length) * 100;
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
      `${session.name} left open · ${log.setLogs.length} logged set${log.setLogs.length === 1 ? '' : 's'} kept${log.skippedExercises.length > 0 ? ` · ${log.skippedExercises.length} skipped exercise${log.skippedExercises.length === 1 ? '' : 's'} kept` : ''}.`,
    );
    navigate('/', { state: { preserveFeedback: true } });
  };
  return (
    <main className="page active-session-page">
      <header className="page-header">
        <div className="spread">
          <div>
            <p className="eyebrow">
              Active session · {log.setLogs.length} logged
              {log.skippedExercises.length > 0 ? ` · ${log.skippedExercises.length} skipped` : ''}
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
          aria-valuetext={`${log.setLogs.length} sets logged and ${log.skippedExercises.length} exercises skipped`}
          aria-valuenow={resolvedCount}
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
              exerciseName={exerciseName(current.entry.exerciseId)}
              store={store}
              sessionLogId={log.sessionLogId}
              onChooseExercise={() => setChoosingExercise(true)}
              onSkipExercise={() => {
                const result = store.skipExercise(log.sessionLogId, {
                  exerciseId: current.entry.exerciseId,
                  blockIndex: current.blockIndex,
                  entryIndex: current.entryIndex,
                });
                if (result.ok) setSelectedMovementKey(null);
              }}
            />
          ) : (
            <section className="current-set">
              <p className="eyebrow">Workout accounted for</p>
              <h2>Session ready to complete</h2>
              <p className="muted">
                {log.setLogs.length} set{log.setLogs.length === 1 ? '' : 's'} logged
                {log.skippedExercises.length > 0
                  ? ` · ${log.skippedExercises.length} exercise${log.skippedExercises.length === 1 ? '' : 's'} skipped`
                  : ''}
                . Review your workout, then complete it to advance the program.
              </p>
              {log.skippedExercises.length > 0 ? (
                <div className="skipped-review">
                  <p className="eyebrow">Skipped for this workout</p>
                  {log.skippedExercises.map((skipped) => (
                    <div className="spread" key={plannedEntryKey(skipped)}>
                      <span>{exerciseName(skipped.exerciseId)}</span>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const result = store.restoreExercise(log.sessionLogId, skipped);
                          if (result.ok) setSelectedMovementKey(plannedEntryKey(skipped));
                        }}
                      >
                        Include again
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
              <Button wide onClick={complete}>
                Complete session
              </Button>
            </section>
          )}
        </div>
        <aside className="stack">
          <h2>This workout</h2>
          {log.setLogs.length === 0 && log.skippedExercises.length === 0 ? (
            <div className="empty-state">
              <p>No sets confirmed yet. Prefilled inputs are not saved automatically.</p>
            </div>
          ) : (
            <div className="workout-exercise-list">
              {movements
                .filter((movement) =>
                  log.setLogs.some(
                    (setLog) => plannedEntryKey(setLog) === plannedEntryKey(movement),
                  ),
                )
                .map((movement) => {
                  const sets = log.setLogs
                    .filter((setLog) => plannedEntryKey(setLog) === plannedEntryKey(movement))
                    .sort((left, right) => left.setIndex - right.setIndex);
                  const skipped = log.skippedExercises.some(
                    (entry) => plannedEntryKey(entry) === plannedEntryKey(movement),
                  );
                  return (
                    <section className="logged-group" key={plannedEntryKey(movement)}>
                      <div className="spread logged-group-heading">
                        <div>
                          <strong>{movement.name}</strong>
                          <p className="exercise-id">
                            Block {movement.blockIndex + 1}
                            {movement.isSuperset
                              ? ` · superset movement ${movement.entryIndex + 1}`
                              : ''}
                          </p>
                          {skipped ? <p className="muted">Skipped for this workout</p> : null}
                        </div>
                        <div className="logged-group-actions">
                          <span className="badge">
                            {sets.length}/{entrySetCount(movement.entry)} sets
                          </span>
                          {skipped ? (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const result = store.restoreExercise(log.sessionLogId, movement);
                                if (result.ok) setSelectedMovementKey(plannedEntryKey(movement));
                              }}
                            >
                              Include
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="logged-list">
                        {sets.map((setLog) => (
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
                                    Saved · Set {setLog.setIndex + 1}
                                  </p>
                                  <strong>
                                    {formatLoad(setLog.weight)} × {setLog.reps}
                                  </strong>
                                  <span className="muted">
                                    {setLog.rpe === null ? ' · RPE —' : ` · RPE ${setLog.rpe}`}
                                  </span>
                                </div>
                                <button
                                  className="text-button"
                                  onClick={() => setEditing(setLog.setLogId)}
                                >
                                  Correct
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              {log.skippedExercises
                .filter(
                  (skipped) =>
                    !log.setLogs.some(
                      (setLog) => plannedEntryKey(setLog) === plannedEntryKey(skipped),
                    ),
                )
                .map((skipped) => (
                  <section
                    className="logged-group skipped-group"
                    key={`skipped-${plannedEntryKey(skipped)}`}
                  >
                    <div className="spread logged-group-heading">
                      <div>
                        <strong>{exerciseName(skipped.exerciseId)}</strong>
                        <p className="muted">Skipped for this workout</p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const result = store.restoreExercise(log.sessionLogId, skipped);
                          if (result.ok) setSelectedMovementKey(plannedEntryKey(skipped));
                        }}
                      >
                        Include
                      </Button>
                    </div>
                  </section>
                ))}
            </div>
          )}
        </aside>
      </div>
      {choosingExercise ? (
        <ExercisePickerDialog
          movements={movements}
          session={session}
          blockOrder={blockOrder}
          log={log}
          selectedKey={current ? plannedEntryKey(current) : null}
          store={store}
          onSelect={(key) => {
            setSelectedMovementKey(key);
            setChoosingExercise(false);
          }}
          onClose={() => setChoosingExercise(false)}
        />
      ) : null}
      {leaving ? (
        <ConfirmDialog
          destructive={log.setLogs.length === 0}
          title={log.setLogs.length === 0 ? `Discard ${session.name}?` : 'Leave this session open?'}
          description={
            log.setLogs.length === 0
              ? 'No sets have been logged. This removes the empty session and does not advance the program rotation.'
              : `All ${log.setLogs.length} confirmed sets and ${log.skippedExercises.length} skipped exercise${log.skippedExercises.length === 1 ? '' : 's'} will stay saved. The session will remain in progress and Today will offer Resume; the rotation will not advance.`
          }
          confirmLabel={log.setLogs.length === 0 ? 'Discard empty session' : 'Leave and keep sets'}
          onConfirm={leaveOrDiscard}
          onCancel={() => setLeaving(false)}
        />
      ) : null}
    </main>
  );
}
