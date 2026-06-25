// COMPOSITOR — the ordered render. Draws the world to the main canvas (camera-applied), the
// additive light layer to the offscreen buffer, composites them, then weather over the top and
// the screen-space post + transition. Two buffers keep the light layer separable for the look.
import { sky } from '../render/passes/sky.js';
import { casterRecord, paintCaster, tintBuffer } from '../render/shadows.js';
import { lightingBack, lightingFront } from '../render/passes/lighting.js';
import { weather } from '../render/passes/weather.js';
import { post } from '../render/passes/post.js';
import { transition } from '../render/passes/transition.js';

export class Compositor {
  constructor(engine) { this.engine = engine; }

  // paint one caster's shadow to the shadow buffer and composite it onto the main canvas. Called in
  // depth order during the cast, so each shadow lands on the floor, the wall and the cast behind it.
  castShadow(e, cr) {
    const eng = this.engine, main = e.main, shadow = e.shadow, cam = e.scene.camera;
    eng.setWorldTransform(shadow); shadow.clearRect(0, 0, e.W, e.H);
    shadow.save(); cam.apply(shadow); e.ctx = shadow;
    paintCaster(e, cr);
    shadow.restore();
    tintBuffer(e);
    eng.setDeviceTransform(main); main.globalCompositeOperation = 'source-over'; main.drawImage(eng.shadowCv, 0, 0);
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
    // composited AFTER the cast so the glow reads over the figure.
    eng.setWorldTransform(light);
    light.clearRect(0, 0, e.W, e.H);
    light.save(); cam.apply(light); e.ctx = light;
    lightingFront(e);
    light.restore();
    eng.setDeviceTransform(main); main.globalCompositeOperation = 'lighter'; main.drawImage(eng.lightCv, 0, 0);
    main.globalCompositeOperation = 'source-over';

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
