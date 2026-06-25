// COMPOSITOR — the ordered render. Draws the world to the main canvas (camera-applied), the
// additive light layer to the offscreen buffer, composites them, then weather over the top and
// the screen-space post + transition. Two buffers keep the light layer separable for the look.
import { sky } from '../render/passes/sky.js';
import { casterRecord, paintCaster, tintRect, shadowBounds } from '../render/shadows.js';
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

export class Compositor {
  constructor(engine) { this.engine = engine; }

  // paint one caster's shadow and composite it onto the main canvas. Called in depth order during
  // the cast, so each shadow lands on the floor, the wall and the cast behind it. Only the caster's
  // device-pixel region is cleared, tinted and composited (not the whole screen), which is the main
  // shadow-cost saving.
  castShadow(e, cr) {
    const eng = this.engine, main = e.main, shadow = e.shadow, cam = e.scene.camera, cv = eng.shadowCv;
    eng.setWorldTransform(shadow); shadow.save(); cam.apply(shadow);
    const r = devRect(shadow.getTransform(), shadowBounds(e, cr), cv.width, cv.height);
    if (r.w < 1 || r.h < 1) { shadow.restore(); return; }
    shadow.save(); shadow.setTransform(1, 0, 0, 1, 0, 0); shadow.clearRect(r.x, r.y, r.w, r.h); shadow.restore();
    e.ctx = shadow; paintCaster(e, cr);
    shadow.restore();
    tintRect(e, r.x, r.y, r.w, r.h);
    eng.setDeviceTransform(main); main.globalCompositeOperation = 'source-over';
    main.drawImage(cv, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
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
    for (const o of e.scene.midObjects(e)) {
      if (o.castsShadow) this.castShadow(e, casterRecord(e, o));
      eng.setWorldTransform(main); main.save(); cam.apply(main); e.ctx = main;
      o.draw(e);
      main.restore();
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
  }
}
