# Handoff prompts

Given verbatim to the model under test. Substitute the branch name.

## Cold one-shot

For a model that has not seen this repository before.

```
Build the application specified in this repository:
https://github.com/AndrewPHunter/fitness

Read the entire `specs/` directory before writing any code. Start with
`specs/00-constitution.md` — it takes precedence over every other document,
including this prompt.

TASK
Implement the fitness program tracker described in the specs: a static React
single-page application, deployed to GitHub Pages, storing all data in browser
localStorage. No backend, no network requests at runtime.

RULES
1. `specs/` and `fixtures/` are the control artifact for an evaluation. Do not
   modify, delete, reformat, or add to either directory.
2. This is a one-shot task. No clarification will be provided and no questions
   will be answered. The specification is written to be self-contained.
3. Where the specification is genuinely silent, make a reasonable decision and
   record it in `DECISIONS.md` at the repository root. Do not record decisions
   the specs already make.
4. Work on a branch named `<model>/one-shot`. Do not commit to `main`.
5. `specs/10-acceptance-criteria.md` is the rubric you will be graded against.
   It is public deliberately.
6. The deploy target is https://andrewphunter.github.io/fitness/ — a GitHub
   Pages *project* page, so the app is served from `/fitness/`, not from the
   domain root.

DELIVERABLE
A working, deployed application with CI green on the submitted commit.
```

## Iteration

For a model extending its own prior implementation against an amendment. Scored under the rules
in [`iterations.md`](iterations.md), which include a full regression check of the previous round.

Iteration 2 — GPT-6 Astra — baseline `d4f63b6`:

```
Continue work on the repository you previously implemented:
https://github.com/AndrewPHunter/fitness

This is ITERATION 2. It is not a fresh build. Your previous implementation is on
`main` and scored 99/100 against the original specification.

READ FIRST, IN THIS ORDER
1. `specs/11-amendment-001-program-authoring.md` — the brief for this round.
2. `evaluation/2026-09-10-gpt-6-astra.md` — how your previous round was graded,
   including the single deduction and the list of things that were not
   independently verified.
3. `evaluation/iterations.md` — the rules this round is scored under.
4. `specs/00-constitution.md` — unchanged, and still takes precedence over every
   other document including this prompt.

TASK
Implement Amendment 001, and nothing else:
- CORE-14 and the `#/author` screen — AUT-1 through AUT-9
- The visual constraints VIS-1 through VIS-5, declaring your visual direction in
  DECISIONS.md

AUT-8 is the substantive requirement, not a convenience. Read it carefully.

RULES
1. Do not modify `specs/`, `fixtures/`, or `evaluation/`. They are the control
   artifact and the evaluation record. Amendments are written by the owner.
2. No regression. Every criterion that passed in round 1 must still pass, and
   every gate must still pass, including the deployed site rendering and the two
   invalid fixtures producing exactly 8 and 7 errors while writing nothing.
3. Scope discipline. Do not rewrite code that already passes. Unrequested
   refactors earn no points and increase regression risk.
4. You may address the H4 finding from your evaluation — coverage reaching all
   required areas but thin where the specification named multiple distinct
   boundary cases.
5. Work on a branch named `astra/iteration-2`. Do not commit to `main`.
6. This is a one-shot iteration. No clarification will be provided.

SCORING
Section J (10 points) and gate G8 from Amendment 001, plus a full regression
check of round 1. Core is now 110 points; bands are percentages.

