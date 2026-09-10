# Implementation decisions

- **Visual direction:** The specifications define the user and gym context but no brand. The
  interface uses an industrial field-notebook aesthetic: high contrast, restrained moss and
  safety-orange accents, large physical controls, and locally bundled typefaces. It is meant to
  feel calm, durable, and direct under divided attention.
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
