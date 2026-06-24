// MATERIALS — shared surface shading so every object looks cut from the same cloth.
// Change a material here and the whole cast restyles. `e` is the frame (for light queries).
import { TWO_PI } from '../engine/math.js';

// which edge catches the light: toward the weighted CENTRE of nearby lights (not a single
// dominant pick), with a dead zone + hysteresis so a flickering neon or a flaring cigarette
// can't snap the lit edge from side to side (that was the "flickering man" artifact).
export function rimSign(e, node) {
  const X = e.X(node);
  let wx = 0, wsum = 0;
  for (const L of e.lights) { const w = L.I * (1 - Math.abs(X - L.x) / (L.r * 1.1)); if (w > 0) { wx += L.x * w; wsum += w; } }
  const lx = wsum > 0.05 ? wx / wsum : e.keyLight.x * e.W, margin = 0.06 * e.W;
  let sign = node._rim || (lx < X ? -1 : 1);
  if (lx < X - margin) sign = -1; else if (lx > X + margin) sign = 1;
  return node._rim = sign;
}

// horizontal "form" light: a lit edge on the light side, tinted by that light's colour
export function bodyGrad(c, h, s, rim, tint) {
  rim = rim || 1;
  const g = c.createLinearGradient(rim * 34 * s, 0, -rim * 34 * s, 0);
  let lit = '#3a4049';
  if (tint) { const m = 0.5; lit = `rgb(${Math.round(58 + (tint[0] - 58) * m)},${Math.round(64 + (tint[1] - 64) * m)},${Math.round(73 + (tint[2] - 73) * m)})`; }
  g.addColorStop(0, lit); g.addColorStop(0.42, '#181b21'); g.addColorStop(1, '#080909');
  return g;
}

// a plain soft contact blob (props that do not warrant a full directional shadow)
export function shadowPool(c, x, y, rx, ry) { c.save(); c.globalAlpha = 0.32; c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TWO_PI); c.fill(); c.restore(); }
