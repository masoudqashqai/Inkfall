// SHADOW SERVICE — the stage-aware companion to the lighting service. Each object whose castsShadow
// is true is turned into a CASTER record and its shadow is painted to the offscreen shadow buffer,
// projected through the strongest lights onto the stage floor and, where the set has one, climbing
// the back wall. The compositor paints each caster's shadow in depth order, right before the object
// is drawn, so a shadow lands not only on the floor and wall but on the cast already behind it (a
// figure in front shadows a figure behind). A caster may hand a shadowSil(e, c) that strokes only
// its solid body shape; without one it falls back to a tapered billboard from its width and height.
import { SHADE } from '../style/shadows.js';
import { stageOf, shadowThrow } from './stage.js';

// build a caster record from a placed object (its feet point, silhouette size, shape and density).
//   bx, baseY   the ground contact point (feet) in world space
//   w, h        silhouette half-width and height in world px (the billboard fallback + softness)
//   sil         optional shadowSil(e, c): draw the solid shape in LOCAL coords (origin at the feet,
//               up = negative y, widths already scaled), plain fills only
//   density     0..1 shadow opacity multiplier (lighter for glass/translucent props; default 1)
export function casterRecord(e, o) {
  const t = e.place(o), s = t.s;
  return {
    node: o, bx: t.x, baseY: t.groundY, anchorY: t.anchorY,
    w: (o.shadowW != null ? o.shadowW : 26) * s,
    h: (o.shadowH != null ? o.shadowH : 80) * s,
    density: o.shadowDensity != null ? o.shadowDensity : 1,
    sil: o.shadowSil || null,
  };
}

// a soft round black sprite for the contact dab (soft edge with no blur filter, as the rest of
// the engine does).
let _blob = null;
function softBlob() {
  if (_blob) return _blob;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  return _blob = cv;
}

// the strongest lights reaching a caster, sorted, capped — the ones that throw a shadow. front
// lights (a cigarette ember, a held match) are local foreground glows, not scene form-light, so
// they are skipped here exactly as they are for rim, tint and the dominant-light pick.
function shadowLights(e, bx) {
  return e.lights
    .filter(L => !L.front)
    .map(L => ({ L, w: L.I * (1 - Math.abs(bx - L.x) / (L.r * 1.2)) }))
    .filter(o => o.w > SHADE.minWeight)
    .sort((a, b) => b.w - a.w)
    .slice(0, SHADE.maxLights);
}

// draw a caster's silhouette under a prepared transform: the authored shape if it has one, else a
// tapered billboard (wide at the feet, narrower at the head) so a bare caster still reads as a body.
function stampShape(e, c, cr) {
  if (cr.sil) { cr.sil.call(cr.node, e, c); return; }
  const w = cr.w, h = cr.h;
  c.beginPath();
  c.moveTo(-w, 0); c.lineTo(-w * 0.5, -h * 0.92);
  c.quadraticCurveTo(0, -h * 1.04, w * 0.5, -h * 0.92); c.lineTo(w, 0);
  c.closePath(); c.fill();
}

// one projected stamp (floor or wall), feathered with a few layered taps to fake a soft edge.
// `mat(f)` returns the ctx.transform args at expansion factor f (1 = core, >1 = penumbra halo).
function projStamp(e, c, cr, alpha, soft, mat, softMul = 1, taps = SHADE.softTaps) {
  const step = (0.05 + Math.min(0.14, soft)) * softMul;
  for (let i = taps - 1; i >= 0; i--) {
    const f = 1 + i * step;                 // outer taps reach a little further along the projection
    const grow = 1 + i * SHADE.edgeFeather * softMul; // and grow the silhouette outward, so the edge feathers on
    c.save();                               // every side and fades into the surface, recognisable but soft
    c.globalAlpha = alpha / taps;
    c.fillStyle = '#000';
    const m = mat(f); c.transform(m[0], m[1], m[2], m[3], 0, 0); c.scale(grow, grow);
    stampShape(e, c, cr);
    c.restore();
  }
}

