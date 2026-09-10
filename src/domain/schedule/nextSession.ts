import type { Program, Session, Weekday } from '../program/types';

const weekdayOrder: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export interface NextSession {
  session: Session;
  dayOffset: number;
  weekday: Weekday | null;
}

function weekdayAt(iso: string, timezone: string): Weekday {
  const date = new Date(iso);
  const short = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' })
    .format(date)
    .toLowerCase();
  const weekday = weekdayOrder.find((candidate) => candidate === short);
  if (!weekday) throw new Error(`Unable to resolve weekday for timezone ${timezone}.`);
  return weekday;
}

export function nextSession(
  program: Program,
  completedCount: number,
  now: string,
  timezone: string,
): NextSession {
  if (program.schedule.mode === 'rotation') {
    const sessionId = program.schedule.sequence[completedCount % program.schedule.sequence.length];
    const session = program.sessions.find((candidate) => candidate.sessionId === sessionId);
    if (!session) throw new Error(`Validated program is missing session ${String(sessionId)}.`);
    return { session, dayOffset: 0, weekday: null };
  }

  const today = weekdayAt(now, timezone);
  const todayIndex = weekdayOrder.indexOf(today);
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const weekday = weekdayOrder[(todayIndex + dayOffset) % weekdayOrder.length];
    if (!weekday) throw new Error('Weekday sequence could not be resolved.');
    const sessionId = program.schedule.days[weekday];
    if (sessionId) {
      const session = program.sessions.find((candidate) => candidate.sessionId === sessionId);
      if (!session) throw new Error(`Validated program is missing session ${sessionId}.`);
      return { session, dayOffset, weekday };
    }
  }
  throw new Error('A validated weekday schedule must contain a training day.');
}
