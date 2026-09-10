import type { Clock } from './Clock';

function isoWithOffset(date: Date): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? '+' : '-';
  const offset = `${sign}${pad(Math.floor(Math.abs(minutes) / 60))}:${pad(Math.abs(minutes) % 60)}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}${offset}`;
}

export const systemClock: Clock = {
  now: () => isoWithOffset(new Date()),
  timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
};
