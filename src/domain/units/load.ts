import type { Load } from '../program/types';

export function formatLoad(load: Load): string {
  return `${String(load.value)} ${load.unit}`;
}

export function sameLoad(left: Load, right: Load): boolean {
  return left.value === right.value && left.unit === right.unit;
}