DELIVERABLE
A working, deployed application with CI green, in which a program can be authored
and uploaded without leaving the app or visiting this repository. That is gate
G8, and it is the entire point of this round.
```

### Iteration 3 — GPT-6 Astra — Amendment 002

````
Continue work on the repository you previously implemented:
https://github.com/AndrewPHunter/fitness

This is ITERATION 3. It is not a fresh build. Your previous two rounds are on
`main`. Round 1 scored 99/100; iteration 2 scored 110/110 with no regression.

READ FIRST, IN THIS ORDER
1. `specs/12-amendment-002-paste-import.md` — the brief for this round.
2. `evaluation/2026-09-10-gpt-6-astra-iteration-2.md` — how your last round was
   graded, including the open defect this amendment addresses.
3. `evaluation/iterations.md` — the rules this round is scored under.
4. `specs/00-constitution.md` — unchanged, and still takes precedence over every
   other document including this prompt.

TASK
Implement Amendment 002, and nothing else:
- CORE-15 and paste-to-import — PAS-1 through PAS-10
- Rewrite the authoring kit's handoff steps so copy -> paste is the primary
  route (PAS-8)

Two requirements are traps, and both are about honesty rather than effort:

- PAS-5. LLMs often wrap JSON in a ```json fence. Do NOT strip it silently.
  Detect it, report it specifically, and offer an explicit user-pressed action
  that edits the visible text. Silent stripping is an automatic zero for
  Section K plus a C2 deduction.
- PAS-10. Do NOT call navigator.clipboard.readText() or add a "paste from
  clipboard" button. The user's own paste gesture is the mechanism.

RULES
1. Do not modify `specs/`, `fixtures/`, or `evaluation/`. They are the control
   artifact and the evaluation record. Amendments are written by the owner.
2. No regression across BOTH previous rounds. Every criterion that passed in
   round 1 and iteration 2 must still pass, including the two invalid fixtures
   producing exactly 8 and 7 errors while writing nothing, and the authoring kit
   injecting the user's own exercise IDs.
3. PAS-3 is the core of this round: pasted input and uploaded input must share
   one validation path. Two paths that can diverge is the defect, not the
   feature.
4. Scope discipline. Do not rewrite code that already passes.
5. Work on a branch named `astra/iteration-3`. Do not commit to `main`.
6. This is a one-shot iteration. No clarification will be provided.

SCORING
Section K (8 points) and gate G9 from Amendment 002, plus a full regression
check of rounds 1 and 2. Core is now 118 points; bands are percentages, and the
band table is repaired in Amendment 002 section 12.6.

DELIVERABLE
A working, deployed application with CI green, in which a program can be
authored and imported without any file being written to the device. That is
gate G9, and it is the entire point of this round.
````

### Iteration 4 — GPT-6 Astra — Amendment 003

```
Continue work on the repository you previously implemented:
https://github.com/AndrewPHunter/fitness

This is ITERATION 4. It is not a fresh build. Your previous three rounds are on
`main`. Round 1 scored 99/100; iterations 2 and 3 both reached Core ceiling with
no regression.

READ FIRST, IN THIS ORDER
1. `specs/13-amendment-003-pwa-and-palette.md` — the brief for this round.
2. `evaluation/2026-09-11-gpt-6-astra-iteration-3.md` — how your last round was
   graded.
3. `evaluation/iterations.md` — the rules this round is scored under.
4. `specs/00-constitution.md` — unchanged, and still takes precedence over every
   other document including this prompt.

TASK
Implement Amendment 003, and nothing else. It has two parts:

Part A — CORE-16, installable PWA (PWA-1..PWA-9). This is promoted from the
Extended tier because it is the real mitigation for Hazard A in specs/05:
iOS evicting localStorage. Prose asking the user to install is not the
mitigation; being installable is.

Part B — VIS-6..VIS-10, the colour scheme. The palette is specified exactly,
with measured contrast ratios. Implement those values; do not substitute your
own.

Three requirements are traps, and all three are about honesty:

- PWA-8. A precached shell can serve an old build after a deploy. Surface a
  waiting worker as an explicit user-actioned update. No skipWaiting, no
  automatic reload, and never update while a session is in progress.
- PWA-9. iOS Safari does not fire beforeinstallprompt, and iOS is the target
  platform. Render a one-tap install button ONLY where that event actually
  fired; otherwise show the real Share -> Add to Home Screen instructions. An
  install button that does nothing on the user's platform is an automatic zero
  for Section L.
- VIS-10. Contrast must be computed in CI from the token values themselves. A
  snapshot, or a hardcoded list of expected numbers, does not satisfy this.

RULES
1. Do not modify `specs/`, `fixtures/`, or `evaluation/`.
2. No regression across all three previous rounds. Every criterion that passed
   must still pass, including the two invalid fixtures producing exactly 8 and 7
   errors while writing nothing, the authoring kit injecting the user's own
   exercise IDs, and paste/upload sharing one validation path.
3. VIS-3 still holds under the new palette: confirmed, unconfirmed and failed
   states must be distinguishable WITHOUT relying on colour alone. A new palette
   is the easiest place to lose this.
4. Scope discipline. Do not rewrite code that already passes.
5. Work on a branch named `astra/iteration-4`. Do not commit to `main`.
6. This is a one-shot iteration. No clarification will be provided.

SCORING
Section L (10 points), Section M (6 points), and gates G10 and G11. Core is now
134 points; Extended is 26, since EXT-7 was promoted into Core. Plus a full
regression check of rounds 1 through 3.

DELIVERABLE
A working, deployed, installable application with CI green, which functions
fully offline after one online load and surfaces updates explicitly rather than
swapping versions underneath the user.
```

