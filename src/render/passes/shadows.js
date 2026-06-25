// SHADOW PASS — paints the offscreen shadow buffer: every registered caster's silhouette,
// projected through the strongest lights onto the stage floor and the back wall. The compositor
// blits this buffer onto the world under the cast, so a figure stands on its own shadow.
import { drawShadowLayer } from '../shadows.js';

export function shadows(e) { drawShadowLayer(e); }
