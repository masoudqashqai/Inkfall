// LIGHTING SERVICE — the one shared light + shadow model. An object describes a light once with
// addLight({...}); the lighting PASS then paints, on the additive light buffer:
//   1. a tight SURFACE glow shaped to the emitter (lights the wall/surface the light sits on),
//   2. a soft, reduced AIR glow (the atmospheric bloom),
//   3. a wet-floor REFLECTION whose width/length/brightness are derived from the light's
//      emitter size, height above the floor (distance) and power, so it matches the source.
// rim / tint / shadow all read the same records, which keeps the look uniform.
import { lerp } from '../engine/math.js';
import { stageOf, surfaceYAt } from './stage.js';
import { WASH, AIR } from '../style/shadows.js';

// register a light this frame. Fields:
//   x, y        position (y above the floor = the light's height)
//   col('r,g,b'), r (influence radius for rim/tint/rain), I (power 0..1)
//   ew, eh      emitter half-size (shape of the source: wide for a neon, point for a bulb)
//   glow        draw the air + surface glow (default true)
//   glowR, glowI  glow radius + brightness, decoupled from influence (default r, I). The moon
//                 uses these for a tight bright halo while keeping a large faint influence.
//   refl        draw the wet-floor reflection (default true)
//   reflW, reflI, reflLen   optional overrides (used by the moon for a bespoke faint streak)
//   wash        draw the diffuse floor + wall surface washes (default true; a distant light sets false)
//   front       the light sits IN FRONT of the cast (a cigarette ember, a held match): its glow is
//               painted after the cast. Default false, so scene light (neon, lamps, the moon) sits
//               behind the cast and a foreground figure occludes it, as it should.
//   shade       the fixture caps the light (a lamp hood): the glow is blocked above the emitter, so
//               it only spills downward. Default false (a bare bulb, neon, the moon glow all ways).
//   gobo        a mask the light is cast THROUGH { type:'blinds'|'bars'|'window', count, duty }, so
//               the wash (and the beam, if any) lands in bright bands (venetian blinds on the wall,
//               a window's panes). Axis-aligned. Copied onto the beam automatically when both exist.
//   beam        optional volumetric cone of light in the air (the lamp's downward shaft, the rooftop
//               searchlight's sweep): { dir (0 = straight down, radians), len, farW or spread,
//               I (0..1), sweep, sweepSpeed, shaft, pool }. The lighting pass paints it on the
//               additive buffer. A beam has two parts that toggle independently: shaft (default
//               true) is the volumetric cone in the air, pool (default true) is the soft glow where
//               it lands on a surface. A hooded lamp keeps the shaft but sets pool:false (the floor
//               wash already lights the floor under it). A bare bulb sets shaft:false and keeps the
//               pool (it lights the table it hangs over). The searchlight sets pool:false.
export function addLight(e, rec) {
  if (rec.gobo && rec.beam && rec.beam.gobo == null) rec.beam.gobo = rec.gobo;   // a gobo light stripes its beam too
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
  if (rec.wash == null) rec.wash = true;
  if (rec.beam) {
    const b = rec.beam;
    if (b.dir == null) b.dir = 0;
    if (b.I == null) b.I = 1;
    if (b.len == null) b.len = 200;
    if (b.farW == null) b.farW = b.spread != null ? b.len * Math.tan(b.spread) : b.len * 0.45;
  }
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

// a shaded fixture (a lamp hood) caps the glow above the emitter: clip it to spill downward only.
function clipShade(c, L, e) { if (!L.shade) return; c.beginPath(); c.rect(-e.W * 2, L.y - L.eh, e.W * 5, e.H * 3); c.clip(); }

// a GOBO / COOKIE: a mask the light is cast THROUGH, restricting the wash or beam to its bright
// bands (venetian blinds = horizontal slats, bars = vertical, window = a paned grid). It clips a
// region to the lit bands, so whatever is then drawn only lands in them. gobo: { type, count, duty }
// where count is the number of slats and duty (0..1) is the lit fraction of each. Axis-aligned, so
// it reads on the wall, the floor pool and the beam shaft (the light buffer is additive, so a clip
// is the safe way to carve a pattern without touching other lights already on the buffer).
function clipGobo(c, g, x0, y0, w, h) {
  const n = Math.max(2, g.count || 6), duty = g.duty != null ? g.duty : 0.55;
  c.beginPath();
  if (g.type !== 'bars') { const band = h / n; for (let i = 0; i < n; i++) c.rect(x0, y0 + i * band, w, band * duty); }
  if (g.type === 'bars' || g.type === 'window') { const band = w / n; for (let i = 0; i < n; i++) c.rect(x0 + i * band, y0, band * duty, h); }
  c.clip();
}

// tight near-field glow shaped to the emitter: the light hitting the surface it sits on
function surfaceGlow(e, L) {
  const rx = Math.max(L.ew * 1.25, 8) + L.r * 0.10, ry = Math.max(L.eh * 1.25, 8) + L.r * 0.10, c = e.light;
  c.save(); clipShade(c, L, e); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.30 * L.glowI;
  c.drawImage(softRadial(L.col), L.x - rx, L.y - ry, rx * 2, ry * 2); c.restore();
}

// soft atmospheric bloom — the "glow in the air". Kept tight so it concentrates around the source
// instead of washing across the frame (a ring light, the moon, keeps its wider radius).
function airGlow(e, L) {
  const R = L.glowR * (L.ring ? 1 : 0.55), c = e.light;
  c.save(); clipShade(c, L, e); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2 * L.glowI;
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

// blended colour of every light reaching x (red + green → amber), else the fallback grey
export function litColor(e, x, gr, gg, gb) {
  let r = 0, g = 0, b = 0, wsum = 0;
  for (const L of e.lights) { if (L.front) continue; const w = L.I * (1 - Math.abs(x - L.x) / (L.r * 0.6)); if (w > 0) { const cc = L.col.split(','); r += cc[0] * w; g += cc[1] * w; b += cc[2] * w; wsum += w; } }
  if (wsum < 0.18) return [gr, gg, gb];
  const m = Math.min(1, wsum * 0.9 + 0.2);
  return [Math.round(lerp(gr, r / wsum, m)), Math.round(lerp(gg, g / wsum, m)), Math.round(lerp(gb, b / wsum, m))];
}

// DIFFUSE SURFACE WASHES — light pooling on the stage as oriented surfaces (separate from the
// tight surface glow and the wet specular streak). A soft pool on the floor near the light's base,
// and, where the set has a near wall, a soft pool climbing the wall. These make light placement
// read in the same floor + wall box the shadows are cast into, so the two systems agree.
// light spreads as it travels, so the pool a source throws on a surface is wider (and softer) the
// farther the source is from it. The width grows with that distance and the brightness falls off,
// instead of matching the emitter size one to one.
function floorWash(e, L, st) {
  const c = e.light, h = Math.max(20, st.gy - L.y);          // the source's distance up off the floor
  const rx = L.r * 0.5 + h * 0.7, ry = (st.H - st.gy) * WASH.floorReach;
  c.save(); c.beginPath(); c.rect(L.x - rx, st.gy, rx * 2, st.H - st.gy); c.clip();
  if (L.gobo) clipGobo(c, L.gobo, L.x - rx, st.gy, rx * 2, st.H - st.gy);
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = WASH.floorAlpha * st.env.wash * L.glowI * (L.r / (L.r + h * 0.7));
  c.drawImage(softRadial(L.col), L.x - rx, st.gy - ry * 0.35, rx * 2, ry * 1.7); c.restore();
}
// the wash on ONE wall segment, clipped to that segment's extent, so light only pools on real brick.
function wallWash(e, L, st, w) {
  const c = e.light, d = Math.max(20, st.gy - L.y);
  const rx = L.r * 0.55 + d * 0.5, ry = (st.gy - w.top) * WASH.wallReach;
  const cy = Math.min(st.gy, Math.max(w.top, L.y));          // the pool centres where the light meets the wall
  const x0 = Math.max(L.x - rx, w.x0), x1 = Math.min(L.x + rx, w.x1);   // intersect the pool with the segment
  if (x1 <= x0) return;
  c.save(); c.beginPath(); c.rect(x0, w.top, x1 - x0, st.gy - w.top); c.clip();
  if (L.gobo) clipGobo(c, L.gobo, x0, w.top, x1 - x0, st.gy - w.top);   // blinds/window pattern cast onto the brick
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = WASH.wallAlpha * st.env.wash * L.glowI * (L.r / (L.r + d * 0.6));
  // light runs DOWN the wall more than up it (it falls toward the floor), so the pool is weighted
  // below the source: drawn taller and shifted down rather than a symmetric disc.
  c.drawImage(softRadial(L.col), L.x - rx, cy - ry * 0.72, rx * 2, ry * 2.3); c.restore();
}

// VOLUMETRIC BEAM — a cone of light hanging in the wet air (the lamp's shaft, the searchlight's
// sweep). Apex at the emitter, fading along its length, tinted by the colour, painted additively so
// the rain and grain read through it. dir 0 points straight down; a beam can sweep (the searchlight)
// by oscillating its direction. Shared so a near beam can draw on the light buffer (in front of the
// backdrop) and a distant one, like the rooftop searchlight, can draw in the back world layer
// (behind the backdrop buildings), both from one beam model.
export function drawBeam(c, t, x, y, ew, col, b) {
  let dir = b.dir + (b.sweep ? Math.sin(t * (b.sweepSpeed || 0.4)) * b.sweep : 0);
  const ax = Math.sin(dir), ay = Math.cos(dir), pxv = -ay, pyv = ax;   // axis + perpendicular
  const nearW = Math.max(ew * 0.6, 3), len = b.len != null ? b.len : 200;
  const farW = b.farW != null ? b.farW : (b.spread != null ? len * Math.tan(b.spread) : len * 0.45);
  const I = b.I != null ? b.I : 1, fx = x + ax * len, fy = y + ay * len;
  c.save(); c.globalCompositeOperation = 'lighter';
  // the SHAFT: the volumetric cone hanging in the air (a hooded lamp, the searchlight). A bare bulb
  // does not throw a visible shaft (it just glows + pools below), so it sets shaft:false.
  if (b.shaft !== false) {
    c.save();
    if (b.gobo) {   // cast the shaft THROUGH the gobo (slatted light hanging in the air)
      const xs = [x - pxv * nearW, x + pxv * nearW, fx + pxv * farW, fx - pxv * farW];
      const ys = [y - pyv * nearW, y + pyv * nearW, fy + pyv * farW, fy - pyv * farW];
      const bx0 = Math.min(...xs), by0 = Math.min(...ys);
      clipGobo(c, b.gobo, bx0, by0, Math.max(...xs) - bx0, Math.max(...ys) - by0);
    }
    const g = c.createLinearGradient(x, y, fx, fy);
    // carry the light most of the way down the shaft instead of dying at half length, so the beam reads
    // as throwing light in its direction rather than fading into the air just past the source.
    g.addColorStop(0, `rgba(${col},${0.34 * I})`); g.addColorStop(0.6, `rgba(${col},${0.18 * I})`); g.addColorStop(1, `rgba(${col},${0.06 * I})`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - pxv * nearW, y - pyv * nearW); c.lineTo(x + pxv * nearW, y + pyv * nearW);
    c.lineTo(fx + pxv * farW, fy + pyv * farW); c.lineTo(fx - pxv * farW, fy - pyv * farW);
    c.closePath(); c.fill();
    c.restore();
  }
  // the POOL: a soft glow where the beam lands, so the light reads as cast onto the surface at the end
  // of the throw (the felt under a hanging bulb). The floor under a straight-down lamp is already lit
  // by the floor wash, so the lamp sets pool:false to avoid a doubled disc, and a beam ending in open
  // air (the searchlight) sets pool:false too.
  if (b.pool !== false) {
    const lp = c.createRadialGradient(fx, fy, 0, fx, fy, farW * 1.4);
    lp.addColorStop(0, `rgba(${col},${0.18 * I})`); lp.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = lp; c.beginPath(); c.ellipse(fx, fy, farW * 1.4, farW * 0.7, 0, 0, Math.PI * 2); c.fill();
  }
  // DUST MOTES: faint specks drifting down the shaft, twinkling, so the beam reads as light catching
  // particles in the air (volumetric). They travel along the cone and sway across it, fading with depth.
  if (b.shaft !== false && b.motes !== false && AIR.motes > 0) {
    c.fillStyle = `rgb(${col})`;
    for (let i = 0; i < AIR.motes; i++) {
      const ph = i * 2.39937 + (b.seed || 0);
      const u = (i / AIR.motes + t * 0.03 * (0.6 + (i % 3) * 0.18)) % 1;     // creep down the shaft, wrap
      const along = u * len, halfW = nearW + (farW - nearW) * u;
      const sway = Math.sin(t * 0.7 + ph) * 0.7 * halfW;
      const mx = x + ax * along + pxv * sway, my = y + ay * along + pyv * sway, rr = 0.8 + (i % 3) * 0.5;
      c.globalAlpha = AIR.moteAlpha * I * (1 - u) * (0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + ph)));
      c.beginPath(); c.arc(mx, my, rr, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }
  c.restore();
}

// GROUND HAZE: a low band of mist hanging along the floor, lit by the ambient, so the air near the
// ground reads as a soft layer rather than empty black. Painted additively on the light buffer.
function groundHaze(e, st) {
  if (AIR.groundHaze <= 0) return;
  const c = e.light, R = e.coverRect(), top = st.gy - 130, h = 210;
  const g = c.createLinearGradient(0, top, 0, top + h);
  g.addColorStop(0, `rgba(${AIR.hazeCol},0)`); g.addColorStop(0.55, `rgba(${AIR.hazeCol},${AIR.groundHaze})`); g.addColorStop(1, `rgba(${AIR.hazeCol},0)`);
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(R.x, top, R.w, h); c.restore();
}
// a downward beam lands on the real SURFACE under it (the floor, or a raised surface like a table),
// resolved from the stage, so its pool can never sit in empty space. Sideways/sky beams (the
// searchlight) keep their authored length.
function beam(e, L, st) {
  const b = L.beam;
  if (st && (b.dir == null || b.dir === 0)) { const sy = surfaceYAt(st, L.x); if (sy > L.y) b.len = sy - L.y; }
  drawBeam(e.light, e.t, L.x, L.y, L.ew, L.col, b);
}

// BACK light: everything that belongs behind the cast (so a foreground figure occludes it). A flat
// ambient lift, then per non-front light its beam, surface + air glow, floor + wall washes, and the
// wet-floor reflection. The compositor blits this before drawing the cast.
export function drawBackLight(e) {
  const st = stageOf(e), R = e.coverRect(), c = e.light;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = WASH.ambientAlpha * st.ambient.level / 0.16;
  c.fillStyle = `rgb(${st.ambient.col})`; c.fillRect(R.x, R.y, R.w, R.h); c.restore();
  groundHaze(e, st);                                        // a low layer of lit mist along the floor
  for (const L of e.lights) {
    if (L.front) continue;                                 // front lights paint after the cast
    if (L.I < 0.02) continue;                              // flickered or declared near-dark: nothing to add
    if (L.x + L.r < R.x || L.x - L.r > R.x + R.w) continue;   // its whole influence is off-screen
    if (L.beam) beam(e, L, st);                            // gated above, so a dimmed or off-screen light draws no beam
    if (L.glow) { if (L.surface) surfaceGlow(e, L); airGlow(e, L); }
    if (L.wash) { floorWash(e, L, st); for (const w of st.walls) wallWash(e, L, st, w); }
    if (L.refl) floorRefl(e, L);
  }
}

// FRONT light: only the glow of lights that sit in front of the cast (a cigarette ember, a held
// match). Blitted after the cast so it reads over a figure. No washes or reflection (those are the
// floor and wall, which are behind the figure).
export function drawFrontLight(e) {
  for (const L of e.lights) if (L.front && L.glow) { if (L.surface) surfaceGlow(e, L); airGlow(e, L); }
}
