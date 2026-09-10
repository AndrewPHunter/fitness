import rotationJson from '../../../fixtures/programs/02-every-other-day-rotation.json';
import weekdayJson from '../../../fixtures/programs/03-fixed-weekdays.json';
import { validateProgram } from '../program/validateProgram';
import { nextSession } from './nextSession';

function program(value: unknown) {
  const result = validateProgram(value);
  if (!result.ok) throw new Error('Test fixture is invalid.');
  return result.program;
}

describe('nextSession', () => {
  it('wraps rotation by completed count and preserves repeated entries', () => {
    const fixture = program(rotationJson);
    expect(
      nextSession(fixture, 0, '2026-09-10T12:00:00-07:00', 'America/Phoenix').session.sessionId,
    ).toBe('a-squat-bench');
    expect(
      nextSession(fixture, 2, '2026-09-10T12:00:00-07:00', 'America/Phoenix').session.sessionId,
    ).toBe('a-squat-bench');
    expect(
      nextSession(fixture, 7, '2026-09-10T12:00:00-07:00', 'America/Phoenix').session.sessionId,
    ).toBe('a-squat-bench');
  });

  it('uses the injected timezone today and finds the next day from a rest day', () => {
    const fixture = program(weekdayJson);
    expect(nextSession(fixture, 0, '2026-09-09T18:00:00-07:00', 'America/Phoenix')).toMatchObject({
      dayOffset: 0,
      weekday: 'wed',
    });
    expect(nextSession(fixture, 0, '2026-09-10T18:00:00-07:00', 'America/Phoenix')).toMatchObject({
      dayOffset: 1,
      weekday: 'fri',
    });
  });
});
