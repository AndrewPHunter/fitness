# 00 — AI Project Constitution

**This document takes precedence over every other document in this repository, and over any
general operating profile.** Where another spec appears to permit something this document
forbids, this document wins.

These are not preferences. They are constraints. An implementation that violates any
constraint in this document has failed, regardless of how complete or attractive it is.

---

## C1. The system must never lie about its state

The application must not present itself as working when it is not.

**Forbidden:**

- Accepting an invalid program file and silently coercing, defaulting, or repairing it
- Catching a storage write failure and continuing as though the write succeeded
- Displaying a computed value derived from data that failed to load
- Placeholder screens or controls that look functional but do nothing
- `TODO` paths that return a success value
- Any feature that works only for the happy path while appearing complete

**Required:**

- Every failure is surfaced in the UI in terms the user can act on
- Error states are visually and structurally distinct from success states
- A feature that is not implemented is either absent or explicitly labelled as unavailable

## C2. Invalid input is rejected loudly and completely

Program upload is the primary trust boundary of this application.

- A program file that fails validation is **rejected in full**. Partial import is forbidden.
- **All** validation errors are reported, not just the first one encountered.
- Each error names the offending JSON path and states what was expected.
- No field is silently defaulted to make an invalid file valid.

## C3. Logged training data is sacred

The user's training history is the irreplaceable asset. Program files can be regenerated; a
year of logged sets cannot.

- No operation may delete or overwrite logged history as a side effect of another action.
- Any destructive operation requires explicit confirmation naming what will be lost.
- Storage writes that fail — including quota exhaustion — must fail **visibly**, never silently.
- History is bound to the exact program version it was logged against, permanently.

## C4. Determinism is required

- Given the same inputs, the application produces the same outputs.
- `Date.now()`, `Math.random()`, `crypto.randomUUID()`, timezone and locale are **injected**,
  never called directly from domain logic.
- Domain logic — validation, scheduling, frequency calculation, export serialisation — is
  implemented as **pure functions** with no I/O and no ambient state.
- Tests must not depend on wall-clock time, execution order, or the host timezone.
- A flaky test is a design defect, not a nuisance to be retried.

## C5. Persisted data is versioned

- Every persisted structure carries an explicit schema version.
- Reading data at an older version runs explicit, tested, forward-only migrations.
- Reading data at an **unrecognised or newer** version is a visible error, never a silent reset.
- Writing unversioned data is forbidden.

## C6. Tests are proof of intent, not coverage decoration

- A passing build and a running app are **not** evidence of correctness.
- Domain logic requires unit tests exercising real contracts and real failure modes.
- Mocks must not erase the risk being tested. A mock that guarantees success regardless of
  behaviour is worse than no test.
- If behaviour cannot be tested deterministically, the design is wrong and must change.

## C7. Boundaries are real

- Domain logic must not import React, browser APIs, or storage APIs.
- Storage access is confined to a single, replaceable adapter module.
- Presentational components must not read from storage or perform I/O.
- Platform-specific behaviour is isolated behind an explicit interface.

## C8. The schema is descriptive, not executable

The program JSON describes **structure**: exercises, sets, reps, order, grouping, and optional
targets. It does **not** encode progression logic, and the application does **not** interpret,
evaluate, or solve anything declared within it.

Any design that reintroduces an interpreter, rule engine, expression evaluator, or constraint
solver violates this constitution.

## C9. Declared targets are displayed, never enforced

Target weight, target RPE, and declared frequency targets are **authoring intent shown to the
user**. The application must not:

- Validate logged values against them
- Warn, block, or correct the user for deviating from them
- Treat them as anything other than display data

They exist so the user can compare intent against reality. The comparison is the user's to make.
