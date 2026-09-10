import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { mergePersistedRoots } from '../domain/export/merge';
import type { AppStore, LogSetInput } from '../domain/state/appStore';
import type { PersistedRoot, Program, Settings } from '../domain/program/types';
import { isValidActual } from '../domain/session/actualSet';
import type { Clock } from '../platform/clock/Clock';
import type { IdProvider } from '../platform/ids/IdProvider';
import type { LoadResult, StorageAdapter, WriteResult } from '../platform/storage/StorageAdapter';

interface FatalState {
  errors: string[];
  raw: string | null;
}

interface ProviderValue {
  store: AppStore | null;
  fatal: FatalState | null;
}

const StoreContext = createContext<ProviderValue | null>(null);

function writeMessage(result: WriteResult, action: string): string {
  if (result.ok) return '';
  return `${action} was not saved. ${result.detail}`;
}

export function PersistedProvider({
  adapter,
  clock,
  ids,
  children,
}: {
  adapter: StorageAdapter;
  clock: Clock;
  ids: IdProvider;
  children: ReactNode;
}) {
  const [loaded] = useState<LoadResult>(() => adapter.load());
  const [data, setData] = useState<PersistedRoot | null>(loaded.ok ? loaded.data : null);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const commit = useCallback(
    (next: PersistedRoot, action: string): WriteResult => {
      const result = adapter.save(next);
      if (!result.ok) {
        setFailure(writeMessage(result, action));
        setNotice('');
        return result;
      }
      setData(next);
      setFailure(null);
      setNotice(`${action} saved.`);
      return result;
    },
    [adapter],
  );

  const store = useMemo<AppStore | null>(() => {
    if (!data) return null;
    return {
      data,
      notice,
      failure,
      clearMessages: () => {
        setNotice('');
        setFailure(null);
      },
      addProgram: (program: Program) =>
        commit(
          { ...data, programs: [...data.programs, { program, importedAt: clock.now() }] },
          `${program.name} v${program.version}`,
        ),
      activateProgram: (programId: string, version: number) =>
        commit({ ...data, activeProgram: { programId, version } }, 'Active program'),
      startSession: (sessionId: string) => {
        if (!data.activeProgram)
          return {
            ok: false,
            reason: 'unavailable',
            detail: 'Activate a program before starting.',
          };
        if (data.sessionLogs.some((log) => log.completedAt === null))
          return {
            ok: false,
            reason: 'unavailable',
            detail: 'Resume the session already in progress.',
          };
        const sessionLog = {
          sessionLogId: ids.next(),
          programId: data.activeProgram.programId,
          programVersion: data.activeProgram.version,
          sessionId,
          startedAt: clock.now(),
          completedAt: null,
          setLogs: [],
        };
        return commit({ ...data, sessionLogs: [...data.sessionLogs, sessionLog] }, 'Session start');
      },
      logSet: (input: LogSetInput) => {
        if (!isValidActual(input.weight, input.reps, input.rpe)) {
          return {
            ok: false,
            reason: 'unavailable',
            detail: 'Actual set values are outside the supported logging ranges.',
          };
        }
        const session = data.sessionLogs.find((log) => log.sessionLogId === input.sessionLogId);
        if (!session || session.completedAt !== null)
          return {
            ok: false,
            reason: 'unavailable',
            detail: 'The active session could not be found.',
          };
        if (
          session.setLogs.some(
            (setLog) =>
              setLog.blockIndex === input.blockIndex &&
              setLog.entryIndex === input.entryIndex &&
              setLog.setIndex === input.setIndex,
          )
        )
          return {
            ok: false,
            reason: 'unavailable',
            detail: 'That set is already logged. Edit it instead.',
          };
        const setLog = {
          setLogId: ids.next(),
          exerciseId: input.exerciseId,
          blockIndex: input.blockIndex,
          entryIndex: input.entryIndex,
          setIndex: input.setIndex,
          weight: input.weight,
          reps: input.reps,
          rpe: input.rpe,
          loggedAt: clock.now(),
        };
        const next = {
          ...data,
          sessionLogs: data.sessionLogs.map((log) =>
            log.sessionLogId === input.sessionLogId
              ? { ...log, setLogs: [...log.setLogs, setLog] }
              : log,
          ),
        };
        return commit(next, `Set ${input.setIndex + 1}`);
      },
      updateSet: (sessionLogId, setLogId, weight, reps, rpe) => {
        if (!isValidActual(weight, reps, rpe)) {
          return {
            ok: false,
            reason: 'unavailable',
            detail: 'Actual set values are outside the supported logging ranges.',
          };
        }
        return commit(
          {
            ...data,
            sessionLogs: data.sessionLogs.map((log) =>
              log.sessionLogId === sessionLogId
                ? {
                    ...log,
                    setLogs: log.setLogs.map((setLog) =>
                      setLog.setLogId === setLogId ? { ...setLog, weight, reps, rpe } : setLog,
                    ),
                  }
                : log,
            ),
          },
          'Set correction',
        );
      },
      deleteSet: (sessionLogId, setLogId) =>
        commit(
          {
            ...data,
            sessionLogs: data.sessionLogs.map((log) =>
              log.sessionLogId === sessionLogId
                ? { ...log, setLogs: log.setLogs.filter((setLog) => setLog.setLogId !== setLogId) }
                : log,
            ),
          },
          'Set deletion',
        ),
      completeSession: (sessionLogId) =>
        commit(
          {
            ...data,
            sessionLogs: data.sessionLogs.map((log) =>
              log.sessionLogId === sessionLogId ? { ...log, completedAt: clock.now() } : log,
            ),
          },
          'Completed session',
        ),
      updateSettings: (settings: Settings) => commit({ ...data, settings }, 'Settings'),
      replaceData: (incoming: PersistedRoot) => commit(incoming, 'Backup restore'),
      mergeData: (incoming: PersistedRoot) => {
        const merged = mergePersistedRoots(data, incoming);
        if (!merged.ok)
          return {
            result: {
              ok: false,
              reason: 'unavailable',
              detail: 'Merge conflicts must be resolved in the source backup.',
            },
            conflicts: merged.errors.map((error) => `${error.code}: ${error.message}`),
          };
        return { result: commit(merged.data, 'Backup merge'), conflicts: [] };
      },
      activeSession: () => data.sessionLogs.find((log) => log.completedAt === null) ?? null,
      usageBytes: () => adapter.usageBytes(),
      now: () => clock.now(),
      timezone: () => clock.timezone(),
    };
  }, [adapter, clock, commit, data, failure, ids, notice]);

  const fatal = loaded.ok
    ? null
    : {
        errors: loaded.errors.map((error) => `${error.code} ${error.path}: ${error.message}`),
        raw: loaded.raw,
      };
  return <StoreContext.Provider value={{ store, fatal }}>{children}</StoreContext.Provider>;
}

export function usePersistedStore(): ProviderValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('PersistedProvider is missing.');
  return context;
}
