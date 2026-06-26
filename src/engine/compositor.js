// COMPOSITOR — the ordered render. Draws the world to the main canvas (camera-applied), the
// additive light layer to the offscreen buffer, composites them, then weather over the top and
// the screen-space post + transition. Two buffers keep the light layer separable for the look.
import { sky } from '../render/passes/sky.js';
import { casterRecord, paintCaster, tintRect, shadowBounds, drawWallCrease } from '../render/shadows.js';
import { stageOf } from '../render/stage.js';
import { sampleLight, lightFactor, MAT, HAZE } from '../style/materials.js';
import { DEBUG, drawStageDebug } from '../render/debug.js';
import { lightingBack, lightingFront } from '../render/passes/lighting.js';
import { weather } from '../render/passes/weather.js';
import { post } from '../render/passes/post.js';
import { transition } from '../render/passes/transition.js';

// transform a WORLD rect to a clamped device-pixel rect through the active context matrix M (which
// already folds in DPR + the camera). Used to scope shadow work to a caster's region.
function devRect(M, b, cw, ch) {
  const xs = [M.a * b.x0 + M.c * b.y0 + M.e, M.a * b.x1 + M.c * b.y0 + M.e, M.a * b.x0 + M.c * b.y1 + M.e, M.a * b.x1 + M.c * b.y1 + M.e];
  const ys = [M.b * b.x0 + M.d * b.y0 + M.f, M.b * b.x1 + M.d * b.y0 + M.f, M.b * b.x0 + M.d * b.y1 + M.f, M.b * b.x1 + M.d * b.y1 + M.f];
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 1), y0 = Math.max(0, Math.floor(Math.min(...ys)) - 1);
  const x1 = Math.min(cw, Math.ceil(Math.max(...xs)) + 1), y1 = Math.min(ch, Math.ceil(Math.max(...ys)) + 1);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// a generous WORLD-space box around an object that contains everything its draw will paint (figure,
// arms, hat, props). The lit-sprite pass scopes its layer work to this region. Margins are loose on
// purpose, the light gradient is re-masked to the object's own pixels so over-covering is harmless.
function litBounds(e, o) {
  const t = e.place(o), s = t.s, bx = t.x, baseY = t.anchorY;
  // scoped around the object's RESOLVED transform (place), so it follows a walking actor or a self
  // animating object that declares an xform. The default height is generous (a tall prop like a
  // traffic light is ~200px and sets no shadowH), so the layer never clips the top of an object.
  const w = (o.shadowW != null ? o.shadowW : 56) * s, h = (o.shadowH != null ? o.shadowH : 200) * s;
  const hw = Math.max(w * 2.4, 90 * s);
  return { x0: bx - hw, y0: baseY - (h * 1.35 + 48 * s), x1: bx + hw, y1: baseY + (h * 0.35 + 48 * s) };
}

const _cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);

// the light gradient MULTIPLIED over an object's albedo: a half-Lambert ramp along the light
// direction across the object's box, from the key on the lit side to the cool ambient fill on the
// shadow side. One ramp lights the whole figure, so every part shades the same.
function lightGrad(ctx, F, b) {
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, R = Math.max(b.x1 - b.x0, b.y1 - b.y0) * 0.6, W = MAT.wrap;
  const g = ctx.createLinearGradient(cx + F.dx * R, cy + F.dy * R, cx - F.dx * R, cy - F.dy * R);
  for (let i = 0; i <= 4; i++) { const t = i / 4, u = 1 - 2 * t, hl = (1 - W) + W * Math.max(0, 0.5 + 0.5 * u); g.addColorStop(t, lightFactor(F, hl * hl)); }
  return g;
}

