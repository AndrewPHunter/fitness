import type { PersistedRoot, ValidationError } from '../../domain/program/types';

export type WriteResult =
  { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'serialisation'; detail: string };

export type LoadResult =
  { ok: true; data: PersistedRoot } | { ok: false; errors: ValidationError[]; raw: string | null };

export interface StorageAdapter {
  load(): LoadResult;
  save(data: PersistedRoot): WriteResult;
  usageBytes(): number;
  raw(): string | null;
}
