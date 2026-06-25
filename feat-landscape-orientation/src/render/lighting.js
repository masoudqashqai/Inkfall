// LIGHTING SERVICE — the one shared light + shadow model. An object describes a light once with
// addLight({...}); the lighting PASS then paints, on the additive light buffer:
//   1. a tight SURFACE glow shaped to the emitter (lights the wall/surface the light sits on),
//   2. a soft, reduced AIR glow (the atmospheric bloom),
//   3. a wet-floor REFLECTION whose width/length/brightness are derived from the light's
//      emitter size, height above the floor (distance) and power, so it matches the source.
// rim / tint / shadow all read the same records, which keeps the look uniform.
import { lerp } from '../engine/math.js';

// register a light this frame. Fields:
//   x, y        position (y above the floor = the light's height)
//   col('r,g,b'), r (influence radius for rim/tint/rain), I (power 0..1)
//   ew, eh      emitter half-size (shape of the source: wide for a neon, point for a bulb)
//   glow        draw the air + surface glow (default true)
//   glowR, glowI  glow radius + brightness, decoupled from influence (default r, I). The moon
//                 uses these for a tight bright halo while keeping a large faint influence.
//   refl        draw the wet-floor reflection (default true)
//   reflW, reflI, reflLen   optional overrides (used by the moon for a bespoke faint streak)
export function addLight(e, rec) {
  if (rec.col == null) rec.col = '255,250,225';
  if (rec.r == null) rec.r = 150;
  if (rec.I == null) rec.I = 0.5;
  if (rec.ew == null) rec.ew = rec.r * 0.10;
  if (rec.eh == null) rec.eh = rec.ew;
  if (rec.glow == null) rec.glow = true;
  if (rec.surface == null) rec.surface = true;   // tight near-field core (distant lights like the moon set false)
  if (rec.ring == null) rec.ring = false;         // halo as a RING around the emitter (moon: glow without washing the disc)
  if (rec.glowR == null) rec.glowR = rec.r;
  if (rec.glowI == null) rec.glowI = rec.I;
  if (rec.refl == null) rec.refl = true;
  e.lights.push(rec);
}

