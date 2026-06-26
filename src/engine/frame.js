// FRAME — the per-frame facade handed to passes and to every object's draw/update/emitLight.
// It bundles the live timing + sizes, the drawing contexts (main, the additive light buffer, the
// shadow buffer), and the coordinate + lighting helpers. Objects read `e.ctx` as their target and
// call helpers like `e.X(node)`, `e.addLight(...)`. Shadows are not registered by objects: the
// compositor turns every castsShadow object into a caster and paints it (see render/shadows.js).
import { PALETTE } from '../style/palette.js';
import { MAT } from '../style/materials.js';
import { lerp, smooth01 } from './math.js';
import { sampleTrack } from './anim.js';
import * as L from '../render/lighting.js';

// the scene validator's one voice: warn once per missing surface id, so an `on:'x'` that resolves to
// nothing is reported (and safely falls back to the floor) instead of silently rendering wrong.
const _warned = new Set();
function warnSurface(id) { if (_warned.has(id)) return; _warned.add(id); console.warn(`Inkfall: object on:'${id}' found no such surface, anchored to the floor instead.`); }

export class Frame {
  constructor() {
    this.W = this.H = 0; this.unit = 1; this.t = 0; this.dt = 0; this.DPR = 1; this.ls = 1;
    this.world = this.light = this.shadow = this.main = null;  // the 2d contexts (world, light buffer, shadow buffer, main)
    this.lit = this.mask = null;                  // the per-object albedo layer + its alpha mask (the lit-sprite pass)
    this.ctx = null;                              // active draw target (set per pass)
    this.scene = null;                            // active Scene
    this.lights = [];                             // light records, rebuilt each frame
    this.surfaces = [];                           // raised surfaces (table tops) props expose, rebuilt each frame
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

  // sample a named keyframe track on a node at its timebase (seconds since the scene, or since the
  // line if timebase:'beat'). Returns null when the node has no such track, so the helpers below fall
  // back to its static value. This is how data-authored tweens drive position and scale.
  _trk(n, name) {
    if (!n.tracks || !n.tracks[name]) return null;
    return sampleTrack(n.tracks[name], n.timebase === 'beat' ? this.beat() : this.sceneT());
  }
  // coordinate helpers (shared by the whole library). Each honours a track of the same name if the
  // node carries one (tracks.x, tracks.scale, tracks.y), so animating an object is pure data and
  // every system that reads these (draw, place, shadows, depth sort, bounds) follows for free.
  X(n) { const tx = this._trk(n, 'x'); return (tx != null ? tx : n.x) * this.W + this.scene.camera.look * (n.par == null ? 0.5 : n.par); }
  // scale honours a track, then shrinks with depth (a node's z, 0 near .. 1 far), so a far figure
  // reads smaller as well as hazier (atmospheric perspective). z is the one depth knob a story sets.
  scaleOf(n) { const ts = this._trk(n, 'scale'); const z = n.z || 0; return this.unit * (ts != null ? ts : (n.scale || 1)) * (1 - z * MAT.depthScale); }
  // the y a node sits at: an explicit `y` (free placement), else the surface it is anchored to with
  // `on` (a table top), else the floor. Resolving every placement through one surface-aware function
  // is what stops objects floating: with no real surface to land on, it falls back to the floor, and
  // an unresolved `on` is flagged so the authoring mistake is caught, not silently rendered wrong.
  baseY(n) {
    const dy = (n.dy || 0) * this.unit;
    const ty = this._trk(n, 'y');
    if (ty != null) return ty * this.H + dy;
    if (n.y != null) return n.y * this.H + dy;
    if (n.on) {
      const x = this.X(n);
      for (const s of this.surfaces) if (s.id === n.on && x >= s.x0 && x <= s.x1) return s.y + dy;
      warnSurface(n.on);
    }
    return this.gy + dy;
  }
  // the resolved transform for a node THIS frame: the single source the renderer (lit-sprite bounds),
  // the shadow service, the depth sort and anchoring all read, so they agree with what the node
  // draws. anchorY is where the body is painted (its y / on-surface / floor), groundY is the floor
  // contact point used for the cast shadow and the depth sort, s is the scale and flip the facing. A
  // node with a parent (_parent, linked from attachTo) rides the parent's transform with an ax/ay
  // offset in the parent's scaled space, so a prop can sit in an actor's hand and move with it.
  place(n) {
    if (n._parent) {
      const p = this.place(n._parent);
      return { x: p.x + (n.ax || 0) * p.s, anchorY: p.anchorY + (n.ay || 0) * p.s, groundY: p.groundY, s: p.s * (n.scale || 1), flip: n.flip != null ? !!n.flip : p.flip };
    }
    const base = { x: this.walkX(n), anchorY: this.baseY(n), groundY: this.gy + (n.dy || 0) * this.unit, s: this.scaleOf(n), flip: !!n.flip };
    // a self-animating object (a paper blowing across, a crow lifting off) declares its animated
    // position here, so the renderer scopes its lit layer to where it actually draws instead of its
    // resting x. This is what lets a moving object be lit without clipping (no unlit workaround).
    if (n.xform) Object.assign(base, n.xform(this));
    return base;
  }
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
  // the blended colour of the lights reaching x (used by the wet-floor ripples), else the fallback.
  litColor(x, gr, gg, gb) { return L.litColor(this, x, gr, gg, gb); }
}

Frame.prototype.palette = PALETTE;
