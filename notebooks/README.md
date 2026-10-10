# The Notebooks — Under the Harness, hands-on

One notebook per chapter, same rhythm as the chapter itself:
watch the failure live, predict, build the layer in small cells,
break it on purpose (sabotage), then run the chapter's real
checkpoint suite in the notebook's own kernel.

## The thread: one agent, growing

Every notebook grows the same agent: **Tab**, who runs a
tiny café called **The Morning Bell** — and lives one
canonical Day, replayed every chapter on purpose, so the
growth from chapter to chapter is visible against a Day
that never changes. Each notebook's title carries a
"Thread so far:" line — what Tab could do after the
previous chapter, and what this chapter adds. Each
notebook also renders **Tab's board** at its chapter's
level: the café board gains one fixture per layer, from
the bare counter of chapter 0 to the team board
of chapter 15.

Public repo: chapters land one at a time; rows without a link
aren't published yet.

| # | Notebook | Time | Principle | Status |
|---|----------|------|-----------|--------|
| 0 | [00-raw-llm-call.ipynb](00-raw-llm-call.ipynb) | ~25 min | The model is stateless. The harness owns the conversation. | Available |
| 1 | 01-agent-loop.ipynb | ~31 min | A loop is a budget, not a while-true. | Landing soon |
| 2 | 02-tools.ipynb | ~46 min | Tools are contracts. The schema is the promise, and errors are data, not exceptions. | Landing soon |
| 3 | 03-context-management.ipynb | ~31 min | Compaction is lossy compression of your own instructions. Pin what must not be lost. | Landing soon |
| 4 | 04-memory.ipynb | ~45 min | Memory is a filing decision. Store deliberately, load deliberately. | Landing soon |
| 5 | 05-permissions.ipynb | ~37 min | Permissions are a threat model, not a dialog box. | Landing soon |
| 6 | 06-subagents.ipynb | ~28 min | A subagent is a fresh context with a narrow job. Isolation is the feature. | Landing soon |
| 7 | 07-tracing.ipynb | ~34 min | If you can't replay the run, you can't debug the agent. | Landing soon |
| 8 | 08-mcp.ipynb | ~29 min | A protocol is a registry you don't own. Discover, don't hardcode. | Landing soon |
| 9 | 09-skills.ipynb | ~40 min | A skill is context delivered just in time. Advertise cheap, load late. | Landing soon |
| 10 | 10-safety.ipynb | ~26 min | One gate is not a defense. Contain in layers, and assume the model will be talked into it. | Landing soon |
| 11 | 11-evals.ipynb | ~44 min | An agent you can't measure is an agent you're guessing about. | Landing soon |
| 12 | 12-hooks.ipynb | ~44 min | A hook runs because the harness runs it, not because the model remembered to. | Landing soon |
| 13 | 13-planning.ipynb | ~43 min | Write the plan before the rush. Check the work against the list, not against memory. | Landing soon |
| 14 | 14-scheduling.ipynb | ~37 min | The schedule decides when; the loop decides how. A missed run is a policy, not a surprise. | Landing soon |
| 15 | 15-coordination.ipynb | ~40 min | Coordination is a contract: what a handoff drops, the team loses. | Landing soon |

Each notebook states its own time budget in its title cell
(the same numbers as this table, computed from the notebook's
actual size — see `../STYLE.md` for the formula) and marks its
four stages as it goes: watch it break and predict, build,
sabotage and checkpoint, in the wild and spot it. Before each
folded solution there is a two-step hint ladder — a nudge,
then the shape of the solution — so getting stuck costs a
peek, not the answer. Notebooks 1–11 each add one Recall
prompt before the sabotage section: a question whose answer
lives in an earlier chapter, folded beside it. (Chapter 0
opens instead with the whole game — the finished agent,
running in miniature — and a list of what you can't explain
yet.)

Every notebook's last cell stamps a **progress passport**:
your own `my-progress.md`, kept beside the notebooks, with
one line per chapter — principle and date — filling in as
you finish each one. It is yours, not the repo's (it is
git-ignored). Notebooks 7 and 11 also carry an optional
**graduation** cell just before the passport: the chapter's
own task run against a real model, through the same harness.
It needs an API key and costs a few cents; with no key set
it prints a skip line and does nothing, and everything else
in the curriculum works offline without one.

**Part II** (notebooks 8–11) takes Tab outside the café's own
walls: a supplier on the phone with tools of its own,
procedures written as laminated cards, an adversary hiding
in the day's notes, and finally trial shifts on days Tab has
never seen. The Part I thread still applies — each notebook
opens with what Tab could already do.

**Part III** (notebooks 12–14) makes Tab a standing member
of the café rather than a voice that answers when spoken to:
standing rules that fire on their own at the harness's
lifecycle events, a prep list that sequences the morning
before it starts, and a schedule card that wakes Tab when a
time arrives — with a written policy for the days the café
is closed.

