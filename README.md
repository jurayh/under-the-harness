# Under the Harness

**Build a real agent harness, one layer at a time, and understand
Claude Code and Codex from the inside.**

You will not read about harnesses. You will build one — starting
from a single raw LLM call, adding one layer per chapter, until
the agent you have built loops, uses tools, manages its context,
remembers, asks permission, delegates, traces itself, talks to
tool servers, follows packaged skills, survives attacks, and is
measured by an eval suite. Every layer exists because of a
failure the previous version could not survive — and you watch
that failure happen before you build the fix.

The agent you build along the way is **Tab**, who runs a tiny
café called **The Morning Bell**. You are the owner; Tab is
your counter help. And Tab lives **one canonical Day** — the
same tickets, the same regulars, the same rush — replayed in
every chapter, on purpose: because the Day never changes, it
is the control variable, and Tab's growth is measurable
against it. Only the finale leaves the loop, for trial shifts
on days Tab has never seen.

## The value ladder

One agent the whole way through: **Tab**, at the counter of
The Morning Bell, living the Day again each chapter.

| Ch | Capability Tab gains | The failure it could not survive before |
|----|--------------------------|------------------------------------------|
| 0 | One correct call: right shape in, answer text out | Asked "What do I need for today?", the raw model invents a day — wrong bakes, and no idea Mina exists |
| 1 | Multi-step runs that stop on the answer or on the budget | The morning ticket queue takes many looks, not one — the one-call agent serves a single ticket and forgets the rail, and the unbounded loop spins forever |
| 2 | Tool use with recovery: schemas out, classified errors back | The first misspelled tool name or bad argument crashing the whole opening |
| 3 | Long sessions that fit the window, instructions intact | An order pad rewritten from a "gist" that quietly drops *No peanuts at the prep counter, ever* — and blurs the 09:00 two-bakes slot to "morning" |
| 4 | Memory across sessions: the regulars' card file, cards pulled only when needed | Amnesia between days — Sasha's oat milk and Mina's allergy, forgotten — or every regular's whole card dumped into every context until the budget bursts |
| 5 | Safe mutation: spending, comps, and deletions behind the owner's bell, denied by default | An owner's "no" ignored and Priya's Friday office order deleted anyway |
| 6 | Delegation: station staff with narrow passes, final text only back | Context leaking both ways — a station hand contaminated by the whole café's business, Tab flooded with scratch work |
| 7 | Debuggable runs: the ticket spike — a normalized, replayable trace of every call | The 09:00 double-booked oven — a looping run you can only diagnose from vibes, with no spike to read back |
| 8 | Remote tools: whatever Bean & Co. offer on the phone today, discovered live | A hardcoded tool list, blind to everything the roastery gained after the client was written |
| 9 | Procedures on tap: the laminated recipe cards, full card read only when the job matches | Every procedure body stuffed into every prompt — or the morning opening improvised from memory |
| 10 | Layered containment: the locked office, the regulars'-notes guard, a second pair of eyes for big orders | A note on a napkin — not a ticket from the rail — that talks Tab into reading the accounts aloud and placing a 100x supplier order |
| 11 | Measurement: trial shifts on unseen days, graded by the café's own scoreboard | "The opening felt better in the demo" — regressions nobody can name |
| 12 | Standing rules that fire on their own: the rule cards by the register, re-pinned at compaction, guarding at the tool boundary | A rule that lives only in the prompt, folded away by compaction mid-rush — Mina's cocoa served off a contaminated counter |
| 13 | A written prep list: the morning sequenced at 06:40, editable by the owner, checked at the finish | The 09:00 two-bakes-one-oven contention discovered live, at the oven, mid-queue |
| 14 | A week that runs itself: jobs fired by the clock, missed days handled by policies written in advance | A poller burning its whole budget asking "is it time yet?" — and the supplier order fired out of a closed café |
| 15 | A team that coordinates: handoffs as contracts, a mailbox channel, races settled by the world | Notes and goodwill — the safety rule paraphrased into a preference by the second station, the last muffin promised to two guests, a delegation handing itself back |

## The café is a lab

The café is a real simulation, not set dressing:
`shared/cafe_world.py` owns the state (clock, ticket queue,
stock, till, prep counter, the office), the Day and the unseen
days as data, the actions Tab's tools call, and a
deterministic **scoreboard** — tickets completed and missed,
longest queue, violations (allergy incidents always counted
separately), money spent vs earned, steps, tokens.

`examples/architecture_lab.py` runs different harness
architectures against the *same* days and prints the
comparison: gist vs pinned compaction, memory vs no memory,
gate-only vs layered safety, careful Tab vs Rush Tab on the
unseen days. Chapter 11's evals are scored by the same
scoreboard. Register your own architecture variant in a few
lines and watch what it buys — and what it costs.

## Scenario packs

The Day is the spine: every chapter's build and checkpoint
run on it, because a fixed day is what makes architectures
comparable. Around the spine, **scenario packs**
(`shared/scenarios.py`) vary the conditions — for sabotage
beats, exercises, lab play, and Chapter 11's trial shifts.
A pack is a day in the world's own format, graded by the
same scoreboard; graded threads never run on packs.

