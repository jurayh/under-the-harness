"""Export café filmstrips for the diorama trace player.

A filmstrip is one run of the canonical Day, recorded step by
step: every step carries the numbered trace line (chapter 7's
identity), the sim clock, and a world snapshot in the diorama's
STATE vocabulary (examples/cafe3d/scene.js). The player replays
the steps; nothing in a filmstrip is hand-authored — this script
runs the course's own machinery and writes down what it did.

The machinery, exactly:

  * the world — shared.cafe_world.CafeWorld on "the-day"
    (checkpoint mode: canonical seed morning-bell-0001-bell,
    weather off), recorded through a CafeWorld subclass that
    snapshots after every public action;
  * the drivers — examples/architecture_lab.py's two Ch 3
    policies: pinned_policy ("Ch 3, done right: the red card
    survives compaction") and gist_policy ("Ch 3, the failure:
    the summary drops the red card"). The chapter 3 harness
    itself works on message lists and cannot drive the world;
    the architecture lab is the course machinery that runs
    this exact contrast — careful vs gist compaction — on the
    canonical Day, and chapter 11 scores through the same
    world. The lab policies are stand-ins for the two
    architectures; the world, the tickets, and the allergy
    incident are the real ones.

Determinism: same machinery, same seed, same actions — the
exporter run twice writes byte-identical files (verified by
hash; see CAFE3D_PLAYER_REPORT.md).

    python3 examples/cafe3d/export_filmstrips.py
"""
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "examples"))

from shared.cafe_world import CafeWorld, LOW_AT, scoreboard  # noqa: E402
import architecture_lab as lab  # noqa: E402

DAY = "the-day"

# Figure kinds by customer: the diorama's cast vocabulary.
KIND = {"Mina": "kid", "Sasha": "sasha"}
# Where a seated regular sits in the diorama.
SEAT = {"Sasha": "seat:window", "Aldo": "seat:stool",
        "Mina": "seat:table", "Priya": "seat:table2"}
# Tab's station per world action.
STATION = {"serve_ticket": "pass", "place_on_prep": "prep",
           "clear_prep": "prep", "bake_at": "oven",
           "order_stock": "till", "comp_item": "till",
           "tick": "counter", "close_day": "till", "open": "counter"}


def _kind(ticket):
    return KIND.get(ticket["customer"], "adult")


def _ticket_label(t):
    return f"#{t['id'][1:]} {t['customer']} — {t['item']}"


def _stock_note(stock):
    low = [k for k in sorted(stock) if stock[k] <= LOW_AT.get(k, 1)]
    return " + ".join(low) + " low" if low else "all stocked"


