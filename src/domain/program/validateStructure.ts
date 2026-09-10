import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';
import programSchema from '../../../fixtures/schema/program.schema.json';
import type { Program, ValidationError } from './types';

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile<Program>(programSchema);
const controlKeywords = new Set(['if', 'then', 'else', 'allOf', 'anyOf', 'oneOf', 'not']);

function decodePointerPart(part: string): string {
  return part.replaceAll('~1', '/').replaceAll('~0', '~');
}

function valueAt(document: unknown, pointer: string): unknown {
  if (pointer === '') return document;
  let current: unknown = document;
  for (const rawPart of pointer.slice(1).split('/')) {
    const part = decodePointerPart(rawPart);
    if (Array.isArray(current)) {
      const index = Number(part);
      current = Number.isInteger(index) ? current[index] : undefined;
    } else if (typeof current === 'object' && current !== null) {
      current = Object.prototype.hasOwnProperty.call(current, part)
        ? Object.getOwnPropertyDescriptor(current, part)?.value
        : undefined;
    } else {
      return undefined;
    }
  }
  return current;
}

function printable(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === undefined) return 'nothing';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function param(error: ErrorObject, name: string): unknown {
  return Object.getOwnPropertyDescriptor(error.params, name)?.value;
}

function fieldName(path: string): string {
  const part = path.split('/').at(-1);
  return part ? decodePointerPart(part) : 'value';
}

function actionableMessage(error: ErrorObject, document: unknown): string {
  const found = valueAt(document, error.instancePath);
  const field = fieldName(error.instancePath);
  switch (error.keyword) {
    case 'required':
      return `Missing required property ${printable(param(error, 'missingProperty'))}.`;
    case 'additionalProperties':
      return `Unrecognised property ${printable(param(error, 'additionalProperty'))}; remove it.`;
    case 'pattern':
      return `${field} must be lowercase kebab-case; found ${printable(found)}.`;
    case 'minimum':
      return `${field} must be at least ${String(param(error, 'limit'))}; found ${printable(found)}.`;
    case 'exclusiveMinimum':
      return `${field} must be greater than ${String(param(error, 'limit'))}; found ${printable(found)}.`;
    case 'maximum':
      return `${field} must be at most ${String(param(error, 'limit'))}; found ${printable(found)}.`;
    case 'minItems':
      return `${field} must contain at least ${String(param(error, 'limit'))} items; found ${Array.isArray(found) ? found.length : printable(found)}.`;
    case 'maxItems':
      return `${field} must contain at most ${String(param(error, 'limit'))} items; found ${Array.isArray(found) ? found.length : printable(found)}.`;
    case 'type':
      return `${field} must be ${String(param(error, 'type'))}; found ${printable(found)}.`;
    case 'enum':
      return `${field} must be one of the allowed values; found ${printable(found)}.`;
    case 'const':
      return `${field} must be ${printable(param(error, 'allowedValue'))}; found ${printable(found)}.`;
    case 'multipleOf':
      return `${field} must be in steps of ${String(param(error, 'multipleOf'))}; found ${printable(found)}.`;
    case 'minLength':
      return `${field} must not be empty; found ${printable(found)}.`;
    default:
      return `${field} ${error.message ?? 'does not match the required schema'}; found ${printable(found)}.`;
  }
}

export function validateStructure(
  document: unknown,
): { ok: true; program: Program } | { ok: false; errors: ValidationError[] } {
  if (validate(document)) return { ok: true, program: document };

  const unique = new Map<string, ValidationError>();
  for (const error of validate.errors ?? []) {
    if (controlKeywords.has(error.keyword)) continue;
    const code = error.keyword.toUpperCase();
    const key = `${error.instancePath}\u0000${code}`;
    if (!unique.has(key)) {
      unique.set(key, {
        layer: 'structural',
        code,
        path: error.instancePath,
        message: actionableMessage(error, document),
      });
    }
  }
  return {
    ok: false,
    errors: [...unique.values()].sort((left, right) =>
      left.path === right.path
        ? left.code.localeCompare(right.code)
        : left.path.localeCompare(right.path),
    ),
  };
}
