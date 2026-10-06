import type { Session, SessionLog } from '../program/types';
import { entireSessionSkipped, sessionEntryPositions } from './sessionOutcome';

const session: Session = {
  sessionId: 'training-day',
  name: 'Training Day',
  blocks: [
    { type: 'single', entry: { exerciseId: 'squat', sets: 1, reps: 5 } },
    {
      type: 'superset',
      entries: [
        { exerciseId: 'row', sets: 1, reps: 8 },
        { exerciseId: 'curl', sets: 1, reps: 10 },
      ],
    },
  ],
};

const skippedAt = '2026-10-05T09:15:00-07:00';

function log(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    sessionLogId: 'log-1',
    programId: 'program',
    programVersion: 1,
    sessionId: session.sessionId,
    startedAt: skippedAt,
    completedAt: skippedAt,
    setLogs: [],
    skippedExercises: sessionEntryPositions(session).map((position) => ({
      ...position,
      skippedAt,
    })),
    ...overrides,
  };
}

it('recognizes a completed zero-set session with every entry skipped', () => {
  expect(entireSessionSkipped(session, log())).toBe(true);
});

it('does not classify a partial exercise skip as a skipped session', () => {
  expect(
    entireSessionSkipped(session, log({ skippedExercises: log().skippedExercises.slice(1) })),
  ).toBe(false);
});

it('does not classify a session with logged work as entirely skipped', () => {
  expect(
    entireSessionSkipped(
      session,
      log({
        setLogs: [
          {
            setLogId: 'set-1',
            exerciseId: 'squat',
            blockIndex: 0,
            entryIndex: 0,
            setIndex: 0,
            weight: { value: 100, unit: 'kg' },
            reps: 5,
            rpe: null,
            loggedAt: skippedAt,
          },
        ],
      }),
    ),
  ).toBe(false);
});
