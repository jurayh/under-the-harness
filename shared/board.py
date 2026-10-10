"""The Morning Bell's café board.

One board, sixteen chapters. The board is the course's visible
thread: it starts as a bare counter with a chalkboard, and every
harness layer Tab gains adds the fixture that layer *is* in the
café -- the ticket rail for tools, the red allergy card for pinned
context, the regulars' card file for memory, the bell for
permissions, and so on.

Rendering is deterministic: the same chapter and state always
produce the same board. Standard library only.

    python -m shared.board 3        # print the chapter 3 board
"""
import html
import sys

DAY_MARKS = [
    "06:30 Open + ovens on",
    "07:00 First regulars",
    "08:15 School-run rush — never let the queue pass 3",
    "09:00 Two bakes, one oven",
    "10:00 Mina's order (school group)",
    "12:00 Lunch rush",
    "15:00 Supplier delivery",
    "17:30 Close + count the till",
]

TICKETS = ["#1 Sasha — oat-milk latte",
           "#2 Aldo — decaf + crossword",
           "#3 Mina + school group — cocoa (see red card)"]

REGULARS = ["Sasha — oat-milk latte, window seat",
            "Mina — age 9, peanut allergy (severe)",
            "Aldo — decaf, crossword, pays cash",
            "Priya — office order, Fridays"]

OPENING_LINE = ("open: ovens on · 8 day marks · first rush 08:15 "
                "· 3 tickets on the rail · stock: milk low")

# (first chapter it appears, key, title)
FIXTURES = [
    (1, "day", "DAY SHEET — pinned by the pass"),
    (2, "rail", "TICKET RAIL — only tickets from the rail are orders"),
    (3, "red", "RED CARD — centre of the board"),
    (4, "cards", "REGULARS' CARD FILE — a card is pulled only when needed"),
    (5, "bell", "THE BELL — Tab asks the owner first"),
    (6, "stations", "STATION PASSES"),
    (7, "spike", "TICKET SPIKE — the day, in order"),
    (8, "phone", "SUPPLIER PHONE — Bean & Co."),
    (9, "recipes", "RECIPE CARDS — by the register"),
    (10, "office", "OFFICE DOOR — locked"),
    (11, "score", "SERVICE SCOREBOARD — trial shifts"),
    (12, "hooks", "STANDING RULE CARDS — taped by the register"),
    (13, "plan", "PREP LIST — by the pass"),
    (14, "schedule", "SCHEDULE CARD — the week's standing jobs"),
    (15, "team", "TEAM BOARD — the pass, shared"),
]


def _state(state):
    s = {
        "tickets": list(TICKETS),
        "tickets_done": 0,
        "queue": 3,
        "stock_note": "milk low",
        "last_steps": [],
        "scores": {},
        "chalkboard": OPENING_LINE,
    }
    if state:
        s.update(state)
    world = s.pop("world", None)
    if world is not None:
        # Render a live CafeWorld (shared/cafe_world.py): the rail,
        # the spike and the clipboard all come from its snapshot.
        snap = world.snapshot()
        s["tickets_done"] = len(snap["completed"])
        s["queue"] = len(snap["queue"])
        if not s["last_steps"]:
            s["last_steps"] = [
                f"{e['clock']} {e['event']} {e['detail']}".rstrip()
                for e in snap["events"][-6:]]
        low = [k for k, v in sorted(snap["stock"].items()) if v <= 1]
        if low:
            s["stock_note"] = " + ".join(low) + " low"
    return s


