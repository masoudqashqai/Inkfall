// BACKDROP CORE — the procedural skyline shared by the skyline/alley/rooftop settings, the
// shared wet floor, and the alley's brick + fire-escape pieces. Geometry is built once per
// resize; painting applies the camera look as parallax.
import { PALETTE } from '../../style/palette.js';
import { rand32 } from '../../engine/math.js';

export function buildSkyline(e, seed, cfgList, groundY) {
  const rng = rand32(seed), layers = [];
  for (const cfg of cfgList) {
    const blds = []; let x = -140;
    while (x < e.W + 220) {
      const w = cfg.minW + rng() * (cfg.maxW - cfg.minW), h = (cfg.minH + rng() * (cfg.maxH - cfg.minH)) * (groundY - cfg.top), top = groundY - h, wins = [];
      const cols = Math.max(2, w / 16 | 0), rows = Math.max(3, h / 20 | 0);
      for (let r = 0; r < rows; r++) for (let ci = 0; ci < cols; ci++) { if (rng() > cfg.win) continue; wins.push({ x: x + 7 + ci * (w - 14) / cols, y: top + 10 + r * (h - 16) / rows, warm: rng() > 0.8 }); }
      const cap = rng() < 0.25 ? { type: rng() < 0.5 ? 'tank' : 'ant', x: x + w * (0.3 + rng() * 0.4) } : null;
      blds.push({ x, w, top, h, wins, cap }); x += w + 2 + rng() * 16;
    }
    layers.push({ ...cfg, blds });
  }
  return layers;
}

// Each layer's buildings + windows are static, so they are rendered once to an offscreen canvas
// (at device resolution) and cached on the layer. Per frame we just blit that canvas at the
// parallax offset, instead of re-running the building/window loops every frame.
const PAD = 200;   // horizontal margin so parallax + zoom-out never reveal the sprite's edge
function layerSprite(e, L) {
  if (L._sprite && L._spriteW === e.W && L._spriteDPR === e.DPR) return L._sprite;
  const DPR = e.DPR || 1, CW = e.W + PAD * 2, H = e.H;
  const cv = document.createElement('canvas'); cv.width = Math.floor(CW * DPR); cv.height = Math.floor(H * DPR);
  const c = cv.getContext('2d'); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.translate(PAD, 0);
  c.fillStyle = L.shade;
  for (const b of L.blds) { c.fillRect(b.x, b.top, b.w, b.h + 6); if (b.cap) { if (b.cap.type === 'tank') { c.fillRect(b.cap.x - 7, b.top - 14, 14, 14); c.fillRect(b.cap.x - 9, b.top - 2, 18, 3); } else c.fillRect(b.cap.x - 1, b.top - 22, 2, 22); } }
  for (const b of L.blds) for (const wn of b.wins) { c.fillStyle = wn.warm ? PALETTE.warmWin : PALETTE.coolWin; c.fillRect(wn.x, wn.y, 4, 5); }
  L._sprite = cv; L._spriteW = e.W; L._spriteDPR = e.DPR;
  return cv;
}

export function paintSkyline(e, layers, par) {
  const c = e.ctx, CW = e.W + PAD * 2;
  for (const L of layers) c.drawImage(layerSprite(e, L), par * L.depth - PAD, 0, CW, e.H);
}

// the shared dark wet floor (coloured light reflections are added later on the light buffer)
export function wetFloor(e) {
  const c = e.ctx, g = e.gy, R = e.coverRect(), bottom = R.y + R.h;
  const st = c.createLinearGradient(0, g, 0, e.H); st.addColorStop(0, '#0a0b0f'); st.addColorStop(1, PALETTE.ink);
  c.fillStyle = st; c.fillRect(R.x, g, R.w, bottom - g);   // overscan so the establishing zoom-out shows no border
  c.globalAlpha = 0.10; c.fillStyle = PALETTE.steel;
  for (let i = 0; i < 30; i++) { const rx = ((i * 137.5 + e.t * 6) % e.W); c.fillRect(rx, g + (i % 6) * (e.H - g) / 6, 2 + (i % 4), 2); }
  c.globalAlpha = 1;
}

export function brickWall(c, e, polyFn) {
  const g = e.gy;
  c.save(); c.beginPath(); polyFn(); c.closePath(); c.clip();
  const wall = c.createLinearGradient(0, 0, 0, g); wall.addColorStop(0, '#100a06'); wall.addColorStop(1, '#050302'); c.fillStyle = wall; c.fillRect(0, 0, e.W, g);   // dim alley at night: walls mostly in shadow
  const bh = 15, bw = 34; c.strokeStyle = 'rgba(4,2,1,0.5)'; c.lineWidth = 1.4;
  for (let yy = 0; yy < g; yy += bh) {
    c.beginPath(); c.moveTo(0, yy); c.lineTo(e.W, yy); c.stroke();
    const off = ((yy / bh) % 2) * bw / 2;
    c.beginPath(); for (let xx = off; xx < e.W; xx += bw) { c.moveTo(xx, yy); c.lineTo(xx, yy + bh); } c.stroke();
  }
  c.restore();
}

export function fireEscape(c, x, topY, h, w) {
  c.save(); c.strokeStyle = 'rgba(120,130,144,0.75)'; c.fillStyle = 'rgba(96,104,116,0.7)'; c.lineWidth = 2; const floors = h / 34 | 0;
  for (let i = 0; i < floors; i++) { const y = topY + i * 34; c.fillRect(x, y, w, 4); c.strokeRect(x, y - 14, w, 14); c.beginPath(); if (i % 2 === 0) { c.moveTo(x + 2, y + 4); c.lineTo(x + w - 6, y + 30); } else { c.moveTo(x + w - 2, y + 4); c.lineTo(x + 6, y + 30); } c.stroke(); }
  c.restore();
}

export function balcony(c, x, y, w) {
  c.save(); c.strokeStyle = 'rgba(120,130,144,0.75)'; c.fillStyle = 'rgba(96,104,116,0.7)'; c.lineWidth = 2;
  c.fillRect(x, y, w, 4);
  c.strokeRect(x, y - 22, w, 22);
  c.beginPath(); for (let i = 1; i < 7; i++) { const rx = x + i * w / 7; c.moveTo(rx, y - 22); c.lineTo(rx, y); } c.stroke();
  c.beginPath(); c.moveTo(x, y - 22); c.lineTo(x + w, y - 22); c.stroke();
  c.restore();
}