function castOne(e, c, st, cr) {
  const bx = cr.bx, baseY = cr.baseY, h = cr.h, headY = baseY - h, dens = cr.density;
  const lit = shadowLights(e, bx);

  // CONTACT OCCLUSION: a wide soft dab grounds the caster, then a tighter darker core right under the
  // feet reads as ambient light blocked where the form meets the floor (an AO, present with no key).
  c.save(); c.globalAlpha = SHADE.contactAlpha * dens * st.env.shadow;
  const cr0 = cr.w * 1.2; c.drawImage(softBlob(), bx - cr0, baseY - cr0 * 0.28, cr0 * 2, cr0 * 0.56);
  c.globalAlpha = SHADE.aoCore * dens * st.env.shadow;
  const ca = cr.w * 0.6; c.drawImage(softBlob(), bx - ca, baseY - ca * 0.36, ca * 2, ca * 0.72);
  // a prop sitting on a raised surface (its anchor above the floor) gets the same AO where it meets
  // that surface, so it grounds onto the table, not just the floor below.
  if (cr.anchorY != null && cr.anchorY < baseY - cr.w * 0.5) c.drawImage(softBlob(), bx - ca, cr.anchorY - ca * 0.36, ca * 2, ca * 0.72);
  c.restore();

  for (const { L, w } of lit) {
    const t = shadowThrow(st, L.x, L.y, bx, headY);
    const emitSoft = Math.min(0.5, (L.ew + L.eh) / (2 * t.lh));   // a broad emitter throws a softer edge
    // opacity from the light's weight, but with a gentle curve so a dim light (the high moon) still
    // throws a readable shadow while a strong light is barely changed.
    const wA = Math.pow(w, 0.6);
    c.save(); c.translate(bx, baseY);

    // FLOOR: lay the silhouette away from the light, foreshortened toward the camera. Recedes as
    // the light drops (the wall takes over), so the two stamps never both run at full strength.
    const throwScale = Math.min(SHADE.maxLen, Math.max(0.3, Math.abs(bx - L.x) / t.lh) * SHADE.lengthGain * st.env.length);
    const fAlpha = SHADE.floorAlpha * wA * dens * (1 - 0.5 * t.low) * st.env.shadow;
    const fSoft = emitSoft + throwScale * 0.06 + SHADE.penumbra * 0.05;   // the longer the throw, the softer the far end (penumbra grows with distance)
    c.save(); c.beginPath(); c.rect(-st.gy * 4, 0, st.gy * 8, st.H); c.clip();   // floor only (below feet)
    projStamp(e, c, cr, fAlpha, fSoft, f => [1, 0, -t.dir * throwScale * f, -throwScale * SHADE.floorTilt * f, 0, 0], st.env.soft);
    c.restore();

    // WALL: climb each real wall SEGMENT the set has, when the light sits low enough to throw up it.
    // The stamp is clipped to each segment's own extent and top, so a shadow lands only on actual
    // brick and never crosses an opening (no segment there = no shadow there) by construction.
    if (st.walls.length && t.low > 0.2) {
      const rise = 1.1 + t.low * 2.0, lean = (Math.abs(bx - L.x) / t.lh) * 0.5 + 0.1;
      const wAlpha = SHADE.wallAlpha * wA * dens * t.low * st.env.shadow;
      const wSoft = emitSoft + SHADE.penumbra * 0.06;
      const mat = f => [1, 0, -t.dir * lean * f, rise * f, 0, 0];
      for (const w of st.walls) {
        c.save(); c.beginPath(); c.rect(w.x0 - bx, w.top - baseY, w.x1 - w.x0, baseY - w.top); c.clip();   // this wall segment only
        projStamp(e, c, cr, wAlpha, wSoft, mat, st.env.soft, SHADE.wallTaps);
        c.restore();
      }
    }
    c.restore();
  }
}

// the floor-to-wall CREASE: a soft dark band where each wall segment meets the floor, the ambient
// occlusion of the junction. Painted once per frame on the main canvas (camera already applied by
// the caller), over the lit set but under the cast, so the room corner reads grounded, not flat.
export function drawWallCrease(e, st) {
  if (!st.walls.length || SHADE.creaseAlpha <= 0) return;
  const c = e.main, a = SHADE.creaseAlpha * st.env.shadow;
  for (const w of st.walls) {
    const h = Math.min(70, (st.gy - w.top) * 0.55);
    const g = c.createLinearGradient(0, st.gy - h, 0, st.gy);
    g.addColorStop(0, `rgba(${SHADE.color},0)`); g.addColorStop(1, `rgba(${SHADE.color},${a})`);
    c.save(); c.fillStyle = g; c.fillRect(w.x0, st.gy - h, w.x1 - w.x0, h); c.restore();
  }
}

// paint one caster's shadow (black) onto the shadow buffer. The buffer is cleared and camera-applied
// by the compositor, which then tints and composites it before drawing the object, so each caster's
// shadow falls on the floor, the wall and the cast already behind it.
export function paintCaster(e, cr, st) { castOne(e, e.shadow, st || stageOf(e), cr); }

// a generous WORLD-space box that contains everything paintCaster will draw for this caster (the
// contact dab, the floor shadow laid toward the camera, and the wall shadow climbing to wallTop).
// The compositor transforms it to device pixels so it can clear, tint and composite only that
// region instead of the whole screen, which is the main shadow-cost saving.
export function shadowBounds(e, cr, st) {
  st = st || stageOf(e);
  const reach = (cr.w + cr.h * SHADE.maxLen) * 1.5 + 30;        // horizontal throw (both ways, two lights)
  const down = cr.h * SHADE.maxLen * SHADE.floorTilt * 1.6 + cr.w + 30;
  const wallTop = st.walls.length ? Math.min(...st.walls.map(w => w.top)) : (cr.baseY - cr.w * 1.3);
  const top = wallTop - 24;
  return { x0: cr.bx - reach, y0: top, x1: cr.bx + reach, y1: cr.baseY + down };
}

// recolour a device-pixel rect of the buffer to the shadow ink (source-in keeps the soft alpha and
// swaps the colour), so only the caster's region is touched, not the whole canvas.
export function tintRect(e, x, y, w, h) {
  const c = e.shadow;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = `rgba(${SHADE.color},1)`; c.fillRect(x, y, w, h);
  c.restore();
}
