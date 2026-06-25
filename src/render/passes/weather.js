// WEATHER PASS — rain (coloured by the light each drop falls through, or bloody on a blood-rain
// scene) and lightning (flash + bolt). Outdoor only; the scene decides `indoor`.
import { ANIM } from '../../style/palette.js';
import { rand32 } from '../../engine/math.js';

export function weather(e) {
  if (e.scene.indoor) { e.scene.lightning = 0; return; }
  rain(e, e.scene.data.bloodRain);
  if (e.scene._boltSeed != null) bolt(e, e.scene._boltSeed);
  if (e.scene.lightning > 0) { const c = e.ctx, R = e.coverRect(); c.fillStyle = `rgba(255,255,255,${e.scene.lightning * 0.5})`; c.fillRect(R.x, R.y, R.w, R.h); }
}

function rain(e, bloodRain) {
  const c = e.ctx, drops = e.drops, drift = [], lit = !bloodRain && e.lights.length > 0, k = e.unit / 3;
  c.lineWidth = (bloodRain ? 1.6 : 1.1) * k;   // blood rain falls heavier; width tracks the scene scale (1 at 1080p)
  c.strokeStyle = bloodRain ? `rgba(168,8,16,${ANIM.rainAlpha + 0.22})` : `rgba(180,190,210,${ANIM.rainAlpha})`;
  c.beginPath();
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i]; d.y += d.sp * e.dt * 60; d.x -= d.sp * e.dt * 21;
    if (d.y > e.H) { d.y = -10; d.x = Math.random() * (e.W + 200) - 50; }
    let bi = -1;
    if (lit) { let bw = 0.3; for (let k = 0; k < e.lights.length; k++) { const L = e.lights[k]; const w = L.I * (1 - Math.hypot(d.x - L.x, (d.y - L.y) * 0.6) / L.r); if (w > bw) { bw = w; bi = k; } } }
    drift[i] = bi;
    if (bi < 0) { c.moveTo(d.x, d.y); c.lineTo(d.x - d.len * 0.35, d.y + d.len); }
  }
  c.stroke();
  if (lit) for (let k = 0; k < e.lights.length; k++) {
    c.strokeStyle = `rgba(${e.lights[k].col},${ANIM.rainAlpha + 0.1})`; c.beginPath();
    for (let i = 0; i < drops.length; i++) if (drift[i] === k) { const d = drops[i]; c.moveTo(d.x, d.y); c.lineTo(d.x - d.len * 0.35, d.y + d.len); }
    c.stroke();
  }
}

function bolt(e, seed) {
  const c = e.ctx, rng = rand32(seed); let x = e.W * (0.2 + rng() * 0.6), y = 0;
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 2.5; c.shadowColor = '#cfe0ff'; c.shadowBlur = 18; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y);
  const segs = 9 + (rng() * 5 | 0);
  for (let i = 0; i < segs; i++) { x += (rng() - 0.5) * 70; y += e.H * 0.55 / segs; c.lineTo(x, y); if (rng() < 0.3) { c.moveTo(x, y); c.lineTo(x + (rng() - 0.5) * 60, y + 30 + rng() * 40); c.moveTo(x, y); } }
  c.stroke(); c.restore(); c.shadowBlur = 0;
}
