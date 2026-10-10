"""Your progress passport: one stamp per finished chapter.

Each notebook's last cell calls ``stamp()``. It keeps a small
markdown card -- ``my-progress.md`` -- in the directory the
notebook runs from. The card is learner property: it is listed
in .gitignore and never committed.

Idempotent: re-running a notebook re-prints the card and keeps
the date of the first stamp. Never raises: a passport problem
must not fail a chapter the learner just finished.

Beyond the chapters, ``stamp_extra()`` records honours that
are not chapters — ★ lines under the list, beginning with the
capstone's authored-a-scenario stamp. Extras never count
toward the chapter total.
"""
from datetime import date
from pathlib import Path

# The sixteen chapters and their principles (see PRINCIPLES.md).
CHAPTERS = [
    (0, "The model is stateless. The harness owns the conversation."),
    (1, "A loop is a budget, not a while-true."),
    (2, "Tools are contracts. The schema is the promise, and errors "
        "are data, not exceptions."),
    (3, "Compaction is lossy compression of your own instructions. "
        "Pin what must not be lost."),
    (4, "Memory is a filing decision. Store deliberately, load "
        "deliberately."),
    (5, "Permissions are a threat model, not a dialog box."),
    (6, "A subagent is a fresh context with a narrow job. Isolation "
        "is the feature."),
    (7, "If you can't replay the run, you can't debug the agent."),
    (8, "A protocol is a registry you don't own. Discover, don't "
        "hardcode."),
    (9, "A skill is context delivered just in time. Advertise cheap, "
        "load late."),
    (10, "One gate is not a defense. Contain in layers, and assume "
         "the model will be talked into it."),
    (11, "An agent you can't measure is an agent you're guessing "
         "about."),
    (12, "A hook runs because the harness runs it, not because "
         "the model remembered to."),
    (13, "Write the plan before the rush. Check the work against "
         "the list, not against memory."),
    (14, "The schedule decides when; the loop decides how. A "
         "missed run is a policy, not a surprise."),
    (15, "Coordination is a contract: what a handoff drops, "
         "the team loses."),
]

FILE = "my-progress.md"
HEADER = "# My progress — Under the Harness"


def _read_stamps(path):
    """{chapter: iso-date} from an existing card, forgiving of edits."""
    stamps = {}
    try:
        for line in path.read_text().splitlines():
            if line.startswith("✓ Ch "):
                number = int(line.split("—")[0].split()[-1])
                stamps[number] = line.rsplit("—", 1)[-1].strip()
    except Exception:
        pass  # a missing or mangled card just starts fresh
    return stamps


def _read_extras(path):
    """{label: iso-date} for the card's ★ lines — the honours
    that are not chapters (the capstone's, today). Chapter
    totals never count them; that is the point of the split."""
    extras = {}
    try:
        for line in path.read_text().splitlines():
            if line.startswith("★ "):
                label, _, when = line[2:].rpartition(" — ")
                if label and when:
                    extras[label] = when.strip()
    except Exception:
        pass
    return extras


def _render(stamps, overrides=None, extras=None):
    principles = dict(CHAPTERS)
    if overrides:
        principles.update(overrides)
    lines = [HEADER, ""]
    for number, _principle in CHAPTERS:
        if number in stamps:
            lines.append(f"✓ Ch {number} — {principles[number]}"
                         f" — {stamps[number]}")
        else:
            lines.append(f"· Ch {number} — {principles[number]}")
    lines += ["", f"{len(stamps)} of {len(CHAPTERS)} chapters "
                  f"stamped."]
    for label, when in (extras or {}).items():
        lines.append(f"★ {label} — {when}")
    return "\n".join(lines) + "\n"


def stamp(chapter, principle):
    """Record *chapter* as finished; return the card text.

    The principle passed in is the one printed for this chapter,
    so a notebook and PRINCIPLES.md can never silently disagree
    on the card.
    """
    try:
        path = Path.cwd() / FILE
        stamps = _read_stamps(path)
        if chapter not in stamps:
            stamps[chapter] = date.today().isoformat()
        card = _render(stamps, {chapter: principle},
                       _read_extras(path))
        path.write_text(card)
        return card
    except Exception:
        # Last resort: still hand the learner their card.
        return _render({chapter: date.today().isoformat()},
                       {chapter: principle})


def stamp_extra(label):
    """Record an honour that is not a chapter — a ★ line under
    the chapter list. The "N of 16 chapters" total is computed
    from chapter stamps only, so an extra never inflates it.
    Idempotent, never raises: same contract as stamp()."""
    try:
        path = Path.cwd() / FILE
        stamps = _read_stamps(path)
        extras = _read_extras(path)
        if label not in extras:
            extras[label] = date.today().isoformat()
        card = _render(stamps, extras=extras)
        path.write_text(card)
        return card
    except Exception:
        return _render({}, extras={label: date.today().isoformat()})


def stamp_capstone():
    """The authored-a-scenario honour, from the capstone's
    authoring finale (capstone/authoring.md)."""
    return stamp_extra("Capstone — authored a scenario")
