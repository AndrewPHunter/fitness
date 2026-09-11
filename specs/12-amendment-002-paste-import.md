# 12 — Amendment 002: Paste-to-Import

| | |
|---|---|
| **Status** | Active |
| **Raised** | 2026-09-10, after iteration 2 |
| **Amends** | [01 §1.4](01-product-spec.md), [06 §6.3](06-ui-ux.md), [10 §10.6](10-acceptance-criteria.md) |
| **Baseline preserved at** | `1d58f54` — the specification as evaluated in iteration 2 |

## 12.1 The defect

[CORE-1](01-product-spec.md) requires the app to *"Upload and strictly validate a program JSON
**file**"*, and [06 §6.3](06-ui-ux.md) specifies *"Upload control accepting a `.json` file."* Both
implementations built exactly that, correctly.

On a phone, the resulting journey after an LLM replies with JSON is:

> long-press the reply → copy → open Files → create a document → rename it to `.json` → return to
> Safari → open the file picker → select it

Between sets. The JSON was already on the clipboard at step two.

**This is the third instance of the same defect.** Amendment 001 fixed the prompt living only in a
GitHub repository, and the absent schema download. This fixes the return path. In each case the
specification described a workflow that works at a desk with a repository checked out, and does
not work on the device the product is actually used on. That is a pattern in how the
specification was written, not three separate oversights.

The domain layer is already prepared: `validateProgramText(text: string)` has existed since round
one. Only the affordance is missing.

## 12.2 What changes

| ID | Capability |
|---|---|
| **CORE-15** | A program can be imported by pasting its JSON directly, with no file ever written to the device |

File upload is **retained**, demoted to a secondary affordance. It remains the natural path for
re-importing a downloaded worked example, for desktop use, and for restoring an exported backup.
Removing it would trade one gap for another.

## 12.3 Requirements

| ID | Requirement |
|---|---|
| PAS-1 | `#/programs` presents a paste field as the **primary** import affordance, before the file picker in both reading order and visual weight |
| PAS-2 | File upload remains available and fully functional, presented as secondary |
| PAS-3 | Pasted text is validated through the **identical** path as an uploaded file — the same `validateProgramText`, the same `ValidationError` list, the same import preview, the same new-vs-known exercise ID report |
| PAS-4 | Leading and trailing whitespace is trimmed before parsing. This is the only normalisation permitted |
| PAS-6 | An empty or whitespace-only submission produces a clear message and does not run validation |
| PAS-7 | **The pasted text is never cleared on validation failure.** The user must be able to read the errors and correct the text in place |
| PAS-8 | The authoring kit's handoff steps ([Amendment 001](11-amendment-001-program-authoring.md) AUT-7) are rewritten so the primary route is copy → paste. The instruction to save the reply as a file must not remain as the default path |
| PAS-9 | `#/author` links directly to the paste field |

### PAS-5 — Code fences are surfaced, never silently stripped

LLMs frequently wrap JSON in a ```` ```json ```` fence despite being told not to. The tempting fix
is to strip fences automatically. **That is forbidden** — it is precisely the silent coercion of
invalid input that [C2](00-constitution.md) prohibits, and it would establish that the app quietly
repairs input, which is the beginning of not being able to trust any of its validation.

Required behaviour instead:

- A fenced block is **detected** and reported as a specific, actionable error naming the problem —
  not a generic parse failure.
- Alongside it, an explicit user-pressed action (e.g. "Remove code fences") edits the **visible**
  text in the field.
- The user sees the text change before anything is validated or stored.

This is a user-initiated edit of their own input, not the application deciding what they meant.

### PAS-10 — No clipboard read

The app must **not** call `navigator.clipboard.readText()` or offer a "paste from clipboard"
button.

Reading the clipboard triggers a permission prompt on iOS every time, can fail silently outside a
user gesture, and would require a second failure path to be designed and honestly reported. A
plain paste field has none of those properties: the user's own paste gesture is already the most
reliable mechanism available, and it cannot fail in a way the app must explain.

## 12.4 Out of scope

Backup restore on `#/data` ([07 §7.3](07-export-import.md)) stays **file-based**. An exported
backup is a file the user deliberately downloaded, is potentially megabytes, and is not something
an LLM hands back in a chat window. Pasting is the right affordance for authored programs
specifically.

## 12.5 Acceptance criteria — Section K

### K. Paste-to-import — 8 pts

| ID | Criterion | Pts |
|---|---|---|
| K1 | Paste field present on `#/programs`, primary in both order and visual weight | 1 |
| K2 | File upload retained and still functional | 1 |
| K3 | Pasted input produces identical validation output to the same JSON uploaded as a file — verified with both invalid fixtures | 2 |
| K4 | Pasted text survives a validation failure (PAS-7) | 1 |
| K5 | Fenced input is reported specifically, with an explicit user-pressed fence removal that edits visible text (PAS-5) | 2 |
| K6 | Authoring kit handoff steps rewritten to copy → paste (PAS-8) | 1 |

**Automatic zero for Section K, plus the [C2 deduction](10-acceptance-criteria.md), if code fences
are stripped silently.**

### Gate G9

| ID | Gate | How verified |
|---|---|---|
| G9 | A program can be authored and imported **without any file being written to the device** | From `#/author`, copy the prompt, obtain JSON from an LLM, paste it on `#/programs`, import it. No download, no Files app, no picker. |

## 12.6 Rubric repair — band table

[10 §10.6](10-acceptance-criteria.md) as amended by
[Amendment 001 §11.5](11-amendment-001-program-authoring.md) defines **Strong** as 85–99% and
**Exceptional** as *"100%, plus meaningful Extended work"*. A perfect Core score with no Extended
work therefore falls in a gap with no band, which is where iteration 2 landed.

This is a defect in the rubric. Repaired:

| Band | Condition |
|---|---|
| Fail | Any gate failed, or Core < 50% |
| Partial | Core 50–69% |
| Pass | Core 70–84% |
| Strong | Core 85–99% |
| **Complete** | Core 100%, no deductions |
| Exceptional | Core 100%, no deductions, **and** meaningful Extended work |

This renames a previously unlabelled outcome. **No recorded score changes.** Iteration 2's
110/110 is relabelled from "Core ceiling" to **Complete**; its points are untouched.

### Revised totals

Core becomes **118 points**. Bands remain percentages of the applicable Core total, so results
across different totals stay comparable. The Extended tier (30 bonus) and the deduction table are
unchanged.

## 12.7 Effect on recorded evaluations

None. Rounds 1 and 2 were graded against baselines predating this amendment and are not
retroactively rescored. The band relabelling in §12.6 changes a name, not a number.
