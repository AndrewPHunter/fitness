import type { Load, SessionLog, SetLog } from '../program/types';

export function allSetLogs(sessionLogs: SessionLog[]): SetLog[] {
  return sessionLogs.flatMap((sessionLog) => sessionLog.setLogs);
}

export function lastLoggedWeight(setLogs: SetLog[], exerciseId: string): Load | null {
  const latest = setLogs
    .filter((setLog) => setLog.exerciseId === exerciseId)
    .sort((left, right) => {
      const time = right.loggedAt.localeCompare(left.loggedAt);
      return time === 0 ? right.setLogId.localeCompare(left.setLogId) : time;
    })[0];
  return latest ? latest.weight : null;
}

export function prefillWeight(
  setLogs: SetLog[],
  exerciseId: string,
  targetWeight?: Load,
): Load | null {
  return lastLoggedWeight(setLogs, exerciseId) ?? targetWeight ?? null;
}

export function exerciseHistory(setLogs: SetLog[], exerciseId: string): SetLog[] {
  return setLogs
    .filter((setLog) => setLog.exerciseId === exerciseId)
    .sort((left, right) => {
      const time = right.loggedAt.localeCompare(left.loggedAt);
      return time === 0 ? right.setLogId.localeCompare(left.setLogId) : time;
    });
}

function dateKey(iso: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function dayNumber(key: string): number {
  const [year = '0', month = '1', day = '1'] = key.split('-');
  return Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86_400_000);
}

export function observedFrequency(
  setLogs: SetLog[],
  exerciseId: string,
  now: string,
  windowDays: number,
  timezone: string,
): number {
  const today = dayNumber(dateKey(now, timezone));
  const days = new Set(
    setLogs
      .filter((setLog) => setLog.exerciseId === exerciseId)
      .map((setLog) => dateKey(setLog.loggedAt, timezone))
      .filter((key) => {
        const age = today - dayNumber(key);
        return age >= 0 && age < windowDays;
      }),
  );
  return days.size;
}
