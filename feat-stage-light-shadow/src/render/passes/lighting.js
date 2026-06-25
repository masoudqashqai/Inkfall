// LIGHTING PASS — paints the additive light buffer in two phases so depth reads correctly:
//   lightingBack runs before the cast (distant window bloom, static neon reflections, surface
//   washes, wet-floor reflections, ripples, and the halo of every scene light), so a foreground
//   figure occludes the light behind it.
//   lightingFront runs after the cast (only lights flagged `front`, e.g. a cigarette ember), so
//   that glow reads over the figure.
import { drawBackLight, drawFrontLight, streak } from '../lighting.js';
import { cssRgb } from '../../engine/math.js';

export function lightingBack(e) {
  // distant window bloom + flicker (the backdrop paints it onto the light buffer)
  const bdo = e.scene.backdrop;
  if (bdo && bdo.glow) bdo.glow(e);
  // static off-screen neon reflections on the wet floor (skyline backdrop `reflect`)
  const bd = e.scene.data.backdrop, refl = bd && bd.reflect;
  if (refl) for (const r of refl) streak(e, r.x * e.W + e.scene.camera.look * 0.5, cssRgb(r.color), 0.42, 16, (e.H - e.gy) * 0.7);
  drawBackLight(e);
  e.scene.drawLightExtras(e);   // ripples (on the wet floor, behind the cast)
}

export function lightingFront(e) { drawFrontLight(e); }
