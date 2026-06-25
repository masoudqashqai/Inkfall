// ROOFTOP — above the city: distant skyline, washing lines, a low parapet.
import { defineBackdrop } from '../../objects/registry.js';
import { PALETTE } from '../../style/palette.js';
import { buildSkyline, paintSkyline, windowGlow } from './skyline-core.js';

defineBackdrop('rooftop', data => ({
  build(e) { return buildSkyline(e, data.backdrop.seed || 55512, [{ depth: 0.3, top: e.H * 0.4, shade: PALETTE.farInk, minW: 40, maxW: 100, minH: 0.2, maxH: 0.45, win: 0.22 }, { depth: 0.6, top: e.H * 0.46, shade: '#06070b', minW: 60, maxW: 140, minH: 0.16, maxH: 0.38, win: 0.18 }], e.H * 0.72); },
  glow(e) { windowGlow(e, this.geom, e.scene.camera.look * 0.5); },   // distant window bloom + bokeh + flicker
  draw(e) {
    const c = e.ctx, g = e.gy, par = e.scene.camera.look;
    const glow = c.createLinearGradient(0, e.H * 0.5, 0, e.H * 0.74); glow.addColorStop(0, 'rgba(40,46,60,0)'); glow.addColorStop(1, 'rgba(70,80,105,0.35)'); c.fillStyle = glow; c.fillRect(0, e.H * 0.5, e.W, e.H * 0.24);
    paintSkyline(e, this.geom, par * 0.5);
    c.strokeStyle = '#000'; c.lineWidth = 2; c.fillRect(e.W * 0.05, e.H * 0.18, 4, e.H * 0.2); c.fillRect(e.W * 0.92, e.H * 0.12, 4, e.H * 0.26);
    c.beginPath(); c.moveTo(e.W * 0.05, e.H * 0.22); c.quadraticCurveTo(e.W * 0.5, e.H * 0.3, e.W * 0.93, e.H * 0.16); c.stroke();
    c.beginPath(); c.moveTo(e.W * 0.05, e.H * 0.27); c.quadraticCurveTo(e.W * 0.5, e.H * 0.36, e.W * 0.93, e.H * 0.22); c.stroke();
    c.fillStyle = PALETTE.ink; c.fillRect(0, g, e.W, e.H - g); c.fillStyle = '#08090c'; c.fillRect(0, g - 10, e.W, 12);
  },
}));
