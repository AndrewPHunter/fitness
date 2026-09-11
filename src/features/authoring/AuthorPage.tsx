import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import authoringPrompt from '../../../fixtures/authoring-prompt.md?raw';
import workedExample from '../../../fixtures/programs/02-every-other-day-rotation.json?raw';
import programSchema from '../../../fixtures/schema/program.schema.json?raw';
import {
  buildPersonalizedPrompt,
  extractCanonicalExerciseIds,
} from '../../domain/authoring/prompt';
import type { StoredProgram } from '../../domain/program/types';
import type { ClipboardAdapter } from '../../platform/clipboard/ClipboardAdapter';
import type { DownloadText } from '../../platform/files/files';
import { Button } from '../../ui/atoms/Button';

type Feedback =
  | { state: 'idle' }
  | { state: 'working' }
  | { state: 'success'; message: string }
  | { state: 'failure'; message: string };

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (feedback.state === 'idle' || feedback.state === 'working') return null;
  return (
    <p
      className={`action-feedback action-feedback-${feedback.state}`}
      role={feedback.state === 'failure' ? 'alert' : 'status'}
    >
      <span className="state-symbol" aria-hidden="true">
        {feedback.state === 'success' ? '✓' : '!'}
      </span>
      {feedback.message}
    </p>
  );
}

