# 14 — Amendment 004: Rep Ranges and Per-Set Prescription

| | |
|---|---|
| **Status** | Active |
| **Raised** | 2026-09-13, by the owner while authoring a real program |
| **Amends** | [01 §1.4](01-product-spec.md), [01 §1.5](01-product-spec.md), [03](03-program-schema.md), [07 §7.2](07-export-import.md) |
| **Baseline preserved at** | `f885182` — the specification as evaluated in iteration 4 |

Requested product work, not a defect correction. Both additions extend the **descriptive** schema.
Neither adds logic, evaluation or computation, so both remain consistent with
[C8](00-constitution.md).

Two of the original non-goals in [01 §1.5](01-product-spec.md) are withdrawn: rep ranges, and
differing weights across the sets of one exercise. Everything else in that list stands —
AMRAP, percentages of 1RM, progression rules, deload logic, time- and distance-based work, drop
sets, rest-pause, tempo, and nested supersets remain out of scope.

## 14.1 Already shipped with this amendment

`fixtures/` is a control artifact the implementer must not modify ([iterations.md](../evaluation/iterations.md), IT-5),
so the format changes themselves are made here and are already in place:

| File | Change |
|---|---|
| `fixtures/schema/program.schema.json` | `repsMax`, the array form of `sets`, and a `perSetPrescription` definition |
| `fixtures/authoring-prompt.md` | Both features documented; the two withdrawn limits removed; self-check extended |
| `fixtures/programs/07-ranges-and-per-set.json` | New valid fixture exercising both, including inside a superset |

Verified before commit: fixtures 01–04 and 06 validate exactly as before, and
`05-invalid-structural.json` still produces **the same 8 errors with the same codes and paths**, so
[`fixtures/expected/`](../fixtures/expected/) remains accurate.

## 14.2 Part A — Rep ranges (`repsMax`)

| ID | Capability |
|---|---|
| **CORE-17** | An entry may prescribe a rep range, displayed as a range and logged against normally |

`repsMax` is an optional integer beside `reps`. `reps` remains the floor and stays required in the
scalar form; `repsMax` is the ceiling.

| ID | Requirement |
|---|---|
| RNG-1 | Where `repsMax` is present, the prescription displays as a range (e.g. `8–12`) wherever prescribed reps are shown |
| RNG-2 | Logging is unchanged: the user records one integer of actual reps |
| RNG-3 | History and prefill are unchanged. Prefill remains a **weight** lookup by `exerciseId` ([02 §2.10](02-domain-model.md)) |
| RNG-4 | CSV gains `prescribed_reps_max`, immediately after `prescribed_reps`, empty when absent ([07 §7.2](07-export-import.md), CSV-2) |

### RNG-5 — No attainment logic. This is the trap.

A range invites the app to notice when the top of it is reached. It must not.

**Forbidden:**

- Flagging, highlighting, colour-coding or annotating a set that reaches `repsMax`
- Any "add weight" or "ready to progress" suggestion, however phrased
- Any comparison of logged reps against the range beyond displaying both

Deciding when to add load is the user's job, done by looking at history. An app that evaluated
range attainment would be executing a progression rule — [C8](00-constitution.md) — and judging
the user against a declared target — [C9](00-constitution.md).

## 14.3 Part B — Per-set prescription (array form of `sets`)

| ID | Capability |
|---|---|
| **CORE-18** | An entry may prescribe each of its sets individually, in order |

`sets` may be an integer count as now, **or** an array of 1–20 per-set objects. Element fields:
`reps` required; `repsMax`, `targetWeight`, `targetRpe`, `restSeconds`, `notes` optional.

| ID | Requirement |
|---|---|
| SET-1 | Integer `sets` behaves exactly as today. This is a strictly additive change |
| SET-2 | Array `sets` prescribes each set in order; element *i* governs set *i* |
| SET-3 | Set count is `sets.length` for arrays and the integer otherwise, everywhere a count is needed |
| SET-4 | Supersets support both forms identically. Round-robin ordering ([06](06-ui-ux.md), SES-11) reads the per-entry count per SET-3 |
| SET-5 | The active-session screen shows **that set's own** prescription, not an entry-level summary |
| SET-6 | CSV resolves `prescribed_reps`, `prescribed_reps_max`, `target_weight_*` and `target_rpe` from the element governing that row's `setIndex`. `prescribed_sets` is the count per SET-3 |

