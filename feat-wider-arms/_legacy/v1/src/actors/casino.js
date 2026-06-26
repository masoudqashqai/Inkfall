// ---- CASINO — the deep-table props: card table, croupier, slots, roulette, drink, cash ----
import { Noir } from '../core/engine.js';
import { PALETTE } from '../core/palette.js';
import { TWO_PI } from '../core/math.js';
import { shadowPool, bodyGrad, rimSign } from './helpers.js';

Noir.registerActor('cardTable', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit, top = gy - 46 * s, w = 132 * s, h = 42 * s;
  shadowPool(c, X, gy + 4 * s, w * 0.58, 10 * s);
  c.fillStyle = '#070708'; c.fillRect(X - w * 0.5, top, w, 48 * s);
  const felt = c.createRadialGradient(X, top, 4 * s, X, top, w * 0.5); felt.addColorStop(0, '#1c2a22'); felt.addColorStop(1, '#0c130f');
  c.fillStyle = felt; c.beginPath(); c.ellipse(X, top, w * 0.5, h * 0.5, 0, 0, TWO_PI); c.fill();
  c.strokeStyle = 'rgba(200,210,225,0.18)'; c.lineWidth = 2; c.beginPath(); c.ellipse(X, top, w * 0.5, h * 0.5, 0, 0, TWO_PI); c.stroke();
  c.fillStyle = '#e8e6dc'; for (let i = 0; i < 4; i++) { c.save(); c.translate(X - 30 * s + i * 14 * s, top - 2 * s); c.rotate(-0.3 + i * 0.18); c.fillRect(-6 * s, -9 * s, 12 * s, 18 * s); c.strokeStyle = '#b22'; c.lineWidth = 1; if (i % 2) { c.fillStyle = '#b22'; c.beginPath(); c.arc(0, 0, 1.6 * s, 0, TWO_PI); c.fill(); c.fillStyle = '#e8e6dc'; } c.restore(); }
  c.fillStyle = '#e8e6dc'; for (const dx of [-10, 6]) { c.save(); c.translate(X + 16 * s + dx * s, top + 2 * s); c.fillRect(-3 * s, -3 * s, 6 * s, 6 * s); c.fillStyle = '#b00010'; c.beginPath(); c.arc(0, 0, 1 * s, 0, TWO_PI); c.fill(); c.fillStyle = '#e8e6dc'; c.restore(); }  // dice w/ red pip
  const hot = p.glow !== false;
  for (let i = 0; i < 5; i++) { c.fillStyle = (hot && i === 4) ? PALETTE.redHot : (i % 2 ? '#cfcfcf' : '#2a2a2a'); c.beginPath(); c.ellipse(X + 42 * s, top - 2 * s - i * 3 * s, 7 * s, 3 * s, 0, 0, TWO_PI); c.fill(); }
  if (hot) { c.save(); c.shadowColor = PALETTE.redHot; c.shadowBlur = 12; c.fillStyle = PALETTE.redHot; c.beginPath(); c.ellipse(X + 42 * s, top - 14 * s, 7 * s, 3 * s, 0, 0, TWO_PI); c.fill(); c.restore(); }
});