### Iteration 5 — GPT-6 Astra — Amendment 004

```
Continue work on the repository you previously implemented:
https://github.com/AndrewPHunter/fitness

This is ITERATION 5. It is not a fresh build. Your previous four rounds are on
`main`. Round 1 scored 99/100; iterations 2, 3 and 4 all reached Core ceiling
with no regression.

READ FIRST, IN THIS ORDER
1. `specs/14-amendment-004-reps-and-per-set.md` — the brief for this round.
2. `evaluation/2026-09-13-gpt-6-astra-iteration-4.md` — how your last round was
   graded, including a process violation noted there.
3. `evaluation/iterations.md` — the rules this round is scored under.
4. `specs/00-constitution.md` — unchanged, and still takes precedence over every
   other document including this prompt.

ALREADY DONE FOR YOU
The format changes are shipped. `fixtures/schema/program.schema.json`,
`fixtures/authoring-prompt.md`, and a new fixture
`fixtures/programs/07-ranges-and-per-set.json` are already updated. Do not modify
them. Your work is the application, not the format.

TASK
Implement Amendment 004, and nothing else. Two parts, scored separately:

Part A — CORE-17, rep ranges (RNG-1..RNG-5, SEM-9).
Part B — CORE-18, per-set prescription (SET-1..SET-7, SEM-10, SEM-11).

Two requirements are traps, and both are about honesty:

- RNG-5. A rep range invites the app to notice when the top is reached. It must
  not. No highlighting, no colour-coding, no "ready to progress", no comparison
  of logged reps against the range beyond displaying both. Evaluating attainment
  is a progression rule (C8) and judging the user against a declared target
  (C9). Violations lose the points AND incur the constitution deductions.
- SET-7 / SEM-11. When `sets` is an array, entry-level reps, repsMax,
  targetWeight, targetRpe and restSeconds must be rejected — those describe a
  set, and the elements now do that. additionalProperties cannot catch this;
  it is a semantic rule, and its message must name the field and say where it
  belongs.

The schema expresses the `sets` union with if/then, not oneOf, so a malformed
value yields one error rather than a paired type error. Do not change that.

RULES
1. Do not modify `specs/`, `fixtures/`, or `evaluation/`.
2. No regression across all four previous rounds. In particular: the two invalid
   fixtures still produce exactly 8 and 7 errors while writing nothing; paste and
   upload still share one validation path; the authoring kit still injects the
   user's own exercise IDs; the app still works offline and surfaces updates
   explicitly; the contrast check still passes.
3. Open a PULL REQUEST from branch `astra/iteration-5`. Do NOT push to `main`.
   Iteration 4 committed straight to main with no PR, against the brief. Rounds
   1 to 3 used pull requests. Use one.
4. Scope discipline. Do not rewrite code that already passes.
5. This is a one-shot iteration. No clarification will be provided.

SCORING
Section N (6 points), Section O (10 points), and gate G12. Core is now 150
points; Extended remains 26. Plus a full regression check of rounds 1 to 4.

DELIVERABLE
A working, deployed application with CI green, in which fixture 07 imports and a
session from it can be logged with each set showing its own prescription.
```

