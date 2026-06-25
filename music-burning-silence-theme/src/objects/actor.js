// ACTOR — a character that moves (humans, animals). For now motion is driven by scene timing
// (e.lineIdx / e.beat) plus per-actor params, read inside draw. This is the planned home for a
// real clip/timeline animation system later; the Node contract will not need to change.
import { Node } from './node.js';

export class Actor extends Node {
  constructor(params) { super(params); this.kind = 'actor'; this.castsShadow = true; }
}
