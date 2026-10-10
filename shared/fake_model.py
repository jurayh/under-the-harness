"""A deterministic, scripted stand-in for a real LLM.

Why this exists: a curriculum you cannot test for free is a curriculum
nobody finishes. The FakeModel replays a *script* you write in advance,
so a checkpoint test can assert exactly what a correct harness does --
which messages it sent, which tools it dispatched, when it stopped --
with zero API calls and zero flakiness.

Determinism contract: same script + same call sequence -> same outputs.
No randomness, no clock, no dict-order dependence. Scripts are a list;
each entry is either a ModelResponse or a callable
``step(messages, tools) -> ModelResponse`` for the rare step that must
react to a previous tool result (still deterministically).
"""
import copy

from shared.model_types import ModelResponse, ToolCall


def say(text):
    """Script entry: the model answers with final text."""
    return ModelResponse(text=text)


def call(name, _id=None, **arguments):
    """Script entry: the model asks for one tool call."""
    return ModelResponse(tool_calls=(ToolCall(
        id=_id or f"call_{name}", name=name, arguments=arguments),))


class ScriptExhausted(RuntimeError):
    """The harness asked the fake model for more steps than scripted.
    In a test, this usually means the loop failed to stop."""


class FakeModel:
    def __init__(self, script):
        self._script = list(script)
        self._next = 0
        self.calls = []  # every (messages, tools) it was invoked with

    def __call__(self, messages, tools=None):
        # Record a deep copy: the harness will keep mutating its list,
        # and a test later wants the list as it was at this call.
        self.calls.append((copy.deepcopy(messages),
                           copy.deepcopy(tools)))
        if self._next >= len(self._script):
            raise ScriptExhausted(
                f"script has {len(self._script)} steps, "
                f"harness asked for step {self._next + 1}")
        step = self._script[self._next]
        self._next += 1
        response = step(messages, tools) if callable(step) else step
        if not isinstance(response, ModelResponse):
            raise TypeError(f"script step returned {type(response)}, "
                            "expected ModelResponse")
        return response

    @property
    def call_count(self):
        return len(self.calls)
