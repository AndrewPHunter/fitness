import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { prepareProgramText } from '../../domain/program/prepareProgramText';
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
  const [searchParams] = useSearchParams();
  const pasteField = useRef<HTMLTextAreaElement>(null);
  const [programText, setProgramText] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fencedText, setFencedText] = useState<string | null>(null);
  const [editNotice, setEditNotice] = useState('');
  const [reading, setReading] = useState(false);
  const directPaste = searchParams.get('paste') === '1';
  const knownIds = new Set(
    store.data.programs.flatMap(({ program }) =>
      program.exercises.map((exercise) => exercise.exerciseId),
    ),
  );

  useEffect(() => {
    if (!directPaste) return;
    pasteField.current?.focus();
  }, [directPaste]);

  const clearReview = () => {
    setErrors([]);
    setPreview(null);
    setFencedText(null);
    setEditNotice('');
  };

  const reviewProgramText = (text: string) => {
    clearReview();
    const prepared = prepareProgramText(text);
    if (prepared.kind === 'empty') {
      setErrors([
        {
          layer: 'structural',
          code: 'EMPTY_INPUT',
          path: '',
          message: 'Paste program JSON into the field before asking Fieldwork to validate it.',
        },
      ]);
      return;
    }
    if (prepared.kind === 'fenced') {
      setFencedText(prepared.visibleTextWithoutFences);
      setErrors([
        {
          layer: 'structural',
          code: 'CODE_FENCE',
          path: '',
          message:
            'Markdown code fences are not valid JSON. Remove them explicitly, review the visible change, then validate again.',
        },
      ]);
      return;
    }

    const result = validateProgramText(prepared.text);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (
      store.data.programs.some(
        ({ program }) =>
          program.programId === result.program.programId &&
          program.version === result.program.version,
      )
    ) {
      setErrors([duplicateProgramError(result.program)]);
      return;
    }
    setPreview({
      program: result.program,
      known: result.program.exercises
        .map((exercise) => exercise.exerciseId)
        .filter((id) => knownIds.has(id)),
      fresh: result.program.exercises
        .map((exercise) => exercise.exerciseId)
        .filter((id) => !knownIds.has(id)),
    });
  };

  const updateProgramText = (text: string) => {
    setProgramText(text);
    clearReview();
  };

  const removeCodeFences = () => {
    if (fencedText === null) return;
    setProgramText(fencedText);
    setErrors([]);
    setPreview(null);
    setFencedText(null);
    setEditNotice('Code fences removed from the visible text. Review it, then validate again.');
    pasteField.current?.focus();
  };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setReading(true);
    clearReview();
    try {
      const text = await readTextFile(file);
      setProgramText(text);
      reviewProgramText(text);
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
    if (result.ok) {
      setPreview(null);
      setProgramText('');
    }
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
          Paste a strict JSON program, inspect what it contains, then choose when to activate it.
        </p>
      </header>
      <section className="paste-import-primary stack" aria-labelledby="paste-import-title">
        <div className="spread">
          <div className="stack">
            <p className="eyebrow">Primary import path</p>
            <h2 id="paste-import-title">Paste program JSON</h2>
            <p>Copy the JSON reply from your LLM and paste it here. No file is needed.</p>
          </div>
          <span className="import-step" aria-hidden="true">
            01
          </span>
        </div>
        <label className="field" htmlFor="program-json">
          <span className="field-label">Program JSON</span>
          <textarea
            className="program-paste-input"
            id="program-json"
            ref={pasteField}
            rows={12}
            spellCheck={false}
            value={programText}
            onChange={(event) => updateProgramText(event.target.value)}
            placeholder="Paste the complete JSON object here…"
          />
          <span className="field-hint">
            Nothing is stored until validation passes and you press Import program.
          </span>
        </label>
        <Button wide onClick={() => reviewProgramText(programText)}>
          Validate pasted JSON
        </Button>
        {editNotice ? (
          <p className="action-feedback action-feedback-success" role="status">
            <span className="state-symbol" aria-hidden="true">
              ✓
            </span>
            {editNotice}
          </p>
        ) : null}
      </section>
      <section className="surface stack file-import-secondary" aria-labelledby="file-import-title">
        <div className="spread">
          <div className="stack">
            <p className="eyebrow">Secondary import path</p>
            <h2 id="file-import-title">Upload a JSON file</h2>
            <p className="muted">For saved programs and the downloadable worked example.</p>
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
          actions={
            fencedText !== null ? (
              <Button variant="secondary" onClick={removeCodeFences}>
                Remove code fences
              </Button>
            ) : undefined
          }
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
              Paste program JSON above. Valid programs are previewed before anything is saved.
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
