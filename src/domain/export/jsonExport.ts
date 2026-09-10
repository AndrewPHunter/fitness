import type { ExportDocument, PersistedRoot, ValidationError } from '../program/types';
import { decodePersistedRoot } from '../persistence/validateRoot';

export function toExportJson(root: PersistedRoot, exportedAt: string): string {
  const document: ExportDocument = {
    format: 'fitness-tracker-export',
    formatVersion: 1,
    exportedAt,
    appSchemaVersion: root.schemaVersion,
    data: root,
  };
  return JSON.stringify(document, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type ExportParseResult =
  { ok: true; document: ExportDocument } | { ok: false; errors: ValidationError[] };

export function fromExportJson(text: string): ExportParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error: unknown) {
    return {
      ok: false,
      errors: [
        {
          layer: 'structural',
          code: 'PARSE_ERROR',
          path: '',
          message: `Expected valid JSON. ${error instanceof Error ? error.message : ''}`.trim(),
        },
      ],
    };
  }
  if (!isRecord(value))
    return {
      ok: false,
      errors: [
        {
          layer: 'structural',
          code: 'IMP-1',
          path: '',
          message: 'Expected a fitness tracker export object.',
        },
      ],
    };

  const errors: ValidationError[] = [];
  if (value.format !== 'fitness-tracker-export')
    errors.push({
      layer: 'structural',
      code: 'IMP-1',
      path: '/format',
      message: `Expected "fitness-tracker-export"; found ${JSON.stringify(value.format)}.`,
    });
  if (value.formatVersion !== 1)
    errors.push({
      layer: 'structural',
      code: 'IMP-2',
      path: '/formatVersion',
      message: `Expected recognised formatVersion 1; found ${JSON.stringify(value.formatVersion)}.`,
    });
  if (typeof value.exportedAt !== 'string')
    errors.push({
      layer: 'structural',
      code: 'EXPORT_TIMESTAMP',
      path: '/exportedAt',
      message: 'Expected an ISO 8601 export timestamp string.',
    });
  if (typeof value.appSchemaVersion !== 'number')
    errors.push({
      layer: 'structural',
      code: 'APP_SCHEMA_VERSION',
      path: '/appSchemaVersion',
      message: 'Expected a numeric appSchemaVersion.',
    });
  const allowed = new Set(['format', 'formatVersion', 'exportedAt', 'appSchemaVersion', 'data']);
  Object.keys(value)
    .filter((key) => !allowed.has(key))
    .forEach((key) =>
      errors.push({
        layer: 'structural',
        code: 'ADDITIONAL_PROPERTIES',
        path: '',
        message: `Unrecognised export property ${JSON.stringify(key)}.`,
      }),
    );
  if (!Object.hasOwn(value, 'data'))
    errors.push({
      layer: 'structural',
      code: 'REQUIRED',
      path: '',
      message: 'Missing required property "data".',
    });
  if (errors.length > 0) return { ok: false, errors };

  const decoded = decodePersistedRoot(value.data);
  if (!decoded.ok) return decoded;
  return {
    ok: true,
    document: {
      format: 'fitness-tracker-export',
      formatVersion: 1,
      exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : '',
      appSchemaVersion: decoded.data.schemaVersion,
      data: decoded.data,
    },
  };
}
