import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import authoringPrompt from '../../../fixtures/authoring-prompt.md?raw';
import workedExample from '../../../fixtures/programs/02-every-other-day-rotation.json?raw';
import programSchema from '../../../fixtures/schema/program.schema.json?raw';
import type { Program, StoredProgram } from '../../domain/program/types';
import type { ClipboardAdapter } from '../../platform/clipboard/ClipboardAdapter';
import { AuthorPage } from './AuthorPage';

const program: Program = {
  programId: 'existing-program',
  version: 1,
  name: 'Existing Program',
  exercises: [
    { exerciseId: 'barbell-bench-press', name: 'Bench' },
    { exerciseId: 'user-special-row', name: 'Special Row' },
  ],
  sessions: [
    {
      sessionId: 'session-a',
      name: 'Session A',
      blocks: [
        {
          type: 'superset',
          entries: [
            { exerciseId: 'barbell-bench-press', sets: 1, reps: 5 },
            { exerciseId: 'user-special-row', sets: 1, reps: 8 },
          ],
        },
      ],
    },
  ],
  schedule: { mode: 'rotation', sequence: ['session-a'] },
};
const programs: StoredProgram[] = [{ program, importedAt: '2026-09-10T10:00:00-07:00' }];

function successClipboard(onWrite: (text: string) => void): ClipboardAdapter {
  return {
    writeText: async (text) => {
      onWrite(text);
      return { ok: true };
    },
  };
}

function renderAuthor(
  clipboard: ClipboardAdapter,
  download: Parameters<typeof AuthorPage>[0]['download'],
  storedPrograms: StoredProgram[] = programs,
) {
  return render(
    <MemoryRouter>
      <AuthorPage programs={storedPrograms} clipboard={clipboard} download={download} />
    </MemoryRouter>,
  );
}

it('copies the complete fixture prompt with the visible local index injected', async () => {
  const user = userEvent.setup();
  let copied = '';
  renderAuthor(
    successClipboard((text) => {
      copied = text;
    }),
    () => undefined,
  );

  expect(screen.getByLabelText('Exercise IDs that will be injected')).toHaveTextContent(
    'barbell-bench-press',
  );
  const fallback = screen.getByLabelText<HTMLTextAreaElement>('Full personalized authoring prompt');
  expect(fallback.value).toContain('user-special-row');
  await user.click(screen.getByRole('button', { name: 'Copy personalized prompt' }));
  expect(copied).toContain(authoringPrompt.slice(0, 500));
  expect(copied).toContain('- `barbell-bench-press`');
  expect(copied).toContain('- `user-special-row`');
  expect(screen.getByText('Copied the complete personalized prompt.')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Paste it directly into Programs' })).toHaveAttribute(
    'href',
    '/programs?paste=1',
  );
  expect(screen.queryByText(/save the LLM’s JSON-only reply/u)).not.toBeInTheDocument();
});

it('shows clipboard failure while keeping the full selectable fallback present', async () => {
  const user = userEvent.setup();
  const denied: ClipboardAdapter = {
    writeText: async () => ({ ok: false, detail: 'Clipboard denied. Copy manually below.' }),
  };
  renderAuthor(denied, () => undefined, []);
  const fallback = screen.getByLabelText('Full personalized authoring prompt');
  expect(fallback).toBeVisible();
  expect(fallback).toHaveValue(authoringPrompt);
  await user.click(screen.getByRole('button', { name: 'Copy personalized prompt' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Clipboard denied');
  expect(screen.queryByText(/Copied the complete/u)).not.toBeInTheDocument();
});

it('downloads schema and worked example from the fixture-backed content', async () => {
  const user = userEvent.setup();
  const downloads: Array<{ content: string; filename: string; type: string }> = [];
  renderAuthor(
    successClipboard(() => undefined),
    (content, filename, type) => {
      downloads.push({ content, filename, type });
    },
    [],
  );
  await user.click(screen.getByRole('button', { name: 'Download schema' }));
  await user.click(screen.getByRole('button', { name: 'Download worked example' }));
  expect(downloads).toEqual([
    { content: programSchema, filename: 'program.schema.json', type: 'application/schema+json' },
    { content: workedExample, filename: 'fitness-worked-example.json', type: 'application/json' },
  ]);
});
