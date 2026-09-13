# Program Authoring Prompt Pack

Paste everything between the rulers into any capable LLM, followed by a description of the
program you want. It returns a `.json` file to upload at `#/programs`.

The app performs **no** program generation and makes **no** network requests
([09 §9.5](../specs/09-deployment.md)). Authoring happens entirely outside the application.

---

You are authoring a workout program as a single JSON document for a personal fitness tracker.

## What the format can and cannot express

The format is **descriptive**. It records structure — which exercises, in which order, how many
sets, how many reps. It contains **no logic**. The app does not evaluate, compute, or interpret
anything you write. If a rule cannot be expressed as a literal structure, do the reasoning
yourself now and write the result.

**The app cannot express, and you must not attempt:**

- AMRAP, "as many as possible", or "+" sets.
- Percentages of 1RM, training maxes, or any computed load.
- Progression rules, autoregulation, or "add 2.5kg when…".
- Deload logic conditional on performance.
- Time-based work: planks, carries, EMOM, holds. There is no duration field.
- Distance or cardio: running, rowing, cycling. There is no distance field.
- Drop sets, rest-pause, cluster sets, tempo prescription.
- Nested supersets.

If the user asks for any of these, say so plainly and offer the closest expressible structure.
Do not invent a field. **Unrecognised properties cause the whole file to be rejected.**

## Document structure

```jsonc
{
  "programId": "kebab-case-slug",     // required, stable across versions
  "version": 1,                        // required, integer >= 1
  "name": "Display Name",              // required
  "description": "Optional prose.",

  "exercises": [                       // required, >= 1. Declare EVERY exercise used.
    { "exerciseId": "barbell-back-squat", "name": "Back Squat", "notes": "optional" }
  ],

  "sessions": [                        // required, >= 1
    {
      "sessionId": "kebab-case-slug",  // required, unique in file
      "name": "Display Name",          // required
      "notes": "optional",
      "blocks": [                      // required, >= 1, in execution order
        {
          "type": "single",
          "entry": {
            "exerciseId": "barbell-back-squat",  // must be declared above
            "sets": 3,                            // integer 1-20
            "reps": 5,                            // integer 1-100
            "repsMax": 8,                         // optional; top of a rep range, must be > reps
            "targetWeight": { "value": 100, "unit": "kg" },  // optional; "kg" or "lb"
            "targetRpe": 8,                                   // optional; 1-10, 0.5 steps
            "restSeconds": 180,                               // optional; 0-600
            "notes": "optional"
          }
        },
        {
          "type": "superset",          // performed back-to-back before resting
          "entries": [                 // 2-8 entries, same shape as `entry`
            { "exerciseId": "chin-up", "sets": 3, "reps": 8 },
            { "exerciseId": "dip",     "sets": 3, "reps": 10 }
          ]
        }
      ]
    }
  ],

  "schedule": { },                     // required; one of the two forms below

  "frequencyTargets": [                // optional, display only
    { "exerciseId": "barbell-back-squat", "perWeek": 3 }
  ]
}
```

### Schedule form 1 — rotation

```json
{ "mode": "rotation", "sequence": ["session-a", "session-b", "session-a", "session-c"] }
```

An ordered list of `sessionId`s. The user does the next one whenever they train; it wraps
forever. **It is not tied to the calendar.** Repeating a `sessionId` is how frequency is
expressed. Use this when training cadence is "every other day", "4 times a week", or anything
that drifts.

### Schedule form 2 — weekdays

```json
{ "mode": "weekdays", "days": { "mon": "workout-a", "wed": "workout-b", "fri": "workout-a" } }
```

Sessions pinned to days. Omitted days are rest days. Use only when the user genuinely trains on
fixed weekdays.

## Expressing frequency — the important part

The app performs **no scheduling arithmetic**. If the user says *"every other day, but I need to
squat 3× a week and deadlift once"*, **you** do that arithmetic and encode the answer in the
sequence.

For a rotation of `N` sessions trained every `C` days, one full cycle spans `N × C` days. To hit
an exercise `f` times per week, it must appear in:

```
occurrences = round( f × N × C / 7 )
```

of those `N` sessions.

**Worked example.** Every other day (`C = 2`), rotation of `N = 7` sessions → one cycle spans
14 days.

- Squat at 3×/week → `3 × 14 / 7` = **6** of the 7 sessions
- Deadlift at 1×/week → `1 × 14 / 7` = **2** of the 7 sessions

So build 7 sequence entries where squat appears in 6 and deadlift in 2. Spread the high-frequency
exercise evenly, and keep the heavy pull away from adjacent slots.

**Tell the user this is an average, not a guarantee.** A 14-day cycle against a 7-day week means
some weeks land 3 squats and some land 4. That is inherent and the app will show them the real
observed frequency.

Add `frequencyTargets` recording the intent. The app **displays** these next to what actually
happened. It never enforces them, never warns, and never corrects.

## `exerciseId` — read this carefully

`exerciseId` is how the app links history **across programs**. Its most valuable feature is
*"what did I lift for this last time?"*, and that lookup is by `exerciseId` alone.

**If you write `bench-press` in one program and `barbell-bench-press` in another, the user's
history silently splits in two and they will not be told.**

Rules:

