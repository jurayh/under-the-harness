# Style guide — Under the Harness

The bar: cool, clear, unique, helpful. One obvious next action per
screen, identity tied to the core mechanic, everything else cut.
These rules are what the chapter READMEs already do informally and
what `notebooks/01-agent-loop.ipynb` establishes for notebooks.
A future chapter, in any format, follows them all.

## Voice

- Warm and plainspoken. Write like a person who has run this code,
  not like documentation generated from it.
- Warm, not cute: the café is a real business with real stakes;
  concepts keep their real names.
- Errors are the lesson, never the learner's fault. Starters fail
  *instructively*; say what the failure teaches, not what the
  learner did wrong.
- Encourage by being specific ("your loop stopped at exactly 3"),
  never by being chirpy. No exclamation-mark pep, no emoji spam.

## The callout system (identical everywhere, every time)

Five callouts. Each is a blockquote whose first line is the bold
label alone, followed by the callout text:

```
> **PRINCIPLE**
> A loop is a budget, not a while-true.
```

- **PRINCIPLE** — the chapter's one portable sentence. Stated up
  front, before any code. If the learner forgets the code, this is
  what they keep.
- **PREDICT** — a question the learner answers *before* running the
  thing that would reveal it. Prediction checks print friendly
  feedback and never raise.
- **SABOTAGE** — a deliberate breakage, labelled as deliberate,
  with any demo-only safety device named as demo-only.
- **CHECKPOINT** — the chapter's real tests. A pass is printed by
  the tests, never asserted by prose.
- **IN THE WILD** / **SPOT IT** — the real-world mapping and the
  observation exercise. In-the-wild claims carry a product, a doc
  link, a date checked, and a label: documented, inferred, or not
  documented. Never present a guess as a vendor fact.

No other callouts. If a new one seems needed, it replaces one of
these, it does not join them.

## The trace is the visual identity

- Runs are shown as numbered traces, printed by one helper in one
  format everywhere:

  ```
  step 1 · model → tool_call echo(text='1')
  step 1 · tool  → 'echo:1'
  step 2 · model → final 'both'
  status completed · steps 3
  ```

- Budgets are always visible: a trace ends with its status and the
  steps it actually spent. Never show a run without its cost.