### Iteration 6 — GPT-6 Astra — Amendment 005

**Revised before handoff** to add clearing pasted input (CLR) at the owner\'s request. This version supersedes the first draft.

Directives are numbered. Each is scored individually in the round's record (IT-6).

```
Continue work on the repository you previously implemented:
https://github.com/AndrewPHunter/fitness

This is ITERATION 6. It is not a fresh build. Your five previous rounds are on
`main`.

Read these directions carefully. Each one is numbered and will be checked
individually. Following the directions is being measured separately from the
quality of the software.

CONTEXT
Real use of the app surfaced problems that five graded rounds did not catch:
action confirmations exist only for screen readers, validation results render
off-screen, and after activating a program there is no visible way to start it.
Read the audit for the evidence.

DIRECTIONS

D1. Read, in this order, before writing any code:
    a. specs/15-amendment-005-perceivable-feedback.md   (the brief)
    b. evaluation/2026-09-14-ux-audit.md                (the evidence)
    c. evaluation/iterations.md                         (the rules)
    d. specs/00-constitution.md                         (takes precedence)

D2. Implement Amendment 005, and nothing else.

D3. Do not modify anything in specs/, fixtures/ or evaluation/.

D4. Work on a branch named astra/iteration-6 and open a pull request.
    Do not push to main.

D5. No regression across rounds 1-5. In particular: the two invalid fixtures
    still produce exactly 8 and 7 errors and write nothing; paste and upload
    share one validation path; the authoring kit injects the user's own exercise
    IDs; the app works offline and surfaces updates explicitly; rep ranges show
    no attainment logic; per-set prescriptions display per set.

D6. Do not change the visual direction or any palette token. New feedback uses
    existing tokens. npm run check:contrast must still pass.

D7. Keep the screen-reader announcements. Add visible feedback alongside them.
    Do not replace one with the other. (FB-3)

D8. Your perceivability helper must reject three cases, and must have its own
    tests proving it does: a screen-reader-only confirmation inside the viewport,
    visible text behind the fixed bottom navigation, and text below the fold.
    Note: Playwright's toBeVisible() passes a screen-reader-only element, and
    toBeInViewport() passes text hidden behind a fixed nav. Neither is enough
    on its own. (VER-1, VER-4)

D9. Offer Discard only for a session with zero logged sets. Never offer it once
    a set is logged. (SES-12, SES-13)

D10. Export confirmation copy must not claim the file was saved or downloaded.
     The app cannot observe that. (FB-8)

D11. Log set must stay reachable while the iOS keyboard is open.
     position: fixed; bottom alone does not satisfy this, even though it passes
     the CI proxy. (LOG-3)

D12. Record genuine specification silences in DECISIONS.md, and nothing else.

D13. Add a Clear control for the paste field, with Undo and no confirmation
     dialog. Clear only when the user presses it. Never clear the field
     automatically after a validation failure - PAS-7 still holds.
     (CLR-1 to CLR-7)

D14. This is a one-shot iteration. No clarification will be provided.

SCORING
Sections P-V (40 points) and gate G13 from Amendment 005. Core is now 190
points. Directions D1-D14 are scored separately as followed, not followed,
misapplied, or not verifiable.

DELIVERABLE
A pull request, with CI green, in which every step of the core loop - author,
paste, validate, import, activate, start, log a set, complete - produces an
outcome the user can see without scrolling.
```
