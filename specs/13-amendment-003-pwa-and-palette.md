# 13 — Amendment 003: Installable PWA and Colour Scheme

| | |
|---|---|
| **Status** | Active |
| **Raised** | 2026-09-13, after iteration 3 |
| **Amends** | [01 §1.4](01-product-spec.md), [05 §5.4](05-persistence.md), [06 §6.2](06-ui-ux.md), [11 §11.4](11-amendment-001-program-authoring.md) |
| **Baseline preserved at** | `7789b62` — the specification as evaluated in iteration 3 |

Unlike Amendments 001 and 002, this one does not correct a defect. Both changes are requested
product work: the owner asked for the PWA, and judged the existing colour scheme unacceptable.

## 13.1 Part A — Installable PWA

### Why this is promoted to Core

[05 §5.4 Hazard A](05-persistence.md) is the most serious risk in the product: iOS can evict
`localStorage` for a site that has not been added to the home screen, and the stated usage pattern
— one phone, used at the gym, with layoffs between training blocks — sits directly inside that
window.

The mitigation shipped so far (HAZ-A2) is **a paragraph of prose asking the user to install the
app**. The actual mitigation is being installable. EXT-7 is therefore promoted from the Extended
tier to Core.

| ID | Capability |
|---|---|
| **CORE-16** | The app is installable to the home screen and runs fully offline from a cached shell, without ever silently serving a stale version |

**EXT-7 is removed from the Extended tier**, which drops from 30 to **26 bonus points**.

### Requirements

| ID | Requirement |
|---|---|
| PWA-1 | A web app manifest with `name`, `short_name`, `display: standalone`, `theme_color`, `background_color`, and maskable icons at 192 px and 512 px |
| PWA-2 | `start_url` and `scope` resolve correctly under the `/fitness/` base path ([09 §9.2](09-deployment.md)) |
| PWA-3 | Icons are committed assets. No icon, font or asset is fetched from a third party ([09 §9.5](09-deployment.md)) |
| PWA-4 | A service worker precaches the app shell — HTML, JS, CSS, fonts — and is scoped under the base path |
| PWA-5 | After one online load, the app is **fully functional offline**: every screen, validation, logging, history, export |
| PWA-6 | The service worker caches build assets only. It must not intercept, proxy or cache anything else, and must not interfere with export downloads |
| PWA-7 | `theme_color` matches the dark ground so the iOS status bar does not clash |

### PWA-8 — A stale shell must never masquerade as current

A precached shell can keep serving an old build after a deploy. An app that silently runs a
version the user did not install, while presenting itself as current, is dishonest about its own
state — [C1](00-constitution.md).

- A waiting service worker must be **detected** and surfaced as a visible, explicit
  "new version available" control.
- Updating requires a **user action**. `skipWaiting()` on install, or any automatic reload, is
  forbidden.
- An update must **never** be applied while a session is in progress
  ([02 §2.8](02-domain-model.md), `completedAt === null`). Swapping the running bundle mid-workout
  risks the logging path, which is the one path that must not break.
- The version indicator must reflect real registration state, never a hardcoded string.

### PWA-9 — Install guidance must be honest on iOS

iOS Safari does not implement `beforeinstallprompt`. Installation is manual: Share → Add to Home
Screen. iOS is the target platform.

- A one-tap install button may be rendered **only** where `beforeinstallprompt` actually fired.
- Where it did not, show the real manual instructions instead.
- **Rendering an install button that does nothing on the user's platform is a
  [C1](00-constitution.md) violation** and an automatic zero for Section L.
- Where the app detects it is already running installed (`display-mode: standalone`), it must stop
  telling the user to install it.
- Installation reduces eviction risk; it does not eliminate it. Copy must not claim otherwise, and
  must not present installation as a replacement for exporting (HAZ-A1).

## 13.2 Part B — Colour scheme (VIS-6)

The existing scheme — near-black with moss green and safety orange — is rejected by the owner.
[Amendment 001 §11.4](11-amendment-001-program-authoring.md) anticipated this slot as VIS-6.

**Direction: deep slate, dark-first.** A blue-grey ground rather than black, soft off-white text,
and a single cool accent. Light mode remains fully supported; the `system` / `light` / `dark`
setting is unchanged.

### The palette

Every value below was measured before being written here. Ratios are stated so they can be
re-checked rather than trusted.

**Dark (default)**