1. Lowercase kebab-case only: `^[a-z0-9]+(-[a-z0-9]+)*$`. No spaces, capitals, or underscores.
2. Use the canonical id from the list below wherever one exists.
3. If the user has existing programs, **ask for their existing `exerciseId`s and reuse them.**
4. Only invent an id when nothing fits. Follow the pattern `[equipment-]movement[-variant]`.
5. `name` is display text and may differ freely. Identity lives in `exerciseId`.

### Canonical ids

```
barbell-back-squat      barbell-front-squat     goblet-squat         hack-squat
barbell-deadlift        sumo-deadlift           romanian-deadlift    trap-bar-deadlift
leg-press               leg-extension           leg-curl             calf-raise
barbell-bench-press     incline-barbell-press   dumbbell-bench-press incline-dumbbell-press
barbell-overhead-press  dumbbell-shoulder-press push-press           lateral-raise
dip                     close-grip-bench-press  triceps-pushdown     skull-crusher
chin-up                 pull-up                 lat-pulldown         barbell-row
dumbbell-row            cable-row               face-pull            rear-delt-fly
ez-bar-curl             dumbbell-curl           hammer-curl          preacher-curl
hip-thrust              back-extension          shrug
```

## Rep ranges and per-set prescription

Two optional ways to describe a set more faithfully. Both are descriptive. The app still computes
nothing — it displays what you write and records what the user actually did.

### Rep ranges — `repsMax`

Add `repsMax` beside `reps` to express a range. `reps` is the floor, `repsMax` the ceiling.

```json
{ "exerciseId": "barbell-bench-press", "sets": 3, "reps": 8, "repsMax": 12, "targetRpe": 8 }
```

`repsMax` must be **strictly greater** than `reps`. `reps: 8, repsMax: 8` is rejected — that is a
range that is not a range. Omit `repsMax` for a fixed target.

The app will **not** tell the user they hit the top of the range, will not suggest adding load,
and will not flag anything. It shows `8-12`, records what they did, and stays silent. Deciding
when to add weight is the user's job.

### Per-set prescription — array form of `sets`

When sets differ from one another, `sets` may be an **array** instead of a count. Each element
prescribes one set, in order.

```json
{
  "exerciseId": "barbell-back-squat",
  "sets": [
    { "reps": 5, "targetRpe": 9.5, "targetWeight": { "value": 140, "unit": "kg" }, "restSeconds": 300 },
    { "reps": 6, "targetRpe": 8,   "targetWeight": { "value": 120, "unit": "kg" }, "restSeconds": 180 },
    { "reps": 6, "targetRpe": 8,   "targetWeight": { "value": 120, "unit": "kg" }, "restSeconds": 180 }
  ]
}
```

That is one top set near failure followed by two back-off sets — which a single `targetRpe`
cannot express.

Element fields: `reps` required; `repsMax`, `targetWeight`, `targetRpe`, `restSeconds`, `notes`
optional. Array length 1-20.

**When `sets` is an array, the entry must not also carry `reps`, `repsMax`, `targetWeight`,
`targetRpe` or `restSeconds`.** Those belong in the elements. Two sources of truth for one set is
rejected. An entry-level `notes` is still allowed, since it describes the exercise rather than a
set.

Use the array only when sets genuinely differ. For three identical sets, `"sets": 3, "reps": 5` is
clearer.

Both forms work inside a `superset` exactly as they do in a `single` block.

## Output rules

1. Output **only** the JSON document. No markdown fences, no commentary, no explanation
   before or after. The user saves your output directly as a `.json` file.
2. No comments in the JSON. `//` and `/* */` are invalid JSON and the file will be rejected.
3. No trailing commas.

## Self-check before output

Run every check. Any failure means the app rejects the entire file.

- [ ] Every `exerciseId` used in a session is declared in `exercises`
- [ ] Every `exerciseId` in `frequencyTargets` is declared in `exercises`
- [ ] No duplicate `exerciseId` in `exercises`
- [ ] No duplicate `sessionId` in `sessions`
- [ ] **Every declared exercise is used by at least one session** — unused exercises are rejected
- [ ] **Every declared session appears in the schedule** — unreachable sessions are rejected
- [ ] Every `sessionId` in `schedule.sequence` (or `schedule.days`) is a declared session
- [ ] Every `reps` is a single integer, never a string and never `"8-12"`
- [ ] Every `repsMax`, where present, is strictly greater than its `reps`
- [ ] Where `sets` is an array, the entry carries no `reps`/`repsMax`/`targetWeight`/`targetRpe`/`restSeconds`
- [ ] Every `sets` array has 1-20 elements, each with a `reps`
- [ ] Every scalar `sets` is 1-20; every `reps` and `repsMax` is 1-100
- [ ] Every `targetRpe` is 1-10 in 0.5 steps
- [ ] Every superset has 2-8 entries and contains no nested blocks
- [ ] Every `slug` field matches `^[a-z0-9]+(-[a-z0-9]+)*$`
- [ ] No property appears that is not in the structure above
- [ ] The document is valid JSON with no comments and no trailing commas

The last two are the most common failures. Do not add a helpful-looking field such as
`muscleGroup`, `tempo`, `equipment`, `week`, or `phase`. Every one of those causes rejection.

---

## Reference programs

If the user supplied schema or example files alongside this prompt, follow them. If not, this
prompt is complete on its own — everything needed to produce a valid program is above.
