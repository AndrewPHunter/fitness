import type { PersistedRoot } from '../program/types';

export interface PersistedRootV0 {
  schemaVersion: 0;
  programs: PersistedRoot['programs'];
  sessionLogs: PersistedRoot['sessionLogs'];
  activeProgram: PersistedRoot['activeProgram'];
}

export function migrateV0ToV1(root: PersistedRootV0): PersistedRoot {
  return {
    schemaVersion: 1,
    programs: root.programs,
    sessionLogs: root.sessionLogs,
    activeProgram: root.activeProgram,
    settings: { defaultUnit: 'kg', theme: 'system' },
  };
}

export const migrations = new Map<number, (value: PersistedRootV0) => PersistedRoot>([
  [0, migrateV0ToV1],
]);
