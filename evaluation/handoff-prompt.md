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
