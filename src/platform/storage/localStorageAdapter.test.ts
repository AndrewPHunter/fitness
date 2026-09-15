import { freshRoot } from '../../domain/persistence/validateRoot';
import versionOneRoot from '../../../test-fixtures/persisted-v1.json';
import { createLocalStorageAdapter, STORAGE_KEY } from './localStorageAdapter';

class QuotaStorage implements Storage {
  readonly length = 0;
  clear(): void {}
  getItem(): string | null {
    return null;
  }
  key(): string | null {
    return null;
  }
  removeItem(): void {}
  setItem(): void {
    throw new DOMException('Full', 'QuotaExceededError');
  }
}

describe('localStorage adapter', () => {
  it('turns a real thrown QuotaExceededError into an explicit failure', () => {
    const adapter = createLocalStorageAdapter(new QuotaStorage());
    expect(adapter.save(freshRoot())).toMatchObject({ ok: false, reason: 'quota' });
  });

  it('refuses newer and malformed data without resetting it', () => {
    const newer = JSON.stringify({ schemaVersion: 999 });
    const storage = window.localStorage;
    storage.setItem(STORAGE_KEY, newer);
    const result = createLocalStorageAdapter(storage).load();
    expect(result.ok).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(newer);
    storage.setItem(STORAGE_KEY, '{bad');
    const malformed = createLocalStorageAdapter(storage).load();
    expect(malformed.ok).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe('{bad');
    storage.clear();
  });

  it('persists the v1 to v2 migration before returning training data', () => {
    const storage = window.localStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(versionOneRoot));
    const result = createLocalStorageAdapter(storage).load();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.schemaVersion).toBe(2);
    expect(result.data.sessionLogs[0]?.skippedExercises).toEqual([]);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null')).toEqual(result.data);
    storage.clear();
  });
});
