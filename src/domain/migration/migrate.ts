import type { PersistedRoot } from '../program/types';
import {
  migrateV0ToV1,
  migrateV1ToV2,
  migrateV2ToV3,
  type PersistedRootV0,
  type PersistedRootV1,
  type PersistedRootV2,
} from './migrations';

export const CURRENT_SCHEMA_VERSION = 3;

export function migrateV0ToCurrent(root: PersistedRootV0): PersistedRoot {
  return migrateV2ToV3(migrateV1ToV2(migrateV0ToV1(root)));
}

export function migrateV1ToCurrent(root: PersistedRootV1): PersistedRoot {
  return migrateV2ToV3(migrateV1ToV2(root));
}

export function migrateV2ToCurrent(root: PersistedRootV2): PersistedRoot {
  return migrateV2ToV3(root);
}