Noir.registerActor('dealer', (e, p) => {                // a croupier behind the table (the felt covers his lower half)
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit, rim = rimSign(e, p);
  c.save(); c.translate(X, gy);
  // shoulders + vest torso (dark, rounded)
  c.fillStyle = bodyGrad(c, 70, s, rim);
  c.beginPath(); c.moveTo(-19 * s, 0); c.lineTo(-17 * s, -52 * s); c.quadraticCurveTo(-22 * s, -64 * s, -12 * s, -68 * s); c.quadraticCurveTo(0, -76 * s, 12 * s, -68 * s); c.quadraticCurveTo(22 * s, -64 * s, 17 * s, -52 * s); c.lineTo(19 * s, 0); c.closePath(); c.fill();
  // a slim white shirt strip with vest lapels (not a big block)
  c.fillStyle = '#cdcbc1'; c.beginPath(); c.moveTo(-4 * s, -66 * s); c.lineTo(4 * s, -66 * s); c.lineTo(3 * s, -30 * s); c.lineTo(-3 * s, -30 * s); c.closePath(); c.fill();
  c.fillStyle = '#0c0e13'; c.beginPath(); c.moveTo(-12 * s, -68 * s); c.lineTo(-4 * s, -66 * s); c.lineTo(-3 * s, -30 * s); c.lineTo(-13 * s, -36 * s); c.closePath(); c.moveTo(12 * s, -68 * s); c.lineTo(4 * s, -66 * s); c.lineTo(3 * s, -30 * s); c.lineTo(13 * s, -36 * s); c.closePath(); c.fill();
  // red bow tie
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.moveTo(-4.5 * s, -67 * s); c.lineTo(0, -64 * s); c.lineTo(-4.5 * s, -61 * s); c.closePath(); c.moveTo(4.5 * s, -67 * s); c.lineTo(0, -64 * s); c.lineTo(4.5 * s, -61 * s); c.closePath(); c.fill();
  c.fillStyle = '#7a0008'; c.fillRect(-1.2 * s, -65.5 * s, 2.4 * s, 3 * s);
  // arms resting forward toward the felt + pale hands
  c.strokeStyle = '#101319'; c.lineWidth = 7 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-13 * s, -56 * s); c.lineTo(-22 * s, -30 * s); c.moveTo(13 * s, -56 * s); c.lineTo(22 * s, -30 * s); c.stroke();
  c.fillStyle = '#bdbbb0'; c.beginPath(); c.arc(-23 * s, -28 * s, 3.5 * s, 0, TWO_PI); c.arc(23 * s, -28 * s, 3.5 * s, 0, TWO_PI); c.fill();
  // head, slicked hair, green visor
  c.fillStyle = '#1a1b20'; c.beginPath(); c.arc(0, -80 * s, 8 * s, 0, TWO_PI); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(0, -82 * s, 8 * s, Math.PI, 0); c.fill();
  c.fillStyle = 'rgba(170,135,45,0.6)'; c.beginPath(); c.ellipse(0, -79 * s, 9.5 * s, 3 * s, 0, 0, Math.PI); c.fill();
  c.restore();
});

