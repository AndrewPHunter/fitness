# 07 — Export & Import

Export is not a convenience feature. Given [05 §5.4 Hazard A](05-persistence.md), **export is
the only backup that exists.** It is graded accordingly.

## 7.1 JSON export — CORE-8

**Lossless and re-importable.** This is the backup format.

```ts
interface ExportDocument {
  format: 'fitness-tracker-export';
  formatVersion: 1;
  exportedAt: string;             // ISO 8601 with offset
  appSchemaVersion: number;       // the PersistedRoot.schemaVersion at export time
  data: PersistedRoot;            // verbatim
}
```

Requirements:

| ID | Requirement |
|---|---|
| EXP-1 | Contains the complete `PersistedRoot`: every program, every session log, every set, settings, active-program pointer |
| EXP-2 | Nothing is summarised, rounded, truncated, or reformatted |
| EXP-3 | `Load` values retain their original `unit`; no conversion ([02 §2.9](02-domain-model.md)) |
| EXP-4 | Serialisation is a pure function of `(PersistedRoot, exportedAt)` |
| EXP-5 | Filename includes an ISO date, e.g. `fitness-export-2026-09-10.json` |
| EXP-6 | Export performs no writes and mutates no state |

**EXP-7 — the round-trip guarantee.** For any `PersistedRoot` *R*:

```
fromExportJson(toExportJson(R, t)).data  ≡  R
```

Deep equality, no exceptions. This must be verified by a property-style test over multiple
committed fixtures, not by a single hand-checked example ([C6](00-constitution.md)).

## 7.2 CSV export — CORE-8

**Flattened for analysis.** Lossy by design, and never a backup.

One row per logged set. Header row required. Exact columns, in this order:

```
session_log_id,program_id,program_version,session_id,session_name,started_at,completed_at,
exercise_id,exercise_name,block_index,block_type,entry_index,set_index,
prescribed_sets,prescribed_reps,target_weight_value,target_weight_unit,target_rpe,
actual_weight_value,actual_weight_unit,actual_reps,actual_rpe,logged_at
```

| ID | Requirement |
|---|---|
| CSV-1 | RFC 4180 quoting. Fields containing `,` `"` or newline are quoted; embedded `"` is doubled |
| CSV-2 | Absent optional values are the **empty string**, never `null`, `undefined`, `NaN`, or `0` |
| CSV-3 | Timestamps are ISO 8601 with offset, unmodified from storage |
| CSV-4 | Rows ordered by `started_at` ascending, then `block_index`, `entry_index`, `set_index` |
| CSV-5 | `exercise_name` and prescribed columns are resolved from the program version the set was logged against — **not** from the currently active program |
| CSV-6 | Serialisation is a pure function; no locale-dependent number or date formatting |

CSV-5 is the subtle one. A set logged eighteen months ago under v1 must export with v1's
prescription, not v4's. Resolving against the active program would silently rewrite history —
a [C3](00-constitution.md) violation.

CSV-2 matters because `0` and empty are meaningfully different: a set logged at RPE 0 is
impossible, but a set with RPE unrecorded is routine. Writing `0` for "not recorded" would be
the app inventing data ([C1](00-constitution.md)).

## 7.3 Import — CORE-9

Accepts a file previously produced by JSON export. This is the restore path.

### Validation

Import is a trust boundary and is validated as strictly as program upload
([03 §3.2](03-program-schema.md)), returning the same `ValidationResult` shape and reporting
**all** errors.

| ID | Rule |
|---|---|
| IMP-1 | `format` is exactly `'fitness-tracker-export'` |
| IMP-2 | `formatVersion` is recognised. Unrecognised → visible error, no write |
| IMP-3 | `data.schemaVersion` is present, numeric, and not newer than the app's current version |
| IMP-4 | `data` is structurally valid; every contained `Program` re-validates fully |
| IMP-5 | Referential integrity: every `SessionLog` references a `(programId, version)` present in `data.programs` |
| IMP-6 | If `data.schemaVersion` is older, migrations run ([05 §5.3](05-persistence.md)) |

### Import modes

The user chooses explicitly. There is no default and no silent behaviour.

| Mode | Behaviour |
|---|---|
| **Replace** | Discard all current data, install the imported document. Requires confirmation stating exactly what will be lost — counts of programs, sessions and sets |
| **Merge** | Union current and imported data, deduplicating by `sessionLogId`, `setLogId`, and `(programId, version)` |

**IMP-7 — Merge conflict rule.** Where the same identifier exists on both sides with differing
content, the import **fails with a listed conflict report**. It must not pick a winner, must not
merge field-by-field, and must not apply last-write-wins. Silently choosing between two versions
of the user's training history is exactly the kind of quiet data loss [C3](00-constitution.md)
forbids.

**IMP-8** — Import is atomic. Either the entire operation succeeds, or storage is left exactly
as it was. A partially applied import is forbidden.

## 7.4 File handling

- Export triggers a download via a Blob object URL. The URL is revoked after use.
- Import reads a user-selected `File` via `FileReader` or `File.text()`.
- Both are confined to `platform/files/` ([04 §4.5](04-architecture.md)).
- No network involvement anywhere in either path.
