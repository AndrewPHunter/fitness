# 03 — Program Schema & Validation

> **Amended.** [Amendment 004](14-amendment-004-reps-and-per-set.md) adds `repsMax`,
> the array form of `sets`, and rules SEM-9 to SEM-11. The shipped schema is format revision 2.

The normative machine-readable contract is
[`fixtures/schema/program.schema.json`](../fixtures/schema/program.schema.json)
(JSON Schema draft 2020-12). This document explains it and specifies the validation behaviour
the schema file alone cannot express.

## 3.1 Two validation layers — both required

A JSON Schema validator alone is **not sufficient** to validate a program file. Cross-references
between parts of the document cannot be expressed in JSON Schema. An implementation that
validates only structurally will accept files that are internally incoherent.

### Layer 1 — Structural

Validate the document against `program.schema.json` using a standards-compliant draft 2020-12
validator. This catches: missing required fields, wrong types, out-of-range numbers, malformed
slugs, `additionalProperties`, array length bounds.

### Layer 2 — Semantic / referential

Implemented as a **pure function** over the parsed document. This catches:

| ID | Rule |
|---|---|
| SEM-1 | Every `ExerciseEntry.exerciseId` resolves to a declared `Program.exercises[].exerciseId` |
| SEM-2 | Every `FrequencyTarget.exerciseId` resolves to a declared exercise |
| SEM-3 | Every `schedule.sequence[]` entry (rotation) resolves to a declared `Session.sessionId` |
| SEM-4 | Every `schedule.days[*]` value (weekdays) resolves to a declared `Session.sessionId` |
| SEM-5 | `Program.exercises[].exerciseId` values are unique within the file |
| SEM-6 | `Program.sessions[].sessionId` values are unique within the file |
| SEM-7 | Every declared exercise is referenced by at least one session (unused-exercise check) |
| SEM-8 | Every declared session is reachable from the schedule (unreachable-session check) |
| SEM-9 | Where `repsMax` is present, `repsMax > reps` strictly ([Amendment 004](14-amendment-004-reps-and-per-set.md)) |
| SEM-10 | Where `sets` is an integer, entry-level `reps` is required |
| SEM-11 | Where `sets` is an array, entry-level `reps`/`repsMax`/`targetWeight`/`targetRpe`/`restSeconds` are forbidden |

SEM-7 and SEM-8 are **errors, not warnings**. A program containing content the user can never
reach is incoherent, and silently ignoring it would violate [C1](00-constitution.md).

### Layer 3 — Storage-level

Applied at import time, not to the file's internal structure:

| ID | Rule |
|---|---|
| STO-1 | `(programId, version)` does not already exist in storage |

## 3.2 Error reporting contract — CORE-1

Governed by [C2](00-constitution.md).

Validation returns a **result type**, never a thrown exception as its primary mechanism:

```ts
type ValidationResult =
  | { ok: true;  program: Program }
  | { ok: false; errors: ValidationError[] };   // errors.length >= 1

interface ValidationError {
  layer: 'structural' | 'semantic' | 'storage';
  code: string;          // stable, machine-readable, e.g. 'SEM-1', 'TYPE_MISMATCH'
  path: string;          // RFC 6901 JSON Pointer, e.g. '/sessions/0/blocks/1/entry/sets'
  message: string;       // human-readable, states what was expected
}
```

Requirements:

1. **All** errors are collected and returned. Returning only the first is a Core failure.
2. Layer 1 runs first. If Layer 1 produces errors, Layer 2 is skipped — semantic checks over a
   structurally invalid document would produce noise. This is the **only** permitted short-circuit.
3. `path` is a valid JSON Pointer into the uploaded document.
4. On `ok: false`, **nothing is written to storage**. Partial import is forbidden.
5. Every error is rendered in the UI with its path and message. A generic "invalid file" message
   is a Core failure.
6. A file that is not valid JSON at all produces a single `structural` error with
   `code: 'PARSE_ERROR'` and `path: ''`.

## 3.3 Annotated example

