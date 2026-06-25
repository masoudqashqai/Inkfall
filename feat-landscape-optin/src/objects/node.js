// NODE — the base for everything placed in a scene. Holds a normalized transform and the
// optional lifecycle hooks (update, draw, emitLight, shadowSil). Specializations (Actor, Mover,
// Prop, Effect, Light) stay thin on purpose; the design is built to grow (e.g. an Actor clip
// system) without changing this contract. `e` passed to hooks is the per-frame Frame facade.
export class Node {
  constructor(params = {}) {
    this.x = 0.5; this.par = 0.5; this.scale = 1; this.depth = 0;
    this.layer = 'mid';                   // 'back' = behind the backdrop (distant), 'mid' = with the cast
    this.shadowW = null; this.shadowH = null;   // silhouette half-width + height in LOCAL px (pre-scale); null = sensible default
    this.shadowDensity = 1;               // shadow opacity multiplier (lighter for glass/translucent shapes)
    Object.assign(this, params);          // story params (x, y, scale, par, dy, flip, seed, shadowW, ...)
    this.kind = 'node';
    this.castsShadow = false;             // when true the scene registers this as a shadow caster
    this.shadowSil = null;                // optional sil(e, c): draw the solid shape in local feet-origin coords
  }
  update(dt, e) {}     // advance simulation/animation state
  emitLight(e) {}      // register lights via e.addLight({...})
  draw(e) {}           // paint to e.ctx (the world target)
}
