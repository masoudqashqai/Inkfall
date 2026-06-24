// EFFECT — atmosphere and consequence that is not a solid object: steam, fire embers, blood,
// blowing debris. May own particle state advanced in update(); never casts a ground shadow.
import { Node } from './node.js';

export class Effect extends Node {
  constructor(params) { super(params); this.kind = 'effect'; }
}
