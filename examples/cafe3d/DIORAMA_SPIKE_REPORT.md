# Café diorama — spike report

**What this is:** a one-scene, judged spike (approved Oct 26, 2026).
An isometric 3D diorama of The Morning Bell at the 08:15 school-run
rush, rendered in the browser. It is the board's third rendering —
text, HTML, now miniature — and a *frozen moment*, nothing more.

**What this is not:** a trace player. Nothing in the scene moves
between world states; the figures hold one instant of the Day.
Whether it ever becomes a player is the follow-on decision this
spike exists to inform.

## Files

| File | Size | Notes |
|---|---|---|
| `index.html` | 31.6 KB | The whole spike: markup, styles, and the scene script in one file. No sibling JS/CSS, no external model files — all geometry is built in code. |
| `snapshot.png` | 1.01 MB, 2250 × 1500 | The judgment artifact. Default camera, rendered headlessly from the shipped page (see Verification). |
| `DIORAMA_SPIKE_REPORT.md` | — | This file. |

## Tech

- **Three.js 0.160.0**, pinned, via an import map in the page head:
  `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`
  and `three/addons/` →
  `https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/`
  (`OrbitControls` is the only addon used). WebGL, orthographic
  camera for the true isometric read.
- **Controls:** orbit constrained to a pleasant band — polar angle
  0.62–1.18 rad (never top-down flat, never under the floor),
  azimuth ±0.85 rad around the default view, zoom 0.65–2.4, pan
  off. Gentle auto-rotate (−0.5 speed) that stops permanently on
  the first interaction.
- **Light:** one warm directional "sun" through the window wall
  (soft shadows, 2048px map), hemisphere ambient, two warm point
  lights (counter pendants, oven). ACES tone mapping.
- **Idle life only:** Tab's serving arm loops, tickets sway on the
  rail, steam rises over two cups, the oven glow breathes. All
  motion is a function of wall-clock time, so any frame is
  representative.
- Textures (chalkboard menu, tickets, red card, day sheet, floor
  planks) are drawn on `<canvas>` at runtime — no image assets.

## The scene, tied to the Day

A `STATE` object at the top of the script holds every number the
scene shows, each commented with its source. Frozen at board
stage 0:

- **Clock 08:15** — the Day-sheet mark "08:15 School-run rush —
  never let the queue pass 3." The wall clock's hands are set
  from it.
- **Queue: exactly 3** — the rush held at the limit. The queue
  bends along the counter front and turns toward the door (a
  straight door-to-pass line stacks all three figures into one
  file from this camera; found in the first render, fixed).
  The third figure is smaller, with a backpack: the school group
  arriving, kept abstract.
- **Tickets on the rail: exactly 3** — board `TICKETS`, none done:
  #1 Sasha (latte), #2 Aldo (decaf), #3 Mina + school group
  (cocoa). Each hangs from a tiny red clip and sways.
- **The red card** on a stand at the pass end of the counter,
  angled toward the prep side, carrying the board's line:
  "NO PEANUTS AT THE PREP COUNTER, EVER." It is the scene's one
  red object (the ticket clips and a pencil underline on the day
  sheet are the permitted tiny details).
- **Chalkboard** shows the menu and "— stock: milk low —", the
  board's opening line. The day sheet by the pass has its 8 marks,
  the 08:15 line underlined.
- Tab is behind the counter in an apron, mid-reach toward a
  steaming cup. Sasha sits at the window seat with her latte.
  The oven — on since 06:30 — glows. People are faceless
  miniature figures in muted clothing colours: architectural
  models, per the warm-not-cute rule, not mascots.

## Verification

Rendered with headless Chromium (Playwright's chromium-1248
build) driven by puppeteer-core, WebGL via SwiftShader, at a
1500 × 1000 viewport, device scale 1.5 → the 2250 × 1500
snapshot. Three composition rounds, each judged from a full
render: (1) lighting/fill and a shelf collision with the
chalkboard fixed; (2) the queue found stacked along the view
axis and re-routed into its bend; (3) final frame, shipped as
`snapshot.png`.

- **Console: zero errors, zero warnings** in the final captures,
  over both transports below. (An early favicon 404 was silenced
  with an inline SVG icon — a tiny red card.)
- **Animation is live:** two frames 6 s apart differ in ~27k
  sampled pixels (auto-rotate + idle motion). Software-GL frame
  rate in this sandbox was ~1 fps; on any real GPU the scene is
  trivially 60 fps. A `window.__SCENE_READY` hook (frame 30)
  exists purely so harnesses can detect a composed scene.
- **Sandbox quirk, disclosed:** this VM reaches the internet
  through a TLS-intercepting authenticated proxy that headless
  Chrome cannot use directly, so the capture rig used a local
  CONNECT relay and `--ignore-certificate-errors`. That is a
  property of this sandbox, not of the page — jsDelivr's real
  certificate chain is unremarkable in a learner's browser.

### How to open it

- **Double-click works.** The page was verified end-to-end from
  `file://` — the module scripts load from the CDN (which serves
  CORS `*`), everything else is inline. No build step, no server
  required.
- Or serve it, from the repo root:
  `python3 -m http.server 8000 -d examples/cafe3d`
  then open `http://localhost:8000/`.
- It does need network access for the Three.js CDN import; there
  is no vendored fallback in the spike.

## The trace-player follow-on: an honest estimate

The scene was built so the player is an addition, not a rewrite —
but it is a real build, not an afternoon:

- **STATE becomes a stream.** `shared/cafe_world.py` already
  emits `snapshot()` (queue, rail, completed, stock, events), and
  the board already renders from it. The player needs one
  snapshot per trace step, exported as JSON from the Python side
  (a new exporter beside the spike; the course's recorded runs are
  the content).
- **An `applySnapshot()` layer** in the page: figures enter/leave
  and move between named anchor points (door, queue slots, pass,
  window seat), tickets appear/complete on the rail, stock notes
  and the clock update, the red card flashes when a step touches
  it. The scene graph's groups and the STATE comments were placed
  with these anchors in mind.
- **Transport + interpolation:** play/pause/step/scrub, and
  figures gliding between anchors instead of teleporting. This
  is where the time goes — motion polish, not machinery.
- **Embedding risk is the real unknown:** notebooks, Binder, and
  GitHub Pages each treat iframes/scripts differently. Budget a
  day just to prove the embed in the surfaces the course
  actually ships.

Estimate: **2–4 focused days** — roughly one for the exporter +
snapshot vocabulary, one to two for `applySnapshot()` and motion,
one for transport UI and embedding checks. The spike's scene,
palette, and camera carry over unchanged.
