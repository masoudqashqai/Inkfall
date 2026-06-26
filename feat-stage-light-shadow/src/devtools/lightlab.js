// SHADOW & LIGHT LAB — a live tuning panel for the stage light + shadow look. It mutates the look
// knobs the engine already reads every frame (SHADE, WASH, AMBIENT, ENV from style/shadows.js, and
// MAT from style/materials.js), so dragging a slider changes the scene immediately. It is a dev
// tool, not part of a story: non-modal (never pauses), docked on the right, collapsible so the scene
// stays reviewable, and it can copy the current settings out as JSON to hand back for baking into
// the source defaults. Opened from Menu > Story Engine > SHADOW & LIGHT.
import { SHADE, WASH, AMBIENT, ENV, AIR } from '../style/shadows.js';
import { MAT } from '../style/materials.js';
import { NOIR, ANIM, FILM } from '../style/palette.js';
import { DEBUG } from '../render/debug.js';

// build one DOM node with props + children, compactly.
function h(tag, props, children) {
  const n = document.createElement(tag);
  if (props) for (const k in props) {
    if (k === 'class') n.className = props[k];
    else if (k === 'text') n.textContent = props[k];
    else n.setAttribute(k, props[k]);
  }
  if (children) for (const c of children) n.appendChild(c);
  return n;
}

