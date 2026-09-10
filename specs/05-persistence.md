# 05 — Persistence

All persistence is browser `localStorage`. There is no backend, no IndexedDB requirement, and
no sync. Access is confined to `platform/storage/` ([04 §4.5](04-architecture.md)).

## 5.1 Keys

| Key | Contents |
|---|---|
| `fitness.v1.root` | The entire persisted document (see §5.2) |

A single key is used deliberately. Splitting the document across keys creates the possibility of
a partially-written state with no transaction to recover it — `localStorage` offers no atomicity
across keys. One key means one write, which either lands or does not.

## 5.2 The persisted document

```ts
interface PersistedRoot {
  schemaVersion: number;          // integer >= 1. REQUIRED. See C5.
  programs: StoredProgram[];
  sessionLogs: SessionLog[];
  settings: Settings;
  activeProgram: { programId: string; version: number } | null;
}

interface StoredProgram {
  program: Program;               // exactly as validated, unmodified
  importedAt: string;             // ISO 8601 with offset
}

interface Settings {
  defaultUnit: 'kg' | 'lb';
  theme: 'system' | 'light' | 'dark';
}
```

`schemaVersion` for the initial implementation is **1**.

## 5.3 Versioning and migration — CORE-10

Governed by [C5](00-constitution.md).

On read, the adapter inspects `schemaVersion` and takes exactly one of four paths:

| Condition | Behaviour |
|---|---|
| Key absent | Initialise a fresh document at the current version. Normal first run. |
| `schemaVersion === CURRENT` | Use as-is. |
| `schemaVersion < CURRENT` | Run forward migrations in sequence, then write the result back. |
| `schemaVersion > CURRENT` | **Visible error.** Refuse to proceed. Do not read, do not reset. |
| `schemaVersion` missing or non-numeric | **Visible error.** Refuse to proceed. Do not reset. |

The final two rows are the important ones. Data from a newer version of the app, or data that
is unrecognisable, means the app cannot safely interpret what is stored. Clearing it and
starting fresh would destroy history to make an error message go away — a
[C3](00-constitution.md) violation of the most serious kind.

In both error cases the app must:

1. Display a blocking error explaining what was found and what was expected
2. Offer a **raw export** of the unparsed stored string, so the user can rescue their data
3. Not write anything

### Migration implementation

- Migrations live in `domain/migration/` and are **pure functions**: `(vN) => vN+1`.
- Forward-only. No down-migrations.
- Each migration has a unit test using a committed fixture of the prior shape.
- Migrations run in sequence; a migration must never skip a version.
- Even at `schemaVersion: 1`, the migration mechanism must exist and be tested with at least one
  registered migration path. A mechanism that is only asserted to work is not proof
  ([C6](00-constitution.md)).

## 5.4 The two real hazards

These are not hypothetical. They are the expected failure modes of this design and must be
handled explicitly.

### Hazard A — iOS Safari eviction

On iOS, `localStorage` for a site that has **not** been added to the home screen may be evicted
after roughly seven days without use. The stated usage pattern — one phone, used at the gym —
sits directly in that window during any training layoff.

Required mitigations:

| ID | Requirement | Tier |
|---|---|---|
| HAZ-A1 | The `#/data` screen states plainly that browser storage can be cleared by the OS, and that export is the only backup | Core |
| HAZ-A2 | Written guidance to install the app to the home screen | Core |
| HAZ-A3 | A backup staleness indicator showing days since last export | [EXT-9](01-product-spec.md) |

HAZ-A3, if implemented, must reflect a real recorded export timestamp. A hardcoded or
approximated value is a [C1](00-constitution.md) violation.

### Hazard B — quota exhaustion

`localStorage` quota is typically ~5 MB. Set-level history across years, plus stored program
files, can approach it.

Required behaviour:

| ID | Requirement |
|---|---|
| HAZ-B1 | Every write is wrapped so that a `QuotaExceededError` is caught and returned as a failure result — never swallowed |
| HAZ-B2 | On quota failure the UI shows a blocking, actionable error: what failed, and that the user should export and prune |
| HAZ-B3 | The set the user just logged must not appear as saved when the write failed |
| HAZ-B4 | `#/data` displays current approximate usage in bytes and as a percentage of an assumed 5 MB budget, labelled as approximate |
| HAZ-B5 | Quota failure is covered by a test that induces a real adapter failure, not one that asserts a mocked success |

HAZ-B3 is the one most likely to be missed. Optimistic UI that shows the set as recorded before
confirming the write, and does not roll back on failure, is a direct [C1](00-constitution.md)
violation: the app would be claiming to have saved data it lost.

## 5.5 The write contract

Every storage write returns an explicit result. Fire-and-forget writes are forbidden.

```ts
type WriteResult =
  | { ok: true }
  | { ok: false; reason: 'quota' | 'unavailable' | 'serialisation'; detail: string };
```

- `unavailable` covers `localStorage` being absent or blocked, e.g. private browsing.
- Callers must handle `ok: false`. Ignoring the result is a Core failure.
- The in-memory state must not diverge from what was actually persisted. On write failure the
  in-memory change is rolled back, or the UI is put into an explicit unsaved-error state. It must
  never silently continue as if the write succeeded.

## 5.6 Active-session checkpointing

A session in progress ([02 §2.8](02-domain-model.md), `completedAt === null`) is persisted as it
is logged, not held only in memory. A browser tab discarded mid-workout — routine on a phone —
must not lose logged sets.

- Each logged set is written when it is confirmed.
- On launch, if an in-progress `SessionLog` exists, the Today screen offers to resume it.
- Full resumption of position within the session is [EXT-10](01-product-spec.md); **not losing
  the logged sets** is Core.
