// SKYLINE — the open city: parallax layers of windowed buildings over the wet street.
import { defineBackdrop } from '../../objects/registry.js';
import { buildSkyline, paintSkyline, windowGlow, wetFloor } from './skyline-core.js';

defineBackdrop('skyline', data => ({
  build(e) {
    const layers = data.backdrop.layers.map(l => ({ ...l, top: l.top * e.H }));
    return buildSkyline(e, data.backdrop.seed, layers, (data.ground || 0.8) * e.H);
  },
  draw(e) { paintSkyline(e, this.geom, e.scene.camera.look); wetFloor(e); },
  glow(e) { windowGlow(e, this.geom, e.scene.camera.look); },   // distant window bloom + bokeh + flicker (on the light buffer)
}));
