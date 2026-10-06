import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { entryPrescriptionSummary } from '../../domain/program/prescription';
import { nextSession } from '../../domain/schedule/nextSession';
import { orderedSessionBlocks } from '../../domain/session/plannedSets';
import { entireSessionSkipped } from '../../domain/session/sessionOutcome';
import type { AppStore } from '../../domain/state/appStore';
import { Badge } from '../../ui/atoms/Badge';
import { Button } from '../../ui/atoms/Button';
import { ConfirmDialog } from '../../ui/organisms/ConfirmDialog';

const dayNames = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

function calendarDay(iso: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function TodayPage({ store }: { store: AppStore }) {
  const navigate = useNavigate();
  const [confirmingSkip, setConfirmingSkip] = useState(false);
  const activeLog = store.activeSession();
  const active = store.data.activeProgram
    ? store.data.programs.find(
        ({ program }) =>
          program.programId === store.data.activeProgram?.programId &&
          program.version === store.data.activeProgram.version,
      )?.program
    : null;
  if (!active)
    return (
      <main className="page">
        <header className="page-header">
          <p className="eyebrow">Today</p>
          <h1>Your next session starts with a program.</h1>
        </header>
        <div className="empty-state">
          <h2>
            {store.data.programs.length === 0
              ? 'Build your first program'
              : 'Activate a stored program'}
          </h2>
          <p className="muted">
            Programs are prescriptions. Your logged history remains separate and is never removed by
            activation.
          </p>
          {store.data.programs.length === 0 ? (
            <div className="cluster">
              <Link className="button button-primary" to="/author">
                Get the authoring prompt
              </Link>
              <Link className="button button-secondary" to="/programs?paste=1">
                Import a program
              </Link>
            </div>
          ) : (
            <Link className="button button-primary" to="/programs">
              Choose a program to activate
            </Link>
          )}
        </div>
      </main>
    );

  const completed = store.data.sessionLogs.filter(
    (log) =>
      log.programId === active.programId &&
      log.programVersion === active.version &&
      log.completedAt !== null,
  ).length;
  const now = store.now();
  const timezone = store.timezone();
  const next = nextSession(active, completed, now, timezone);
  const weekdaySessionSkippedToday =
    active.schedule.mode === 'weekdays' &&
    store.data.sessionLogs.some(
      (log) =>
        log.programId === active.programId &&
        log.programVersion === active.version &&
        log.sessionId === next.session.sessionId &&
        entireSessionSkipped(next.session, log) &&
        calendarDay(log.completedAt ?? log.startedAt, timezone) === calendarDay(now, timezone),
    );
  const activeLogProgram = activeLog
    ? store.data.programs.find(
        ({ program }) =>
          program.programId === activeLog.programId && program.version === activeLog.programVersion,
      )?.program
    : null;
  const nextOrder = store.data.workoutOrders.find(
    (candidate) =>
      candidate.programId === active.programId &&
      candidate.programVersion === active.version &&
      candidate.sessionId === next.session.sessionId,
  );
  const start = () => {
    const result = store.startSession(next.session.sessionId);
    if (result.ok) navigate('/session/active', { state: { preserveFeedback: true } });
  };
  const skip = () => {
    const result = store.skipSession(next.session.sessionId);
    if (result.ok) setConfirmingSkip(false);
  };
  return (
    <main className="page">
      <header className="page-header">
        <div className="cluster">
          <p className="eyebrow">Today</p>
          <Badge active>
            {active.name} · v{active.version}
          </Badge>
        </div>
        <h1>
          {activeLog
            ? 'Pick up where you left off.'
            : next.dayOffset === 0
              ? 'Ready when you are.'
              : `Next up: ${next.weekday ? dayNames[next.weekday] : ''}.`}
        </h1>
        {next.dayOffset > 0 && !activeLog ? (
          <p className="muted">
            Today is a rest day. Your next scheduled training day is in {next.dayOffset} day
            {next.dayOffset === 1 ? '' : 's'}.
          </p>
        ) : null}
      </header>
      {activeLog ? (
        <section className="session-card">
          <div>
            <p className="eyebrow">In progress</p>
            <h2>
              {activeLogProgram?.sessions.find(
                (session) => session.sessionId === activeLog.sessionId,
              )?.name ?? activeLog.sessionId}
            </h2>
            <p>
              {activeLogProgram?.name ?? activeLog.programId} · v{activeLog.programVersion}
            </p>
            <p>Started {new Date(activeLog.startedAt).toLocaleString()}</p>
          </div>
          <Link className="button button-primary" to="/session/active">
            Resume · {activeLog.setLogs.length} set{activeLog.setLogs.length === 1 ? '' : 's'}{' '}
            logged
            {activeLog.skippedExercises.length > 0
              ? ` · ${activeLog.skippedExercises.length} skipped`
              : ''}
          </Link>
        </section>
      ) : weekdaySessionSkippedToday ? (
        <section className="session-card">
          <div>
            <p className="eyebrow">Session skipped</p>
            <h2>{next.session.name}</h2>
            <p className="muted">
              Recorded for today. Your weekday schedule continues on its next training day.
            </p>
          </div>
          <Link className="button button-secondary" to="/history">
            View in History
          </Link>
        </section>
      ) : (
        <section className="session-card">
          <div>
            <p className="eyebrow">Next session</p>
            <h2>{next.session.name}</h2>
            {next.session.notes ? <p>{next.session.notes}</p> : null}
          </div>
          {nextOrder ? <p className="exercise-id">Your saved routine order</p> : null}
          <div className="session-prescription">
            {orderedSessionBlocks(next.session, nextOrder?.blockOrder).map(
              ({ block, blockIndex }) => (
                <div className="prescription-row" key={`${block.type}-${blockIndex}`}>
                  <span>
                    {block.type === 'superset'
                      ? `Superset · ${block.entries.length} exercises`
                      : active.exercises.find(
                          (exercise) => exercise.exerciseId === block.entry.exerciseId,
                        )?.name}
                  </span>
                  <strong>
                    {block.type === 'single'
                      ? entryPrescriptionSummary(block.entry)
                      : block.entries.map(entryPrescriptionSummary).join(' / ')}
                  </strong>
                </div>
              ),
            )}
          </div>
          <Button wide onClick={start}>
            Start session
          </Button>
          <Button variant="ghost" wide onClick={() => setConfirmingSkip(true)}>
            Skip session
          </Button>
        </section>
      )}
      {confirmingSkip && !weekdaySessionSkippedToday ? (
        <ConfirmDialog
          title={`Skip ${next.session.name}?`}
          description={`This records every exercise in ${next.session.name} as skipped and adds the session to History. Rotation programs move to the next session; weekday programs continue to follow their calendar. No sets will be logged.`}
          confirmLabel="Skip this session"
          onConfirm={skip}
          onCancel={() => setConfirmingSkip(false)}
        />
      ) : null}
    </main>
  );
}
