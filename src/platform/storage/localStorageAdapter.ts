import { decodePersistedRoot, freshRoot } from '../../domain/persistence/validateRoot';
import type { ValidationError } from '../../domain/program/types';
import type { LoadResult, StorageAdapter, WriteResult } from './StorageAdapter';

export const STORAGE_KEY = 'fitness.v1.root';

function storageError(code: string, message: string): ValidationError {
  return { layer: 'storage', code, path: '', message };
}

function reason(error: unknown): Extract<WriteResult, { ok: false }> {
  if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
    return {
      ok: false,
      reason: 'quota',
      detail: 'Browser storage is full. Export your history, then prune data before trying again.',
    };
  }
  return {
    ok: false,
    reason: 'unavailable',
    detail: error instanceof Error ? error.message : 'Browser storage is unavailable or blocked.',
  };
}

export function createLocalStorageAdapter(storage: Storage): StorageAdapter {
  return {
    load(): LoadResult {
      let raw: string | null;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch (error: unknown) {
        const failure = reason(error);
        return {
          ok: false,
          raw: null,
          errors: [
            storageError(
              'STORAGE_UNAVAILABLE',
              `Training data could not be read. ${failure.detail}`,
            ),
          ],
        };
      }
      if (raw === null) return { ok: true, data: freshRoot() };
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch (error: unknown) {
        return {
          ok: false,
          raw,
          errors: [
            storageError(
              'STORAGE_PARSE_ERROR',
              `Stored training data is not valid JSON and was not reset. Download the raw copy before taking any action. ${error instanceof Error ? error.message : ''}`,
            ),
          ],
        };
      }
      const decoded = decodePersistedRoot(value);
      if (!decoded.ok) return { ok: false, raw, errors: decoded.errors };
      if (decoded.migrated) {
        const write = this.save(decoded.data);
        if (!write.ok)
          return {
            ok: false,
            raw,
            errors: [
              storageError(
                'MIGRATION_WRITE_FAILED',
                `Data was migrated in memory but could not be saved, so the app stopped. ${write.detail}`,
              ),
            ],
          };
      }
      return { ok: true, data: decoded.data };
    },
    save(data): WriteResult {
      let serialised: string;
      try {
        serialised = JSON.stringify(data);
      } catch (error: unknown) {
        return {
          ok: false,
          reason: 'serialisation',
          detail: error instanceof Error ? error.message : 'Training data could not be serialised.',
        };
      }
      try {
        storage.setItem(STORAGE_KEY, serialised);
        return { ok: true };
      } catch (error: unknown) {
        return reason(error);
      }
    },
    usageBytes(): number {
      try {
        const raw = storage.getItem(STORAGE_KEY) ?? '';
        return new Blob([raw]).size;
      } catch {
        return 0;
      }
    },
    raw(): string | null {
      try {
        return storage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
  };
}

export function createBrowserStorageAdapter(): StorageAdapter {
  return createLocalStorageAdapter(window.localStorage);
}
