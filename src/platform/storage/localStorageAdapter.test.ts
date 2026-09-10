import { freshRoot } from '../../domain/persistence/validateRoot';
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
});
