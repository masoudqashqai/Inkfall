// BOOT — wires the DOM to the engine + manager. Imports the library (side-effect registration),
// builds the intro picker from the story manifest, lazy-loads the chosen story, and runs the
// loop. The editor round-trips a story as JSON (stories are pure data).
import { Engine } from './engine/engine.js';
import { Manager } from './scene/manager.js';
import { Audio2 } from './assets/audio.js';
import './library/index.js';
import { STORIES } from '../stories/manifest.js';

const el = id => document.getElementById(id);
const BUILD = 'v2 build 20 · car facing';
console.log('INKFALL', BUILD);
el('build').textContent = BUILD;

const engine = new Engine(); engine.init();
const manager = new Manager(engine);
manager.attachDom({ cap: el('caption'), tag: el('scenetag'), tap: el('tapnote'), nav: el('scenenav') });

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

function beginPlay() {
  const intro = el('intro');
  intro.style.opacity = '0'; setTimeout(() => intro.style.display = 'none', 800);
  el('caption').style.display = 'block';
  el('tapnote').style.display = 'block';
  el('mute').classList.add('show');
  Audio2.start();
  manager.requestStart();
}
el('enter').addEventListener('click', beginPlay);

const muteEl = el('mute');
muteEl.addEventListener('click', () => { const on = Audio2.toggle(); muteEl.textContent = on ? '♪' : '✕'; muteEl.style.color = on ? '#d8d4c8' : '#777'; });

// ---- story editor (pure-data JSON) ----
const editor = el('editor'), edText = el('ed-text'), edErr = el('ed-err');
const noCache = (k, v) => (k && k[0] === '_') ? undefined : v;
el('editbtn').addEventListener('click', () => { edText.value = JSON.stringify(manager.story, noCache, 2); edErr.textContent = ''; editor.style.display = 'flex'; });
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
