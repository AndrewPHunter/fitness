import oldRoot from '../../../test-fixtures/persisted-v0.json';
import versionOneRoot from '../../../test-fixtures/persisted-v1.json';
import { decodePersistedRoot } from '../persistence/validateRoot';

it('runs every registered migration from v0 to the current version', () => {
  const result = decodePersistedRoot(oldRoot);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.migrated).toBe(true);
  expect(result.data).toEqual({
    ...oldRoot,
    schemaVersion: 2,
    settings: { defaultUnit: 'kg', theme: 'system' },
  });
});

it('runs the registered v1 to v2 migration', () => {
  const result = decodePersistedRoot(versionOneRoot);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.migrated).toBe(true);
  expect(result.data).toEqual({
    ...versionOneRoot,
    schemaVersion: 2,
    sessionLogs: versionOneRoot.sessionLogs.map((sessionLog) => ({
      ...sessionLog,
      skippedExercises: [],
    })),
  });
});
