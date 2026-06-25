// COMPOSITOR — the ordered render. Draws the world to the main canvas (camera-applied), the
// additive light layer to the offscreen buffer, composites them, then weather over the top and
// the screen-space post + transition. Two buffers keep the light layer separable for the look.
import { sky } from '../render/passes/sky.js';
import { lighting } from '../render/passes/lighting.js';
import { weather } from '../render/passes/weather.js';
import { post } from '../render/passes/post.js';
import { transition } from '../render/passes/transition.js';

export class Compositor {
  constructor(engine) { this.engine = engine; }

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

    // WORLD → main, camera-applied (the establishing zoom stays >= 1, so the world always overfills)
    eng.setWorldTransform(main);
    main.fillStyle = '#000'; main.fillRect(0, 0, e.W, e.H);
    main.save(); cam.apply(main); e.ctx = main;
    sky(e);                       // sky + moon (moon registers its light)
    e.scene.collectLights(e);     // declared lights + emissive props → e.lights (before objects)
    e.scene.drawBack(e);          // distant elements (e.g. a searchlight beam) behind the backdrop
    e.scene.drawBackdrop(e);
    e.scene.drawFixtures(e);      // the visible lamp/neon/bulb fixtures
    e.scene.drawObjects(e);       // props/actors/movers/effects (depth order) + brass
    main.restore();

    // LIGHT BUFFER → camera-applied
    eng.setWorldTransform(light);
    light.clearRect(0, 0, e.W, e.H);
    light.save(); cam.apply(light); e.ctx = light;
    lighting(e);                  // halos + reflections for every light + static neon reflections
    e.scene.drawLightExtras(e);   // ripples
    light.restore();

    // composite the light layer additively onto the world (device pixels, 1:1)
    eng.setDeviceTransform(main);
    main.globalCompositeOperation = 'lighter';
    main.drawImage(eng.lightCv, 0, 0);
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
