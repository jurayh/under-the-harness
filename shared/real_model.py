"""A real model behind the exact same interface as FakeModel.

    model(messages, tools=None) -> ModelResponse

Provider specifics live in this file and nowhere else; the harness code
in every chapter is provider-clean. Standard library only (urllib).

Provider selection (first match wins):
  1. $HARNESS_PROVIDER if set ("openai" | "anthropic" | "meta")
  2. "openai"    if $OPENAI_API_KEY is set
  3. "anthropic" if $ANTHROPIC_API_KEY is set
  4. "meta"      the connected Meta Model API (api.meta.ai), authorised
                 via hsurr:* credential surrogates -- see the
                 meta-model-api skill. No raw key is read or stored.

Model name: $HARNESS_MODEL, or a per-provider default below.
"""
import json
import os
import sys
import urllib.request
import urllib.error

from shared.model_types import ModelResponse, ToolCall

DEFAULT_MODELS = {
    "openai": "gpt-4o-mini",
    "anthropic": "claude-sonnet-4-5",
    "meta": "muse-spark-1.3",
}


def _post_json(url, body, headers, timeout=120):
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 method="POST")
    req.add_header("Content-Type", "application/json")
    for k, v in headers.items():
        req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


class RealModel:
    def __init__(self, model=None, provider=None):
        self.provider = (provider or os.environ.get("HARNESS_PROVIDER")
                         or self._detect())
        self.model = (model or os.environ.get("HARNESS_MODEL")
                      or DEFAULT_MODELS[self.provider])

    @staticmethod
    def _detect():
        if os.environ.get("OPENAI_API_KEY"):
            return "openai"
        if os.environ.get("ANTHROPIC_API_KEY"):
            return "anthropic"
        return "meta"

    def __call__(self, messages, tools=None):
        return getattr(self, f"_call_{self.provider}")(messages, tools or [])

    # -- OpenAI Chat Completions -------------------------------------------
    def _call_openai(self, messages, tools):
        wire = []
        for m in messages:
            if m["role"] == "tool":
                wire.append({"role": "tool", "tool_call_id": m["tool_call_id"],
                             "content": m["content"]})
            elif m.get("tool_calls"):
                wire.append({"role": "assistant", "content": m.get("content", ""),
                             "tool_calls": [
                                 {"id": tc.id, "type": "function",
                                  "function": {"name": tc.name,
                                               "arguments": json.dumps(tc.arguments)}}
                                 for tc in m["tool_calls"]]})
            else:
                wire.append({"role": m["role"], "content": m.get("content", "")})
        body = {"model": self.model, "messages": wire, "temperature": 0}
        if tools:
            body["tools"] = [{"type": "function", "function": {
                "name": t["name"], "description": t.get("description", ""),
                "parameters": t["parameters"]}} for t in tools]
        payload = _post_json("https://api.openai.com/v1/chat/completions", body,
                             {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"})
        msg = payload["choices"][0]["message"]
        calls = tuple(ToolCall(id=tc["id"], name=tc["function"]["name"],
                               arguments=json.loads(tc["function"]["arguments"] or "{}"))
                      for tc in msg.get("tool_calls") or [])
        return ModelResponse(text=msg.get("content") or "", tool_calls=calls)

    # -- Anthropic Messages -------------------------------------------------
    def _call_anthropic(self, messages, tools):
        system = "\n".join(m["content"] for m in messages if m["role"] == "system")
        wire = []
        for m in messages:
            if m["role"] == "system":
                continue
            if m["role"] == "tool":
                wire.append({"role": "user", "content": [
                    {"type": "tool_result", "tool_use_id": m["tool_call_id"],
                     "content": m["content"]}]})
            elif m.get("tool_calls"):
                blocks = ([{"type": "text", "text": m["content"]}] if m.get("content") else [])
                blocks += [{"type": "tool_use", "id": tc.id, "name": tc.name,
                            "input": tc.arguments} for tc in m["tool_calls"]]
                wire.append({"role": "assistant", "content": blocks})
            else:
                wire.append({"role": m["role"],
                             "content": [{"type": "text", "text": m.get("content", "")}]})
        body = {"model": self.model, "max_tokens": 1024, "temperature": 0,
                "messages": wire}
        if system:
            body["system"] = system
        if tools:
            body["tools"] = [{"name": t["name"],
                              "description": t.get("description", ""),
                              "input_schema": t["parameters"]} for t in tools]
        payload = _post_json("https://api.anthropic.com/v1/messages", body,
                             {"x-api-key": os.environ["ANTHROPIC_API_KEY"],
                              "anthropic-version": "2023-06-01"})
        text, calls = "", []
        for block in payload.get("content", []):
            if block["type"] == "text":
                text += block["text"]
            elif block["type"] == "tool_use":
                calls.append(ToolCall(id=block["id"], name=block["name"],
                                      arguments=block.get("input") or {}))
        return ModelResponse(text=text, tool_calls=tuple(calls))

    # -- Meta Model API (Responses API shape) --------------------------------
    def _call_meta(self, messages, tools):
        wire = []
        for m in messages:
            if m["role"] == "tool":
                wire.append({"type": "function_call_output",
                             "call_id": m["tool_call_id"], "output": m["content"]})
            elif m.get("tool_calls"):
                if m.get("content"):
                    wire.append({"type": "message", "role": "assistant",
                                 "content": [{"type": "output_text",
                                              "text": m["content"]}]})
                for tc in m["tool_calls"]:
                    wire.append({"type": "function_call", "call_id": tc.id,
                                 "name": tc.name,
                                 "arguments": json.dumps(tc.arguments)})
            else:
                wire.append({"type": "message", "role": m["role"],
                             "content": [{"type": "input_text"
                                           if m["role"] != "assistant"
                                           else "output_text",
                                           "text": m.get("content", "")}]})
        body = {"model": self.model, "input": wire, "stream": False,
                "temperature": 0}
        if tools:
            body["tools"] = [{"type": "function", "name": t["name"],
                              "description": t.get("description", ""),
                              "parameters": t["parameters"]} for t in tools]

        # Auth via hsurr:* surrogate, api.meta.ai only. Never a raw key.
        sys.path.insert(0, "/opt/hatch/skills/skill-creator/bin")
        from dynamic_credentials import add_surrogate_to_request, read_json_response
        req = urllib.request.Request("https://api.meta.ai/v1/responses",
                                     data=json.dumps(body).encode(), method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")
        add_surrogate_to_request(req, "custom.meta-model-api",
                                 entry_name="access_token",
                                 allowed_hosts=("api.meta.ai",))
        with urllib.request.urlopen(req, timeout=120) as resp:
            payload = read_json_response(resp)

        text, calls = "", []
        for item in payload.get("output", []):
            if item.get("type") == "message":
                for part in item.get("content", []):
                    if part.get("type") == "output_text":
                        text += part.get("text", "")
            elif item.get("type") == "function_call":
                calls.append(ToolCall(
                    id=item.get("call_id") or item.get("id"),
                    name=item["name"],
                    arguments=json.loads(item.get("arguments") or "{}")))
        return ModelResponse(text=text, tool_calls=tuple(calls))
