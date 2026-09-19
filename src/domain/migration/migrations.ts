import type { PersistedRoot, SessionLog } from '../program/types';

export type SessionLogV1 = Omit<SessionLog, 'skippedExercises'>;

export interface PersistedRootV1 {
  schemaVersion: 1;
  programs: PersistedRoot['programs'];
  sessionLogs: SessionLogV1[];
  settings: PersistedRoot['settings'];
  activeProgram: PersistedRoot['activeProgram'];
}

export type PersistedRootV2 = Omit<PersistedRoot, 'schemaVersion' | 'workoutOrders'> & {
  schemaVersion: 2;
};

export interface PersistedRootV0 {
  schemaVersion: 0;
  programs: PersistedRoot['programs'];
  sessionLogs: SessionLogV1[];
  activeProgram: PersistedRoot['activeProgram'];
}

export function migrateV0ToV1(root: PersistedRootV0): PersistedRootV1 {
  return {
    schemaVersion: 1,
    programs: root.programs,
    sessionLogs: root.sessionLogs,
    activeProgram: root.activeProgram,
    settings: { defaultUnit: 'kg', theme: 'system' },
  };
}

export function migrateV1ToV2(root: PersistedRootV1): PersistedRootV2 {
  return {
    ...root,
    schemaVersion: 2,
    sessionLogs: root.sessionLogs.map((sessionLog) => ({
      ...sessionLog,
      skippedExercises: [],
    })),
  };
}

export function migrateV2ToV3(root: PersistedRootV2): PersistedRoot {
  return {
    ...root,
    schemaVersion: 3,
    workoutOrders: [],
  };
}
