// =====================================================================================
//  WEATHER & SKY — the timeless overlays: rain (coloured by the light it falls through),
//  lightning bolts, film grain, and the sky + moon (the moon registers as a weak light).
// =====================================================================================
import { Noir } from './engine.js';
import { PALETTE } from './palette.js';
import { ANIM } from './anim.js';
import { rand32 } from './math.js';

Object.assign(Noir, {
  initRain() { this.drops.length = 0; const n = Math.floor((this.W * this.H) / 5200); for (let i = 0; i < n; i++) this.drops.push({ x: Math.random() * (this.W + 200) - 100, y: Math.random() * this.H, len: 8 + Math.random() * 16, sp: 9 + Math.random() * 9 }); },
  buildGrain() { const g = document.createElement('canvas'); g.width = g.height = 220; const gx = g.getContext('2d'), im = gx.createImageData(220, 220); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } gx.putImageData(im, 0, 0); this.grain = g; },
  // rain takes the colour of the light each drop falls through (or runs bloody on a blood-rain scene)
  drawRain(bloodRain) {
    const c = this.ctx, drift = [], lit = !bloodRain && this.lights.length > 0;
    c.lineWidth = 1.1;
    c.strokeStyle = bloodRain ? `rgba(200,30,40,${ANIM.rainAlpha + 0.08})` : `rgba(180,190,210,${ANIM.rainAlpha})`;
    c.beginPath();
    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i]; d.y += d.sp * this.dt * 60; d.x -= d.sp * this.dt * 21;
      if (d.y > this.H) { d.y = -10; d.x = Math.random() * (this.W + 200) - 50; }
      let bi = -1;
      if (lit) { let bw = 0.3; for (let k = 0; k < this.lights.length; k++) { const L = this.lights[k]; const w = L.I * (1 - Math.hypot(d.x - L.x, (d.y - L.y) * 0.6) / L.r); if (w > bw) { bw = w; bi = k; } } }
      drift[i] = bi;
      if (bi < 0) { c.moveTo(d.x, d.y); c.lineTo(d.x - d.len * 0.35, d.y + d.len); }
    }
    c.stroke();
    if (lit) for (let k = 0; k < this.lights.length; k++) {
      c.strokeStyle = `rgba(${this.lights[k].col},${ANIM.rainAlpha + 0.1})`; c.beginPath();
      for (let i = 0; i < this.drops.length; i++) if (drift[i] === k) { const d = this.drops[i]; c.moveTo(d.x, d.y); c.lineTo(d.x - d.len * 0.35, d.y + d.len); }
      c.stroke();
    }
  },
  bolt(seed) {
    const c = this.ctx, rng = rand32(seed); let x = this.W * (0.2 + rng() * 0.6), y = 0;
    c.save(); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 2.5; c.shadowColor = '#cfe0ff'; c.shadowBlur = 18; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y);
    const segs = 9 + (rng() * 5 | 0);
    for (let i = 0; i < segs; i++) { x += (rng() - 0.5) * 70; y += this.H * 0.55 / segs; c.lineTo(x, y); if (rng() < 0.3) { c.moveTo(x, y); c.lineTo(x + (rng() - 0.5) * 60, y + 30 + rng() * 40); c.moveTo(x, y); } }
    c.stroke(); c.restore(); c.shadowBlur = 0;
  },
  drawSkyAndMoon(scene) {
    const c = this.ctx, sky = c.createLinearGradient(0, 0, 0, this.H);
    sky.addColorStop(0, PALETTE.skyTop); sky.addColorStop(0.55, PALETTE.skyMid); sky.addColorStop(1, PALETTE.skyLow);
    c.fillStyle = sky; c.fillRect(0, 0, this.W, this.H);
    c.fillStyle = 'rgba(200,210,230,0.5)';
    for (let i = 0; i < 40; i++) { const sx = (i * 197.3) % this.W, sy = (i * 91.7) % (this.H * 0.4); if ((i * 13) % 5 === 0) c.fillRect(sx, sy, 1.4, 1.4); }
    this._moon = null;
    if (scene.hideMoon) return;   // scenes whose walls occlude the moon (the alley) skip it, so no phantom reflection appears
    const m = scene.moon || { x: 0.78, y: 0.18 }, mx = m.x * this.W + this.parallax * 0.1, my = m.y * this.H;
    const mg = c.createRadialGradient(mx, my, 0, mx, my, 95); mg.addColorStop(0, 'rgba(220,228,245,0.9)'); mg.addColorStop(0.3, 'rgba(180,190,210,0.5)'); mg.addColorStop(1, 'rgba(180,190,210,0)');
    c.fillStyle = mg; c.beginPath(); c.arc(mx, my, 95, 0, 7); c.fill();
    c.fillStyle = PALETTE.moon; c.beginPath(); c.arc(mx, my, 34, 0, 7); c.fill();
    c.fillStyle = PALETTE.skyMid; c.beginPath(); c.arc(mx + 14, my - 6, 30, 0, 7); c.fill();
    this._moon = { x: mx, y: my, col: '170,190,225', I: 0.3 };   // a distant, weak cool light (gets a faint floor reflection too)
    this.pushLight(mx, my, this._moon.col, this.H * 0.62, this._moon.I);
  },
});
