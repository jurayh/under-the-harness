"""Seeded randomness for the café world — layered determinism.

The world is allowed to be surprising; it is not allowed to be
unrepeatable. Every random draw in the engine comes from one of
four named streams, each an independent random.Random seeded
from the run's seed by string composition:

    Random(f"{seed}::{stream_name}")

Streams are independent by construction: adding a deck card
(complications draws) cannot perturb arrival jitter (arrivals
draws), so tuning one system never silently re-rolls another
system's day. There is no unseeded randomness anywhere in the
engine — no module-level random calls, no wall clock.

A seed is a human-shareable string:

    morning-bell-0042-comet
    └─ café slug ─┘ └nº┘ └codename┘

The number is for humans to enumerate; the codename is part of
the hash, so …-0042-comet and …-0042-rain are different days.
A seed pins every draw on all four streams, in call order.
Combined with the scenario and the agent's action sequence,
that is the whole run:

    run = f(scenario, seed, action sequence)
"""
import random

STREAMS = ("arrivals", "complications", "npc", "stock")

DEFAULT_SEED = "morning-bell-0000-plain"


class WorldRNG:
    """The four seeded streams for one run."""

    def __init__(self, seed=DEFAULT_SEED):
        self.seed = str(seed)
        for name in STREAMS:
            setattr(self, name, random.Random(f"{self.seed}::{name}"))

    def __repr__(self):
        return f"WorldRNG({self.seed!r})"
