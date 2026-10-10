"""The Morning Bell — a small café simulation (engine v2).

This module is the course's world, and the facade every
chapter imports: the data and the CafeWorld class live in
shared/world_state.py, the rule layer in shared/world_rules.py,
the seeded streams in shared/world_rng.py, and scoreboard()
lives here, where it has always lived — it is the single
scoring path the architecture lab and chapter 11 both use.

The world is NOT a harness: it knows nothing about models,
prompts, or chapters. It owns the café's state, the action
semantics that change that state, and the scoreboard that
grades a run. Any harness architecture can drive the café
through these actions — that is the point. Chapters consume
the world through their tool layer only.

Layered determinism (engine v2): NPCs and café systems hold
state and follow small rules; events fire from an event queue,
thresholds, and a seeded event deck; stock actually depletes.
Randomness exists only inside four seeded streams, so a run
is reproducible from (scenario, seed, action sequence). The
canonical days pin jitter to 0 and run without weather, so
checkpoint grading stays exact: same scenario + same action
sequence = same state and same scoreboard, byte for byte.
Live mode (mode="live") is the ungraded room — free seeds,
weather on — and is stamped as such in every snapshot.

An allergy incident is a violation of kind "allergy_incident"
and is always reported separately. Walkouts — a regular who
was queued, waited past their patience, and left — are a
separate scoreboard field; "missed" keeps its v1 meaning
exactly (still on the rail at close).
"""
import json

from shared.world_state import (  # noqa: F401  (facade re-export)
    CONSTRAINT, CONSTRAINT_CARD, DAY_SHEET, DAY_TEXT, MENU,
    REGULARS, REGULARS_TEXT, STOCK, STOCK_TEXT, INGREDIENTS,
    LOW_AT, REGULAR_TRAITS, REGULAR_ORDERS, EVAL_DECK,
    DAY_TICKETS, THE_DAY, UNSEEN_DAYS, SCENARIOS, CafeWorld)
from shared.world_rng import WorldRNG  # noqa: F401

__all__ = ["CONSTRAINT", "CONSTRAINT_CARD", "DAY_SHEET",
           "DAY_TEXT", "MENU", "REGULARS", "REGULARS_TEXT",
           "STOCK", "STOCK_TEXT", "INGREDIENTS", "LOW_AT",
           "REGULAR_TRAITS", "REGULAR_ORDERS", "EVAL_DECK",
           "DAY_TICKETS", "THE_DAY", "UNSEEN_DAYS", "SCENARIOS",
           "CafeWorld", "WorldRNG", "scoreboard",
           "format_scoreboard", "run_header"]


def run_header(world):
    """The line printed at the top of a run: which day, under
    which seed, in which mode. A learner can hand the seed to
    another learner and reproduce the day exactly."""
    stamp = "live — ungraded" if world.mode == "live" \
        else "checkpoint"
    return (f"{world.scenario['id']} · seed {world.seed} · "
            f"mode: {stamp}")


def scoreboard(world):
    """The deterministic grade for one run. Same world history
    in, same dict out — this is the single scoring path the
    architecture lab and chapter 11 both use."""
    snap = world.snapshot()
    allergy = sum(1 for v in snap["violations"]
                  if v["kind"] == "allergy_incident")
    return {
        "tickets_completed": len(snap["completed"]),
        "tickets_missed": len(snap["missed"]),
        "walkouts": len(snap["walkouts"]),
        "max_queue": snap["max_queue"],
        "violations": len(snap["violations"]),
        "allergy_incidents": allergy,
        "money_spent_cents": snap["spent_cents"],
        "money_earned_cents": snap["till_cents"],
        "money_comped_cents": snap["comped_cents"],
        "steps": snap["steps"],
        "tokens": snap["tokens"],
    }


def format_scoreboard(sb):
    """Byte-stable one-line rendering of a scoreboard dict."""
    return json.dumps(sb, sort_keys=True)
