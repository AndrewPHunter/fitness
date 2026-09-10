import type { ExerciseEntry, Session } from '../program/types';

export interface PlannedSet {
  blockIndex: number;
  entryIndex: number;
  setIndex: number;
  entry: ExerciseEntry;
  isSuperset: boolean;
}

export function plannedSets(session: Session): PlannedSet[] {
  return session.blocks.flatMap((block, blockIndex) => {
    if (block.type === 'single') {
      return Array.from({ length: block.entry.sets }, (_, setIndex) => ({
        blockIndex,
        entryIndex: 0,
        setIndex,
        entry: block.entry,
        isSuperset: false,
      }));
    }
    const maximumSets = Math.max(...block.entries.map((entry) => entry.sets));
    return Array.from({ length: maximumSets }, (_, setIndex) =>
      block.entries.flatMap((entry, entryIndex) =>
        setIndex < entry.sets
          ? [{ blockIndex, entryIndex, setIndex, entry, isSuperset: true }]
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