| Token | Value | Contrast |
|---|---|---|
| `--bg` | `#14181F` | ground |
| `--surface` | `#1C222B` | raised |
| `--text` | `#E8ECF1` | 15.00:1 on bg · 13.48:1 on surface |
| `--muted` | `#98A2B0` | 6.89:1 · 6.19:1 |
| `--accent` | `#4C9AFF` | 6.25:1 · 5.62:1 |
| `--border-subtle` | `#2A323D` | decorative dividers only — no contrast requirement |
| `--border-strong` | `#6B7686` | 3.86:1 · 3.47:1 — controls and input boundaries |
| `--danger` | `#F97066` | 6.41:1 · 5.74:1 |
| `--success` | `#75E0A7` | 11.00:1 · 9.88:1 |

**Light**

| Token | Value | Contrast |
|---|---|---|
| `--bg` | `#F7F9FC` | ground |
| `--surface` | `#FFFFFF` | raised |
| `--text` | `#12161C` | 17.21:1 on bg · 18.15:1 on surface |
| `--muted` | `#475467` | 7.29:1 · 7.69:1 |
| `--accent` | `#175CD3` | 5.68:1 on bg |
| `--border-strong` | `#667085` | 4.97:1 on surface |
| `--danger` | `#B42318` | 6.23:1 · 6.57:1 |
| `--success` | `#067647` | 5.40:1 on bg |

Two of these were corrected during measurement and the corrections are the point of stating
ratios: `#1F6FEB` was the intended light accent but measures **4.39:1**, failing AA for body text;
and a single `--border` token at `#2A323D` measures **1.37:1**, which is fine for a divider and
unusable for an input boundary — hence the subtle/strong split.

### Requirements

| ID | Requirement |
|---|---|
| VIS-6 | The palette above is implemented exactly, as tokens defined once in `ui/tokens/` |
| VIS-7 | The prior moss/orange values are removed. No component retains a hardcoded colour |
| VIS-8 | `--border-strong` is used wherever a border is the boundary of a control or input; `--border-subtle` only for decoration |
| VIS-9 | VIS-1..VIS-5 ([Amendment 001 §11.4](11-amendment-001-program-authoring.md)) continue to hold under the new palette — in particular VIS-3, state distinguishable **without relying on colour alone** |

### VIS-10 — Contrast is measured, not asserted

Every evaluation so far has recorded contrast as *"assessed by inspection, not measured"*. That
ends here, and it is why the palette above is stated with ratios.

- A committed, CI-run check asserts every foreground/background pairing in both schemes meets its
  minimum: **4.5:1** for text, **3:1** for control boundaries and meaningful non-text.
- The check reads the **token values themselves**, so drift fails the build.
- It is a real calculation over the tokens, not a snapshot or a hardcoded list of expected numbers
  ([C6](00-constitution.md)).

## 13.3 Acceptance criteria

### L. Installable PWA — 10 pts

| ID | Criterion | Pts |
|---|---|---|
| L1 | Valid manifest; `start_url` and `scope` correct under `/fitness/`; maskable 192/512 icons committed | 2 |
| L2 | Service worker registers and precaches the shell within scope | 2 |
| L3 | **Fully functional offline after one load** — verified with the network disabled | 2 |
| L4 | Waiting worker surfaced as an explicit user-actioned update; no `skipWaiting`, no auto-reload (PWA-8) | 2 |
| L5 | No update is applied while a session is in progress (PWA-8) | 1 |
| L6 | Install guidance honest per platform; no dead install button; installed state detected (PWA-9) | 1 |

**Automatic zero for Section L if an install button is rendered where `beforeinstallprompt` cannot
fire.**

### M. Colour scheme — 6 pts

| ID | Criterion | Pts |
|---|---|---|
| M1 | Palette implemented exactly, tokenised once, old values gone | 2 |
| M2 | Committed contrast check computing real ratios from the tokens, run in CI (VIS-10) | 2 |
| M3 | `--border-strong` vs `--border-subtle` used correctly (VIS-8) | 1 |
| M4 | VIS-1..VIS-5 still hold, VIS-3 especially | 1 |

### Gates

| ID | Gate | How verified |
|---|---|---|
| G10 | The app loads, is installable, and works **fully offline** after one online load | Load, disable the network, reload, then log a set and read history |
| G11 | A deployed update is surfaced explicitly and never applied silently | Deploy a change, reopen the installed app, confirm an explicit update control rather than a silent swap |

### Revised totals

Core becomes **134 points**. Extended drops to **26** (EXT-7 promoted out). Bands remain
percentages of the applicable Core total, per
[Amendment 002 §12.6](12-amendment-002-paste-import.md).

## 13.4 Out of scope

Push notifications, background sync, badging, and any other service-worker capability beyond the
offline shell and its update path. None are needed by this product, and each adds a permission
surface and a failure mode that would have to be explained honestly.

## 13.5 Effect on recorded evaluations

None. Rounds 1 to 3 were graded against earlier baselines and are not rescored. The Extended tier
changing from 30 to 26 does not affect them: all three scored 0 there.