// --- pre-rendered soft sprites (built once per colour). Blitting these replaces per-frame
// gradient creation AND the expensive ctx.filter='blur(...)' that v2 used for glow/refl/shadow. ---
const _sprites = {};
function softRadial(col) {                      // a soft round glow, peak alpha 1 at centre
  const key = 'r:' + col; if (_sprites[key]) return _sprites[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.5, `rgba(${col},0.32)`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  return _sprites[key] = cv;
}
function softRing(col) {                          // a soft halo RING: transparent core, bright ring, fades out
  const key = 'g:' + col; if (_sprites[key]) return _sprites[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.4, `rgba(${col},0)`); g.addColorStop(0.52, `rgba(${col},1)`); g.addColorStop(0.75, `rgba(${col},0.4)`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  return _sprites[key] = cv;
}
function softColumn(col) {                       // a soft vertical streak: bright at the top, feathered sides
  const key = 'c:' + col; if (_sprites[key]) return _sprites[key];
  const W = 64, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'), vg = c.createLinearGradient(0, 0, 0, H);
  vg.addColorStop(0, `rgba(${col},1)`); vg.addColorStop(0.4, `rgba(${col},0.36)`); vg.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'destination-in';
  const hg = c.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = hg; c.fillRect(0, 0, W, H);
  return _sprites[key] = cv;
}

// tight near-field glow shaped to the emitter: the light hitting the surface it sits on
function surfaceGlow(e, L) {
  const rx = Math.max(L.ew * 1.25, 8) + L.r * 0.10, ry = Math.max(L.eh * 1.25, 8) + L.r * 0.10, c = e.light;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.30 * L.glowI;
  c.drawImage(softRadial(L.col), L.x - rx, L.y - ry, rx * 2, ry * 2); c.restore();
}

// soft, wide atmospheric bloom — kept gentle (the "glow in the air", dialled down)
function airGlow(e, L) {
  const R = L.glowR, c = e.light;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.15 * L.glowI;
  c.drawImage(L.ring ? softRing(L.col) : softRadial(L.col), L.x - R, L.y - R, R * 2, R * 2); c.restore();
}

// a soft streak down the wet floor (low-level; also used for static off-screen signs)
export function streak(e, x, col, I, w, len) {
  if (I < 0.02 || len < 2) return;
  const c = e.light;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * I;
  c.drawImage(softColumn(col), x - w, e.gy, w * 2, len); c.restore();
}

// the floor reflection for a real light: derived from its height, size and power so it matches
function floorRefl(e, L) {
  const gy = e.gy, H = e.H, h = gy - L.y;
  if (h <= 2) return;                                   // at/below the floor: no reflection
  let I, w, len;
  if (L.reflI != null) {                                // bespoke (moon)
    I = L.reflI; w = L.reflW != null ? L.reflW : 24; len = (H - gy) * (L.reflLen || 0.7);
  } else {
    const reach = L.r / (L.r + h);                      // geometry: low/large light reaches the floor more
    I = L.I * reach * 0.7;                              // brightness from power + geometry (distance/dimness)
    w = Math.max(8, L.ew * 0.7 + L.r * 0.12);          // width from emitter size + spread
    len = Math.min(H - gy, h * 0.5 + L.r * 0.45);      // length from height + size
  }
  streak(e, L.x, L.col, I, w, len);
}

// the strongest light reaching a point (rim side, form tint, shadow direction)
export function dominantLight(e, wx) {
  let best = null, bw = 0.12;
  for (const L of e.lights) { const w = L.I * (1 - Math.abs(wx - L.x) / (L.r * 1.1)); if (w > bw) { bw = w; best = L; } }
  return best;
}
// the ambient light colour at a point, as a smooth weighted BLEND of nearby lights (not a single
// dominant pick) so a figure between two flickering lights gets a gentle tint, not a hard flip.
export function litTint(e, wx) {
  let r = 0, g = 0, b = 0, wsum = 0;
  for (const L of e.lights) { const w = L.I * (1 - Math.abs(wx - L.x) / (L.r * 1.1)); if (w > 0) { const cc = L.col.split(','); r += cc[0] * w; g += cc[1] * w; b += cc[2] * w; wsum += w; } }
  return wsum < 0.12 ? null : [r / wsum, g / wsum, b / wsum];
}

// blended colour of every light reaching x (red + green → amber), else the fallback grey
export function litColor(e, x, gr, gg, gb) {
  let r = 0, g = 0, b = 0, wsum = 0;
  for (const L of e.lights) { const w = L.I * (1 - Math.abs(x - L.x) / (L.r * 0.6)); if (w > 0) { const cc = L.col.split(','); r += cc[0] * w; g += cc[1] * w; b += cc[2] * w; wsum += w; } }
  if (wsum < 0.18) return [gr, gg, gb];
  const m = Math.min(1, wsum * 0.9 + 0.2);
  return [Math.round(lerp(gr, r / wsum, m)), Math.round(lerp(gg, g / wsum, m)), Math.round(lerp(gb, b / wsum, m))];
}

// systematic directional ground shadow used by EVERY grounded object (drawn to the world ctx).
// A pre-rendered soft black sprite gives the soft edge with no per-frame blur filter.
export function groundShadow(e, wx, halfW, objH) {
  const c = e.ctx, g = e.gy, sp = softRadial('0,0,0');
  const cands = e.lights.map(L => ({ L, w: L.I * (1 - Math.abs(wx - L.x) / (L.r * 1.2)) })).filter(o => o.w > 0.06).sort((a, b) => b.w - a.w).slice(0, 2);
  c.save();
  if (!cands.length) { c.globalAlpha = 0.32; const rX = halfW * 1.25, rY = halfW * 0.3; c.drawImage(sp, wx - rX, g + 4 - rY, rX * 2, rY * 2); c.restore(); return; }
  for (const { L, w } of cands) {
    const dir = wx >= L.x ? 1 : -1, dist = Math.abs(wx - L.x), vert = Math.max(24, g - L.y);
    const len = Math.min(objH * 2.2, halfW + objH * (dist / vert) * 0.9 + objH * 0.2);
    const rX = halfW * 0.7 + len * 0.55, rY = halfW * 0.3;
    c.globalAlpha = Math.min(0.42, 0.32 * w);
    c.drawImage(sp, wx + dir * len * 0.45 - rX, g + 4 - rY, rX * 2, rY * 2);
  }
  c.restore();
}

// the lighting pass body: surface + air glow, then the wet-floor reflection, per light
export function drawLightLayer(e) {
  for (const L of e.lights) {
    if (L.glow) { if (L.surface) surfaceGlow(e, L); airGlow(e, L); }
    if (L.refl) floorRefl(e, L);
  }
}
