# 15 — Amendment 005: Perceivable Feedback and Task Flow

| | |
|---|---|
| **Status** | Active |
| **Raised** | 2026-09-14, from the [UX audit](../evaluation/2026-09-14-ux-audit.md) |
| **Amends** | [01 §1.4](01-product-spec.md), [06 §6.2–6.3](06-ui-ux.md), [10](10-acceptance-criteria.md) |
| **Baseline preserved at** | `54096de` — the specification as it stood when the audit was merged |

## 15.1 The defect

This corrects a defect in the specification, of the same family as Amendments 001 and 002.

[06 §6.2](06-ui-ux.md) **UX-8** requires that *"all state changes [are] announced to assistive tech
via appropriate roles or live regions."* Nothing required a **visible** equivalent. The
implementation satisfied UX-8 literally, with one screen-reader-only region, and a sighted user
received no confirmation for any state-changing action.

The rubric could not catch this, because nothing in it asked whether feedback was *perceivable*.
The audit records 17 findings. This amendment addresses every P0, P1 and P2 finding except F-11's
backup-staleness dimension, which remains EXT-9.

**Owner addition, folded in before handoff.** §15.5 also specifies clearing pasted input (CLR),
requested after the owner found that recovering from a parse error meant manually selecting an
entire JSON document on a phone. It was added to this amendment rather than a new one because
iteration 6 had not yet been handed off.

**UX-8 is not withdrawn.** Screen-reader announcements remain required. They are necessary and no
longer sufficient.

| ID | Capability |
|---|---|
| **CORE-19** | Every state-changing action has visible, in-viewport feedback; every result appears where the user is looking; every state change offers its next step |

## 15.2 Definitions

**Usable viewport.** The region from the top of the viewport to the top edge of the fixed bottom
navigation. On the primary target (390 × 844) that edge is at 779 px.

**Perceivable.** An element is perceivable when all of the following hold:

1. It lies entirely within the usable viewport — below the top edge, above the navigation
2. Its rendered box is at least **40 × 16 CSS px**
3. It is not inside a visually-hidden container, and is not collapsed by `clip`, `clip-path` or
   zero opacity
4. No scrolling occurred between the action and the check

## 15.3 Feedback — FB

These actions change stored state and each requires feedback:

> Import program · Activate program · Start session · Log set · Correct a logged set · Delete a
> logged set · Complete session · Leave session · Discard session · Save settings · Export JSON ·
> Export CSV · Restore or merge

| ID | Requirement |
|---|---|
| FB-1 | Each action above produces a **visible confirmation that is perceivable** (§15.2) within 300 ms of the action completing |
| FB-2 | The confirmation is adjacent to the control that triggered it, replaces or transforms that control, or is pinned inside the usable viewport. Rendering it in page flow outside the viewport does not satisfy FB-1 |
| FB-3 | **The screen-reader announcement is retained.** Visible and announced feedback coexist; neither replaces the other. Removing the live region is a UX-8 regression |
| FB-4 | Copy states the **outcome**, names what it acted on, and includes values where they exist. `Active program saved.` fails; `Every Other Day Strength is active` passes. Storage vocabulary may not be the whole message |
| FB-5 | A confirmation does not auto-dismiss sooner than **4 seconds**. It may persist until the next action |
| FB-6 | **Visible notices are cleared on route change.** A notice never follows the user onto an unrelated screen |
| FB-7 | Failure feedback obeys FB-1 to FB-6, and is distinguishable from success **without colour** (VIS-3) |

### FB-8 — Export copy must not claim what the app cannot know. This is a trap.

Export triggers a download through a Blob URL. The app **cannot observe** whether the file was
saved — the user may cancel the sheet, or iOS may discard it.

`Backup saved` and `Backup downloaded` are therefore claims the app cannot verify, and are a
[C1](00-constitution.md) violation. The confirmation must state what the app actually did:
*"Prepared fitness-export-2026-09-14.json — check that it saved."*

## 15.4 Logging — LOG

| ID | Requirement |
|---|---|
| LOG-1 | After **Log set**, a perceivable confirmation names the set and its recorded values: `✓ Set 1 logged · 100 kg × 5 · RPE 8` |
| LOG-2 | The set indicator shows **`Set N of M` for scalar entries** as well as per-set entries, and advances after each logged set |

### LOG-3 — Log set must be reachable while the keyboard is open. This is a trap.

On iOS Safari the software keyboard shrinks the **visual** viewport, not the **layout** viewport.
An element fixed to the bottom of the layout viewport can therefore sit behind the keyboard.

- `position: fixed; bottom: …` alone **does not satisfy** LOG-3, even though it passes the CI proxy
  below.
- Acceptable: place **Log set** above the input fields within the logging card, or position it
  from `window.visualViewport`.