def _panels(chapter, s):
    """[(title, [lines])] for every fixture chapter has earned."""
    panels = [("CHALKBOARD", [s["chalkboard"]])]
    earned = {key for first, key, _t in FIXTURES if chapter >= first}
    if "day" in earned:
        panels.append(("DAY SHEET — pinned by the pass", list(DAY_MARKS)))
    if "rail" in earned:
        done = int(s["tickets_done"])
        lines = [("✓ " if i < done else "· ") + t
                 for i, t in enumerate(s["tickets"])]
        lines.append(f"queue: {s['queue']}")
        panels.append(("TICKET RAIL — only tickets from the rail "
                       "are orders", lines))
    if "red" in earned:
        panels.append(("RED CARD — centre of the board",
                       ["NO PEANUTS AT THE PREP COUNTER, EVER."]))
    if "cards" in earned:
        panels.append(("REGULARS' CARD FILE — a card is pulled only "
                       "when needed", list(REGULARS)))
    if "bell" in earned:
        panels.append(("THE BELL — Tab asks the owner first",
                       ["spending money · giving food away · "
                        "opening or locking up"]))
    if "stations" in earned:
        panels.append(("STATION PASSES",
                       ["BARISTA — drinks only", "BAKER — ovens only",
                        "TILL — money only"]))
    if "spike" in earned:
        steps = list(s["last_steps"]) or ["(no run spiked yet)"]
        panels.append(("TICKET SPIKE — the day, in order", steps))
    if "phone" in earned:
        panels.append(("SUPPLIER PHONE — Bean & Co.",
                       ["their system, their list — Tab asks what "
                        "they can do today"]))
    if "recipes" in earned:
        panels.append(("RECIPE CARDS — by the register",
                       ["morning-open", "plan-a-party-order",
                        "(the full card is read only when the job "
                        "matches)"]))
    if "office" in earned:
        panels.append(("OFFICE DOOR — locked",
                       ["accounts inside · big orders get a second "
                        "pair of eyes"]))
    if "score" in earned:
        scores = s["scores"]
        if scores:
            lines = [f"{name}: {score}" for name, score in
                     sorted(scores.items())]
        else:
            lines = ["trial shifts on days Tab has never seen — "
                     "scored like an owner reviewing the day"]
        panels.append(("SERVICE SCOREBOARD — trial shifts", lines))
    if "hooks" in earned:
        panels.append(("STANDING RULE CARDS — taped by the register",
                       ["pre-tool — the secret guard reads every send "
                        "before it leaves",
                        "pre-compact — the red card line is re-pinned "
                        "to the pad",
                        "stop — the day is spiked and the till "
                        "counted"]))
    if "plan" in earned:
        panels.append(("PREP LIST — by the pass",
                       ["✓ 06:40 read the day sheet, settle the "
                        "bake order",
                        "▶ 09:00 muffins in first — cocoa batch "
                        "at 09:20",
                        "· 17:30 count the till, file the list"]))
    if "schedule" in earned:
        panels.append(("SCHEDULE CARD — the week's standing jobs",
                       ["05:45 preheat check — daily",
                        "06:00 stock check — daily "
                        "(if missed: catch up)",
                        "Mon 09:00 supplier order "
                        "(if missed: alert the owner)",
                        "Fri 16:30 Priya reminder "
                        "(if missed: skip)"]))
    if "team" in earned:
        panels.append(("TEAM BOARD — the pass, shared",
                       ["counter → baker: a handoff — goal, "
                        "constraints verbatim, budget, return",
                        "rail claims: one name per ticket — "
                        "p3 barista · p4 baker",
                        "last banana muffin: RESERVED for m1 "
                        "(the promise is the world's, not a note)"]))
    return panels


def render_board(chapter, state=None):
    """The board as monospace text (for print and terminals)."""
    chapter = max(0, min(15, int(chapter)))
    s = _state(state)
    width = 66
    out = ["=" * width,
           f"  THE MORNING BELL — Tab's board (chapter {chapter})",
           "  Counter: Tab at the pass" +
           (" · stock clipboard: " + s["stock_note"]
            if chapter >= 2 else ""),
           "=" * width]
    for title, lines in _panels(chapter, s):
        out.append(f"[{title}]")
        out.extend("  " + ln for ln in lines)
    out.append("=" * width)
    return "\n".join(out)


def render_board_html(chapter, state=None):
    """The board as a small self-contained HTML fragment.

    For notebook display; callers should fall back to
    render_board() if HTML display is unavailable.
    """
    chapter = max(0, min(15, int(chapter)))
    s = _state(state)
    parts = [
        "<div style=\"font-family:Georgia,serif;background:#fff8ec;"
        "border:2px solid #8a5a2b;border-radius:10px;padding:12px;"
        "max-width:680px;color:#3b2a17\">",
        f"<div style=\"font-size:18px;font-weight:bold\">"
        f"☕ The Morning Bell — Tab's board "
        f"<span style=\"font-size:12px\">(chapter {chapter})</span></div>",
        "<div style=\"font-size:12px;margin:4px 0 8px\">Counter: "
        "Tab at the pass</div>",
    ]
    for title, lines in _panels(chapter, s):
        hot = "background:#fde8e8;border-color:#b3261e" \
            if title.startswith("RED CARD") else \
            "background:#fff;border-color:#d9c39a"
        parts.append(
            f"<div style=\"border:1px solid;border-radius:8px;"
            f"padding:6px 8px;margin:6px 0;{hot}\">"
            f"<div style=\"font-weight:bold;font-size:12px;"
            f"letter-spacing:.04em\">{html.escape(title)}</div>")
        for ln in lines:
            parts.append(
                f"<div style=\"font-size:13px\">"
                f"{html.escape(str(ln))}</div>")
        parts.append("</div>")
    parts.append("</div>")
    return "".join(parts)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            n = int(sys.argv[1])
        except ValueError:
            n = -1
        if not 0 <= n <= 15:
            print(f"error: board stages run 0-15 (got "
                  f"{sys.argv[1]!r})", file=sys.stderr)
            sys.exit(2)
    else:
        n = 0
    print(render_board(n))
