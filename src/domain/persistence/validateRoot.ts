import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';
import programSchema from '../../../fixtures/schema/program.schema.json';
import {
  CURRENT_SCHEMA_VERSION,
  migrateV0ToCurrent,
  migrateV1ToCurrent,
} from '../migration/migrate';
import type { PersistedRootV0, PersistedRootV1 } from '../migration/migrations';
import type { PersistedRoot, ValidationError } from '../program/types';
import { validateSemantics } from '../program/validateSemantics';

const loadSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['value', 'unit'],
  properties: {
    value: { type: 'number', exclusiveMinimum: 0, maximum: 2000 },
    unit: { enum: ['kg', 'lb'] },
  },
};

const setLogSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'setLogId',
    'exerciseId',
    'blockIndex',
    'entryIndex',
    'setIndex',
    'weight',
    'reps',
    'rpe',
    'loggedAt',
  ],
  properties: {
    setLogId: { type: 'string', minLength: 1 },
    exerciseId: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
    blockIndex: { type: 'integer', minimum: 0 },
    entryIndex: { type: 'integer', minimum: 0 },
    setIndex: { type: 'integer', minimum: 0 },
    weight: loadSchema,
    reps: { type: 'integer', minimum: 0 },
    rpe: {
      anyOf: [{ type: 'null' }, { type: 'number', minimum: 1, maximum: 10, multipleOf: 0.5 }],
    },
    loggedAt: { type: 'string', minLength: 1 },
  },
};

const storedProgramSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['program', 'importedAt'],
  properties: {
    program: { $ref: 'https://andrewphunter.github.io/fitness/schema/program.schema.json' },
    importedAt: { type: 'string', minLength: 1 },
  },
};

const sessionLogV1Schema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'sessionLogId',
    'programId',
    'programVersion',
    'sessionId',
    'startedAt',
    'completedAt',
    'setLogs',
  ],
  properties: {
    sessionLogId: { type: 'string', minLength: 1 },
    programId: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
    programVersion: { type: 'integer', minimum: 1 },
    sessionId: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
    startedAt: { type: 'string', minLength: 1 },
    completedAt: { anyOf: [{ type: 'null' }, { type: 'string', minLength: 1 }] },
    setLogs: { type: 'array', items: setLogSchema },
    notes: { type: 'string' },
  },
};

const skippedExerciseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['exerciseId', 'blockIndex', 'entryIndex', 'skippedAt'],
  properties: {
    exerciseId: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
    blockIndex: { type: 'integer', minimum: 0 },
    entryIndex: { type: 'integer', minimum: 0 },
    skippedAt: { type: 'string', minLength: 1 },
  },
};

const sessionLogSchema = {
  ...sessionLogV1Schema,
  required: [...sessionLogV1Schema.required, 'skippedExercises'],
  properties: {
    ...sessionLogV1Schema.properties,
    skippedExercises: { type: 'array', items: skippedExerciseSchema },
  },
};

const commonProperties = {
  programs: { type: 'array', items: storedProgramSchema },
  activeProgram: {
    anyOf: [
      { type: 'null' },
      {
        type: 'object',
        additionalProperties: false,
        required: ['programId', 'version'],
        properties: {
          programId: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
          version: { type: 'integer', minimum: 1 },
        },
      },
    ],
  },
};

export const persistedRootSchema = {
  $id: 'fitness-persisted-root-v2',
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'programs', 'sessionLogs', 'settings', 'activeProgram'],
  properties: {
    schemaVersion: { const: 2 },
    ...commonProperties,
    sessionLogs: { type: 'array', items: sessionLogSchema },
    settings: {
      type: 'object',
      additionalProperties: false,
      required: ['defaultUnit', 'theme'],
      properties: {
        defaultUnit: { enum: ['kg', 'lb'] },
        theme: { enum: ['system', 'light', 'dark'] },
      },
    },
  },
};

