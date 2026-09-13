# Fixtures

Fixed inputs for the evaluation. Every implementation under test receives these unmodified.

| File | Valid? | Purpose |
|---|---|---|
| `programs/01-minimal.json` | Valid | Smallest coherent program. Baseline sanity. |
| `programs/02-every-other-day-rotation.json` | Valid | **The reference fixture.** Every-other-day cadence; frequency expressed structurally in a 7-session / 14-day rotation. Supersets, targets, `frequencyTargets`. |
| `programs/03-fixed-weekdays.json` | Valid | The second schedule mode, including rest-day resolution. Uses `lb`. |
| `programs/04-complex-multiblock.json` | Valid | Upper end of structural complexity. 6 sessions, 12-entry rotation, 14 exercises, dense supersets, mixed units, `version: 3`. |
| `programs/07-ranges-and-per-set.json` | Valid | Rep ranges and per-set prescription ([Amendment 004](../specs/14-amendment-004-reps-and-per-set.md)), including inside a superset. |
| `programs/05-invalid-structural.json` | **Invalid** | 8 JSON Schema violations. Must all be reported. |
| `programs/06-invalid-semantic.json` | **Invalid** | Structurally valid, 7 referential violations. Proves schema validation alone is insufficient. |

`expected/` states exactly which errors each invalid fixture must produce, and how they are
graded.

`schema/program.schema.json` is the normative JSON Schema (draft 2020-12).

`authoring-prompt.md` is the prompt pack for generating new programs with an LLM.

## Verifying the fixtures

The valid fixtures pass, and `05` fails, against the published schema using any compliant
draft 2020-12 validator. `06` passes structurally by design — its violations are semantic and
require the Layer 2 checks in [`specs/03-program-schema.md`](../specs/03-program-schema.md).
