import type { IdProvider } from './IdProvider';

/** Deterministic test double. It is never imported by production composition. */
export function sequentialIdProvider(prefix = 'test-id'): IdProvider {
  let counter = 0;
  return { next: () => `${prefix}-${String((counter += 1))}` };
}
