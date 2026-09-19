import type { Session } from '../program/types';
import { orderedPlannedSets, plannedSets } from './plannedSets';

describe('planned sets', () => {
  it('keeps scalar entries unchanged', () => {
    const session: Session = {
      sessionId: 'scalar-day',
      name: 'Scalar day',
      blocks: [
        {
          type: 'single',
          entry: { exerciseId: 'movement', sets: 2, reps: 8, repsMax: 12 },
        },
      ],
    };
    expect(
      plannedSets(session).map(({ setIndex, prescription }) => ({ setIndex, prescription })),
    ).toEqual([
      { setIndex: 0, prescription: { exerciseId: 'movement', sets: 2, reps: 8, repsMax: 12 } },
      { setIndex: 1, prescription: { exerciseId: 'movement', sets: 2, reps: 8, repsMax: 12 } },
    ]);
  });

  it('round-robins uneven array and scalar entries using each entry count', () => {
    const session: Session = {
      sessionId: 'uneven-day',
      name: 'Uneven day',
      blocks: [
        {
          type: 'superset',
          entries: [
            {
              exerciseId: 'movement-a',
              sets: [{ reps: 5 }, { reps: 7 }, { reps: 9, targetRpe: 9 }],
            },
            { exerciseId: 'movement-b', sets: 2, reps: 10, repsMax: 12 },
          ],
        },
      ],
    };
    expect(
      plannedSets(session).map(({ entry, setIndex, prescription }) => ({
        exerciseId: entry.exerciseId,
        setIndex,
        reps: prescription.reps,
        repsMax: prescription.repsMax,
        targetRpe: prescription.targetRpe,
      })),
    ).toEqual([
      { exerciseId: 'movement-a', setIndex: 0, reps: 5 },
      { exerciseId: 'movement-b', setIndex: 0, reps: 10, repsMax: 12 },
      { exerciseId: 'movement-a', setIndex: 1, reps: 7 },
      { exerciseId: 'movement-b', setIndex: 1, reps: 10, repsMax: 12 },
      { exerciseId: 'movement-a', setIndex: 2, reps: 9, targetRpe: 9 },
    ]);
  });

  it('reorders whole blocks while preserving superset round-robin order', () => {
    const session: Session = {
      sessionId: 'reordered-day',
      name: 'Reordered day',
      blocks: [
        { type: 'single', entry: { exerciseId: 'movement-a', sets: 2, reps: 5 } },
        {
          type: 'superset',
          entries: [
            { exerciseId: 'movement-b', sets: 2, reps: 8 },
            { exerciseId: 'movement-c', sets: 2, reps: 10 },
          ],
        },
      ],
    };

    expect(
      orderedPlannedSets(session, [1, 0]).map(
        ({ entry, setIndex }) => `${entry.exerciseId}:${setIndex}`,
      ),
    ).toEqual([
      'movement-b:0',
      'movement-c:0',
      'movement-b:1',
      'movement-c:1',
      'movement-a:0',
      'movement-a:1',
    ]);
  });
});
