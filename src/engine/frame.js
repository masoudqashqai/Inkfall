// FRAME — the per-frame facade handed to passes and to every object's draw/update/emitLight.
// It bundles the live timing + sizes, the drawing contexts (main, the additive light buffer, the
// shadow buffer), and the coordinate + lighting helpers. Objects read `e.ctx` as their target and
// call helpers like `e.X(node)`, `e.addLight(...)`. Shadows are not registered by objects: the
// compositor turns every castsShadow object into a caster and paints it (see render/shadows.js).
import { PALETTE } from '../style/palette.js';
import { lerp, smooth01 } from './math.js';
import * as L from '../render/lighting.js';

export class Frame {
  constructor() {
    this.W = this.H = 0; this.unit = 1; this.t = 0; this.dt = 0;
    this.world = this.light = this.shadow = this.main = null;  // the four 2d contexts (world, light buffer, shadow buffer, main)
    this.ctx = null;                              // active draw target (set per pass)
    this.scene = null;                            // active Scene
    this.lights = [];                             // light records, rebuilt each frame
  }

  // live, scene-derived values
  get gy() { return (this.scene.ground || 0.8) * this.H; }
  get keyLight() { return this.scene.keyLight || { x: 0.3, y: 0.3 }; }
  get flags() { return this.scene.flags; }
  get lineIdx() { return this.scene.lineIdx; }
  beat() { return Math.max(0, this.t - this.scene.lineStart); }
  sceneT() { return Math.max(0, this.t - this.scene.sceneStart); }

  // the world-space rectangle that exactly fills the screen at the current camera zoom. Full-screen
  // washes (sky, wet floor, lightning flash) fill THIS instead of [0,0,W,H] so the establishing
  // zoom-out (zoom < 1) never exposes black borders.
  coverRect() {
    const cam = this.scene.camera, z = cam.zoom || 1;
    if (z >= 1) return { x: 0, y: 0, w: this.W, h: this.H };
    const fx = cam.focal.x, fy = cam.focal.y;
    return { x: fx * (1 - 1 / z), y: fy * (1 - 1 / z), w: this.W / z, h: this.H / z };
  }

  // coordinate helpers (shared by the whole library)
  X(n) { return n.x * this.W + this.scene.camera.look * (n.par == null ? 0.5 : n.par); }
  scaleOf(n) { return this.unit * (n.scale || 1); }
  // a node with n.walk = [x per line] glides between marks across each line
  walkX(n) {
    if (!n.walk) return this.X(n);
    const w = n.walk, i = Math.min(this.lineIdx, w.length - 1), prev = i > 0 ? w[i - 1] : w[0];
    const nx = lerp(prev, w[i], smooth01(this.beat() / (n.walkDur || 3.4)));
    return nx * this.W + this.scene.camera.look * (n.par == null ? 0.5 : n.par);
  }

  // continuous footstep loop, only while an actor is actually moving (set by walking actors)
  walkSound(on) { this.scene.walkSound(on); }

  // lighting facade (delegates to the shared service so objects never roll their own).
  // Objects describe a light once with addLight({...}); the lighting pass draws halo + refl.
  addLight(rec) { L.addLight(this, rec); }
  dominantLight(x) { return L.dominantLight(this, x); }
  // the ambient tint at x. Pass the node to LOW-PASS it on the node over time, so a flickering neon
  // tints the form steadily instead of strobing the cloth frame to frame.
  litTint(x, node) {
    const t = L.litTint(this, x);
    if (!node) return t;
    if (!t) { node._tint = null; return null; }
    const p = node._tint;
    if (!p) return node._tint = t;
    const k = 0.03;
    return node._tint = [p[0] + (t[0] - p[0]) * k, p[1] + (t[1] - p[1]) * k, p[2] + (t[2] - p[2]) * k];
  }
  litColor(x, gr, gg, gb) { return L.litColor(this, x, gr, gg, gb); }
}

Frame.prototype.palette = PALETTE;
