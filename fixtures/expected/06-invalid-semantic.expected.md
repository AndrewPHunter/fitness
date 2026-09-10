# Expected validation output — `06-invalid-semantic.json`

This file is **structurally valid** against `program.schema.json`. It passes Layer 1 completely.

It exists to prove the central claim of [03 §3.1](../../specs/03-program-schema.md): **a JSON
Schema validator alone is not sufficient.** An implementation that validates only structurally
will accept this file and store an internally incoherent program — which is a
[C1](../../specs/00-constitution.md) violation, because the app would then present a program
containing references that resolve to nothing.

Validation must report **all seven** violations below.

## Required errors

| # | Rule | JSON Pointer | Violation |
|---|---|---|---|
| 1 | SEM-1 | `/sessions/0/blocks/1/entry/exerciseId` | `ghost-exercise` is not declared in `/exercises` |
| 2 | SEM-2 | `/frequencyTargets/0/exerciseId` | `ghost-target-exercise` is not declared in `/exercises` |
| 3 | SEM-3 | `/schedule/sequence/1` | `ghost-session` is not a declared `sessionId` |
| 4 | SEM-5 | `/exercises/1/exerciseId` | Duplicate `exerciseId` `barbell-back-squat` (first declared at `/exercises/0`) |
| 5 | SEM-6 | `/sessions/1/sessionId` | Duplicate `sessionId` `session-one` (first declared at `/sessions/0`) |
| 6 | SEM-7 | `/exercises/2` | `orphan-exercise` is declared but referenced by no session |
| 7 | SEM-8 | `/sessions/2` | `unreachable-session` is declared but never reached by the schedule |

## Notes on grading

**Pointer convention for duplicates.** Errors 4 and 5 may point at either the duplicate
occurrence or the original. Either is accepted, provided the message identifies both positions.

**SEM-4 is not covered by this fixture.** SEM-4 concerns a `weekdays` schedule referencing an
undeclared `sessionId`, and this fixture uses `rotation` mode — a single file cannot exercise
both. SEM-4 is covered by unit test instead, per
[08 §8.3](../../specs/08-quality-standards.md).

**SEM-7 and SEM-8 are errors, not warnings.** A program containing an exercise the user can
never perform, or a session the schedule can never reach, is incoherent. Accepting it and
quietly ignoring the unreachable content would be the application concealing a defect in the
user's program — a [C1](../../specs/00-constitution.md) violation. An implementation that
reports these as non-blocking warnings and imports the program anyway fails
[A2](../../specs/10-acceptance-criteria.md).

**Nothing is written.** As with `05`, storage must be byte-identical before and after the
rejected upload.
