import type { PersistedRoot } from '../program/types';
import { migrateV0ToV1, type PersistedRootV0 } from './migrations';

export const CURRENT_SCHEMA_VERSION = 1;

export function migrate(root: PersistedRootV0 | PersistedRoot): PersistedRoot {
  if ('settings' in root && root.schemaVersion === CURRENT_SCHEMA_VERSION) return root;
  if (!('settings' in root) && root.schemaVersion === 0) return migrateV0ToV1(root);
  throw new Error(
    `No forward migration is registered from schema version ${String(root.schemaVersion)}.`,
  );
}
