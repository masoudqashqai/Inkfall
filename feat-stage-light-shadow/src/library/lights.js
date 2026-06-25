// LIGHTS — the declared light sources. Each registers its light record in emitLight (consumed
// by the lighting pass for halo + reflection and by rim/shadow) and paints its visible fixture
// in draw. The per-frame flicker is computed in emit and reused by draw.
import { defineLight } from '../objects/registry.js';
import { hexRgb, cssRgb } from '../engine/math.js';
import { Audio2 } from '../assets/audio.js';

defineLight('lamp', {
  emitLight(e) {
    const t = e.t, X = e.X(this), s = e.unit * (this.scale || 1);
    const flick = this.flicker ? (Math.sin(t * 30 + (this.seed || 0)) > -0.9 ? 1 : 0.4) * (0.85 + 0.15 * Math.sin(t * 7)) : 1;
    this._flick = flick; this._X = X; this._s = s;
    // the lamp's downward shaft is now a lighting-system beam (was a hand-drawn cone in draw),
    // apex at the bulb, widening to the wet floor.
    e.addLight({
      x: X + 26 * s, y: e.gy - 150 * s, col: '255,250,225', r: 150 * (this.scale || 1), I: 0.5 * flick, ew: 6 * s, eh: 6 * s,
      shade: true,                                            // the hood caps the glow: it spills downward only
      beam: { dir: 0, len: 152 * s, farW: 70 * s, I: flick },
    });
  },
  draw(e) {
    const c = e.ctx, X = this._X, s = this._s, gy = e.gy, fl = (this.intensity || 1) * this._flick, ink = e.palette.ink;
    const topY = gy - 150 * s; c.fillStyle = ink;
    c.fillRect(X - 2 * s, topY, 4 * s, 150 * s);
    c.beginPath(); c.moveTo(X, topY); c.lineTo(X + 26 * s, topY - 4 * s); c.lineTo(X + 26 * s, topY + 3 * s); c.closePath(); c.fill();
    const lx = X + 26 * s, ly = topY - 2 * s;
    c.fillStyle = `rgba(255,250,230,${fl})`; c.shadowColor = '#fff'; c.shadowBlur = 24 * fl; c.beginPath(); c.arc(lx, ly + 4 * s, 4 * s, 0, 7); c.fill(); c.shadowBlur = 0;
    c.fillStyle = ink; c.beginPath(); c.moveTo(lx - 7 * s, ly - 6 * s); c.lineTo(lx + 7 * s, ly - 6 * s); c.lineTo(lx + 4 * s, ly + 2 * s); c.lineTo(lx - 4 * s, ly + 2 * s); c.closePath(); c.fill();
  },
});

defineLight('neon', {
  emitLight(e) {
    const t = e.t, seed = this.seed || 0, X = e.X(this), y = (this.y != null ? this.y : 0.5) * e.H;
    let flick = (Math.sin(t * 5 + seed) > -0.95) ? (0.88 + 0.12 * Math.sin(t * 13 + seed)) : 0.5;
    if (this.ignite) {
      const covering = e.flow && (e.flow.transState === 'in' || e.flow.transState === 'card');
      if (!covering) { const st = e.sceneT(); flick = st < 0.4 ? 0.04 : (st < 1.9 ? (Math.sin(st * 34) > -0.1 ? flick : 0.12) : flick); if (st >= 0.4 && !e.flags._ign) { e.flags._ign = true; Audio2.neonZap(); } }
      else flick = 0.04;
    }
    this._flick = flick; this._X = X; this._y = y;
    const lx = X + this.w / 2 + (this.arrow ? this.h * 0.45 : 0), ly = y + this.h / 2;
    e.addLight({ x: lx, y: ly, col: hexRgb(this.color), r: Math.max(this.w, this.h) * 1.8, I: 0.9 * flick, ew: this.w * 0.55, eh: this.h * 0.55 });
  },
  draw(e) { neonFixture(e.ctx, this._X, this._y, this.w, this.h, this.color, this.label, this._flick, this.arrow); },
});

defineLight('bulb', {
  emitLight(e) {
    const t = e.t, X = e.X(this), y = (this.y != null ? this.y : 0.5) * e.H;
    const flick = this.flicker ? (Math.sin(t * 30 + (this.seed || 0)) > -0.9 ? 1 : 0.4) * (0.85 + 0.15 * Math.sin(t * 7)) : 1;
    this._flick = flick; this._X = X; this._y = y;
    e.addLight({ x: X, y, col: '255,244,210', r: 150, I: 0.6 * flick, ew: 5, eh: 5 });
  },
  draw(e) {
    const c = e.ctx, x = this._X, y = this._y, fl = (this.intensity || 1) * this._flick;
    c.strokeStyle = e.palette.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 95); c.lineTo(x, y); c.stroke();
    const g = c.createRadialGradient(x, y, 0, x, y, 120); g.addColorStop(0, `rgba(255,244,210,${0.22 * fl})`); g.addColorStop(1, 'rgba(255,244,210,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, 120, 0, 7); c.fill();
    c.fillStyle = `rgba(255,246,220,${fl})`; c.shadowColor = '#fff'; c.shadowBlur = 16; c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); c.shadowBlur = 0;
  },
});

defineLight('glow', {
  emitLight(e) {
    const X = e.X(this), y = (this.y != null ? this.y : 0.5) * e.H, I = 0.5 * (this.intensity || 1);
    e.addLight({ x: X, y, col: cssRgb(this.color), r: this.r, I, ew: this.r * 0.3, eh: this.r * 0.3 });
  },
});

function neonFixture(c, x, y, w, h, color, label, fl, arrow) {
  c.save(); c.strokeStyle = color; c.lineWidth = 3; c.shadowColor = color; c.shadowBlur = 18 * fl;
  c.globalAlpha = 0.35 + 0.65 * fl; c.lineJoin = 'round'; c.lineCap = 'round';
  if (arrow) {
    const pw = h * 0.9;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w + pw, y + h / 2); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.stroke();
    c.fillStyle = color; c.font = `bold ${Math.floor(h * 0.56)}px "Courier New",monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, x + w / 2, y + h / 2 + 1);
    c.restore(); c.shadowBlur = 0; c.globalAlpha = 1; return;
  }
  c.strokeRect(x, y, w, h);
  c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle';
  const n = Math.max(1, label.length);
  if (h > w * 1.5) {
    const fs = Math.min(w * 0.66, (h - 8) / n); c.font = `bold ${fs}px "Courier New",monospace`;
    for (let i = 0; i < n; i++) c.fillText(label[i], x + w / 2, y + (i + 0.5) * h / n);
  } else {
    const fs = Math.min(h * 0.6, (w - 10) / n * 1.7); c.font = `bold ${fs}px "Courier New",monospace`;
    c.fillText(label, x + w / 2, y + h / 2 + 1);
  }
  c.restore(); c.shadowBlur = 0; c.globalAlpha = 1;
}
