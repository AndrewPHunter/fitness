# Evaluation — GPT-6 Astra, iteration 3, 2026-09-11

|                |                                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| Model          | GPT-6 Astra                                                                        |
| Type           | **Iteration** — not comparable to a cold one-shot ([iterations.md](iterations.md)) |
| Spec baseline  | `f184055` (original spec + Amendments 001 and 002)                                 |
| Implementation | PR #7, `astra/iteration-3`, merged as `6ae13a6`                                    |
| Brief          | Amendment 002 only                                                                 |
| Interventions  | None                                                                               |
| Graded by      | Claude Opus 5, by execution                                                        |

## Verdict

```
Core 118/118 (100%)  −  Deductions 0  +  Extended 0/30  =  118      Band: Complete
```

Gate **G9 passes**, verified end to end with download instrumentation. Both deliberate traps
(PAS-5 silent fence stripping, PAS-10 clipboard read) were avoided. No regression across either
previous round.

One caveat materially affects the band, and is set out in full below: a stricter reading of PAS-5
would score 117/118 (99%, **Strong**).

## Section K — 8/8

| ID  | Criterion                                                            | Result                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | Paste field primary in order and weight                              | Pass — paste at 629 px, labelled _Primary import path_; file input at 1330 px, labelled _Secondary_; paste precedes file in DOM order                                                         |
| K2  | File upload retained and functional                                  | Pass — live upload of fixture 01 reached _Ready to import_, and the file's text is mirrored into the paste field                                                                              |
| K3  | Identical output, paste vs file, both invalid fixtures               | Pass — pasted: exactly 8 and 7 errors with round 1's pointers, storage byte-identical. The file handler calls the **same `reviewProgramText()` function** as paste, so the two cannot diverge |
| K4  | Pasted text survives validation failure                              | Pass — field unchanged after both rejections                                                                                                                                                  |
| K5  | Fence reported specifically, removed only by explicit visible action | Pass, **with caveat** — see below                                                                                                                                                             |
| K6  | Handoff steps rewritten to copy → paste                              | Pass — _"Copy the LLM's JSON-only reply—do not save a file or include code fences"_; a unit test asserts the old "save as a file" wording is gone                                             |

### The two traps

**PAS-5 — fences.** A fully fenced reply was pasted. Observed:

| Checkpoint                                          | Result                                       |
| --------------------------------------------------- | -------------------------------------------- |
| Specific error, not a generic parse failure         | _"Markdown code fences are not valid JSON…"_ |
| Text silently stripped                              | **No** — field still holds the fenced text   |
| Preview shown before the user acted                 | No                                           |
| "Remove code fences" pressed → visible text changed | Yes, to exactly the inner JSON               |
| Auto-validated after removal                        | **No** — _"Review it, then validate again"_  |
| Storage written at any point before Import          | No                                           |

**PAS-10 — clipboard read.** `navigator.clipboard.readText` was spied on for the whole live run:
**0 calls**. The only `readText` matches in `src/` are `readTextFile`, which reads uploaded files.

## Gate G9 — no file written to the device

Method: authored a new program (_Full Body A/B_, **weekday** schedule, the first live import of
that mode), wrapped it in a ` ```json ` fence as an LLM would, and pasted it. Caught the fence,
removed it explicitly, validated, imported. `URL.createObjectURL` was instrumented throughout.

| Check                                           | Result                                  |
| ----------------------------------------------- | --------------------------------------- |
| Import preview                                  | 6 exercise IDs already known, **0 new** |
| Imported                                        | Yes                                     |
| Stored program deep-equals the authored program | Yes                                     |
| Blob URLs or downloads created during the flow  | **0**                                   |

## Regression — none across rounds 1 and 2

| Check                                          | Result                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| typecheck / lint `--max-warnings 0` / prettier | Clean                                                                                     |
| Suite under `TZ=America/Phoenix`               | 50 tests pass (was 44)                                                                    |
| Invalid fixtures 05 / 06                       | Exactly 8 and 7 errors, nothing written                                                   |
| AUT-8 injection (iteration 2)                  | Live: intercepted `writeText` received 9,216 chars including the injected heading and IDs |
| Round-1 e2e (`core-flow.spec.ts`)              | Untouched, green in CI                                                                    |
| Validation, export, storage, provider          | Untouched — fence handling isolated in a new `prepareProgramText.ts`                      |
| G6 zero network requests                       | No network code in `src/`; live log shows only same-origin assets                         |

## Caveat — prose around a fence

Tested live with the two shapes chat replies commonly take when a whole message is copied by
long-press:

- `Here's your program:` + fenced block → generic `PARSE_ERROR` (_"Unexpected token 'H'…"_)
- fenced block + `Let me know if you want changes!` → generic `PARSE_ERROR` (_"Unexpected token '`'…"_)

Neither offers **Remove code fences**. Both fail honestly — text preserved, nothing stored — but
without the specific, actionable message PAS-5 exists to provide.

This is deliberate and tested in the implementation: its own test is named _"does not
reinterpret partial or embedded fences"_. It is also a conservative reading that respects C2 —
extracting a block from surrounding prose means the app deciding which of the user's text to
discard.

**Scored to the letter, no deduction.** PAS-5 as written describes an LLM that _wraps_ JSON in a
fence; it says nothing about commentary around one. The gap is in the amendment, which described
the idealised case rather than how replies actually arrive on a phone — the fourth instance of
that pattern. A stricter reading of _"a fenced block is detected"_ would take 1 point from K5,
giving **117/118 (99%, Strong)**. Recorded so the reader can apply it.

Existing mitigations: the prompt instructs _no fences, no commentary_; the handoff step says copy
the _JSON-only_ reply; and chat apps' per-block **Copy code** button yields clean JSON.

## Observation — an e2e assertion moved, no deduction

`e2e/authoring.spec.ts` (iteration 2's test) previously read the **real clipboard** after
clicking Copy. It now reads the fallback textarea. Most likely PAS-10 was applied to test code;
PAS-10 constrains the app, not its tests.

Behaviour coverage is preserved — `AuthorPage.test.tsx` still asserts the exact `writeText`
payload, and the live check above confirms it — but the real browser clipboard write is no longer
exercised end to end in CI. Worth restoring in a later round.

## What was NOT independently verified

- A **real paste gesture on iOS**. Input was set programmatically with an `input` event; paste
  into a `<textarea>` is standard, but it was not reproduced on a device
- VIS-1..VIS-5 on physical hardware at arm's length
- WCAG AA contrast (inspection only) and keyboard operability
- Round-1 reload persistence was not re-run live this round; the untouched `core-flow` e2e covers
  it in CI
