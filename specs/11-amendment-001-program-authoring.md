# 11 — Amendment 001: In-App Program Authoring

| | |
|---|---|
| **Status** | Active |
| **Raised** | 2026-09-10, after the first evaluation run |
| **Amends** | [01 §1.4](01-product-spec.md), [06 §6.3](06-ui-ux.md) |
| **Baseline preserved at** | `a7bd40c` — the specification as evaluated |

## 11.1 The defect

The original specification is defective, and the defect is mine rather than any
implementation's.

[01 §1.2](01-product-spec.md) states that the program is "authored externally by an LLM". I
concluded from this that the application needed no involvement in authoring, and specified
`#/programs` as, in full, *"Upload control accepting a `.json` file."* The authoring prompt pack
was placed in [`fixtures/authoring-prompt.md`](../fixtures/authoring-prompt.md) — a markdown file
in a GitHub repository.

The resulting user journey, for someone standing in a gym holding a phone, is:

> open GitHub → navigate to `fixtures/authoring-prompt.md` → copy 200 lines of markdown →
> paste into an LLM → save the reply → return to the app → upload

That is not a usable path, and nothing in the specification required a better one. The first
implementation scored 99/100 while being, in the owner's words, impossible to generate a program
with. **A specification that can be satisfied completely while leaving the product unusable for
its stated purpose is a defective specification.**

## 11.2 What changes

One new Core capability.

| ID | Capability |
|---|---|
| **CORE-14** | An in-app authoring screen that hands the user everything needed to have an LLM write a program, without leaving the app |

The external-authoring decision itself is unchanged. The app still generates nothing, calls no
API, and makes no network request ([09 §9.5](09-deployment.md)). It hands over text and files;
the user takes them to whatever LLM they like.

## 11.3 The authoring screen — `#/author`

Reachable from the primary navigation and from an explicit link on `#/programs`, adjacent to the
upload control. Someone who arrives intending to upload and realises they have nothing to upload
must find it there.

| ID | Requirement |
|---|---|
| AUT-1 | **Copy the authoring prompt to the clipboard** in one action. This is the primary action on the screen and must be reachable without scrolling. |
| AUT-2 | The copied text is the complete prompt pack — sufficient on its own, with no instruction to fetch anything else. |
| AUT-3 | **Download `program.schema.json`** as a file. |
| AUT-4 | **Download a worked example program** as a file. |
| AUT-5 | Display the canonical `exerciseId` list, and make it copyable. |
| AUT-6 | All content is **bundled at build time** from `fixtures/`. No runtime fetch, no duplicated copy that can drift from the source of truth. |
| AUT-7 | Brief plain-language instructions: copy this, paste into an LLM, describe your program, save the reply as `.json`, upload it on `#/programs`. |

### AUT-8 — Personalise the prompt with the user's own exercise IDs

This is the substantive requirement, not a convenience.

[02 §2.2](02-domain-model.md) identifies `exerciseId` drift as the highest-risk failure in the
data model: if an LLM writes `bench-press` in one program and `barbell-bench-press` in the next,
the user's history silently splits and they are never told. The mitigation I originally specified
was a line in the prompt pack asking the LLM to *"ask for their existing `exerciseId`s"* — which
puts the burden on the user to remember and retype them.

**The application already knows them.** It maintains a local exercise index built from every
program ever uploaded ([02 §2.2](02-domain-model.md)).

Therefore the copied prompt must have the user's **actual existing `exerciseId`s injected into
it**, under a heading that instructs the LLM to reuse them in preference to inventing new ones.

- The injected list is drawn from the local index at the moment of copying.
- Where the index is empty — genuine first run — the section is omitted rather than emitted
  empty, and the canonical list stands alone.
- The screen shows the user what will be injected before they copy it. No hidden payload.

This turns a static instruction the user must act on into a fact the app supplies, and it closes
the drift risk properly.

### AUT-9 — Clipboard failure must be honest

`navigator.clipboard.writeText` requires a secure context and a user gesture, and it can be
denied outright. iOS Safari is the specific concern, and it is the target platform.

- A failed copy shows a **visible failure**, never a success confirmation
  ([C1](00-constitution.md)).
- A fallback is always available: the full prompt text in a selectable, scrollable region the
  user can select and copy by hand.
- The fallback is present regardless of whether the clipboard API is available — never revealed
  only after a failure.
- A "Copied" confirmation appears only after the write actually resolves.

## 11.4 Visual direction

The original specification stated UI constraints ([06 §6.2](06-ui-ux.md)) but declared no visual
direction, and [06 §6.5](06-ui-ux.md) explicitly disclaimed personality as a requirement. Any
coherent aesthetic therefore satisfied it. That was intentional for an evaluation and is
unsuitable for a product the owner uses.

An implementation must **declare its visual direction in `DECISIONS.md`** and satisfy these
constraints, which derive from the mid-workout context and are checkable:

| ID | Requirement |
|---|---|
| VIS-1 | Prescribed and actual values are distinguishable at arm's length, at a glance, without reading labels |
| VIS-2 | The value being entered is the largest text on screen during logging |
| VIS-3 | Confirmed, unconfirmed and failed states are distinguishable **without relying on colour alone** |
| VIS-4 | Legible in bright ambient light — sustained low-contrast body text is not acceptable |
| VIS-5 | No decorative element occupies space that the logging controls could use |

Aesthetic choice beyond these constraints remains the implementer's, deliberately: the owner has
not specified a preferred look, and inventing one here would be guessing. If a specific direction
is wanted later, it belongs in this section as VIS-6.

## 11.5 Acceptance criteria — Section J

For evaluations run against the amended specification, add:

### J. Program authoring — 10 pts

| ID | Criterion | Pts |
|---|---|---|
| J1 | `#/author` exists, is in primary navigation, and is linked from `#/programs` | 1 |
| J2 | One-action copy of the complete prompt to clipboard | 2 |
| J3 | Schema and worked example both downloadable as files | 2 |
| J4 | Prompt content bundled from `fixtures/` at build time, not duplicated or fetched | 1 |
| J5 | The user's existing `exerciseId`s are injected into the copied prompt (AUT-8) | 2 |
| J6 | The injected list is shown before copying | 1 |
| J7 | Clipboard failure surfaces visibly, with an always-present selectable fallback (AUT-9) | 1 |

### Revised totals

Core becomes **110 points**. Because two totals now exist, the bands in
[10 §10.6](10-acceptance-criteria.md) are restated as percentages of the applicable Core total:

| Band | Core % |
|---|---|
| Fail | Any gate failed, or < 50% |
| Partial | 50–69% |
| Pass | 70–84% |
| Strong | 85–99% |
| Exceptional | 100%, plus meaningful Extended work, with no deductions |

The Extended tier (30 bonus points) and the deduction table are unchanged.

### Gate G8

| ID | Gate | How verified |
|---|---|---|
| G8 | A program can be authored and uploaded without leaving the app or visiting the repository | From `#/author`, copy the prompt, paste into any LLM, save the reply, upload it. It must validate. |

G8 is the whole point of this amendment. An implementation that satisfies every criterion in
Section J but fails G8 has missed it.

## 11.6 Effect on the recorded evaluation

None. The evaluation recorded in [`evaluation/`](../evaluation/) was run against `a7bd40c` and is
scored against the original rubric. This amendment is dated after it and does not apply
retroactively — the implementation under test could not have been expected to satisfy a
requirement that did not exist.
