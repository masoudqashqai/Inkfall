// MATERIALS — shared surface shading so every object looks cut from the same cloth.
// Change a material here and the whole cast restyles. `e` is the frame (for light queries).

// the form light is computed from EVERY scene light, weighted by power and nearness, considering
// BOTH axes: the horizontal side that catches the light (with a dead zone + hysteresis so a
// flickering neon can't snap the lit edge side to side, the old "flickering man" artifact) and the
// vertical lean (a light overhead lights the top, a barrel fire at the feet lights from below). It
// also measures how STRONGLY the form is lit (0..1), so bodyGrad can lift the cloth in proportion
// to the light. `front` lights (a held cigarette) are local glows, not form light, so they are
// excluded here and stay a small local highlight instead of relighting the whole figure.
const BASE = [58, 64, 73];   // default cloth albedo (the old steel) for objects that name no colour
let _vb = 0, _lit = 0;       // vertical light bias + light amount, set by rimSign for the paired bodyGrad

export function rimSign(e, node) {
  const X = e.X(node);
  let wx = 0, wy = 0, wsum = 0;
  for (const L of e.lights) { if (L.front) continue; const w = L.I * (1 - Math.abs(X - L.x) / (L.r * 1.1)); if (w > 0) { wx += L.x * w; wy += L.y * w; wsum += w; } }
  let lx = wsum > 0.05 ? wx / wsum : e.keyLight.x * e.W;
  let ly = wsum > 0.05 ? wy / wsum : e.keyLight.y * e.H;
  // smooth the light CENTRE on the node, so two flickering lights on opposite sides (a bulb and a
  // barrel fire) can't swap dominance frame to frame and make the lit edge jump from side to side.
  node._lx = node._lx == null ? lx : node._lx + (lx - node._lx) * 0.03;
  node._ly = node._ly == null ? ly : node._ly + (ly - node._ly) * 0.03;
  lx = node._lx; ly = node._ly;
  const margin = 0.06 * e.W;
  let sign = node._rim || (lx < X ? -1 : 1);
  if (lx < X - margin) sign = -1; else if (lx > X + margin) sign = 1;
  const yc = e.gy + (node.dy || 0) * e.unit - 50 * e.unit;       // roughly the torso height
  _vb = Math.max(-1, Math.min(1, (yc - ly) / (90 * e.unit)));    // + when the light sits above the torso
  // light amount, heavily smoothed on the node so flickering sources (a barrel fire, a failing bulb)
  // settle the cloth to a steady tone instead of strobing it.
  const a = Math.min(1, wsum * 0.9);
  node._lit = node._lit == null ? a : node._lit + (a - node._lit) * 0.03;
  _lit = node._lit;
  return node._rim = sign;
}

// "form" light, ALBEDO aware: the cloth is shaded from its own base colour, lifted on the lit edge
// in proportion to the light reaching it (and faintly toward the light's colour) and dropped to
// near black on the shadowed edge. So a bright light barely lifts a dark material and lifts a pale
// one fully, the cloth keeps its identity. The gradient axis tilts with the light's vertical lean.
export function bodyGrad(c, h, s, rim, tint, albedo) {
  rim = rim || 1;
  const A = albedo || BASE, cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  const gx = rim * 34 * s, gvy = -_vb * 20 * s;                  // tilt the lit edge toward the light's height
  const g = c.createLinearGradient(gx, gvy, -gx, -gvy);
  const lm = 0.82 + _lit * 0.42;                                 // lit-side lift, capped so a bright light never washes the cloth to white
  // the lit edge takes the light's OWN colour, applied in proportion to how strongly the light hits
  // (_lit): a strong close source (a barrel fire) casts a deep warm, a dim distant one a faint hint,
  // and the hue is always the source's (a neon casts its colour, the moon casts cool).
  let tr = 1, tg = 1, tb = 1;
  if (tint) { const mx = Math.max(tint[0], tint[1], tint[2], 1), k = 0.7 * _lit; tr = 1 - k + k * tint[0] / mx; tg = 1 - k + k * tint[1] / mx; tb = 1 - k + k * tint[2] / mx; }
  const lit = `rgb(${cl(A[0] * lm * tr)},${cl(A[1] * lm * tg)},${cl(A[2] * lm * tb)})`;
  const mid = `rgb(${cl(A[0] * 0.45)},${cl(A[1] * 0.45)},${cl(A[2] * 0.45)})`;
  const dark = `rgb(${cl(A[0] * 0.16)},${cl(A[1] * 0.16)},${cl(A[2] * 0.18)})`;
  g.addColorStop(0, lit); g.addColorStop(0.42, mid); g.addColorStop(1, dark);
  return g;
}
