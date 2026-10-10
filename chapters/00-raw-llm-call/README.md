# Chapter 0 -- The Raw LLM Call

> The layer: one request, one response. No loop, no tools, no memory.
> Everything else in this curriculum is machinery around this call.

## 1. The failure this layer prevents -- shown

Here is the agent this whole course builds: **Tab**, who runs
**The Morning Bell**, the café you own. Ask the raw model
underneath Tab -- no harness, no files -- *"What do I need for
today?"* and it answers instantly and confidently: a plausible
café day that is simply invented. The wrong bakes. No allergy
anywhere in it -- Mina, age 9, has a severe peanut allergy, and
the invented day never mentions her. The model cannot see the
day sheet, because nothing has shown it one; fluency fills the
gap. That invention is the failure under every failure in this
course. But before Tab can stop inventing the day, the one call
it stands on has to be made correctly.

The day itself is deliberate course design: the whole course
replays a single canonical Day at The Morning Bell -- same day
sheet, same regulars, same rushes -- so when behaviour changes,
the harness is what changed, not the scenario. You will live
this day sixteen times. Tab gets better. So will you.

Skip the messages shape and the call fails in ways that look like
model problems but are harness problems. The starter
(`starter/harness.py`) commits the two classic sins:

```python
def build_messages(prompt, system=None):
    return prompt                      # a bare string, not messages

def ask(model, prompt, system=None):
    response = model(build_messages(prompt, system))
    return response                    # the whole object, not its text
```

Run the checkpoint against it:

```
HARNESS_VARIANT=starter python -m unittest discover -s chapters/00-raw-llm-call/tests
# Ran 5 tests -- FAILED (failures=3)
```

What breaks, concretely: the model is handed a bare string instead of
the `[{"role": ..., "content": ...}]` list every provider expects;
the system prompt is silently dropped on the floor; and the caller
gets back a response *object* when they asked for an answer. A caller
doing `ask(...).upper()` or printing the result gets object noise, not
text. There is no loop to blame and no tool to blame -- the failure is
purely in how the one call is made, which is why it is chapter 0.

## 2. The mechanism

A model call is a function of one thing: a **messages list**. Each
message is `{"role": ..., "content": ...}`; the roles are `system`
(instructions that outrank the user), `user`, `assistant`, and later
`tool`. The model returns a structured response; this curriculum's
shared type (`shared/model_types.py`) is:

```python
ModelResponse(text="...", tool_calls=(...))
```

Chapter 0 uses only `text`. `tool_calls` exists in the type from day
one so later chapters extend the contract instead of breaking it.

The model itself is *any callable* with the signature
`model(messages, tools=None) -> ModelResponse`. The fake model and the
real model both honour it; that single seam is what makes the whole
curriculum testable for free.

## 3. Build it

In `solution/harness.py` (write your own in `starter/` first):

1. `build_messages(prompt, system=None)` returns the system message
   first (if given), then the user message. Order is meaning.
2. `ask(model, prompt, system=None)` makes **exactly one** call and
   returns `response.text` -- a string, not an object.

That is the whole chapter: ~15 lines. Sit with how little there is.
A raw call cannot retry, cannot act, cannot remember. The rest of the
curriculum is the price of fixing those, one honest layer at a time.

## 4. Checkpoint

```
HARNESS_VARIANT=starter  python -m unittest discover -s chapters/00-raw-llm-call/tests   # FAILED (failures=3)
HARNESS_VARIANT=solution python -m unittest discover -s chapters/00-raw-llm-call/tests   # OK (5 tests)
```

The tests assert: the answer text comes back; exactly one call was
made; the messages the fake model *recorded* are exactly
`[{"role": "user", "content": prompt}]`; a system prompt goes first;
and no tools are offered (tools do not exist yet).

## 5. How the commercial harnesses do it

Claude Code and Codex both sit on this same primitive -- one API call
whose input is a messages array. Their APIs differ in dialect
(Anthropic's `system` is a separate field; OpenAI puts it in the
array; the Meta Responses API wraps messages as input items) but the
shape is identical, which is why `shared/real_model.py` can hide all
three behind this chapter's interface and no chapter code changes.
When you use a commercial harness, every "the agent is thinking"
moment is this call, repeated by the loop you build next.

## Make it yours

Tab has no memory and no files yet -- but the question is
already yours. Keep the question you actually ask at open
somewhere you will see it ("What do I need for today?" is the
course's). By chapter 2, Tab will answer yours from the real
day sheet and stock instead of inventing a day. Optional; no
checkpoint knows or cares.

## Go deeper (optional)

- [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) — the map of the territory this whole course walks, drawn while the field was still naming its parts.
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — the practitioner's field guide to when one plain call is enough and when it is not.
