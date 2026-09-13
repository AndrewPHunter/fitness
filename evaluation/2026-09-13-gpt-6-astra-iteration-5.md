# Evaluation — GPT-6 Astra, iteration 5, 2026-09-13

|                |                                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| Model          | GPT-6 Astra                                                                        |
| Type           | **Iteration** — not comparable to a cold one-shot ([iterations.md](iterations.md)) |
| Spec baseline  | `7523d87` (original spec + Amendments 001–004)                                     |
| Implementation | PR #12, `astra/iteration-5`, merged as `956832d`                                   |
| Brief          | Amendment 004 (rep ranges + per-set prescription)                                  |
| Interventions  | None                                                                               |
| Graded by      | Claude Opus 5, by execution                                                        |

## Verdict

```
Core 150/150 (100%)  −  Deductions 0  +  Extended 0/26  =  150      Band: Complete
```

Gate **G12 passes**. Both traps avoided. No regression across rounds 1–4. The iteration 4 process
violation was corrected — this round used a pull request.

## Section N — Rep ranges — 6/6

| ID  | Criterion                                      | Result                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | Ranges display as ranges                       | Pass — the session screen renders `3 sets × 8–12 reps`                                                                                                                                                                                         |
| N2  | SEM-9 strictly greater, actionable message     | Pass — `repsMax` 8 against `reps` 8 gives _"repsMax must be greater than reps to form a range; found reps 8 and repsMax 8. Increase repsMax or remove it for a fixed rep target."_ Enforced at entry level **and** inside each per-set element |
| N3  | `prescribed_reps_max` in CSV, correctly placed | Pass — immediately after `prescribed_reps`; a test covers "empty or present rep maximum"                                                                                                                                                       |
| N4  | No attainment logic (RNG-5)                    | Pass — see below                                                                                                                                                                                                                               |

### RNG-5, the trap

Tested directly: with an `8–12` range prescribed, **12 reps** — the top of the range — was logged.

The app said nothing. No flag, no highlight, no "ready to progress", no suggestion to add load.
The saved row reads `✓ Saved · Back Squat · 140 kg × 5`, identical in form to any other set.

Corroborated by static search: the only `repsMax` references in the codebase are
`prescribedReps()`, a pure string formatter, and SEM-9 validation. The only `reps` comparisons
anywhere are SEM-9 and an input-sanity `reps >= 0`. There is no code that could evaluate
attainment.

## Section O — Per-set prescription — 10/10

| ID  | Criterion                                                  | Result                                                                                                                                           |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| O1  | Array accepted, integer unchanged                          | Pass                                                                                                                                             |
| O2  | Each set shows its own prescription in order               | Pass — see below                                                                                                                                 |
| O3  | SEM-11 with a message naming the field and its destination | Pass — see below                                                                                                                                 |
| O4  | Superset round-robin with array form, uneven counts        | Pass — `plannedSets` reads `entrySetCount()` in both branches; unit test _"round-robins uneven array and scalar entries using each entry count"_ |
| O5  | CSV resolves per-set values from the governing element     | Pass — `prescriptionAt(entry, setLog.setIndex)`; test _"exports the governing per-set values"_                                                   |
| O6  | Fixture 07 imports and a session logs end to end           | Pass                                                                                                                                             |

### O2 — verified set by set

Logging through the squat entry of fixture 07, the prescription panel changed with each set:

| Set | Displayed                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------- |
| 1   | `Set 1 of 3 · 5 reps · 140 kg · RPE 9.5 · Rest 300s` + _"Top set. Only this one goes near failure."_ |
| 2   | `Set 2 of 3 · 6 reps · 120 kg · RPE 8 · Rest 180s`                                                   |
| 3   | `Set 3 of 3 · 6 reps · 120 kg · RPE 8 · Rest 180s`                                                   |

Per-set `restSeconds` and per-set `notes` both render, and the entry-level note _"Belt from the
top set onward"_ appears separately — the two scopes stay distinct, as SET-7 intends.

### O3 — SEM-11

An entry with an array `sets` plus entry-level `reps`, `targetRpe` and `restSeconds` produced
**three** errors, one per field, each naming the field and where it belongs:

> `SEM-11 · /sessions/0/blocks/0/entry/reps` — Entry-level field `"reps"` is not allowed when sets
> is an array. Move `"reps"` into the applicable object or objects in
> `/sessions/0/blocks/0/entry/sets`.

Nothing was written to storage.

## Gate G12

Fixture 07 was pasted, imported, activated and logged. The import preview reported 5 new exercise
IDs and 0 known, correct for freshly cleared storage.

## G11 — closed incidentally

Iteration 4's record listed G11 as _not independently verified_, because no new build had been
deployed to observe a waiting worker. This round's deploy supplied one, and it was observed live:

| Stage            | Observed                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Before           | `↑ New version available — Your current version stays in place until you choose to update.` |
| After activating | `✓ New version installed — Reload when you are ready. Nothing will reload automatically.`   |

Two explicit user actions, no automatic reload. **G11 is now verified end to end.** Iteration 4's
record is left as written; this confirms its mechanism rather than changing its score.

Worth noting what the old shell did while waiting: it rejected fixture 07, because iteration 4's
cached build does not know `repsMax`. That is the honest outcome — a stale shell that refuses
input it genuinely cannot handle, rather than silently mis-parsing it.

## Regression — none

| Check                                                     | Result                                         |
| --------------------------------------------------------- | ---------------------------------------------- |
| typecheck / lint `--max-warnings 0` / prettier / contrast | Clean                                          |
| Suite under `TZ=America/Phoenix`                          | 68 tests pass (was 57)                         |
| Invalid fixtures 05 / 06, pasted                          | Exactly 8 and 7 errors, storage byte-identical |
| `specs/`, `fixtures/`, `evaluation/`                      | Untouched (IT-5)                               |
| Scope                                                     | 13 files, all additive or directly required    |

## Process — violation corrected

Iteration 4 committed straight to `main` with no pull request, against its brief. The iteration 5
brief called this out explicitly, and this round used PR #12 with CI green before merge.

## What was NOT independently verified

- Real iOS installation and `standalone` behaviour on a device
- VIS-1..VIS-5 at arm's length on physical hardware
- CSV export through the UI download path — verified at the domain layer by reading `toCsv.ts` and
  by the committed tests, not by opening a downloaded file
- Superset round-robin with the array form **live** — verified by unit test and code reading
  rather than by logging session B end to end