- Examples use the same small cast of tools (`echo`, then the
  chapter's own tools) so traces stay comparable across chapters.

## Cell and section rhythm (notebooks; READMEs map 1:1)

1. Title + PRINCIPLE. 2. Setup (imports only). 3. The failure,
   shown running. 4. PREDICT, then the build in small increments —
   one new behaviour per code cell, each followed immediately by a
   tiny demo that proves it. 5. SABOTAGE. 6. CHECKPOINT. 7. IN THE
   WILD, then SPOT IT. 8. Solution folded in a `<details>` block,
   after the checkpoint. 9. A final self-check cell that re-asserts
   the invariants, so out-of-order execution cannot fake a pass.
- One idea per cell. Markdown cells stay under ~12 lines of prose;
  code cells under ~20 lines (setup and the self-check may run
  slightly over; nothing else may).
- Every cell must make the next action obvious. If a learner could
  ask "what do I do here?", the cell is not finished.

## Time, stages, hints, recall (notebooks)

- Every title cell carries a time line after the Thread
  paragraph: `**Time:** about N minutes · 4 stages`. N is
  computed, not guessed: prose words ÷ 200 wpm (technical
  reading) + 0.075 min per non-blank code line + 0.5 min per
  code cell (run it, read the output) + a stage overhead
  (2 min for the predict and checkpoint stages, 1 min
  otherwise), rounded per stage. If a notebook's size changes
  materially, recompute; never copy another chapter's number.
- The four stages get a plain marker line at the top of the
  stage's first markdown cell — `Stage 2 of 4 — Build the
  layer · ~9 min` — never a new callout. The stages are the
  rhythm, named by what the learner does: (1) failure +
  predict, (2) build, (3) sabotage + checkpoint, (4) in the
  wild + spot it + wrap-up.
- Solutions are the third step of a ladder, never the first.
  Immediately before the folded solution sit two folded
  hints: Hint 1, a nudge (the key idea in a sentence or two,
  no code), then Hint 2, the shape of it (the solution's
  skeleton — function names and their order, bodies elided).
  Hints are chapter-specific and checked against the chapter's
  actual solution code, never generic encouragement.
- Notebooks 1–11 carry one Recall prompt just before the
  sabotage section: a bold `**Recall:**` line asking one
  concrete question whose answer lives in an earlier chapter
  (named), with the answer folded in a `<details>` block right
  there. Checkable questions only — never "what did you learn?"
  Chapter 0 has no earlier chapter; it carries the whole-game
  list below instead.

## Passport, ladder, graduation, inspector (notebooks)

- **Whole game.** Chapter 0 opens, before its stage 1, with
  the finished agent running in miniature on the fake model,
  followed by a "What you can't explain yet" list whose every
  item names the chapter that answers it.
- **Ladder line.** Every title cell carries a one-line ladder
  under the time line: earlier rungs ✓, the current rung ▶,
  later rungs plain. It is the value ladder from
  `notebooks/README.md`, compressed to fit a title cell.
- **Passport.** The last cell of every notebook stamps the
  chapter into the learner's own `my-progress.md`, via
  `shared/passport.py`: chapter, principle, date. Idempotent,
  and it never raises. The card is learner property —
  git-ignored, never committed.
- **Graduation.** Notebooks 7 and 11 carry, after the stages
  and before the passport, an optional real-model run of the
  chapter's own task through the same harness. With no API
  key in the environment it prints a skip line and does
  nothing; the no-key path never raises.
- **Trace inspector.** Notebooks 7 and 11 define a tiny
  `step(n)` stepper over the trace the notebook already
  built — one step at a time, no new machinery.
- **Failure translation.** A checkpoint that fails prints,
  after the test output, a "What this usually means:" block:
  two to four chapter-specific bullets naming the common
  causes, written from that chapter's tests. On success the
  output is exactly the PASS line, as before.
- **Make it yours.** Every chapter closes (README and
  notebook alike) with a short *Make it yours* beat: one
  optional personalization of the learner's own café —
  their own regular, their own never-do-that rule.
  Always marked optional; it never affects a checkpoint.
- **The world is diegetic.** Every harness concept is a
  café thing, not a metaphor pasted on: context is Tab's
  order pad, memory is the regulars' card file, the trace
  is the ticket spike, skills are the laminated cards by
  the register. If a concept cannot be named in-world
  without confusing the mechanism, keep the mechanism's
  own name and say so — never force a cute rename.
- **The board.** Every notebook renders Tab's café board
  (`shared/board.py`) once, at its watch-it moment, at that
  chapter's level: the board gains exactly one fixture per
  chapter, cumulative, so the café visibly grows with the
  harness. The board renders world state — when a
  `CafeWorld` is at hand it renders the world's snapshot.
- **The simulation.** The café is a real environment
  (`shared/cafe_world.py`): state, actions, violations, and
  one scoreboard. Harnesses touch the world through the
  tool layer only, and every architecture comparison —
  lab or eval — is graded by that one scoreboard.
- **Scenario packs.** The Day is the spine: every chapter's
  build and checkpoint thread runs on it. Scenario packs
  (`shared/scenarios.py`) vary conditions around the spine —
  for sabotage beats, exercises, and lab play. Graded
  threads never run on packs.
- **Go deeper.** Every chapter ends with a *Go deeper
  (optional)* list — in the README the final section, in
  the notebook a markdown cell after Make it yours and
  before the passport. Two to four links to the canonical
  papers and references behind the layer, one line each:
  the title as the link, an em dash, one clause on why it
  is worth the time. It is a plain list, never a callout.

## Code

- Standard library only, deterministic fake model only in
  notebooks: no API keys, no network, no randomness, no clock.
- Small and readable beats clever. Comments teach the *why* of the
  line below them, in one line.
- Notebook code reuses the chapter's logic; the checkpoint runs the
  chapter's actual test suite so notebook and repo cannot drift.

## What to cut

- Anything decorative that is not the trace or a callout.
- Background the chapter does not use in its own build (history,
  alternatives, "in production you might…" asides) — the
  commercial note already carries the real-world link.
- A second example where one, well-chosen, does the job.
- Claims about commercial products that cannot be labelled
  documented / inferred / not documented.