class RecordingWorld(CafeWorld):
    """A CafeWorld that writes a filmstrip as it is driven.

    One step per public action that changes the presentation
    state or fires an event; pure accounting calls (record_step,
    charge_tokens) and no-op ticks are not steps."""

    ACTIONS = ("tick", "serve_ticket", "place_on_prep",
               "clear_prep", "bake_at", "order_stock", "comp_item",
               "close_day")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.film = []
        self._last_key = None

    # -- step recording -------------------------------------------
    def _state(self, action):
        snap = self.snapshot()
        verb = action[0] if action else "open"
        figures, seen = [], set()

        def put(key, kind, where, label):
            if key in seen:  # later writes win (the pass staging)
                for f in figures:
                    if f["key"] == key:
                        f.update(kind=kind, where=where, label=label)
                return
            seen.add(key)
            figures.append({"key": key, "kind": kind,
                            "where": where, "label": label})

        for i, t in enumerate(snap["queue"]):
            put("cust:" + t["id"], _kind(t), f"queue:{i}",
                t["customer"])
        for name, npc in snap["npcs"].items():
            if npc["presence"] == "seated":
                done = [t for t in snap["completed"]
                        if t["customer"] == name]
                if done:
                    put("cust:" + done[-1]["id"], KIND.get(name, "adult"),
                        SEAT[name], name)
        holding = None
        if verb == "serve_ticket":
            tid = action[1]
            done = [t for t in snap["completed"] if t["id"] == tid]
            if done:
                t = done[0]
                holding = t["item"]
                # staging, from the state: the customer whose
                # ticket was just served stands at the pass
                # for this step, cup in hand, before moving on.
                put("cust:" + tid, _kind(t), "pass", t["customer"])
        elif verb == "place_on_prep":
            holding = action[1]

        tab_action = {
            "open": "opens the café",
            "tick": "watches the door",
            "clear_prep": "clears the prep counter",
            "bake_at": "books the oven",
            "order_stock": "phones the supplier",
            "close_day": "counts the till",
        }.get(verb)
        if verb == "serve_ticket":
            tab_action = f"serves {action[1]}"
        elif verb == "place_on_prep":
            tab_action = f"puts {action[1]} on the prep counter"
        elif verb == "comp_item":
            tab_action = f"comps {action[1]}"
        return {
            "clock": snap["clock"],
            "rail": [{"id": t["id"], "n": int(t["id"][1:]),
                      "item": t["item"], "label": _ticket_label(t)}
                     for t in snap["queue"]],
            "completed": [t["id"] for t in snap["completed"]],
            "figures": figures,
            "tab": {"station": STATION[verb], "action": tab_action,
                    "holding": holding},
            "prep": list(snap["prep_counter"]),
            "stock": {k: snap["stock"][k] for k in sorted(snap["stock"])},
            "stockNote": _stock_note(snap["stock"]),
            "threat": any("peanut" in p.lower()
                          for p in snap["prep_counter"]),
        }

    def _caption(self, action, new_events, result):
        verb = action[0] if action else "open"
        arrivals = [e for e in new_events
                    if e["event"] == "ticket_arrived"]
        by_id = {t["id"]: t for t in self.scenario["tickets"]}
        if verb == "open":
            text = ("open — ovens on; the day sheet is by the pass "
                    "and the red card is on the counter")
        elif verb == "tick" and arrivals:
            text = "; ".join(
                f"ticket {e['detail']} arrives — "
                f"{by_id[e['detail']]['customer']}, "
                f"{by_id[e['detail']]['item']}" for e in arrivals)
        elif verb == "tick":
            text = "the clock moves on"
        elif verb == "serve_ticket":
            t = by_id[action[1]]
            text = (f"Tab serves {action[1]} — {t['item']} "
                    f"for {t['customer']}")
        elif verb == "place_on_prep":
            text = f"Tab puts {action[1]} on the prep counter"
        elif verb == "clear_prep":
            text = "Tab clears the prep counter"
        elif verb == "close_day":
            text = "close — Tab counts the till; the Day is done"
        else:
            text = verb.replace("_", " ")
        for e in new_events:
            if e["event"].startswith("violation:"):
                text += f" · violation: {e['detail']}"
        return text

    def _record(self, action, new_events, result=None):
        state = self._state(action)
        violations = [e for e in new_events
                      if e["event"].startswith("violation:")]
        key = json.dumps(state, sort_keys=True)
        if key == self._last_key and not new_events:
            return                      # a no-op action: not a step
        self._last_key = key
        n = len(self.film) + 1
        caption = self._caption(action, new_events, result)
        verb = action[0] if action else "open"
        act = {"verb": verb}
        if verb in ("serve_ticket", "comp_item"):
            act["ticket"] = action[1]
        if verb in ("serve_ticket", "place_on_prep"):
            act["item"] = (self._state_ticket_item(action)
                           if verb == "serve_ticket" else action[1])
        self.film.append({
            "n": n,
            "step_id": f"step-{n}",
            "clock": state["clock"],
            "caption": caption,
            "trace": f"step-{n} · {state['clock']} · {caption}",
            "action": act,
            "state": state,
            "threat": bool(state["threat"] or violations),
            "violation": ({"kind": violations[0]["event"].split(":", 1)[1],
                           "detail": violations[0]["detail"]}
                          if violations else None),
        })

    def _state_ticket_item(self, action):
        for t in self.scenario["tickets"]:
            if t["id"] == action[1]:
                return t["item"]
        return None

    def begin(self):
        self._record(None, [])

    # -- the wrapped actions ---------------------------------------
    def _wrap(self, name, fn, *args, **kwargs):
        before = len(self.events)
        result = fn(*args, **kwargs)
        self._record((name,) + tuple(args[:2]),
                     self.events[before:], result)
        return result

    def tick(self, *a, **k):
        return self._wrap("tick", super().tick, *a, **k)

    def serve_ticket(self, *a, **k):
        return self._wrap("serve_ticket", super().serve_ticket, *a, **k)

    def place_on_prep(self, *a, **k):
        return self._wrap("place_on_prep", super().place_on_prep, *a, **k)

    def clear_prep(self, *a, **k):
        return self._wrap("clear_prep", super().clear_prep, *a, **k)

    def bake_at(self, *a, **k):
        return self._wrap("bake_at", super().bake_at, *a, **k)

    def order_stock(self, *a, **k):
        return self._wrap("order_stock", super().order_stock, *a, **k)

    def comp_item(self, *a, **k):
        return self._wrap("comp_item", super().comp_item, *a, **k)

    def close_day(self, *a, **k):
        return self._wrap("close_day", super().close_day, *a, **k)


