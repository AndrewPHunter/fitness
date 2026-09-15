# Evaluations

Recorded results of implementing [`../specs/`](../specs/) in a single pass.

## Baseline

|                        |                                                                                |
| ---------------------- | ------------------------------------------------------------------------------ |
| Specification baseline | `a7bd40c343cb879c3cf5a92972e3e750e6ada07e`                                     |
| Contents               | 11 spec documents, JSON Schema, 6 fixtures. No implementation, no scaffolding. |

Every evaluation states the spec commit it was run against. Amendments after that commit
([`../specs/11-amendment-001-program-authoring.md`](../specs/11-amendment-001-program-authoring.md))
do **not** apply retroactively to earlier runs.

## Results

Cold one-shots and iterations measure different things and are tracked separately in
[`iterations.md`](iterations.md). They are never averaged.

| #   | Date       | Model       | Type          | Baseline  | Gates    | Core    | Ext  | Final   | Band             |
| --- | ---------- | ----------- | ------------- | --------- | -------- | ------- | ---- | ------- | ---------------- |
| 1   | 2026-09-10 | GPT-6 Astra | Cold one-shot | `a7bd40c` | 7/7      | 99/100  | 0/30 | **99**  | Strong           |
| 2   | 2026-09-10 | GPT-6 Astra | Iteration     | `1d58f54` | G8 pass  | 110/110 | 0/30 | **110** | Complete [^band] |
| 3   | 2026-09-11 | GPT-6 Astra | Iteration     | `f184055` | G9 pass  | 118/118 | 0/30 | **118** | Complete [^k5]   |
| 4   | 2026-09-13 | GPT-6 Astra | Iteration     | `5777539` | G10 pass | 134/134 | 0/26 | **134** | Complete         |
| 5   | 2026-09-13 | GPT-6 Astra | Iteration     | `7523d87` | G12 pass | 150/150 | 0/26 | **150** | Complete         |

## Method

> **Method correction, 2026-09-14.** UX criteria in rounds 1–5 were verified by DOM inspection —
> text present in the page — not by what a user can perceive. Real use surfaced feedback,
> scroll and navigation defects that method cannot detect. Scores stand against the rubric as
> written, but read those UX passes as _present_, not _perceivable_. See the
> [UX audit](2026-09-14-ux-audit.md).

Per [`../specs/10-acceptance-criteria.md`](../specs/10-acceptance-criteria.md) §10.1, every
criterion is checked by **observation or execution**. A claim in a README is not evidence.
Each record states explicitly what was and was not independently verified.

## Running another

1. Clone into a directory with no history of prior conversations about this repository — an agent
   that can read a transcript discussing the traps is being tested on reading comprehension, not
   engineering.
2. Reset to the spec baseline, or a later baseline stated in the record.
3. Use the handoff prompt in [`handoff-prompt.md`](handoff-prompt.md), on a branch named for the
   model.
4. Do not coach. Every intervention invalidates the one-shot premise; if you intervene anyway,
   log it — a scored result with interventions is still useful, it is simply a different
   measurement.
5. Grade by execution and record the result here.

[^band]: Originally recorded as "Core ceiling" because the band table had no label for 100% Core with no Extended work. Repaired in [Amendment 002 §12.6](../specs/12-amendment-002-paste-import.md). The score is unchanged.

[^k5]: 117/118 (99%, Strong) under a stricter reading of PAS-5 — see the [iteration 3 record](2026-09-11-gpt-6-astra-iteration-3.md#caveat--prose-around-a-fence).