- **CI proxy:** at a **390 × 500** viewport with the weight input focused, Log set is perceivable.
- **Final verification** is on a device, by the owner. The proxy is necessary, not conclusive.

## 15.5 Validate and import — VAL

| ID | Requirement |
|---|---|
| VAL-1 | After **Validate**, the result — preview or error summary — is scrolled into the usable viewport and its heading receives focus (`tabindex="-1"`) |
| VAL-2 | **Import program** is perceivable at the same moment as the preview heading |
| VAL-3 | The error summary states the error count in a perceivable heading, with the list following |
| VAL-4 | After **Import**, focus does **not** move to the paste field. It moves to the confirmation or to the next step |

### Clearing pasted input — CLR

After a parse error the only way to start again is to select the entire document by hand, which on
a phone is slow and unreliable. The paste field needs a one-tap clear.

| ID | Requirement |
|---|---|
| CLR-1 | A **Clear** control for the paste field is perceivable (§15.2) whenever the field is non-empty — including at the moment an error summary is shown after Validate (VAL-1). It is absent or disabled when the field is empty |
| CLR-2 | One tap empties the field **and** all review state: errors, preview, and any code-fence notice (PAS-5) |
| CLR-3 | There is **no confirmation dialog**. Instead a perceivable confirmation offers **Undo**, which restores the exact text as it was immediately before clearing. Undo remains available until the field is changed again or the user navigates away. No timer |
| CLR-4 | Undo restores the **text only**. Validation state is not restored; the user validates again |
| CLR-5 | After Clear, focus does **not** move into the paste field — on iOS that raises the keyboard over the screen (consistent with VAL-4). Focus moves to the confirmation |
| CLR-6 | FB-1 to FB-6 apply: visible confirmation, screen-reader announcement retained, outcome copy (`Pasted JSON cleared`) |

### CLR-7 — The app never clears the field on its own. This is a trap.

[Amendment 002](12-amendment-002-paste-import.md) **PAS-7** still holds: *the pasted text is never
cleared on validation failure*. Clearing happens **only** when the user presses Clear.

A Clear control makes it tempting to empty the field automatically after an error "to save a tap".
That would destroy the text the user needs in order to read the errors and correct it in place,
and is a PAS-7 regression.

## 15.6 Next step and session control — NEXT, SES

| ID | Requirement |
|---|---|
| NEXT-1 | After **Activate**, a control starting that program's next session is perceivable, and names it: `Start A — Squat / Bench` |
| NEXT-2 | The detail page of the active program offers the same control |
| NEXT-3 | First run: Today's empty state leads with **getting the authoring prompt** (`#/author`) as the primary action; importing a program is secondary |
| NEXT-4 | After **Import**, where the imported program is not active, the confirmation offers **Activate** |
| SES-12 | A session with **zero** logged sets can be **discarded**. Discarding removes that empty session and does not advance the rotation. For a zero-set session, Discard replaces Leave |

### SES-13 — Never offer Discard once a set is logged. This is a trap.

Once one or more sets are logged, **Discard must not be offered** — only Leave, which keeps every
set ([C3](00-constitution.md)). A discard that removes logged sets destroys training history,
which the constitution treats as the most serious class of defect.

## 15.7 Accessibility — A11Y

| ID | Requirement |
|---|---|
| A11Y-1 | Dialogs move focus inside on open, keep it there while open, and return it to the invoking control on close |
| A11Y-2 | Accessible names separate values with punctuation or labels. `Last: 60 kg × 8, 14 Sep 2026` passes; `× 89/14/2026` fails |

## 15.8 Verification — VER

The defects in the audit passed five graded rounds because verification checked presence in the
DOM, not perceivability. These requirements exist so that cannot recur.

### What was measured before writing this

Tested against **Playwright 1.63.0**, the version this repository pins:

| Case | `toBeVisible()` | `toBeInViewport()` |
|---|---|---|
| Screen-reader-only 1 × 1 px clipped confirmation | **passes** — false positive | fails |
| Visible text positioned behind the fixed bottom nav | — | **passes** — false positive |

A suite built on `toBeVisible()` would pass the exact defect this amendment fixes. A suite built on
`toBeInViewport()` would pass confirmations hidden behind the navigation. **Neither matcher alone,
nor both together, checks perceivability.**

| ID | Requirement |
|---|---|
| VER-1 | A committed helper, e.g. `expectPerceivable(locator)`, asserts every condition of §15.2 — including an explicit comparison against the top edge of the bottom navigation |
| VER-2 | Every FB, LOG, VAL, CLR, NEXT and SES requirement is covered by an e2e test at 390 × 844 using that helper, with **no scripted scroll** between action and assertion |
| VER-3 | Those tests navigate through visible controls after the initial load, not by `page.goto` to deep routes |

