# Principles — one per layer, and where the products embody them

Each chapter of this curriculum teaches one principle. The table
collects them with the counterparts named in the notebooks'
IN THE WILD sections — nothing here is claimed that a notebook
does not claim, with the same labels. Vendor references checked
Oct 2026 from official documentation and engineering posts;
**documented** = the source says it, **inferred** = our reading,
**not documented** = we looked and it is not there.

| Principle | Chapter | Claude Code counterpart | Codex counterpart | Beyond coding |
|---|---|---|---|---|
| The model is stateless. The harness owns the conversation. | 0 · Raw LLM call | Anthropic Messages API: a request carries `model`, `max_tokens`, and a `messages` array; the system prompt is its own top-level field — **documented** | OpenAI APIs: the caller maintains and resends the input list each call — **documented** | Deep Research starts as a Responses request (background mode runs it async); the product around it is harness — **documented** |
| A loop is a budget, not a while-true. | 1 · The agent loop | Claude Agent SDK: the loop runs until an end-of-turn result or a limit — `max_turns` / `max_budget_usd` — **documented** | The loop's unit is the *turn*, and the limit OpenAI names is the context window; a numeric step cap is **not documented** | Anthropic, *Building Effective Agents* (all agent types): agents are LLMs using tools in a loop, with stopping conditions such as a max iteration count as standard control — **documented** |
| Tools are contracts. The schema is the promise, and errors are data, not exceptions. | 2 · Tools | Anthropic tool use: tools defined by `name` / `description` / `input_schema` (JSON Schema); failures return with an `is_error` flag — **documented** | OpenAI function calling: `name` / `description` / `parameters` JSON Schema; `strict` mode makes the API enforce the schema — **documented** | Claude computer use: a client-side tool — the model issues `tool_use` requests, your application executes them and returns `tool_result` blocks — **documented** |
| Compaction is lossy compression of your own instructions. Pin what must not be lost. | 3 · Context management | Auto-compaction clears older tool outputs first, then summarizes; docs warn early instructions may be lost and advise CLAUDE.md for persistent rules; `/compact` on demand — **documented** | The context window is named as the pressing limit; a step-by-step compaction policy is **not documented** | Anthropic's context-engineering guidance (agents generally, research included) defines compaction as: summarize near the limit, reinitiate the window with the summary — **documented** |
| Memory is a filing decision. Store deliberately, load deliberately. | 4 · Memory | CLAUDE.md (you write it) + auto memory (Claude writes it), both loaded every session; topic files on demand — **documented** | AGENTS.md instruction files, read before work, chained from repo root to cwd — **documented**; an agent-written auto memory is **not documented** | Anthropic's memory tool for API agents: files in a directory you control, retrieved on demand rather than loaded up front — **documented** |
| Permissions are a threat model, not a dialog box. | 5 · Permissions | Permission rules (allow / ask / deny) evaluated before a tool runs; a separate OS-level sandbox contains allowed commands — **documented** | `sandbox_mode` draws the boundary (read-only / workspace-write / danger-full-access); `approval_policy` decides when the agent must stop and ask — **documented** | ChatGPT agent: requests permission before actions of consequence; the user can interrupt or take over the browser — **documented** |
| A subagent is a fresh context with a narrow job. Isolation is the feature. | 6 · Subagents | Subagents run in their own context windows and start without your conversation history — **documented** | Subagent workflows on by default, spawned only when asked; parallel threads, results consolidated into the main thread — **documented** | Claude's Research feature: an orchestrator-worker system — a lead agent plans and spawns parallel subagents that return findings — **documented** |
| If you can't replay the run, you can't debug the agent. | 7 · Tracing | Monitoring via OpenTelemetry: metrics, logs/events, optional traces, incl. session and tool activity — **documented** | `codex exec --json` emits a JSONL event stream (thread/turn/item: messages, commands, file changes) — **documented** | OpenAI Agents SDK: built-in tracing of generations, tool calls, handoffs, guardrails, viewable in a traces dashboard — **documented** |
| A protocol is a registry you don't own. Discover, don't hardcode. | 8 · MCP | Connects to MCP servers from project, user, and local config scopes; servers run over stdio or HTTP; their tools join the tool list — **documented** | MCP servers declared in TOML config or added with `codex mcp add`; stdio servers spawn as subprocesses, HTTP servers supported — **documented** | OpenAI Apps SDK: ChatGPT apps are MCP servers exposing tools the model calls — a chat product, not a coding agent — **documented** |
| A skill is context delivered just in time. Advertise cheap, load late. | 9 · Skills | Agent Skills: `SKILL.md` with `name` + `description`; the body loads when the skill triggers, bundled files on demand; skills are the recommended way to teach procedures — **documented** | Skills in the same `SKILL.md` format; only name + description advertised (index budgeted at ~2% of the context window); implicit description matching or explicit invocation — **documented** | Anthropic engineering guidance frames skills as the general mechanism for equipping agents with domain expertise — procedures as packages, not prompt text — **documented** |
| One gate is not a defense. Contain in layers, and assume the model will be talked into it. | 10 · Safety and containment | An OS-level sandbox contains allowed commands (filesystem and network isolation) as a layer *separate from* permission rules — the two are documented as distinct mechanisms — **documented** | `sandbox_mode` bounds where the agent can touch (read-only / workspace-write / danger-full-access) while `approval_policy` separately governs asking — containment and permission as two dials — **documented** | ChatGPT agent: asks permission before consequential actions and supports user takeover — escalation as a product-level layer, beyond coding agents — **documented** |
| An agent you can't measure is an agent you're guessing about. | 11 · Evals | Anthropic's eval guidance defines task / trial / grader / transcript / outcome and advises starting with 20–50 tasks taken from real failures — **documented** | OpenAI's evals guide documents the same loop — define tasks, grade outputs, iterate against scores — **documented** | SWE-bench: a public benchmark in the same shape at scale — tasks as data, outcomes graded by test suites — **documented** |
| A hook runs because the harness runs it, not because the model remembered to. | 12 · Hooks | The hooks reference documents 33 lifecycle events (counted in its table); handlers — commands, HTTP, MCP tools, prompts, subagents — are configured in settings files, and `PreToolUse` can block a call — **documented** | Hooks documented with 12 events, incl. `PreCompact` / `PostCompact` and `Interrupt`; configured in `hooks.json` or `config.toml`; non-managed hooks need a trust review before they run — **documented** | Git hooks: scripts fired by repository events (`pre-commit`, `pre-push`, `post-merge`) regardless of what the human at the keyboard intended — **documented** |
| Write the plan before the rush. Check the work against the list, not against memory. | 13 · Planning | Plan mode: read-only exploration, the plan presented for approval, and editable in the user's own editor (Ctrl+G) before execution — **documented** | No plan-mode counterpart appears in the Codex documentation surveyed for this course — **not documented** | Fan et al. (arXiv:2609.20804): in a controlled ablation, planning added 11.6 points of success for the weakest model at extra cost and cut the strongest models' cost by ~30% with small success decreases — **documented** |
| The schedule decides when; the loop decides how. A missed run is a policy, not a surprise. | 14 · Scheduling | Scheduled tasks: `/loop` and the `CronCreate` tools, 5-field cron, session-scoped, a 50-task cap, 7-day expiry, and no catch-up for missed fires; durability via Routines, desktop tasks, or GitHub Actions — **documented** | Scheduled tasks: standalone tasks start a fresh chat per run and report to a Scheduled inbox; in-chat tasks can fire on minute-based intervals; custom cadences are RFC 5545 RRULEs; unattended runs use `approval_policy = "never"` where policy allows — **documented** | Cron (Unix): the 5-field schedule grammar both products lean on, fifty years old — **documented** |
| Coordination is a contract: what a handoff drops, the team loses. | 15 · Coordination | Agent teams: a lead spawns teammates that run in their own contexts, message each other directly through a mailbox, and coordinate on a shared task list (documented as experimental) — **documented** | Subagent workflows: parallel agents spawned per task, coordination and consolidation held by the orchestrating thread rather than a peer channel — **documented** | A2A (Agent2Agent, Linux Foundation): agents publish Agent Cards describing capabilities and hand each other tasks with an explicit lifecycle — agent-to-agent, where MCP is agent-to-tool — **documented** |

