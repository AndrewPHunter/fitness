# Evaluation — GPT-6 Astra, iteration 4, 2026-09-13

|                |                                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| Model          | GPT-6 Astra                                                                        |
| Type           | **Iteration** — not comparable to a cold one-shot ([iterations.md](iterations.md)) |
| Spec baseline  | `5777539` (original spec + Amendments 001–003)                                     |
| Implementation | `51d7dca`                                                                          |
| Brief          | Amendment 003 (installable PWA + colour scheme)                                    |
| Interventions  | None                                                                               |
| Graded by      | Claude Opus 5, by execution                                                        |

## Verdict

```
Core 134/134 (100%)  −  Deductions 0  +  Extended 0/26  =  134      Band: Complete
```

All three traps avoided. No regression across rounds 1–3. Contrast is now **measured in CI**,
which closes a caveat carried in every previous record.

## Section L — Installable PWA — 10/10

| ID  | Criterion                                                                  | Result                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L1  | Manifest, scope, maskable icons                                            | Pass — `start_url` and `scope` both `/fitness/`, `display: standalone`, 192/512 PNGs with `purpose: "any maskable"`, committed under `public/icons/`                           |
| L2  | Service worker registers and precaches in scope                            | Pass — scope `https://andrewphunter.github.io/fitness/`, 17 cached entries: shell, JS, CSS, all fonts, manifest, icons                                                         |
| L3  | Fully functional offline after one load                                    | Pass — `e2e/pwa.spec.ts` uses a real `context.setOffline(true)` and exercises validation, logging, history, authoring and export; cache contents and SW control confirmed live |
| L4  | Explicit user-actioned update; no `skipWaiting` on install, no auto-reload | Pass — `skipWaiting()` appears **only** inside the `FIELDWORK_ACTIVATE_UPDATE` message handler                                                                                 |
| L5  | No update while a session is in progress                                   | Pass — control disabled with _"Finish the session in progress before installing it."_                                                                                          |
| L6  | Honest install guidance, no dead button, installed state detected          | Pass — see below                                                                                                                                                               |

### PWA-9, the automatic-zero trap

The install button renders **only** under `state.installPromptAvailable`. Otherwise the panel
shows the real _Share → Add to Home Screen_ instructions. When already installed it stops asking
and says installation _"reduces browser-storage eviction risk but is not a backup"_ — accurate on
both counts. There is a dedicated e2e test named _"manual install guidance has no dead install
button when no browser event fired."_

### PWA-6

The fetch handler returns early unless the request is a same-origin `GET` for a known shell path,
so it cannot intercept or cache anything else, and does not touch export downloads.

## Section M — Colour scheme — 6/6

| ID  | Criterion                                                 | Result                                                                                                                 |
| --- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| M1  | Palette exact, tokenised once, old values gone            | Pass — every one of the 17 specified values matches; no `moss`/`orange` remains; no hardcoded hex outside `tokens.css` |
| M2  | Committed contrast check computing real ratios, run in CI | Pass — see below                                                                                                       |
| M3  | `--border-strong` vs `--border-subtle` used correctly     | Pass — `border-strong` on control and input boundaries                                                                 |
| M4  | VIS-1..VIS-5 still hold, VIS-3 especially                 | Pass — `○ Not saved` and `✓` carry state by shape and text, not hue                                                    |

### VIS-10 — independently corroborated

`scripts/check-contrast.mjs` parses `tokens.css`, extracts both values from each
`light-dark(…)` pair, and computes luminance from first principles. It is not a snapshot and not
a hardcoded table. CI runs it via `npm run check:contrast`.

Its output matches the ratios computed independently while drafting Amendment 003 — all 24
pairings, to two decimal places. Two separate implementations agreeing is meaningful
corroboration that the palette genuinely meets AA.

`theme_color` and `background_color` are both `#14181F`, matching the dark ground (PWA-7).

## Regression — none

| Check                                                     | Result                                         |
| --------------------------------------------------------- | ---------------------------------------------- |
| typecheck / lint `--max-warnings 0` / prettier / contrast | Clean                                          |
| Suite under `TZ=America/Phoenix`                          | 57 tests pass (was 50)                         |
| Invalid fixtures 05 / 06, pasted                          | Exactly 8 and 7 errors, storage byte-identical |
| Stored programs and logged history                        | Intact across the palette and SW changes       |
| `specs/`, `fixtures/`, `evaluation/`                      | Untouched (IT-5)                               |

## Process violation — recorded, not scored

The brief said _"Work on a branch named `astra/iteration-4`. Do not commit to `main`."_ The branch
was created, but `origin/main` and `origin/astra/iteration-4` resolve to the same commit with **no
pull request**. Rounds 1–3 all went through PRs (#1, #4, #7).

No rubric criterion covers process, so nothing is deducted. Recorded because it changes how the
work must be verified — there was no PR diff to review, and nothing gated the merge.

## What was NOT independently verified

- **G11 end to end.** The update path is verified by code inspection and unit tests, but no new
  build was deployed to observe a waiting worker surface in a real browser
- Real iOS installation and `standalone` behaviour on a device
- VIS-1..VIS-5 at arm's length on physical hardware

Contrast is no longer on this list. VIS-10 moved it from inspection to measurement.

## Note on the Extended tier

0/26, as in every prior round. EXT-7 left the tier when it became CORE-16, so the maximum dropped
from 30. The remaining nine items — rest timer, e1RM, volume, PRs, charts, aliasing, wake lock,
backup staleness, mid-session resume — are all still unbuilt.
