import type { ExerciseEntry, PerSetExerciseEntry, PerSetPrescription } from './types';

export function isPerSetEntry(entry: ExerciseEntry): entry is PerSetExerciseEntry {
  return Array.isArray(entry.sets);
}

export function entrySetCount(entry: ExerciseEntry): number {
  return isPerSetEntry(entry) ? entry.sets.length : entry.sets;
}

export function prescriptionAt(entry: ExerciseEntry, setIndex: number): PerSetPrescription | null {
  if (isPerSetEntry(entry)) return entry.sets[setIndex] ?? null;
  return entry;
}

export function prescribedReps(prescription: Pick<PerSetPrescription, 'reps' | 'repsMax'>): string {
  return prescription.repsMax === undefined
    ? String(prescription.reps)
    : `${prescription.reps}–${prescription.repsMax}`;
}

export function entryPrescriptionSummary(entry: ExerciseEntry): string {
  if (!isPerSetEntry(entry)) return `${entry.sets} × ${prescribedReps(entry)}`;
  return `${entry.sets.length} sets · ${entry.sets.map(prescribedReps).join(' / ')} reps`;
}
