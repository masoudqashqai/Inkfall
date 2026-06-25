// NODE — the base for everything placed in a scene. Holds a normalized transform and the
// optional lifecycle hooks (update, draw, emitLight). Specializations (Actor, Mover, Prop,
// Effect, Light) stay thin on purpose; the design is built to grow (e.g. an Actor clip system)
// without changing this contract. `e` passed to hooks is the per-frame Frame facade.
export class Node {
  constructor(params = {}) {
    this.x = 0.5; this.par = 0.5; this.scale = 1; this.depth = 0;
    this.layer = 'mid';                   // 'back' = behind the backdrop (distant), 'mid' = with the cast
    Object.assign(this, params);          // story params (x, y, scale, par, dy, flip, seed, ...)
    this.kind = 'node';
    this.castsShadow = false;
  }
  update(dt, e) {}     // advance simulation/animation state
  emitLight(e) {}      // register lights via e.addLight({...})
  draw(e) {}           // paint to e.ctx (the world target)
}
