// LIGHT — a declared light source (lamp, neon, bulb, glow). Its emitLight registers the light
// record (consumed by the lighting pass for halo + reflection, and by rim/shadow); its draw
// paints the visible fixture (the post, the sign) to the world.
import { Node } from './node.js';

export class Light extends Node {
  constructor(params) { super(params); this.kind = 'light'; }
}
