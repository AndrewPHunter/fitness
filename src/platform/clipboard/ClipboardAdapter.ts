export type ClipboardWriteResult = { ok: true } | { ok: false; detail: string };

export interface ClipboardAdapter {
  writeText(text: string): Promise<ClipboardWriteResult>;
}