Noir.registerActor('slotMachine', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit, w = 46 * s, h = 86 * s;
  c.save(); c.translate(X, gy);
  shadowPool(c, 0, 4 * s, w * 0.7, 7 * s);
  const cab = c.createLinearGradient(-w / 2, 0, w / 2, 0); cab.addColorStop(0, '#0c0e12'); cab.addColorStop(0.5, '#1b1f25'); cab.addColorStop(1, '#0c0e12');
  c.fillStyle = cab; c.fillRect(-w / 2, -h, w, h);
  c.beginPath(); c.moveTo(-w / 2, -h); c.quadraticCurveTo(0, -h - 16 * s, w / 2, -h); c.closePath(); c.fill();
  c.save(); c.shadowColor = PALETTE.redHot; c.shadowBlur = 12; c.fillStyle = PALETTE.redHot; c.fillRect(-w / 2 + 4 * s, -h - 6 * s, w - 8 * s, 5 * s); c.restore();
  c.fillStyle = '#05060a'; c.fillRect(-w / 2 + 6 * s, -h + 14 * s, w - 12 * s, 26 * s);
  const syms = ['$', '7', '$'];
  for (let i = 0; i < 3; i++) { const rx = -w / 2 + 6 * s + (i + 0.5) * (w - 12 * s) / 3; c.fillStyle = '#e8e6dc'; c.fillRect(rx - 5 * s, -h + 16 * s, 10 * s, 22 * s); c.fillStyle = i === 1 ? PALETTE.redHot : '#1a1a1a'; c.font = `bold ${10 * s}px "Courier New",monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(syms[i], rx, -h + 27 * s); }
  c.fillStyle = '#05060a'; c.fillRect(-10 * s, -h + 50 * s, 20 * s, 3 * s);
  c.fillStyle = '#0a0c10'; c.fillRect(-w / 2 + 6 * s, -18 * s, w - 12 * s, 14 * s);
  c.save(); c.globalAlpha = 0.85; c.fillStyle = PALETTE.amber; c.shadowColor = PALETTE.amber; c.shadowBlur = 8; c.beginPath(); c.arc(-6 * s, -11 * s, 2 * s, 0, TWO_PI); c.arc(2 * s, -11 * s, 2 * s, 0, TWO_PI); c.fill(); c.restore();
  c.strokeStyle = '#3a3f47'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(w / 2, -h + 22 * s); c.lineTo(w / 2 + 10 * s, -h + 10 * s); c.stroke();
  c.fillStyle = PALETTE.redHot; c.shadowColor = PALETTE.redHot; c.shadowBlur = 8; c.beginPath(); c.arc(w / 2 + 10 * s, -h + 10 * s, 4 * s, 0, TWO_PI); c.fill(); c.shadowBlur = 0;
  c.restore();
});

Noir.registerActor('rouletteWheel', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), y = (p.y != null ? p.y * e.H : e.gy - 2 * e.unit), t = e.t, R = 30 * s;
  c.save(); c.translate(X, y); c.scale(1, 0.5); c.rotate(t * 0.4);
  for (let i = 0; i < 18; i++) { const a0 = i / 18 * TWO_PI, a1 = (i + 1) / 18 * TWO_PI; c.fillStyle = i % 2 ? '#b00010' : '#0a0a0a'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a0, a1); c.closePath(); c.fill(); }
  c.fillStyle = '#1a1d22'; c.beginPath(); c.arc(0, 0, R * 0.45, 0, TWO_PI); c.fill();
  c.fillStyle = '#c9b27a'; c.beginPath(); c.arc(0, 0, R * 0.12, 0, TWO_PI); c.fill();
  c.fillStyle = '#f0f0f0'; c.beginPath(); c.arc(R * 0.8 * Math.cos(-t * 1.3), R * 0.8 * Math.sin(-t * 1.3), 2.4 * s, 0, TWO_PI); c.fill();
  c.restore();
  c.save(); c.translate(X, y); c.scale(1, 0.5); c.strokeStyle = '#2a2e35'; c.lineWidth = 4 * s; c.beginPath(); c.arc(0, 0, R + 2 * s, 0, TWO_PI); c.stroke(); c.restore();
});

Noir.registerActor('drink', (e, p) => {                     // p.kind: 'martini' | 'whiskey' (amber glows)
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), y = (p.y != null ? p.y * e.H : e.gy - 2 * e.unit);
  c.save(); c.translate(X, y);
  if (p.kind === 'martini') {
    c.strokeStyle = 'rgba(210,220,235,0.7)'; c.lineWidth = 1.5 * s; c.fillStyle = 'rgba(200,215,235,0.12)';
    c.beginPath(); c.moveTo(-10 * s, -20 * s); c.lineTo(10 * s, -20 * s); c.lineTo(0, -8 * s); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = PALETTE.amber; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(-7 * s, -17 * s); c.lineTo(7 * s, -17 * s); c.lineTo(0, -9 * s); c.closePath(); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(210,220,235,0.7)'; c.beginPath(); c.moveTo(0, -8 * s); c.lineTo(0, 0); c.moveTo(-6 * s, 0); c.lineTo(6 * s, 0); c.stroke();
    c.fillStyle = PALETTE.redHot; c.beginPath(); c.arc(2 * s, -12 * s, 1.6 * s, 0, TWO_PI); c.fill();
  } else {
    c.fillStyle = 'rgba(200,215,235,0.1)'; c.strokeStyle = 'rgba(210,220,235,0.6)'; c.lineWidth = 1.5 * s;
    c.fillRect(-7 * s, -14 * s, 14 * s, 14 * s); c.strokeRect(-7 * s, -14 * s, 14 * s, 14 * s);
    c.save(); c.fillStyle = PALETTE.amber; c.globalAlpha = 0.85; c.shadowColor = PALETTE.amber; c.shadowBlur = 8; c.fillRect(-6 * s, -7 * s, 12 * s, 6 * s); c.restore();
    c.fillStyle = 'rgba(230,235,245,0.5)'; c.fillRect(-3 * s, -6 * s, 3 * s, 3 * s);
  }
  c.restore();
});

Noir.registerActor('cash', (e, p) => {                  // a stack of bills with a red band
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), y = (p.y != null ? p.y * e.H : e.gy - 2 * e.unit);
  c.save(); c.translate(X, y);
  for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#3c4a3a' : '#46553f'; c.fillRect(-14 * s, -i * 3 * s, 28 * s, 8 * s); c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1; c.strokeRect(-14 * s, -i * 3 * s, 28 * s, 8 * s); c.fillStyle = 'rgba(210,215,200,0.45)'; c.beginPath(); c.arc(0, -i * 3 * s + 4 * s, 2 * s, 0, TWO_PI); c.fill(); }
  c.fillStyle = PALETTE.redHot; c.fillRect(-14 * s, -9 * s, 28 * s, 2.6 * s);   // red bank band (the colour that bleeds)
  c.restore();
});
