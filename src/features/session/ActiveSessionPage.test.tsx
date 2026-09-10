import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { App } from '../../app/App';
import { PersistedProvider } from '../../app/PersistedProvider';
import { freshRoot } from '../../domain/persistence/validateRoot';
import type { PersistedRoot, Program, SessionLog } from '../../domain/program/types';
import { fixedClock } from '../../platform/clock/fixedClock';
import { sequentialIdProvider } from '../../platform/ids/sequentialIdProvider';
import { createMemoryAdapter } from '../../platform/storage/memoryAdapter';

const program: Program = {
  programId: 'round-robin',
  version: 1,
  name: 'Round Robin',
  exercises: [
    { exerciseId: 'movement-a', name: 'Movement A' },
    { exerciseId: 'movement-b', name: 'Movement B' },
  ],
  sessions: [
    {
      sessionId: 'superset-day',
      name: 'Superset Day',
      blocks: [
        {
          type: 'superset',
          entries: [
            { exerciseId: 'movement-a', sets: 2, reps: 5, targetWeight: { value: 10, unit: 'kg' } },
            { exerciseId: 'movement-b', sets: 2, reps: 6, targetWeight: { value: 20, unit: 'kg' } },
          ],
        },
      ],
    },
  ],
  schedule: { mode: 'rotation', sequence: ['superset-day'] },
};

function activeRoot(previous: SessionLog[] = []): PersistedRoot {
  return {
    ...freshRoot(),
    programs: [{ program, importedAt: '2026-09-01T10:00:00-07:00' }],
    activeProgram: { programId: program.programId, version: 1 },
    sessionLogs: [
      ...previous,
      {
        sessionLogId: 'active',
        programId: program.programId,
        programVersion: 1,
        sessionId: 'superset-day',
        startedAt: '2026-09-10T10:00:00-07:00',
        completedAt: null,
        setLogs: [],
      },
    ],
  };
}

function renderApp(root: PersistedRoot) {
  window.location.hash = '#/session/active';
  const adapter = createMemoryAdapter(root);
  render(
    <HashRouter>
      <PersistedProvider
        adapter={adapter}
        clock={fixedClock('2026-09-10T10:30:00-07:00', 'America/Phoenix')}
        ids={sequentialIdProvider()}
      >
        <App />
      </PersistedProvider>
    </HashRouter>,
  );
  return adapter;
}

it('drives a superset in round-robin component order', async () => {
  const user = userEvent.setup();
  renderApp(activeRoot());
  expect(screen.getByRole('heading', { name: 'Movement A' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Log set' }));
  expect(screen.getByRole('heading', { name: 'Movement B' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Log set' }));
  expect(screen.getByRole('heading', { name: 'Movement A' })).toBeVisible();
  expect(screen.getByText('Superset · movement 1')).toBeVisible();
});

it('shows a prior weight prefill without persisting it before confirmation', () => {
  const prior: SessionLog = {
    sessionLogId: 'prior',
    programId: program.programId,
    programVersion: 1,
    sessionId: 'superset-day',
    startedAt: '2026-09-01T10:00:00-07:00',
    completedAt: '2026-09-01T11:00:00-07:00',
    setLogs: [
      {
        setLogId: 'prior-set',
        exerciseId: 'movement-a',
        blockIndex: 0,
        entryIndex: 0,
        setIndex: 0,
        weight: { value: 55, unit: 'lb' },
        reps: 5,
        rpe: null,
        loggedAt: '2026-09-01T10:05:00-07:00',
      },
    ],
  };
  const adapter = renderApp(activeRoot([prior]));
  expect(screen.getByLabelText('Weight (lb)')).toHaveValue(55);
  const raw = adapter.raw();
  expect(raw).not.toBeNull();
  const saved: unknown = raw ? JSON.parse(raw) : null;
  expect(saved).toMatchObject({
    sessionLogs: [
      { setLogs: [{ setLogId: 'prior-set' }] },
      { sessionLogId: 'active', setLogs: [] },
    ],
  });
});
