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

| Date       | Model       | Spec baseline | Gates | Core   | Ext  | Final  | Band   |
| ---------- | ----------- | ------------- | ----- | ------ | ---- | ------ | ------ |
| 2026-09-10 | GPT-6 Astra | `a7bd40c`     | 7/7   | 99/100 | 0/30 | **99** | Strong |

## Method

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