### SET-7 — One source of truth per set. This is the trap.

When `sets` is an array, the entry must **not** also carry `reps`, `repsMax`, `targetWeight`,
`targetRpe` or `restSeconds`. Those describe a set, and the elements now do that.

An entry-level `notes` remains allowed, because it describes the exercise within the session
rather than any one set.

`additionalProperties` cannot catch this — the properties are legal, just not together. It is a
semantic rule (SEM-11 below), and its message must say which field to move where.

## 14.4 Validation

Three new Layer 2 rules ([03 §3.1](03-program-schema.md)). Layer 1 is already updated.

| ID | Rule |
|---|---|
| SEM-9 | Where `repsMax` is present, `repsMax > reps` **strictly**. Equal values are rejected |
| SEM-10 | Where `sets` is an integer, entry-level `reps` is required *(enforced in Layer 1 by conditional; restated here for completeness)* |
| SEM-11 | Where `sets` is an array, entry-level `reps`, `repsMax`, `targetWeight`, `targetRpe` and `restSeconds` are forbidden |

SEM-9 rejects `reps: 8, repsMax: 8` because it is a range that is not a range — the same
principle by which SEM-7 and SEM-8 reject unused exercises and unreachable sessions.

The schema expresses the `sets` union with `if`/`then` on the array branch, **not `oneOf`**,
because a bare union emits paired type errors for every malformed value — exactly the noise
ERR-1..ERR-4 ([03 §3.5](03-program-schema.md)) exist to remove. This is already done in the
shipped schema; do not change it.

## 14.5 Design decisions

Recorded because they were asked, and because the reasoning constrains implementation.

**No format-version field.** Both additions are optional, so every existing file stays valid. The
only risky direction is a new file meeting an older build, which `additionalProperties: false`
already rejects with `Unrecognised property "repsMax"` — honest and specific. A `formatVersion`
would buy a slightly better message at the cost of a second correctness surface (files declaring
one revision while using another) and confusion with the existing `version` field, which means
something entirely different.

**Supersets included.** Superset `entries` are `ExerciseEntry`, so the capability falls out of the
shared type. Excluding it would be an extra rule with no benefit, and the round-robin expansion
generalises by reading a count rather than an integer field.

**Arrays of identical elements are permitted.** Requiring the scalar form when all elements match
was considered and rejected: being explicit is a legitimate authoring choice, and it is not worth
another rule.

## 14.6 Acceptance criteria

### N. Rep ranges — 6 pts

| ID | Criterion | Pts |
|---|---|---|
| N1 | Ranges display as ranges wherever prescribed reps appear | 1 |
| N2 | SEM-9 enforced, strictly greater, with an actionable message | 2 |
| N3 | `prescribed_reps_max` in CSV, correctly placed, empty when absent | 1 |
| N4 | **No attainment logic anywhere** (RNG-5) | 2 |

**RNG-5 violations also incur the [C8/C9 deductions](10-acceptance-criteria.md).**

### O. Per-set prescription — 10 pts

| ID | Criterion | Pts |
|---|---|---|
| O1 | Array form accepted; integer form unchanged | 1 |
| O2 | Each set displays its own prescription in order (SET-5) | 2 |
| O3 | SEM-11 enforced with a message naming the field and where it belongs | 2 |
| O4 | Superset round-robin correct with array form, including uneven counts (SET-4) | 2 |
| O5 | CSV resolves per-set values from the governing element (SET-6) | 2 |
| O6 | Fixture 07 imports, and a session from it can be logged end to end | 1 |

### Gate G12

| ID | Gate | How verified |
|---|---|---|
| G12 | A program using both features can be authored from the in-app prompt, imported, and logged | Copy the prompt from `#/author`, produce a program using a range and a per-set array, paste it, import it, log the session, and confirm each set showed its own prescription |

### Revised totals

Core becomes **150 points**. Extended remains 26. Bands stay percentages of the applicable Core
total ([Amendment 002 §12.6](12-amendment-002-paste-import.md), as repaired).

## 14.7 Effect on recorded evaluations

None. Rounds 1–4 were graded against earlier baselines and are not rescored.
