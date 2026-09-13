import { isPerSetEntry } from './prescription';
import type { ExerciseEntry, PerSetPrescription, Program, ValidationError } from './types';

interface EntryLocation {
  entry: ExerciseEntry;
  path: string;
}

function entries(program: Program): EntryLocation[] {
  return program.sessions.flatMap((session, sessionIndex) =>
    session.blocks.flatMap((block, blockIndex) => {
      if (block.type === 'single') {
        return [
          {
            entry: block.entry,
            path: `/sessions/${sessionIndex}/blocks/${blockIndex}/entry`,
          },
        ];
      }
      return block.entries.map((entry, entryIndex): EntryLocation => ({
        entry,
        path: `/sessions/${sessionIndex}/blocks/${blockIndex}/entries/${entryIndex}`,
      }));
    }),
  );
}

function validateRepRange(prescription: PerSetPrescription, path: string): ValidationError | null {
  if (prescription.repsMax === undefined || prescription.repsMax > prescription.reps) return null;
  return {
    layer: 'semantic',
    code: 'SEM-9',
    path: `${path}/repsMax`,
    message: `repsMax must be greater than reps to form a range; found reps ${prescription.reps} and repsMax ${prescription.repsMax}. Increase repsMax or remove it for a fixed rep target.`,
  };
}

export function validateSemantics(program: Program): ValidationError[] {
  const errors: ValidationError[] = [];
  const declaredExercises = new Set(program.exercises.map((exercise) => exercise.exerciseId));
  const declaredSessions = new Set(program.sessions.map((session) => session.sessionId));
  const referencedEntries = entries(program);

  for (const { entry, path } of referencedEntries) {
    if (!declaredExercises.has(entry.exerciseId)) {
      errors.push({
        layer: 'semantic',
        code: 'SEM-1',
        path: `${path}/exerciseId`,
        message: `Exercise ${JSON.stringify(entry.exerciseId)} must be declared in /exercises.`,
      });
    }
  }
  for (const [index, target] of (program.frequencyTargets ?? []).entries()) {
    if (!declaredExercises.has(target.exerciseId)) {
      errors.push({
        layer: 'semantic',
        code: 'SEM-2',
        path: `/frequencyTargets/${index}/exerciseId`,
        message: `Exercise ${JSON.stringify(target.exerciseId)} must be declared in /exercises.`,
      });
    }
  }
  if (program.schedule.mode === 'rotation') {
    program.schedule.sequence.forEach((sessionId, index) => {
      if (!declaredSessions.has(sessionId))
        errors.push({
          layer: 'semantic',
          code: 'SEM-3',
          path: `/schedule/sequence/${index}`,
          message: `Session ${JSON.stringify(sessionId)} must be declared in /sessions.`,
        });
    });
  } else {
    Object.entries(program.schedule.days).forEach(([day, sessionId]) => {
      if (!declaredSessions.has(sessionId))
        errors.push({
          layer: 'semantic',
          code: 'SEM-4',
          path: `/schedule/days/${day}`,
          message: `Session ${JSON.stringify(sessionId)} must be declared in /sessions.`,
        });
    });
  }

  const firstExercise = new Map<string, number>();
  program.exercises.forEach((exercise, index) => {
    const first = firstExercise.get(exercise.exerciseId);
    if (first !== undefined)
      errors.push({
        layer: 'semantic',
        code: 'SEM-5',
        path: `/exercises/${index}/exerciseId`,
        message: `Duplicate exerciseId ${JSON.stringify(exercise.exerciseId)}; first declared at /exercises/${first}.`,
      });
    else firstExercise.set(exercise.exerciseId, index);
  });
  const firstSession = new Map<string, number>();
  program.sessions.forEach((session, index) => {
    const first = firstSession.get(session.sessionId);
    if (first !== undefined)
      errors.push({
        layer: 'semantic',
        code: 'SEM-6',
        path: `/sessions/${index}/sessionId`,
        message: `Duplicate sessionId ${JSON.stringify(session.sessionId)}; first declared at /sessions/${first}.`,
      });
    else firstSession.set(session.sessionId, index);
  });

  const referencedExercises = new Set(referencedEntries.map(({ entry }) => entry.exerciseId));
  program.exercises.forEach((exercise, index) => {
    if (!referencedExercises.has(exercise.exerciseId))
      errors.push({
        layer: 'semantic',
        code: 'SEM-7',
        path: `/exercises/${index}`,
        message: `Exercise ${JSON.stringify(exercise.exerciseId)} must be referenced by at least one session.`,
      });
  });
  const reachable = new Set(
    program.schedule.mode === 'rotation'
      ? program.schedule.sequence
      : Object.values(program.schedule.days),
  );
  program.sessions.forEach((session, index) => {
    if (!reachable.has(session.sessionId))
      errors.push({
        layer: 'semantic',
        code: 'SEM-8',
        path: `/sessions/${index}`,
        message: `Session ${JSON.stringify(session.sessionId)} must be reachable from the schedule.`,
      });
  });

  const entryLevelSetFields = [
    'reps',
    'repsMax',
    'targetWeight',
    'targetRpe',
    'restSeconds',
  ] as const;
  for (const { entry, path } of referencedEntries) {
    if (isPerSetEntry(entry)) {
      const rawEntry = entry as unknown as Record<string, unknown>;
      for (const field of entryLevelSetFields) {
        if (!Object.hasOwn(rawEntry, field)) continue;
        errors.push({
          layer: 'semantic',
          code: 'SEM-11',
          path: `${path}/${field}`,
          message: `Entry-level field ${JSON.stringify(field)} is not allowed when sets is an array. Move ${JSON.stringify(field)} into the applicable object or objects in ${path}/sets.`,
        });
      }
      entry.sets.forEach((prescription, setIndex) => {
        const error = validateRepRange(prescription, `${path}/sets/${setIndex}`);
        if (error) errors.push(error);
      });
    } else {
      const error = validateRepRange(entry, path);
      if (error) errors.push(error);
    }
  }

  return errors.sort(
    (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
  );
}
