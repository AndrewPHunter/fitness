import type { SessionLog, SetLog } from '../program/types';
import {
  lastLoggedWeight,
  observedFrequency,
  prefillWeight,
  previousExerciseSession,
} from './history';

function set(setLogId: string, exerciseId: string, loggedAt: string, value: number): SetLog {
  return {
    setLogId,
    exerciseId,
    loggedAt,
    weight: { value, unit: 'kg' },
    reps: 5,
    rpe: null,
    blockIndex: 0,
    entryIndex: 0,
    setIndex: 0,
  };
}

describe('history calculations', () => {
  it('prefills from the latest matching exercise across sources', () => {
    const logs = [
      set('a', 'squat', '2026-08-01T10:00:00-07:00', 90),
      set('b', 'bench', '2026-09-01T10:00:00-07:00', 70),
      set('c', 'squat', '2026-09-02T10:00:00-07:00', 100),
    ];
    expect(lastLoggedWeight(logs, 'squat')).toEqual({ value: 100, unit: 'kg' });
    expect(lastLoggedWeight(logs, 'press')).toBeNull();
    expect(prefillWeight(logs, 'press', { value: 40, unit: 'lb' })).toEqual({
      value: 40,
      unit: 'lb',
    });
    expect(prefillWeight(logs, 'press')).toBeNull();
  });

  it('prefers the most recent logged weight over a declared target', () => {
    const logs = [set('latest', 'squat', '2026-09-02T10:00:00-07:00', 112.5)];
    expect(prefillWeight(logs, 'squat', { value: 100, unit: 'kg' })).toEqual({
      value: 112.5,
      unit: 'kg',
    });
  });

  it('falls back to the declared target when history is absent', () => {
    expect(prefillWeight([], 'squat', { value: 225, unit: 'lb' })).toEqual({
      value: 225,
      unit: 'lb',
    });
  });

  it('returns an empty prefill when both history and target are absent', () => {
    expect(prefillWeight([], 'squat')).toBeNull();
  });

  it('returns the latest prior workout as one ordered set group', () => {
    const session = (sessionLogId: string, startedAt: string, sets: SetLog[]): SessionLog => ({
      sessionLogId,
      programId: 'program',
      programVersion: 1,
      sessionId: 'day',
      startedAt,
      completedAt: `${startedAt.slice(0, 11)}11:00:00-07:00`,
      setLogs: sets,
      skippedExercises: [],
    });
    const result = previousExerciseSession(
      [
        session('older', '2026-09-01T10:00:00-07:00', [
          set('older-set', 'squat', '2026-09-01T10:05:00-07:00', 90),
        ]),
        session('latest', '2026-09-08T10:00:00-07:00', [
          { ...set('second', 'squat', '2026-09-08T10:10:00-07:00', 102.5), setIndex: 1 },
          set('first', 'squat', '2026-09-08T10:05:00-07:00', 100),
          set('bench', 'bench', '2026-09-08T10:15:00-07:00', 70),
        ]),
        session('current', '2026-09-10T10:00:00-07:00', [
          set('current-set', 'squat', '2026-09-10T10:05:00-07:00', 105),
        ]),
      ],
      'squat',
      'current',
    );
    expect(result?.sessionLogId).toBe('latest');
    expect(result?.sets.map((entry) => entry.setLogId)).toEqual(['first', 'second']);
  });

  it('counts unique calendar dates inside 7- and 14-day inclusive-today windows', () => {
    const logs = [
      set('a', 'squat', '2026-09-10T01:00:00-07:00', 100),
      set('b', 'squat', '2026-09-10T02:00:00-07:00', 100),
      set('c', 'squat', '2026-09-04T23:00:00-07:00', 100),
      set('d', 'squat', '2026-09-03T23:00:00-07:00', 100),
      set('e', 'squat', '2026-08-27T23:00:00-07:00', 100),
    ];
    const now = '2026-09-10T12:00:00-07:00';
    expect(observedFrequency(logs, 'squat', now, 7, 'America/Phoenix')).toBe(2);
    expect(observedFrequency(logs, 'squat', now, 14, 'America/Phoenix')).toBe(3);
  });

  it.each([
    { age: 'inside 7-day window', timestamp: '2026-09-04T12:00:00-07:00', window: 7, expected: 1 },
    {
      age: 'exactly 7 calendar days old',
      timestamp: '2026-09-03T12:00:00-07:00',
      window: 7,
      expected: 0,
    },
    {
      age: 'inside 14-day window',
      timestamp: '2026-08-28T12:00:00-07:00',
      window: 14,
      expected: 1,
    },
    {
      age: 'exactly 14 calendar days old',
      timestamp: '2026-08-27T12:00:00-07:00',
      window: 14,
      expected: 0,
    },
  ])('handles a log $age', ({ timestamp, window, expected }) => {
    expect(
      observedFrequency(
        [set('boundary', 'squat', timestamp, 100)],
        'squat',
        '2026-09-10T12:00:00-07:00',
        window,
        'America/Phoenix',
      ),
    ).toBe(expected);
  });
});
