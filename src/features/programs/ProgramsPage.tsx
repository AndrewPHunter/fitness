import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { prepareProgramText } from '../../domain/program/prepareProgramText';
import type { Program, StoredProgram, ValidationError } from '../../domain/program/types';
import { duplicateProgramError, validateProgramText } from '../../domain/program/validateProgram';
import { nextSession } from '../../domain/schedule/nextSession';
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
  const navigate = useNavigate();
  const pasteField = useRef<HTMLTextAreaElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const importHeading = useRef<HTMLHeadingElement>(null);
  const clearConfirmation = useRef<HTMLElement>(null);
  const [programText, setProgramText] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fencedText, setFencedText] = useState<string | null>(null);
  const [editNotice, setEditNotice] = useState('');
  const [imported, setImported] = useState<Program | null>(null);
  const [clearedText, setClearedText] = useState<string | null>(null);
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

  useEffect(() => {
    if (errors.length === 0 && !preview) return;
    const frame = requestAnimationFrame(() => {
      resultHeading.current?.scrollIntoView({ block: 'start' });
      resultHeading.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [errors, preview]);

  const clearReview = () => {
    setErrors([]);
    setPreview(null);
    setFencedText(null);
    setEditNotice('');
    setImported(null);
  };

  const reviewProgramText = (text: string) => {
    store.clearMessages();
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
    store.clearMessages();
    setProgramText(text);
    setClearedText(null);
    clearReview();
  };

  const clearPastedText = () => {
    if (programText === '') return;
    store.clearMessages();
    setClearedText(programText);
    setProgramText('');
    clearReview();
    requestAnimationFrame(() => clearConfirmation.current?.focus({ preventScroll: true }));
  };

  const undoClear = () => {
    if (clearedText === null) return;
    setProgramText(clearedText);
    setClearedText(null);
    clearReview();
  };

  const removeCodeFences = () => {
    if (fencedText === null) return;
    store.clearMessages();
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
    store.clearMessages();
    setClearedText(null);
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
      setImported(preview.program);
      setPreview(null);
      requestAnimationFrame(() => importHeading.current?.focus({ preventScroll: true }));
    }
  };

  const nextFor = (program: Program) => {
    const completed = store.data.sessionLogs.filter(
      (log) =>
        log.programId === program.programId &&
        log.programVersion === program.version &&
        log.completedAt !== null,
    ).length;
    return nextSession(program, completed, store.now(), store.timezone()).session;
  };

  const activate = (program: Program) => store.activateProgram(program.programId, program.version);

  const start = (program: Program) => {
    const session = nextFor(program);
    const result = store.startSession(session.sessionId);
    if (result.ok) navigate('/session/active', { state: { preserveFeedback: true } });
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
        <div className="paste-actions">
          <Button onClick={() => reviewProgramText(programText)}>Validate pasted JSON</Button>
        </div>
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
          headingRef={resultHeading}
          headingTabIndex={-1}
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
          <div className="spread result-heading-row">
            <div>
              <p className="eyebrow">Ready to import</p>
              <h2 ref={resultHeading} tabIndex={-1}>
                {preview.program.name} <span className="muted">v{preview.program.version}</span>
              </h2>
            </div>
            <Button onClick={savePreview}>Import program</Button>
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
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}
      {imported ? (
        <section className="surface stack import-confirmation" aria-labelledby="imported-title">
          <div>
            <p className="eyebrow">Import complete</p>
            <h2 id="imported-title" ref={importHeading} tabIndex={-1}>
              {imported.name} v{imported.version} imported
            </h2>
          </div>
          <div className="cluster">
            {store.data.activeProgram?.programId === imported.programId &&
            store.data.activeProgram.version === imported.version ? (
              <Button onClick={() => start(imported)}>Start {nextFor(imported).name}</Button>
            ) : (
              <Button onClick={() => activate(imported)}>Activate {imported.name}</Button>
            )}
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
                  const handledByImportConfirmation =
                    imported?.programId === program.programId &&
                    imported.version === program.version;
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
                      {handledByImportConfirmation ? null : active ? (
                        <Button onClick={() => start(program)}>
                          Start {nextFor(program).name}
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => activate(program)}>
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
      {clearedText !== null ? (
        <aside
          className="global-feedback global-feedback-success clear-feedback"
          role="status"
          tabIndex={-1}
          ref={clearConfirmation}
        >
          <span className="state-symbol" aria-hidden="true">
            ✓
          </span>
          <p>Pasted JSON cleared</p>
          <Button variant="secondary" onClick={undoClear}>
            Undo
          </Button>
        </aside>
      ) : null}
      {programText !== '' ? (
        <Button
          className={`paste-clear-floating${store.failure ? ' paste-clear-floating-failure' : store.notice ? ' paste-clear-floating-notice' : ''}`}
          variant="secondary"
          onClick={clearPastedText}
        >
          Clear pasted JSON
        </Button>
      ) : null}
    </main>
  );
}
