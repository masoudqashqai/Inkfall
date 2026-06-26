// BLOOD & AFTERMATH — the body, the splat, a chalk outline, and blood crawling to the drain.
// Usually revealed by a line's `blood` flag (onFlag: 'blood').
import { defineEffect } from '../../objects/registry.js';
import { PALETTE } from '../../style/palette.js';
import { TWO_PI, rand32, lerp, smooth01 } from '../../engine/math.js';

defineEffect('bodyOnGround', function (e) {
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, fp = this.flip ? -1 : 1;
  c.save(); c.fillStyle = '#9e000e'; c.shadowColor = 'rgba(150,0,12,0.5)'; c.shadowBlur = 10;
  c.beginPath(); c.ellipse(X + fp * 30 * s, gy + 2 * s, 34 * s, 9 * s, 0, 0, TWO_PI); c.fill(); c.shadowBlur = 0;
  c.fillStyle = PALETTE.ink; c.save(); c.translate(X, gy); c.scale(fp, 1);
  c.beginPath(); c.ellipse(-6 * s, -7 * s, 26 * s, 9 * s, 0, 0, TWO_PI); c.fill();
  c.beginPath(); c.arc(-30 * s, -9 * s, 8 * s, 0, TWO_PI); c.fill();
  c.beginPath(); c.ellipse(-48 * s, -3 * s, 9 * s, 3 * s, 0, 0, TWO_PI); c.fill(); c.fillRect(-52 * s, -10 * s, 8 * s, 6 * s);
  c.fillRect(14 * s, -11 * s, 24 * s, 6 * s); c.fillRect(14 * s, -3 * s, 22 * s, 6 * s);
  c.restore(); c.restore();
});

defineEffect('chalkOutline', function (e) {
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
  c.save(); c.translate(X, gy); c.scale(1, 0.42); c.strokeStyle = 'rgba(232,234,240,0.7)'; c.lineWidth = 2 * s; c.lineJoin = 'round';
  c.beginPath(); c.arc(-28 * s, 0, 8 * s, 0, TWO_PI); c.stroke();
  c.beginPath(); c.moveTo(-20 * s, -6 * s); c.quadraticCurveTo(0, -14 * s, 20 * s, -22 * s); c.moveTo(-20 * s, 4 * s); c.quadraticCurveTo(0, 10 * s, 24 * s, 4 * s); c.moveTo(-18 * s, 0); c.quadraticCurveTo(10 * s, 2 * s, 30 * s, 16 * s); c.stroke();
  c.restore();
});

defineEffect('bloodSplat', function (e) {
  const c = e.ctx, s = e.unit * (this.scale || 1) / 1.4, X = e.X(this), y = (this.y != null ? this.y : (e.gy / e.H + 0.02)) * e.H, rng = rand32(this.seed || 999);
  c.save(); c.fillStyle = '#b00010'; c.shadowColor = 'rgba(150,0,12,0.5)'; c.shadowBlur = 8;
  c.beginPath(); c.ellipse(X, y, 14 * s, 5 * s, 0, 0, TWO_PI); c.fill();
  for (let i = 0; i < 16; i++) { const a = rng() * TWO_PI, d = (10 + rng() * 44) * s, r = (1 + rng() * 4) * s; c.beginPath(); c.arc(X + Math.cos(a) * d, y + Math.sin(a) * d * 0.5, r, 0, TWO_PI); c.fill(); }
  c.shadowBlur = 0; c.restore();
});

defineEffect('bloodDrain', function (e) {                     // crawls to the drain from drainAt onward
  if (!e.flags.blood) return;
  const drainAt = this.drainAt != null ? this.drainAt : 0;
  if (e.lineIdx < drainAt) return;
  const amt = e.lineIdx > drainAt ? 1 : smooth01(e.beat() / 5);
  const c = e.ctx, par = e.scene.camera.look * (this.par == null ? 0.5 : this.par);
  const x = this.x * e.W + par, y = e.gy + 12;
  const dx = (this.drainX != null ? this.drainX : 0.5) * e.W + par, dy = (this.drainY != null ? this.drainY * e.H : e.gy + (e.H - e.gy) * 0.42);
  const cx2 = (x + dx) / 2, cy2 = Math.max(y, dy) + 16, reach = Math.min(1, amt), N = 46;
  c.save();
  c.fillStyle = 'rgba(116,0,12,0.82)'; c.beginPath(); c.ellipse(x, y, 14 + 12 * amt, 5 + 4 * amt, 0, 0, TWO_PI); c.fill();
  for (let i = 0; i <= N; i++) {
    const u = i / N; if (u > reach) break;
    const bx = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx2 + u * u * dx, by = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy2 + u * u * dy;
    const wob = Math.sin(u * 8 + e.t * 1.3) * (1 + u * 2.4), r = lerp(5.2, 1.8, u);
    c.fillStyle = `rgba(${Math.round(lerp(120, 200, u))},${Math.round(lerp(0, 60, u))},${Math.round(lerp(12, 72, u))},${lerp(0.85, 0.4, u)})`;
    c.beginPath(); c.ellipse(bx + wob, by, r, r * 0.78, 0, 0, TWO_PI); c.fill();
  }
  if (reach > 0.8) { c.fillStyle = 'rgba(170,30,50,0.42)'; c.beginPath(); c.ellipse(dx, dy, 11, 4.4, 0, 0, TWO_PI); c.fill(); }
  c.restore();
}, { unlit: true });   // crawls a long trail from its node x to the drain, so it draws straight to the scene
