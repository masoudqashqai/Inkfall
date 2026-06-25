// BOOT — wires the DOM to the engine + manager. Imports the library (side-effect registration),
// builds the intro picker from the story manifest, lazy-loads the chosen story, and runs the
// loop. The editor round-trips a story as JSON (stories are pure data).
import { Engine } from './engine/engine.js';
import { Viewport } from './engine/viewport.js';
import { Manager } from './scene/manager.js';
import { Audio2 } from './assets/audio.js';
import { rand32, TWO_PI } from './engine/math.js';
import './library/index.js';
import { STORIES } from '../stories/manifest.js';

const el = id => document.getElementById(id);
const BUILD = 'v2 build 43 · fullscreen immersion + menu'
console.log('INKFALL', BUILD);
el('build').textContent = BUILD;

const engine = new Engine(); engine.init();
const manager = new Manager(engine);
manager.attachDom({ cap: el('caption'), tag: el('scenetag'), tap: el('tapnote'), nav: el('scenenav'), act: el('actbtn'), actsel: el('actsel') });

// REVIEW ACT toggle: drop the act list open/closed below the HUD
el('actbtn').addEventListener('click', () => {
  const open = el('scenenav').classList.toggle('open');
  el('actbtn').classList.toggle('open', open);
});

// keep the story in a landscape frame: go fullscreen + ask for landscape on a phone/tablet, hold
// the start behind a "rotate your screen" prompt while portrait, and letterbox everywhere else.
const viewport = new Viewport(engine);
viewport.attach({ overlay: el('rotate'), skip: el('rotate-skip'), fsCta: el('rotate-fs'), fsBtn: el('fsbtn') });
viewport.onStart = () => manager.requestStart();
viewport.onPause = () => Audio2.suspend();     // full story pause behind the prompt: clock + sound
viewport.onResume = () => Audio2.resumeAll();

// input → manager
import { bindInput } from './engine/input.js';
bindInput(engine.cv, {
  isReady: () => manager.started,
  onTap: () => manager.advance(),
  onDrag: dx => manager.drag(dx),
  onHold: () => manager.holdLightning(),
});

const cache = {};
const loadStory = i => (cache[i] ||= STORIES[i].load());
let defaultStory = null;

function applyIntroText(s) {
  if (s && s.title) el('intro').querySelector('h1').innerHTML = s.title.replace(/^(.{3})(.*)$/, '$1<span class="b">$2</span>');
  if (s && s.subtitle) el('introsub').textContent = s.subtitle;
  if (s && s.blurb) el('introblurb').textContent = s.blurb;
}

function buildStoryPicker() {
  const pick = el('storypick'); pick.innerHTML = '';
  STORIES.forEach((s, i) => {
    const b = document.createElement('button'); b.className = 'storybtn'; b.dataset.i = i;
    b.innerHTML = `${s.name}<small>${s.tagline}</small>`;
    b.addEventListener('click', () => selectStory(i));
    pick.appendChild(b);
  });
}

async function selectStory(i) {
  const s = await loadStory(i);
  manager.loadStory(s);
  Audio2.setStory(s.audio);
  applyIntroText(s);
  document.querySelectorAll('.storybtn').forEach(b => b.classList.toggle('cur', +b.dataset.i === i));
}

// the HUD stage drives coarse visibility from CSS: "menu" shows the intro, "playing" shows the
// in-story HUD + narration. Per-frame caption/tap fades stay in the manager.
const setStage = s => { document.body.dataset.stage = s; };

function beginPlay() {
  setStage('playing');     // CSS reveals the HUD + narration and fades the intro out
  Audio2.start();
  viewport.beginStory();   // goes immersive, then starts the story once the screen is landscape
}
el('enter').addEventListener('click', beginPlay);

