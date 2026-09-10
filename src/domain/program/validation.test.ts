import structuralFixture from '../../../fixtures/programs/05-invalid-structural.json';
import semanticFixture from '../../../fixtures/programs/06-invalid-semantic.json';
import weekdayFixture from '../../../fixtures/programs/03-fixed-weekdays.json';
import { validateProgram } from './validateProgram';

describe('program validation', () => {
  it('reports exactly the eight actionable structural fixture errors', () => {
    const result = validateProgram(structuralFixture);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(8);
    expect(result.errors.map((error) => error.path)).toEqual([
      '/exercises/1/exerciseId',
      '/exercises/2',
      '/sessions/0/blocks/0/entry/sets',
      '/sessions/0/blocks/1/entry/targetRpe',
      '/sessions/0/blocks/2/entry',
      '/sessions/0/blocks/3/entries',
      '/sessions/1/blocks/0/entry',
      '/version',
    ]);
    expect(result.errors.every((error) => !['IF', 'THEN', 'ALLOF'].includes(error.code))).toBe(
      true,
    );
    expect(result.errors.every((error) => error.message.length > 20)).toBe(true);
  });

  it('reports all seven semantic fixture errors', () => {
    const result = validateProgram(semanticFixture);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(7);
    expect(result.errors.map((error) => error.code).sort()).toEqual([
      'SEM-1',
      'SEM-2',
      'SEM-3',
      'SEM-5',
      'SEM-6',
      'SEM-7',
      'SEM-8',
    ]);
  });

  it('covers the weekday reference rule SEM-4 independently', () => {
    const changed: unknown = {
      ...weekdayFixture,
      schedule: { mode: 'weekdays', days: { tue: 'not-declared' } },
    };
    const result = validateProgram(changed);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      result.errors.some((error) => error.code === 'SEM-4' && error.path === '/schedule/days/tue'),
    ).toBe(true);
  });

  it.each(['SEM-1', 'SEM-2', 'SEM-3', 'SEM-5', 'SEM-6', 'SEM-7', 'SEM-8'])(
    'fixture independently demonstrates %s',
    (code) => {
      const result = validateProgram(semanticFixture);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.some((error) => error.code === code)).toBe(true);
    },
  );
});
