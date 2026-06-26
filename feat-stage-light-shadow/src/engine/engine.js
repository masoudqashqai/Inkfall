// ENGINE — owns the on-screen canvas, the single additive LIGHT BUFFER (offscreen), the
// device-pixel sizing, and the requestAnimationFrame loop. It keeps the shared Frame's
// scalars (size, time, contexts) live and hands a tick to the manager each frame.
import { Frame } from './frame.js';
import { ASPECT_MIN, ASPECT_MAX } from './viewport.js';

// the world is authored in a FIXED virtual resolution: the band is always REF_H logical units tall
// (1080p, our anchor). The world transform scales that logical space to the real band, so the whole
// scene is one uniform zoom of the same 1080p composition at any size (a phone, 1080p, 4K). Every
// number in draw code therefore means "pixels at 1080p". Width is REF_H * aspect (so a wider frame
// shows more world, never bigger objects), and unit stays 3 everywhere.
export const REF_H = 1080;

export class Engine {
  constructor() {
    this.cv = null; this.ctx = null; this.DPR = 1; this.W = 0; this.H = 0; this.unit = 1;
    this.cssW = 0; this.cssH = 0; this.ls = 1;   // the real band size (CSS px) and logical->CSS scale
    this.lightCv = null; this.lightCtx = null;
    this.shadowCv = null; this.shadowCtx = null;   // the offscreen shadow buffer (projected onto the stage, blitted under the cast)
    this.litCv = null; this.litCtx = null;         // a per-object albedo layer: each cast object is drawn here, lit as a whole, then blitted
    this.maskCv = null; this.maskCtx = null;       // the object's albedo alpha, kept so the light multiply can be re-masked to its own pixels
    this.snapCv = null; this.snapCtx = null;   // a frozen copy of the last frame, for the beat crossfade
    this.frame = new Frame();
    this.drops = []; this.grain = null;     // rain particles + film-grain tile (persist across scenes)
    this.last = 0;
    this.paused = false; this.pauseOffset = 0; this._pauseAt = 0;   // a play clock that the viewport gate can freeze
  }

  init() {
    this.cv = document.getElementById('c');
    this.ctx = this.cv.getContext('2d', { alpha: false });   // NOT desynchronized: the low-latency surface tears/flickers badly on real phones (fine on desktop + emulation, so it hid)
    this.lightCv = document.createElement('canvas');
    this.lightCtx = this.lightCv.getContext('2d');
    this.shadowCv = document.createElement('canvas');
    this.shadowCtx = this.shadowCv.getContext('2d');
    this.litCv = document.createElement('canvas');
    this.litCtx = this.litCv.getContext('2d');
    this.maskCv = document.createElement('canvas');
    this.maskCtx = this.maskCv.getContext('2d');
    this.snapCv = document.createElement('canvas');
    this.snapCtx = this.snapCv.getContext('2d');
    addEventListener('resize', () => this.resize());
    this.W = innerWidth; this.H = innerHeight;
    this.resize();
  }

  // size the canvas to the landscape aspect band, centered, so the viewport's spare space becomes
  // black bars: top and bottom on a too-tall screen, left and right on a too-wide one. Everything
  // downstream reads W/H, but those are now LOGICAL units (the band is always REF_H tall): the world
  // transform scales the logical space onto the real band, so the world never knows its real size
  // OR that it is letterboxed. The buffers and CSS still use the real band size in device/CSS px.
  resize() {
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    const vw = innerWidth, vh = innerHeight, ar = vw / vh;
    let w = vw, h = vh;
    if (ar < ASPECT_MIN) h = Math.round(vw / ASPECT_MIN);        // too tall: cap the height
    else if (ar > ASPECT_MAX) w = Math.round(vh * ASPECT_MAX);   // too wide: cap the width
    this.cssW = w; this.cssH = h;                                // the real band, in CSS px
    this.ls = Math.min(w, h) / REF_H;                           // logical -> CSS scale (the band is always REF_H tall)
    this.W = w / this.ls; this.H = h / this.ls;                 // the LOGICAL band (H == REF_H, W == REF_H * aspect)
    for (const cv of [this.cv, this.lightCv, this.shadowCv, this.litCv, this.maskCv, this.snapCv]) { cv.width = Math.floor(w * this.DPR); cv.height = Math.floor(h * this.DPR); }
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    this.cv.style.left = Math.floor((vw - w) / 2) + 'px';
    this.cv.style.top = Math.floor((vh - h) / 2) + 'px';
    this.initRain();
    if (!this.grain) this.buildGrain();
    if (this.onResize) this.onResize();
  }

  initRain() {
    this.drops.length = 0;
    // size + count track the scene scale (k = 1 at a 1080p landscape screen), so rain looks exactly
    // like 1080p everywhere instead of becoming a flood of fine pixels on a big window.
    const k = Math.min(this.W, this.H) / 1080;
    const n = Math.floor((this.W * this.H) / (5200 * k * k));
    for (let i = 0; i < n; i++) this.drops.push({ x: Math.random() * (this.W + 200) - 100, y: Math.random() * this.H, len: (8 + Math.random() * 16) * k, sp: (9 + Math.random() * 9) * k });
  }
  buildGrain() {
    const g = document.createElement('canvas'); g.width = g.height = 220;
    const gx = g.getContext('2d'), im = gx.createImageData(220, 220);
    for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    gx.putImageData(im, 0, 0); this.grain = g;
  }

  // refresh the Frame's per-frame scalars + contexts
  syncFrame(now) {
    const f = this.frame;
    f.W = this.W; f.H = this.H; f.unit = Math.min(this.W, this.H) / 360;
    f.t = now / 1000; f.dt = Math.min((now - this.last) / 1000, 0.05);
    f.main = this.ctx; f.light = this.lightCtx; f.shadow = this.shadowCtx; f.lit = this.litCtx; f.mask = this.maskCtx; f.ctx = this.ctx;
    f.drops = this.drops; f.grain = this.grain; f.DPR = this.DPR; f.ls = this.ls;
    this.last = now;
    return f;
  }

  // transform helpers. World drawing maps LOGICAL units -> device pixels through DPR * ls (the world
  // is authored at REF_H tall and scaled to the real band), so all draw code is resolution agnostic.
  // Device drawing (buffer-to-buffer blits, the shadow tint, the crossfade) is 1:1, no logical scale.
  setWorldTransform(ctx) { const k = this.DPR * this.ls; ctx.setTransform(k, 0, 0, k, 0, 0); }
  setDeviceTransform(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }

  // freeze the current on-screen frame so the next beat can crossfade out of it
  snapshot() { this.snapCtx.setTransform(1, 0, 0, 1, 0, 0); this.snapCtx.clearRect(0, 0, this.snapCv.width, this.snapCv.height); this.snapCtx.drawImage(this.cv, 0, 0); }

  // freeze the play clock (used by the orientation gate). Time stops, so the story holds its frame
  // and resumes without a jump when landscape returns.
  pause() { if (this.paused) return; this.paused = true; this._pauseAt = performance.now(); }
  resume() { if (!this.paused) return; this.paused = false; this.pauseOffset += performance.now() - this._pauseAt; }

  run(onTick) {
    this.last = performance.now();
    const loop = now => {
      requestAnimationFrame(loop);
      if (this.paused) return;                 // hold the last frame, advance no time
      const pt = now - this.pauseOffset;        // the play clock: wall time minus all paused spans
      onTick(this.syncFrame(pt), pt);
    };
    requestAnimationFrame(loop);
  }
}
