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

// MUZZLE FIRE — a gunshot as a burst of fire, not a drawn star: a white-hot core, a flame plume
// blown forward along the barrel, and sparks thrown out that fly and fade as the flash dies (f: 1
// just fired -> 0 gone). The actual scene light comes from the gunman's emitLight, this is the body.
const _rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

export function muzzleFire(c, x, y, s, f, ang) {
  if (f <= 0) return;
  const age = 1 - f;
  c.save(); c.translate(x, y); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {                               // sparks, forward-biased, flying out + fading
    const a = ang + (_rnd(i) - 0.5) * 1.7, sp = 0.4 + _rnd(i + 21);
    const d = age * sp * 52 * s, px = Math.cos(a) * d, py = Math.sin(a) * d, al = f * (0.9 - 0.6 * _rnd(i + 7));
    c.globalAlpha = al < 0 ? 0 : al; c.fillStyle = i % 3 ? '#ffb030' : '#ffe070';
    c.beginPath(); c.arc(px, py, (1 + 1.4 * f) * s, 0, TWO_PI); c.fill();
  }
  c.save(); c.rotate(ang);                                     // flame plume down the barrel
  const len = (14 + 26 * f) * s, w = (6 + 5 * f) * s, g = c.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, `rgba(255,245,205,${0.85 * f})`); g.addColorStop(0.45, `rgba(255,150,45,${0.65 * f})`); g.addColorStop(1, 'rgba(255,70,20,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(0, -w); c.quadraticCurveTo(len * 0.55, -w * 0.5, len, 0); c.quadraticCurveTo(len * 0.55, w * 0.5, 0, w); c.closePath(); c.fill();
  c.restore();
  c.globalAlpha = f; c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, (2.5 + 4 * f) * s, 0, TWO_PI); c.fill();
  c.restore();
}
