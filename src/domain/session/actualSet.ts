import type { Load } from '../program/types';

export function isValidActual(weight: Load, reps: number, rpe: number | null): boolean {
  return (
    Number.isFinite(weight.value) &&
    weight.value > 0 &&
    Number.isInteger(reps) &&
    reps >= 0 &&
    (rpe === null ||
      (Number.isFinite(rpe) && rpe >= 1 && rpe <= 10 && rpe * 2 === Math.round(rpe * 2)))
  );
}
