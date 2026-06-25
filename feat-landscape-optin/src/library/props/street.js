// STREET PROPS — the city furniture. barrelFire and trafficLight also emit light (registered
// in emitLight, drawn by the lighting pass); the rest are unlit set pieces.
import { defineProp } from '../../objects/registry.js';
import { PALETTE } from '../../style/palette.js';
import { TWO_PI } from '../../engine/math.js';
import { rimSign, shade } from '../shared.js';

defineProp('barrelFire', function (e) {                       // a drum fire in the alley
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, t = e.t;
  c.save(); c.translate(X, gy);
  // the warm glow in the air comes from the lighting system (emitLight + air glow + floor wash),
  // not a hand-drawn gradient here. This draws only the drum and the flames themselves.
  c.fillStyle = '#15181d'; c.fillRect(-16 * s, -44 * s, 32 * s, 44 * s);
  c.strokeStyle = '#0a0c10'; c.lineWidth = 2; c.beginPath(); c.moveTo(-16 * s, -30 * s); c.lineTo(16 * s, -30 * s); c.moveTo(-16 * s, -14 * s); c.lineTo(16 * s, -14 * s); c.stroke();
  c.fillStyle = '#05060a'; c.beginPath(); c.ellipse(0, -44 * s, 16 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  for (let i = 0; i < 6; i++) { const fx = (i - 2.5) * 5 * s, fh = (18 + Math.sin(t * 8 + i) * 8) * s; c.fillStyle = i % 2 ? '#ff7a18' : '#ffd400'; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(fx - 4 * s, -44 * s); c.quadraticCurveTo(fx, -44 * s - fh, fx + 4 * s, -44 * s); c.closePath(); c.fill(); }
  c.globalAlpha = 1;
  for (let i = 0; i < 5; i++) { const life = (t * 0.6 + i * 0.2) % 1; c.globalAlpha = 1 - life; c.fillStyle = '#ffb030'; c.fillRect(Math.sin(i * 3 + t) * 14 * s, -44 * s - life * 50 * s, 1.5 * s, 1.5 * s); }
  c.globalAlpha = 1; c.restore();
}, {
  emitLight(e) {
    const s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, t = e.t;
    const fl = 0.7 + 0.3 * Math.sin(t * 7) + 0.1 * Math.sin(t * 19), I = 0.55 * fl, fy = gy - 46 * s;
    e.addLight({ x: X, y: fy, col: '255,140,40', r: 170 * s, I, ew: 15 * s, eh: 20 * s });
  },
});

defineProp('trafficLight', function (e) {                     // turns green on greenAt; a coloured light source
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
  const green = (this.greenAt != null && e.lineIdx >= this.greenAt);
  c.save(); c.translate(X, gy);
  c.fillStyle = '#191c22'; c.fillRect(-2.5 * s, -150 * s, 5 * s, 150 * s);                 // pole: visible steel (not near-black, which vanished against the buildings)
  c.fillStyle = 'rgba(150,160,175,0.18)'; c.fillRect(-2.5 * s, -150 * s, 1.6 * s, 150 * s); // edge highlight for form
  c.fillStyle = '#23272f'; c.fillRect(-11 * s, -202 * s, 22 * s, 54 * s);                  // housing
  c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.strokeRect(-11 * s, -202 * s, 22 * s, 54 * s);
  const lamp = (yy, on, col) => { c.fillStyle = on ? col : 'rgba(70,70,74,0.5)'; if (on) { c.shadowColor = col; c.shadowBlur = 16 * s; } c.beginPath(); c.arc(0, yy * s, 5 * s, 0, TWO_PI); c.fill(); c.shadowBlur = 0; };
  lamp(-190, !green, '#ff2a2a'); lamp(-175, false, '#ffd400'); lamp(-160, green, '#36d36e');
  c.restore();
}, {
  emitLight(e) {
    const s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
    const green = (this.greenAt != null && e.lineIdx >= this.greenAt);
    const ly = gy - (green ? 160 : 190) * s, col = green ? '54,211,110' : '255,42,42', r = 150 * (this.scale || 1);
    e.addLight({ x: X, y: ly, col, r, I: 0.6, ew: 5 * s, eh: 5 * s });
  },
});

defineProp('fireHydrant', function (e) {
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
  c.save(); c.translate(X, gy);
  c.fillStyle = '#16191e'; c.fillRect(-6 * s, -22 * s, 12 * s, 22 * s); c.beginPath(); c.arc(0, -22 * s, 7 * s, Math.PI, 0); c.fill();
  c.fillRect(-9 * s, -16 * s, 3 * s, 5 * s); c.fillRect(6 * s, -16 * s, 3 * s, 5 * s);
  c.fillStyle = '#0a0c10'; c.beginPath(); c.arc(0, -26 * s, 2.5 * s, 0, TWO_PI); c.fill();
  c.strokeStyle = 'rgba(200,210,225,0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5 * s, -20 * s); c.lineTo(-5 * s, -2 * s); c.stroke();
  c.restore();
}, {
  castsShadow: true, shadowW: 9, shadowH: 26,
  shadowSil(e, c) {
    const s = e.scaleOf(this);
    c.fillRect(-6 * s, -22 * s, 12 * s, 22 * s); c.beginPath(); c.arc(0, -22 * s, 7 * s, Math.PI, 0); c.fill();
    c.fillRect(-9 * s, -16 * s, 3 * s, 5 * s); c.fillRect(6 * s, -16 * s, 3 * s, 5 * s);
  },
});

defineProp('payphone', function (e) {
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
  c.save(); c.translate(X, gy);
  c.fillStyle = '#15181d'; c.fillRect(-12 * s, -60 * s, 24 * s, 46 * s);
  c.fillStyle = '#05060a'; c.fillRect(-9 * s, -56 * s, 18 * s, 18 * s);
  c.strokeStyle = 'rgba(200,210,225,0.25)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c.strokeRect(-7 * s + i * 5 * s, -34 * s + j * 5 * s, 3 * s, 3 * s);
  c.strokeStyle = '#0a0c10'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(-12 * s, -50 * s); c.quadraticCurveTo(-20 * s, -40 * s, -14 * s, -28 * s); c.stroke();
  c.fillStyle = '#1a1d22'; c.beginPath(); c.arc(-12 * s, -50 * s, 3 * s, 0, TWO_PI); c.arc(-14 * s, -28 * s, 3 * s, 0, TWO_PI); c.fill();
  c.restore();
});

defineProp('streetSign', function (e) {
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
  c.save(); c.translate(X, gy);
  c.fillStyle = PALETTE.ink; c.fillRect(-1.5 * s, -120 * s, 3 * s, 120 * s);
  c.save(); c.translate(0, -116 * s); c.fillStyle = '#1c2a22'; c.fillRect(-30 * s, -7 * s, 60 * s, 12 * s);
  c.fillStyle = 'rgba(220,230,225,0.85)'; c.font = `bold ${7 * s}px "Courier New",monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(this.label || 'SIN ST', 0, -1 * s); c.restore();
  c.restore();
}, {
  castsShadow: true, shadowW: 30, shadowH: 123,
  shadowSil(e, c) { const s = e.scaleOf(this); c.fillRect(-1.5 * s, -120 * s, 3 * s, 120 * s); c.fillRect(-30 * s, -123 * s, 60 * s, 12 * s); },
});

defineProp('waterTower', function (e) {
  const c = e.ctx, s = e.unit * (this.scale || 1), X = e.X(this), b = e.gy; c.fillStyle = PALETTE.ink;
  c.beginPath(); c.moveTo(X - 22 * s, b); c.lineTo(X - 16 * s, b - 60 * s); c.lineTo(X - 12 * s, b); c.closePath(); c.moveTo(X + 22 * s, b); c.lineTo(X + 16 * s, b - 60 * s); c.lineTo(X + 12 * s, b); c.fill();
  c.fillRect(X - 24 * s, b - 88 * s, 48 * s, 30 * s); c.beginPath(); c.moveTo(X - 24 * s, b - 88 * s); c.lineTo(X, b - 108 * s); c.lineTo(X + 24 * s, b - 88 * s); c.closePath(); c.fill();
});

defineProp('dumpster', function (e) {
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), g = e.gy, bw = 30 * s, bh = 46 * s;
  rimSign(e, this);                                            // the steel darkens in an unlit corner, lifts near a light
  c.save();
  c.fillStyle = shade([28, 32, 39]); c.fillRect(X - bw / 2, g - bh, bw, bh);
  c.fillStyle = shade([39, 44, 53]); c.fillRect(X - bw / 2 - 3 * s, g - bh - 3 * s, bw + 6 * s, 3.5 * s);
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1.5; c.strokeRect(X - bw / 2, g - bh, bw, bh);
  c.beginPath(); for (let i = 1; i < 4; i++) { c.moveTo(X - bw / 2 + i * bw / 4, g - bh); c.lineTo(X - bw / 2 + i * bw / 4, g); } c.stroke();
  c.restore();
}, {
  castsShadow: true, shadowW: 18, shadowH: 50,
  shadowSil(e, c) { const s = e.scaleOf(this), bw = 30 * s, bh = 46 * s; c.fillRect(-bw / 2, -bh, bw, bh); c.fillRect(-bw / 2 - 3 * s, -bh - 3 * s, bw + 6 * s, 3.5 * s); },
});

defineProp('manhole', function (e) {
  const c = e.ctx, s = e.unit * (this.scale || 1), cx = e.X(this), cy = (this.y != null ? this.y * e.H : e.gy + (e.H - e.gy) * 0.42), sq = 0.42;
  c.save(); c.translate(cx, cy);
  c.fillStyle = '#0a0c10'; c.beginPath(); c.ellipse(0, 1.5 * s, 32 * s, 32 * s * sq, 0, 0, TWO_PI); c.fill();
  c.fillStyle = '#22262e'; c.beginPath(); c.ellipse(0, 0, 29 * s, 29 * s * sq, 0, 0, TWO_PI); c.fill();
  c.fillStyle = '#14171c'; c.beginPath(); c.ellipse(0, 0, 25 * s, 25 * s * sq, 0, 0, TWO_PI); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1.3 * s;
  for (let r = 7; r <= 22; r += 7) { c.beginPath(); c.ellipse(0, 0, r * s, r * s * sq, 0, 0, TWO_PI); c.stroke(); }
  for (let a = 0; a < 8; a++) { const cc = Math.cos(a * Math.PI / 4), sn = Math.sin(a * Math.PI / 4) * sq; c.beginPath(); c.moveTo(cc * 5 * s, sn * 5 * s); c.lineTo(cc * 23 * s, sn * 23 * s); c.stroke(); }
  c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, 0, 3 * s, 1.6 * s, 0, 0, TWO_PI); c.fill();
  c.restore();
});
