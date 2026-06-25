// MATERIALS — shared surface shading so every object looks cut from the same cloth.
// Change a material here and the whole cast restyles. `e` is the frame (for light queries).
//
// THE MODEL (one light field, two consumers). Every lit surface is shaded as
//     colour = albedo x ( ambientFill + directLight(direction) )
// where:
//   - ambientFill is a soft, cool, scene-set floor (AMB x the scene ambient hue), so a shadow is a
//     deep blue-grey and NEVER pure black: the shadow side still reads, the noir way.
//   - directLight wraps around the form with a half-Lambert term from the light's CONTINUOUS
//     direction, so it rolls off to a soft terminator (no hard "suddenly black" edge), is tinted by
//     the light's own colour, and scales with how much light reaches the figure.
// rimSign() measures the whole light field once per figure (direction, amount, hue, ambient), all
// time-smoothed so flickering sources settle. bodyGrad() samples it across the body as a gradient
// (the cloth); shade() applies the flat version to small surfaces (a shirt, bare skin). Front lights
// (a held cigarette) are local glows, not form light, so they are excluded from the field.
import { AMBIENT } from './shadows.js';

const BASE = [58, 64, 73];   // default cloth albedo (the old steel) for objects that name no colour
const AMB = 0.22;            // ambient floor: the shadow-side brightness fraction; the rest is direct light

// the per-figure light field, set by rimSign for the paired bodyGrad/shade calls
let _lit = 0;                // 0..1 how strongly the figure is lit (smoothed)
let _lhx = 0;                // -1..+1 continuous horizontal light direction (smoothed)
let _vb = 0;                 // -1..+1 vertical lean of the light (top vs bottom)
let _amb = [0.67, 0.77, 1];  // scene ambient hue, normalised (cool shadows)
let _lcol = [1, 1, 1];       // dominant light hue on the lit side, normalised (smoothed)

export function rimSign(e, node) {
  const X = e.X(node);
  let wx = 0, wy = 0, wr = 0, wg = 0, wb = 0, wsum = 0;
  for (const L of e.lights) {
    if (L.front) continue;
    const w = L.I * (1 - Math.abs(X - L.x) / (L.r * 1.1));
    if (w > 0) { const cc = L.col.split(','); wx += L.x * w; wy += L.y * w; wr += +cc[0] * w; wg += +cc[1] * w; wb += +cc[2] * w; wsum += w; }
  }
  let lx = wsum > 0.05 ? wx / wsum : e.keyLight.x * e.W;
  let ly = wsum > 0.05 ? wy / wsum : e.keyLight.y * e.H;
  // smooth the light CENTRE + COLOUR + amount on the node, so flickering or competing sources settle
  // instead of strobing the figure or making the lit edge jump from side to side.
  const sm = (prev, v) => prev == null ? v : prev + (v - prev) * 0.03;
  lx = node._lx = sm(node._lx, lx); ly = node._ly = sm(node._ly, ly);
  const a = Math.min(1, wsum * 0.9); _lit = node._lit = sm(node._lit, a);
  const cr = node._cr = sm(node._cr, wsum > 0.05 ? wr / wsum : 235);
  const cg = node._cg = sm(node._cg, wsum > 0.05 ? wg / wsum : 238);
  const cb = node._cb = sm(node._cb, wsum > 0.05 ? wb / wsum : 245);
  const cm = Math.max(cr, cg, cb, 1); _lcol = [cr / cm, cg / cm, cb / cm];
  // continuous direction: how far to the side the light sits (full side near +/-1, frontal near 0),
  // and the vertical lean (light above the torso vs below it).
  _lhx = Math.max(-1, Math.min(1, (lx - X) / (e.W * 0.22)));
  const yc = e.gy + (node.dy || 0) * e.unit - 50 * e.unit;
  _vb = Math.max(-1, Math.min(1, (yc - ly) / (90 * e.unit)));
  // the ambient hue (cool, scene-set), normalised so it tints the shadow side without re-darkening it
  const ac = ((e.scene.data.ambient && e.scene.data.ambient.col) || AMBIENT.col).split(',').map(Number);
  const am = Math.max(ac[0], ac[1], ac[2], 1); _amb = [ac[0] / am, ac[1] / am, ac[2] / am];
  // a stable left/right sign (hysteresis) for parts that just need a side, e.g. the fedora highlight
  const margin = 0.06 * e.W;
  let sign = node._rim || (lx < X ? -1 : 1);
  if (lx < X - margin) sign = -1; else if (lx > X + margin) sign = 1;
  return node._rim = sign;
}

// the cloth: ambient fill + a half-Lambert wrap of direct light, sampled across the body as a smooth
// multi-stop gradient (no hard knee), the axis tilted by the light's vertical lean.
export function bodyGrad(c, h, s, rim, albedo) {
  const A = albedo || BASE, cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  const dir = _lhx >= 0 ? 1 : -1, obl = Math.min(1, Math.abs(_lhx) + 0.15);   // how side-on the light is
  const gx = dir * 36 * s, gvy = -_vb * 18 * s;                  // axis: lit edge -> far edge
  const g = c.createLinearGradient(gx, gvy, -gx, -gvy);
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, u = 1 - 2 * t;                             // +1 lit edge .. -1 far edge
    const hl = (1 - obl) + obl * Math.max(0, 0.5 + 0.5 * u);     // half-Lambert wrap (smooth)
    const d = _lit * hl * hl;                                    // direct light at this band, soft terminator
    const r = A[0] * (AMB * _amb[0] + (1 - AMB) * d * _lcol[0]);
    const gg = A[1] * (AMB * _amb[1] + (1 - AMB) * d * _lcol[1]);
    const b = A[2] * (AMB * _amb[2] + (1 - AMB) * d * _lcol[2]);
    g.addColorStop(t, `rgb(${cl(r)},${cl(gg)},${cl(b)})`);
  }
  return g;
}

// a FLAT surface (a white shirt, bare skin, a tie): the same ambient fill + direct light without a
// gradient, since these are small. Keeps a shirt or a face consistent with the cloth around it, so
// an unlit figure goes uniformly dark and lifts (and takes the light's hue) as light reaches it.
export function shade(rgb) {
  const cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v), d = _lit;
  const r = rgb[0] * (AMB * _amb[0] + (1 - AMB) * d * _lcol[0]);
  const g = rgb[1] * (AMB * _amb[1] + (1 - AMB) * d * _lcol[1]);
  const b = rgb[2] * (AMB * _amb[2] + (1 - AMB) * d * _lcol[2]);
  return `rgb(${cl(r)},${cl(g)},${cl(b)})`;
}
