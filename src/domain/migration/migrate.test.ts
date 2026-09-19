import oldRoot from '../../../test-fixtures/persisted-v0.json';
import versionOneRoot from '../../../test-fixtures/persisted-v1.json';
import { migrateV1ToV2, type PersistedRootV1 } from './migrations';
import { decodePersistedRoot } from '../persistence/validateRoot';

it('runs every registered migration from v0 to the current version', () => {
  const result = decodePersistedRoot(oldRoot);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.migrated).toBe(true);
  expect(result.data).toEqual({
    ...oldRoot,
    schemaVersion: 3,
    settings: { defaultUnit: 'kg', theme: 'system' },
    workoutOrders: [],
  });
});

it('runs every registered migration from v1 to the current version', () => {
  const result = decodePersistedRoot(versionOneRoot);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.migrated).toBe(true);
  expect(result.data).toEqual({
    ...versionOneRoot,
    schemaVersion: 3,
    workoutOrders: [],
    sessionLogs: versionOneRoot.sessionLogs.map((sessionLog) => ({
      ...sessionLog,
      skippedExercises: [],
    })),
  });
});

it('adds workout orders when migrating v2 data without changing training history', () => {
  const versionTwoRoot = migrateV1ToV2(versionOneRoot as PersistedRootV1);
  const result = decodePersistedRoot(versionTwoRoot);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.migrated).toBe(true);
  expect(result.data).toEqual({
    ...versionTwoRoot,
    schemaVersion: 3,
    workoutOrders: [],
  });
});
