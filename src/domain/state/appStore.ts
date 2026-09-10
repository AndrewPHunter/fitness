import type { Load, PersistedRoot, Program, SessionLog, Settings } from '../program/types';

export type ActionResult =
  { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'serialisation'; detail: string };

export interface LogSetInput {
  sessionLogId: string;
  exerciseId: string;
  blockIndex: number;
  entryIndex: number;
  setIndex: number;
  weight: Load;
  reps: number;
  rpe: number | null;
}

export interface AppStore {
  data: PersistedRoot;
  notice: string;
  failure: string | null;
  clearMessages(): void;
  addProgram(program: Program): ActionResult;
  activateProgram(programId: string, version: number): ActionResult;
  startSession(sessionId: string): ActionResult;
  logSet(input: LogSetInput): ActionResult;
  updateSet(
    sessionLogId: string,
    setLogId: string,
    weight: Load,
    reps: number,
    rpe: number | null,
  ): ActionResult;
  deleteSet(sessionLogId: string, setLogId: string): ActionResult;
  completeSession(sessionLogId: string): ActionResult;
  updateSettings(settings: Settings): ActionResult;
  replaceData(data: PersistedRoot): ActionResult;
  mergeData(data: PersistedRoot): { result: ActionResult; conflicts: string[] };
  activeSession(): SessionLog | null;
  usageBytes(): number;
  now(): string;
  timezone(): string;
}
