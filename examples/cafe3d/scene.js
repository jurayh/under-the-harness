import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ------------------------------------------------------------------ *
 * FROZEN_STATE — the canonical Day at 08:15, board stage 0, written
 * in the filmstrip STATE vocabulary (export_filmstrips.py). This is
 * the spike's frozen moment; the static page renders exactly this.
 *   clock     — Day mark "08:15 School-run rush — never let the
 *               queue pass 3" (board.DAY_MARKS[2]); the wall clock.
 *   rail      — board.TICKETS, all three on the rail, none done.
 *   figures   — Sasha served, at the window seat; the queue held
 *               at exactly 3, the last a kid with a backpack.
 *   tab       — behind the counter by the steaming cup, as staged
 *               in the spike.
 *   stockNote — "milk low", the board's opening chalkboard line.
 * The trace player feeds this same vocabulary, one state per step.
 * ------------------------------------------------------------------ */
export const FROZEN_STATE = {
  clock: '08:15',
  rail: [
    { id: 't1', n: 1, item: 'latte', label: '#1 Sasha — oat-milk latte' },
    { id: 't2', n: 2, item: 'decaf', label: '#2 Aldo — decaf + crossword' },
    { id: 't3', n: 3, item: 'cocoa', label: '#3 Mina + school group — cocoa (see red card)' },
  ],
  completed: [],
  figures: [
    { key: 'cust:t1', kind: 'sasha', where: 'seat:window', label: 'Sasha' },
    { key: 'q1', kind: 'adult', where: 'queue:0', label: 'Guest' },
    { key: 'q2', kind: 'adult', where: 'queue:1', label: 'Guest' },
    { key: 'kid', kind: 'kid', where: 'queue:2', label: 'School kid' },
  ],
  tab: { station: 'counter', action: 'serves', holding: null },
  prep: [],
  stock: { milk: 1, 'oat milk': 2, 'coffee beans': 2, cocoa: 5,
           muffins: 4, bread: 6, peanuts: 0 },
  stockNote: 'milk low',
  threat: false,
};

