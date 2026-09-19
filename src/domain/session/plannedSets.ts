import { entrySetCount, prescriptionAt } from '../program/prescription';
import type { Block, ExerciseEntry, PerSetPrescription, Session } from '../program/types';

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

export function authoredBlockOrder(session: Session): number[] {
  return session.blocks.map((_, blockIndex) => blockIndex);
}

function resolvedBlockOrder(session: Session, blockOrder?: number[]): number[] {
  const authored = authoredBlockOrder(session);
  const validOrder =
    blockOrder?.length === authored.length &&
    new Set(blockOrder).size === authored.length &&
    blockOrder.every((blockIndex) => authored.includes(blockIndex));
  return validOrder ? blockOrder : authored;
}

export function orderedSessionBlocks(
  session: Session,
  blockOrder?: number[],
): { block: Block; blockIndex: number }[] {
  return resolvedBlockOrder(session, blockOrder).flatMap((blockIndex) => {
    const block = session.blocks[blockIndex];
    return block ? [{ block, blockIndex }] : [];
  });
}

export function orderedPlannedSets(session: Session, blockOrder?: number[]): PlannedSet[] {
  const byBlock = new Map<number, PlannedSet[]>();
  plannedSets(session).forEach((set) => {
    const block = byBlock.get(set.blockIndex) ?? [];
    block.push(set);
    byBlock.set(set.blockIndex, block);
  });
  return resolvedBlockOrder(session, blockOrder).flatMap(
    (blockIndex) => byBlock.get(blockIndex) ?? [],
  );
}

export function plannedSetKey(
  set: Pick<PlannedSet, 'blockIndex' | 'entryIndex' | 'setIndex'>,
): string {
  return `${set.blockIndex}:${set.entryIndex}:${set.setIndex}`;
}

export function plannedEntryKey(entry: Pick<PlannedSet, 'blockIndex' | 'entryIndex'>): string {
  return `${entry.blockIndex}:${entry.entryIndex}`;
}