```jsonc
{
  "programId": "every-other-day-strength",   // slug, identity across versions
  "version": 1,                              // integer >= 1
  "name": "Every Other Day Strength",
  "description": "7-session rotation over ~14 days.",

  "exercises": [                             // canonical declarations; ids are cross-program
    { "exerciseId": "barbell-back-squat", "name": "Back Squat" },
    { "exerciseId": "barbell-deadlift",   "name": "Deadlift", "notes": "Belt optional." }
  ],

  "sessions": [
    {
      "sessionId": "a-squat-bench",
      "name": "A — Squat / Bench",
      "blocks": [
        {
          "type": "single",
          "entry": {
            "exerciseId": "barbell-back-squat",
            "sets": 3, "reps": 5,            // fixed reps; never a range
            "targetWeight": { "value": 100, "unit": "kg" },  // display-only (C9)
            "targetRpe": 8,                                   // display-only (C9)
            "restSeconds": 180
          }
        },
        {
          "type": "superset",                // logged round-robin — see 06
          "entries": [
            { "exerciseId": "chin-up", "sets": 3, "reps": 8 },
            { "exerciseId": "dip",     "sets": 3, "reps": 10 }
          ]
        }
      ]
    }
  ],

  "schedule": {
    "mode": "rotation",
    "sequence": ["a-squat-bench", "b-press", "a-squat-bench"]  // repeats express frequency
  },

  "frequencyTargets": [                      // declared intent, never enforced (C9)
    { "exerciseId": "barbell-back-squat", "perWeek": 3 },
    { "exerciseId": "barbell-deadlift",   "perWeek": 1 }
  ]
}
```

## 3.5 Error normalisation

A standards-compliant validator emits errors for **control keywords** as well as for real
violations. When a `block` fails, the validator reports the failing constraint *and* an
enclosing `if` / `allOf` failure at the block level, carrying no information the user can act on.

Uploading [`05-invalid-structural.json`](../fixtures/programs/05-invalid-structural.json)
produces **eight** real violations and **five** such artifacts.

| ID | Requirement |
|---|---|
| ERR-1 | Errors whose failing keyword is a control keyword — `if`, `then`, `else`, `allOf`, `anyOf`, `oneOf`, `not` — are filtered out |
| ERR-2 | Errors are de-duplicated by `(path, code)` |
| ERR-3 | Errors are ordered by JSON Pointer, so related problems appear together |
| ERR-4 | Every surviving error names a concrete offending value or property |

Rendering all thirteen entries satisfies [A3](10-acceptance-criteria.md) but fails
[A4](10-acceptance-criteria.md). Thirteen errors for eight problems, five of them reading
`must match "then" schema`, is not an actionable report.

The schema uses `if`/`then` discriminators rather than `oneOf` specifically to reduce this
noise — `oneOf` would produce roughly four artifacts per real error instead of one. Filtering
is still required.

## 3.6 Design notes and deliberate omissions

**Why `additionalProperties: false` everywhere.** An unrecognised field is far more likely to be
an LLM hallucinating a feature the app does not have than a deliberate extension. Silently
ignoring it would let a program *appear* to prescribe something the app never honours — a
[C1](00-constitution.md) violation. Rejecting is the honest behaviour.

**Why no `$schema` requirement.** The file is validated against a schema the app ships. Trusting
a `$schema` URL in the uploaded document would mean fetching it, which breaks the offline
guarantee.

**Why `reps` is a plain integer.** Rep ranges and AMRAP are out of scope
([01 §1.5](01-product-spec.md)). Keeping `reps` a number rather than a union removes an entire
class of ambiguity from both the logging UI and the history calculations.

**Why supersets do not nest.** Nesting has no additional expressive power for the set types in
scope, and would require a recursive rendering and logging model for no user-visible benefit.

**Why the schema does not constrain `exerciseId` to a fixed registry.** See
[02 §2.2](02-domain-model.md). A closed registry cannot express unusual exercises; the
mitigation is the authoring prompt pack plus the app's new-vs-known reporting on upload.
