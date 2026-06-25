// SHARED LIBRARY PRIMITIVES — reusable sub-drawings the cast & props build on: cigarette
// ember + smoke, a snap-brim fedora, a pistol, a muzzle flash. Re-exports the material
// helpers so library files import their shading from one place.
import { TWO_PI } from '../engine/math.js';
import { PALETTE, ANIM } from '../style/palette.js';
export { rimSign, bodyGrad } from '../style/materials.js';

export function ember(c, x, y, s, t) { const em = 0.6 + 0.4 * Math.sin(t * ANIM.emberSpeed); c.save(); c.fillStyle = `rgba(255,60,30,${0.7 + 0.3 * em})`; c.shadowColor = PALETTE.ember; c.shadowBlur = 10 * em; c.beginPath(); c.arc(x, y, 1.9 * s, 0, TWO_PI); c.fill(); c.restore(); }

export function cigSmoke(c, x, y, s, t) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const life = (t * 0.4 + i * 0.16) % 1, yy = y - life * 42 * s, xx = x + Math.sin(t * 1.2 + i) * 4 * s * life, r = (1.4 + life * 5) * s, a = 0.11 * (1 - life); c.fillStyle = `rgba(210,214,224,${a})`; c.beginPath(); c.arc(xx, yy, r, 0, TWO_PI); c.fill(); }
  c.restore();
}

export function drawFedora(c, cx, cy, r, rim) {
  c.save(); c.translate(cx, cy);
  c.fillStyle = PALETTE.ink;
  c.beginPath(); c.ellipse(0, r * 0.06, r * 1.62, r * 0.32, 0, 0, TWO_PI); c.fill();
  c.beginPath();
  c.moveTo(-r * 0.8, -r * 0.04);
  c.quadraticCurveTo(-r * 0.86, -r * 0.82, -r * 0.4, -r * 0.9);
  c.quadraticCurveTo(-r * 0.16, -r * 1.0, 0, -r * 0.82);
  c.quadraticCurveTo(r * 0.16, -r * 1.0, r * 0.4, -r * 0.9);
  c.quadraticCurveTo(r * 0.86, -r * 0.82, r * 0.8, -r * 0.04);
  c.closePath(); c.fill();
  c.fillStyle = '#10121a'; c.fillRect(-r * 0.8, -r * 0.16, r * 1.6, r * 0.16);
  c.strokeStyle = 'rgba(200,210,230,0.28)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(rim * r * 0.7, -r * 0.86); c.quadraticCurveTo(rim * r * 0.86, -r * 0.5, rim * r * 0.78, -r * 0.08); c.stroke();
  c.restore();
}

export function drawPistol(c, x, y, s) {
  c.save(); c.translate(x, y); c.fillStyle = '#101216';
  c.fillRect(0, -3 * s, 17 * s, 5 * s); c.fillRect(-2 * s, -3 * s, 5 * s, 12 * s);
  c.fillStyle = '#1a1d22'; c.fillRect(2 * s, 2 * s, 4 * s, 5 * s);
  c.strokeStyle = 'rgba(200,210,225,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -3 * s); c.lineTo(17 * s, -3 * s); c.stroke();
  c.restore();
}

export function muzzleFlash(c, x, y, s, f) {
  c.save(); c.translate(x, y); c.globalAlpha = f; c.fillStyle = PALETTE.amber; c.shadowColor = '#ff3000'; c.shadowBlur = 30;
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TWO_PI, r = (i % 2 ? 6 : 18) * s * (0.6 + f); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 5 * s * f, 0, TWO_PI); c.fill(); c.restore();
}
