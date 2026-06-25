// ---- WEAPONS — switchblade, a gun left on a surface, and a Thompson SMG ----
import { Noir } from '../core/engine.js';
import { PALETTE } from '../core/palette.js';
import { TWO_PI } from '../core/math.js';
import { drawPistol } from './helpers.js';

Noir.registerActor('knife', (e, p) => {                     // switchblade; p.bloody for a red drip
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), y = (p.y != null ? p.y * e.H : e.gy - 4 * e.unit), L = 34 * s;
  c.save(); c.translate(X, y); c.rotate(p.angle || 0);
  const bg = c.createLinearGradient(0, -4 * s, 0, 4 * s); bg.addColorStop(0, '#e9edf3'); bg.addColorStop(0.5, '#9aa3b0'); bg.addColorStop(1, '#3a4049');
  c.fillStyle = bg; c.beginPath(); c.moveTo(0, -4 * s); c.lineTo(L, -1.2 * s); c.lineTo(L + 6 * s, 0); c.lineTo(L, 1.2 * s); c.lineTo(0, 4 * s); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -3 * s); c.lineTo(L, -1 * s); c.stroke();
  c.fillStyle = '#1a1d22'; c.fillRect(-3 * s, -7 * s, 5 * s, 14 * s);
  c.fillStyle = PALETTE.ink; c.fillRect(-22 * s, -4 * s, 19 * s, 8 * s);
  c.strokeStyle = 'rgba(120,128,140,0.4)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-20 * s + i * 5 * s, -4 * s); c.lineTo(-18 * s + i * 5 * s, 4 * s); c.stroke(); }
  c.fillStyle = '#22262c'; c.beginPath(); c.arc(-22 * s, 0, 3.5 * s, 0, TWO_PI); c.fill();
  if (p.bloody) { c.save(); c.fillStyle = '#c00010'; c.shadowColor = 'rgba(150,0,12,0.6)'; c.shadowBlur = 6; c.beginPath(); c.moveTo(L * 0.55, 3 * s); c.quadraticCurveTo(L * 0.55 + 1.4 * s, 9 * s, L * 0.55, 13 * s); c.quadraticCurveTo(L * 0.55 - 1.4 * s, 9 * s, L * 0.55, 3 * s); c.fill(); c.restore(); }
  c.restore();
});

Noir.registerActor('pistol', (e, p) => {                    // a gun left on a surface
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), y = (p.y != null ? p.y * e.H : e.gy - 3 * e.unit);
  c.save(); c.translate(X, y); c.rotate(p.angle || 0); if (p.flip) c.scale(-1, 1); drawPistol(c, 0, 0, s * 1.7); c.restore();
});

Noir.registerActor('tommyGun', (e, p) => {                  // Thompson SMG — pure gangster
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), y = (p.y != null ? p.y * e.H : e.gy - 22 * e.unit);
  c.save(); c.translate(X, y); c.rotate(p.angle || 0); if (p.flip) c.scale(-1, 1);
  c.fillStyle = '#15181d'; c.fillRect(0, -3 * s, 46 * s, 6 * s);
  c.strokeStyle = '#0a0c10'; c.lineWidth = 1; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(6 * s + i * 4 * s, -3 * s); c.lineTo(6 * s + i * 4 * s, 3 * s); c.stroke(); }
  c.fillStyle = '#15181d'; c.fillRect(40 * s, -6 * s, 22 * s, 12 * s);
  c.beginPath(); c.arc(50 * s, 8 * s, 10 * s, 0, TWO_PI); c.fill();
  c.strokeStyle = 'rgba(150,160,175,0.4)'; c.lineWidth = 1; c.beginPath(); c.arc(50 * s, 8 * s, 7 * s, 0, TWO_PI); c.stroke();
  c.fillStyle = '#2a1c12'; c.beginPath(); c.moveTo(62 * s, -5 * s); c.lineTo(80 * s, -9 * s); c.lineTo(82 * s, -2 * s); c.lineTo(64 * s, 3 * s); c.closePath(); c.fill();
  c.fillRect(20 * s, 4 * s, 6 * s, 12 * s);
  c.strokeStyle = 'rgba(200,210,225,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -3 * s); c.lineTo(46 * s, -3 * s); c.stroke();
  c.restore();
});