### VER-4 — The helper must prove it rejects the failures. This is a trap.

A helper that has never been shown to fail is a facade ([C6](00-constitution.md)). The helper has
its own tests demonstrating that it **rejects**:

1. a screen-reader-only confirmation inside the viewport
2. visible text behind the fixed bottom navigation
3. visible text below the fold

If any of the three would pass, Section U scores zero.

## 15.9 Scope

- **No visual redesign.** The palette in [Amendment 003](13-amendment-003-pwa-and-palette.md) is
  unchanged, and `npm run check:contrast` must still pass. New feedback uses existing tokens.
- **Not in scope:** backup staleness (EXT-9), bottom-nav numbering (audit F-16), and a
  post-session summary screen beyond what FB-4 copy provides.

## 15.10 Acceptance criteria

### P. Perceivable feedback — 8 pts

| ID | Criterion | Pts |
|---|---|---|
| P1 | All 13 actions produce perceivable confirmation (§15.2) | 3 |
| P2 | Outcome copy per FB-4, and export copy honest per FB-8 | 1 |
| P3 | Minimum 4 s persistence; cleared on route change | 1 |
| P4 | Screen-reader announcements retained (FB-3) | 1 |
| P5 | Failure feedback perceivable and distinguishable without colour | 2 |

### Q. Logging — 6 pts

| ID | Criterion | Pts |
|---|---|---|
| Q1 | Log set confirmation names set and values, perceivable | 2 |
| Q2 | `Set N of M` for scalar entries, advancing | 2 |
| Q3 | LOG-3 — not satisfied by fixed-bottom alone; CI proxy passes | 2 |

### R. Validate and import — 6 pts

| ID | Criterion | Pts |
|---|---|---|
| R1 | Result scrolled into view and heading focused | 2 |
| R2 | Import perceivable together with the preview heading | 2 |
| R3 | Error count heading perceivable | 1 |
| R4 | Focus not moved to the paste field after Import | 1 |

### S. Next step and session control — 6 pts

| ID | Criterion | Pts |
|---|---|---|
| S1 | Named Start control perceivable after Activate | 2 |
| S2 | Start offered on the active program's detail page | 1 |
| S3 | First run leads with the authoring prompt | 1 |
| S4 | Discard at zero sets only (SES-12, SES-13) | 2 |

### T. Accessibility — 2 pts

| ID | Criterion | Pts |
|---|---|---|
| T1 | Dialog focus management | 1 |
| T2 | Separated accessible names | 1 |

### U. Verification — 7 pts

| ID | Criterion | Pts |
|---|---|---|
| U1 | Helper checks every §15.2 condition, including navigation occlusion | 2 |
| U2 | Helper's own tests prove it rejects all three failures (VER-4) | 3 |
| U3 | Every FB/LOG/VAL/CLR/NEXT/SES requirement covered at 390 × 844, visible navigation, no scripted scroll | 2 |

### V. Clearing pasted input — 5 pts

| ID | Criterion | Pts |
|---|---|---|
| V1 | Clear perceivable whenever the field is non-empty, including in the error state | 1 |
| V2 | One tap clears the text and all review state | 1 |
| V3 | Undo restores the exact prior text; no confirmation dialog | 1 |
| V4 | The field is never cleared automatically (CLR-7, PAS-7) | 1 |
| V5 | Focus not moved into the field after Clear; covered by e2e using the helper | 1 |

### Deductions specific to this amendment

| Violation | Effect |
|---|---|
| Discard offered for a session with logged sets (SES-13) | Section S scores 0, **and −15** (C3) |
| Screen-reader live region removed (FB-3) | P4 scores 0, recorded as a UX-8 regression |
| Export copy claims the file was saved (FB-8) | P2 scores 0, **and −10** (C1) |
| Field cleared automatically after a validation failure (CLR-7) | Section V scores 0, recorded as a PAS-7 regression |
| Palette tokens changed, or contrast check fails | VIS-6 regression per [iterations.md](../evaluation/iterations.md) IT-1 |

### Gate G13 — the core loop is perceivable

| ID | Gate | How verified |
|---|---|---|
| G13 | From empty storage at 390 × 844, using visible controls only: author → paste → validate → import → activate → start → log a set → complete. After **every** step the outcome is perceivable without scrolling | Walked and measured by the grader using the method of the [2026-09-14 audit](../evaluation/2026-09-14-ux-audit.md) |

### Revised totals

Core becomes **190 points**. Extended remains 26. Bands stay percentages of the applicable total.

## 15.11 Effect on recorded evaluations

None. Rounds 1–5 are not rescored. Their UX passes are recorded in
[`evaluation/README.md`](../evaluation/README.md) as meaning *present in the DOM*, not
*perceivable*.
