// =====================================================================================
//  LIGHTING — the light model. Declared lights are drawn (fixture), then registered so
//  they light the air (halo), the wet floor (smeared reflection) and the rain/ripples
//  that fall through them. Also: ground shadows, dominant-light colour, and the fixture
//  drawers (_lamp, _neon, _bulb, _glow) + the shared wet floor.
// =====================================================================================
import { Noir } from './engine.js';
import { PALETTE } from './palette.js';
import { TWO_PI, lerp, hexRgb, cssRgb } from './math.js';
import { Audio2 } from './audio.js';
import { Ripples } from '../effects/ripples.js';

Object.assign(Noir, {
  // ---- light sources: declared in the story, drawn here ----
  // every declared light: draw the fixture, then register it so it lights the air, the wet
  // floor (a smeared reflection) and the rain/ripples that fall through it.
  drawLights(scene) {
    // the moon's reflection on the wet floor first (it sits behind everything, and is weak/distant)
    if (this._moon && this._moon.y < this.gy) this.floorRefl(this._moon.x, this._moon.col, this._moon.I * 0.6, 30, 0);
    for (const L of (scene.lights || [])) {
      const x = L.x * this.W + this.parallax * (L.par == null ? 0.5 : L.par);
      const y = (L.y != null ? L.y : 0.5) * this.H;
      // ONE flicker value per light, shared by the fixture, the halo, the floor reflection and the rain
      let flick = L.flicker ? (Math.sin(this.t * 30 + (L.seed || 0)) > -0.9 ? 1 : 0.4) * (0.85 + 0.15 * Math.sin(this.t * 7)) : 1;
      if (L.type === 'neon') flick = (Math.sin(this.t * 5 + (L.seed || 0)) > -0.95) ? (0.88 + 0.12 * Math.sin(this.t * 13 + (L.seed || 0))) : 0.5;  // calm: rare, shallow dips
      // a sign declared `ignite` starts dark and strikes on once, with the neon sound, when the scene opens
      if (L.ignite && this.transState !== 'in' && this.transState !== 'card') { const st = this.sceneT(); flick = st < 0.4 ? 0.04 : (st < 1.9 ? (Math.sin(st * 34) > -0.1 ? flick : 0.12) : flick); if (st >= 0.4 && !this.flags._ign) { this.flags._ign = true; Audio2.neonZap(); } }
      else if (L.ignite) flick = 0.04;
      const intensity = (L.intensity || 1) * flick;
      let lx = x, ly = y, col = '255,250,225', r = 150, I = 0.55, fw = 18;
      if (L.type === 'lamp') { const s = this.unit * (L.scale || 1); this._lamp(x, this.gy, s, intensity); lx = x + 26 * s; ly = this.gy - 150 * s; r = 150 * (L.scale || 1); I = 0.5 * flick; fw = 22; }
      else if (L.type === 'neon') { this._neon(x, y, L.w, L.h, L.color, L.label, flick, L.arrow); lx = x + L.w / 2 + (L.arrow ? L.h * 0.45 : 0); ly = y + L.h / 2; col = hexRgb(L.color); r = Math.max(L.w, L.h) * 1.8; I = 0.9 * flick; fw = Math.max(22, L.w * 0.45); }
      else if (L.type === 'bulb') { this._bulb(x, y, intensity); col = '255,244,210'; r = 150; I = 0.6 * flick; fw = 18; }
      else if (L.type === 'glow') { this._glow(x, y, L.r, L.color, intensity); col = cssRgb(L.color); r = L.r; I = 0.5 * intensity; fw = Math.max(18, L.r * 0.12); }
      this.pushLight(lx, ly, col, r, I);
      this.lightHalo(lx, ly, col, r, I);
      if (ly < this.gy - 4) this.floorRefl(lx, col, I, fw, L._sway || 0);
    }
    Ripples.draw(this);
  },
  // ---- the light model: register, halo on the air, smeared reflection on the wet floor ----
  pushLight(x, y, col, r, I) { this.lights.push({ x, y, col, r, I }); },
  lightHalo(x, y, col, r, I) {
    const c = this.ctx; c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${col},${0.42 * I})`); g.addColorStop(0.45, `rgba(${col},${0.12 * I})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  },
  // the original smeared streak reflection, now run through a real (frosted-glass) gaussian blur
  floorRefl(x, col, I, w, sway) {
    const c = this.ctx, g = this.gy, H = this.H; sway = sway || 0;
    c.save(); c.globalCompositeOperation = 'lighter'; c.filter = 'blur(7px)';
    const grad = c.createLinearGradient(0, g, 0, H);
    grad.addColorStop(0, `rgba(${col},${0.5 * I})`); grad.addColorStop(0.4, `rgba(${col},${0.17 * I})`); grad.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = grad;
    c.beginPath(); c.moveTo(x - w, g);
    c.quadraticCurveTo(x - w * 0.7 + sway, g + (H - g) * 0.5, x - w * 0.5 + sway * 1.7, H);
    c.lineTo(x + w * 0.5 + sway * 1.7, H);
    c.quadraticCurveTo(x + w * 0.7 + sway, g + (H - g) * 0.5, x + w, g);
    c.closePath(); c.fill();
    c.filter = 'none'; c.restore();
  },
  // a wet-floor ripple's colour: the blended sum of every light reaching x (red + green → amber)
  litColor(x, gr, gg, gb) {
    let r = 0, g = 0, b = 0, wsum = 0;
    for (const L of this.lights) { const w = L.I * (1 - Math.abs(x - L.x) / (L.r * 0.6)); if (w > 0) { const cc = L.col.split(','); r += cc[0] * w; g += cc[1] * w; b += cc[2] * w; wsum += w; } }
    if (wsum < 0.18) return [gr, gg, gb];
    const m = Math.min(1, wsum * 0.9 + 0.2);
    return [Math.round(lerp(gr, r / wsum, m)), Math.round(lerp(gg, g / wsum, m)), Math.round(lerp(gb, b / wsum, m))];
  },
  // the strongest light reaching a point (used for form-light colour, rim side and shadow direction)
  dominantLight(wx, wy) {
    let best = null, bw = 0.12;
    for (const L of this.lights) { const w = L.I * (1 - Math.abs(wx - L.x) / (L.r * 1.1)); if (w > bw) { bw = w; best = L; } }
    return best;
  },
  litTint(wx) { const L = this.dominantLight(wx); return L ? L.col.split(',').map(Number) : null; },
  // directional ground shadows: each significant light throws a soft shadow opposite itself, its
  // length set by the light's height/angle and its darkness by the light's strength and distance
  groundShadow(wx, halfW, objH) {
    const c = this.ctx, g = this.gy;
    const cands = this.lights.map(L => ({ L, w: L.I * (1 - Math.abs(wx - L.x) / (L.r * 1.2)) })).filter(o => o.w > 0.06).sort((a, b) => b.w - a.w).slice(0, 2);
    c.save();
    if (!cands.length) { c.globalAlpha = 0.3; c.fillStyle = '#000'; c.filter = 'blur(3px)'; c.beginPath(); c.ellipse(wx, g + 4, halfW * 1.1, halfW * 0.24, 0, 0, TWO_PI); c.fill(); c.restore(); return; }
    c.filter = 'blur(6px)';
    for (const { L, w } of cands) {
      const dir = wx >= L.x ? 1 : -1, dist = Math.abs(wx - L.x), vert = Math.max(24, g - L.y);
      const len = Math.min(objH * 2.2, halfW + objH * (dist / vert) * 0.9 + objH * 0.2);
      c.fillStyle = `rgba(0,0,0,${Math.min(0.42, 0.32 * w)})`;
      c.beginPath(); c.ellipse(wx + dir * len * 0.45, g + 4, halfW * 0.7 + len * 0.55, halfW * 0.26, 0, 0, TWO_PI); c.fill();
    }
    c.filter = 'none'; c.restore();
  },
  _glow(x, y, r, color, a) { const c = this.ctx, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color.replace('ALPHA', 0.3 * a)); g.addColorStop(1, color.replace('ALPHA', 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); },
  _lamp(x, gy, s, fl) {
    const c = this.ctx, topY = gy - 150 * s; c.fillStyle = PALETTE.ink;
    c.fillRect(x - 2 * s, topY, 4 * s, 150 * s);
    c.beginPath(); c.moveTo(x, topY); c.lineTo(x + 26 * s, topY - 4 * s); c.lineTo(x + 26 * s, topY + 3 * s); c.closePath(); c.fill();
    const lx = x + 26 * s, ly = topY - 2 * s, g = c.createRadialGradient(lx, ly, 0, lx, ly + 110 * s, 150 * s);
    g.addColorStop(0, `rgba(255,250,225,${0.30 * fl})`); g.addColorStop(0.4, `rgba(230,235,255,${0.10 * fl})`); g.addColorStop(1, 'rgba(230,235,255,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx - 70 * s, gy); c.lineTo(lx + 70 * s, gy); c.closePath(); c.fill();
    c.fillStyle = `rgba(255,250,230,${fl})`; c.shadowColor = '#fff'; c.shadowBlur = 24 * fl; c.beginPath(); c.arc(lx, ly + 4 * s, 4 * s, 0, 7); c.fill(); c.shadowBlur = 0;
    c.fillStyle = PALETTE.ink; c.beginPath(); c.moveTo(lx - 7 * s, ly - 6 * s); c.lineTo(lx + 7 * s, ly - 6 * s); c.lineTo(lx + 4 * s, ly + 2 * s); c.lineTo(lx - 4 * s, ly + 2 * s); c.closePath(); c.fill();
  },
  _neon(x, y, w, h, color, label, fl, arrow) {
    const c = this.ctx;
    c.save(); c.strokeStyle = color; c.lineWidth = 3; c.shadowColor = color; c.shadowBlur = 18 * fl;
    c.globalAlpha = 0.35 + 0.65 * fl; c.lineJoin = 'round'; c.lineCap = 'round';
    if (arrow) {                                         // a right-pointing diner arrow with the label inside
      const pw = h * 0.9;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w + pw, y + h / 2); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.stroke();
      c.fillStyle = color; c.font = `bold ${Math.floor(h * 0.56)}px "Courier New",monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(label, x + w / 2, y + h / 2 + 1);
      c.restore(); c.shadowBlur = 0; c.globalAlpha = 1; return;
    }
    c.strokeRect(x, y, w, h);
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle';
    const n = Math.max(1, label.length);
    if (h > w * 1.5) {                                   // tall sign → stack letters vertically
      const fs = Math.min(w * 0.66, (h - 8) / n); c.font = `bold ${fs}px "Courier New",monospace`;
      for (let i = 0; i < n; i++) c.fillText(label[i], x + w / 2, y + (i + 0.5) * h / n);
    } else {                                             // wide sign → fit text to the box
      const fs = Math.min(h * 0.6, (w - 10) / n * 1.7); c.font = `bold ${fs}px "Courier New",monospace`;
      c.fillText(label, x + w / 2, y + h / 2 + 1);
    }
    c.restore(); c.shadowBlur = 0; c.globalAlpha = 1;
  },
  _bulb(x, y, fl) {
    const c = this.ctx; c.strokeStyle = PALETTE.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 95); c.lineTo(x, y); c.stroke();
    const g = c.createRadialGradient(x, y, 0, x, y, 120); g.addColorStop(0, `rgba(255,244,210,${0.22 * fl})`); g.addColorStop(1, 'rgba(255,244,210,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, 120, 0, 7); c.fill();
    c.fillStyle = `rgba(255,246,220,${fl})`; c.shadowColor = '#fff'; c.shadowBlur = 16; c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); c.shadowBlur = 0;
  },

  // ---- shared wet floor (the coloured light reflections are added later by drawLights/floorRefl) ----
  wetFloor() {
    const c = this.ctx, g = this.gy;
    const st = c.createLinearGradient(0, g, 0, this.H); st.addColorStop(0, '#0a0b0f'); st.addColorStop(1, PALETTE.ink);
    c.fillStyle = st; c.fillRect(0, g, this.W, this.H - g);
    c.globalAlpha = 0.10; c.fillStyle = PALETTE.steel;
    for (let i = 0; i < 30; i++) { const rx = ((i * 137.5 + this.t * 6) % this.W); c.fillRect(rx, g + (i % 6) * (this.H - g) / 6, 2 + (i % 4), 2); }
    c.globalAlpha = 1;
  },
});
