"""Chapter 0 -- one raw LLM call, and nothing else.

No loop, no tools, no memory. Just the shape every harness is built on:
you send a *list of messages*, the model returns *one response*.
Everything in later chapters is machinery around this call.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from shared.model_types import ModelResponse  # noqa: F401  (re-exported for learners)


def build_messages(prompt, system=None):
    """The messages shape: a list of {"role": ..., "content": ...} dicts.
    Order matters -- it *is* the conversation."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    return messages


def ask(model, prompt, system=None):
    """Make exactly one model call and return its text."""
    response = model(build_messages(prompt, system))
    return response.text