// ---- "pull a frame": turn the live canvas into a downloadable noir poster ----
let halftone = null;
function buildHalftone() {
  const tile = 6, c = document.createElement('canvas'); c.width = c.height = tile * 8;
  const x = c.getContext('2d'); x.fillStyle = '#000';
  for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) { x.beginPath(); x.arc(xx * tile + tile / 2, yy * tile + tile / 2, tile * 0.32, 0, TWO_PI); x.fill(); }
  return c;
}
function makePoster() {
  const cv = engine.cv, W = engine.W, H = engine.H, pw = 900;
  const m = 56, fw = pw - m * 2, fh = Math.round(fw * (H / W)), fy = 150;
  const ph = fy + fh + 170;   // height follows the captured frame's aspect (portrait on mobile, landscape on desktop) so nothing overflows
  const pc = document.createElement('canvas'); pc.width = pw; pc.height = ph;
  const p = pc.getContext('2d');
  p.fillStyle = '#000'; p.fillRect(0, 0, pw, ph);
  p.drawImage(cv, 0, 0, cv.width, cv.height, m, fy, fw, fh);               // the captured frame
  p.strokeStyle = '#fff'; p.lineWidth = 5; p.strokeRect(m, fy, fw, fh);    // inked border
  p.fillStyle = '#e10010';                                                 // ink-splatter corners
  for (const [cxp, cyp, ci] of [[m, fy, 0], [m + fw, fy, 1], [m, fy + fh, 2], [m + fw, fy + fh, 3]]) {
    const rng = rand32(ci * 71 + 5);
    for (let k = 0; k < 9; k++) { const a = rng() * TWO_PI, d = rng() * 34, r = 1 + rng() * 6; p.beginPath(); p.arc(cxp + Math.cos(a) * d, cyp + Math.sin(a) * d, r, 0, TWO_PI); p.fill(); }
  }
  p.save(); p.translate(pw / 2, 92); p.transform(1, 0, -0.13, 1, 0, 0);    // INKFALL title
  p.textAlign = 'center'; p.textBaseline = 'middle'; p.font = '900 88px "Arial Black", Impact, sans-serif';
  const iw = p.measureText('INK').width, fwid = p.measureText('FALL').width;
  p.shadowColor = 'rgba(255,255,255,0.25)'; p.shadowBlur = 24; p.fillStyle = '#fff'; p.fillText('INK', -fwid / 2, 0);
  p.shadowColor = 'rgba(225,0,16,0.7)'; p.fillStyle = '#e10010'; p.fillText('FALL', iw / 2, 0);
  p.restore(); p.shadowBlur = 0;
  const tag = ((el('caption').textContent || (manager.story && manager.story.subtitle) || '') + '').replace(/<[^>]*>/g, '').toUpperCase();
  p.fillStyle = '#d8d4c8'; p.font = 'italic 24px Georgia, "Times New Roman", serif'; p.textAlign = 'center';
  let line = '', ty = fy + fh + 56;
  for (const w of tag.split(' ')) { if (p.measureText(line + w).width > fw - 40) { p.fillText(line.trim(), pw / 2, ty); ty += 34; line = ''; } line += w + ' '; }
  p.fillText(line.trim(), pw / 2, ty);
  p.fillStyle = '#6a6a6a'; p.font = '700 13px "Courier New", monospace'; p.fillText('B A S I N   C I T Y   ·   I N K F A L L', pw / 2, ph - 40);
  if (!halftone) halftone = buildHalftone();
  p.globalAlpha = 0.06; for (let yy = 0; yy < ph; yy += halftone.width) for (let xx = 0; xx < pw; xx += halftone.width) p.drawImage(halftone, xx, yy); p.globalAlpha = 1;
  const url = pc.toDataURL('image/png');
  el('posterimg').src = url; el('posterdl').href = url;
  el('posterclose').textContent = 'BACK TO ' + ((manager.current && manager.current.title || 'THE RAIN').replace(/&nbsp;/g, ' ')).toUpperCase();
  el('poster').classList.add('show');
}
el('shoot').addEventListener('click', () => { if (manager.started) makePoster(); });
el('posterclose').addEventListener('click', () => el('poster').classList.remove('show'));

// ---- story editor (pure-data JSON) ----
const editor = el('editor'), edText = el('ed-text'), edErr = el('ed-err');
const noCache = (k, v) => (k && k[0] === '_') ? undefined : v;
// the STORY button opens a small menu: go back to the start screen, or open the JSON editor
const storymenu = el('storymenu');
const openEditor = () => { edText.value = JSON.stringify(manager.story, noCache, 2); edErr.textContent = ''; editor.style.display = 'flex'; };
function goToStartMenu() {
  storymenu.classList.remove('show'); editor.style.display = 'none'; el('poster').classList.remove('show');
  el('scenenav').classList.remove('open'); el('actbtn').classList.remove('open');
  Audio2.setStory(manager.story && manager.story.audio);   // stop the playing audio, reset to the unstarted state
  viewport.reset(); manager.reset();                        // drop back to act one, not started, so ENTER replays cleanly
  setStage('menu');                                          // CSS fades the intro back in and hides the HUD
}
const soundBtn = el('sm-sound'), fsItem = el('sm-fs');
const syncMenu = () => {
  soundBtn.textContent = Audio2.isOn() ? 'SOUND: ON' : 'SOUND: OFF';
  fsItem.textContent = viewport.fullscreenOn() ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
};
soundBtn.addEventListener('click', () => { Audio2.toggle(); syncMenu(); });
fsItem.addEventListener('click', () => { viewport.toggleFullscreen(); setTimeout(syncMenu, 100); });
el('menubtn').addEventListener('click', () => { syncMenu(); storymenu.classList.add('show'); });
el('sm-cancel').addEventListener('click', () => storymenu.classList.remove('show'));
storymenu.addEventListener('click', e => { if (e.target === storymenu) storymenu.classList.remove('show'); });
el('sm-back').addEventListener('click', goToStartMenu);
el('sm-edit').addEventListener('click', () => { storymenu.classList.remove('show'); openEditor(); });
el('ed-close').addEventListener('click', () => editor.style.display = 'none');
el('ed-reset').addEventListener('click', () => { edText.value = JSON.stringify(defaultStory, noCache, 2); edErr.textContent = 'Default story loaded into the editor — press PLAY to run it.'; });
el('ed-play').addEventListener('click', () => {
  let s; try { s = JSON.parse(edText.value); } catch (err) { edErr.textContent = 'JSON error: ' + err.message; return; }
  if (!s || !Array.isArray(s.scenes) || !s.scenes.length) { edErr.textContent = 'A story needs a non-empty "scenes" array.'; return; }
  manager.loadStory(s); Audio2.setStory(s.audio); applyIntroText(s);
  try { localStorage.setItem('inkfall_story', JSON.stringify(s, noCache)); } catch (e) {}
  editor.style.display = 'none';
  if (!manager.started) beginPlay();
});

// ---- bootstrap ----
(async () => {
  buildStoryPicker();
  defaultStory = await loadStory(0);
  await selectStory(0);
  engine.run(e => manager.tick(e));
})();
