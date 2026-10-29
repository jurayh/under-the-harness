/* ------------------------------------------------------------------ *
 * Trace player logic — inlined into player.html by build_pages.py
 * after scene.js (it uses createCafe + THREE from the page's own
 * imports, and window.FILMSTRIPS from filmstrips.js).
 *
 * Transport: play/pause, step forward/back, scrubber, speed, and
 * the Careful/Gist switcher. Every step displays its numbered
 * trace line (chapter 7's identity) as the caption. Steps are
 * applied through cafe.applyState; figures glide between the
 * anchors each state names — scrubbing is just applying states
 * out of order.
 * ------------------------------------------------------------------ */
const STEP_MS = 1750;

const els = {
  title: document.getElementById('fsTitle'),
  trace: document.getElementById('traceLine'),
  note: document.getElementById('harnessNote'),
  score: document.getElementById('scoreLine'),
  caption: document.getElementById('caption'),
  scrub: document.getElementById('scrub'),
  count: document.getElementById('stepCount'),
  play: document.getElementById('btnPlay'),
  prev: document.getElementById('btnPrev'),
  next: document.getElementById('btnNext'),
  speed: document.getElementById('speed'),
  careful: document.getElementById('btnCareful'),
  gist: document.getElementById('btnGist'),
};

const player = {
  film: null, filmId: null, idx: 0,
  playing: false, speed: 1, lastAdvance: 0,
};

function scoreText(sb) {
  return `the day, graded by the world's scoreboard: ` +
    `${sb.tickets_completed}/${sb.tickets_completed + sb.tickets_missed} tickets · ` +
    `violations ${sb.violations} · allergy incidents ${sb.allergy_incidents}`;
}

function applyCurrent(instant = false) {
  const step = player.film.steps[player.idx];
  cafe.applyState(step.state, {
    instant,
    pulse: step.violation ? 'alarm' : (step.threat ? 'warn' : 'off'),
    reach: !!step.action &&
      (step.action.verb === 'serve_ticket' ||
       step.action.verb === 'place_on_prep'),
  });
  els.trace.textContent = step.trace;
  els.caption.classList.toggle('alarm', !!step.violation);
  els.caption.classList.toggle('warn', !step.violation && !!step.threat);
  els.count.textContent =
    `step ${step.n} / ${player.film.steps.length} · ${step.clock}`;
  els.scrub.value = player.idx;
}

function setStep(i, instant = false) {
  player.idx = Math.max(0, Math.min(player.film.steps.length - 1, i));
  player.lastAdvance = performance.now();
  applyCurrent(instant);
}

function loadFilm(id, instant = true) {
  cafe.clearCast();
  player.film = window.FILMSTRIPS[id];
  player.filmId = id;
  els.title.textContent = player.film.title;
  els.note.textContent = player.film.harness_note;
  els.score.textContent = scoreText(player.film.scoreboard);
  els.scrub.max = player.film.steps.length - 1;
  els.careful.classList.toggle('active', id === 'careful');
  els.gist.classList.toggle('active', id === 'gist');
  setStep(0, instant);
}

function setPlaying(on) {
  player.playing = on;
  els.play.textContent = on ? '❚❚' : '▶';
  player.lastAdvance = performance.now();
}

els.play.addEventListener('click', () => {
  if (!player.playing && player.idx >= player.film.steps.length - 1)
    setStep(0);
  setPlaying(!player.playing);
});
els.prev.addEventListener('click', () => { setPlaying(false); setStep(player.idx - 1); });
els.next.addEventListener('click', () => { setPlaying(false); setStep(player.idx + 1); });
els.scrub.addEventListener('input', () => setStep(Number(els.scrub.value)));
els.speed.addEventListener('change', () => {
  player.speed = Number(els.speed.value);
  player.lastAdvance = performance.now();
});
els.careful.addEventListener('click', () => loadFilm('careful'));
els.gist.addEventListener('click', () => loadFilm('gist'));
window.addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); els.play.click(); }
  if (e.key === 'ArrowRight') { setPlaying(false); setStep(player.idx + 1); }
  if (e.key === 'ArrowLeft') { setPlaying(false); setStep(player.idx - 1); }
});

function transportLoop(now) {
  requestAnimationFrame(transportLoop);
  if (!player.playing) return;
  if (now - player.lastAdvance >= STEP_MS / player.speed) {
    if (player.idx >= player.film.steps.length - 1) {
      setPlaying(false);
      return;
    }
    setStep(player.idx + 1);
  }
}
requestAnimationFrame(transportLoop);

let cafe = null;
async function boot() {
  if (!window.FILMSTRIPS) {
    /* Over http the JSON files can be fetched; from file:// the
     * script-tag include (filmstrips.js) has already run. */
    const [c, g] = await Promise.all([
      fetch('filmstrip_careful.json').then(r => r.json()),
      fetch('filmstrip_gist.json').then(r => r.json()),
    ]);
    window.FILMSTRIPS = { careful: c, gist: g };
  }
  const wanted = new URLSearchParams(location.search).get('filmstrip');
  const first = window.FILMSTRIPS[wanted] ? wanted : 'careful';
  cafe = createCafe(THREE, OrbitControls,
                    document.getElementById('app'),
                    window.FILMSTRIPS[first].steps[0].state);
  loadFilm(first);
  window.__PLAYER = {
    setStep: (i) => setStep(i),
    setStepInstant: (i) => setStep(i, true),
    getStep: () => player.idx,
    loadFilm: (id) => loadFilm(id),
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
  };
  window.__PLAYER_READY = true;
}
boot();
