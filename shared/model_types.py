"""The two small types every chapter shares.

A *message* is a plain dict, the shape every provider recognises in some
form::

    {"role": "user", "content": "hello"}
    {"role": "assistant", "content": "", "tool_calls": [ToolCall, ...]}
    {"role": "tool", "tool_call_id": "call_1", "name": "read_file",
     "content": "..."}

A *model* is any callable:  ``model(messages, tools=None) -> ModelResponse``
That one signature is the whole contract between a harness and a model.
The fake model (fake_model.py) and the real one (real_model.py) both
honour it, which is why swapping them takes one line.
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class ToolCall:
    """One request from the model to run one tool."""
    id: str
    name: str
    arguments: dict = field(default_factory=dict)


@dataclass(frozen=True)
class ModelResponse:
    """What a model returns: final text, tool calls, or both."""
    text: str = ""
    tool_calls: tuple = ()

    @property
    def is_final(self):
        """True when the model is done talking to tools and answered."""
        return not self.tool_calls
