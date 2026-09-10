import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Program, StoredProgram, ValidationError } from '../../domain/program/types';
import { duplicateProgramError, validateProgramText } from '../../domain/program/validateProgram';
import type { AppStore } from '../../domain/state/appStore';
import { readTextFile } from '../../platform/files/files';
import { Badge } from '../../ui/atoms/Badge';
import { Button } from '../../ui/atoms/Button';
import { ErrorPanel } from '../../ui/organisms/ErrorPanel';

interface Preview {
  program: Program;
  known: string[];
  fresh: string[];
}

export function ProgramsPage({ store }: { store: AppStore }) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reading, setReading] = useState(false);
  const knownIds = new Set(
    store.data.programs.flatMap(({ program }) =>
      program.exercises.map((exercise) => exercise.exerciseId),
    ),
  );

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setReading(true);
    setErrors([]);
    setPreview(null);
    try {
      const result = validateProgramText(await readTextFile(file));
      if (!result.ok) setErrors(result.errors);
      else if (
        store.data.programs.some(
          ({ program }) =>
            program.programId === result.program.programId &&
            program.version === result.program.version,
        )
      )
        setErrors([duplicateProgramError(result.program)]);
      else
        setPreview({
          program: result.program,
          known: result.program.exercises
            .map((exercise) => exercise.exerciseId)
            .filter((id) => knownIds.has(id)),
          fresh: result.program.exercises
            .map((exercise) => exercise.exerciseId)
            .filter((id) => !knownIds.has(id)),
        });
    } catch (error: unknown) {
      setErrors([
        {
          layer: 'structural',
          code: 'FILE_READ_ERROR',
          path: '',
          message: `The file could not be read. ${error instanceof Error ? error.message : ''}`,
        },
      ]);
    } finally {
      setReading(false);
    }
  };

  const savePreview = () => {
    if (!preview) return;
    const result = store.addProgram(preview.program);
    if (result.ok) setPreview(null);
  };

  const groups = new Map<string, StoredProgram[]>();
  store.data.programs.forEach((stored) => {
    const versions = groups.get(stored.program.programId) ?? [];
    groups.set(stored.program.programId, [...versions, stored]);
  });
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Program library</p>
        <h1>Prescriptions stay fixed. History stays yours.</h1>
        <p className="muted">
          Upload a strict JSON program, inspect what it contains, then choose when to activate it.
        </p>
      </header>
      <section className="surface stack">
        <div className="spread">
          <div className="stack">
            <h2>Upload program</h2>
            <p className="muted">Nothing is stored until validation passes and you confirm.</p>
          </div>
          <span className="eyebrow">{reading ? 'Reading file…' : 'JSON only'}</span>
        </div>
        <input
          className="input"
          id="program-file"
          type="file"
          accept=".json,application/json"
          aria-label="Choose program JSON"
          onChange={chooseFile}
          disabled={reading}
        />
        <div className="authoring-link-row">
          <div>
            <strong>No JSON file yet?</strong>
            <p className="muted">Use the bundled prompt, schema, example, and your known IDs.</p>
          </div>
          <Link className="button button-secondary" to="/author">
            Open authoring kit
          </Link>
        </div>
      </section>
      {errors.length > 0 ? (
        <ErrorPanel
          title={`${errors.length} problem${errors.length === 1 ? '' : 's'} found — program rejected`}
          errors={errors}
        />
      ) : null}
      {preview ? (
        <section className="surface stack" aria-live="polite">
          <div>
            <p className="eyebrow">Ready to import</p>
            <h2>
              {preview.program.name} <span className="muted">v{preview.program.version}</span>
            </h2>
          </div>
          <ul className="summary-list">
            <li>
              <span>Sessions</span>
              <strong>{preview.program.sessions.length}</strong>
            </li>
            <li>
              <span>Exercises</span>
              <strong>{preview.program.exercises.length}</strong>
            </li>
          </ul>
          <div className="stack">
            <p>
              <strong>Already known</strong>
            </p>
            <div className="cluster">
              {preview.known.length ? (
                preview.known.map((id) => <Badge key={id}>{id}</Badge>)
              ) : (
                <span className="muted">None</span>
              )}
            </div>
            <p>
              <strong>New exercise IDs</strong>
            </p>
            <div className="cluster">
              {preview.fresh.length ? (
                preview.fresh.map((id) => <Badge key={id}>{id}</Badge>)
              ) : (
                <span className="muted">None</span>
              )}
            </div>
          </div>
          <div className="cluster">
            <Button onClick={savePreview}>Import program</Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}
      <section className="stack">
        <div className="spread">
          <h2>Stored programs</h2>
          <Badge>{store.data.programs.length} versions</Badge>
        </div>
        {groups.size === 0 ? (
          <div className="empty-state">
            <h3>No programs yet</h3>
            <p className="muted">
              Choose a program JSON above. Valid files are previewed before anything is saved.
            </p>
          </div>
        ) : (
          <div className="program-list">
            {[...groups.entries()].map(([programId, versions]) => (
              <section className="surface stack" key={programId}>
                <div>
                  <p className="exercise-id">{programId}</p>
                  <h3>{versions.at(-1)?.program.name}</h3>
                </div>
                {versions.map(({ program }) => {
                  const activeProgram = store.data.activeProgram;
                  const active =
                    activeProgram?.programId === program.programId &&
                    activeProgram?.version === program.version;
                  return (
                    <div className="program-row" key={program.version}>
                      <div className="stack">
                        <div className="cluster">
                          <strong>Version {program.version}</strong>
                          {active ? <Badge active>Active</Badge> : null}
                        </div>
                        <Link to={`/programs/${program.programId}/${program.version}`}>
                          View {program.sessions.length} sessions
                        </Link>
                      </div>
                      {active ? null : (
                        <Button
                          variant="secondary"
                          onClick={() => store.activateProgram(program.programId, program.version)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