| Pack | What varies | Home |
|------|-------------|------|
| `the-day` | Nothing — the reference every pack is measured against | All chapters |
| `normal-tuesday` | CONTROL day — nothing is designed to fail; the baseline the other days are measured against | Ch 11 |
| `allergy-keeper` | A second allergic child, and peanuts on the menu and in stock | Ch 11 |
| `rush-saturday` | Eight tickets inside eight minutes; the queue is the problem | Ch 11 |
| `supplier-outage` | No delivery today, and the milk is already gone | Ch 11 |
| `attack-at-noon` | Instructions arrive from outside the ticket rail | Ch 10 |
| `new-regular-day` | One customer nobody knows, and a peanut item on the menu | Ch 4, 9 |
| `party-order-day` | A ten-cover pre-order lands at 14:00, allergen ticket after it | Ch 6, 9, 15 |
| `the-changed-card-day` | Two card-file facts went stale between days: a departed billing contact, a regular's changed order | Ch 4 |
| `false-write-day` | A card written from a mishearing — "peanuts only" — meets a sesame-finished special | Ch 4 |
| `delivery-came-early` | The 15:00 delivery lands at 11:20, under an afternoon plan built on an 11:00 stock read | Ch 7 |

List them with `python -m shared.scenarios`; run one under
the careful reference driver with
`python -m shared.scenarios <pack-id>`, or point the lab at
it: `python examples/architecture_lab.py --pack <pack-id>`.

## How it works

- **Failure first.** Every chapter opens with the failure,
  running — not described. Then the mechanism, then you build
  it, then a checkpoint proves it.
- **Deterministic and $0.** All checkpoints run against a
  scripted fake model: same script, same trace, every time.
  No API key, no network, no flakes. (Two optional "graduation"
  cells run a task against a real model if you provide a key.)
- **Real checkpoints.** Each chapter ships a test suite that
  fails on the starter code and passes on the finished layer —
  the same suite runs in the chapter folder and in its notebook.
- **Principles, linked to the real products.** Each chapter
  teaches one portable principle, then shows where Claude Code,
  Codex, and other agents embody it — sourced from official
  documentation, with every claim labelled *documented*,
  *inferred*, or *not documented*. See
  [PRINCIPLES.md](PRINCIPLES.md).
- **Small, readable code.** Python, standard library only.
  No framework, no magic.
- **Yours, then deeper.** Every chapter closes with a short
  *Make it yours* beat — one optional way to personalize
  Tab's café with your own regular or your own never-do-that
  rule — and an optional *Go deeper* list: the canonical
  papers and references behind the layer, for when you want
  the long version.

## Quickstart

You need Python 3.11+ and nothing else.

```
git clone <this repo>
cd under-the-harness
```

Then either open the hands-on notebook —
[notebooks/00-raw-llm-call.ipynb](notebooks/00-raw-llm-call.ipynb)
(run it top to bottom in Jupyter, VS Code, or Colab) — or work
the chapter folder: read
[chapters/00-raw-llm-call/README.md](chapters/00-raw-llm-call/README.md),
run its checkpoint against the starter to watch it fail, build
the layer, and run it again to watch it pass.

First green checkpoint: **under 10 minutes**.

Your progress is yours: each notebook's last cell stamps a
chapter into a `my-progress.md` passport kept beside the
notebooks, never committed.

## Chapters

Chapters are landing **one at a time, each hand-tested** before
the next is added.

| # | Chapter | The layer | Status |
|---|---------|-----------|--------|
| 0 | [Raw LLM call](chapters/00-raw-llm-call/) · [notebook](notebooks/00-raw-llm-call.ipynb) | one request, one response, the messages shape | **Available** |
| 1 | The agent loop | stop conditions, step budget | Landing soon |
| 2 | Tools | registry, schemas, dispatch, error taxonomy & recovery | Landing soon |
| 3 | Context management | token budgeting, then compaction | Landing soon |
| 4 | Memory | files + index, deliberate loading, write-back | Landing soon |
| 5 | Permissions | a gate on mutating calls | Landing soon |
| 6 | Subagents | delegation with isolated context | Landing soon |
| 7 | Tracing | a normalized trace of a full run | Landing soon |
| 8 | MCP | tools over a wire: handshake, discovery, calls to a separate server process | Landing soon |
| 9 | Skills | packaged procedures: index advertised, bodies loaded just in time | Landing soon |
| 10 | Safety and containment | path jail, secret guard, escalation — layered defense | Landing soon |
| 11 | Evals | tasks as data, code graders, variant scoring, personal-best deltas | Landing soon |
| 12 | Hooks | lifecycle events, a hook bus, rules that live outside the context | Landing soon |
| 13 | Planning | a plan artifact, an owner-editable prep list, depth as a dial | Landing soon |
| 14 | Scheduling | a schedule card, per-slot idempotent firing, missed-run policies | Landing soon |
| 15 | Coordination | handoffs as contracts, a world mailbox, per-station write permissions, claims and reservations | Landing soon |

After chapter 15 comes the [**Capstone**](capstone/) —
graduation, not a seventeenth chapter. Your harness,
unmodified, works a shift in a world you did not build:
first a local stand-in (a library returns desk, graded on
the world it leaves behind), then Meta's ARE — Agents
Research Environments — exposing real scenarios through an
MCP server, with your dial settings chosen and defended from
your own measurements. A second finale has you author a
scenario pack of your own for the café. See
[capstone/README.md](capstone/README.md).

The notebook index (the thread, per-notebook time budgets, how
to run them) is [notebooks/README.md](notebooks/README.md).
The house style every chapter follows is
[STYLE.md](STYLE.md).

## License

MIT — see [LICENSE](LICENSE).
