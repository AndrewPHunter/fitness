const OUTPUT_RULES_HEADING = '## Output rules';
const CANONICAL_HEADING = '### Canonical ids';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export type PromptBuildResult =
  { ok: true; text: string; injectedIds: string[] } | { ok: false; detail: string };

export type CanonicalIdsResult =
  { ok: true; ids: string[]; text: string } | { ok: false; detail: string };

export function uniqueExerciseIds(exerciseIds: string[]): string[] {
  return [...new Set(exerciseIds)].sort((left, right) => left.localeCompare(right));
}

export function buildPersonalizedPrompt(
  basePrompt: string,
  existingExerciseIds: string[],
): PromptBuildResult {
  const injectedIds = uniqueExerciseIds(existingExerciseIds);
  if (injectedIds.length === 0) return { ok: true, text: basePrompt, injectedIds };

  const insertionIndex = basePrompt.indexOf(OUTPUT_RULES_HEADING);
  if (insertionIndex < 0) {
    return {
      ok: false,
      detail: `The bundled authoring prompt is missing its ${JSON.stringify(OUTPUT_RULES_HEADING)} section, so existing exercise IDs could not be injected safely.`,
    };
  }

  const personalSection = [
    "## Existing exercise IDs from this user's tracker — reuse these first",
    '',
    'The tracker supplied the IDs below from programs already stored on this device. Reuse these',
    'exact IDs whenever they describe the same movement. Prefer them over inventing a synonym so',
    "the user's training history remains one continuous stream.",
    '',
    ...injectedIds.map((exerciseId) => `- \`${exerciseId}\``),
    '',
  ].join('\n');

  return {
    ok: true,
    injectedIds,
    text: `${basePrompt.slice(0, insertionIndex)}${personalSection}\n${basePrompt.slice(insertionIndex)}`,
  };
}

export function extractCanonicalExerciseIds(basePrompt: string): CanonicalIdsResult {
  const headingIndex = basePrompt.indexOf(CANONICAL_HEADING);
  if (headingIndex < 0) {
    return {
      ok: false,
      detail: `The bundled authoring prompt is missing its ${JSON.stringify(CANONICAL_HEADING)} section.`,
    };
  }
  const fenceStart = basePrompt.indexOf('```', headingIndex);
  const contentStart = fenceStart < 0 ? -1 : basePrompt.indexOf('\n', fenceStart);
  const fenceEnd = contentStart < 0 ? -1 : basePrompt.indexOf('```', contentStart);
  if (contentStart < 0 || fenceEnd < 0) {
    return {
      ok: false,
      detail: 'The canonical exercise ID block in the bundled prompt is malformed.',
    };
  }

  const ids = basePrompt
    .slice(contentStart + 1, fenceEnd)
    .split(/\s+/u)
    .filter((value) => value.length > 0);
  if (ids.length === 0 || ids.some((exerciseId) => !SLUG.test(exerciseId))) {
    return {
      ok: false,
      detail: 'The canonical exercise ID block contains no IDs or an invalid ID.',
    };
  }
  return { ok: true, ids, text: ids.join('\n') };
}
