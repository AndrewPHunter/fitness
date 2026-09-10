import { createClipboardAdapter } from './browserClipboardAdapter';

describe('browser clipboard adapter', () => {
  it('reports a denied clipboard write as a failure', async () => {
    const adapter = createClipboardAdapter({
      writeText: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
    });
    await expect(adapter.writeText('complete prompt')).resolves.toMatchObject({
      ok: false,
      detail: expect.stringContaining('Select and copy the full prompt below.'),
    });
  });

  it('reports success only after the platform write resolves', async () => {
    let received = '';
    const adapter = createClipboardAdapter({
      writeText: async (text) => {
        received = text;
      },
    });
    await expect(adapter.writeText('complete prompt')).resolves.toEqual({ ok: true });
    expect(received).toBe('complete prompt');
  });
});
