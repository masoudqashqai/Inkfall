// ENGINE — owns the on-screen canvas, the single additive LIGHT BUFFER (offscreen), the
// device-pixel sizing, and the requestAnimationFrame loop. It keeps the shared Frame's
// scalars (size, time, contexts) live and hands a tick to the manager each frame.
import { Frame } from './frame.js';

export class Engine {
  constructor() {
    this.cv = null; this.ctx = null; this.DPR = 1; this.W = 0; this.H = 0; this.unit = 1;
    this.lightCv = null; this.lightCtx = null;
    this.snapCv = null; this.snapCtx = null;   // a frozen copy of the last frame, for the beat crossfade
    this.frame = new Frame();
    this.drops = []; this.grain = null;     // rain particles + film-grain tile (persist across scenes)
    this.last = 0;
  }

  init() {
    this.cv = document.getElementById('c');
    this.ctx = this.cv.getContext('2d', { alpha: false });   // NOT desynchronized: the low-latency surface tears/flickers badly on real phones (fine on desktop + emulation, so it hid)
    this.lightCv = document.createElement('canvas');
    this.lightCtx = this.lightCv.getContext('2d');
    this.snapCv = document.createElement('canvas');
    this.snapCtx = this.snapCv.getContext('2d');
    addEventListener('resize', () => this.resize());
    this.W = innerWidth; this.H = innerHeight;
    this.resize();
  }

  resize() {
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.W = innerWidth; this.H = innerHeight;
    for (const cv of [this.cv, this.lightCv, this.snapCv]) { cv.width = Math.floor(this.W * this.DPR); cv.height = Math.floor(this.H * this.DPR); }
    this.cv.style.width = this.W + 'px'; this.cv.style.height = this.H + 'px';
    this.initRain();
    if (!this.grain) this.buildGrain();
    if (this.onResize) this.onResize();
  }

  initRain() {
    this.drops.length = 0;
    const n = Math.floor((this.W * this.H) / 5200);
    for (let i = 0; i < n; i++) this.drops.push({ x: Math.random() * (this.W + 200) - 100, y: Math.random() * this.H, len: 8 + Math.random() * 16, sp: 9 + Math.random() * 9 });
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
    f.main = this.ctx; f.light = this.lightCtx; f.ctx = this.ctx;
    f.drops = this.drops; f.grain = this.grain; f.DPR = this.DPR;
    this.last = now;
    return f;
  }

  // device-pixel transform helpers (buffers + main share the same backing size)
  setWorldTransform(ctx) { ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0); }
  setDeviceTransform(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }

  // freeze the current on-screen frame so the next beat can crossfade out of it
  snapshot() { this.snapCtx.setTransform(1, 0, 0, 1, 0, 0); this.snapCtx.clearRect(0, 0, this.snapCv.width, this.snapCv.height); this.snapCtx.drawImage(this.cv, 0, 0); }

  run(onTick) {
    this.last = performance.now();
    const loop = now => { requestAnimationFrame(loop); onTick(this.syncFrame(now), now); };
    requestAnimationFrame(loop);
  }
}
