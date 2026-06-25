// MOVER — a kinematic object (cars, trains). May carry a `walk` path (story-driven glide) or a
// velocity. Kept simple now; a path/physics follower can be added here later.
import { Node } from './node.js';

export class Mover extends Node {
  constructor(params) { super(params); this.kind = 'mover'; this.castsShadow = true; }
}
