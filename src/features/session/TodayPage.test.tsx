import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import rotationFixture from '../../../fixtures/programs/02-every-other-day-rotation.json';
import weekdayFixture from '../../../fixtures/programs/03-fixed-weekdays.json';
import { App } from '../../app/App';
import { PersistedProvider } from '../../app/PersistedProvider';
import { freshRoot } from '../../domain/persistence/validateRoot';
import type { PersistedRoot, Program } from '../../domain/program/types';
import { validateProgram } from '../../domain/program/validateProgram';
import { fixedClock } from '../../platform/clock/fixedClock';
import { sequentialIdProvider } from '../../platform/ids/sequentialIdProvider';
import { createMemoryAdapter } from '../../platform/storage/memoryAdapter';

const validation = validateProgram(rotationFixture);
if (!validation.ok) throw new Error('Rotation fixture must be valid.');
const program = validation.program;
const weekdayValidation = validateProgram(weekdayFixture);
if (!weekdayValidation.ok) throw new Error('Weekday fixture must be valid.');
const weekdayProgram = weekdayValidation.program;

function renderToday(selectedProgram: Program = program) {
  window.location.hash = '#/';
  const root: PersistedRoot = {
    ...freshRoot(),
    programs: [{ program: selectedProgram, importedAt: '2026-10-05T08:00:00-07:00' }],
    activeProgram: { programId: selectedProgram.programId, version: selectedProgram.version },
  };
  const adapter = createMemoryAdapter(root);
  render(
    <HashRouter>
      <PersistedProvider
        adapter={adapter}
        clock={fixedClock('2026-10-05T09:15:00-07:00', 'America/Phoenix')}
        ids={sequentialIdProvider('session')}
      >
        <App />
      </PersistedProvider>
    </HashRouter>,
  );
  return adapter;
}

it('records the entire next session as skipped and advances the rotation', async () => {
  const user = userEvent.setup();
  const adapter = renderToday();

  expect(screen.getByRole('heading', { name: 'A — Squat / Bench' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Skip session' }));
  expect(screen.getByRole('alertdialog', { name: 'Skip A — Squat / Bench?' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Skip this session' }));

  expect(screen.getByRole('heading', { name: 'B — Squat / Press' })).toBeVisible();
  expect(document.querySelector('.global-feedback-success')).toHaveTextContent(
    'A — Squat / Bench skipped · 4 exercises recorded as skipped.',
  );
  const raw = adapter.raw();
  const saved: unknown = raw ? JSON.parse(raw) : null;
  expect(saved).toMatchObject({
    sessionLogs: [
      {
        sessionLogId: 'session-1',
        sessionId: 'a-squat-bench',
        startedAt: '2026-10-05T09:15:00-07:00',
        completedAt: '2026-10-05T09:15:00-07:00',
        setLogs: [],
        skippedExercises: [
          { exerciseId: 'barbell-back-squat', blockIndex: 0, entryIndex: 0 },
          { exerciseId: 'barbell-bench-press', blockIndex: 1, entryIndex: 0 },
          { exerciseId: 'chin-up', blockIndex: 2, entryIndex: 0 },
          { exerciseId: 'dip', blockIndex: 2, entryIndex: 1 },
        ],
      },
    ],
  });
});

it('records a fixed-weekday session once and does not offer it again that day', async () => {
  const user = userEvent.setup();
  const adapter = renderToday(weekdayProgram);

  expect(screen.getByRole('heading', { name: 'Workout A' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Skip session' }));
  await user.click(screen.getByRole('button', { name: 'Skip this session' }));

  expect(screen.getByRole('heading', { name: 'Workout A' })).toBeVisible();
  expect(screen.getByText('Session skipped')).toBeVisible();
  expect(
    screen.getByText(
      'Recorded for today. Your weekday schedule continues on its next training day.',
    ),
  ).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Start session' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Skip session' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View in History' })).toBeVisible();

  const raw = adapter.raw();
  const saved = raw ? (JSON.parse(raw) as PersistedRoot) : null;
  expect(saved?.sessionLogs).toHaveLength(1);
});