// the RIM, ADDED over the lit form (composite 'lighter'): light grazing the side of the figure that
// faces the light, brightest at the silhouette and falling off inward over rimWidth, in the light's
// own hue. Scaling the alpha by F.lit means a stronger light wraps further round the form, so it
// reads as light TOUCHING and expanding across the edge, not a drawn outline. Masked to the figure.
function rimGrad(ctx, F, b) {
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, R = Math.max(b.x1 - b.x0, b.y1 - b.y0) * 0.6;
  const g = ctx.createLinearGradient(cx + F.dx * R, cy + F.dy * R, cx - F.dx * R, cy - F.dy * R);
  const a = MAT.rim * F.lit, col = `${_cl(255 * F.lcol[0])},${_cl(255 * F.lcol[1])},${_cl(255 * F.lcol[2])}`, w = Math.min(0.95, Math.max(0.05, MAT.rimWidth));
  g.addColorStop(0, `rgba(${col},${a})`);
  g.addColorStop(w * 0.5, `rgba(${col},${a * 0.35})`);
  g.addColorStop(w, `rgba(${col},0)`);
  g.addColorStop(1, `rgba(${col},0)`);
  return g;
}

// the floor UP-BOUNCE, ADDED over the lit form: light reflecting off the wet floor back onto the
// figure's lower body, in the floor's lit hue, brightest at the feet and dying out by mid-figure.
function bounceGrad(ctx, F, b, gY) {
  const top = b.y0 + (b.y1 - b.y0) * 0.45;
  const g = ctx.createLinearGradient(0, gY, 0, top);
  const a = MAT.floorBounce * F.lit, col = `${_cl(255 * F.lcol[0])},${_cl(255 * F.lcol[1])},${_cl(255 * F.lcol[2])}`;
  g.addColorStop(0, `rgba(${col},${a})`);
  g.addColorStop(1, `rgba(${col},0)`);
  return g;
}

// the SPECULAR hotspot, ADDED over the lit form: a tight near-white highlight offset toward the
// light, for shiny materials (wet, metal, satin, glass). Strength is the object's own spec times the
// global MAT.spec ceiling times how lit it is, so matte cloth (spec 0) gets nothing.
function specGrad(ctx, F, b, spec) {
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, R = Math.max(b.x1 - b.x0, b.y1 - b.y0) * 0.5;
  const hx = cx + F.dx * R * 0.55, hy = cy + F.dy * R * 0.55;
  const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.55);
  const a = Math.min(1, spec * MAT.spec) * F.lit;
  const [r, gg, bb] = F.lcol, mix = v => _cl(255 * (0.5 + 0.5 * v));
  g.addColorStop(0, `rgba(${mix(r)},${mix(gg)},${mix(bb)},${a})`);
  g.addColorStop(1, `rgba(${mix(r)},${mix(gg)},${mix(bb)},0)`);
  return g;
}

export class Compositor {
  constructor(engine) { this.engine = engine; }