const persistedRootV1Schema = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'programs', 'sessionLogs', 'settings', 'activeProgram'],
  properties: {
    schemaVersion: { const: 1 },
    ...commonProperties,
    sessionLogs: { type: 'array', items: sessionLogV1Schema },
    settings: {
      type: 'object',
      additionalProperties: false,
      required: ['defaultUnit', 'theme'],
      properties: {
        defaultUnit: { enum: ['kg', 'lb'] },
        theme: { enum: ['system', 'light', 'dark'] },
      },
    },
  },
};

const persistedRootV0Schema = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'programs', 'sessionLogs', 'activeProgram'],
  properties: {
    schemaVersion: { const: 0 },
    ...commonProperties,
    sessionLogs: { type: 'array', items: sessionLogV1Schema },
  },
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(programSchema);
const validateCurrent = ajv.compile<PersistedRoot>(persistedRootSchema);
const validateV1 = ajv.compile<PersistedRootV1>(persistedRootV1Schema);
const validateV0 = ajv.compile<PersistedRootV0>(persistedRootV0Schema);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function versionOf(value: unknown): unknown {
  return isRecord(value) ? value.schemaVersion : undefined;
}

function errorsFromAjv(errors: ErrorObject[] | null | undefined): ValidationError[] {
  const control = new Set(['if', 'then', 'else', 'allOf', 'anyOf', 'oneOf', 'not']);
  return (errors ?? [])
    .filter((error) => !control.has(error.keyword))
    .map((error) => ({
      layer: 'structural' as const,
      code: `DATA_${error.keyword.toUpperCase()}`,
      path: `/data${error.instancePath}`,
      message: `Stored data ${error.message ?? 'does not match the required structure'}.`,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function integrityErrors(root: PersistedRoot): ValidationError[] {
  const errors: ValidationError[] = [];
  const programs = new Map(
    root.programs.map(({ program }) => [`${program.programId}@${program.version}`, program]),
  );
  const programIds = new Set<string>();
  root.programs.forEach(({ program }, index) => {
    const identity = `${program.programId}@${program.version}`;
    if (programIds.has(identity))
      errors.push({
        layer: 'semantic',
        code: 'DATA_DUPLICATE_PROGRAM',
        path: `/data/programs/${index}`,
        message: `Program ${identity} occurs more than once.`,
      });
    programIds.add(identity);
    validateSemantics(program).forEach((error) =>
      errors.push({ ...error, path: `/data/programs/${index}/program${error.path}` }),
    );
  });

  const sessionIds = new Set<string>();
  const setIds = new Set<string>();
  root.sessionLogs.forEach((sessionLog, sessionIndex) => {
    if (sessionIds.has(sessionLog.sessionLogId))
      errors.push({
        layer: 'semantic',
        code: 'DATA_DUPLICATE_SESSION_LOG',
        path: `/data/sessionLogs/${sessionIndex}/sessionLogId`,
        message: `sessionLogId ${JSON.stringify(sessionLog.sessionLogId)} occurs more than once.`,
      });
    sessionIds.add(sessionLog.sessionLogId);
    const program = programs.get(`${sessionLog.programId}@${sessionLog.programVersion}`);
    if (!program) {
      errors.push({
        layer: 'semantic',
        code: 'IMP-5',
        path: `/data/sessionLogs/${sessionIndex}`,
        message: `Session log must reference a programId and version present in this backup.`,
      });
      return;
    }
    const session = program.sessions.find(
      (candidate) => candidate.sessionId === sessionLog.sessionId,
    );
    if (!session)
      errors.push({
        layer: 'semantic',
        code: 'DATA_SESSION_REFERENCE',
        path: `/data/sessionLogs/${sessionIndex}/sessionId`,
        message: `Session ${JSON.stringify(sessionLog.sessionId)} must exist in program ${program.programId} v${program.version}.`,
      });
    const skippedPositions = new Set<string>();
    sessionLog.skippedExercises.forEach((skipped, skippedIndex) => {
      const position = `${skipped.blockIndex}:${skipped.entryIndex}`;
      if (skippedPositions.has(position))
        errors.push({
          layer: 'semantic',
          code: 'DATA_DUPLICATE_SKIPPED_EXERCISE',
          path: `/data/sessionLogs/${sessionIndex}/skippedExercises/${skippedIndex}`,
          message: `Exercise position ${position} is skipped more than once.`,
        });
      skippedPositions.add(position);
      const block = session?.blocks[skipped.blockIndex];
      const entry =
        block?.type === 'single'
          ? skipped.entryIndex === 0
            ? block.entry
            : undefined
          : block?.entries[skipped.entryIndex];
      if (!entry || entry.exerciseId !== skipped.exerciseId)
        errors.push({
          layer: 'semantic',
          code: 'DATA_SKIPPED_EXERCISE_REFERENCE',
          path: `/data/sessionLogs/${sessionIndex}/skippedExercises/${skippedIndex}`,
          message: `Skipped exercise must match an entry in the logged session prescription.`,
        });
    });
    sessionLog.setLogs.forEach((setLog, setIndex) => {
      if (setIds.has(setLog.setLogId))
        errors.push({
          layer: 'semantic',
          code: 'DATA_DUPLICATE_SET_LOG',
          path: `/data/sessionLogs/${sessionIndex}/setLogs/${setIndex}/setLogId`,
          message: `setLogId ${JSON.stringify(setLog.setLogId)} occurs more than once.`,
        });
      setIds.add(setLog.setLogId);
      if (!program.exercises.some((exercise) => exercise.exerciseId === setLog.exerciseId))
        errors.push({
          layer: 'semantic',
          code: 'DATA_EXERCISE_REFERENCE',
          path: `/data/sessionLogs/${sessionIndex}/setLogs/${setIndex}/exerciseId`,
          message: `Exercise ${JSON.stringify(setLog.exerciseId)} must exist in the logged program version.`,
        });
    });
  });
  if (
    root.activeProgram &&
    !programs.has(`${root.activeProgram.programId}@${root.activeProgram.version}`)
  )
    errors.push({
      layer: 'semantic',
      code: 'DATA_ACTIVE_PROGRAM_REFERENCE',
      path: '/data/activeProgram',
      message: 'The active program must reference a program present in this data.',
    });
  return errors;
}

export type RootDecodeResult =
  { ok: true; data: PersistedRoot; migrated: boolean } | { ok: false; errors: ValidationError[] };

export function decodePersistedRoot(value: unknown): RootDecodeResult {
  const version = versionOf(value);
  if (typeof version !== 'number' || !Number.isInteger(version))
    return {
      ok: false,
      errors: [
        {
          layer: 'structural',
          code: 'SCHEMA_VERSION_MISSING',
          path: '/data/schemaVersion',
          message: `Expected a numeric schemaVersion; found ${JSON.stringify(version)}.`,
        },
      ],
    };
  if (version > CURRENT_SCHEMA_VERSION)
    return {
      ok: false,
      errors: [
        {
          layer: 'storage',
          code: 'SCHEMA_VERSION_NEWER',
          path: '/data/schemaVersion',
          message: `This data uses schema version ${version}; this app supports up to ${CURRENT_SCHEMA_VERSION}. Export the raw data and open it with a newer app.`,
        },
      ],
    };
  if (version < 0)
    return {
      ok: false,
      errors: [
        {
          layer: 'storage',
          code: 'SCHEMA_VERSION_UNKNOWN',
          path: '/data/schemaVersion',
          message: `Schema version ${version} is not recognised.`,
        },
      ],
    };

  let root: PersistedRoot;
  let migrated = false;
  if (version === 0) {
    if (!validateV0(value)) return { ok: false, errors: errorsFromAjv(validateV0.errors) };
    root = migrateV0ToCurrent(value);
    migrated = true;
  } else if (version === 1) {
    if (!validateV1(value)) return { ok: false, errors: errorsFromAjv(validateV1.errors) };
    root = migrateV1ToCurrent(value);
    migrated = true;
  } else {
    if (!validateCurrent(value))
      return { ok: false, errors: errorsFromAjv(validateCurrent.errors) };
    root = value;
  }
  const errors = integrityErrors(root);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, data: root, migrated };
}

export function freshRoot(): PersistedRoot {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    programs: [],
    sessionLogs: [],
    settings: { defaultUnit: 'kg', theme: 'system' },
    activeProgram: null,
  };
}
