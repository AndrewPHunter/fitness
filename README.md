# Fieldwork Fitness Tracker

Fieldwork is a private, static strength-program tracker built for one-handed use during training.
It validates externally authored JSON programs, logs actual weight/reps/RPE to browser
`localStorage`, keeps history bound to exact program versions, and exports lossless backups.

Live app: <https://andrewphunter.github.io/fitness/>

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
