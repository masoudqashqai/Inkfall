// ALLEY — two brick walls converging on a far slice of skyline, with a fire escape.
import { defineBackdrop } from '../../objects/registry.js';
import { PALETTE } from '../../style/palette.js';
import { buildSkyline, paintSkyline, wetFloor, brickWall, fireEscape, balcony } from './skyline-core.js';

defineBackdrop('alley', data => ({
  build(e) { return buildSkyline(e, data.backdrop.seed || 77123, [{ depth: 0.4, top: e.H * 0.3, shade: PALETTE.farInk, minW: 50, maxW: 110, minH: 0.3, maxH: 0.55, win: 0.18 }], e.H * 0.62); },
  draw(e) {
    const c = e.ctx, g = e.gy, look = e.scene.camera.look, vx = e.W * 0.5 + look * 0.3, vy = e.H * 0.4;
    const slice = c.createLinearGradient(vx, vy, vx, g); slice.addColorStop(0, '#23262e'); slice.addColorStop(1, '#0a0b0f'); c.fillStyle = slice; c.fillRect(vx - e.W * 0.12, vy, e.W * 0.24, g - vy);
    paintSkyline(e, this.geom, look * 0.4);
    brickWall(c, e, () => { c.moveTo(0, 0); c.lineTo(e.W * 0.4, 0); c.lineTo(vx - e.W * 0.1, vy); c.lineTo(vx - e.W * 0.1, g); c.lineTo(0, g); });
    brickWall(c, e, () => { c.moveTo(e.W, 0); c.lineTo(e.W * 0.6, 0); c.lineTo(vx + e.W * 0.1, vy); c.lineTo(vx + e.W * 0.1, g); c.lineTo(e.W, g); });
    fireEscape(c, e.W * 0.14, e.H * 0.16, e.H * 0.5, 64);
    balcony(c, e.W * 0.14 + 64, e.H * 0.40, e.W * 0.1);
    wetFloor(e);
  },
}));
