# Implementation decisions

- **Visual direction — deep-slate instrument panel:** Fieldwork is dark-first, calm, durable, and
  direct under divided attention. The specified blue-grey ground, off-white text, and single cool
  accent replace the former moss and safety-orange palette. During logging, compact accent-tinted
  prescription strips remain reference while oversized actual-value inputs command the screen.
  Dashed input borders plus a hollow-circle “Not saved” marker identify unconfirmed data;
  checkmarked “Saved” rows and exclamation-mark failure panels distinguish outcomes without colour.
  Decoration stays outside active logging controls. Amendment 003 does not state a light
  `--border-subtle`; `#D0D5DD` is used as the passive-divider counterpart to its specified
  `#667085` strong boundary.
- **Visible feedback placement:** Amendment 005 permits adjacent, transformed, or pinned
  confirmations but does not select one for actions that also navigate. Stored-action outcomes use
  one pinned confirmation above the bottom navigation so the same pattern remains perceivable
  before and after an action-driven route change. A later unrelated route change clears it; a newer
  action replaces it.
- **Skipping an exercise resolves only that workout's remaining sets:** A skip is stored against
  the exercise entry's block and entry position in the active session, so repeated exercise IDs
  remain distinct. Any sets already logged for that entry stay sacred. Skipping makes the
  remaining sets eligible for session completion, and **Include again** restores them before the
  workout is completed.
- **Authored order is the default, not a lock:** With no user selection, logging follows the
  program's block order and superset round-robin order. Choosing an exercise temporarily selects
  its next unlogged set; after that exercise is finished, the default order resumes. This keeps
  authored structure visible while allowing the user to work around equipment and availability.
- **Saved routine order is a per-version, per-day preference:** Reordering a workout saves a block
  order for that exact program version and session, so it survives reloads and applies the next
  time that workout day starts without mutating the imported program. Supersets move as one block
  and retain round-robin logging; jumping to an individual exercise remains temporary and does not
  rewrite the saved order.
- **Observed frequency event:** An exercise counts once on a calendar date if at least one set was
  logged for it that day. Multiple sets in the same workout do not inflate training frequency.
- **Import merge ordering:** Successful merges preserve current program/log order and append
  non-duplicate imported records in their exported order. Settings and the active-program pointer
  remain local because the specification defines identity de-duplication but not which document's
  preferences should win.
