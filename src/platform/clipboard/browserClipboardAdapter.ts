import type { ClipboardAdapter, ClipboardWriteResult } from './ClipboardAdapter';

interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

export function createClipboardAdapter(writer: ClipboardWriter | null): ClipboardAdapter {
  return {
    async writeText(text: string): Promise<ClipboardWriteResult> {
      if (!writer) {
        return {
          ok: false,
          detail: 'Clipboard access is unavailable. Select and copy the full prompt below.',
        };
      }
      try {
        await writer.writeText(text);
        return { ok: true };
      } catch (error: unknown) {
        return {
          ok: false,
          detail: `Clipboard access was denied. Select and copy the full prompt below.${error instanceof Error && error.message ? ` ${error.message}` : ''}`,
        };
      }
    },
  };
}

export function createBrowserClipboardAdapter(): ClipboardAdapter {
  return createClipboardAdapter(navigator.clipboard ?? null);
}
