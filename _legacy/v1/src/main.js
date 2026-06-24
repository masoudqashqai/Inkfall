// =====================================================================================
//  BOOT — wires the DOM to the engine. Imports the engine + its mixins (lighting, weather,
//  transitions, narration, input) and the actor/backdrop libraries (side-effect imports
//  that self-register), builds the intro story picker from the manifest, lazy-loads the
//  chosen story, and runs the editor + scene navigator. Stories are pure data; the editor
//  round-trips one as JSON and anything you play is remembered in localStorage.
// =====================================================================================
import { Noir } from './core/engine.js';
import './core/lighting.js';
import './core/weather.js';
import './core/transitions.js';
import './core/narration.js';
import './core/input.js';
import './actors/index.js';
import './backdrops/index.js';
import { Audio2 } from './core/audio.js';
import { STORIES } from '../stories/manifest.js';

const BUILD = 'build 13 · es modules';
console.log('INKFALL', BUILD);
document.getElementById('build').textContent = BUILD;

const introEl = document.getElementById('intro');
const cache = {};                       // loaded story data, keyed by manifest index
let currentStory = null, defaultStory = null;
const loadStory = async i => (cache[i] ||= await STORIES[i].load());

function applyIntroText(s) {
  if (s && s.title) document.querySelector('#intro h1').innerHTML = s.title.replace(/^(.{3})(.*)$/, '$1<span class="b">$2</span>');
  if (s && s.subtitle) document.getElementById('introsub').textContent = s.subtitle;
  if (s && s.blurb) document.getElementById('introblurb').textContent = s.blurb;
}

// the intro story picker, built from the manifest
function buildStoryPicker() {
  const pick = document.getElementById('storypick'); pick.innerHTML = '';
  STORIES.forEach((s, i) => {
    const b = document.createElement('button'); b.className = 'storybtn'; b.dataset.i = i;
    b.innerHTML = `${s.name}<small>${s.tagline}</small>`;
    b.addEventListener('click', () => selectStory(i));
    pick.appendChild(b);
  });
}

async function selectStory(i) {
  currentStory = await loadStory(i);
  applyIntroText(currentStory);
  Noir.loadStory(currentStory);
  Audio2.setStory(currentStory.audio);   // load only this story's audio (a story with no audio is silent)
  document.querySelectorAll('.storybtn').forEach(b => b.classList.toggle('cur', +b.dataset.i === i));
}

function beginPlay() {
  introEl.style.opacity = '0'; setTimeout(() => introEl.style.display = 'none', 800);
  document.getElementById('caption').style.display = 'block';
  document.getElementById('tapnote').style.display = 'block';
  document.getElementById('mute').classList.add('show');
  Audio2.start();
  buildSceneNav();
  Noir.start();
}
document.getElementById('enter').addEventListener('click', beginPlay);

// sound toggle
const muteEl = document.getElementById('mute');
muteEl.addEventListener('click', () => { const on = Audio2.toggle(); muteEl.textContent = on ? '♪' : '✕'; muteEl.style.color = on ? '#d8d4c8' : '#777'; });

// scene navigator: built from the current story, revealed by the engine after one full loop
function buildSceneNav() {
  const nav = document.getElementById('scenenav'); nav.innerHTML = ''; nav.classList.remove('show');
  (currentStory.scenes || []).forEach((sc, i) => {
    const b = document.createElement('button'); b.dataset.s = i;
    b.innerHTML = (sc.title || ('SCENE ' + i)).replace(/&nbsp;/g, ' ');
    b.addEventListener('click', () => { if (i === Noir.sceneIdx || Noir.transState) return; Noir.pending = i; Noir.transState = 'in'; });
    nav.appendChild(b);
  });
}

// ---- Story editor: paste/edit a JSON story, play it live, persist it ----
const editor = document.getElementById('editor'), edText = document.getElementById('ed-text'), edErr = document.getElementById('ed-err');
const noCache = (k, v) => (k && k[0] === '_') ? undefined : v;   // drop the engine's _bd geometry cache
function openEditor() { edText.value = JSON.stringify(currentStory, noCache, 2); edErr.textContent = ''; editor.style.display = 'flex'; }
document.getElementById('editbtn').addEventListener('click', openEditor);
document.getElementById('ed-close').addEventListener('click', () => editor.style.display = 'none');
document.getElementById('ed-reset').addEventListener('click', () => { edText.value = JSON.stringify(defaultStory, noCache, 2); edErr.textContent = 'Default story loaded into the editor — press PLAY to run it.'; });
document.getElementById('ed-play').addEventListener('click', () => {
  let s; try { s = JSON.parse(edText.value); } catch (err) { edErr.textContent = 'JSON error: ' + err.message; return; }
  if (!s || !Array.isArray(s.scenes) || !s.scenes.length) { edErr.textContent = 'A story needs a non-empty "scenes" array.'; return; }
  currentStory = s;
  try { localStorage.setItem('inkfall_story', JSON.stringify(s, noCache)); } catch (e) {}
  applyIntroText(s); Noir.loadStory(s); editor.style.display = 'none';
  if (!Noir.started) beginPlay();
});

// ---- bootstrap: build the picker, load the first tale, start the render loop ----
(async () => {
  buildStoryPicker();
  defaultStory = await loadStory(0);
  Noir.init(defaultStory);
  await selectStory(0);
})();
