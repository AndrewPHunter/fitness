# 10 — Acceptance Criteria & Scoring Rubric

This document is the grading instrument. It is public and part of the specification: an
implementation is entitled to know what it will be measured against.

## 10.1 How the evaluation is run

1. Give the implementer this repository. The task is: *build the application described in
   `specs/`.* No further clarification is offered — the specification is self-contained by design.
2. The implementation is committed to a branch. `specs/` and `fixtures/` must be unmodified
   (DEP-19).
3. Run the gate checks (§10.2). Any failure ends the evaluation with a verdict of **FAIL**.
4. Score the Core criteria (§10.3), the Extended criteria (§10.4), and apply constitution
   deductions (§10.5).
5. Record the verdict (§10.6).

Every criterion is checked by **observation or execution**, never by reading a claim in a
README. If a criterion cannot be demonstrated, it does not pass.

## 10.2 Gate criteria — P0

All seven must pass. Any failure is a **FAIL** regardless of everything else.

| ID | Gate | How verified |
|---|---|---|
| G1 | The deployed GitHub Pages site loads and renders the app | Open the live URL. A blank page, a 404, or console-fatal errors = fail |
| G2 | `fixtures/programs/02-every-other-day-rotation.json` uploads and validates | Upload it in the running app |
| G3 | A full session can be logged, and survives a page reload | Log every set of one session, reload, confirm all sets present |
| G4 | Both invalid fixtures are rejected, and **nothing** is written | Upload `05-invalid-structural.json` and `06-invalid-semantic.json`; inspect `localStorage` before and after each — must be byte-identical |
| G5 | JSON export → clear storage → import restores data exactly | Compare `PersistedRoot` before and after by deep equality |
| G6 | Zero runtime network requests | Load deployed site, open network panel, reload, filter out same-origin app assets — must be empty |
| G7 | CI passes on the submitted commit | Inspect the Actions run |

## 10.3 Core criteria — 100 points

### A. Program ingestion & validation — 15 pts

| ID | Criterion | Pts |
|---|---|---|
| A1 | Structural validation uses a real JSON Schema draft 2020-12 validator against the published schema | 2 |
| A2 | Semantic validation implements all of SEM-1..SEM-8; `06-invalid-semantic.json` yields all 7 of its errors | 4 |
| A3 | **All** validation errors are reported, not just the first; `05-invalid-structural.json` yields all 8 | 3 |
| A4 | Correct RFC 6901 pointers, actionable messages, and control-keyword artifacts filtered (ERR-1..ERR-4) — 8 errors surface for fixture 05, not 13 | 3 |
| A5 | Errors render individually in the UI; no generic "invalid file" message | 2 |
| A6 | Duplicate `(programId, version)` is rejected (STO-1) | 1 |

### B. Scheduling — 7 pts

| ID | Criterion | Pts |
|---|---|---|
| B1 | Rotation mode resolves next session by completed-count modulo sequence length | 2 |
| B2 | Rotation wraps correctly past the end of the sequence | 1 |
| B3 | Repeated `sessionId`s within a sequence are handled correctly | 1 |
| B4 | Weekday mode resolves today's session using the injected clock | 2 |
| B5 | Weekday mode on a rest day shows the next training day, with no missed-day judgement | 1 |

### C. Session logging — 15 pts

| ID | Criterion | Pts |
|---|---|---|
| C1 | Weight, reps and RPE are logged per set; RPE may be omitted and stores `null` | 3 |
| C2 | Weight prefills from the most recent log of that `exerciseId` across all programs | 3 |
| C3 | Prefill falls back to `targetWeight`, then to empty | 1 |
| C4 | An untouched prefill is **not** persisted as a logged set (SES-4) | 2 |
| C5 | Supersets are logged round-robin (SES-11) | 3 |
| C6 | Each confirmed set is written immediately and survives a mid-session reload | 2 |
| C7 | Prescribed and actual values are visually distinguishable at a glance | 1 |

### D. History & frequency — 9 pts

| ID | Criterion | Pts |
|---|---|---|
| D1 | Per-exercise history spans all programs and versions | 2 |
| D2 | History shows the program and version each set was logged under | 1 |
| D3 | Rolling 7-day and 14-day observed frequency is computed from real logged dates | 3 |
| D4 | Declared `frequencyTargets` are shown beside observed, with no warning or judgement (C9) | 2 |
| D5 | Logged sets can be edited and deleted, with confirmation naming what is lost | 1 |

### E. Persistence & data safety — 13 pts

| ID | Criterion | Pts |
|---|---|---|
| E1 | `schemaVersion` present on all persisted data | 2 |
| E2 | Migration mechanism exists, is forward-only, pure, and tested with a real fixture | 3 |
| E3 | Newer-than-current `schemaVersion` produces a visible error and **no reset** | 2 |
| E4 | Unparseable stored data produces a visible error and offers a raw export | 2 |
| E5 | Writes return an explicit result; callers handle failure | 2 |
| E6 | Quota failure surfaces visibly and the unsaved set is **not** shown as saved (HAZ-B3) | 2 |

### F. Export & import — 11 pts

| ID | Criterion | Pts |
|---|---|---|
| F1 | JSON export contains the complete `PersistedRoot`, unmodified | 2 |
| F2 | Round-trip deep equality holds (EXP-7), verified by test over multiple fixtures | 3 |
| F3 | CSV has exactly the specified columns in the specified order | 1 |
| F4 | CSV quoting is RFC 4180 correct | 1 |
| F5 | CSV distinguishes empty from zero (CSV-2) | 1 |
| F6 | CSV resolves prescribed values from the **logged** program version, not the active one (CSV-5) | 2 |
| F7 | Import offers explicit Replace and Merge; merge conflicts are **reported**, not resolved (IMP-7) | 1 |

