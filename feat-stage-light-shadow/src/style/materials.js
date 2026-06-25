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
import { AMBIENT, ENV } from './shadows.js';

const BASE = [58, 64, 73];   // default cloth albedo (the old steel) for objects that name no colour
let _fill = 0.22;            // ambient floor (shadow-side brightness): set per scene from the env profile (indoor lifts it)

// the per-figure light field, set by rimSign for the paired bodyGrad/shade calls
let _lit = 0;                // 0..1 how strongly the figure is lit (smoothed)
let _lhx = 0;                // -1..+1 continuous horizontal light direction (smoothed)
let _vb = 0;                 // -1..+1 vertical lean of the light (top vs bottom)
let _amb = [0.67, 0.77, 1];  // scene ambient hue, normalised (cool shadows)
let _lcol = [1, 1, 1];       // dominant light hue on the lit side, normalised (smoothed)

export function rimSign(e, node) {
  const X = e.X(node);
  let wx = 0, wy = 0, wr = 0, wg = 0, wb = 0, wsum = 0;
  // a light reaches objects within REACH x its radius (decoupled from the tight air glow), and the
  // shadow side falls to _fill x albedo. Both come from the env profile: indoor light reaches and
  // fills more (it bounces and splashes), outdoor is contained and falls into the dark.
  const env = ENV[e.scene.indoor ? 'indoor' : 'outdoor'];
  const REACH = env.reach; _fill = env.fill;
  for (const L of e.lights) {
    if (L.front) continue;
    const w = L.I * (1 - Math.abs(X - L.x) / (L.r * REACH));
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

// one band of the surface at direct-light level d (0..1): albedo x (ambient fill + direct light).
const _cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
const band = (A, d) => `rgb(${_cl(A[0] * (_fill * _amb[0] + (1 - _fill) * d * _lcol[0]))},${_cl(A[1] * (_fill * _amb[1] + (1 - _fill) * d * _lcol[1]))},${_cl(A[2] * (_fill * _amb[2] + (1 - _fill) * d * _lcol[2]))})`;

// the light's direction in screen space (horizontal lean _lhx, vertical lean _vb), normalised. The
// shading ramp points AT the light, so an overhead source reads top-lit, a side source side-lit, a
// low fire up-lit. This is what makes light DIRECTION visible on the form (not just its amount).
function lightAxis() {
  let dx = _lhx, dy = -_vb; const m = Math.hypot(dx, dy);
  return m < 0.001 ? [0, -1] : [dx / m, dy / m];
}

const WRAP = 0.8;   // how directional the form light is (a clear lit -> shadow ramp; ambient fills the shadow)

// the cloth: ambient fill + a half-Lambert wrap of direct light along the light direction, sampled
// as a smooth multi-stop gradient (no hard knee). The shadow side falls to the ambient fill, never black.
export function bodyGrad(c, h, s, albedo) {
  const A = albedo || BASE, [dx, dy] = lightAxis(), R = 34 * s;
  const g = c.createLinearGradient(dx * R, dy * R, -dx * R, -dy * R);
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, u = 1 - 2 * t, hl = (1 - WRAP) + WRAP * Math.max(0, 0.5 + 0.5 * u);
    g.addColorStop(t, band(A, _lit * hl * hl));
  }
  return g;
}

// a round FORM (a face, a head): a GENTLE directional wrap across a small disc, so a face catches the
// light direction (a touch brighter on the side toward the light) but stays readable, not half black.
// Skin is a highlight feature, so it leans bright: a soft wrap, no squared falloff.
const FACE_WRAP = 0.4;
export function shadeForm(c, cx, cy, r, rgb) {
  const [dx, dy] = lightAxis();
  const g = c.createLinearGradient(cx + dx * r, cy + dy * r, cx - dx * r, cy - dy * r);
  for (let i = 0; i <= 3; i++) {
    const t = i / 3, u = 1 - 2 * t, hl = (1 - FACE_WRAP) + FACE_WRAP * Math.max(0, 0.5 + 0.5 * u);
    g.addColorStop(t, band(rgb, _lit * hl));
  }
  return g;
}

// a small FLAT surface (a tie, lips, a cigarette): ambient fill + direct light, no gradient. So a
// motif red still reacts to the light (deepens in shadow, lifts and warms under a source) instead of
// staying a fixed pure red, but stays small enough not to need a directional ramp.
export function shade(rgb) { return band(rgb, _lit); }
