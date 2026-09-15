import { Link, useNavigate, useParams } from 'react-router-dom';
import { entryPrescriptionSummary } from '../../domain/program/prescription';
import { nextSession } from '../../domain/schedule/nextSession';
import type { AppStore } from '../../domain/state/appStore';
import { Badge } from '../../ui/atoms/Badge';
import { Button } from '../../ui/atoms/Button';

export function ProgramDetailPage({ store }: { store: AppStore }) {
  const navigate = useNavigate();
  const { programId, version } = useParams();
  const program = store.data.programs.find(
    (stored) =>
      stored.program.programId === programId && stored.program.version === Number(version),
  )?.program;
  if (!program)
    return (
      <main className="page">
        <div className="empty-state">
          <h1>Program not found</h1>
          <p className="muted">This version is not stored on this device.</p>
          <Link className="button button-primary" to="/programs">
            Back to programs
          </Link>
        </div>
      </main>
    );
  const active =
    store.data.activeProgram?.programId === program.programId &&
    store.data.activeProgram.version === program.version;
  const completed = store.data.sessionLogs.filter(
    (log) =>
      log.programId === program.programId &&
      log.programVersion === program.version &&
      log.completedAt !== null,
  ).length;
  const next = nextSession(program, completed, store.now(), store.timezone()).session;
  const start = () => {
    const result = store.startSession(next.sessionId);
    if (result.ok) navigate('/session/active', { state: { preserveFeedback: true } });
  };
  return (
    <main className="page">
      <header className="page-header">
        <div className="cluster">
          <p className="eyebrow">{program.programId}</p>
          {active ? <Badge active>Active</Badge> : null}
        </div>
        <h1>
          {program.name} <span className="muted">v{program.version}</span>
        </h1>
        {program.description ? <p className="muted">{program.description}</p> : null}
        <div className="cluster">
          {active ? (
            <Button onClick={start}>Start {next.name}</Button>
          ) : (
            <Button onClick={() => store.activateProgram(program.programId, program.version)}>
              Activate version
            </Button>
          )}
        </div>
      </header>
      <section className="stack">
        <h2>Sessions</h2>
        {program.sessions.map((session) => (
          <article className="surface stack" key={session.sessionId}>
            <div>
              <p className="exercise-id">{session.sessionId}</p>
              <h3>{session.name}</h3>
            </div>
            {session.notes ? <p className="muted">{session.notes}</p> : null}
            <ul className="summary-list">
              {session.blocks
                .flatMap((block) => (block.type === 'single' ? [block.entry] : block.entries))
                .map((entry, index) => (
                  <li key={`${entry.exerciseId}-${index}`}>
                    <span>
                      {
                        program.exercises.find(
                          (exercise) => exercise.exerciseId === entry.exerciseId,
                        )?.name
                      }
                    </span>
                    <strong>{entryPrescriptionSummary(entry)}</strong>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
