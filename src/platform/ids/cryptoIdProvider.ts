import type { IdProvider } from './IdProvider';

export const cryptoIdProvider: IdProvider = { next: () => crypto.randomUUID() };
