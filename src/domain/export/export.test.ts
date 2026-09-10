import minimalJson from '../../../fixtures/programs/01-minimal.json';
import rotationJson from '../../../fixtures/programs/02-every-other-day-rotation.json';
import { freshRoot } from '../persistence/validateRoot';
import type { PersistedRoot, Program } from '../program/types';
import { validateProgram } from '../program/validateProgram';
import { fromExportJson, toExportJson } from './jsonExport';
import { mergePersistedRoots } from './merge';
import { CSV_COLUMNS, toCsv } from './toCsv';

function validProgram(value: unknown): Program {
  const result = validateProgram(value);
  if (!result.ok) throw new Error('Fixture invalid.');
  return result.program;
}

function rootWith(program: Program): PersistedRoot {
  return {
    ...freshRoot(),
    programs: [{ program, importedAt: '2026-01-01T00:00:00+00:00' }],
    activeProgram: { programId: program.programId, version: program.version },
  };
}

describe('JSON export', () => {
  it.each([minimalJson, rotationJson])('round-trips complete roots by deep equality', (fixture) => {
    const root = rootWith(validProgram(fixture));
    const parsed = fromExportJson(toExportJson(root, '2026-09-10T10:00:00-07:00'));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.document.data).toEqual(root);
  });

  it('reports conflicts and leaves both merge inputs untouched', () => {
    const program = validProgram(minimalJson);
    const current = rootWith(program);
    const incoming = rootWith({ ...program, name: 'Conflicting content' });
    const snapshot = structuredClone(current);
    const result = mergePersistedRoots(current, incoming);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]?.code).toBe('IMP-7_PROGRAM_CONFLICT');
    expect(current).toEqual(snapshot);
  });
});

describe('CSV export', () => {
  it('uses exact columns, RFC 4180 quoting, empty RPE, actual zero reps, and historical prescription', () => {
    const base = validProgram(minimalJson);
    const oldProgram: Program = {
      ...base,
      name: 'Old, "Quoted" Program',
      sessions: base.sessions.map((session) => ({
        ...session,
        name: 'Full\nBody',
        blocks: session.blocks.map((block) =>
          block.type === 'single' ? { ...block, entry: { ...block.entry, reps: 7 } } : block,
        ),
      })),
    };
    const newer: Program = {
      ...base,
      version: 2,
      name: 'New version',
      sessions: base.sessions.map((session) => ({
        ...session,
        blocks: session.blocks.map((block) =>
          block.type === 'single' ? { ...block, entry: { ...block.entry, reps: 3 } } : block,
        ),
      })),
    };
    const root: PersistedRoot = {
      ...freshRoot(),
      programs: [
        { program: oldProgram, importedAt: '2026-01-01T00:00:00+00:00' },
        { program: newer, importedAt: '2026-02-01T00:00:00+00:00' },
      ],
      activeProgram: { programId: newer.programId, version: 2 },
      sessionLogs: [
        {
          sessionLogId: 'session-log-1',
          programId: oldProgram.programId,
          programVersion: 1,
          sessionId: 'full-body',
          startedAt: '2026-03-01T10:00:00-07:00',
          completedAt: '2026-03-01T11:00:00-07:00',
          setLogs: [
            {
              setLogId: 'set-log-1',
              exerciseId: 'barbell-back-squat',
              blockIndex: 0,
              entryIndex: 0,
              setIndex: 0,
              weight: { value: 100, unit: 'kg' },
              reps: 0,
              rpe: null,
              loggedAt: '2026-03-01T10:05:00-07:00',
            },
          ],
        },
      ],
    };
    const csv = toCsv(root);
    expect(csv.split('\r\n')[0]).toBe(CSV_COLUMNS.join(','));
    expect(csv).toContain('"Full\nBody"');
    expect(csv).toContain(',7,,,,100,kg,0,,2026-03-01T10:05:00-07:00');
    expect(csv).not.toContain(',3,,,,100');
  });
});