export function createCafe(THREE, OrbitControls, mount, initialState) {
const STATE = initialState || FROZEN_STATE;

/* ---------------- palette (DESIGN direction: cream / espresso / chalk, one red) */
const PAL = {
  wall:      0xf4ecd9,
  wallLow:   0xe6d9bf,
  floorBase: '#b0824f',
  espresso:  0x4a3423,
  espressoD: 0x33241a,
  wood:      0x8a6642,
  woodLight: 0xa97e52,
  chalk:     0xf8f3e6,
  chalkGrey: 0x9a9484,
  boardBg:   0x2e3431,
  red:       0xbc2a18,
  metal:     0x8f8c85,
  steel:     0x5d6058,
  brass:     0xc9a227,
  skin:      0xd9b48f,
  hair:      0x4c3a28,
};

/* ---------------- renderer / scene / camera ---------------- */
const app = mount;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const aspect = window.innerWidth / window.innerHeight;
const FR = 6.25; // ortho half-height — the isometric diorama framing
const camera = new THREE.OrthographicCamera(
  -FR * aspect, FR * aspect, FR, -FR, 0.1, 120);
camera.position.set(13.5, 12.0, 14.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.1, 0.5, -0.45);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minZoom = 0.65;
controls.maxZoom = 2.4;
controls.minPolarAngle = 0.62;   // never top-down flat…
controls.maxPolarAngle = 1.18;   // …never under the floor
controls.autoRotate = true;
controls.autoRotateSpeed = -0.5;
controls.update();
const az0 = controls.getAzimuthalAngle();
controls.minAzimuthAngle = az0 - 0.85;
controls.maxAzimuthAngle = az0 + 0.85;
controls.addEventListener('start', () => { controls.autoRotate = false; });

/* ---------------- lights: warm morning sun through the window wall ---------------- */
scene.add(new THREE.HemisphereLight(0xfff3dc, 0x8a6a4c, 1.12));

const fill = new THREE.DirectionalLight(0xfff1dd, 0.55);   // soft bounce from the room side
fill.position.set(7, 9, 11);
scene.add(fill);

const sun = new THREE.DirectionalLight(0xffd9a3, 2.9);
sun.position.set(-9.5, 7.5, 1.5);          // outside the window (left) wall
sun.target.position.set(2.5, 0, -0.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -11; sun.shadow.camera.right = 11;
sun.shadow.camera.top = 11; sun.shadow.camera.bottom = -11;
sun.shadow.camera.far = 40;
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

const counterGlow = new THREE.PointLight(0xffd9a8, 5.5, 8, 2);
counterGlow.position.set(0.6, 2.35, -2.4);
scene.add(counterGlow);

const ovenGlow = new THREE.PointLight(0xff9440, 4.0, 4.2, 2);
ovenGlow.position.set(3.75, 1.0, -3.55);
scene.add(ovenGlow);

/* ---------------- material / geometry helpers ---------------- */
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial(
    Object.assign({ color, roughness: 0.92, metalness: 0.0 }, opts));
}
function box(w, h, d, material, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cyl(rt, rb, h, material, x, y, z, parent = scene, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function sph(r, material, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

/* ---------------- canvas textures (chalk, paper, card, floor) ---------------- */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const floorTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#bd9260'; g.fillRect(0, 0, w, h);
  const rows = 6;
  for (let i = 0; i < rows; i++) {
    const y = (h / rows) * i;
    g.fillStyle = `rgba(${140 + Math.random() * 26 | 0}, ${98 + Math.random() * 16 | 0}, 52, 0.13)`;
    g.fillRect(0, y, w, h / rows);
    g.fillStyle = 'rgba(70, 46, 22, 0.4)';
    g.fillRect(0, y, w, 2);
    const seam = ((i * 197) % 380) + 40;
    g.fillRect(seam, y, 2, h / rows);
    for (let s = 0; s < 26; s++) {           // faint grain
      g.fillStyle = 'rgba(90, 58, 26, 0.06)';
      g.fillRect(Math.random() * w, y + Math.random() * (h / rows), 24 + Math.random() * 40, 1);
    }
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(2.2, 1.7);

const chalkCanvas = document.createElement('canvas');
chalkCanvas.width = 640; chalkCanvas.height = 420;
const chalkTex = new THREE.CanvasTexture(chalkCanvas);
chalkTex.colorSpace = THREE.SRGBColorSpace;
chalkTex.anisotropy = 4;
function drawChalk(stockNote) {
  const g = chalkCanvas.getContext('2d'), w = 640, h = 420;
  g.fillStyle = '#2e3431'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) {            // chalk dust
    g.fillStyle = `rgba(240,238,225,${Math.random() * 0.045})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2.5, 2.5);
  }
  g.fillStyle = 'rgba(246,242,230,0.94)';
  g.textAlign = 'center';
  g.font = '600 44px Georgia, serif';
  g.fillText('THE MORNING BELL', w / 2, 74);
  g.fillRect(w / 2 - 150, 96, 300, 3);
  g.font = '30px Georgia, serif';
  g.textAlign = 'left';
  const items = [
    ['oat-milk latte', '4.5'], ['decaf', '3.5'], ['cocoa', '3.0'],
    ['morning bake', '4.0'], ['soup — from 12:00', ''],
  ];
  items.forEach(([a, b], i) => {
    const y = 152 + i * 46;
    g.fillText(a, 92, y);
    if (b) { g.textAlign = 'right'; g.fillText(b, w - 92, y); g.textAlign = 'left'; }
  });
  g.font = 'italic 25px Georgia, serif';
  g.fillStyle = 'rgba(246,242,230,0.75)';
  g.textAlign = 'center';
  g.fillText('— stock: ' + stockNote + ' —', w / 2, h - 26);
  chalkTex.needsUpdate = true;
}
drawChalk(STATE.stockNote);

function ticketTex(n, item) {
  return canvasTex(128, 176, (g, w, h) => {
    g.fillStyle = '#faf5e8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,105,80,0.5)'; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#4a3423'; g.textAlign = 'center';
    g.font = '700 40px Georgia, serif';
    g.fillText('#' + n, w / 2, 58);
    g.font = '22px Georgia, serif';
    g.fillText(item, w / 2, 92);
    g.strokeStyle = 'rgba(120,105,80,0.45)';
    [116, 134, 152].forEach(y => { g.beginPath(); g.moveTo(24, y); g.lineTo(w - 24, y); g.stroke(); });
  });
}

const redCardTex = canvasTex(320, 240, (g, w, h) => {
  g.fillStyle = '#bc2a18'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,244,230,0.85)'; g.lineWidth = 5;
  g.strokeRect(12, 12, w - 24, h - 24);
  g.fillStyle = '#fff4e6'; g.textAlign = 'center';
  g.font = '700 52px Georgia, serif';
  g.fillText('NO PEANUTS', w / 2, 92);
  g.font = '700 30px Georgia, serif';
  g.fillText('AT THE PREP COUNTER,', w / 2, 148);
  g.fillText('EVER.', w / 2, 190);
});

const daySheetTex = canvasTex(200, 280, (g, w, h) => {
  g.fillStyle = '#fbf7ec'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4a3423'; g.textAlign = 'center';
  g.font = '700 21px Georgia, serif';
  g.fillText('DAY SHEET', w / 2, 36);
  g.strokeStyle = 'rgba(120,105,80,0.55)';
  for (let i = 0; i < 8; i++) {           // the day sheet never changes: 8 marks
    const y = 66 + i * 25;
    g.beginPath(); g.moveTo(22, y); g.lineTo(w - 22 - (i % 3) * 16, y); g.stroke();
  }
  g.fillStyle = '#bc2a18';                    // the 08:15 mark, underlined in red pencil
  g.fillRect(22, 66 + 2 * 25 + 6, 90, 3);
});

/* soft round sprite for steam */
const steamTex = canvasTex(128, 128, (g, w, h) => {
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,252,246,0.85)');
  grad.addColorStop(0.55, 'rgba(255,252,246,0.32)');
  grad.addColorStop(1, 'rgba(255,252,246,0)');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
});
/* ---------------- the room ---------------- */
const room = new THREE.Group(); scene.add(room);

box(13.35, 0.2, 10.35, mat(PAL.espressoD), 0, -0.32, 0, room);            // slab base
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(13, 0.35, 10),
  new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.88 }));
floor.position.set(0, -0.175, 0);
floor.receiveShadow = true;
room.add(floor);

box(13, 3.4, 0.25, mat(PAL.wall), 0, 1.7, -4.875, room);                  // back wall
box(0.25, 3.4, 10, mat(PAL.wall), -6.375, 1.7, 0, room);                  // left wall
box(13, 0.95, 0.06, mat(PAL.wallLow), 0, 0.475, -4.72, room);             // wainscot
box(0.06, 0.95, 10, mat(PAL.wallLow), -6.22, 0.475, 0, room);
box(13, 0.05, 0.05, mat(PAL.espresso), 0, 0.975, -4.71, room);            // chair rail
box(0.05, 0.05, 10, mat(PAL.espresso), -6.21, 0.975, 0, room);

/* morning light pooling on the floorboards, spilling from the window */
[[7.5, 5.0, -3.1, -0.7, 0.16], [5.0, 3.2, -0.9, 0.9, 0.07]].forEach(([w, d, x, z, op]) => {
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: steamTex, color: 0xffdf9e, transparent: true,
      opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  patch.rotation.x = -Math.PI / 2;
  patch.rotation.z = 0.32;
  patch.position.set(x, 0.021, z);
  room.add(patch);
});

/* window in the left wall — the morning sun comes through here */
{
  const g = new THREE.Group(); room.add(g);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.78),
    new THREE.MeshBasicMaterial({ color: 0xffeebd }));
  glass.rotation.y = Math.PI / 2;
  glass.position.set(-6.235, 2.02, -1.4);
  g.add(glass);
  const fm = mat(PAL.espresso);
  box(0.09, 0.1, 3.5, fm, -6.2, 2.96, -1.4, g);
  box(0.09, 0.1, 3.5, fm, -6.2, 1.08, -1.4, g);
  box(0.09, 1.95, 0.1, fm, -6.2, 2.02, -3.1, g);
  box(0.09, 1.95, 0.1, fm, -6.2, 2.02, 0.3, g);
  box(0.07, 1.8, 0.055, fm, -6.21, 2.02, -1.97, g);                       // mullions
  box(0.07, 1.8, 0.055, fm, -6.21, 2.02, -0.83, g);
  box(0.07, 0.055, 3.3, fm, -6.21, 2.02, -1.4, g);
  box(0.26, 0.07, 3.6, mat(PAL.wood), -6.12, 1.03, -1.4, g);             // sill
}

/* chalkboard menu — back wall, left */
{
  box(2.95, 1.98, 0.07, mat(PAL.wood), -3.55, 2.06, -4.72, room);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.76),
    new THREE.MeshStandardMaterial({ map: chalkTex, roughness: 0.95 }));
  board.position.set(-3.55, 2.06, -4.68);
  room.add(board);
}

/* day sheet — pinned by the pass, back wall right */
{
  box(0.58, 0.8, 0.025, mat(PAL.woodLight), 5.3, 1.98, -4.73, room);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.73),
    new THREE.MeshStandardMaterial({ map: daySheetTex, roughness: 0.9 }));
  sheet.position.set(5.3, 1.98, -4.71);
  room.add(sheet);
  sph(0.028, mat(PAL.brass, { metalness: 0.7, roughness: 0.35 }), 5.3, 2.34, -4.7, room);
}

/* wall clock — hands set from the state's clock by setClock() */
let hourPivot = null, minutePivot = null;
{
  const g = new THREE.Group();
  g.position.set(-1.3, 2.42, -4.72);
  room.add(g);
  const rim = cyl(0.35, 0.35, 0.055, mat(PAL.espresso), 0, 0, 0, g);
  rim.rotation.x = Math.PI / 2;
  const face = cyl(0.305, 0.305, 0.06, mat(PAL.chalk), 0, 0, 0, g);
  face.rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    box(0.02, i % 3 === 0 ? 0.07 : 0.04, 0.012, mat(PAL.espressoD),
      Math.sin(a) * 0.255, Math.cos(a) * 0.255, 0.036, g);
  }
  const hand = (len, wdt, deg) => {
    const pivot = new THREE.Group();
    pivot.position.z = 0.045;
    const h = box(wdt, len, 0.012, mat(PAL.espressoD), 0, len / 2 - 0.02, 0, pivot);
    h.castShadow = false;
    pivot.rotation.z = -THREE.MathUtils.degToRad(deg);
    g.add(pivot);
    return pivot;
  };
  hourPivot = hand(0.17, 0.035, 0);
  minutePivot = hand(0.25, 0.025, 0);
  sph(0.028, mat(PAL.espressoD), 0, 0, 0.05, g);
}
function setClock(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (hourPivot)
    hourPivot.rotation.z =
      -THREE.MathUtils.degToRad(((h % 12) + m / 60) / 12 * 360);
  if (minutePivot)
    minutePivot.rotation.z = -THREE.MathUtils.degToRad((m / 60) * 360);
}
/* ---------------- counter, pass, and the back counter ---------------- */
const cafe = new THREE.Group(); scene.add(cafe);

/* main counter */
box(6.6, 1.02, 1.0, mat(PAL.espresso), 0.6, 0.51, -2.6, cafe);
box(7.0, 0.09, 1.3, mat(PAL.espressoD), 0.6, 1.065, -2.6, cafe);          // counter top
for (let i = 0; i < 4; i++)                                                // front panels
  box(1.32, 0.72, 0.04, mat(PAL.espressoD), -1.95 + i * 1.68, 0.52, -2.09, cafe);
box(6.6, 0.1, 0.06, mat(PAL.wood), 0.6, 0.05, -2.08, cafe);               // kick rail

/* back counter (the prep side, against the wall) */
box(6.6, 0.88, 0.62, mat(PAL.wood), 0.6, 0.44, -4.35, cafe);
box(6.8, 0.07, 0.78, mat(PAL.woodLight), 0.6, 0.915, -4.35, cafe);

/* espresso machine on the back counter */
{
  const g = new THREE.Group(); g.position.set(-1.5, 0.95, -4.35); cafe.add(g);
  const steel = mat(0x7a7d74, { metalness: 0.4, roughness: 0.48 });
  box(1.2, 0.52, 0.58, steel, 0, 0.31, 0, g);
  box(1.26, 0.07, 0.62, mat(PAL.espressoD), 0, 0.6, 0, g);                // cup warmer
  box(0.98, 0.16, 0.05, mat(0x33352f), 0, 0.3, 0.3, g);                   // front panel
  box(1.1, 0.05, 0.2, mat(PAL.espressoD), 0, 0.03, 0.36, g);              // drip tray
  const handle = cyl(0.028, 0.028, 0.3, mat(PAL.espressoD), 0.18, 0.24, 0.42, g);
  handle.rotation.z = Math.PI / 2 - 0.35;
  cyl(0.012, 0.012, 0.22, mat(PAL.metal, { metalness: 0.7, roughness: 0.3 }), -0.5, 0.18, 0.28, g); // steam wand
  cyl(0.05, 0.04, 0.09, mat(PAL.chalk), -0.05, 0.1, 0.4, g);              // cup under the spout
  cyl(0.05, 0.04, 0.09, mat(PAL.chalk), 0.32, 0.665, -0.08, g);           // cups on top
  cyl(0.05, 0.04, 0.09, mat(PAL.chalk), 0.46, 0.665, 0.05, g);
  /* grinder beside it */
  cyl(0.09, 0.11, 0.34, mat(PAL.espressoD), -0.85, 0.17, 0, g);
  cyl(0.1, 0.07, 0.16, mat(0x6d5136, { roughness: 0.6 }), -0.85, 0.42, 0, g);
}

/* the oven — on since 06:30, door glowing warm */
let ovenWindowMat;
{
  const g = new THREE.Group(); g.position.set(3.75, 0, -4.3); cafe.add(g);
  box(1.35, 1.7, 0.78, mat(0x6e7069, { metalness: 0.35, roughness: 0.52 }), 0, 0.85, 0, g);
  box(1.42, 0.08, 0.84, mat(PAL.espressoD), 0, 1.74, 0, g);
  box(1.05, 0.78, 0.05, mat(PAL.espressoD), 0, 0.98, 0.41, g);            // door
  ovenWindowMat = new THREE.MeshStandardMaterial({
    color: 0x3a2410, emissive: 0xff8f2e, emissiveIntensity: 1.6, roughness: 0.4 });
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.42, 0.03), ovenWindowMat);
  win.position.set(0, 1.02, 0.44); g.add(win);
  const bar = cyl(0.022, 0.022, 0.9, mat(PAL.metal, { metalness: 0.7, roughness: 0.3 }), 0, 1.44, 0.46, g);
  bar.rotation.z = Math.PI / 2;                                            // door handle
  box(0.9, 0.05, 0.5, mat(PAL.espressoD), 0, 0.42, 0.42, g);              // lower drawer
  box(0.7, 0.06, 0.45, mat(PAL.wood), -0.1, 1.82, 0, g);                   // tray on top
  box(0.5, 0.06, 0.35, mat(PAL.woodLight), 0.15, 1.9, 0.02, g);
}

/* the peanut-crunch topping jar — lives on the back counter
 * only while a state's prep list holds a peanut item */
const toppingJar = new THREE.Group();
toppingJar.position.set(2.3, 0.95, -4.35);
cafe.add(toppingJar);
cyl(0.09, 0.09, 0.22, mat(0xc8a06a, { roughness: 0.55 }), 0, 0.11, 0, toppingJar);
cyl(0.095, 0.095, 0.03, mat(PAL.espressoD), 0, 0.235, 0, toppingJar);
toppingJar.visible = false;

/* shelves on the back wall with jars and cups — between chalkboard and rail */
{
  const shelf = (y) => box(2.4, 0.05, 0.34, mat(PAL.wood), 0.3, y, -4.5, cafe);
  shelf(3.06); shelf(2.7);
  const jarCols = [0xd8c9a3, 0xb59a6a, 0x8a9a7b, 0xc4b393];
  jarCols.forEach((c, i) => {
    cyl(0.085, 0.085, 0.24, mat(c, { roughness: 0.5 }), -0.5 + i * 0.62, 3.205, -4.5, cafe);
    cyl(0.09, 0.09, 0.035, mat(PAL.espressoD), -0.5 + i * 0.62, 3.34, -4.5, cafe);
  });
  for (let i = 0; i < 4; i++)
    cyl(0.05, 0.04, 0.09, mat(PAL.chalk), -0.55 + i * 0.5, 2.77, -4.5, cafe);
}

/* ticket rail above the pass — dynamic: applyState hangs and
 * clears tickets as the world moves */
const ticketPool = new Map();
{
  const rail = cyl(0.021, 0.021, 2.7, mat(PAL.metal, { metalness: 0.75, roughness: 0.3 }),
    2.35, 2.42, -4.55, cafe);
  rail.rotation.z = Math.PI / 2;
  box(0.05, 0.3, 0.05, mat(PAL.espressoD), 1.05, 2.3, -4.6, cafe);
  box(0.05, 0.3, 0.05, mat(PAL.espressoD), 3.65, 2.3, -4.6, cafe);
}
function railX(i, count) {
  return count <= 1 ? 2.35 : 1.5 + 1.7 * (i / (count - 1));
}
function shortItem(item) {           // the little ticket's shorthand
  const words = String(item).split(' ');
  return words[words.length - 1];
}
function syncRail(rail) {
  const wanted = new Set(rail.map(t => t.id));
  for (const [id, rec] of ticketPool)
    if (!wanted.has(id)) rec.leaving = true;
  rail.forEach((t, i) => {
    let rec = ticketPool.get(t.id);
    if (!rec) {
      const pivot = new THREE.Group();
      pivot.position.set(railX(i, rail.length), 2.42, -4.52);
      cafe.add(pivot);
      const geo = new THREE.PlaneGeometry(0.36, 0.5);
      geo.translate(0, -0.25, 0);                  // hang from the top edge
      const material = new THREE.MeshStandardMaterial({
        map: ticketTex(t.n, shortItem(t.item)), roughness: 0.9,
        side: THREE.DoubleSide, transparent: true });
      const ticket = new THREE.Mesh(geo, material);
      ticket.castShadow = true;
      pivot.add(ticket);
      box(0.09, 0.045, 0.03, mat(PAL.red), 0, -0.01, 0.012, pivot);  // the clip
      pivot.rotation.y = (i - 1) * 0.1;
      rec = { pivot, material, phase: t.n * 1.7,
              targetX: railX(i, rail.length), leaving: false };
      ticketPool.set(t.id, rec);
    }
    rec.leaving = false;
    rec.targetX = railX(i, rail.length);
  });
}

/* the RED CARD on its stand, at the pass end of the counter.
 * Its materials are kept: the player pulses them when a state
 * puts peanuts where they must never be. */
let redCardSideMat = null, redCardFaceMat = null;
{
  const g = new THREE.Group();
  g.position.set(3.05, 1.11, -2.45);
  g.rotation.y = -0.5;                                                     // angled toward the prep side
  cafe.add(g);
  const legL = box(0.03, 0.3, 0.03, mat(PAL.espressoD), -0.14, 0.13, -0.05, g);
  legL.rotation.x = 0.35;
  const legR = box(0.03, 0.3, 0.03, mat(PAL.espressoD), 0.14, 0.13, -0.05, g);
  legR.rotation.x = 0.35;
  box(0.36, 0.03, 0.16, mat(PAL.espressoD), 0, 0.015, 0, g);
  redCardSideMat = mat(PAL.red);
  redCardSideMat.emissive = new THREE.Color(PAL.red);
  redCardSideMat.emissiveIntensity = 0;
  redCardFaceMat = new THREE.MeshStandardMaterial({
    map: redCardTex, roughness: 0.75,
    emissive: PAL.red, emissiveIntensity: 0 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.345, 0.016), [
    redCardSideMat, redCardSideMat, redCardSideMat, redCardSideMat,
    redCardFaceMat, redCardSideMat,
  ]);
  card.position.set(0, 0.26, 0.01);
  card.rotation.x = -0.22;
  card.castShadow = true;
  g.add(card);
}
const alarmGlow = new THREE.PointLight(0xff2a18, 0, 4.0, 2);
alarmGlow.position.set(3.05, 1.7, -2.1);
scene.add(alarmGlow);

/* cake dome + register + a cup on the counter */
{
  const plate = cyl(0.3, 0.34, 0.04, mat(PAL.chalk), -2.2, 1.13, -2.6, cafe);
  [[-2.32, -2.68], [-2.08, -2.52], [-2.2, -2.44]].forEach(([x, z]) => {
    cyl(0.075, 0.09, 0.07, mat(0x9a6b3d), x, 1.185, z, cafe);
    sph(0.075, mat(0xb0824f), x, 1.24, z, cafe).scale.y = 0.75;
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xfdf6e3, transparent: true, opacity: 0.22, roughness: 0.15, metalness: 0 }));
  dome.position.set(-2.2, 1.15, -2.56);
  cafe.add(dome);
  sph(0.03, mat(PAL.brass, { metalness: 0.7, roughness: 0.35 }), -2.2, 1.47, -2.56, cafe);

  box(0.52, 0.16, 0.4, mat(PAL.espressoD), 2.1, 1.19, -2.95, cafe);       // till
  const screen = box(0.4, 0.28, 0.03, mat(0x2c2f2a), 2.1, 1.42, -3.05, cafe);
  screen.rotation.x = -0.28;

  cyl(0.055, 0.045, 0.1, mat(PAL.chalk), 0.78, 1.16, -2.3, cafe);        // Tab's cup, steaming
}

/* two stools at the counter front */
[[-1.15], [0.35]].forEach(([x]) => {
  cyl(0.26, 0.26, 0.05, mat(PAL.wood), x, 0.78, -1.5, cafe);
  cyl(0.035, 0.035, 0.75, mat(PAL.espressoD), x, 0.39, -1.5, cafe);
  cyl(0.2, 0.24, 0.03, mat(PAL.espressoD), x, 0.02, -1.5, cafe);
});

/* pendant lights over the counter */
[-1.2, 1.6].forEach(x => {
  cyl(0.012, 0.012, 0.85, mat(PAL.espressoD), x, 3.0, -2.6, cafe);
  const shade = cyl(0.05, 0.24, 0.22, mat(PAL.espresso), x, 2.5, -2.6, cafe);
  const bulb = sph(0.05, new THREE.MeshStandardMaterial({
    color: 0xffe9bb, emissive: 0xffca7a, emissiveIntensity: 2.4 }), x, 2.42, -2.6, cafe);
  bulb.castShadow = false;
});
/* ---------------- people: faceless architectural miniatures ----------------
 * No faces, no chibi proportions — turned-wood model people with a
 * hint of clothing colour, per the warm-not-cute rule. */
function figure(opts = {}) {
  const {
    shirt = 0x7d8ca3, trousers = 0x4c4238, hair = PAL.hair,
    skin = PAL.skin, apron = false, backpack = null,
    seated = false, scale = 1,
  } = opts;
  const g = new THREE.Group();
  const hipY = seated ? 0.52 : 0.8;
  if (seated) {
    [-0.075, 0.075].forEach(x => {
      const th = cyl(0.05, 0.056, 0.34, mat(trousers), x, hipY - 0.03, 0.15, g);
      th.rotation.x = Math.PI / 2;
      cyl(0.042, 0.048, 0.42, mat(trousers), x, 0.23, 0.31, g);
      box(0.09, 0.05, 0.17, mat(PAL.espressoD), x, 0.025, 0.36, g);
    });
  } else {
    [-0.075, 0.075].forEach(x => {
      cyl(0.05, 0.058, 0.78, mat(trousers), x, 0.39, 0, g);
      box(0.095, 0.05, 0.18, mat(PAL.espressoD), x, 0.025, 0.035, g);
    });
  }
  cyl(0.105, 0.14, 0.56, mat(shirt), 0, hipY + 0.28, 0, g);                 // torso
  const cap = sph(0.135, mat(shirt), 0, hipY + 0.55, 0, g);
  cap.scale.set(1.12, 0.55, 0.92);                                          // shoulders
  sph(0.115, mat(skin, { roughness: 0.65 }), 0, hipY + 0.74, 0, g);         // head
  const hairCap = sph(0.12, mat(hair), 0, hipY + 0.775, -0.016, g);
  hairCap.scale.set(1, 0.72, 1);
  const arms = {};
  [-1, 1].forEach(s => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.165, hipY + 0.5, 0);
    g.add(pivot);
    cyl(0.037, 0.042, 0.52, mat(shirt), 0, -0.24, 0, pivot);
    sph(0.042, mat(skin, { roughness: 0.65 }), 0, -0.5, 0, pivot);
    pivot.rotation.z = s * 0.13;
    arms[s < 0 ? 'L' : 'R'] = pivot;
  });
  if (apron) {
    box(0.3, 0.52, 0.025, mat(0xefe5cd), 0, hipY + 0.22, 0.128, g);
    box(0.31, 0.045, 0.028, mat(0xdccfb2), 0, hipY + 0.46, 0.128, g);
  }
  if (backpack) {
    box(0.27, 0.36, 0.14, mat(backpack), 0, hipY + 0.3, -0.19, g);
    box(0.2, 0.12, 0.15, mat(backpack), 0, hipY + 0.53, -0.19, g);
  }
  g.scale.setScalar(scale);
  g.userData.arms = arms;
  return g;
}
function faceToward(fig, tx, tz) {
  fig.rotation.y = Math.atan2(tx - fig.position.x, tz - fig.position.z);
}

/* Tab — behind the counter, apron on. Tab moves between named
 * stations behind the counter as states change. */
const TAB_ANCHORS = {
  counter: { x: 0.15, z: -3.42, ry: 0.15 },
  pass:    { x: 2.55, z: -3.45, ry: 0.1 },
  prep:    { x: 1.35, z: -3.5, ry: Math.PI },
  oven:    { x: 3.55, z: -3.45, ry: Math.PI },
  till:    { x: 2.05, z: -3.5, ry: 0.35 },
};
const tab = figure({ shirt: 0x71808f, apron: true, hair: 0x3a2c1e });
tab.position.set(0.15, 0, -3.42);
tab.rotation.y = 0.15;
scene.add(tab);
const tabArm = tab.userData.arms.R;
let tabTarget = { ...TAB_ANCHORS.counter };
let tabReachUntil = -1;
/* what Tab holds, shown at the end of the serving arm: a cup for
 * a drink, the little jar for anything with peanuts in it */
const tabCup = cyl(0.05, 0.04, 0.09, mat(PAL.chalk), 0, -0.56, 0.06, tabArm);
const tabJar = new THREE.Group();
tabArm.add(tabJar);
cyl(0.055, 0.055, 0.13, mat(0xc8a06a, { roughness: 0.5 }), 0, -0.56, 0.06, tabJar);
cyl(0.058, 0.058, 0.025, mat(PAL.espressoD), 0, -0.48, 0.06, tabJar);
tabCup.visible = false;
tabJar.visible = false;
function setTabHolding(holding) {
  tabJar.visible = !!holding && /peanut/i.test(holding);
  tabCup.visible = !!holding && !/peanut/i.test(holding);
}

/* ---------------- window seat + Sasha ---------------- */
{
  box(0.7, 0.4, 2.7, mat(PAL.wood), -5.82, 0.2, -1.4, room);
  box(0.78, 0.12, 2.85, mat(PAL.woodLight), -5.8, 0.46, -1.4, room);
  box(0.1, 0.6, 2.85, mat(PAL.wood), -6.12, 0.82, -1.4, room);
  box(0.52, 0.09, 2.3, mat(0xa9714b), -5.8, 0.565, -1.4, room);           // bench cushion
  const tableTop = cyl(0.44, 0.44, 0.05, mat(PAL.wood), -4.95, 0.74, -1.5, room);
  cyl(0.04, 0.04, 0.7, mat(PAL.espressoD), -4.95, 0.37, -1.5, room);
  cyl(0.24, 0.28, 0.04, mat(PAL.espressoD), -4.95, 0.02, -1.5, room);
  cyl(0.055, 0.045, 0.1, mat(PAL.chalk), -4.9, 0.815, -1.42, room);       // her latte
  cyl(0.11, 0.11, 0.015, mat(PAL.chalk), -4.9, 0.775, -1.42, room);
}

/* ---------------- floor tables, chairs, rug ---------------- */
box(5.4, 0.025, 3.5, mat(0xa9714b), 0.7, 0.013, 2.0, room);
box(4.85, 0.026, 2.95, mat(0xb57f57), 0.7, 0.016, 2.0, room);

function chair(x, z, ry) {
  const g = new THREE.Group();
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  box(0.47, 0.05, 0.45, mat(PAL.wood), 0, 0.46, 0, g);
  box(0.47, 0.52, 0.05, mat(PAL.wood), 0, 0.74, -0.21, g);
  box(0.4, 0.06, 0.38, mat(PAL.espressoD), 0, 0.22, 0, g);
  return g;
}
function cafeTable(x, z) {
  cyl(0.78, 0.78, 0.05, mat(PAL.wood), x, 0.74, z, scene);
  cyl(0.05, 0.05, 0.72, mat(PAL.espressoD), x, 0.37, z, scene);
  cyl(0.3, 0.35, 0.04, mat(PAL.espressoD), x, 0.02, z, scene);
}
cafeTable(-2.7, 1.7);
chair(-3.78, 1.7, Math.PI / 2);
chair(-2.7, 2.78, Math.PI);
cyl(0.055, 0.045, 0.1, mat(PAL.chalk), -2.45, 0.815, 1.45, scene);
box(0.34, 0.025, 0.24, mat(0x7d8ca3), -2.95, 0.78, 1.95, scene).rotation.y = 0.4;  // a left book
cafeTable(2.4, 2.55);
chair(3.48, 2.55, -Math.PI / 2);
chair(2.4, 1.47, 0);
cyl(0.055, 0.045, 0.1, mat(PAL.chalk), 2.65, 0.815, 2.3, scene);

/* a plant by the window's near end — café warmth, kept plain */
{
  cyl(0.23, 0.17, 0.36, mat(0xa2603c), -5.75, 0.18, 2.6, room);
  sph(0.27, mat(0x7d8f6a), -5.75, 0.62, 2.6, room).scale.y = 0.85;
  sph(0.2, mat(0x87996f), -5.55, 0.78, 2.45, room).scale.y = 0.85;
  sph(0.18, mat(0x74855f), -5.95, 0.8, 2.75, room).scale.y = 0.85;
}

/* ---------------- the door, its bell, and the queue ---------------- */
{
  const g = new THREE.Group(); scene.add(g);
  box(0.14, 2.55, 0.14, mat(PAL.espresso), 6.42, 1.275, 1.5, g);
  box(0.14, 2.55, 0.14, mat(PAL.espresso), 6.42, 1.275, 3.2, g);
  box(0.14, 0.16, 1.85, mat(PAL.espresso), 6.42, 2.6, 2.35, g);
  const hinge = new THREE.Group();
  hinge.position.set(6.42, 0, 1.57);
  hinge.rotation.y = -0.62;                                                // door ajar, opening inward
  g.add(hinge);
  box(0.06, 2.34, 1.06, mat(PAL.wood), 0, 1.17, 0.53, hinge);
  box(0.065, 0.8, 0.6, mat(PAL.woodLight), 0, 1.62, 0.53, hinge);
  sph(0.04, mat(PAL.brass, { metalness: 0.7, roughness: 0.35 }), -0.08, 1.05, 0.95, hinge);
  const bell = cyl(0.015, 0.085, 0.1, mat(PAL.brass, { metalness: 0.75, roughness: 0.3 }), 6.3, 2.78, 2.35, g);
  sph(0.025, mat(PAL.brass, { metalness: 0.7, roughness: 0.35 }), 6.3, 2.72, 2.35, g);
}

/* ---------------- the cast: customers as state, not staging -----
 * applyState is handed figures as {key, kind, where}; where names
 * an anchor. Figures walk between anchors (no teleporting after
 * the first frame), swap to a seated build on arrival at a seat,
 * and leave through the door. Kinds: 'sasha' (her colours),
 * 'kid' (smaller, backpack), 'adult' (colours hashed from key). */
const ANCHORS = {
  'door':        { x: 5.9,   z: 1.55,  y: 0,    look: [4.6, 0.4] },
  'pass':        { x: 3.05,  z: -1.5,  y: 0,    look: [2.9, -2.6] },
  'queue:0':     { x: 3.3,   z: -1.2,  y: 0,    look: [3.1, -2.3] },
  'queue:1':     { x: 4.3,   z: -0.85, y: 0,    look: [3.4, -1.8] },
  'queue:2':     { x: 5.25,  z: -0.15, y: 0,    look: [4.2, -0.9] },
  'queue:3':     { x: 5.7,   z: 0.75,  y: 0,    look: [4.6, -0.1] },
  'queue:4':     { x: 5.95,  z: 1.6,   y: 0,    look: [5.0, 0.7] },
  'seat:window': { x: -5.78, z: -1.62, y: 0.09, ry: Math.PI / 2, seated: true },
  'seat:stool':  { x: -1.15, z: -1.5,  y: 0.27, ry: Math.PI, seated: true },
  'seat:table':  { x: -3.78, z: 1.7,   y: 0,    ry: Math.PI / 2, seated: true },
  'seat:table2': { x: 3.48,  z: 2.55,  y: 0,    ry: -Math.PI / 2, seated: true },
};
const ADULT_SHIRTS = [0x8a9a7b, 0xd0aa4e, 0x7d8ca3, 0x9a7b8f, 0xa9714b];
const ADULT_HAIR = [0x4c3a28, 0x2e2119, 0x6b5136, 0x8a8a86];
function hashStr(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
function figureOpts(kind, key, seated) {
  if (kind === 'sasha')
    return { shirt: 0xa9714b, trousers: 0x5d5348, hair: 0x2e2119, seated };
  if (kind === 'kid')
    return { shirt: 0x7d94a8, trousers: 0x5d5348, hair: 0x4c3a28,
             backpack: 0xd9a441, scale: 0.64, seated };
  const h = hashStr(key);
  return { shirt: ADULT_SHIRTS[h % ADULT_SHIRTS.length],
           trousers: 0x4c4238, hair: ADULT_HAIR[h % ADULT_HAIR.length],
           seated };
}
function ryTo(x, z, look) {
  return look ? Math.atan2(look[0] - x, look[1] - z) : 0;
}
const cast = new Map();
function rebuildFigure(rec, seated) {
  const old = rec.group;
  const g = figure(figureOpts(rec.kind, rec.key, seated));
  g.position.copy(old.position);
  g.rotation.y = old.rotation.y;
  scene.remove(old);
  scene.add(g);
  rec.group = g;
  rec.posture = seated ? 'seated' : 'standing';
}
function syncFigures(figures, instant) {
  const wanted = new Map(figures.map(f => [f.key, f]));
  for (const [key, rec] of cast) {
    if (!wanted.has(key) && !rec.leaving) {
      rec.leaving = true;
      rec.tx = 6.15; rec.tz = 2.35; rec.ty = 0; rec.try_ = 0.6;
      rec.postureWanted = 'standing';
      if (rec.posture === 'seated') rebuildFigure(rec, false);
    }
  }
  for (const f of figures) {
    const anchor = ANCHORS[f.where] || ANCHORS.door;
    let rec = cast.get(f.key);
    if (!rec) {
      const seated = !!anchor.seated;
      const g = figure(figureOpts(f.kind, f.key, seated));
      const start = instant ? anchor : ANCHORS.door;
      g.position.set(start.x, start.y || 0, start.z);
      scene.add(g);
      rec = { key: f.key, kind: f.kind, group: g,
              posture: seated ? 'seated' : 'standing',
              tx: anchor.x, tz: anchor.z, ty: anchor.y || 0,
              try_: anchor.ry ?? ryTo(g.position.x, g.position.z, anchor.look),
              postureWanted: seated ? 'seated' : 'standing',
              leaving: false };
      cast.set(f.key, rec);
    }
    rec.leaving = false;
    rec.tx = anchor.x; rec.tz = anchor.z; rec.ty = anchor.y || 0;
    rec.try_ = anchor.ry ?? ryTo(rec.group.position.x, rec.group.position.z, anchor.look);
    rec.postureWanted = anchor.seated ? 'seated' : 'standing';
    if (instant) {
      rec.group.position.set(rec.tx, rec.ty, rec.tz);
      rec.group.rotation.y = rec.try_;
      if (rec.posture !== rec.postureWanted)
        rebuildFigure(rec, rec.postureWanted === 'seated');
    }
  }
}
/* Hard reset for a filmstrip switch: the other morning's
 * guests don't linger into this one. */
function clearCast() {
  for (const rec of cast.values()) scene.remove(rec.group);
  cast.clear();
}

function updateCast(dt, t) {
  for (const [key, rec] of cast) {
    const g = rec.group;
    const dx = rec.tx - g.position.x, dz = rec.tz - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.02) {
      const step = Math.min(dist, dt * 2.3);
      g.position.x += (dx / dist) * step;
      g.position.z += (dz / dist) * step;
      g.position.y = rec.ty + Math.abs(Math.sin(t * 9 + key.length * 1.7)) * 0.03;
      rec.try_ = Math.atan2(dx, dz);
    } else {
      g.position.y += (rec.ty - g.position.y) * Math.min(1, dt * 8);
      if (rec.posture !== rec.postureWanted)
        rebuildFigure(rec, rec.postureWanted === 'seated');
      else if (rec.leaving) {
        scene.remove(g);
        cast.delete(key);
        continue;
      }
    }
    let d = rec.try_ - g.rotation.y;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    g.rotation.y += d * Math.min(1, dt * 7);
  }
  /* Tab glides between stations */
  const dx = tabTarget.x - tab.position.x, dz = tabTarget.z - tab.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist > 0.02) {
    const s = Math.min(dist, dt * 1.9);
    tab.position.x += (dx / dist) * s;
    tab.position.z += (dz / dist) * s;
  }
  let d = tabTarget.ry - tab.rotation.y;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  tab.rotation.y += d * Math.min(1, dt * 6);
}

/* ---------------- applyState: one world state, staged ------------
 * The whole player contract. A state is the filmstrip vocabulary:
 * clock, rail, figures, tab {station, holding}, prep, stockNote,
 * threat. opts: {instant, pulse: 'off'|'warn'|'alarm', reach}. */
let pulseMode = 'off';
let lastStockNote = STATE.stockNote;
function setPulse(mode) { pulseMode = mode; }
function updatePulse(t) {
  const v = pulseMode === 'alarm' ? 0.55 + 0.4 * Math.sin(t * 7)
          : pulseMode === 'warn' ? 0.2 + 0.09 * Math.sin(t * 2.6) : 0;
  if (redCardFaceMat) {
    redCardFaceMat.emissiveIntensity = v;
    redCardSideMat.emissiveIntensity = v * 0.85;
  }
  alarmGlow.intensity = pulseMode === 'alarm'
    ? 2.4 + 1.8 * Math.sin(t * 7) : 0;
}
function applyState(state, opts = {}) {
  setClock(state.clock);
  if (state.stockNote && state.stockNote !== lastStockNote) {
    drawChalk(state.stockNote);
    lastStockNote = state.stockNote;
  }
  syncRail(state.rail || []);
  syncFigures(state.figures || [], !!opts.instant);
  const anchor = TAB_ANCHORS[state.tab && state.tab.station]
    || TAB_ANCHORS.counter;
  tabTarget = { ...anchor };
  if (opts.instant) {
    tab.position.set(anchor.x, 0, anchor.z);
    tab.rotation.y = anchor.ry;
  }
  setTabHolding(state.tab ? state.tab.holding : null);
  if (opts.reach) tabReachUntil = clockT.elapsedTime + 1.1;
  toppingJar.visible = (state.prep || [])
    .some(p => /peanut/i.test(p));
  setPulse(opts.pulse || (state.threat ? 'warn' : 'off'));
}
/* ---------------- steam — the scene's quiet life ---------------- */
const steamSystems = [];
function makeSteam(x, y, z, n = 9, s = 1) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: steamTex, transparent: true, opacity: 0, depthWrite: false }));
    sp.position.set(x, y, z);
    sp.userData.ph = i / n;
    scene.add(sp);
    parts.push(sp);
  }
  steamSystems.push({ parts, x, y, z, s });
}
makeSteam(0.78, 1.24, -2.3, 9, 1);         // the cup Tab is serving
makeSteam(-4.9, 0.9, -1.42, 7, 0.8);       // Sasha's latte at the window

/* ---------------- animation: idle motion only ---------------- */
const clockT = new THREE.Clock();
let frames = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clockT.getDelta(), 0.05);
  const t = clockT.elapsedTime;

  /* Tab's reach: forward to the pass, back, forward — mid-service;
   * a reach step (serve / place) leans further for a moment */
  const reachBoost = t < tabReachUntil ? 0.38 : 0;
  tabArm.rotation.x = -0.5 - (0.42 + reachBoost) * (0.5 + 0.5 * Math.sin(t * 1.1));
  tabArm.rotation.z = 0.13 + 0.05 * Math.sin(t * 0.7);
  tab.position.y = 0.012 * Math.sin(t * 2.2);

  /* tickets breathe on the rail; served ones slide off and fade */
  for (const [id, rec] of ticketPool) {
    rec.pivot.rotation.x = 0.05 * Math.sin(t * 1.25 + rec.phase);
    rec.pivot.position.x +=
      (rec.targetX - rec.pivot.position.x) * Math.min(1, dt * 6);
    if (rec.leaving) {
      rec.pivot.position.y -= dt * 0.9;
      rec.material.opacity -= dt * 1.6;
      if (rec.material.opacity <= 0) {
        cafe.remove(rec.pivot);
        ticketPool.delete(id);
      }
    }
  }

  /* oven breathing warm */
  ovenWindowMat.emissiveIntensity = 1.55 + 0.3 * Math.sin(t * 2.1);
  ovenGlow.intensity = 3.9 + 0.7 * Math.sin(t * 2.1);

  /* steam rises, spreads, fades */
  for (const sys of steamSystems) {
    for (const sp of sys.parts) {
      const p = (sp.userData.ph + t * 0.13) % 1;
      sp.position.set(
        sys.x + Math.sin(p * 5.2 + sp.userData.ph * 9.0) * 0.035 * (0.4 + p),
        sys.y + p * 0.55 * sys.s,
        sys.z + Math.cos(p * 4.1 + sp.userData.ph * 7.0) * 0.02 * p);
      const sc = (0.07 + p * 0.17) * sys.s;
      sp.scale.set(sc, sc, 1);
      sp.material.opacity = Math.sin(p * Math.PI) * 0.44;
    }
  }

  updateCast(dt, t);
  updatePulse(t);
  controls.update();
  renderer.render(scene, camera);
  if (++frames === 30) window.__SCENE_READY = true;   // harness hook: loop is live, scene composed
}
animate();

window.addEventListener('resize', () => {
  const a = window.innerWidth / window.innerHeight;
  camera.left = -FR * a; camera.right = FR * a;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

applyState(STATE, { instant: true });
return { applyState, setPulse, clearCast, scene, camera, renderer, controls };
}

export function mountStaticScene(THREE, OrbitControls, mount) {
  return createCafe(THREE, OrbitControls, mount, FROZEN_STATE);
}
