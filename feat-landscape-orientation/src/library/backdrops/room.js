// ROOM — an interior: back wall + floor + a door ajar leaking warm light. indoor:true means
// rain and lightning do not fall here.
import { defineBackdrop } from '../../objects/registry.js';
import { PALETTE } from '../../style/palette.js';

defineBackdrop('room', data => ({
  indoor: true,
  draw(e) {
    const c = e.ctx, g = e.gy, b = data.backdrop || {}, ox = e.scene.camera.look * 0.3;
    const wall = c.createLinearGradient(0, 0, 0, g); wall.addColorStop(0, b.wallTop || '#0a0c11'); wall.addColorStop(1, b.wall || '#06070b');
    c.fillStyle = wall; c.fillRect(0, 0, e.W, g);
    c.strokeStyle = 'rgba(255,255,255,0.03)'; c.lineWidth = 1;
    for (let x = 0; x < e.W + 60; x += 60) { c.beginPath(); c.moveTo(x + ox, 0); c.lineTo(x + ox, g); c.stroke(); }
    if (b.door != null) {
      const dx = b.door * e.W + ox, dw = 64 * (e.unit / 1.2), dh = g * 0.40, dtop = g - dh, gap = 11 * (e.unit / 1.2);
      c.fillStyle = '#0a0c10'; c.fillRect(dx - dw / 2 - 5, dtop - 5, dw + 10, dh + 5);
      const lg = c.createLinearGradient(dx + dw / 2 - gap, 0, dx + dw / 2, 0);
      lg.addColorStop(0, 'rgba(255,234,190,0)'); lg.addColorStop(1, 'rgba(255,234,190,0.55)');
      c.fillStyle = lg; c.fillRect(dx + dw / 2 - gap, dtop, gap, dh);
      c.fillStyle = '#101319'; c.fillRect(dx - dw / 2, dtop, dw - gap, dh);
      c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1;
      c.strokeRect(dx - dw / 2 + 6, dtop + 8, dw - gap - 12, dh * 0.4);
      c.strokeRect(dx - dw / 2 + 6, dtop + dh * 0.52, dw - gap - 12, dh * 0.4);
      c.fillStyle = '#8a8f98'; c.beginPath(); c.arc(dx + dw / 2 - gap - 6, dtop + dh * 0.55, 2.4, 0, Math.PI * 2); c.fill();
      const sp = c.createLinearGradient(dx, g, dx, g + 46); sp.addColorStop(0, 'rgba(255,234,190,0.13)'); sp.addColorStop(1, 'rgba(255,234,190,0)');
      c.fillStyle = sp; c.beginPath(); c.moveTo(dx + dw / 2 - gap, g); c.lineTo(dx + dw / 2 + 26, g + 52); c.lineTo(dx - 8, g + 52); c.closePath(); c.fill();
      c.strokeStyle = '#05060a'; c.lineWidth = 4; c.strokeRect(dx - dw / 2, dtop, dw, dh);
    }
    const fl = c.createLinearGradient(0, g, 0, e.H); fl.addColorStop(0, '#080a0e'); fl.addColorStop(1, PALETTE.ink);
    c.fillStyle = fl; c.fillRect(0, g, e.W, e.H - g);
    c.fillStyle = '#0c0e13'; c.fillRect(0, g - 6, e.W, 6);
    c.globalAlpha = 0.06; c.fillStyle = PALETTE.steel;
    for (let i = 0; i < 16; i++) { const rx = (i * 97 + e.t * 4) % e.W; c.fillRect(rx, g + (i % 5) * (e.H - g) / 5, 30, 1); }
    c.globalAlpha = 1;
  },
}));