  // paint one caster's shadow and composite it onto the main canvas. Called in depth order during
  // the cast, so each shadow lands on the floor, the wall and the cast behind it. Only the caster's
  // device-pixel region is cleared, tinted and composited (not the whole screen), which is the main
  // shadow-cost saving.
  castShadow(e, cr, st) {
    const eng = this.engine, main = e.main, shadow = e.shadow, cam = e.scene.camera, cv = eng.shadowCv;
    eng.setWorldTransform(shadow); shadow.save(); cam.apply(shadow);
    const r = devRect(shadow.getTransform(), shadowBounds(e, cr, st), cv.width, cv.height);
    if (r.w < 1 || r.h < 1) { shadow.restore(); return; }
    shadow.save(); shadow.setTransform(1, 0, 0, 1, 0, 0); shadow.clearRect(r.x, r.y, r.w, r.h); shadow.restore();
    e.ctx = shadow; paintCaster(e, cr, st);
    shadow.restore();
    tintRect(e, r.x, r.y, r.w, r.h);
    eng.setDeviceTransform(main); main.globalCompositeOperation = 'source-over';
    main.drawImage(cv, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
  }

  // draw one cast object as a LIT SPRITE: render its flat albedo to the object layer, light the
  // whole thing in one masked multiply (so face, arms and coat all shade together and a cast shadow
  // already on the scene shows through), blit it in, then paint any emissive accents over the top.
  // An `unlit` object (an additive effect like steam) skips all of this and draws straight to main.
  drawObject(e, o) {
    const eng = this.engine, main = e.main, cam = e.scene.camera;
    if (o.unlit) { eng.setWorldTransform(main); main.save(); cam.apply(main); e.ctx = main; o.draw(e); main.restore(); return; }
    const lit = e.lit, cv = eng.litCv, mcv = eng.maskCv, mask = e.mask;
    const F = sampleLight(e, o), b = litBounds(e, o);
    eng.setWorldTransform(lit); lit.save(); cam.apply(lit);
    const r = devRect(lit.getTransform(), b, cv.width, cv.height);
    lit.restore();
    if (r.w < 1 || r.h < 1) return;
    // 1) flat albedo → the object layer
    lit.save(); lit.setTransform(1, 0, 0, 1, 0, 0); lit.clearRect(r.x, r.y, r.w, r.h); lit.restore();
    eng.setWorldTransform(lit); lit.save(); cam.apply(lit); e.ctx = lit; o.draw(e); lit.restore();
    // 2) keep the albedo's alpha as a mask
    mask.save(); mask.setTransform(1, 0, 0, 1, 0, 0); mask.clearRect(r.x, r.y, r.w, r.h); mask.drawImage(cv, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h); mask.restore();
    // 3) multiply the form light over the whole object (key -> cool fill ramp)
    eng.setWorldTransform(lit); lit.save(); cam.apply(lit); lit.globalCompositeOperation = 'multiply';
    lit.fillStyle = lightGrad(lit, F, b); lit.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); lit.restore();
    // 3b) ADD the rim (light wrapping the lit edge), the floor up-bounce and any specular hotspot over
    //     the form, so the light reads as touching it. They spill past the silhouette here, the
    //     re-mask below clips them.
    if (MAT.rim > 0 || MAT.floorBounce > 0 || (o.spec || 0) > 0) {
      const gY = e.place(o).groundY;
      eng.setWorldTransform(lit); lit.save(); cam.apply(lit); lit.globalCompositeOperation = 'lighter';
      if (MAT.rim > 0) { lit.fillStyle = rimGrad(lit, F, b); lit.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
      if (MAT.floorBounce > 0) { lit.fillStyle = bounceGrad(lit, F, b, gY); lit.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
      if ((o.spec || 0) > 0) { lit.fillStyle = specGrad(lit, F, b, o.spec); lit.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
      lit.restore();
    }
    // 3c) DEPTH HAZE: a far object (its z) is veiled toward the cool atmospheric grey, painted with
    //     source-atop so it only tints the figure's own pixels (greys it down, no halo).
    const z = o.z || 0;
    if (z > 0 && MAT.depthHaze > 0) {
      eng.setWorldTransform(lit); lit.save(); cam.apply(lit); lit.globalCompositeOperation = 'source-atop';
      lit.globalAlpha = Math.min(1, z * MAT.depthHaze); lit.fillStyle = `rgb(${HAZE[0]},${HAZE[1]},${HAZE[2]})`;
      lit.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); lit.restore();
    }
    // 4) re-mask the lit + rim + spec + bounce back to the object's own pixels
    lit.save(); lit.setTransform(1, 0, 0, 1, 0, 0); lit.globalCompositeOperation = 'destination-in'; lit.drawImage(mcv, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h); lit.restore();
    // 5) blit the lit object into the scene
    eng.setDeviceTransform(main); main.globalCompositeOperation = 'source-over'; main.drawImage(cv, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
    // 6) emissive accents (ember, neon hot, headlight), unlit, over the top
    if (o.glow) { eng.setWorldTransform(main); main.save(); cam.apply(main); e.ctx = main; o.glow(e); main.restore(); }
  }

  render(e) {
    const eng = this.engine, main = e.main, light = e.light, cam = e.scene.camera;
    e.lights = [];

    // THE END: a black screen with grain + vignette + the title (no scene drawn)
    if (e.flow && e.flow.ended) {
      eng.setWorldTransform(main); e.ctx = main;
      main.fillStyle = '#050505'; main.fillRect(0, 0, e.W, e.H);
      post(e); transition(e);
      return;
    }

    // WORLD (set) → main, camera-applied (the establishing zoom stays >= 1, so the world overfills)
    eng.setWorldTransform(main);
    main.fillStyle = '#000'; main.fillRect(0, 0, e.W, e.H);
    main.save(); cam.apply(main); e.ctx = main;
    sky(e);                       // sky + moon (moon registers its light)
    e.scene.collectSurfaces(e);   // raised surfaces (table tops) → e.surfaces (before lights/anchoring read them)
    e.scene.collectLights(e);     // declared lights + emissive props → e.lights (before anything reads them)
    e.scene.drawBack(e);          // distant elements (e.g. a searchlight beam) behind the backdrop
    e.scene.drawBackdrop(e);
    e.scene.drawFixtures(e);      // the visible lamp/neon/bulb fixtures
    main.restore();

    // BACK LIGHT BUFFER → camera-applied: environmental light (window bloom, beams, washes,
    // reflections, ripples, scene halos), composited BEFORE the cast so a foreground figure
    // occludes the light behind it.
    eng.setWorldTransform(light);
    light.clearRect(0, 0, e.W, e.H);
    light.save(); cam.apply(light); e.ctx = light;
    lightingBack(e);
    light.restore();
    eng.setDeviceTransform(main); main.globalCompositeOperation = 'lighter'; main.drawImage(eng.lightCv, 0, 0);
    main.globalCompositeOperation = 'source-over';

    // CAST → main, back to front. Each caster's shadow is painted right BEFORE its object, so it
    // falls on the floor, the back wall AND the cast already drawn behind it (a figure in front
    // shadows one behind). The object then draws over its own shadow.
    const st = stageOf(e);        // the stage is constant across casters this frame, so build it once
    eng.setWorldTransform(main); main.save(); cam.apply(main); drawWallCrease(e, st); main.restore();   // floor->wall crease AO, over the lit set, under the cast
    for (const o of e.scene.castObjects(e)) {
      if (o.castsShadow) this.castShadow(e, casterRecord(e, o), st);
      this.drawObject(e, o);      // lit sprite: flat albedo → whole-object lighting → blit → glow
    }
    eng.setWorldTransform(main); main.save(); cam.apply(main); e.ctx = main;
    e.scene.drawShells(e);        // ejected brass, over the cast
    main.restore();

    // FRONT LIGHT BUFFER → camera-applied: only lights in front of the cast (a cigarette ember),
    // composited AFTER the cast so the glow reads over the figure. Skipped entirely (no buffer clear
    // or composite) when nothing is in front, which is most scenes.
    if (e.lights.some(L => L.front)) {
      eng.setWorldTransform(light);
      light.clearRect(0, 0, e.W, e.H);
      light.save(); cam.apply(light); e.ctx = light;
      lightingFront(e);
      light.restore();
      eng.setDeviceTransform(main); main.globalCompositeOperation = 'lighter'; main.drawImage(eng.lightCv, 0, 0);
      main.globalCompositeOperation = 'source-over';
    }

    // WEATHER over the lit scene, camera-applied
    eng.setWorldTransform(main); main.save(); cam.apply(main); e.ctx = main;
    weather(e);
    main.restore();

    // POST + TRANSITION — screen space, no camera
    eng.setWorldTransform(main); e.ctx = main;
    post(e);
    transition(e);

    // BEAT CROSSFADE — dissolve the frozen previous frame out, so advancing a line never pops
    const f = e.flow;
    if (f && f.fadeT != null && !f.transState && !f.ended) {
      const a = 1 - (e.t - f.fadeT) / f.fadeDur;
      if (a <= 0) f.fadeT = null;
      else { eng.setDeviceTransform(main); main.save(); main.globalAlpha = a; main.drawImage(eng.snapCv, 0, 0); main.restore(); }
    }

    // STAGE DEBUG OVERLAY — on top of everything, camera-applied so it lines up with the world. Off
    // by default, toggled in the lab. Shows the surfaces light + shadow read, to catch mismatches.
    if (DEBUG.stage && !(e.flow && e.flow.ended)) { eng.setWorldTransform(main); main.save(); cam.apply(main); e.ctx = main; drawStageDebug(e); main.restore(); }
  }
}
