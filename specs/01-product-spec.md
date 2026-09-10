# 01 — Product Specification

## 1.1 The user

A single individual tracking their own resistance-training program. One person, one phone, one
browser. No accounts, no sharing, no sync, no multi-user concerns anywhere in the design.

**The usage context is the most important design constraint in this document.** The app is used
*while training*: standing in a gym, holding a phone in one hand, between sets, with limited
attention and possibly sweaty hands. Every interaction on the logging path is judged against
that context.

## 1.2 The problem

The user's training program is authored externally by an LLM as a JSON file. The app must:

1. Accept that file, validating it strictly
2. Tell the user which session to do next, and what it prescribes
3. Record what the user **actually did** — weight, reps, RPE
4. Make prior performance visible at the moment it is needed
5. Export the accumulated history

## 1.3 The central distinction: prescribed vs. actual

This distinction runs through the entire application and must be visible in the UI.

| | Source | Mutable |
|---|---|---|
| **Prescribed** | The uploaded program file | No — fixed by the program version |
| **Actual** | Logged by the user during a session | Yes — editable after the fact |

The program prescribes: exercises, order, superset grouping, number of sets, number of reps,
and *optionally* a target weight and a target RPE.

The user logs: **actual weight, actual reps, actual RPE**.

Progression is not modelled, computed, or suggested by the application. The user decides what
to lift by looking at what they lifted last time. The app's job is to make that history
frictionless to record and to read.

## 1.4 Scope tiers

### Core — graded, must pass

| ID | Capability |
|---|---|
| CORE-1 | Upload and strictly validate a program JSON file |
| CORE-2 | Store multiple programs; exactly one is active at a time |
| CORE-3 | Determine and display the next session, for both schedule modes |
| CORE-4 | Run a session: log weight, reps and RPE per set |
| CORE-5 | Prefill each weight input from the user's most recent logged set of that exercise |
| CORE-6 | Display per-exercise history — what was lifted, when |
| CORE-7 | Display rolling 7-day and 14-day per-exercise frequency |
| CORE-8 | Export full history as JSON (lossless) and CSV (flattened) |
| CORE-9 | Import a previously exported JSON file, restoring history exactly |
| CORE-10 | Version all persisted data and migrate it forward explicitly |
| CORE-11 | Surface storage failures, including quota exhaustion, visibly |
| CORE-12 | Edit or delete a logged set after the fact |
| CORE-13 | Deploy as a static site to GitHub Pages via GitHub Actions |

### Extended — bonus, differentiating

| ID | Capability |
|---|---|
| EXT-1 | Rest timer between sets, surviving page reload and backgrounding |
| EXT-2 | Estimated 1RM per exercise, with the formula named in the UI |
| EXT-3 | Volume (weight × reps) totals per session and per exercise over time |
| EXT-4 | Personal-record detection and display |
| EXT-5 | Per-exercise progress charts |
| EXT-6 | Exercise aliasing — mapping two `exerciseId`s onto one history stream |
| EXT-7 | Installable PWA with an offline app shell |
| EXT-8 | Screen wake lock during an active session |
| EXT-9 | Backup staleness indicator ("last exported N days ago") |
| EXT-10 | Partial-session resume after the browser is closed mid-workout |

## 1.5 Non-goals

Explicitly out of scope. An implementation that adds these has **not** earned credit for them,
and may lose points under [C8](00-constitution.md) if they introduce interpretation.

- Any backend, API, account, authentication, or network request at runtime
- Sync across devices
- Progression logic, autoregulation, or weight suggestions beyond last-session prefill
- Rep ranges (`8–12`), AMRAP sets, or any set whose prescribed reps are not a fixed number
- Duration-based or distance-based work — no cardio, no timed holds, no carries
- Drop sets, rest-pause, cluster sets, tempo prescription
- Per-set weight variation within a single exercise entry (ramping sets)
- Nutrition, bodyweight tracking, photos, measurements
- Social features of any kind
- An in-app LLM integration. Program authoring happens **outside** the app; see
  [`fixtures/authoring-prompt.md`](../fixtures/authoring-prompt.md).

## 1.6 Where "varying complexity" lives

The requirement that programs vary in complexity is satisfied **structurally**, not logically.
Complexity varies along these axes, all of which appear across the fixtures:

- Number of sessions in a program (1 to 7+)
- Length of the rotation sequence, and repetition of sessions within it
- Schedule mode — rotation vs. fixed weekdays
- Presence and depth of superset grouping
- Number of distinct exercises
- Presence or absence of optional target weight and target RPE
- Presence or absence of declared frequency targets

It does **not** vary by requiring the app to evaluate anything.