export function AuthorPage({
  programs,
  clipboard,
  download,
}: {
  programs: StoredProgram[];
  clipboard: ClipboardAdapter;
  download: DownloadText;
}) {
  const existingIds = useMemo(
    () =>
      programs.flatMap(({ program }) => program.exercises.map((exercise) => exercise.exerciseId)),
    [programs],
  );
  const personalized = useMemo(
    () => buildPersonalizedPrompt(authoringPrompt, existingIds),
    [existingIds],
  );
  const canonical = useMemo(() => extractCanonicalExerciseIds(authoringPrompt), []);
  const promptText = personalized.ok ? personalized.text : authoringPrompt;
  const [promptFeedback, setPromptFeedback] = useState<Feedback>({ state: 'idle' });
  const [canonicalFeedback, setCanonicalFeedback] = useState<Feedback>({ state: 'idle' });
  const [downloadFeedback, setDownloadFeedback] = useState<Feedback>({ state: 'idle' });

  const copyPrompt = async () => {
    if (!personalized.ok) {
      setPromptFeedback({ state: 'failure', message: personalized.detail });
      return;
    }
    setPromptFeedback({ state: 'working' });
    const result = await clipboard.writeText(personalized.text);
    setPromptFeedback(
      result.ok
        ? { state: 'success', message: 'Copied the complete personalized prompt.' }
        : { state: 'failure', message: result.detail },
    );
  };

  const copyCanonical = async () => {
    if (!canonical.ok) {
      setCanonicalFeedback({ state: 'failure', message: canonical.detail });
      return;
    }
    setCanonicalFeedback({ state: 'working' });
    const result = await clipboard.writeText(canonical.text);
    setCanonicalFeedback(
      result.ok
        ? { state: 'success', message: 'Copied the canonical exercise IDs.' }
        : { state: 'failure', message: result.detail },
    );
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    try {
      download(content, filename, type);
      setDownloadFeedback({ state: 'success', message: `Downloaded ${filename}.` });
    } catch (error: unknown) {
      setDownloadFeedback({
        state: 'failure',
        message: `${filename} could not be downloaded. ${error instanceof Error ? error.message : 'Try again or use a different browser.'}`,
      });
    }
  };

  return (
    <main className="page author-page">
      <header className="page-header">
        <p className="eyebrow">Program authoring kit</p>
        <h1>Take your format—and your history IDs—with you.</h1>
      </header>

      <section className="author-primary" aria-labelledby="author-primary-title">
        <div className="stack">
          <p className="eyebrow">Step 1 · primary action</p>
          <h2 id="author-primary-title">Copy the complete prompt</h2>
          <p>
            It includes the format, limits, self-check, canonical IDs, and your existing exercise
            IDs when this device has any.
          </p>
        </div>
        <Button
          wide
          className="author-copy-button"
          onClick={copyPrompt}
          disabled={promptFeedback.state === 'working' || !personalized.ok}
        >
          {promptFeedback.state === 'working' ? 'Copying…' : 'Copy personalized prompt'}
        </Button>
        <FeedbackMessage feedback={promptFeedback} />
        {!personalized.ok ? (
          <div className="author-integrity-error" role="alert">
            <strong>Personalization unavailable</strong>
            <p>{personalized.detail}</p>
          </div>
        ) : null}
      </section>

      <section className="author-steps" aria-labelledby="author-steps-title">
        <p className="eyebrow">The handoff</p>
        <h2 id="author-steps-title">Five plain steps</h2>
        <ol>
          <li>Copy the prompt above.</li>
          <li>Paste it into any capable LLM.</li>
          <li>Describe the program you want in the same message.</li>
          <li>Copy the LLM’s JSON-only reply—do not save a file or include code fences.</li>
          <li>
            <Link to="/programs?paste=1">Paste it directly into Programs</Link>, validate, and
            import.
          </li>
        </ol>
        <p className="muted">Fieldwork calls no LLM and sends no data anywhere.</p>
      </section>

      <section className="surface stack" aria-labelledby="personal-ids-title">
        <div className="spread">
          <div>
            <p className="eyebrow">Injected before copying</p>
            <h2 id="personal-ids-title">Your existing exercise IDs</h2>
          </div>
          {personalized.ok && personalized.injectedIds.length > 0 ? (
            <span className="badge">{personalized.injectedIds.length} IDs</span>
          ) : null}
        </div>
        {personalized.ok && personalized.injectedIds.length > 0 ? (
          <div className="id-ledger" aria-label="Exercise IDs that will be injected">
            {personalized.injectedIds.map((exerciseId) => (
              <code key={exerciseId}>{exerciseId}</code>
            ))}
          </div>
        ) : (
          <p className="empty-inline">
            No IDs are stored on this device yet, so no personal section will be injected. The
            canonical list in the prompt stands alone.
          </p>
        )}
      </section>

      <section className="author-tools" aria-labelledby="author-tools-title">
        <div className="stack">
          <p className="eyebrow">Optional reference files</p>
          <h2 id="author-tools-title">Give the LLM exact source files</h2>
          <p className="muted">
            The complete prompt is sufficient by itself. These downloads are useful when the LLM
            accepts attachments.
          </p>
        </div>
        <div className="author-tool-actions">
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile(programSchema, 'program.schema.json', 'application/schema+json')
            }
          >
            Download schema
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile(workedExample, 'fitness-worked-example.json', 'application/json')
            }
          >
            Download worked example
          </Button>
        </div>
        <FeedbackMessage feedback={downloadFeedback} />
      </section>

      <section className="surface stack" aria-labelledby="canonical-title">
        <div className="spread">
          <div>
            <p className="eyebrow">Shared vocabulary</p>
            <h2 id="canonical-title">Canonical exercise IDs</h2>
          </div>
          <Button variant="ghost" onClick={copyCanonical} disabled={!canonical.ok}>
            Copy IDs
          </Button>
        </div>
        {canonical.ok ? (
          <textarea
            className="canonical-list"
            aria-label="Canonical exercise ID list"
            readOnly
            spellCheck={false}
            rows={10}
            value={canonical.text}
          />
        ) : (
          <div className="author-integrity-error" role="alert">
            <strong>Canonical list unavailable</strong>
            <p>{canonical.detail}</p>
          </div>
        )}
        <FeedbackMessage feedback={canonicalFeedback} />
      </section>

      <section className="surface stack" aria-labelledby="manual-copy-title">
        <div>
          <p className="eyebrow">Always-available fallback</p>
          <h2 id="manual-copy-title">Select and copy the full prompt manually</h2>
        </div>
        <p className="muted">
          If clipboard access is blocked, select all in this field and use your browser’s copy
          command. This is the same personalized text used by the primary action.
        </p>
        <textarea
          className="prompt-fallback"
          aria-label="Full personalized authoring prompt"
          readOnly
          spellCheck={false}
          value={promptText}
          rows={18}
        />
      </section>

      <Link className="button button-primary" to="/programs?paste=1">
        I have JSON — paste it into Programs
      </Link>
    </main>
  );
}
