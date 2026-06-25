// =====================================================================================
//  BACKDROP HELPERS — the procedural city skyline shared by the skyline, alley and rooftop
//  settings. build() precomputes building geometry on resize; paint() draws it with parallax.
// =====================================================================================
import { PALETTE } from '../core/palette.js';
import { rand32 } from '../core/math.js';

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

export function paintSkyline(e, layers, par) {
  const c = e.ctx;
  for (const L of layers) {
    const ox = par * L.depth; c.fillStyle = L.shade;
    for (const b of L.blds) { c.fillRect(b.x + ox, b.top, b.w, b.h + 6); if (b.cap) { if (b.cap.type === 'tank') { c.fillRect(b.cap.x + ox - 7, b.top - 14, 14, 14); c.fillRect(b.cap.x + ox - 9, b.top - 2, 18, 3); } else c.fillRect(b.cap.x + ox - 1, b.top - 22, 2, 22); } }
    for (const b of L.blds) for (const wn of b.wins) { c.fillStyle = wn.warm ? PALETTE.warmWin : PALETTE.coolWin; c.fillRect(wn.x + ox, wn.y, 4, 5); }
  }
}
