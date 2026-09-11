# Iteration log

Two different things get measured in this repository, and conflating them would make both
meaningless.

| Type              | What it measures                                                                           | Model sees                                                           |
| ----------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Cold one-shot** | Can the model implement a demanding spec in a single pass, with no feedback?               | `specs/` and `fixtures/` only                                        |
| **Iteration**     | Can the model absorb precise feedback and extend its own prior work without regressing it? | The above, plus its previous implementation and the evaluation of it |

An iteration score is **not comparable to a cold one-shot score.** An iteration has access to
the grading rubric's findings against its own work. That is the point of an iteration, and it is
also why the two are tracked in separate columns and never averaged.

## Log

| #   | Date       | Model       | Type          | Spec baseline | Brief              | Gates   | Core    | Ext  | Final | Band             |
| --- | ---------- | ----------- | ------------- | ------------- | ------------------ | ------- | ------- | ---- | ----- | ---------------- |
| 1   | 2026-09-10 | GPT-6 Astra | Cold one-shot | `a7bd40c`     | Full specification | 7/7     | 99/100  | 0/30 | 99    | Strong           |
| 2   | 2026-09-10 | GPT-6 Astra | Iteration     | `1d58f54`     | Amendment 001      | G8 pass | 110/110 | 0/30 | 110   | Complete [^band] |
| 3   | 2026-09-11 | GPT-6 Astra | Iteration     | `f184055`     | Amendment 002      | G9 pass | 118/118 | 0/30 | 118   | Complete [^k5]   |

Records: [round 1](2026-09-10-gpt-6-astra.md) · [iteration 2](2026-09-10-gpt-6-astra-iteration-2.md) · [iteration 3](2026-09-11-gpt-6-astra-iteration-3.md)

## Rules for an iteration

These exist so an iteration cannot buy points by trading away work that already passed.

| ID   | Rule                                                                                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IT-1 | **No regression.** Every criterion that passed in the previous round must still pass. A regression is scored as a loss of those points _and_ recorded explicitly in the log. |
| IT-2 | The previous round's gates must all still pass, including the deployed site rendering.                                                                                       |
| IT-3 | Scope is limited to the brief. Unrequested rewrites of passing code are not credited and increase regression risk.                                                           |
| IT-4 | The brief's own criteria are scored normally. Prior findings addressed count; prior findings ignored stay lost.                                                              |
| IT-5 | `specs/`, `fixtures/` and `evaluation/` remain unmodified by the model. Amendments and records are written by the owner, not the implementer.                                |

## Regression check

Before scoring an iteration, re-run the previous round's gates and spot-check the criteria most
likely to break under change:

- The two invalid fixtures still produce exactly 8 and 7 errors, and still write nothing
- A logged set still survives a reload
- Export still round-trips by deep equality
- `commit()` still saves before it updates in-memory state
- Lint still enforces the layer boundaries
- CI still runs the suite under a non-UTC timezone

## Recording a round

Add a row above, and a full record at `evaluation/<date>-<model>-iteration-<n>.md` following the
shape of the round-1 record — including its **"what was not independently verified"** section.

[^band]: Originally recorded as "Core ceiling" because the band table had no label for 100% Core with no Extended work. Repaired in [Amendment 002 §12.6](../specs/12-amendment-002-paste-import.md). The score is unchanged.

[^k5]: 117/118 (99%, Strong) under a stricter reading of PAS-5 — see the [iteration 3 record](2026-09-11-gpt-6-astra-iteration-3.md#caveat--prose-around-a-fence).