## The value ladder

Each layer exists because of a failure the previous agent could
not survive:

| Ch | Capability Tab gains | The failure it could not survive before |
|----|--------------------------|------------------------------------------|
| 0 | One correct call: right shape in, answer text out | Asked "What do I need for today?", the raw model invents a day — wrong bakes, and no idea Mina exists |
| 1 | Multi-step runs that stop on the answer or on the budget | The ticket queue takes many looks, not one — the one-call agent serves a single ticket and forgets the rail |
| 2 | Tool use with recovery: schemas out, classified errors back | The first misspelled tool name or bad argument crashing the whole opening |
| 3 | Long sessions that fit the window, instructions intact | An order pad rewritten from a "gist" that quietly drops *No peanuts at the prep counter, ever* — and blurs the 09:00 two-bakes slot to "morning" |
| 4 | Memory across sessions: the regulars' card file, cards pulled only when needed | Amnesia between days — Sasha's oat milk and who Mina is, forgotten — or every regular's whole card dumped into every context |
| 5 | Safe mutation: spending, comps, and deletions behind the owner's bell, denied by default | An owner's "no" ignored and Priya's Friday office order deleted anyway |
| 6 | Delegation: station staff with narrow passes, final text only back | Context leaking both ways — a station hand contaminated by the whole café, Tab flooded with scratch work |
| 7 | Debuggable runs: the ticket spike — a normalized, replayable trace of every call | The 09:00 double-booked oven — diagnosable only from vibes, with no spike to read back |
| 8 | Remote tools: whatever Bean & Co. offer on the phone today, discovered live | A hardcoded tool list, blind to everything the roastery gained later |
| 9 | Procedures on tap: the laminated recipe cards, full card read only when the job matches | Every procedure body stuffed into every prompt — or the morning opening improvised |
| 10 | Layered containment: the locked office, the regulars'-notes guard, a second pair of eyes for big orders | A napkin note that talks Tab into reading the accounts aloud and placing a 100x supplier order |
| 11 | Measurement: trial shifts on unseen days, graded by the café's own scoreboard | "The opening felt better in the demo" — regressions nobody can name |
| 12 | Standing rules that fire on their own: the rule cards by the register, re-pinned at compaction, guarding at the tool boundary | A rule that lives only in the prompt, folded away by compaction mid-rush — Mina's cocoa served off a contaminated counter |
| 13 | A written prep list: the morning sequenced at 06:40, editable by the owner, checked at the finish | The 09:00 two-bakes-one-oven contention discovered live, at the oven, mid-queue |
| 14 | A week that runs itself: jobs fired by the clock, missed days handled by policies written in advance | A poller burning its whole budget asking "is it time yet?" — and the supplier order fired out of a closed café |

## How to run

You need the whole repo, not just this folder — the notebooks
import `shared/` and load each chapter's starter/solution/tests.
They find the repo root by walking up from the notebook's folder,
so keep the layout intact.

- **Local Jupyter (recommended):** from the repo root,
  `jupyter notebook notebooks/` (or open the folder in VS Code /
  JupyterLab). Any Python 3.11+ works; the notebooks use only the
  standard library plus the repo's fake model. No API key, no
  network, $0.
- **Colab:** upload the repo (or clone it), open a notebook from
  `notebooks/`, and run top to bottom.
- **Order:** 0 → 15. Each chapter's build assumes the previous
  chapters' ideas; the code cells load each chapter's own
  reference harness, so a notebook still runs standalone.

Each `*.executed.ipynb` next to a notebook is the evidence copy:
the same notebook executed fresh, top to bottom, in a clean
kernel, with every checkpoint printing PASS. The plain
`*.ipynb` copies are the ones to work in — outputs cleared.
See `../NOTEBOOK_ROLLOUT_REPORT.md` for the verification record,
`../PART_II_REPORT.md` for the Part II notebooks (8–11), and
`../PART_III_REPORT.md` for the Part III notebooks (12–14),
and `../MULTI_AGENT_REPORT.md` for chapter 15's.

## An honest caveat: JupyterLite

The notebooks are standard-library-only and the checkpoint cells
run the test suites **in-process** (no subprocess), specifically
so that in-browser Python (JupyterLite / Pyodide) stays a
possibility. It is still **unverified**: nobody has yet run the
full set inside JupyterLite, and filesystem/tempfile behaviour
there may differ. Treat Colab or local Jupyter as the front door
until a JupyterLite pass is recorded in the rollout report. One
notebook is further out still: 08-mcp spawns its tool server as a
real subprocess by design — the lesson *is* the process boundary —
so it needs a local kernel (or Colab), not in-browser Python.
