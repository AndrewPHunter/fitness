export type PreparedProgramText =
  | { kind: 'empty' }
  | { kind: 'fenced'; visibleTextWithoutFences: string }
  | { kind: 'ready'; text: string };

const JSON_CODE_FENCE = /^```(?:json)?[\t ]*\r?\n([\s\S]*?)\r?\n```$/iu;

export function prepareProgramText(text: string): PreparedProgramText {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { kind: 'empty' };

  const fenced = JSON_CODE_FENCE.exec(trimmed);
  if (fenced?.[1] !== undefined) {
    return { kind: 'fenced', visibleTextWithoutFences: fenced[1] };
  }

  return { kind: 'ready', text: trimmed };
}
