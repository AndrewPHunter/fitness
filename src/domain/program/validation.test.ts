import structuralFixture from '../../../fixtures/programs/05-invalid-structural.json';
import semanticFixture from '../../../fixtures/programs/06-invalid-semantic.json';
import rangeAndPerSetFixture from '../../../fixtures/programs/07-ranges-and-per-set.json';
import weekdayFixture from '../../../fixtures/programs/03-fixed-weekdays.json';
import { validateProgram } from './validateProgram';

function documentWithEntry(entry: Record<string, unknown>): unknown {
  return {
    programId: 'validation-example',
    version: 1,
    name: 'Validation example',
    exercises: [{ exerciseId: 'movement', name: 'Movement' }],
    sessions: [
      {
        sessionId: 'training-day',
        name: 'Training day',
        blocks: [{ type: 'single', entry: { exerciseId: 'movement', ...entry } }],
      },
    ],
    schedule: { mode: 'rotation', sequence: ['training-day'] },
  };
}

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

  it('accepts the committed range and per-set fixture', () => {
    expect(validateProgram(rangeAndPerSetFixture)).toMatchObject({ ok: true });
  });

  it.each([8, 7])('enforces a strictly greater repsMax when the maximum is %i', (repsMax) => {
    const result = validateProgram(documentWithEntry({ sets: 3, reps: 8, repsMax }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      expect.objectContaining({
        code: 'SEM-9',
        path: '/sessions/0/blocks/0/entry/repsMax',
        message: expect.stringMatching(/repsMax must be greater than reps.*remove it/u),
      }),
    ]);
  });

  it('enforces repsMax inside each per-set prescription', () => {
    const result = validateProgram(
      documentWithEntry({ sets: [{ reps: 5 }, { reps: 10, repsMax: 10 }] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      expect.objectContaining({
        code: 'SEM-9',
        path: '/sessions/0/blocks/0/entry/sets/1/repsMax',
      }),
    ]);
  });

  it('rejects every entry-level set field beside an array and says where each belongs', () => {
    const conflicting = {
      sets: [{ reps: 5 }],
      reps: 8,
      repsMax: 12,
      targetWeight: { value: 40, unit: 'kg' },
      targetRpe: 8,
      restSeconds: 90,
    };
    const result = validateProgram(documentWithEntry(conflicting));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(5);
    for (const field of ['reps', 'repsMax', 'restSeconds', 'targetRpe', 'targetWeight']) {
      const error = result.errors.find((candidate) => candidate.path.endsWith(`/${field}`));
      expect(error).toMatchObject({ code: 'SEM-11' });
      expect(error?.message).toContain(JSON.stringify(field));
      expect(error?.message).toContain('/sessions/0/blocks/0/entry/sets');
    }
  });

  it('reports one structural error for a malformed sets value', () => {
    const result = validateProgram(documentWithEntry({ sets: 'three', reps: 5 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      expect.objectContaining({
        code: 'TYPE',
        path: '/sessions/0/blocks/0/entry/sets',
      }),
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
