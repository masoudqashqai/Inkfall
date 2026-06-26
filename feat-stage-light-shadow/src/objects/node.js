// NODE — the base for everything placed in a scene. Holds a normalized transform and the
// optional lifecycle hooks (update, draw, emitLight, shadowSil). Specializations (Actor, Mover,
// Prop, Effect, Light) stay thin on purpose; the design is built to grow (e.g. an Actor clip
// system) without changing this contract. `e` passed to hooks is the per-frame Frame facade.
export class Node {
  constructor(params = {}) {
    this.x = 0.5; this.par = 0.5; this.scale = 1; this.depth = 0;
    this.layer = 'mid';                   // 'back' = behind the backdrop (distant), 'mid' = the cast, 'fore' = in front of the cast
    this.shadowW = null; this.shadowH = null;   // silhouette half-width + height in LOCAL px (pre-scale); null = sensible default
    this.shadowDensity = 1;               // shadow opacity multiplier (lighter for glass/translucent shapes)
    Object.assign(this, params);          // story params (x, y, scale, par, dy, flip, seed, shadowW, ...)
    this.kind = 'node';
    this.castsShadow = false;             // when true the scene registers this as a shadow caster
    this.shadowSil = null;                // optional sil(e, c): draw the solid shape in local feet-origin coords
    this.glow = null;                     // optional glow(e): emissive accents drawn unlit OVER the lit object
    this.unlit = false;                   // skip whole-object lighting (additive effects draw straight to main)
    this.on = this.on || null;            // anchor to a named surface (e.g. 'table'); null = the floor
    this.surface = null;                  // optional surface(e): expose a raised surface others can sit/land on
    this.id = this.id || null;            // optional id, so another node can attach to this one
    this.attachTo = this.attachTo || null;   // ride this id's transform (a prop in an actor's hand); ax/ay = offset in its scaled space
    this._parent = null;                  // resolved by the scene from attachTo (see Scene.buildContent + Frame.place)
  }
  update(dt, e) {}     // advance simulation/animation state
  emitLight(e) {}      // register lights via e.addLight({...})
  draw(e) {}           // paint FLAT ALBEDO to e.ctx (the compositor lights the whole object)
}
