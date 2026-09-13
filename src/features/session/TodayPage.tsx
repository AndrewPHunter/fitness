import { Link, useNavigate } from 'react-router-dom';
import { entryPrescriptionSummary } from '../../domain/program/prescription';
import { nextSession } from '../../domain/schedule/nextSession';
import type { AppStore } from '../../domain/state/appStore';
import { Badge } from '../../ui/atoms/Badge';
import { Button } from '../../ui/atoms/Button';

const dayNames = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export function TodayPage({ store }: { store: AppStore }) {
  const navigate = useNavigate();
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
              ? 'Upload your first program'
              : 'Activate a stored program'}
          </h2>
          <p className="muted">
            Programs are prescriptions. Your logged history remains separate and is never removed by
            activation.
          </p>
          <Link className="button button-primary" to="/programs">
            Open programs
          </Link>
        </div>
      </main>
    );

  const completed = store.data.sessionLogs.filter(
    (log) =>
      log.programId === active.programId &&
      log.programVersion === active.version &&
      log.completedAt !== null,
  ).length;
  const next = nextSession(active, completed, store.now(), store.timezone());
  const activeLogProgram = activeLog
    ? store.data.programs.find(
        ({ program }) =>
          program.programId === activeLog.programId && program.version === activeLog.programVersion,
      )?.program
    : null;
  const start = () => {
    const result = store.startSession(next.session.sessionId);
    if (result.ok) navigate('/session/active');
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
            Resume · {activeLog.setLogs.length} sets saved
          </Link>
        </section>
      ) : (
        <section className="session-card">
          <div>
            <p className="eyebrow">Next session</p>
            <h2>{next.session.name}</h2>
            {next.session.notes ? <p>{next.session.notes}</p> : null}
          </div>
          <div className="session-prescription">
            {next.session.blocks.map((block, blockIndex) => (
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
            ))}
          </div>
          <Button wide onClick={start}>
            Start session
          </Button>
        </section>
      )}
    </main>
  );
}
