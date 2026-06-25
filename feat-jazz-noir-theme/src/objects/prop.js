// PROP — a static set piece (tables, ladders, hydrants, signs). Still lit and may cast a
// shadow; some props also emit light (barrel fire, traffic light) via emitLight.
import { Node } from './node.js';

export class Prop extends Node {
  constructor(params) { super(params); this.kind = 'prop'; }
}
