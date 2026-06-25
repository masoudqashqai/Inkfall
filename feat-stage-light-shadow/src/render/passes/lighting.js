// LIGHTING PASS — paints the additive light buffer: every registered light's halo + wet-floor
// reflection, plus the scene's static neon reflections (the backdrop `reflect` data, which v1
// declared but never drew). The compositor then composites this buffer onto the scene.
import { drawLightLayer, streak } from '../lighting.js';
import { cssRgb } from '../../engine/math.js';

export function lighting(e) {
  // distant window bloom + bokeh + flicker (the backdrop paints it onto the light buffer)
  const bdo = e.scene.backdrop;
  if (bdo && bdo.glow) bdo.glow(e);
  // static off-screen neon reflections on the wet floor (skyline backdrop `reflect`)
  const bd = e.scene.data.backdrop, refl = bd && bd.reflect;
  if (refl) for (const r of refl) streak(e, r.x * e.W + e.scene.camera.look * 0.5, cssRgb(r.color), 0.42, 16, (e.H - e.gy) * 0.7);
  drawLightLayer(e);
}
