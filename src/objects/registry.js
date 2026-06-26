// REGISTRY — name → factory for every library object. A story names a `type`; the scene asks
// the registry to build the right Node subclass with the story params and the library's draw /
// update / emitLight hooks attached. Add a type once; every story can then place it.
import { Node } from './node.js';
import { Actor } from './actor.js';
import { Mover } from './mover.js';
import { Prop } from './prop.js';
import { Effect } from './effect.js';
import { Light } from './light.js';

const BASES = { node: Node, actor: Actor, mover: Mover, prop: Prop, effect: Effect, light: Light };
const registry = new Map();

// methods: { draw, update?, emitLight?, shadowSil?, castsShadow?, shadowW?, shadowH?, shadowDensity?, depth?, spec? } as plain functions (use `this`)
export function define(name, kind, methods = {}) { registry.set(name, { kind, methods }); }
export const defineActor = (name, draw, m = {}) => define(name, 'actor', { draw, ...m });
export const defineMover = (name, draw, m = {}) => define(name, 'mover', { draw, ...m });
export const defineProp = (name, draw, m = {}) => define(name, 'prop', { draw, ...m });
export const defineEffect = (name, draw, m = {}) => define(name, 'effect', { draw, ...m });
export const defineLight = (name, m) => define(name, 'light', m);

export function has(name) { return registry.has(name); }

// Backdrops are not Nodes: each is a factory(data) → { indoor?, build(e)→geom, draw(e) }.
const backdrops = new Map();
export function defineBackdrop(name, factory) { backdrops.set(name, factory); }
export function createBackdrop(name, data) { const f = backdrops.get(name); if (!f) { console.warn('Inkfall: unknown backdrop', name); return null; } return f(data); }

export function create(name, params = {}) {
  const spec = registry.get(name);
  if (!spec) { console.warn('Inkfall: unknown object type', name); return null; }
  const Base = BASES[spec.kind] || Node;
  const obj = new Base(params);
  const m = spec.methods;
  if (m.draw) obj.draw = m.draw;
  if (m.glow) obj.glow = m.glow;          // optional emissive pass, painted unlit OVER the lit object
  if (m.unlit != null) obj.unlit = m.unlit;   // skip whole-object lighting (additive effects: steam)
  if (m.surface) obj.surface = m.surface;     // exposes a raised surface (a table top) others can sit/land on
  if (m.xform) obj.xform = m.xform;           // declares an animated transform (a moving object's position), read by Frame.place
  if (m.tracks && obj.tracks == null) obj.tracks = m.tracks;   // default keyframe tracks (a story can still override per placement)
  if (m.update) obj.update = m.update;
  if (m.emitLight) obj.emitLight = m.emitLight;
  if (m.shadowSil) obj.shadowSil = m.shadowSil;
  if (m.castsShadow != null) obj.castsShadow = m.castsShadow;
  if (m.shadowW != null && params.shadowW == null) obj.shadowW = m.shadowW;
  if (m.shadowH != null && params.shadowH == null) obj.shadowH = m.shadowH;
  if (m.shadowDensity != null && params.shadowDensity == null) obj.shadowDensity = m.shadowDensity;
  if (m.depth != null && params.depth == null) obj.depth = m.depth;
  if (m.spec != null && params.spec == null) obj.spec = m.spec;   // material specular response (a shiny object), read by the lit pass
  if (m.layer != null && params.layer == null) obj.layer = m.layer;
  return obj;
}
