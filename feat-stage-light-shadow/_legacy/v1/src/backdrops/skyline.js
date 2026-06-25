// ---- SKYLINE — the open city: parallax layers of windowed buildings over the wet street ----
import { Noir } from '../core/engine.js';
import { buildSkyline, paintSkyline } from './helpers.js';

Noir.registerBackdrop('skyline', {
  build(e, sc) { const layers = sc.backdrop.layers.map(l => ({ ...l, top: l.top * e.H })); return buildSkyline(e, sc.backdrop.seed, layers, (sc.ground || 0.8) * e.H); },
  draw(e, sc) { paintSkyline(e, sc._bd, e.parallax); e.wetFloor(sc.backdrop.reflect); },
});
