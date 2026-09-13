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
- **Leaving a partial session:** The data model has no abandoned status and logged sets may not be
  deleted as a side effect. “Leave session” therefore keeps the session in progress and returns to
  Today, where it can be resumed. This preserves every confirmed set without falsely marking the
  workout complete or advancing the rotation.
- **Observed frequency event:** An exercise counts once on a calendar date if at least one set was
  logged for it that day. Multiple sets in the same workout do not inflate training frequency.
- **Import merge ordering:** Successful merges preserve current program/log order and append
  non-duplicate imported records in their exported order. Settings and the active-program pointer
  remain local because the specification defines identity de-duplication but not which document's
  preferences should win.
