"""The café world's rule layer: event queue, triggers, deck.

Engine v2 (see the world spec). The world does not run on
canned sequences: it runs on a small event queue plus rules
that fire because state crossed a threshold, a scheduled time
arrived, or the agent acted. Scenario rules are DATA drawn
from a closed vocabulary — no arbitrary callables — so a
scenario stays auditable by reading it.

ANTI-SCOPE: complexity lives here (determinism, observability,
scoring), never in NPC cleverness. A regular is a routine, a
patience number, and two or three stock reactions; if a
behaviour can be a rule or a weighted draw, it is one.

Ordering contract: queued events fire in (time, seq) order —
seq is a monotone insertion counter, never dict or hash order.
After any clock movement or action the engine drains until
settled, BEFORE the observation is returned, so the agent
always sees a settled world and "what happened while you
worked" is exactly the notes list (see observation()).
"""
def _mins(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _hhmm(minutes):
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


class EventQueue:
    """Scheduled world events: deliveries, shocks, timers."""

    def __init__(self):
        self.items = []
        self.seq = 0

    def schedule(self, time, kind, payload):
        self.seq += 1
        self.items.append({"time": int(time), "seq": self.seq,
                           "kind": kind, "payload": payload})

    def due(self, clock):
        """Remove and return everything due, in (time, seq)."""
        ready = [e for e in self.items if e["time"] <= clock]
        self.items = [e for e in self.items if e["time"] > clock]
        return sorted(ready, key=lambda e: (e["time"], e["seq"]))

    def pending(self, kind=None):
        return [e for e in self.items
                if kind is None or e["kind"] == kind]


# --- The event deck -------------------------------------------------
# External texture, dealt not scripted: at each card's window
# open the card is evaluated once — one draw from the
# complications stream, in (window, card-id) order — and fires
# iff draw < p. Weights rank cards for authors; p is the
# mechanism. Six cards, no more (the spec's starting deck).

DECK = [
    {"id": "rush", "weight": 3, "p": 0.30,
     "window": ["11:45", "12:15"],
     "note": "a rush nobody scheduled just walked in"},
    {"id": "slow-morning", "weight": 2, "p": 0.30,
     "window": ["06:30", "07:30"],
     "note": "a slow morning — arrivals drift late"},
    {"id": "oven-hiccup", "weight": 3, "p": 0.25,
     "window": ["09:00", "11:00"],
     "note": "the oven is rattling again — out of order 30 min"},
    {"id": "delivery-mixup", "weight": 2, "p": 0.30,
     "window": ["13:00", "15:00"],
     "note": "the next delivery will arrive with a wrong item"},
    {"id": "difficult-customer", "weight": 2, "p": 0.25,
     "window": ["10:00", "16:00"],
     "note": "a difficult customer joins the queue, patience 5"},
    {"id": "surprise-regular", "weight": 1, "p": 0.20,
     "window": ["08:00", "16:00"],
     "note": "a regular turned up outside their routine"},
]
DECK_BY_ID = {c["id"]: c for c in DECK}


def deck_for(scenario):
    """The card dicts a scenario's deck config enables."""
    cfg = scenario.get("deck") or {}
    ids = cfg.get("cards")
    if ids is None:
        return list(DECK) if cfg else []
    return [DECK_BY_ID[i] for i in ids if i in DECK_BY_ID]


def evaluate_deck(world):
    """Evaluate every card whose window has opened. Returns
    True if anything was evaluated (the drain should re-check
    thresholds afterwards)."""
    if not world.weather_on or not world.deck_cards:
        return False
    pending = [c for c in world.deck_cards
               if c["id"] not in world._deck_done
               and _mins(c["window"][0]) <= world.clock]
    if not pending:
        return False
    for card in sorted(pending,
                       key=lambda c: (_mins(c["window"][0]),
                                      c["id"])):
        world._deck_done.add(card["id"])
        draw = world.rng.complications.random()
        if draw < card["p"]:
            apply_deck_card(world, card)
    return True


def apply_deck_card(world, card):
    rng = world.rng
    world._event("deck_card", card["id"])
    world._note(f"NOTE {_hhmm(world.clock)} — {card['note']}")
    cid = card["id"]
    if cid == "rush":
        for _ in range(rng.complications.randint(2, 4)):
            item = rng.complications.choice(world.scenario["menu"])
            world._add_ticket_now("Walk-in", item, 500)
    elif cid == "slow-morning":
        shift = rng.complications.randint(10, 20)
        world.shift_arrivals(_mins(card["window"][0]),
                             _mins(card["window"][1]), shift)
    elif cid == "oven-hiccup":
        world._oven_blocked_until = max(world._oven_blocked_until,
                                        world.clock + 30)
    elif cid == "delivery-mixup":
        world._delivery_mixup = True
    elif cid == "difficult-customer":
        item = rng.complications.choice(world.scenario["menu"])
        world._add_ticket_now("Difficult customer", item, 500,
                              patience=5)
    elif cid == "surprise-regular":
        names = [r["name"] for r in world.scenario["regulars"]]
        if names:
            world._surprise_regular(rng.npc.choice(names))


# --- Thresholds: patience and changed orders ------------------------

def thresholds(world):
    """State predicates that became true: a queued regular has
    waited past their patience (they leave — a walkout), a
    scenario order-change timer has fired. Returns True if
    anything fired."""
    fired = False
    for ticket in list(world.queue):
        limit = world.patience_for(ticket)
        if limit is not None \
                and world.clock - ticket["time"] > limit:
            world._walkout(ticket)
            fired = True
    for change in world.scenario.get("order_changes", []):
        key = change["customer"]
        if key in world._change_done:
            continue
        ticket = next((t for t in world.queue
                       if t["customer"] == key), None)
        if ticket is None or world.clock - ticket["time"] \
                < change.get("after_min", 10):
            continue
        world._change_done.add(key)
        if world.rng.npc.random() < change.get("p", 0.5):
            ticket["item"] = change["to"]
            world._event("order_changed",
                         f"{ticket['id']} -> {change['to']}")
            world._note(f"NOTE {_hhmm(world.clock)} — {key} "
                        f"changed their order to {change['to']}")
        fired = True
    return fired


# --- Scenario rules and shocks (closed vocabulary) ------------------

def _condition(world, cond):
    for key, want in cond.items():
        if key == "queue_len":
            actual = len(world.queue)
        elif key.startswith("stock:"):
            actual = world.stock.get(key.split(":", 1)[1], 0)
        else:
            return False
        op, num = want[:1], int(want[1:])
        if op == "<" and not actual < num:
            return False
        if op == ">" and not actual > num:
            return False
        if op == "=" and not actual == num:
            return False
    return True


def _effect(world, eff):
    if "emit_note" in eff:
        world._note(f"NOTE {_hhmm(world.clock)} — "
                    f"{eff['emit_note']}")
    if "adjust_stock" in eff:
        for item, delta in eff["adjust_stock"].items():
            world.stock[item] = world.stock.get(item, 0) + delta
    if "record_violation" in eff:
        world.record_violation(eff["record_violation"],
                               "scenario rule")
    if "add_tickets" in eff:
        world._add_extra_tickets(eff["add_tickets"])
    if "set_flag" in eff:
        world.flags.add(eff["set_flag"])


def evaluate_scenario_rules(world):
    fired = False
    for rule in world.scenario.get("rules", []):
        if rule.get("once", True) and rule["id"] in world._rules_done:
            continue
        on = rule.get("on", {})
        if "tick" in on and world.clock < _mins(on["tick"]):
            continue
        if all(_condition(world, c) for c in rule.get("if", [])):
            world._rules_done.add(rule["id"])
            world._event("rule_fired", rule["id"])
            for eff in rule.get("then", []):
                _effect(world, eff)
            fired = True
    return fired


def fire_shock(world, payload):
    kind = payload["kind"]
    world._event("shock", kind)
    if kind == "delivery_delayed":
        for ev in world._queue.pending("delivery"):
            ev["time"] += int(payload.get("by_min", 30))
        world._note(f"NOTE {_hhmm(world.clock)} — the supplier "
                    f"van is delayed")
    elif kind == "oven_blocked":
        world._oven_blocked_until = max(
            world._oven_blocked_until,
            world.clock + int(payload.get("minutes", 30)))
    elif kind == "add_tickets":
        world._add_extra_tickets(payload.get("tickets", []))


def fire_scheduled(world, ev):
    if ev["kind"] == "delivery":
        world._apply_delivery(ev["payload"])
    elif ev["kind"] == "shock":
        fire_shock(world, ev["payload"])


# --- The drain -------------------------------------------------------

def drain(world):
    """Settle the world: fire due events, evaluate the deck,
    scenario rules, and thresholds, repeating until nothing
    fires. Called after every clock movement and action, before
    the observation is returned. Arrivals are NOT drained here —
    they belong to tick() (the on_tick trigger), exactly as in
    v1, where serving never released the next ticket."""
    for _ in range(100):
        progressed = False
        for ev in world._queue.due(world.clock):
            fire_scheduled(world, ev)
            progressed = True
        if evaluate_deck(world):
            progressed = True
        if evaluate_scenario_rules(world):
            progressed = True
        if thresholds(world):
            progressed = True
        if not progressed:
            return


# --- Observations and live-mode flavour ------------------------------

def observation(world, result):
    """What an action returns to the tool layer: the result,
    the settled clock, and every world event since this actor's
    last action, as short note strings (§2.5 of the spec)."""
    return {"result": result, "clock": _hhmm(world.clock),
            "notes": world.drain_notes()}


def npc_voice(world, name, options, model):
    """Live mode only, and deliberately small: the model picks
    among options the NPC's rules already permit (a flavour
    choice, a phrasing) — the model proposes, the rules
    dispose. Any failure falls back to the first option. No
    graded path calls this."""
    if not options:
        return None
    try:
        resp = model([{"role": "user", "content":
                       f"{name}, a regular at The Morning Bell "
                       f"café, must choose one of: "
                       f"{', '.join(options)}. Reply with the "
                       f"choice only."}])
        text = (resp.text or "").strip().lower()
        for opt in options:
            if opt.lower() in text:
                return opt
    except Exception:
        pass
    return options[0]