Doc links (one per claim above, in table order):

- Ch 0 — https://docs.anthropic.com/en/docs/build-with-claude/tool-use · https://developers.openai.com/api/docs/guides/function-calling · https://developers.openai.com/api/docs/guides/background
- Ch 1 — https://code.claude.com/docs/en/agent-sdk/agent-loop · https://openai.com/index/unrolling-the-codex-agent-loop/ · https://www.anthropic.com/engineering/building-effective-agents
- Ch 2 — https://docs.anthropic.com/en/docs/build-with-claude/tool-use · https://developers.openai.com/api/docs/guides/function-calling · https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool
- Ch 3 — https://code.claude.com/docs/en/how-claude-code-works · https://code.claude.com/docs/en/commands.md · https://openai.com/index/unrolling-the-codex-agent-loop/ · https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Ch 4 — https://code.claude.com/docs/en/memory · https://developers.openai.com/codex/guides/agents-md · https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- Ch 5 — https://code.claude.com/docs/en/permissions · https://code.claude.com/docs/en/sandboxing · https://developers.openai.com/codex/concepts/sandboxing · https://openai.com/index/introducing-chatgpt-agent/
- Ch 6 — https://code.claude.com/docs/en/sub-agents.md · https://developers.openai.com/codex/subagents · https://www.anthropic.com/engineering/multi-agent-research-system
- Ch 7 — https://code.claude.com/docs/en/monitoring-usage · https://developers.openai.com/codex/noninteractive/ · https://openai.github.io/openai-agents-python/tracing/
- Ch 8 — https://modelcontextprotocol.io/specification/2025-06-18 · https://code.claude.com/docs/en/mcp · https://developers.openai.com/codex/mcp/ · https://developers.openai.com/apps-sdk
- Ch 9 — https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview · https://code.claude.com/docs/en/skills · https://developers.openai.com/codex/skills · https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Ch 10 — https://code.claude.com/docs/en/sandboxing · https://code.claude.com/docs/en/permissions · https://developers.openai.com/codex/concepts/sandboxing · https://openai.com/index/introducing-chatgpt-agent/
- Ch 11 — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents · https://developers.openai.com/api/docs/guides/evals · https://www.swebench.com
- Ch 12 — https://code.claude.com/docs/en/hooks · https://developers.openai.com/codex/hooks · https://git-scm.com/docs/githooks
- Ch 13 — https://code.claude.com/docs/en/permission-modes · https://arxiv.org/abs/2609.20804 · https://www.anthropic.com/engineering/building-effective-agents
- Ch 14 — https://code.claude.com/docs/en/scheduled-tasks · https://developers.openai.com/codex/app/automations
- Ch 15 — https://code.claude.com/docs/en/agent-teams · https://developers.openai.com/codex/subagents · https://a2a-protocol.org/latest/specification/

