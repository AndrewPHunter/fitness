import { entrySetCount, prescriptionAt } from '../program/prescription';
import type { ExerciseEntry, PerSetPrescription, Session } from '../program/types';

export interface PlannedSet {
  blockIndex: number;
  entryIndex: number;
  setIndex: number;
  entry: ExerciseEntry;
  prescription: PerSetPrescription;
  isSuperset: boolean;
}

function plannedSet(
  entry: ExerciseEntry,
  blockIndex: number,
  entryIndex: number,
  setIndex: number,
  isSuperset: boolean,
): PlannedSet[] {
  const prescription = prescriptionAt(entry, setIndex);
  return prescription
    ? [{ blockIndex, entryIndex, setIndex, entry, prescription, isSuperset }]
    : [];
}

export function plannedSets(session: Session): PlannedSet[] {
  return session.blocks.flatMap((block, blockIndex) => {
    if (block.type === 'single') {
      return Array.from({ length: entrySetCount(block.entry) }, (_, setIndex) =>
        plannedSet(block.entry, blockIndex, 0, setIndex, false),
      ).flat();
    }
    const maximumSets = Math.max(...block.entries.map(entrySetCount));
    return Array.from({ length: maximumSets }, (_, setIndex) =>
      block.entries.flatMap((entry, entryIndex) =>
        setIndex < entrySetCount(entry)
          ? plannedSet(entry, blockIndex, entryIndex, setIndex, true)
          : [],
      ),
    ).flat();
  });
}

export function plannedSetKey(
  set: Pick<PlannedSet, 'blockIndex' | 'entryIndex' | 'setIndex'>,
): string {
  return `${set.blockIndex}:${set.entryIndex}:${set.setIndex}`;
}
