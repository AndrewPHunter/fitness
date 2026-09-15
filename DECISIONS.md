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
- **Observed frequency event:** An exercise counts once on a calendar date if at least one set was
  logged for it that day. Multiple sets in the same workout do not inflate training frequency.
- **Import merge ordering:** Successful merges preserve current program/log order and append
  non-duplicate imported records in their exported order. Settings and the active-program pointer
  remain local because the specification defines identity de-duplication but not which document's
  preferences should win.
