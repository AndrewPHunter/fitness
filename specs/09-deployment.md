# 09 — Deployment

## 9.1 Target

| | |
|---|---|
| Host | GitHub Pages |
| Repository | `AndrewPHunter/fitness` — **public** |
| Pages type | Project page |
| Public URL | `https://andrewphunter.github.io/fitness/` |
| Source | GitHub Actions (**not** a `gh-pages` branch) |

## 9.2 Base path

Because this is a project page, the site is served from `/fitness/`, not from the domain root.

| ID | Requirement |
|---|---|
| DEP-1 | The build sets `base: '/fitness/'` |
| DEP-2 | No asset, style, script, icon, or manifest reference is absolute-from-root (`/assets/…`). All must resolve under the base path |
| DEP-3 | The built site works when served from a subdirectory. Verified by serving `dist/` under `/fitness/` locally, not by assumption |
| DEP-4 | The base path is defined in exactly one place and referenced from there |

DEP-2 is the single most common failure mode for React apps on GitHub Pages project pages: the
app works perfectly on `localhost:5173` and renders a blank white page on Pages, because every
asset 404s. **A deployed site that renders blank fails the evaluation outright**, regardless of
code quality.

## 9.3 Routing

Hash-based routing is required ([04 §4.7](04-architecture.md)).

GitHub Pages serves static files with no rewrite capability. With browser-history routing, a
direct load of `https://andrewphunter.github.io/fitness/history` returns GitHub's 404 page,
because no such file exists. The usual workaround — a `404.html` that redirects into the app —
is a hack that produces a visible flash and a polluted history stack.

Hash routing avoids the problem entirely: everything after `#` is never sent to the server.

| ID | Requirement |
|---|---|
| DEP-5 | All routes are hash-based |
| DEP-6 | A direct load of any deep link resolves correctly on the deployed site |
| DEP-7 | Browser back and forward behave correctly across in-app navigation |

## 9.4 Workflow

| ID | Requirement |
|---|---|
| DEP-8 | Deployment uses `actions/upload-pages-artifact` and `actions/deploy-pages` |
| DEP-9 | Permissions are least-privilege: `contents: read`, `pages: write`, `id-token: write` |
| DEP-10 | Deployment triggers only on the default branch |
| DEP-11 | Deployment runs only after the full check suite passes (CI-11) |
| DEP-12 | Concurrency is configured so overlapping deployments cannot race |
| DEP-13 | A `.nojekyll` file is present in the published output |

DEP-13 matters: without it, Jekyll processing strips files and directories beginning with an
underscore, which silently breaks some bundler output.

## 9.5 Runtime constraints

| ID | Requirement |
|---|---|
| DEP-14 | Zero network requests at runtime. No CDN, no web fonts, no analytics, no telemetry, no error reporting |
| DEP-15 | The app functions fully with the device offline, once loaded |
| DEP-16 | No secrets, tokens, or API keys anywhere in the repository or the built output |

DEP-14 is verifiable and will be verified: load the deployed site, open the network panel,
reload, and confirm that nothing beyond the app's own same-origin assets is requested.

DEP-15 is why an in-app LLM integration was ruled out ([01 §1.5](01-product-spec.md)). Program
authoring happens outside the app; the app only ever reads a file from disk.

## 9.6 Repository hygiene

| ID | Requirement |
|---|---|
| DEP-17 | `README.md` states the live URL and how to run, test and build locally |
| DEP-18 | Lockfile committed; `node_modules/` and `dist/` ignored |
| DEP-19 | The specification documents in `specs/` and the fixtures in `fixtures/` are retained unmodified |

DEP-19 is a requirement of the evaluation, not of the product. The specification is the control
artifact. An implementation that edits the spec to match what it built has invalidated the test.
