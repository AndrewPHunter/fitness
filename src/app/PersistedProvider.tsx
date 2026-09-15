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

function writeMessage(result: WriteResult, outcome: string): string {
  if (result.ok) return '';
  return `${outcome} ${result.detail}`;
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

  const reject = useCallback((action: string, detail: string) => {
    setNotice('');
    setFailure(`${action} failed. ${detail}`);
    return { ok: false, reason: 'unavailable' as const, detail };
  }, []);

  const commit = useCallback(
    (next: PersistedRoot, action: string, successMessage: string): WriteResult => {
      const result = adapter.save(next);
      if (!result.ok) {
        setFailure(writeMessage(result, action));
        setNotice('');
        return result;
      }
      setData(next);
      setFailure(null);
      setNotice(successMessage);
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
      announce: (message: string) => {
        setFailure(null);
        setNotice(message);
      },
      reportFailure: (message: string) => {
        setNotice('');
        setFailure(message);
      },
      addProgram: (program: Program) =>
        commit(
          { ...data, programs: [...data.programs, { program, importedAt: clock.now() }] },
          `${program.name} v${program.version} was not imported.`,
          `${program.name} v${program.version} imported.`,
        ),
      activateProgram: (programId: string, version: number) => {
        const program = data.programs.find(
          ({ program: candidate }) =>
            candidate.programId === programId && candidate.version === version,
        )?.program;
        return commit(
          { ...data, activeProgram: { programId, version } },
          `${program?.name ?? programId} v${version} was not activated.`,
          `${program?.name ?? programId} v${version} is active.`,
        );
      },
      startSession: (sessionId: string) => {
        if (!data.activeProgram)
          return reject('Session start', 'Activate a program before starting.');
        if (data.sessionLogs.some((log) => log.completedAt === null))
          return reject('Session start', 'Resume the session already in progress.');
        const sessionLog = {
          sessionLogId: ids.next(),
          programId: data.activeProgram.programId,
          programVersion: data.activeProgram.version,
          sessionId,
          startedAt: clock.now(),
          completedAt: null,
          setLogs: [],
        };
        const activeProgram = data.programs.find(
          ({ program }) =>
            program.programId === data.activeProgram?.programId &&
            program.version === data.activeProgram.version,
        )?.program;
        const sessionName =
          activeProgram?.sessions.find((session) => session.sessionId === sessionId)?.name ??
          sessionId;
        return commit(
          { ...data, sessionLogs: [...data.sessionLogs, sessionLog] },
          `${sessionName} was not started.`,
          `${sessionName} started.`,
        );
      },
      logSet: (input: LogSetInput) => {
        if (!isValidActual(input.weight, input.reps, input.rpe)) {
          return reject(
            `Set ${input.setIndex + 1} logging`,
            'Actual set values are outside the supported logging ranges.',
          );
        }
        const session = data.sessionLogs.find((log) => log.sessionLogId === input.sessionLogId);
        if (!session || session.completedAt !== null)
          return reject(
            `Set ${input.setIndex + 1} logging`,
            'The active session could not be found.',
          );
        if (
          session.setLogs.some(
            (setLog) =>
              setLog.blockIndex === input.blockIndex &&
              setLog.entryIndex === input.entryIndex &&
              setLog.setIndex === input.setIndex,
          )
        )
          return reject(
            `Set ${input.setIndex + 1} logging`,
            'That set is already logged. Edit it instead.',
          );
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
        const rpe = input.rpe === null ? '' : ` · RPE ${input.rpe}`;
        return commit(
          next,
          `Set ${input.setIndex + 1} · ${input.weight.value} ${input.weight.unit} × ${input.reps}${rpe} was not logged.`,
          `Set ${input.setIndex + 1} logged · ${input.weight.value} ${input.weight.unit} × ${input.reps}${rpe}`,
        );
      },
      updateSet: (sessionLogId, setLogId, weight, reps, rpe) => {
        if (!isValidActual(weight, reps, rpe)) {
          return reject(
            'Set correction',
            'Actual set values are outside the supported logging ranges.',
          );
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
          `Set correction · ${weight.value} ${weight.unit} × ${reps}${rpe === null ? '' : ` · RPE ${rpe}`} was not saved.`,
          `Set corrected · ${weight.value} ${weight.unit} × ${reps}${rpe === null ? '' : ` · RPE ${rpe}`}`,
        );
      },
      deleteSet: (sessionLogId, setLogId) => {
        const deleted = data.sessionLogs
          .find((log) => log.sessionLogId === sessionLogId)
          ?.setLogs.find((setLog) => setLog.setLogId === setLogId);
        return commit(
          {
            ...data,
            sessionLogs: data.sessionLogs.map((log) =>
              log.sessionLogId === sessionLogId
                ? { ...log, setLogs: log.setLogs.filter((setLog) => setLog.setLogId !== setLogId) }
                : log,
            ),
          },
          deleted
            ? `Set deletion · ${deleted.weight.value} ${deleted.weight.unit} × ${deleted.reps}${deleted.rpe === null ? '' : ` · RPE ${deleted.rpe}`} was not saved.`
            : 'The logged set was not deleted.',
          deleted
            ? `Set deleted · ${deleted.weight.value} ${deleted.weight.unit} × ${deleted.reps}${deleted.rpe === null ? '' : ` · RPE ${deleted.rpe}`}`
            : 'Logged set deleted.',
        );
      },
      completeSession: (sessionLogId) => {
        const completedLog = data.sessionLogs.find((log) => log.sessionLogId === sessionLogId);
        const program = data.programs.find(
          ({ program: candidate }) =>
            candidate.programId === completedLog?.programId &&
            candidate.version === completedLog.programVersion,
        )?.program;
        const sessionName =
          program?.sessions.find((session) => session.sessionId === completedLog?.sessionId)
            ?.name ??
          completedLog?.sessionId ??
          'Session';
        return commit(
          {
            ...data,
            sessionLogs: data.sessionLogs.map((log) =>
              log.sessionLogId === sessionLogId ? { ...log, completedAt: clock.now() } : log,
            ),
          },
          `${sessionName} was not completed.`,
          `${sessionName} completed · ${completedLog?.setLogs.length ?? 0} sets logged.`,
        );
      },
      discardSession: (sessionLogId) => {
        const discarded = data.sessionLogs.find((log) => log.sessionLogId === sessionLogId);
        if (!discarded || discarded.completedAt !== null || discarded.setLogs.length > 0) {
          const detail = 'Only an in-progress session with zero logged sets can be discarded.';
          return reject('Session discard', detail);
        }
        const program = data.programs.find(
          ({ program: candidate }) =>
            candidate.programId === discarded.programId &&
            candidate.version === discarded.programVersion,
        )?.program;
        const sessionName =
          program?.sessions.find((session) => session.sessionId === discarded.sessionId)?.name ??
          discarded.sessionId;
        return commit(
          {
            ...data,
            sessionLogs: data.sessionLogs.filter((log) => log.sessionLogId !== sessionLogId),
          },
          `${sessionName} was not discarded.`,
          `${sessionName} discarded · no sets were logged.`,
        );
      },
      updateSettings: (settings: Settings) =>
        commit(
          { ...data, settings },
          `Settings · ${settings.defaultUnit} · ${settings.theme} theme were not updated.`,
          `Settings updated · ${settings.defaultUnit} · ${settings.theme} theme.`,
        ),
      replaceData: (incoming: PersistedRoot) =>
        commit(
          incoming,
          'The backup was not restored.',
          `Backup restored · ${incoming.programs.length} program versions · ${incoming.sessionLogs.length} sessions.`,
        ),
      mergeData: (incoming: PersistedRoot) => {
        const merged = mergePersistedRoots(data, incoming);
        if (!merged.ok) {
          const result = reject(
            'The backup was not merged.',
            'Merge conflicts must be resolved in the source backup. Nothing was changed.',
          );
          return {
            result,
            conflicts: merged.errors.map((error) => `${error.code}: ${error.message}`),
          };
        }
        return {
          result: commit(
            merged.data,
            'Backup merge',
            `Backup merged · ${merged.data.programs.length} program versions · ${merged.data.sessionLogs.length} sessions now stored.`,
          ),
          conflicts: [],
        };
      },
      activeSession: () => data.sessionLogs.find((log) => log.completedAt === null) ?? null,
      usageBytes: () => adapter.usageBytes(),
      now: () => clock.now(),
      timezone: () => clock.timezone(),
    };
  }, [adapter, clock, commit, data, failure, ids, notice, reject]);

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
