import oldRoot from '../../../test-fixtures/persisted-v0.json';
import { decodePersistedRoot } from '../persistence/validateRoot';

it('runs the registered v0 to v1 migration', () => {
  const result = decodePersistedRoot(oldRoot);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.migrated).toBe(true);
  expect(result.data).toEqual({
    ...oldRoot,
    schemaVersion: 1,
    settings: { defaultUnit: 'kg', theme: 'system' },
  });
});
