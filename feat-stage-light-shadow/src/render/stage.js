// STAGE — the shared pseudo 3D geometry that BOTH the lighting service and the shadow service
// read. The scene is treated as a shallow stage box: a FLOOR plane (from the ground line gy down
// to the bottom of the screen, nearest the camera) and an optional back WALL plane (from a top
// line down to gy) when the backdrop declares one (the alley brick, the room wall). A light's
// HEIGHT is gy minus its screen y. Keeping this in one place means improving the geometry improves
// light and shadow together, and neither service owns the surfaces.
import { AMBIENT } from '../style/shadows.js';

// build the per-frame stage description from the active scene.
export function stageOf(e) {
  const gy = e.gy, H = e.H, s = e.scene, bd = s.backdrop, d = s.data;
  // a near wall exists only where the set has one: scene data wins, else the backdrop declares it.
  let wt = d.wallTop != null ? d.wallTop : (bd && bd.wallTop != null ? bd.wallTop : null);
  const wall = wt != null ? { top: wt <= 1 ? wt * H : wt, bottom: gy } : null;
  const a = d.ambient || {};
  return {
    gy, H, wall,
    floor: { top: gy, bottom: H },
    ambient: { level: a.level != null ? a.level : AMBIENT.level, col: a.col || AMBIENT.col },
  };
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
