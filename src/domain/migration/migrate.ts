import type { PersistedRoot } from '../program/types';
import {
  migrateV0ToV1,
  migrateV1ToV2,
  type PersistedRootV0,
  type PersistedRootV1,
} from './migrations';

export const CURRENT_SCHEMA_VERSION = 2;

export function migrateV0ToCurrent(root: PersistedRootV0): PersistedRoot {
  return migrateV1ToV2(migrateV0ToV1(root));
}

export function migrateV1ToCurrent(root: PersistedRootV1): PersistedRoot {
  return migrateV1ToV2(root);
}
