import type { SetLog } from '../program/types';
import { lastLoggedWeight, observedFrequency, prefillWeight } from './history';

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
});
