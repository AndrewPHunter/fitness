# Handoff prompt

Given verbatim to the model under test. Substitute the branch name.

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
