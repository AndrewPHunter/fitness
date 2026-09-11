import { prepareProgramText } from './prepareProgramText';

describe('program text preparation', () => {
  it('trims only leading and trailing whitespace from ordinary JSON', () => {
    expect(prepareProgramText(' \n {"name": "A  B"}\r\n ')).toEqual({
      kind: 'ready',
      text: '{"name": "A  B"}',
    });
  });

  it('stops an empty submission before parsing', () => {
    expect(prepareProgramText(' \n\t ')).toEqual({ kind: 'empty' });
  });

  it.each(['json', 'JSON', ''])('surfaces a %s code fence without silently removing it', (tag) => {
    const visible = `\`\`\`${tag}\n{"programId":"example"}\n\`\`\``;
    expect(prepareProgramText(visible)).toEqual({
      kind: 'fenced',
      visibleTextWithoutFences: '{"programId":"example"}',
    });
  });

  it('does not reinterpret partial or embedded fences', () => {
    const input = '```json\n{"programId":"example"}';
    expect(prepareProgramText(input)).toEqual({ kind: 'ready', text: input });
  });
});
