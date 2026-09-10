# Fitness Program Tracker — Specification & Evaluation Harness

This repository contains **specifications only**. It deliberately contains **no implementation
code, no scaffolding, no `package.json`, and no dependency manifests.**

## Purpose

Two things live here:

1. **A complete, self-contained product specification** for a personal fitness-program
   tracking application — a static React site, hosted on GitHub Pages, storing all data in
   browser `localStorage`.
2. **An evaluation harness** — fixed input fixtures and an objective scoring rubric — used to
   assess how well a coding agent can implement that specification in a single pass.

The second purpose constrains the first. Because this specification is a **control artifact**
for an evaluation, it is written to be:

- **Objectively gradeable.** Requirements are stated as checkable acceptance criteria, not as
  adjectives. "Good UX" is not a requirement; "the rest timer survives a page reload" is.
- **Fixed-input.** Every implementation under test receives the identical program fixtures in
  `fixtures/programs/`.
- **Tiered.** [Core](specs/10-acceptance-criteria.md) requirements are graded and must pass.
  Extended requirements are bonus and differentiate strong implementations from adequate ones.
- **Self-contained.** No tribal knowledge. If it is not written here, it is not required.

## Reading order

| Document | Contents |
|---|---|
| [`specs/00-constitution.md`](specs/00-constitution.md) | **Read first.** Non-negotiable engineering constraints. Takes precedence over every other document. |
| [`specs/01-product-spec.md`](specs/01-product-spec.md) | Scope, user, Core vs Extended tiers, explicit non-goals |
| [`specs/02-domain-model.md`](specs/02-domain-model.md) | Entities, relationships, identity and lifecycle rules |
| [`specs/03-program-schema.md`](specs/03-program-schema.md) | The program JSON contract and its two-layer validation model |
| [`specs/04-architecture.md`](specs/04-architecture.md) | Module boundaries, atomic design system, feature slices, state |
| [`specs/05-persistence.md`](specs/05-persistence.md) | `localStorage` contract, versioning, migration, quota and eviction |
| [`specs/06-ui-ux.md`](specs/06-ui-ux.md) | Screens, flows, and the mid-workout mobile constraints |
| [`specs/07-export-import.md`](specs/07-export-import.md) | Export formats and the lossless round-trip guarantee |
| [`specs/08-quality-standards.md`](specs/08-quality-standards.md) | TypeScript, linting, testing strategy, CI, determinism |
| [`specs/09-deployment.md`](specs/09-deployment.md) | GitHub Pages, Actions workflow, base path, routing |
| [`specs/10-acceptance-criteria.md`](specs/10-acceptance-criteria.md) | The graded checklist and scoring rubric |

## Fixtures

| Path | Purpose |
|---|---|
| `fixtures/schema/program.schema.json` | The published JSON Schema for program files |
| `fixtures/programs/*.json` | Fixed test inputs, including one **deliberately invalid** file |
| `fixtures/expected/*.md` | Required validation output for the invalid fixture |
| `fixtures/authoring-prompt.md` | The prompt pack used to have an LLM author new programs |
| `fixtures/README.md` | What each fixture is for |

## The one-sentence summary

A phone-first web app that reads an LLM-authored JSON workout program, tells you what to do
next, records the weight, reps and RPE you actually achieved, and lets you export the results —
storing everything locally, and never pretending anything works when it does not.
