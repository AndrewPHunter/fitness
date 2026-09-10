import { freshRoot } from '../../domain/persistence/validateRoot';
import type { PersistedRoot } from '../../domain/program/types';
import type { LoadResult, StorageAdapter, WriteResult } from './StorageAdapter';

/** Deterministic test double. It is never imported by production composition. */
export function createMemoryAdapter(initial: PersistedRoot = freshRoot()): StorageAdapter {
  let value = initial;
  return {
    load: (): LoadResult => ({ ok: true, data: value }),
    save(data): WriteResult {
      value = data;
      return { ok: true };
    },
    usageBytes: () => new Blob([JSON.stringify(value)]).size,
    raw: () => JSON.stringify(value),
  };
}
