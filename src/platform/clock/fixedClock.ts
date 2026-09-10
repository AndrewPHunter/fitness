import type { Clock } from './Clock';

/** Deterministic test double. It is never imported by production composition. */
export function fixedClock(now: string, timezone: string): Clock {
  return { now: () => now, timezone: () => timezone };
}
