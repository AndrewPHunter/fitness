import type { Session, SessionLog } from '../program/types';

export interface SessionEntryPosition {
  exerciseId: string;
  blockIndex: number;
  entryIndex: number;
}

export function sessionEntryPositions(session: Session): SessionEntryPosition[] {
  return session.blocks.flatMap((block, blockIndex) =>
    block.type === 'single'
      ? [{ exerciseId: block.entry.exerciseId, blockIndex, entryIndex: 0 }]
      : block.entries.map((entry, entryIndex) => ({
          exerciseId: entry.exerciseId,
          blockIndex,
          entryIndex,
        })),
  );
}

export function entireSessionSkipped(session: Session, log: SessionLog): boolean {
  const positions = sessionEntryPositions(session);
  const skipped = new Set(
    log.skippedExercises.map((entry) => `${entry.blockIndex}:${entry.entryIndex}`),
  );
  return (
    log.completedAt !== null &&
    log.setLogs.length === 0 &&
    positions.length > 0 &&
    positions.every((position) => skipped.has(`${position.blockIndex}:${position.entryIndex}`))
  );
}
