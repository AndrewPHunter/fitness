# Expected validation output — `05-invalid-structural.json`

This file is **deliberately invalid**. It must be rejected in full, with **nothing written to
storage** ([C2](../../specs/00-constitution.md)).

Validation must report **all eight** violations below. Reporting fewer is a Core failure
([A3](../../specs/10-acceptance-criteria.md)).

## Required errors

| # | JSON Pointer | Violation | Expected message conveys |
|---|---|---|---|
| 1 | `/version` | `minimum` | `version` must be an integer ≥ 1; found `0` |
| 2 | `/exercises/1/exerciseId` | `pattern` | Must be lowercase kebab-case; found `"Bench Press"` |
| 3 | `/exercises/2` | `additionalProperties` | Unrecognised property `muscleGroup` |
| 4 | `/sessions/0/blocks/0/entry/sets` | `minimum` | `sets` must be ≥ 1; found `0` |
| 5 | `/sessions/0/blocks/1/entry/targetRpe` | `maximum` | `targetRpe` must be ≤ 10; found `12` |
| 6 | `/sessions/0/blocks/2/entry` | `required` | Missing required property `reps` |
| 7 | `/sessions/0/blocks/3/entries` | `minItems` | A superset requires at least 2 entries; found 1 |
| 8 | `/sessions/1/blocks/0/entry` | `additionalProperties` | Unrecognised property `tempo` |

## Notes on grading

**Message wording is not graded.** The JSON Pointer, the identified violation, and the presence
of all eight are graded. The message must be actionable — it must say what was expected — but its
exact phrasing is free.

**Layer 2 is correctly skipped.** Because Layer 1 produced errors, semantic validation does not
run ([03 §3.2](../../specs/03-program-schema.md)). No SEM-* errors should appear for this file.

**Validator wrapper artifacts must not be shown.** A draft 2020-12 validator will additionally
emit control-keyword errors — for this file, five `if` / `must match "then" schema` entries at
`/sessions/0/blocks/0`, `/sessions/0/blocks/1`, `/sessions/0/blocks/2`, `/sessions/0/blocks/3`
and `/sessions/1/blocks/0`. These carry no information for the user. Per
[03 §3.5](../../specs/03-program-schema.md) they must be filtered out.

An implementation that renders thirteen errors — the eight real ones plus five
`must match "then" schema` — has passed A3 but fails
[A4](../../specs/10-acceptance-criteria.md).

**`additionalProperties` is deliberate.** Errors 3 and 8 exist because `muscleGroup` and `tempo`
are plausible-looking fields an LLM might invent. Accepting and ignoring them would let a program
appear to prescribe something the app never honours — a [C1](../../specs/00-constitution.md)
violation.
