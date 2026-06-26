// STAGE — the one explicit SURFACE model that the whole engine reads. A scene is a shallow stage
// box made of surfaces, and light, shadow, washes and placement all resolve against THESE, never
// against an assumption. That is what stops "an effect landed where there is no surface":
//   floor   — the ground plane at gy, full width, every scene has it.
//   walls   — vertical back planes as SEGMENTS { x0, x1, top, bottom }. A room has one full-width
//             segment, the alley has two (a gap of sky between them), open sets have none. Authored
//             by the backdrop via walls(e), or derived from a legacy wallTop (one full-width segment).
//   raised  — horizontal surfaces above the floor { id, x0, x1, y } (a table top), contributed by
//             props via surface(e) and gathered onto e.surfaces each frame.
// Keeping this in one place means improving the geometry improves every system at once, and no
// subsystem or asset gets to invent a surface of its own.
import { AMBIENT, ENV } from '../style/shadows.js';

// the wall segments for the active scene: the backdrop's authored segments, else a single full-width
// segment from a legacy wallTop, else none (an open set).
function wallsOf(e, gy, H) {
  const s = e.scene, bd = s.backdrop, d = s.data;
  if (bd && bd.walls) return bd.walls(e) || [];
  let wt = d.wallTop != null ? d.wallTop : (bd && bd.wallTop != null ? bd.wallTop : null);
  if (wt == null) return [];
  const top = wt <= 1 ? wt * H : wt;
  return [{ x0: -1e6, x1: 1e6, top, bottom: gy }];
}

// build the per-frame stage description from the active scene.
export function stageOf(e) {
  const gy = e.gy, H = e.H, s = e.scene, d = s.data;
  const env = ENV[s.indoor ? 'indoor' : 'outdoor'], a = d.ambient || {};
  return {
    gy, H, indoor: s.indoor, env,
    floor: { y: gy },
    walls: wallsOf(e, gy, H),
    raised: e.surfaces || [],
    ambient: { level: a.level != null ? a.level : env.ambient, col: a.col || AMBIENT.col },
  };
}

// the y of the SURFACE directly under world x: the topmost raised surface that spans x, else the
// floor. This is the single answer to "where does something at x land", used for beam pools and for
// resolving an object's ground, so a landing or a figure can never sit in empty space.
export function surfaceYAt(stage, x) {
  let y = stage.gy;
  for (const s of stage.raised) if (x >= s.x0 && x <= s.x1 && s.y < y) y = s.y;
  return y;
}

// the height of a light above the floor (clamped so a light at/under the floor still projects).
export function lightHeight(stage, ly) { return Math.max(20, stage.gy - ly); }

// the throw of a caster's shadow from one light: direction away from the light and a 0..1 measure
// of how LOW the light sits relative to the caster's head (0 = at/above the head, 1 = on the floor).
// Low lights lengthen the floor shadow and lift it onto the wall, high lights keep it short. Both
// the floor and the wall stamp read this, so the two stay consistent.
export function shadowThrow(stage, lx, ly, bx, headY) {
  const dir = bx >= lx ? 1 : -1;
  const lh = lightHeight(stage, ly);
  const low = Math.max(0, Math.min(1, (ly - headY) / Math.max(1, stage.gy - headY)));
  return { dir, lh, low };
}
