import { entrySetCount, prescriptionAt } from '../program/prescription';
import type { ExerciseEntry, PersistedRoot } from '../program/types';

export const CSV_COLUMNS = [
  'session_log_id',
  'program_id',
  'program_version',
  'session_id',
  'session_name',
  'started_at',
  'completed_at',
  'exercise_id',
  'exercise_name',
  'block_index',
  'block_type',
  'entry_index',
  'set_index',
  'prescribed_sets',
  'prescribed_reps',
  'prescribed_reps_max',
  'target_weight_value',
  'target_weight_unit',
  'target_rpe',
  'actual_weight_value',
  'actual_weight_unit',
  'actual_reps',
  'actual_rpe',
  'logged_at',
] as const;

function quote(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function entryAt(
  root: PersistedRoot,
  programId: string,
  version: number,
  sessionId: string,
  blockIndex: number,
  entryIndex: number,
): { entry: ExerciseEntry; sessionName: string; exerciseName: string; blockType: string } | null {
  const program = root.programs.find(
    (stored) => stored.program.programId === programId && stored.program.version === version,
  )?.program;
  const session = program?.sessions.find((candidate) => candidate.sessionId === sessionId);
  const block = session?.blocks[blockIndex];
  if (!program || !session || !block) return null;
  const entry = block.type === 'single' ? block.entry : block.entries[entryIndex];
  if (!entry) return null;
  const exerciseName = program.exercises.find(
    (exercise) => exercise.exerciseId === entry.exerciseId,
  )?.name;
  if (!exerciseName) return null;
  return { entry, sessionName: session.name, exerciseName, blockType: block.type };
}

export function toCsv(root: PersistedRoot): string {
  const rows = root.sessionLogs
    .flatMap((sessionLog) => sessionLog.setLogs.map((setLog) => ({ sessionLog, setLog })))
    .sort((left, right) => {
      const started =
        new Date(left.sessionLog.startedAt).getTime() -
        new Date(right.sessionLog.startedAt).getTime();
      if (started !== 0) return started;
      return (
        left.setLog.blockIndex - right.setLog.blockIndex ||
        left.setLog.entryIndex - right.setLog.entryIndex ||
        left.setLog.setIndex - right.setLog.setIndex
      );
    })
    .map(({ sessionLog, setLog }) => {
      const resolved = entryAt(
        root,
        sessionLog.programId,
        sessionLog.programVersion,
        sessionLog.sessionId,
        setLog.blockIndex,
        setLog.entryIndex,
      );
      if (!resolved)
        throw new Error(
          `Cannot export set ${setLog.setLogId}: its historical prescription is missing.`,
        );
      const prescription = prescriptionAt(resolved.entry, setLog.setIndex);
      if (!prescription)
        throw new Error(
          `Cannot export set ${setLog.setLogId}: its per-set historical prescription is missing.`,
        );
      const values: Array<string | number> = [
        sessionLog.sessionLogId,
        sessionLog.programId,
        sessionLog.programVersion,
        sessionLog.sessionId,
        resolved.sessionName,
        sessionLog.startedAt,
        sessionLog.completedAt ?? '',
        setLog.exerciseId,
        resolved.exerciseName,
        setLog.blockIndex,
        resolved.blockType,
        setLog.entryIndex,
        setLog.setIndex,
        entrySetCount(resolved.entry),
        prescription.reps,
        prescription.repsMax ?? '',
        prescription.targetWeight?.value ?? '',
        prescription.targetWeight?.unit ?? '',
        prescription.targetRpe ?? '',
        setLog.weight.value,
        setLog.weight.unit,
        setLog.reps,
        setLog.rpe ?? '',
        setLog.loggedAt,
      ];
      return values.map(quote).join(',');
    });
  return [CSV_COLUMNS.join(','), ...rows].join('\r\n');
}
