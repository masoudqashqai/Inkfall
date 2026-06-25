// BACKDROP CORE — the procedural skyline shared by the skyline/alley/rooftop settings, the
// shared wet floor, and the alley's brick + fire-escape pieces. Geometry is built once per
// resize; painting applies the camera look as parallax.
import { PALETTE } from '../../style/palette.js';
import { rand32 } from '../../engine/math.js';

// a stable 0..1 pseudo-random from a position, used for per-window flicker phase + bokeh size so a
// window's behaviour is deterministic WITHOUT consuming the layout rng (which would shift the seed
// and move every building). Keeps existing skylines identical.
function hash2(x, y) { const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return h - Math.floor(h); }

export function buildSkyline(e, seed, cfgList, groundY) {
  const rng = rand32(seed), layers = [];
  for (const cfg of cfgList) {
    const blds = []; let x = -140;
    while (x < e.W + 220) {
      const w = cfg.minW + rng() * (cfg.maxW - cfg.minW), h = (cfg.minH + rng() * (cfg.maxH - cfg.minH)) * (groundY - cfg.top), top = groundY - h, wins = [];
      const cols = Math.max(2, w / 16 | 0), rows = Math.max(3, h / 20 | 0);
      for (let r = 0; r < rows; r++) for (let ci = 0; ci < cols; ci++) {
        if (rng() > cfg.win) continue;
        const wx = x + 7 + ci * (w - 14) / cols, wy = top + 10 + r * (h - 16) / rows, hh = hash2(wx, wy);
        // ~6% of windows are failing tubes: their bloom is drawn live (and can drop dark), the rest
        // bake into a static glow sprite.
        wins.push({ x: wx, y: wy, warm: rng() > 0.8, flk: hh < 0.06 ? hh * 104 % 6.283 : null });
      }
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

// --- distant window lights: a soft bloom over the lit window squares, blitted ADDITIVELY on the
// light buffer (they are atmosphere, not real lights, so they never touch the foreground lighting
// maths). The backdrop's glow hook runs in the BACK light pass, so the bloom sits behind the cast. ---
const _soft = {};
function softGlow(col) {                   // a soft round bloom, peak at the centre
  if (_soft[col]) return _soft[col];
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.5, `rgba(${col},0.45)`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  return _soft[col] = cv;
}
const WARM = '255,224,164', COOL = '188,204,236';

// bake the steady bloom for a layer (skips the live-flicker windows). Cached like the layer sprite.
function glowSprite(e, L) {
  if (L._glow && L._glowW === e.W && L._glowDPR === e.DPR) return L._glow;
  const DPR = e.DPR || 1, CW = e.W + PAD * 2, r = 4.5;
  const cv = document.createElement('canvas'); cv.width = Math.floor(CW * DPR); cv.height = Math.floor(e.H * DPR);
  const c = cv.getContext('2d'); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.translate(PAD, 0); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.6;
  for (const b of L.blds) for (const wn of b.wins) {
    if (wn.flk != null) continue;                       // flicker windows are drawn live
    c.drawImage(softGlow(wn.warm ? WARM : COOL), wn.x - r, wn.y - r, r * 2, r * 2);
  }
  L._glow = cv; L._glowW = e.W; L._glowDPR = e.DPR; return cv;
}

// a failing-tube value 0..1: dark most of the time, then a short buzzing burst now and then
function flickerVal(t, ph) {
  if (Math.sin(t * 0.6 + ph * 9.0) < 0.55) return 0;     // not in a flicker burst right now
  const buzz = Math.sin(t * 34 + ph * 6.28);
  return buzz > -0.1 ? 0.55 + 0.45 * Math.sin(t * 60 + ph) : 0.12;
}

// paint the window bloom for a backdrop's layers on the light buffer at the parallax offset.
export function windowGlow(e, layers, par) {
  const c = e.light, CW = e.W + PAD * 2, t = e.t, r = 4.5;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const L of layers) { c.globalAlpha = 0.85; c.drawImage(glowSprite(e, L), par * L.depth - PAD, 0, CW, e.H); }
  for (const L of layers) {                              // live failing-tube windows over the steady bloom
    const off = par * L.depth;
    for (const b of L.blds) for (const wn of b.wins) {
      if (wn.flk == null) continue;
      const v = flickerVal(t, wn.flk); if (v <= 0) continue;
      c.globalAlpha = v * 0.85;
      c.drawImage(softGlow(wn.warm ? WARM : COOL), wn.x + off - r, wn.y - r, r * 2, r * 2);
    }
  }
  c.restore();
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
