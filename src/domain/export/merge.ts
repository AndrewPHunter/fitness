import type { PersistedRoot, ValidationError } from '../program/types';

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length && left.every((value, index) => deepEqual(value, right[index]))
    );
  if (
    typeof left === 'object' &&
    left !== null &&
    typeof right === 'object' &&
    right !== null &&
    !Array.isArray(left) &&
    !Array.isArray(right)
  ) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return (
      deepEqual(leftKeys, rightKeys) &&
      leftKeys.every((key) =>
        deepEqual(
          Object.getOwnPropertyDescriptor(left, key)?.value,
          Object.getOwnPropertyDescriptor(right, key)?.value,
        ),
      )
    );
  }
  return false;
}

export type MergeResult =
  { ok: true; data: PersistedRoot } | { ok: false; errors: ValidationError[] };

export function mergePersistedRoots(current: PersistedRoot, incoming: PersistedRoot): MergeResult {
  const errors: ValidationError[] = [];
  const programMap = new Map(
    current.programs.map((stored) => [
      `${stored.program.programId}@${stored.program.version}`,
      stored,
    ]),
  );
  for (const stored of incoming.programs) {
    const key = `${stored.program.programId}@${stored.program.version}`;
    const existing = programMap.get(key);
    if (existing && !deepEqual(existing, stored))
      errors.push({
        layer: 'storage',
        code: 'IMP-7_PROGRAM_CONFLICT',
        path: '/data/programs',
        message: `Program ${key} exists in both data sets with different content. Nothing was imported.`,
      });
    else if (!existing) programMap.set(key, stored);
  }

  const sessionMap = new Map(current.sessionLogs.map((log) => [log.sessionLogId, log]));
  const setMap = new Map(
    current.sessionLogs.flatMap((log) =>
      log.setLogs.map((setLog) => [setLog.setLogId, setLog] as const),
    ),
  );
  for (const log of incoming.sessionLogs) {
    const existing = sessionMap.get(log.sessionLogId);
    if (existing && !deepEqual(existing, log))
      errors.push({
        layer: 'storage',
        code: 'IMP-7_SESSION_CONFLICT',
        path: '/data/sessionLogs',
        message: `Session log ${JSON.stringify(log.sessionLogId)} exists on both sides with different content. Nothing was imported.`,
      });
    if (!existing) {
      for (const setLog of log.setLogs) {
        const existingSet = setMap.get(setLog.setLogId);
        if (existingSet)
          errors.push({
            layer: 'storage',
            code: 'IMP-7_SET_CONFLICT',
            path: '/data/sessionLogs',
            message: `Set log ${JSON.stringify(setLog.setLogId)} is already attached to another session. Nothing was imported.`,
          });
      }
      if (errors.length === 0) {
        sessionMap.set(log.sessionLogId, log);
        log.setLogs.forEach((setLog) => setMap.set(setLog.setLogId, setLog));
      }
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      ...current,
      programs: [...programMap.values()],
      sessionLogs: [...sessionMap.values()],
    },
  };
}
