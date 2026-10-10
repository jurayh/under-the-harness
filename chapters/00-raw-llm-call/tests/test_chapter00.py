"""Chapter 0 checkpoint. Same file runs against starter or solution:

    HARNESS_VARIANT=starter  python -m unittest discover -s chapters/00-raw-llm-call/tests
    HARNESS_VARIANT=solution python -m unittest discover -s chapters/00-raw-llm-call/tests
"""
import importlib.util
import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
VARIANT = os.environ.get("HARNESS_VARIANT", "solution")
_spec = importlib.util.spec_from_file_location(
    "ch00_harness",
    Path(__file__).resolve().parents[1] / VARIANT / "harness.py")
harness = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(harness)

from shared.fake_model import FakeModel, say  # noqa: E402


class TestRawCall(unittest.TestCase):
    def test_returns_the_answer_text(self):
        model = FakeModel([say("4")])
        self.assertEqual(harness.ask(model, "What is 2+2?"), "4")

    def test_exactly_one_call(self):
        model = FakeModel([say("hi")])
        harness.ask(model, "hello")
        self.assertEqual(model.call_count, 1)

    def test_messages_shape_is_role_content_dicts(self):
        model = FakeModel([say("ok")])
        harness.ask(model, "hello")
        messages, _tools = model.calls[0]
        self.assertEqual(messages, [{"role": "user", "content": "hello"}])

    def test_system_prompt_goes_first(self):
        model = FakeModel([say("ok")])
        harness.ask(model, "hello", system="Be terse.")
        messages, _tools = model.calls[0]
        self.assertEqual(messages[0], {"role": "system", "content": "Be terse."})
        self.assertEqual(messages[1], {"role": "user", "content": "hello"})

    def test_no_tools_are_offered(self):
        model = FakeModel([say("ok")])
        harness.ask(model, "hello")
        _messages, tools = model.calls[0]
        self.assertFalse(tools)


if __name__ == "__main__":
    unittest.main()
