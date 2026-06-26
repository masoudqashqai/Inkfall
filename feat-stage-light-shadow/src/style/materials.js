// MATERIALS — the albedo + light-field module for the lit-sprite render model.
//
// THE MODEL (one light applied to the whole object, not per shape). An object's draw paints only
// its flat ALBEDO (its own material colours, noir-desaturated). The compositor renders that to an
// offscreen layer, then lights the WHOLE figure in one pass: colour = albedo x (ambientFill +
// directLight(direction)), masked to the figure's own pixels, and multiplies the cast shadow over
// it too. So every part of a figure (face, neck, arms, coat) shades identically and a shadow falls
// on the face for free, with no per shape shading calls. Emissive accents (an ember, a neon hot, a
// headlight) are painted by the object's optional glow() hook AFTER lighting, so they stay bright.
//
// This module owns two things the system reads: the per-object light FIELD (sampleLight, what the
// compositor needs to light a figure) and the albedo() helper (turn a material colour into a flat
// fill). The look knobs live in MAT.
import { AMBIENT, ENV } from './shadows.js';

// MAT — the live material look knobs (a mutable object so the Shadow & Light lab tunes them at
// runtime, like SHADE/WASH/ENV). colorRelax: how far a light's hue is pulled toward white before it
// tints a surface (0 = pure, fully saturated colour, 1 = white), so a red neon reads warm-red, not
// flat red. wrap: how directional the form light is (a clear lit -> shadow ramp, ambient fills the
// shadow side). rim: strength of the grazing light band that wraps the lit edge of a figure (added
// over the form, not an outline) so a side or back light reads as TOUCHING the form. rimWidth: how
// far that band bleeds inward (0 = a thin edge, 1 = most of the lit side). spec: the global ceiling
// on a material's specular hotspot, scaled per object by its own spec (0 for matte cloth). bounce:
// how much the key's hue bleeds into the shadow side (coloured bounce fill, not flat cool ambient).
// floorBounce: a warm/neon up-bounce off the wet floor onto a figure's lower body. depthHaze: the
// cool atmospheric veil far objects (a node's z) pick up. depthScale: how much depth shrinks them.
export const MAT = { colorRelax: 0.6, wrap: 0.5, rim: 0.2, rimWidth: 0.45, spec: 0.2, bounce: 0.5, floorBounce: 0.05, depthHaze: 0.5, depthScale: 0.35 };

// DEPTH HAZE colour — the cool grey a far object fades toward (atmospheric perspective). It is mixed
// into a figure by its z in the lit pass, so distance reads as the air greying it out.
export const HAZE = [70, 80, 100];

const BASE = [58, 64, 73];   // default cloth albedo for an object that names no colour
const _cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);

// a flat fill for an albedo, taking either an [r,g,b] material colour or a ready css string. Library
// draw code sets c.fillStyle = albedo(COLOUR) and never shades by hand, the compositor lights it.
export function albedo(c) { return Array.isArray(c) ? `rgb(${_cl(c[0])},${_cl(c[1])},${_cl(c[2])})` : (c || `rgb(${BASE[0]},${BASE[1]},${BASE[2]})`); }

// sampleLight — measure the scene's light at one object, returning the field the compositor needs to
// light the whole figure: how strongly it is lit, the light's screen DIRECTION (unit vector toward
// the light), the light hue (relaxed off pure), the cool ambient hue, and the env ambient fill. The
// centre, amount and hue are time-smoothed on the node so flickering or competing sources settle
// instead of strobing the figure. front lights (a cigarette ember) are local glows, not form light,
// so they are excluded.
export function sampleLight(e, node) {
  const X = e.X(node);
  const env = ENV[e.scene.indoor ? 'indoor' : 'outdoor'], REACH = env.reach, fill = env.fill;
  let wx = 0, wy = 0, wr = 0, wg = 0, wb = 0, wsum = 0;
  for (const L of e.lights) {
    if (L.front) continue;
    const w = L.I * (1 - Math.abs(X - L.x) / (L.r * REACH));
    if (w > 0) { const cc = L.col.split(','); wx += L.x * w; wy += L.y * w; wr += +cc[0] * w; wg += +cc[1] * w; wb += +cc[2] * w; wsum += w; }
  }
  let lx = wsum > 0.05 ? wx / wsum : e.keyLight.x * e.W;
  let ly = wsum > 0.05 ? wy / wsum : e.keyLight.y * e.H;
  const sm = (prev, v) => prev == null ? v : prev + (v - prev) * 0.04;
  lx = node._lx = sm(node._lx, lx); ly = node._ly = sm(node._ly, ly);
  const lit = node._lit = sm(node._lit, Math.min(1, wsum * 0.9));
  const cr = node._cr = sm(node._cr, wsum > 0.05 ? wr / wsum : 235);
  const cg = node._cg = sm(node._cg, wsum > 0.05 ? wg / wsum : 238);
  const cb = node._cb = sm(node._cb, wsum > 0.05 ? wb / wsum : 245);
  const cm = Math.max(cr, cg, cb, 1), rx = v => v + (1 - v) * MAT.colorRelax;
  const lcol = [rx(cr / cm), rx(cg / cm), rx(cb / cm)];
  // screen-space light direction: how far to the side the light sits (full side near +/-1, frontal
  // near 0) and its vertical lean (above the torso vs below it), normalised to a unit vector.
  const hx = Math.max(-1, Math.min(1, (lx - X) / (e.W * 0.22)));
  const yc = e.gy + (node.dy || 0) * e.unit - 50 * e.unit;
  const vb = Math.max(-1, Math.min(1, (yc - ly) / (90 * e.unit)));
  let dx = hx, dy = -vb; const m = Math.hypot(dx, dy);
  if (m < 0.001) { dx = 0; dy = -1; } else { dx /= m; dy /= m; }
  const ac = ((e.scene.data.ambient && e.scene.data.ambient.col) || AMBIENT.col).split(',').map(Number);
  const am = Math.max(ac[0], ac[1], ac[2], 1);
  return { lit, dx, dy, lcol, amb: [ac[0] / am, ac[1] / am, ac[2] / am], fill };
}

// the light FACTOR at a half-Lambert wrap value d (0 = full shadow, 1 = full key), per channel, as
// a css colour. The compositor builds a gradient of these and MULTIPLIES it over the albedo, so the
// result is albedo x (ambientFill + directLight). Always <= 1, so it only ever darkens albedo (the
// noir way), never blows it out. The shadow side falls to a COLOURED bounce fill (the cool ambient
// pulled toward the key's hue by MAT.bounce, the key bouncing into shadow), never to black.
export function lightFactor(F, d) {
  const a = F.fill, b = 1 - F.fill, l = F.lit * d, bk = MAT.bounce * F.lit;
  const fc = i => F.amb[i] + (F.lcol[i] - F.amb[i]) * bk;   // the fill hue, bounced toward the key
  return `rgb(${_cl(255 * (a * fc(0) + b * l * F.lcol[0]))},${_cl(255 * (a * fc(1) + b * l * F.lcol[1]))},${_cl(255 * (a * fc(2) + b * l * F.lcol[2]))})`;
}
