// ---- ALLEY — two brick walls converging on a far slice of skyline, with a fire escape ----
import { Noir } from '../core/engine.js';
import { PALETTE } from '../core/palette.js';
import { buildSkyline, paintSkyline } from './helpers.js';

Noir.registerBackdrop('alley', {
  build(e, sc) { return buildSkyline(e, sc.backdrop.seed || 77123, [{ depth: 0.4, top: e.H * 0.3, shade: PALETTE.farInk, minW: 50, maxW: 110, minH: 0.3, maxH: 0.55, win: 0.18 }], e.H * 0.62); },
  draw(e, sc) {
    const c = e.ctx, g = e.gy, vx = e.W * 0.5 + e.parallax * 0.3, vy = e.H * 0.4;
    const slice = c.createLinearGradient(vx, vy, vx, g); slice.addColorStop(0, '#23262e'); slice.addColorStop(1, '#0a0b0f'); c.fillStyle = slice; c.fillRect(vx - e.W * 0.12, vy, e.W * 0.24, g - vy);
    paintSkyline(e, sc._bd, e.parallax * 0.4);
    // the two side walls are dark brown brick (the neon's halo lights the bricks around it)
    brickWall(c, e, () => { c.moveTo(0, 0); c.lineTo(e.W * 0.4, 0); c.lineTo(vx - e.W * 0.1, vy); c.lineTo(vx - e.W * 0.1, g); c.lineTo(0, g); });
    brickWall(c, e, () => { c.moveTo(e.W, 0); c.lineTo(e.W * 0.6, 0); c.lineTo(vx + e.W * 0.1, vy); c.lineTo(vx + e.W * 0.1, g); c.lineTo(e.W, g); });
    fireEscape(c, e.W * 0.14, e.H * 0.16, e.H * 0.5, 64);   // left ladder only (the right wall carries the EAT neon arrow + dumpster is an actor)
    balcony(c, e.W * 0.14 + 64, e.H * 0.40, e.W * 0.1);     // a small balcony alongside the ladder
    e.wetFloor(null);
  },
});

function brickWall(c, e, polyFn) {
  const g = e.gy;
  c.save(); c.beginPath(); polyFn(); c.closePath(); c.clip();
  const wall = c.createLinearGradient(0, 0, 0, g); wall.addColorStop(0, '#2a1d13'); wall.addColorStop(1, '#180f08'); c.fillStyle = wall; c.fillRect(0, 0, e.W, g);
  const bh = 15, bw = 34; c.strokeStyle = 'rgba(8,5,3,0.6)'; c.lineWidth = 1.4;
  for (let yy = 0; yy < g; yy += bh) {
    c.beginPath(); c.moveTo(0, yy); c.lineTo(e.W, yy); c.stroke();
    const off = ((yy / bh) % 2) * bw / 2;
    c.beginPath(); for (let xx = off; xx < e.W; xx += bw) { c.moveTo(xx, yy); c.lineTo(xx, yy + bh); } c.stroke();
  }
  c.restore();
}
function fireEscape(c, x, topY, h, w) {
  c.save(); c.strokeStyle = 'rgba(120,130,144,0.75)'; c.fillStyle = 'rgba(96,104,116,0.7)'; c.lineWidth = 2; const floors = h / 34 | 0;   // dark silver, catches a little light
  for (let i = 0; i < floors; i++) { const y = topY + i * 34; c.fillRect(x, y, w, 4); c.strokeRect(x, y - 14, w, 14); c.beginPath(); if (i % 2 === 0) { c.moveTo(x + 2, y + 4); c.lineTo(x + w - 6, y + 30); } else { c.moveTo(x + w - 2, y + 4); c.lineTo(x + 6, y + 30); } c.stroke(); }
  c.restore();
}
function balcony(c, x, y, w) {
  c.save(); c.strokeStyle = 'rgba(120,130,144,0.75)'; c.fillStyle = 'rgba(96,104,116,0.7)'; c.lineWidth = 2;
  c.fillRect(x, y, w, 4);                                   // platform
  c.strokeRect(x, y - 22, w, 22);                           // railing frame
  c.beginPath(); for (let i = 1; i < 7; i++) { const rx = x + i * w / 7; c.moveTo(rx, y - 22); c.lineTo(rx, y); } c.stroke();   // balusters
  c.beginPath(); c.moveTo(x, y - 22); c.lineTo(x + w, y - 22); c.stroke();   // top rail
  c.restore();
}
