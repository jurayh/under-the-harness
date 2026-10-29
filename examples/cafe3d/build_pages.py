"""Build the café3d pages from their single sources.

scene.js is the scene, written once as an ES module. The two
shipped pages (index.html — the frozen spike scene; player.html
— the trace player) are self-contained single files, because a
learner double-clicks them: ES-module imports of a sibling file
are blocked from file://, while one inline module plus the
Three.js CDN import is not (verified in the spike). So this
script inlines: it strips scene.js's import lines and `export`
markers (the pages supply their own imports) and splices the
body into each template at /*__SCENE__*/ — and player_logic.js
into player.template.html at /*__PLAYER__*/.

Edit scene.js / player_logic.js / the templates, then re-run:

    python3 examples/cafe3d/build_pages.py
"""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent


def scene_body():
    src = (HERE / "scene.js").read_text()
    lines = []
    for line in src.splitlines():
        if line.startswith("import "):
            continue
        line = re.sub(r"^export (function|const) ", r"\1 ", line)
        lines.append(line)
    return "\n".join(lines)


def build(template_name, out_name, extra=None):
    page = (HERE / template_name).read_text()
    assert "/*__SCENE__*/" in page, template_name
    page = page.replace("/*__SCENE__*/", scene_body())
    for marker, source in (extra or {}).items():
        assert marker in page, (template_name, marker)
        page = page.replace(marker, (HERE / source).read_text())
    (HERE / out_name).write_text(page)
    print(f"{out_name}: {len(page)} bytes")


if __name__ == "__main__":
    build("index.template.html", "index.html")
    build("player.template.html", "player.html",
          {"/*__PLAYER__*/": "player_logic.js"})
