# Evaluation — GPT-6 Astra, iteration 2, 2026-09-10

|                |                                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| Model          | GPT-6 Astra                                                                        |
| Type           | **Iteration** — not comparable to a cold one-shot ([iterations.md](iterations.md)) |
| Spec baseline  | `1d58f54` (original spec + Amendment 001)                                          |
| Implementation | PR #4, `astra/iteration-2`                                                         |
| Brief          | Amendment 001 only                                                                 |
| Interventions  | None                                                                               |
| Graded by      | Claude Opus 5, by execution                                                        |

## Verdict

```
Core 110/110 (100%)  −  Deductions 0  +  Extended 0/30  =  110
```

**Gate G8 passes**, verified the only way it can be: a program was authored by following the
copied prompt alone, then uploaded. It validated on the first attempt.

## Section J — 10/10

| ID  | Criterion                                                  | Result                                                                                                                                          |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| J1  | `#/author` in nav, linked from `#/programs`                | Pass — "02 Author"; Programs shows _"No JSON file yet? → Open authoring kit"_                                                                   |
| J2  | One-action copy of the complete prompt                     | Pass — "Copy personalized prompt", labelled the primary action, above the fold                                                                  |
| J3  | Schema and worked example downloadable                     | Pass                                                                                                                                            |
| J4  | Bundled from `fixtures/` at build time                     | Pass — `?raw` imports of `authoring-prompt.md`, `program.schema.json`, `02-every-other-day-rotation.json`. Single source of truth; cannot drift |
| J5  | User's own `exerciseId`s injected (AUT-8)                  | Pass — 9 real IDs injected under a dedicated heading, placed before `## Output rules`                                                           |
| J6  | Injected list shown before copying                         | Pass — "INJECTED BEFORE COPYING · 9 IDs"                                                                                                        |
| J7  | Clipboard failure visible, fallback always present (AUT-9) | Pass — fallback textarea is permanently rendered, not revealed on failure; carries the same personalised text                                   |

## Gate G8 — the end-to-end test

Method: copied the prompt from the app, authored a program from it and nothing else, uploaded
the result.

The program validated first time, and the import preview reported:

> **Already known:** `barbell-bench-press`, `barbell-row`, `face-pull`, `dip`,
> `barbell-back-squat`, `barbell-deadlift`, `barbell-overhead-press`, `chin-up`, `ez-bar-curl`
> **New exercise IDs:** None

Nine out of nine reused. This is AUT-8 working as intended: the drift risk in
[02 §2.2](../specs/02-domain-model.md) closed by the app supplying the IDs rather than asking the
user to remember them.

## Regression — no loss

| Check                                                                | Result                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `e2e/core-flow.spec.ts`                                              | Untouched, still green in CI                                          |
| Validation, export, storage, provider                                | **Untouched.** Zero regression surface                                |
| Fixtures 05 / 06 still yield exactly 8 and 7 errors, writing nothing | Pass (round-1 e2e asserts both)                                       |
| Suite under `TZ=America/Phoenix`                                     | 44 tests pass (was 24)                                                |
| typecheck / lint `--max-warnings 0` / prettier                       | All clean                                                             |
| `tsconfig.json` change                                               | Additive only (`vite/client` for `?raw`). Not a strictness regression |

IT-3 scope discipline was honoured exactly: no passing code was rewritten.

## H4 recovered — +1

The round-1 deduction was thin coverage where the specification named multiple distinct boundary
cases. All of them are now covered by name:

- `history`: 2 → 9 tests — prefill across sources, prefill vs declared target, target fallback,
  empty fallback, and 7/14-day windows inclusive of today
- `nextSession`: 2 → 7 tests — rotation wrap with repeated entries, injected-timezone today, and
  rest-day forward scan

H4 goes to 4/4, taking Core to its ceiling.

## A defect in the rubric, not the implementation

110/110 is 100% of Core with zero Extended work. [10 §10.6](../specs/10-acceptance-criteria.md)
defines **Strong** as 85–99% and **Exceptional** as _"100%, plus meaningful Extended work"_ — so a
perfect Core score with no Extended features falls in a gap between the two bands.

Recorded here as **Core ceiling**. It is my defect, noted rather than silently resolved in the
implementation's favour.

**Subsequently repaired** by [Amendment 002 §12.6](../specs/12-amendment-002-paste-import.md),
which adds a **Complete** band for exactly this outcome. This result is relabelled Complete. The
score is unchanged.

## What was NOT independently verified

- WCAG AA contrast ratios — still assessed by inspection, not measured
- Keyboard operability and focus indicators
- Real clipboard denial on iOS Safari — the adapter has a unit test for the failure path, but the
  platform behaviour itself was not reproduced on a device
- VIS-1..VIS-5 judged from the mobile viewport and `DECISIONS.md`, not on physical hardware at
  arm's length

## Open defect, not scored

The specification still requires a program to arrive as a **file**
([01 CORE-1](../specs/01-product-spec.md), [06 §6.3](../specs/06-ui-ux.md)). On a phone that means
saving the LLM's reply into Files and then picking it in Safari. Amendment 001 solved getting the
prompt _out_; it did not address getting the JSON back _in_.

The implementation is correct. The specification is not — the same class of defect as Amendment
001, and the third time the spec has described a repository-centric path rather than a phone one.
`validateProgramText(text)` already accepts a string, so the domain layer is ready; only the
affordance is missing.