### G. Architecture — 9 pts

| ID | Criterion | Pts |
|---|---|---|
| G1 | `domain/` is pure: no React, no browser APIs, no I/O | 2 |
| G2 | Clock, ids and storage are injected, never called ambiently from domain logic | 2 |
| G3 | Storage access is confined to a single adapter behind an interface | 2 |
| G4 | Layer boundaries ARCH-1..ARCH-4 are **mechanically enforced** by lint, not just documented | 2 |
| G5 | `ui/` follows atomic composition rules and is presentational only; features are sliced by domain | 1 |

### H. Quality — 14 pts

| ID | Criterion | Pts |
|---|---|---|
| H1 | `strict: true`, `noUncheckedIndexedAccess`, `tsc --noEmit` clean | 2 |
| H2 | No `as` assertion on data crossing a trust boundary (TS-4) | 2 |
| H3 | Lint committed, covers TS/React/hooks/a11y, repository is **warning**-clean | 2 |
| H4 | Every behaviour in the [08 §8.3](08-quality-standards.md) test table is genuinely covered | 4 |
| H5 | Tests pass under a non-UTC timezone in CI (TEST-2) | 2 |
| H6 | No test asserts a mocked success in place of real behaviour; the quota test induces a real failure | 2 |

### I. UX & accessibility — 7 pts

| ID | Criterion | Pts |
|---|---|---|
| I1 | Usable at 320 px wide; no horizontal scroll at any supported width | 1 |
| I2 | Logging-path targets ≥ 44×44 px; numeric inputs present a numeric keypad | 2 |
| I3 | WCAG AA contrast in both light and dark themes | 1 |
| I4 | Full keyboard operability with visible focus | 1 |
| I5 | Every screen has a defined empty state | 1 |
| I6 | Every failable action has an error state distinct from its success state | 1 |

## 10.4 Extended criteria — up to 30 bonus points

Bonus only. Zero here with a strong Core score is a good outcome.

| ID | Capability | Pts |
|---|---|---|
| EXT-1 | Rest timer surviving reload and backgrounding | 4 |
| EXT-2 | Estimated 1RM, with the formula named in the UI | 2 |
| EXT-3 | Volume totals per session and per exercise | 2 |
| EXT-4 | Personal-record detection | 3 |
| EXT-5 | Per-exercise progress charts | 3 |
| EXT-6 | Exercise aliasing across `exerciseId`s | 4 |
| EXT-7 | Installable PWA with offline app shell | 4 |
| EXT-8 | Screen wake lock during a session | 2 |
| EXT-9 | Backup staleness indicator from a real recorded timestamp | 2 |
| EXT-10 | Full mid-session position resume | 4 |

An Extended feature that is **partially implemented or misleading scores zero and additionally
incurs the §10.5 deduction.** A convincing-looking chart of fabricated data is worse than no
chart.

## 10.5 Constitution deductions

Violations of [00-constitution.md](00-constitution.md) are deducted from the Core score. These
are not missing features; they are the app being dishonest, which the constitution treats as
disqualifying in kind.

| Violation | Deduction |
|---|---|
| Invalid program silently coerced, defaulted, or partially imported (C2) | −15 |
| Storage write failure swallowed; UI shows data as saved that was not (C1, C3) | −15 |
| Stored data cleared or reset to recover from an error (C3, C5) | −20 |
| Unit conversion applied to stored values (C3, §2.9) | −10 |
| Placeholder or non-functional control presented as working (C1) | −10 |
| Domain logic calling `Date.now()` / `Math.random()` ambiently (C4) | −8 |
| Progression logic, rule evaluation, or constraint solving introduced (C8) | −10 |
| Declared targets enforced, validated against, or used to warn the user (C9) | −8 |
| Merge conflict silently resolved by last-write-wins (C3, IMP-7) | −10 |
| A test that mocks away the behaviour it claims to verify (C6) | −8 |

## 10.6 Verdict

> **Superseded.** The band table below has a gap at 100% Core with no Extended
> work. Repaired in [Amendment 002 §12.6](12-amendment-002-paste-import.md), which adds the
> **Complete** band. Use the repaired table.

```
Final = Core (max 100) − Deductions + Extended (max 30)
```

| Band | Range | Meaning |
|---|---|---|
| **Fail** | Any gate failed, or Final < 50 | Not a working implementation of this specification |
| **Partial** | 50–69 | Core product works; significant specified behaviour missing or dishonest |
| **Pass** | 70–84 | A correct, honest implementation of the specification |
| **Strong** | 85–99 | Correct, with the hard cases — round-robin, historical resolution, quota, timezone — handled |
| **Exceptional** | 100+ | All of the above, plus meaningful Extended work, with no deductions |

## 10.7 What this evaluation does and does not measure

Stated plainly so the result is not over-read.

**It measures:** specification adherence; strict boundary validation; architectural discipline
under enforced constraints; data-integrity handling at genuinely awkward edges (quota, timezone,
historical version resolution, merge conflicts); test honesty; and correct static deployment to
a subdirectory.

**It does not measure:** domain reasoning about training. By the deliberate decision recorded in
[C8](00-constitution.md), the schema is descriptive and the app interprets nothing. An
implementation cannot earn credit here for clever programming logic, because none is wanted.

**Known bias:** the rubric weights correctness and honesty far above visual design. An
implementation with an outstanding interface and a swallowed write error will score below a
plain one that reports failures properly. That weighting is deliberate.