// 'r,g,b' <-> '#rrggbb'
const hx = v => Math.max(0, Math.min(255, Math.round(+v))).toString(16).padStart(2, '0');
const rgbToHex = s => { const p = String(s).split(',').map(Number); return '#' + hx(p[0]) + hx(p[1]) + hx(p[2]); };
const hexToRgb = x => { const n = parseInt(x.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };

// the knob groups. Each row names a key on its group's object, with a slider range (or color/int).
const N = (key, min, max, step) => ({ key, min, max, step });
const I = key => ({ key, min: 1, max: 8, step: 1, int: true });
const C = key => ({ key, color: true });
const B = key => ({ key, toggle: true });
const ENV_ROWS = [N('ambient', 0, 1, 0.01), N('fill', 0, 1, 0.01), N('reach', 0, 6, 0.1), N('shadow', 0, 2, 0.05), N('soft', 0, 3, 0.05), N('length', 0, 2, 0.05), N('wash', 0, 3, 0.05)];

const SCHEMA = [
  { title: 'SHADOW', obj: SHADE, rows: [
    C('color'), N('floorAlpha', 0, 1, 0.01), N('wallAlpha', 0, 1, 0.01), N('contactAlpha', 0, 1, 0.01), N('aoCore', 0, 1, 0.01), N('creaseAlpha', 0, 1, 0.01),
    N('floorTilt', 0, 1, 0.01), N('lengthGain', 0, 3, 0.05), N('maxLen', 0.5, 6, 0.1), N('penumbra', 0, 2, 0.05),
    { ...I('softTaps') }, { ...I('wallTaps') }, N('edgeFeather', 0, 0.2, 0.005), { key: 'maxLights', min: 1, max: 4, step: 1, int: true }, N('minWeight', 0, 0.5, 0.01),
  ] },
  { title: 'WASH', obj: WASH, rows: [
    N('floorAlpha', 0, 1, 0.01), N('floorReach', 0, 1.5, 0.01), N('wallAlpha', 0, 1, 0.01), N('wallReach', 0, 1.5, 0.01), N('ambientAlpha', 0, 0.3, 0.005),
  ] },
  { title: 'AMBIENT', obj: AMBIENT, rows: [C('col')] },
  { title: 'ENV · INDOOR', obj: ENV.indoor, rows: ENV_ROWS, env: 'indoor' },
  { title: 'ENV · OUTDOOR', obj: ENV.outdoor, rows: ENV_ROWS, env: 'outdoor' },
  { title: 'MATERIAL', obj: MAT, rows: [N('colorRelax', 0, 1, 0.01), N('wrap', 0, 1, 0.01), N('rim', 0, 1, 0.01), N('rimWidth', 0.05, 0.95, 0.01), N('spec', 0, 2, 0.01), N('bounce', 0, 1, 0.01), N('floorBounce', 0, 1, 0.01), N('depthHaze', 0, 1, 0.01), N('depthScale', 0, 1, 0.01)] },
  { title: 'AIR', obj: AIR, rows: [{ key: 'motes', min: 0, max: 20, step: 1, int: true }, N('moteAlpha', 0, 1, 0.01), N('groundHaze', 0, 0.3, 0.005), C('hazeCol')] },
  { title: 'NOIR GRADE', obj: NOIR, rows: [N('saturation', 0, 1, 0.01), N('tintAmt', 0, 0.5, 0.01), C('tint')] },
  { title: 'FILM', obj: FILM, rows: [N('bloom', 0, 1, 0.01), N('temp', 0, 0.5, 0.01), N('contrast', 0, 0.5, 0.01), C('warm')] },
  { title: 'POST', obj: ANIM, rows: [N('vignette', 0, 1, 0.01), N('grainAlpha', 0, 0.1, 0.005), N('rainAlpha', 0, 1, 0.02)] },
  { title: 'DEBUG', obj: DEBUG, rows: [B('stage')] },
];

export function initLightLab({ engine }) {
  const rows = [];                 // {obj, key, def, sync()} for reset + refresh
  const envHeads = [];             // {env, head} to highlight the active profile

  // a single knob row: label, slider, number box (synced), reset.
  function knobRow(obj, r) {
    const def = obj[r.key];
    const label = h('span', { class: 'lab-k', text: r.key });
    const reset = h('button', { class: 'lab-rst', title: 'reset' }); reset.textContent = '↺';
    let sync;
    if (r.toggle) {
      const box = h('input'); box.type = 'checkbox'; box.checked = !!obj[r.key]; box.className = 'lab-chk';
      box.addEventListener('change', () => { obj[r.key] = box.checked; });
      sync = () => { box.checked = !!obj[r.key]; };
      reset.addEventListener('click', () => { obj[r.key] = def; sync(); });
      rows.push({ obj, key: r.key, def, sync });
      return h('div', { class: 'lab-row' }, [label, h('div', { class: 'lab-ctl' }, [box]), reset]);
    }
    if (r.color) {
      const pick = h('input'); pick.type = 'color'; pick.value = rgbToHex(obj[r.key]); pick.className = 'lab-col';
      pick.addEventListener('input', () => { obj[r.key] = hexToRgb(pick.value); });
      sync = () => { pick.value = rgbToHex(obj[r.key]); };
      reset.addEventListener('click', () => { obj[r.key] = def; sync(); });
      rows.push({ obj, key: r.key, def, sync });
      return h('div', { class: 'lab-row' }, [label, h('div', { class: 'lab-ctl' }, [pick]), reset]);
    }
    const range = h('input'); range.type = 'range'; range.min = r.min; range.max = r.max; range.step = r.step; range.value = obj[r.key]; range.className = 'lab-rng';
    const num = h('input'); num.type = 'number'; num.min = r.min; num.max = r.max; num.step = r.step; num.value = obj[r.key]; num.className = 'lab-num';
    const set = v => { v = r.int ? Math.round(+v) : +v; if (isNaN(v)) return; obj[r.key] = v; range.value = v; num.value = v; };
    range.addEventListener('input', () => set(range.value));
    num.addEventListener('input', () => set(num.value));
    sync = () => { range.value = obj[r.key]; num.value = obj[r.key]; };
    reset.addEventListener('click', () => set(def));
    rows.push({ obj, key: r.key, def, sync });
    return h('div', { class: 'lab-row' }, [label, h('div', { class: 'lab-ctl' }, [range, num]), reset]);
  }

  // groups
  const groups = SCHEMA.map(g => {
    const head = h('div', { class: 'lab-grp' }, [h('span', { text: g.title })]);
    if (g.env) envHeads.push({ env: g.env, head });
    const body = h('div', { class: 'lab-grpbody' }, g.rows.map(r => knobRow(g.obj, r)));
    return h('div', { class: 'lab-section' }, [head, body]);
  });

  // copy box + actions
  const copyBox = h('textarea', { class: 'lab-copy', readonly: 'readonly', spellcheck: 'false' });
  copyBox.style.display = 'none';
  const copyBtn = h('button', { class: 'lab-btn', text: 'COPY SETTINGS' });
  const resetAll = h('button', { class: 'lab-btn lab-btn-ghost', text: 'RESET ALL' });
  copyBtn.addEventListener('click', () => {
    const json = JSON.stringify({ SHADE, WASH, AMBIENT, ENV, MAT, NOIR, POST: { vignette: ANIM.vignette, grainAlpha: ANIM.grainAlpha, rainAlpha: ANIM.rainAlpha } }, null, 2);
    copyBox.value = json; copyBox.style.display = 'block';
    copyBox.focus(); copyBox.select();
    if (navigator.clipboard) navigator.clipboard.writeText(json).then(() => flash('COPIED ✓')).catch(() => flash('SELECT + COPY'));
    else { try { document.execCommand('copy'); flash('COPIED ✓'); } catch (e) { flash('SELECT + COPY'); } }
  });
  resetAll.addEventListener('click', () => { for (const rw of rows) { rw.obj[rw.key] = rw.def; rw.sync(); } });
  let flashT = null;
  function flash(msg) { copyBtn.textContent = msg; clearTimeout(flashT); flashT = setTimeout(() => copyBtn.textContent = 'COPY SETTINGS', 1100); }

  // head (title + collapse + close) and tab (collapsed handle)
  const collapseBtn = h('button', { class: 'lab-icon', title: 'collapse' }); collapseBtn.textContent = '▸';
  const closeBtn = h('button', { class: 'lab-icon', title: 'close' }); closeBtn.textContent = '✕';
  const profBadge = h('span', { class: 'lab-prof' });
  const head = h('div', { class: 'lab-head' }, [h('span', { class: 'lab-title', text: 'SHADOW & LIGHT' }), profBadge, collapseBtn, closeBtn]);
  const body = h('div', { class: 'lab-body' }, groups);
  const foot = h('div', { class: 'lab-foot' }, [h('div', { class: 'lab-btns' }, [copyBtn, resetAll]), copyBox]);
  const main = h('div', { class: 'lab-main' }, [head, body, foot]);
  const tab = h('button', { class: 'lab-tab', title: 'expand' }, [h('span', { text: 'SHADOW & LIGHT' })]);
  const root = h('div', { class: 'lab' }, [tab, main]);
  document.body.appendChild(root);

  collapseBtn.addEventListener('click', () => root.classList.add('collapsed'));
  tab.addEventListener('click', () => root.classList.remove('collapsed'));
  closeBtn.addEventListener('click', () => close());

  // reflect the active scene's env profile, and keep every control in sync while visible (so an
  // edit from elsewhere, or just re-opening, shows live values).
  let tick = null;
  function refresh() {
    const sc = engine.frame && engine.frame.scene;
    const prof = sc ? (sc.indoor ? 'indoor' : 'outdoor') : null;
    profBadge.textContent = prof ? prof.toUpperCase() : '';
    for (const e of envHeads) e.head.classList.toggle('on', e.env === prof);
    for (const rw of rows) rw.sync();
  }
  function open() { root.classList.add('show'); root.classList.remove('collapsed'); refresh(); if (!tick) tick = setInterval(refresh, 600); }
  function close() { root.classList.remove('show'); if (tick) { clearInterval(tick); tick = null; } }

  return { open, close, toggle: () => root.classList.contains('show') ? close() : open() };
}