FILMSTRIPS = [
    {"id": "careful", "policy": "pinned_policy",
     "file": "filmstrip_careful.json",
     "title": "Careful Tab — the red card survives",
     "harness": "Chapter 3's careful compaction: CONSTRAINT lines "
                "are pinned and carried verbatim through every "
                "summary, so the red card is still on the pad "
                "at 10:00."},
    {"id": "gist", "policy": "gist_policy",
     "file": "filmstrip_gist.json",
     "title": "Gist Tab — the summary drops the red card",
     "harness": "Chapter 3's failure: compaction replaces the "
                "morning with a fluent gist; the constraint is "
                "not gist, so it is gone — and at 10:00 Tab "
                "pre-makes with peanut crunch topping."},
]


def build(spec):
    world = RecordingWorld(DAY)
    world.begin()
    getattr(lab, spec["policy"])(world)
    return {
        "format": "cafe3d-filmstrip/1",
        "id": spec["id"],
        "title": spec["title"],
        "harness_note": spec["harness"],
        "day": DAY,
        "seed": world.seed,
        "mode": world.mode,
        "machinery": {
            "world": "shared.cafe_world.CafeWorld (recorded via a "
                     "snapshot-after-every-action subclass)",
            "driver": f"examples/architecture_lab.py:{spec['policy']}",
            "scoreboard": "shared.cafe_world.scoreboard",
        },
        "scoreboard": scoreboard(world),
        "steps": world.film,
    }


def main():
    out = {}
    for spec in FILMSTRIPS:
        film = build(spec)
        text = json.dumps(film, indent=1, sort_keys=True,
                          ensure_ascii=False) + "\n"
        (HERE / spec["file"]).write_text(text)
        out[spec["id"]] = film
        digest = hashlib.sha256(text.encode()).hexdigest()
        sb = film["scoreboard"]
        print(f"{spec['file']}: {len(film['steps'])} steps · "
              f"violations={sb['violations']} "
              f"allergy={sb['allergy_incidents']} · sha256 {digest}")
    js = ("// Generated by export_filmstrips.py — the two filmstrips "
          "as a script-tag include, so player.html also works from "
          "file:// (fetch of JSON is blocked there; a classic "
          "script is not).\nwindow.FILMSTRIPS = "
          + json.dumps(out, sort_keys=True, ensure_ascii=False)
          + ";\n")
    (HERE / "filmstrips.js").write_text(js)
    digest = hashlib.sha256(js.encode()).hexdigest()
    print(f"filmstrips.js: sha256 {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
