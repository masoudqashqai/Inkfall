// MATERIALS — shared surface shading so every object looks cut from the same cloth.
// Change a material here and the whole cast restyles. `e` is the frame (for light queries).

// the form light is computed from EVERY scene light, weighted by power and nearness, considering
// BOTH axes: the horizontal side that catches the light (with a dead zone + hysteresis so a
// flickering neon can't snap the lit edge side to side, the old "flickering man" artifact) and the
// vertical lean (a light overhead lights the top, a barrel fire at the feet lights from below).
// `front` lights (a held cigarette) are local glows, not form light, so they are excluded here and
// stay a small local highlight instead of relighting the whole figure.
let _vb = 0;   // vertical light bias (-1 below .. +1 above), set by rimSign for the paired bodyGrad call

export function rimSign(e, node) {
  const X = e.X(node);
  let wx = 0, wy = 0, wsum = 0;
  for (const L of e.lights) { if (L.front) continue; const w = L.I * (1 - Math.abs(X - L.x) / (L.r * 1.1)); if (w > 0) { wx += L.x * w; wy += L.y * w; wsum += w; } }
  const lx = wsum > 0.05 ? wx / wsum : e.keyLight.x * e.W;
  const ly = wsum > 0.05 ? wy / wsum : e.keyLight.y * e.H;
  const margin = 0.06 * e.W;
  let sign = node._rim || (lx < X ? -1 : 1);
  if (lx < X - margin) sign = -1; else if (lx > X + margin) sign = 1;
  const yc = e.gy + (node.dy || 0) * e.unit - 50 * e.unit;       // roughly the torso height
  _vb = Math.max(-1, Math.min(1, (yc - ly) / (90 * e.unit)));    // + when the light sits above the torso
  return node._rim = sign;
}

// "form" light: a lit edge toward the light, tinted by its colour. The gradient axis tilts with the
// light's vertical lean (_vb from rimSign), so a figure under a high lamp is lit from above, not
// flatly from the side.
export function bodyGrad(c, h, s, rim, tint) {
  rim = rim || 1;
  const gx = rim * 34 * s, gvy = -_vb * 20 * s;                  // tilt the lit edge toward the light's height
  const g = c.createLinearGradient(gx, gvy, -gx, -gvy);
  let lit = '#3a4049';
  // a gentle wash of the light's colour on the lit edge, NOT a repaint of the cloth. Kept low so a
  // coloured light tints the coat rather than recolouring it, and the moon never blows it to white.
  if (tint) { const m = 0.3; lit = `rgb(${Math.round(58 + (tint[0] - 58) * m)},${Math.round(64 + (tint[1] - 64) * m)},${Math.round(73 + (tint[2] - 73) * m)})`; }
  g.addColorStop(0, lit); g.addColorStop(0.42, '#181b21'); g.addColorStop(1, '#080909');
  return g;
}
