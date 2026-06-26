// SCENE — one act. Owns its built content (backdrop, lights, objects) and its per-scene
// runtime (flags, current line, timing, weather, brass + ripples). The Manager drives the
// flow between scenes; the Scene just knows how to build, light, update, and draw itself.
import { create, createBackdrop } from '../objects/registry.js';
import { Shells } from '../library/effects/shells.js';
import { Ripples } from '../library/effects/ripples.js';
import { Audio2 } from '../assets/audio.js';
import { ANIM } from '../style/palette.js';

// the cast LAYER STACK, drawn through the lit-sprite + shadow pipeline in this order, each y-sorted
// within. 'mid' is the default cast; 'fore' draws in front of it (a foreground occluder). Behind the
// backdrop, the 'back' layer is drawn separately (directly, distant elements like a far beam).
const CAST_LAYERS = ['mid', 'fore'];

export class Scene {
  constructor(data, camera) {
    this.data = data; this.camera = camera;
    this.flags = {}; this.lineIdx = 0; this.sceneStart = 0; this.lineStart = 0;
    this.lightning = 0; this.nextBolt = 4; this._boltSeed = null;
    this.shells = new Shells(); this.ripples = new Ripples();
    this.backdrop = null; this.lightNodes = []; this.objects = [];
  }

  get title() { return this.data.title; }
  get ground() { return this.data.ground; }
  get keyLight() { return this.data.keyLight || { x: 0.3, y: 0.3 }; }
  get moon() { return this.data.moon; }
  get hideMoon() { return this.data.hideMoon != null ? this.data.hideMoon : !!(this.backdrop && this.backdrop.hideMoon); }
  get indoor() { return this.data.indoor != null ? this.data.indoor : !!(this.backdrop && this.backdrop.indoor); }

  buildContent() {
    const bd = this.data.backdrop;
    this.backdrop = bd ? createBackdrop(bd.type, this.data) : null;
    this.lightNodes = (this.data.lights || []).map(l => create(l.type, l)).filter(Boolean);
    this.objects = (this.data.cast || []).map(p => create(p.type, p)).filter(Boolean);
    // link attached children to their parent (a prop riding an actor): a node with attachTo: <id>
    // gets _parent set, and its transform then composes onto that parent (see Frame.place).
    const byId = {};
    for (const o of this.objects) if (o.id) byId[o.id] = o;
    for (const o of this.objects) if (o.attachTo && byId[o.attachTo]) o._parent = byId[o.attachTo];
  }
  // backdrop geometry depends on the viewport, so it is (re)built lazily once a frame exists
  ensureGeometry(e) { if (this.backdrop && this.backdrop.build && !this.backdrop.geom) this.backdrop.geom = this.backdrop.build(e); }
  invalidateGeometry() { if (this.backdrop) this.backdrop.geom = null; }

  onEnter(e) { this.flags = {}; this.lineIdx = 0; this.sceneStart = e.t; this.lineStart = e.t; this.shells.clear(); this.ripples.clear(); }

  visible(o) {
    if (o.onFlag && !this.flags[o.onFlag]) return false;
    if (o.hideOnFlag && this.flags[o.hideOnFlag]) return false;
    return true;
  }

  // raised surfaces (a table top) that props expose, gathered before lights + cast so the stage,
  // beam landings and object anchoring all resolve against them.
  collectSurfaces(e) {
    e.surfaces = [];
    for (const o of this.objects) if (this.visible(o) && o.surface) { const s = o.surface(e); if (s) e.surfaces.push(s); }
  }
  collectLights(e) {
    for (const L of this.lightNodes) if (L.emitLight) L.emitLight(e);
    for (const o of this.objects) if (this.visible(o) && o.emitLight) o.emitLight(e);
  }
  drawBackdrop(e) { if (this.backdrop && this.backdrop.draw) this.backdrop.draw(e); }
  drawFixtures(e) { for (const L of this.lightNodes) if (L.draw) L.draw(e); }
  // visible objects of a layer, sorted BACK TO FRONT by the FLOOR-CONTACT point (where the object
  // stands on the stage: gy plus its dy), not its drawn Y. On a side-on stage a higher drawn Y means
  // elevation (a chip resting on a table), not distance, so sorting by the contact point keeps an
  // elevated prop ordered with whatever it sits on instead of sinking behind it. `depth` is an
  // explicit bias in the same space to pin order. Equal keys keep authoring order (stable sort).
  // The transform step enriches this contact point with a real depth axis for moving objects.
  _sortY(e, o) { return e.place(o).groundY + (o.depth || 0); }
  _layer(e, layer) {
    return this.objects
      .filter(o => this.visible(o) && (o.layer || 'mid') === layer)
      .sort((a, b) => this._sortY(e, a) - this._sortY(e, b));
  }
  drawBack(e) { for (const o of this._layer(e, 'back')) o.draw(e); }   // distant elements, behind the backdrop
  // the cast across its ordered layers (mid, then fore in front), each y-sorted within. The
  // compositor walks this so it can paint each caster's shadow right before its object (so the
  // shadow lands on the cast already behind it), then draw the object, and a 'fore' object lands in
  // front of the whole 'mid' cast.
  castObjects(e) { return CAST_LAYERS.flatMap(name => this._layer(e, name)); }
  drawShells(e) { this.shells.draw(e); }
  drawLightExtras(e) { this.ripples.draw(e); }   // additive ripples onto the light buffer

  update(dt, e) {
    if (this.flags.muzzle > 0) this.flags.muzzle = Math.max(0, this.flags.muzzle - dt * 2.2);
    for (const o of this.objects) if (o.update) o.update(dt, e);
    this.shells.update(dt, e); this.ripples.update(dt, e);
    this._boltSeed = null;
    if (!this.indoor) {
      if (Math.random() < 0.85) this.ripples.spawn(e);
      this.nextBolt -= dt;
      if (this.nextBolt <= 0) { this.lightning = Math.max(this.lightning, 0.9); if (Math.random() < 0.7) this._boltSeed = (performance.now() | 0); this.nextBolt = ANIM.boltGap[0] + Math.random() * (ANIM.boltGap[1] - ANIM.boltGap[0]); }
      if (this.lightning > 0) this.lightning = Math.max(0, this.lightning - dt * 3);
    } else this.lightning = 0;
  }

  // two shots: each its own gunshot + a brass casing ejected from the gunman in the cast
  fireGun(e) {
    const g = this.objects.find(o => o.type === 'gunman');
    const shot = () => { Audio2.gun(); if (g) { const s = e.scaleOf(g), x = e.X(g) + 48 * s, y = e.gy - 84 * s; this.shells.spawn(x, y, s, e.gy + 6); } };
    shot(); setTimeout(shot, 230);
  }

  walkSound(on) { Audio2.setLoop('footstep', on); }
}
