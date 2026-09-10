# 08 — Quality Standards

## 8.1 TypeScript

| ID | Requirement |
|---|---|
| TS-1 | `strict: true`, including `strictNullChecks` and `noImplicitAny` |
| TS-2 | `noUncheckedIndexedAccess: true` |
| TS-3 | `any` is forbidden outside typed shims for untyped third-party code, each with a comment justifying it |
| TS-4 | Type assertions (`as`) are forbidden on data crossing a trust boundary — parsed JSON must be **validated** into its type, never asserted into it |
| TS-5 | `tsc --noEmit` passes with zero errors |

TS-4 is a correctness requirement, not a style preference. `JSON.parse(x) as Program` is a lie
to the compiler about data that arrived from outside the program, and it is precisely the
failure [C1](00-constitution.md) exists to prevent.

## 8.2 Linting

Per the project decision, the **Airbnb JavaScript and React style guides are the stylistic
reference**, but the implementer chooses the concrete tooling. `eslint-config-airbnb` has lagged
behind ESLint flat config and modern TypeScript, and forcing it is not worth the version
constraints it imposes.

Because the ruleset itself is not prescribed, linting is graded on **outcome**:

| ID | Requirement |
|---|---|
| LINT-1 | A lint configuration is committed to the repository |
| LINT-2 | It covers TypeScript, React, hooks (`rules-of-hooks`, `exhaustive-deps`), and accessibility (`jsx-a11y` or equivalent) |
| LINT-3 | It mechanically enforces the layer boundaries ARCH-1..ARCH-4 ([04 §4.1](04-architecture.md)) |
| LINT-4 | The repository is warning-clean — lint exits zero with **zero** warnings, not merely zero errors |
| LINT-5 | CI fails on any lint violation |
| LINT-6 | Rule suppressions (`eslint-disable`) each carry a comment stating why. Blanket file-level disables are forbidden |
| LINT-7 | Formatting is automated and CI-checked |

LINT-3 is where the real points are. A convention that is documented but not enforced is a
convention that will be violated.

## 8.3 Testing strategy

Governed by [C6](00-constitution.md). Tests exist to control behaviour, not to produce a
coverage number.

### What must be tested, and how

| Area | Level | Must include |
|---|---|---|
| Structural validation | Unit | All 8 errors from `05-invalid-structural.json`, per [`fixtures/expected/`](../fixtures/expected/) |
| Error normalisation | Unit | ERR-1..ERR-4: control-keyword artifacts filtered; 8 errors surface, not 13 |
| Semantic validation | Unit | All 7 errors from `06-invalid-semantic.json`, plus one test per rule SEM-1..SEM-8 (SEM-4 has no fixture) |
| Next-session resolution | Unit | Rotation wrap-around; repeated sessions in a sequence; weekday mode on a rest day |
| Weight prefill | Unit | Cross-program lookup; no-history fallback to `targetWeight`; fallback to empty |
| Observed frequency | Unit | Boundary conditions at exactly 7 and 14 days; injected clock only |
| Migration | Unit | Each registered migration, from a committed fixture of the prior shape |
| Export round-trip | Unit | EXP-7 deep equality over multiple fixtures |
| CSV serialisation | Unit | Quoting, empty-vs-zero (CSV-2), historical resolution (CSV-5) |
| Import conflicts | Unit | IMP-7 conflict reporting; IMP-8 atomicity |
| Storage failure | Unit | A **real** adapter failure inducing `QuotaExceededError` (HAZ-B5) |
| Upload error rendering | Component | All errors listed individually, with path and message |
| Superset round-robin | Component | SES-11 logging order |
| Prefill confirmation | Component | SES-4 — untouched prefill is not persisted |
| Log-a-session flow | E2E | Upload fixture 02 → activate → start → log a full session → verify persisted |
| Export/import round-trip | E2E | Log data → export → clear storage → import → verify identical |

### Determinism requirements

| ID | Requirement |
|---|---|
| TEST-1 | No test calls `Date.now()`, `Math.random()` or `crypto.randomUUID()` — the injected doubles are used |
| TEST-2 | Tests pass under any host timezone. CI must run the suite under at least two `TZ` values, one of which is not UTC |
| TEST-3 | Tests pass in any execution order, including randomised |
| TEST-4 | No test depends on real elapsed time. No arbitrary sleeps |
| TEST-5 | Any test that fails intermittently is treated as a defect in the code under test |

TEST-2 exists because date-window logic (observed frequency, CSV ordering, export filenames) is
the most likely place for a hidden timezone dependency, and a UTC-only CI run will not find it.

### Coverage

No coverage threshold is specified, and coverage percentage is **not scored**. A high number
produced by tests that assert nothing meaningful is worse than a lower number produced by tests
that encode real contracts. The table above defines what must be tested; it is graded on
whether those behaviours are genuinely controlled.

## 8.4 Continuous integration

A GitHub Actions workflow must run on every push and pull request:

| ID | Step |
|---|---|
| CI-1 | Install with a lockfile, using a reproducible install (`npm ci` or equivalent) |
| CI-2 | `tsc --noEmit` |
| CI-3 | Lint, zero warnings |
| CI-4 | Format check |
| CI-5 | Unit and component tests, under at least two timezones (TEST-2) |
| CI-6 | Build |
| CI-7 | End-to-end tests against the built output |

| ID | Requirement |
|---|---|
| CI-8 | A lockfile is committed |
| CI-9 | Node version is pinned in the workflow and, ideally, in `.nvmrc` or `engines` |
| CI-10 | No step is permitted to continue on error |
| CI-11 | Deployment ([09](09-deployment.md)) runs only after all checks pass |

## 8.5 Determinism of the build

Per [C4](00-constitution.md), extended to the build itself:

- The same commit produces the same artefact
- No build step reads undeclared environment variables
- No build step depends on network access beyond dependency installation
- No timestamps, hostnames, or absolute paths are embedded in the output
