# Fieldwork Fitness Tracker

Fieldwork is a private, static strength-program tracker built for one-handed use during training.
It validates externally authored JSON programs, logs actual weight/reps/RPE to browser
`localStorage`, keeps history bound to exact program versions, and exports lossless backups.

Live app: <https://andrewphunter.github.io/fitness/>

## This repository serves two purposes

**1. The product.** The app above, used personally during training. Source in `src/`.

**2. A one-shot evaluation harness.** `specs/` and `fixtures/` are a self-contained,
objectively gradeable specification, written as a control artifact for testing how well a
coding agent can implement a demanding brief in a single pass. Results live in
[`evaluation/`](evaluation/).

The two purposes pull in different directions and that is managed deliberately:

- The spec baseline each evaluation ran against is pinned by commit in its record.
- Changes made _after_ an evaluation are additive amendments
  ([`specs/11-amendment-001-program-authoring.md`](specs/11-amendment-001-program-authoring.md)),
  never retroactive edits, so past results stay attributable.
- Product improvements the specs never asked for are fine — they simply score nothing.

|                          |                                                                                |
| ------------------------ | ------------------------------------------------------------------------------ |
| Specification            | [`specs/`](specs/) — start at [`00-constitution.md`](specs/00-constitution.md) |
| Fixtures & schema        | [`fixtures/`](fixtures/)                                                       |
| Evaluation results       | [`evaluation/`](evaluation/)                                                   |
| Implementation decisions | [`DECISIONS.md`](DECISIONS.md)                                                 |

### Results so far

| Date       | Model       | Baseline  | Gates | Core   | Ext  | Final  | Band   |
| ---------- | ----------- | --------- | ----- | ------ | ---- | ------ | ------ |
| 2026-09-10 | GPT-6 Astra | `a7bd40c` | 7/7   | 99/100 | 0/30 | **99** | Strong |

## Local development

Requires Node 22.19.0.

```sh
npm ci
npm run dev
```

## Verification

```sh
npm run typecheck
npm run lint
npm run format
npm run test:utc
npm run test:phoenix
npm run build
npx playwright install chromium
npm run test:e2e
```

The production build uses the GitHub Pages project base `/fitness/` and hash routes, so deep links
work without server rewrites. The app makes no runtime requests beyond its own same-origin static
assets. There is no backend, account, analytics, CDN, or remote font request.

## Data safety

All data lives in the single versioned `fitness.v1.root` localStorage entry. Browser storage can be
evicted; use the in-app JSON export regularly. CSV export is for analysis and is not a restorable
backup.
