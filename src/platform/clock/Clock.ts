export interface Clock {
  now(): string;
  timezone(): string;
}
