import authoringPrompt from '../../../fixtures/authoring-prompt.md?raw';
import { buildPersonalizedPrompt, extractCanonicalExerciseIds } from './prompt';

describe('authoring prompt composition', () => {
  it('returns the complete fixture prompt byte-for-byte when the local index is empty', () => {
    const result = buildPersonalizedPrompt(authoringPrompt, []);
    expect(result).toEqual({ ok: true, text: authoringPrompt, injectedIds: [] });
  });

  it('injects the deduplicated local index visibly before output instructions', () => {
    const result = buildPersonalizedPrompt(authoringPrompt, [
      'user-special-row',
      'barbell-bench-press',
      'user-special-row',
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.injectedIds).toEqual(['barbell-bench-press', 'user-special-row']);
    expect(result.text).toContain(
      "## Existing exercise IDs from this user's tracker — reuse these first",
    );
    expect(result.text).toContain('- `barbell-bench-press`\n- `user-special-row`');
    expect(result.text.indexOf('## Existing exercise IDs')).toBeLessThan(
      result.text.indexOf('## Output rules'),
    );
    expect(result.text).toContain(authoringPrompt.slice(0, 500));
    expect(result.text).toContain(authoringPrompt.slice(-500));
  });

  it('derives the canonical copy list from the bundled prompt itself', () => {
    const result = extractCanonicalExerciseIds(authoringPrompt);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ids).toHaveLength(39);
    expect(result.ids).toContain('barbell-back-squat');
    expect(result.ids).toContain('back-extension');
    expect(result.text.split('\n')).toEqual(result.ids);
  });
});
