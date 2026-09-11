# 06 — UI & UX

> **Amended.** [Amendment 002](12-amendment-002-paste-import.md) makes pasted JSON the primary
> import affordance on `#/programs` (§12.3).
>
> [Amendment 001](11-amendment-001-program-authoring.md) adds the
> `#/author` screen (§11.3) and visual-direction constraints (§11.4).

## 6.1 The governing constraint

The logging path is used **mid-workout**: standing, one hand, phone held close, between sets,
attention divided, hands possibly chalky or sweaty. Every requirement in this document derives
from that.

The design target is: **log a completed set in one or two taps, without precise aiming, without
reading carefully, and without scrolling.**

## 6.2 Global requirements

| ID | Requirement | Tier |
|---|---|---|
| UX-1 | Mobile-first portrait. Primary target 390×844 CSS px. Must remain usable from 320 px wide. | Core |
| UX-2 | Interactive targets on the logging path are at least 44×44 CSS px | Core |
| UX-3 | No horizontal page scroll at any supported width | Core |
| UX-4 | Light and dark themes, following `prefers-color-scheme`, overridable in settings | Core |
| UX-5 | WCAG 2.1 AA contrast for text and interactive controls | Core |
| UX-6 | Every control reachable and operable by keyboard; visible focus indicators | Core |
| UX-7 | Numeric inputs use `inputmode="decimal"` so phones present a numeric keypad | Core |
| UX-8 | All state changes announced to assistive tech via appropriate roles or live regions | Core |
| UX-9 | Every screen has a defined empty state with a clear next action | Core |
| UX-10 | Every async or failable action has a defined error state, distinct from its success state | Core |

## 6.3 Screens

### `#/` — Today

The default screen and the one opened at the gym.

Must show:
- The active program's name and version
- The next session, resolved per [02 §2.6](02-domain-model.md) for the program's schedule mode
- The session's prescribed content in summary
- A primary **Start session** action
- If an in-progress session exists, a **Resume** action instead, stating when it was started

Empty states: no program uploaded → prompt to upload. No active program → prompt to activate.

For `weekdays` programs on a rest day: show the next upcoming training day and its session.
Do not display missed-day counts, streaks, or adherence warnings ([C9](00-constitution.md) — the
app does not judge).

### `#/programs` — Programs

- List of stored programs, grouped by `programId`, showing every stored `version`
- Which one is active
- **Paste field for program JSON — the primary import affordance** ([Amendment 002](12-amendment-002-paste-import.md), PAS-1)
- Upload control accepting a `.json` file, retained as secondary (PAS-2)
- A link to `#/author` for users who have nothing to upload yet ([Amendment 001](11-amendment-001-program-authoring.md), AUT-1)
- Activating a program is a plain action; deactivating never touches logged history

**Upload result display — CORE-1.** On failure, render **every** `ValidationError`
([03 §3.2](03-program-schema.md)) as a discrete list item showing `code`, `path` and `message`.
A single generic "invalid file" message is a Core failure.

On success, before committing, show a summary: program name, version, session count, exercise
count, and **which `exerciseId`s are new versus already known** to the local exercise index
([02 §2.2](02-domain-model.md)). This is informational, must reflect real index state, and must
not block the import.

### `#/session/active` — Active session

The most important screen in the application.

Requirements:

| ID | Requirement |
|---|---|
| SES-1 | Blocks are presented in `Session.blocks` order |
| SES-2 | For each set: prescribed reps and any `targetWeight` / `targetRpe` are visible, clearly labelled as prescribed |
| SES-3 | Weight input is prefilled per [02 §2.10](02-domain-model.md) |
| SES-4 | A prefilled-but-unconfirmed value is visually distinct from a confirmed logged set |
| SES-5 | Confirming a set writes it immediately ([05 §5.6](05-persistence.md)) and reflects the real write result |
| SES-6 | RPE input is optional; skipping it stores `null`, never a fabricated default |
| SES-7 | The set currently being logged is visible without scrolling |
| SES-8 | A logged set can be corrected without leaving the screen |
| SES-9 | Completing the session sets `completedAt` and returns to Today |
| SES-10 | Abandoning a session is possible, requires confirmation naming what is kept, and retains already-logged sets |

**SES-11 — Superset ordering.** A `superset` block is logged **round-robin**: set 1 of every
entry in the group, then set 2 of every entry, and so on. This is the only behavioural
consequence of superset grouping, and it must be visible in the UI — the grouping is not merely
a visual label. A superset rendered as sequential independent exercises fails this requirement.

### `#/author` — Authoring

Specified in full by [Amendment 001 §11.3](11-amendment-001-program-authoring.md). Hands the user
the prompt pack, the JSON Schema and a worked example so a program can be authored with an LLM
without leaving the app or visiting the repository. The copied prompt carries the user's own
existing `exerciseId`s (AUT-8).

### `#/history` — History index

- Every `exerciseId` the user has ever logged, across all programs
- For each: last-performed date, last weight × reps
- Observed 7-day and 14-day frequency (CORE-7), shown beside the declared `frequencyTarget`
  where the active program declares one
- Where observed diverges from target, both numbers are shown plainly with **no warning,
  colour-coding as good/bad, or corrective language** ([C9](00-constitution.md))

### `#/history/:exerciseId` — Exercise history

Reverse-chronological list of every logged set for one exercise, across all programs and
versions, showing date, weight, reps, RPE, and which program and version it was logged under.

Editing and deleting logged sets (CORE-12) lives here. Deletion requires confirmation naming
exactly what will be removed ([C3](00-constitution.md)).

### `#/data` — Data

- Export JSON, export CSV ([07](07-export-import.md))
- Import a previously exported JSON file
- Storage diagnostics: approximate bytes used, percentage of an assumed 5 MB budget, labelled
  approximate (HAZ-B4)
- The plain-language storage warning and home-screen guidance (HAZ-A1, HAZ-A2)

### `#/settings` — Settings

- Default unit for new input — affects future input only, never stored data
  ([02 §2.9](02-domain-model.md))
- Theme

## 6.4 Prescribed vs. actual must be legible

[01 §1.3](01-product-spec.md) requires this distinction to be visible. Wherever both appear —
principally the active-session screen — they must be visually separable at a glance, without
reading labels carefully.

The specific visual treatment is the implementer's choice. The requirement is that a user
glancing at their phone between sets can tell instantly which numbers the program asked for and
which numbers they themselves recorded.

## 6.5 Explicit UI non-requirements

Not required, not graded, and not credited:

- Animation or transitions beyond what conveys state
- Onboarding tours, tooltips, or coach marks
- Illustrations, mascots, or custom iconography
- Motivational copy, streak mechanics, gamification, or badges
- Any UI that evaluates, grades, or judges the user's performance
