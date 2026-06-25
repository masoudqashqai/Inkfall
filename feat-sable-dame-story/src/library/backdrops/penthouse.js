// PENTHOUSE — a high-rise interior: a wall of rain-streaked glass over the night skyline, and a
// dark glossy marble floor. indoor:true keeps the engine's rain outside; the glass shows its own.
import { defineBackdrop } from '../../objects/registry.js';
import { buildSkyline, paintSkyline } from './skyline-core.js';

defineBackdrop('penthouse', data => ({
  indoor: true,
  build(e) {
    const layers = [
      { depth: 0.30, top: 0.34, shade: '#0c0e13', minW: 46, maxW: 104, minH: 0.20, maxH: 0.52, win: 0.16 },
      { depth: 0.60, top: 0.42, shade: '#070809', minW: 64, maxW: 140, minH: 0.16, maxH: 0.40, win: 0.12 },
    ].map(l => ({ ...l, top: l.top * e.H }));
    return buildSkyline(e, (data.backdrop && data.backdrop.seed) || 4040, layers, e.H * 0.66);
  },
  draw(e) {
    const c = e.ctx, g = e.gy, W = e.W, H = e.H, t = e.t, look = e.scene.camera.look;
    const winT = H * 0.05, winB = g - 6, winL = W * 0.05, winR = W * 0.95;
    // interior back wall
    const wall = c.createLinearGradient(0, 0, 0, g); wall.addColorStop(0, '#0a0c11'); wall.addColorStop(1, '#070809');
    c.fillStyle = wall; c.fillRect(0, 0, W, g);
    // ---- the window: the night city behind rain-streaked glass ----
    c.save();
    c.beginPath(); c.rect(winL, winT, winR - winL, winB - winT); c.clip();
    const sky = c.createLinearGradient(0, winT, 0, winB); sky.addColorStop(0, '#05070d'); sky.addColorStop(1, '#0c1018');
    c.fillStyle = sky; c.fillRect(winL, winT, winR - winL, winB - winT);
    const mg = c.createRadialGradient(W * 0.72, H * 0.2, 0, W * 0.72, H * 0.2, 130); mg.addColorStop(0, 'rgba(150,165,195,0.16)'); mg.addColorStop(1, 'rgba(150,165,195,0)'); c.fillStyle = mg; c.fillRect(winL, winT, winR - winL, winB - winT);
    paintSkyline(e, this.geom, look * 0.6);
    c.strokeStyle = 'rgba(170,185,210,0.16)'; c.lineWidth = 1.1; c.beginPath();
    for (let i = 0; i < 80; i++) { const x = (i * 53.3 + t * 40 * (0.6 + (i % 3) * 0.2)) % (winR - winL) + winL; const y = (i * 91.7 + t * 230) % (winB - winT) + winT; c.moveTo(x, y); c.lineTo(x - 4, y + 13); }
    c.stroke();
    c.fillStyle = 'rgba(180,195,220,0.10)';
    for (let i = 0; i < 24; i++) { const x = (i * 137.5) % (winR - winL) + winL, y = (i * 79.3 + t * 5 * (i % 2)) % (winB - winT) + winT; c.beginPath(); c.arc(x, y, 1.3, 0, Math.PI * 2); c.fill(); }
    c.restore();
    // window frame + mullions
    c.strokeStyle = '#04050a'; c.lineWidth = 8; c.strokeRect(winL, winT, winR - winL, winB - winT);
    c.lineWidth = 4; c.strokeStyle = '#06070c';
    for (let k = 1; k < 4; k++) { const mx = winL + (winR - winL) * k / 4; c.beginPath(); c.moveTo(mx, winT); c.lineTo(mx, winB); c.stroke(); }
    const myy = winT + (winB - winT) * 0.5; c.beginPath(); c.moveTo(winL, myy); c.lineTo(winR, myy); c.stroke();
    c.fillStyle = '#0c0e13'; c.fillRect(winL - 6, winB, winR - winL + 12, 8);   // sill
    // ---- glossy marble floor ----
    const fl = c.createLinearGradient(0, g, 0, H); fl.addColorStop(0, '#0c0e12'); fl.addColorStop(0.5, '#070809'); fl.addColorStop(1, '#040506');
    c.fillStyle = fl; c.fillRect(0, g, W, H - g);
    c.save(); c.globalAlpha = 0.10; c.globalCompositeOperation = 'lighter';
    const rg = c.createLinearGradient(0, g, 0, H); rg.addColorStop(0, 'rgba(150,170,205,0.5)'); rg.addColorStop(0.55, 'rgba(150,170,205,0)'); c.fillStyle = rg;
    c.fillRect(winL, g, winR - winL, (H - g) * 0.7); c.restore();
    c.strokeStyle = 'rgba(150,160,180,0.05)'; c.lineWidth = 1;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(0, g + (H - g) * (i + 0.5) / 5); c.lineTo(W, g + (H - g) * (i + 0.2) / 5); c.stroke(); }
    c.fillStyle = '#0c0e13'; c.fillRect(0, g - 5, W, 5);   // baseboard
  },
}));
