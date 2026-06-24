// =====================================================================================
//  ENGINE — the noir GRAMMAR. Knows nothing about any particular story; it only knows the
//  fixed palette, declared light sources, animation timing, rain/grain/vignette/lightning,
//  scene transitions, and how to render narration as comic captions.
//
//  The single `Noir` instance is exported here as the base object (registry + runtime
//  state + per-frame render). Its other concerns are mixed in (Object.assign) by the
//  sibling modules: lighting.js, weather.js, transitions.js, narration.js, input.js.
//
//  A story is just DATA (see stories/*). Add a line for a new beat; add an object for a
//  new scene. No engine edits required.
// =====================================================================================
import { PALETTE } from './palette.js';
import { ANIM } from './anim.js';
import { lerp, smooth01 } from './math.js';
import { Shells } from '../effects/shells.js';
import { Ripples } from '../effects/ripples.js';

export const Noir = {
  actors: {}, backdrops: {},
  registerActor(name, fn) { this.actors[name] = fn; },
  registerBackdrop(name, obj) { this.backdrops[name] = obj; },

  // runtime state
  cv: null, ctx: null, W: 0, H: 0, DPR: 1,
  palette: PALETTE, anim: ANIM,
  parallax: 0, parTarget: 0, t: 0, dt: 0, unit: 1, gy: 0, keyLight: { x: 0.3, y: 0.3 },
  flags: {},                 // per-scene event flags (muzzle, blood, ...)
  drops: [], grain: null, lights: [],   // lights[] = the light sources registered this frame
  started: false, sceneIdx: 0, lineIdx: -1,
  lightning: 0, nextBolt: 4, transState: null, transAlpha: 0, pending: 0, cardT: 0,
  sceneStart: 0, lineStart: 0,          // timing for choreography (seconds)
  _moon: null,                          // the moon, registered as a weak distant light
  opening: false,                       // the one-time establishing zoom at story start
  seen: [], navShown: false,            // scene navigator unlocks after one full loop
  beat() { return Math.max(0, this.t - this.lineStart); },     // seconds since the current line appeared
  sceneT() { return Math.max(0, this.t - this.sceneStart); },  // seconds since the scene began

  init(story) {
    this.cv = document.getElementById('c');
    this.ctx = this.cv.getContext('2d', { alpha: false });
    this.capEl = document.getElementById('caption');
    this.tagEl = document.getElementById('scenetag');
    this.tapEl = document.getElementById('tapnote');
    this.bindInput();
    addEventListener('resize', () => this.resize());
    this.W = innerWidth; this.H = innerHeight;          // so buildScenes has a size
    this.scenes = story.scenes; this.story = story;
    this.resize();
    this.buildGrain();
    this.last = performance.now();
    requestAnimationFrame(n => this.frame(n));
  },

  // Swap in a new story at runtime (used by the editor). Pure data in, fresh play out.
  loadStory(story) {
    this.story = story;
    this.scenes = story.scenes || [];
    this.sceneIdx = 0; this.lineIdx = 0; this.flags = {};
    this.transState = null; this.transAlpha = 0; this.parallax = this.parTarget = 0;
    this.buildScenes();
    if (this.started) { this.showLine(); this.showTag(); }
  },

  buildScenes() {
    for (const sc of this.scenes) {
      const bd = this.backdrops[sc.backdrop && sc.backdrop.type];
      sc._bd = (bd && bd.build) ? bd.build(this, sc) : null;
    }
  },

  resize() {
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.floor(this.W * this.DPR); this.cv.height = Math.floor(this.H * this.DPR);
    this.cv.style.width = this.W + 'px'; this.cv.style.height = this.H + 'px';
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    this.buildScenes();
    this.initRain();
  },

  // ---- coordinate helpers actors use ----
  X(p) { return p.x * this.W + this.parallax * (p.par == null ? 0.5 : p.par); },
  scaleOf(p) { return this.unit * (p.scale || 1); },
  // an actor with p.walk = [x per line] glides between marks across each line (choreography)
  walkX(p) {
    if (!p.walk) return this.X(p);
    const w = p.walk, i = Math.min(this.lineIdx, w.length - 1), prev = i > 0 ? w[i - 1] : w[0];
    const nx = lerp(prev, w[i], smooth01(this.beat() / (p.walkDur || 3.4)));
    return nx * this.W + this.parallax * (p.par == null ? 0.5 : p.par);
  },

  // ---- the per-frame render ----
  frame(now) {
    requestAnimationFrame(n => this.frame(n));
    this.dt = Math.min((now - this.last) / 1000, 0.05); this.last = now; this.t = now / 1000;
    this.parallax += (this.parTarget - this.parallax) * ANIM.parallaxLerp;
    this.unit = Math.min(this.W, this.H) / 360;
    this.lights = [];                             // light sources re-register every frame
    if (this.flags.muzzle > 0) this.flags.muzzle = Math.max(0, this.flags.muzzle - this.dt * 2.2);

    const c = this.ctx, scene = this.scenes[this.sceneIdx];
    this.gy = (scene.ground || 0.8) * this.H;
    this.keyLight = scene.keyLight || { x: 0.3, y: 0.3 };

    // legacy establishing zoom: a single push-in at the very start — open wide (0.86) and ease to the
    // normal frame (1.0) over 3.4s, centered, with no pull-back after (and not repeated per scene)
    let z = 1; const fx = this.W / 2, fy = this.gy - 70 * this.unit;
    if (this.opening) { const ob = this.sceneT(); z = lerp(0.86, 1, smooth01(ob / 3.4)); if (ob > 3.6) this.opening = false; }
    if (z < 1) { c.fillStyle = '#000'; c.fillRect(0, 0, this.W, this.H); }   // black surround while the frame is open wide
    c.save();
    if (z !== 1) { c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy); }
    this.drawSkyAndMoon(scene);
    const bd = this.backdrops[scene.backdrop && scene.backdrop.type];
    if (bd && bd.draw) bd.draw(this, scene);     // backdrop (may draw its own lights/floor)
    this.drawLights(scene);                       // declared light sources (register + halo + floor reflection)
    for (const p of (scene.cast || [])) {        // cast — with story-driven visibility
      if (p.onFlag && !this.flags[p.onFlag]) continue;
      if (p.hideOnFlag && this.flags[p.hideOnFlag]) continue;
      const fn = this.actors[p.actor]; if (fn) fn(this, p);
    }
    Shells.draw(this);                            // brass casings on the ground, in front of the cast

    // weather only falls outdoors (interiors set indoor:true on the backdrop, or scene.indoor)
    const indoor = scene.indoor != null ? scene.indoor : !!(bd && bd.indoor);
    if (!indoor) {
      if (Math.random() < 0.85) Ripples.spawn(this);
      this.drawRain(scene.bloodRain);
      this.nextBolt -= this.dt;
      if (this.nextBolt <= 0) { this.lightning = Math.max(this.lightning, 0.9); if (Math.random() < 0.7) this.bolt(now | 0); this.nextBolt = ANIM.boltGap[0] + Math.random() * (ANIM.boltGap[1] - ANIM.boltGap[0]); }
      if (this.lightning > 0) { c.fillStyle = `rgba(255,255,255,${this.lightning * 0.5})`; c.fillRect(0, 0, this.W, this.H); this.lightning = Math.max(0, this.lightning - this.dt * 3); }
    } else { this.lightning = 0; }
    c.restore();

    if (this.grain) { c.globalAlpha = ANIM.grainAlpha; const gx = -Math.random() * 80, gy = -Math.random() * 80; for (let yy = gy; yy < this.H; yy += 220) for (let xx = gx; xx < this.W; xx += 220) c.drawImage(this.grain, xx, yy); c.globalAlpha = 1; }
    const vg = c.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.3, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${ANIM.vignette})`); c.fillStyle = vg; c.fillRect(0, 0, this.W, this.H);

    // transition: legacy comic-panel ink-wipe IN → hold the act-name card while covered → wipe OUT
    if (this.transState === 'in') { this.transAlpha += this.dt * 1.9; if (this.transAlpha >= 1) { this.transAlpha = 1; this.enterScene(this.pending); this.transState = 'card'; this.cardT = 0; } }
    else if (this.transState === 'card') { this.cardT += this.dt; if (this.cardT >= 1.3) { this.sceneStart = this.t; this.showLine(); this.showTag(); this.transState = 'out'; } }
    else if (this.transState === 'out') { this.transAlpha -= this.dt * 1.5; if (this.transAlpha <= 0) { this.transAlpha = 0; this.transState = null; } }
    const covering = this.transState === 'in' || this.transState === 'card';
    if (this.capEl) this.capEl.style.opacity = covering ? '0' : this.capEl.style.opacity;     // hide the caption + help while covered
    if (this.tapEl) this.tapEl.style.opacity = covering ? '0' : '1';
    if (this.transState === 'card') { this.panelWipe(1); this.drawCard(); }
    else if (this.transAlpha > 0) this.panelWipe(this.transAlpha);
  },
};
