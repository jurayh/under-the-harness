"""Chapter 0 -- STARTER. Two instructive bugs live here (README explains).

Run the checkpoint against this file and watch it fail; then read the
chapter, fix the bugs (or peek at solution/), and watch it pass.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))


def build_messages(prompt, system=None):
    # BUG 1: a bare string is not the messages shape. Providers expect a
    # list of role/content dicts -- and the system prompt is dropped here.
    return prompt


def ask(model, prompt, system=None):
    response = model(build_messages(prompt, system))
    # BUG 2: returning the whole response object, not its text. Callers
    # asked a question; they want the answer string.
    return response
