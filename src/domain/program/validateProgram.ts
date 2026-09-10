import type { Program, ValidationError, ValidationResult } from './types';
import { validateSemantics } from './validateSemantics';
import { validateStructure } from './validateStructure';

export function validateProgram(document: unknown): ValidationResult {
  const structural = validateStructure(document);
  if (!structural.ok) return structural;
  const errors = validateSemantics(structural.program);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, program: structural.program };
}

export function validateProgramText(text: string): ValidationResult {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'The parser could not read this file.';
    return {
      ok: false,
      errors: [
        {
          layer: 'structural',
          code: 'PARSE_ERROR',
          path: '',
          message: `Expected valid JSON. ${detail}`,
        },
      ],
    };
  }
  return validateProgram(document);
}

export function duplicateProgramError(program: Program): ValidationError {
  return {
    layer: 'storage',
    code: 'STO-1',
    path: '/version',
    message: `Program ${program.programId} version ${program.version} is already stored. Upload a new version number.`,
  };
}
