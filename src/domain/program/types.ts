export type Unit = 'kg' | 'lb';

export interface Load {
  value: number;
  unit: Unit;
}

export interface ExerciseDefinition {
  exerciseId: string;
  name: string;
  notes?: string;
}

export interface ExerciseEntry {
  exerciseId: string;
  sets: number;
  reps: number;
  targetWeight?: Load;
  targetRpe?: number;
  restSeconds?: number;
  notes?: string;
}

export type Block =
  { type: 'single'; entry: ExerciseEntry } | { type: 'superset'; entries: ExerciseEntry[] };

export interface Session {
  sessionId: string;
  name: string;
  notes?: string;
  blocks: Block[];
}

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Schedule =
  | { mode: 'rotation'; sequence: string[] }
  | { mode: 'weekdays'; days: Partial<Record<Weekday, string>> };

export interface FrequencyTarget {
  exerciseId: string;
  perWeek: number;
}

export interface Program {
  programId: string;
  version: number;
  name: string;
  description?: string;
  exercises: ExerciseDefinition[];
  sessions: Session[];
  schedule: Schedule;
  frequencyTargets?: FrequencyTarget[];
}

export interface SetLog {
  setLogId: string;
  exerciseId: string;
  blockIndex: number;
  entryIndex: number;
  setIndex: number;
  weight: Load;
  reps: number;
  rpe: number | null;
  loggedAt: string;
}

export interface SessionLog {
  sessionLogId: string;
  programId: string;
  programVersion: number;
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  setLogs: SetLog[];
  notes?: string;
}

export interface StoredProgram {
  program: Program;
  importedAt: string;
}

export interface Settings {
  defaultUnit: Unit;
  theme: 'system' | 'light' | 'dark';
}

export interface PersistedRoot {
  schemaVersion: number;
  programs: StoredProgram[];
  sessionLogs: SessionLog[];
  settings: Settings;
  activeProgram: { programId: string; version: number } | null;
}

export interface ValidationError {
  layer: 'structural' | 'semantic' | 'storage';
  code: string;
  path: string;
  message: string;
}

export type ValidationResult =
  { ok: true; program: Program } | { ok: false; errors: ValidationError[] };

export interface ExportDocument {
  format: 'fitness-tracker-export';
  formatVersion: 1;
  exportedAt: string;
  appSchemaVersion: number;
  data: PersistedRoot;
}