## Balance — the dial above the layers

The sixteen principles above are one per layer. This one is
about all of them at once: **harness structure is prescribed
per model capability, task type, and budget — never adopted
as a default.** More structure — a written plan, predefined
tools, aggressive context management, frequent checks — is a
dose, not a virtue: it buys success for a weaker model and
mostly buys cost for a stronger one. The curriculum teaches
the dial directly: chapter 2's tool contracts, chapter 3's
context management, and the planning layer are its settings,
and the evals lab sweeps them against weaker and stronger
scripted models so the learner measures the trade instead of
believing it.

Documented evidence — Fan et al., *An Empirical Study of
Harness Design for Coding Agents* (arXiv:2609.20804 —
https://arxiv.org/abs/2609.20804 — checked Oct 2026; four
open-weight models inside one fixed harness, components
varied one at a time):

- The principle itself is the paper's closing claim:
  "Harness design is a conditional systems problem —
  components are selected for the target model, task type,
  and budget, not adopted as defaults (Fan et al., 2026)."
- Planning (the planning layer's evidence): "Planning is an
  accuracy scaffold for weaker models and a cost saver for
  stronger ones: in Fan et al.'s controlled study it added
  11.6 points of success for the weakest model at extra
  cost, and cut the strongest models' cost by ~30% with
  small success decreases."
- Tools (chapter 2's principle): "Whether predefined tools
  or a bash-only interface wins depends on the model's shell
  proficiency: predefined tools added 15 points for the
  bash-weak model, while the bash-capable model did better
  and 53% cheaper with bash alone." The paper's own caveat
  rides with the claim: the comparison bundles interface
  prompts and validation, per its limitations — it is
  evidence about interfaces, not about tool count alone.
- Context (chapter 3's principle): "Context management
  matters most when the window is tight: the
  managed-vs-unmanaged success gap fell from 35.7 points at
  32k to 2.7 at 128k, mostly by preventing overflow
  failures." And, behind chapter 3's anchored-compaction
  sidebar: "Staging cheap rule-based elision before LLM
  summarization was the most cost-efficient context
  strategy tested."
- Memory (chapter 4's principle), in the narrow form the
  study supports: "Making compacted content recoverable did
  not help: the models almost never invoked the recall tool
  (median use zero) and accuracy did not improve." The
  study ran no harness-managed vs model-managed memory
  comparison, and nothing broader about memory is claimed
  from it — the citable lesson is that a recovery path the
  model must choose to invoke is a path that goes unused,
  which is why chapter 4's harness, not the model, carries
  the load-bearing facts.

What this evidence does not say: the study tested
open-weight models on coding benchmarks only. Nothing here
is claimed about frontier models, non-coding tasks, or
whole competing harnesses — the study deliberately never
compared those, and neither does this page.
