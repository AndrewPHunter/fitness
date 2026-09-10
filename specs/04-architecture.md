# 04 — Architecture

## 4.1 Layer model

Four layers. Dependencies point **downward only**. An import that points upward is an
architectural failure ([C7](00-constitution.md)) and must be caught by lint, not by review.

```
  app/          routing, providers, composition root
    ↓
  features/     domain-specific UI + orchestration (feature slices)
    ↓
  ui/           the atomic design system — presentational only
    ↓
  domain/       pure logic. No React. No browser APIs. No I/O.
```

Plus one lateral module:

```
  platform/     the ONLY place browser APIs are touched (storage, clock, ids, files)
```

`platform/` is imported by `app/` and `features/`. It must **never** be imported by `domain/`
or `ui/`.

### Enforcement

The dependency rules above are Core requirements and must be **mechanically enforced** — an
ESLint `no-restricted-imports` configuration, an import-boundary plugin, or equivalent. A
convention documented but unenforced does not satisfy this.

Specifically:

| Rule | Forbidden |
|---|---|
| ARCH-1 | `domain/**` importing `react`, `react-dom`, `ui/**`, `features/**`, `app/**`, `platform/**` |
| ARCH-2 | `domain/**` referencing `window`, `document`, `localStorage`, `Date.now`, `Math.random`, `crypto` |
| ARCH-3 | `ui/**` importing `features/**`, `app/**`, `platform/**`, or `domain/**` other than types |
| ARCH-4 | Any module outside `platform/**` referencing `localStorage` or `sessionStorage` |

## 4.2 `domain/` — pure logic

Contains no React and no I/O. Every export is a pure function or a type. This is where the
testable substance of the application lives.

```
domain/
  program/
    validateStructure.ts      Layer 1 — JSON Schema validation
    validateSemantics.ts      Layer 2 — SEM-1..SEM-8
    validateProgram.ts        composes both, returns ValidationResult
    types.ts
  schedule/
    nextSession.ts            (program, completedCount, now, tz) => Session
  history/
    lastLoggedWeight.ts       (setLogs, exerciseId) => Load | null
    exerciseHistory.ts        (setLogs, exerciseId) => HistoryEntry[]
    observedFrequency.ts      (setLogs, exerciseId, now, windowDays) => number
  export/
    toExportJson.ts
    toCsv.ts
    fromExportJson.ts         import parsing + validation
  migration/
    migrations.ts             v(n) => v(n+1), forward-only
    migrate.ts
  units/
    load.ts                   Load construction, comparison, display formatting
```

**Time, randomness and timezone are parameters, never ambient** ([C4](00-constitution.md)).
`nextSession(program, completedCount, now, tz)` takes `now` — it does not call `Date.now()`.

## 4.3 `ui/` — the atomic design system

Presentational only. No storage access, no domain imports beyond types, no data fetching, no
business rules. Every component is driven entirely by props.

```
ui/
  tokens/           colour, spacing, typography, radii, breakpoints
  atoms/            Button, Input, NumberStepper, Text, Icon, Badge, Spinner
  molecules/        FormField, StatTile, ListRow, ErrorItem, Toggle
  organisms/        AppBar, ErrorPanel, SetRow, EmptyState, ConfirmDialog
  templates/        AppShell, ListPageTemplate, SessionTemplate
```

Atomic design applies **here and only here**. It classifies presentational components by
composition depth, which is exactly what it is good at.

### Composition rules

- An atom composes no other atoms.
- A molecule composes atoms.
- An organism composes molecules and atoms.
- A template composes organisms and defines layout slots — it holds no domain data.
- Components at every level are pure functions of props, with no internal domain state.

## 4.4 `features/` — feature slices

Domain-specific UI and orchestration, organised by feature rather than by technical type. This
is where React team colocation guidance applies: things that change together live together.

```
features/
  programs/         upload, validation display, program list, activation
  session/          the active-session logging flow
  history/          per-exercise history, frequency display
  data/             export, import, storage diagnostics
  settings/         unit default, theme
```

Each slice owns its components, hooks, and local state. A feature component **may** compose
`ui/` components and call `domain/` functions. Feature components are the only place where
domain data meets presentation.

**Cross-feature imports are forbidden.** Shared behaviour moves down into `domain/` or `ui/`.

## 4.5 `platform/` — the I/O boundary

The only module permitted to touch browser APIs. Each capability is exposed as an interface with
a real implementation and a deterministic test implementation.

```
platform/
  storage/
    StorageAdapter.ts         interface
    localStorageAdapter.ts    real
    memoryAdapter.ts          test double — labelled, never wired in production builds
  clock/
    Clock.ts                  interface: now(): string, timezone(): string
    systemClock.ts            real
    fixedClock.ts             test double
  ids/
    IdProvider.ts             interface: next(): string
    cryptoIdProvider.ts       real
    sequentialIdProvider.ts   test double
  files/
    download.ts               triggers a file save
    readTextFile.ts           reads an uploaded File
```

Test doubles are governed by [C1 / §3.2 of the constitution](00-constitution.md): explicitly
labelled, isolated behind the interface, and impossible to reach from a production build. The
composition root in `app/` wires the real implementations; nothing else may construct them.

## 4.6 State management

No third-party state library is required or expected. The scale of this application does not
justify one.

| State | Mechanism |
|---|---|
| Persisted domain data (programs, logs, settings) | A single React context over the storage adapter, exposing read state and explicit write actions |
| Active-session working state | Local state within the `session` feature slice, checkpointed to storage |
| Ephemeral UI state | `useState` colocated with the component |
| Routing state | The router |

**The persisted-data context is the only global mutable state permitted.** All writes go through
explicit named actions — no direct setter exposure. Every write action returns a result
indicating success or failure ([C1](00-constitution.md), [05 §5.5](05-persistence.md)); callers
must handle failure.

## 4.7 Routing

Hash-based routing (`#/programs`, `#/session/active`, …). Rationale in
[09 §9.3](09-deployment.md).

| Route | Screen |
|---|---|
| `#/` | Today — next session, start button |
| `#/programs` | Program list, upload |
| `#/programs/:programId/:version` | Program detail |
| `#/session/active` | Active session logging |
| `#/history` | Exercise index and frequency |
| `#/history/:exerciseId` | Per-exercise history |
| `#/data` | Export, import, storage diagnostics |
| `#/settings` | Unit default, theme |

## 4.8 Technology

| Concern | Requirement |
|---|---|
| Language | TypeScript, `strict: true`. `any` is forbidden outside typed third-party shims. |
| Framework | React 19. Function components and hooks only; no class components. |
| Build | Vite |
| Routing | Hash-based. Library choice is free. |
| Styling | Free choice, provided design tokens are centralised in `ui/tokens/` and not duplicated. |
| Schema validation | A standards-compliant JSON Schema draft 2020-12 validator |
| Unit / component tests | Vitest + React Testing Library |
| End-to-end tests | Playwright |
| Runtime dependencies | Must run with **zero network requests**. No fonts, analytics, or CDN assets. |
