// ---- STREET / NOIR PROPS — the city furniture: fire, hydrant, phone, sign, cat, steam,
//  crows, water tower, blowing newspaper, manhole, dumpster, searchlight, car, traffic light.
//  Several register their own light (barrelFire, redCar, trafficLight) so they light the scene.
import { Noir } from '../core/engine.js';
import { PALETTE } from '../core/palette.js';
import { TWO_PI, lerp, smooth01, clamp01 } from '../core/math.js';
import { shadowPool } from './helpers.js';

Noir.registerActor('barrelFire', (e, p) => {                // a drum fire in the alley
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit, t = e.t;
  c.save(); c.translate(X, gy);
  const fg = c.createRadialGradient(0, -46 * s, 0, 0, -46 * s, 64 * s); fg.addColorStop(0, 'rgba(255,140,30,0.35)'); fg.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = fg; c.beginPath(); c.arc(0, -46 * s, 64 * s, 0, TWO_PI); c.fill();
  c.fillStyle = '#15181d'; c.fillRect(-16 * s, -44 * s, 32 * s, 44 * s);
  c.strokeStyle = '#0a0c10'; c.lineWidth = 2; c.beginPath(); c.moveTo(-16 * s, -30 * s); c.lineTo(16 * s, -30 * s); c.moveTo(-16 * s, -14 * s); c.lineTo(16 * s, -14 * s); c.stroke();
  c.fillStyle = '#05060a'; c.beginPath(); c.ellipse(0, -44 * s, 16 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  for (let i = 0; i < 6; i++) { const fx = (i - 2.5) * 5 * s, fh = (18 + Math.sin(t * 8 + i) * 8) * s; c.fillStyle = i % 2 ? '#ff7a18' : '#ffd400'; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(fx - 4 * s, -44 * s); c.quadraticCurveTo(fx, -44 * s - fh, fx + 4 * s, -44 * s); c.closePath(); c.fill(); }
  c.globalAlpha = 1;
  for (let i = 0; i < 5; i++) { const life = (t * 0.6 + i * 0.2) % 1; c.globalAlpha = 1 - life; c.fillStyle = '#ffb030'; c.fillRect(Math.sin(i * 3 + t) * 14 * s, -44 * s - life * 50 * s, 1.5 * s, 1.5 * s); }
  c.globalAlpha = 1; c.restore();
  // the fire is a flickering warm light on the air, wet floor and rain
  const fl = 0.7 + 0.3 * Math.sin(t * 7) + 0.1 * Math.sin(t * 19), I = 0.55 * fl, fy = gy - 46 * s;
  e.lightHalo(X, fy, '255,140,40', 150 * s, I); e.pushLight(X, fy, '255,140,40', 170 * s, I); e.floorRefl(X, '255,140,40', I * 0.7, 22, 0);
});

Noir.registerActor('fireHydrant', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit;
  c.save(); c.translate(X, gy); shadowPool(c, 0, 2 * s, 12 * s, 3 * s);
  c.fillStyle = '#16191e'; c.fillRect(-6 * s, -22 * s, 12 * s, 22 * s); c.beginPath(); c.arc(0, -22 * s, 7 * s, Math.PI, 0); c.fill();
  c.fillRect(-9 * s, -16 * s, 3 * s, 5 * s); c.fillRect(6 * s, -16 * s, 3 * s, 5 * s);
  c.fillStyle = '#0a0c10'; c.beginPath(); c.arc(0, -26 * s, 2.5 * s, 0, TWO_PI); c.fill();
  c.strokeStyle = 'rgba(200,210,225,0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5 * s, -20 * s); c.lineTo(-5 * s, -2 * s); c.stroke();
  c.restore();
});

Noir.registerActor('payphone', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit;
  c.save(); c.translate(X, gy);
  c.fillStyle = '#15181d'; c.fillRect(-12 * s, -60 * s, 24 * s, 46 * s);
  c.fillStyle = '#05060a'; c.fillRect(-9 * s, -56 * s, 18 * s, 18 * s);
  c.strokeStyle = 'rgba(200,210,225,0.25)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c.strokeRect(-7 * s + i * 5 * s, -34 * s + j * 5 * s, 3 * s, 3 * s);
  c.strokeStyle = '#0a0c10'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(-12 * s, -50 * s); c.quadraticCurveTo(-20 * s, -40 * s, -14 * s, -28 * s); c.stroke();
  c.fillStyle = '#1a1d22'; c.beginPath(); c.arc(-12 * s, -50 * s, 3 * s, 0, TWO_PI); c.arc(-14 * s, -28 * s, 3 * s, 0, TWO_PI); c.fill();
  c.restore();
});

Noir.registerActor('streetSign', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit;
  c.save(); c.translate(X, gy);
  c.fillStyle = PALETTE.ink; c.fillRect(-1.5 * s, -120 * s, 3 * s, 120 * s);
  c.save(); c.translate(0, -116 * s); c.fillStyle = '#1c2a22'; c.fillRect(-30 * s, -7 * s, 60 * s, 12 * s);
  c.fillStyle = 'rgba(220,230,225,0.85)'; c.font = `bold ${7 * s}px "Courier New",monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.label || 'SIN ST', 0, -1 * s); c.restore();
  c.restore();
});

Noir.registerActor('cat', (e, p) => {                       // an alley cat with a glowing eye
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit, t = e.t;
  c.save(); c.translate(X, gy); if (p.flip) c.scale(-1, 1);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(0, -5 * s, 12 * s, 5 * s, 0, 0, TWO_PI); c.fill();
  c.fillRect(-11 * s, -6 * s, 2.5 * s, 6 * s); c.fillRect(8 * s, -6 * s, 2.5 * s, 6 * s);
  c.beginPath(); c.arc(11 * s, -12 * s, 4 * s, 0, TWO_PI); c.fill();
  c.beginPath(); c.moveTo(8 * s, -15 * s); c.lineTo(9 * s, -20 * s); c.lineTo(11 * s, -15 * s); c.closePath(); c.moveTo(11 * s, -15 * s); c.lineTo(13 * s, -20 * s); c.lineTo(14 * s, -15 * s); c.closePath(); c.fill();
  c.strokeStyle = PALETTE.ink; c.lineWidth = 2.5 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(-11 * s, -6 * s); c.quadraticCurveTo(-20 * s, -10 * s + Math.sin(t * 2) * 3 * s, -16 * s, -18 * s); c.stroke();
  c.fillStyle = PALETTE.amber; c.shadowColor = PALETTE.amber; c.shadowBlur = 4; c.beginPath(); c.arc(12.5 * s, -12 * s, 1 * s, 0, TWO_PI); c.fill(); c.shadowBlur = 0;
  c.restore();
});

Noir.registerActor('steam', (e, p) => {
  const c = e.ctx, X = e.X(p), gy = (p.y != null ? p.y * e.H : e.gy), t = e.t, seed = p.seed || 0;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { const life = ((t * 0.25 + i * 0.2 + seed) % 1), y = gy - life * 150, r = 8 + life * 46, a = 0.10 * (1 - life); c.fillStyle = `rgba(200,210,225,${a})`; c.beginPath(); c.arc(X + Math.sin(t + i + seed) * 14, y, r, 0, TWO_PI); c.fill(); }
  c.restore();
});

Noir.registerActor('crow', (e, p) => {                      // faces right; wing + tail move smoothly; flies off in slow motion
  const c = e.ctx, t = e.t, sc = (p.scale || 1);
  // on p.flyAt the crow lifts off, one after another (p.delay), drifting up-right and fading — slow motion
  let fly = 0;
  if (p.flyAt != null && e.lineIdx >= p.flyAt) fly = clamp01((smooth01(e.beat() / 11) - (p.delay || 0)) / (1 - (p.delay || 0)));
  if (fly >= 0.99) return;
  const X = e.X(p) + fly * e.W * 0.5, y = p.y * e.H - fly * e.H * 0.6, flying = fly > 0.02;
  const w = Math.sin(t * (flying ? 2.4 : 1.0)) * 0.5 + 0.5, wingTipY = -2 - (flying ? 13 : 4) * w, tail = Math.sin(t * 1.6) * 2.2;
  c.save(); c.translate(X, y); c.scale(-sc, sc); c.globalAlpha = 1 - fly; c.fillStyle = PALETTE.ink;   // negative x → faces right
  c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, TWO_PI); c.fill();
  c.beginPath(); c.arc(-6, -3, 3, 0, TWO_PI); c.fill(); c.fillRect(-10, -3, 4, 1.4);
  c.beginPath(); c.moveTo(5, -1); c.quadraticCurveTo(11, 1 + tail, 14, 2 + tail); c.lineTo(5, 2); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2, -1); c.quadraticCurveTo(8, wingTipY * 0.6, 13, wingTipY); c.quadraticCurveTo(8, 1, 3, 1.5); c.closePath(); c.fill();
  if (!flying) c.fillRect(1, 4, 1.4, 5);
  c.restore(); c.globalAlpha = 1;
});

Noir.registerActor('waterTower', (e, p) => {
  const c = e.ctx, s = e.unit * (p.scale || 1), X = e.X(p), b = e.gy; c.fillStyle = PALETTE.ink;
  c.beginPath(); c.moveTo(X - 22 * s, b); c.lineTo(X - 16 * s, b - 60 * s); c.lineTo(X - 12 * s, b); c.closePath(); c.moveTo(X + 22 * s, b); c.lineTo(X + 16 * s, b - 60 * s); c.lineTo(X + 12 * s, b); c.fill();
  c.fillRect(X - 24 * s, b - 88 * s, 48 * s, 30 * s); c.beginPath(); c.moveTo(X - 24 * s, b - 88 * s); c.lineTo(X, b - 108 * s); c.lineTo(X + 24 * s, b - 88 * s); c.closePath(); c.fill();
});

// a tabloid that blows in from the left at scene start, tumbles, and comes to rest on the wet floor
Noir.registerActor('newspaper', (e, p) => {
  const c = e.ctx, st = e.sceneT(), pP = smooth01(st / 4.5), tumbling = pP < 0.97;
  const restX = (p.restX != null ? p.restX : 0.2) * e.W;
  const px = lerp(-50, restX, pP), py = tumbling ? (e.gy - 6 - Math.abs(Math.sin(st * 3)) * 50 * (1 - pP)) : (e.gy + 16), rot = tumbling ? Math.sin(st * 5) : 0.1;
  const w = 72, h = 48;
  c.save(); c.translate(px, py); c.rotate(rot);
  c.fillStyle = 'rgba(228,225,214,0.92)'; c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1; c.strokeRect(-w / 2, -h / 2, w, h);
  c.fillStyle = '#0b0b0b'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.font = '700 4.5px "Times New Roman",serif'; c.fillText('THE BASIN HERALD', 0, -h / 2 + 8);
  c.strokeStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.moveTo(-w / 2 + 5, -h / 2 + 11); c.lineTo(w / 2 - 5, -h / 2 + 11); c.stroke();
  c.font = '900 7px "Arial Black",Impact,sans-serif'; c.fillText('ANOTHER ONE', 0, -h / 2 + 22); c.fillText('IN THE RAIN', 0, -h / 2 + 31);
  c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 0.6;
  for (let i = 0; i < 4; i++) { const yy = -h / 2 + 37 + i * 2; c.beginPath(); c.moveTo(-w / 2 + 6, yy); c.lineTo(w / 2 - 6, yy); c.stroke(); }
  c.restore();
});

// a round cast-iron manhole / storm-drain cover set into the wet street
Noir.registerActor('manhole', (e, p) => {
  const c = e.ctx, s = e.unit * (p.scale || 1), cx = e.X(p), cy = (p.y != null ? p.y * e.H : e.gy + (e.H - e.gy) * 0.42), sq = 0.42;
  c.save(); c.translate(cx, cy);
  c.fillStyle = '#0a0c10'; c.beginPath(); c.ellipse(0, 1.5 * s, 32 * s, 32 * s * sq, 0, 0, TWO_PI); c.fill();
  c.fillStyle = '#22262e'; c.beginPath(); c.ellipse(0, 0, 29 * s, 29 * s * sq, 0, 0, TWO_PI); c.fill();
  c.fillStyle = '#14171c'; c.beginPath(); c.ellipse(0, 0, 25 * s, 25 * s * sq, 0, 0, TWO_PI); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1.3 * s;
  for (let r = 7; r <= 22; r += 7) { c.beginPath(); c.ellipse(0, 0, r * s, r * s * sq, 0, 0, TWO_PI); c.stroke(); }
  for (let a = 0; a < 8; a++) { const cc = Math.cos(a * Math.PI / 4), sn = Math.sin(a * Math.PI / 4) * sq; c.beginPath(); c.moveTo(cc * 5 * s, sn * 5 * s); c.lineTo(cc * 23 * s, sn * 23 * s); c.stroke(); }
  c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, 0, 3 * s, 1.6 * s, 0, 0, TWO_PI); c.fill();   // pick hole, dead centre
  c.restore();
});

// a tall street dumpster
Noir.registerActor('dumpster', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), g = e.gy, bw = 30 * s, bh = 46 * s;
  c.save();
  c.fillStyle = '#1c2027'; c.fillRect(X - bw / 2, g - bh, bw, bh);
  c.fillStyle = '#272c35'; c.fillRect(X - bw / 2 - 3 * s, g - bh - 3 * s, bw + 6 * s, 3.5 * s);
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1.5; c.strokeRect(X - bw / 2, g - bh, bw, bh);
  c.beginPath(); for (let i = 1; i < 4; i++) { c.moveTo(X - bw / 2 + i * bw / 4, g - bh); c.lineTo(X - bw / 2 + i * bw / 4, g); } c.stroke();
  c.restore();
});

Noir.registerActor('searchlight', (e, p) => {
  const c = e.ctx, t = e.t, ang = Math.sin(t * 0.4) * 0.5;
  c.save(); c.translate((p.x || 0.5) * e.W, e.H); c.rotate(ang); c.globalCompositeOperation = 'lighter';
  const lg = c.createLinearGradient(0, 0, 0, -e.H); lg.addColorStop(0, 'rgba(190,200,220,0.10)'); lg.addColorStop(1, 'rgba(190,200,220,0)');
  c.fillStyle = lg; c.beginPath(); c.moveTo(0, 0); c.lineTo(-70, -e.H); c.lineTo(70, -e.H); c.closePath(); c.fill(); c.restore();
});

Noir.registerActor('redCar', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.walkX(p), gy = e.gy + (p.dy || 0) * e.unit;   // walkX → it can pull away when the light turns green
  c.save(); c.translate(X, gy);
  c.globalAlpha = 0.4; const g = c.createLinearGradient(0, 0, 0, 26 * s); g.addColorStop(0, 'rgba(180,0,18,0.5)'); g.addColorStop(1, 'rgba(180,0,18,0)'); c.fillStyle = g; c.fillRect(-70 * s, 0, 140 * s, 30 * s); c.globalAlpha = 1;
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(-44 * s, 0, 15 * s, 0, TWO_PI); c.arc(46 * s, 0, 15 * s, 0, TWO_PI); c.fill();
  c.fillStyle = '#b8000e'; c.shadowColor = 'rgba(180,0,18,0.5)'; c.shadowBlur = 12 * s;
  c.beginPath(); c.moveTo(-72 * s, -8 * s); c.quadraticCurveTo(-74 * s, -22 * s, -52 * s, -24 * s); c.quadraticCurveTo(-40 * s, -46 * s, -8 * s, -48 * s); c.quadraticCurveTo(26 * s, -48 * s, 36 * s, -26 * s); c.quadraticCurveTo(64 * s, -24 * s, 72 * s, -10 * s); c.lineTo(72 * s, -6 * s); c.quadraticCurveTo(72 * s, 2 * s, 62 * s, 2 * s); c.lineTo(-62 * s, 2 * s); c.quadraticCurveTo(-72 * s, 2 * s, -72 * s, -8 * s); c.closePath(); c.fill();
  c.fillStyle = '#06080c'; c.beginPath(); c.moveTo(-44 * s, -26 * s); c.quadraticCurveTo(-36 * s, -42 * s, -10 * s, -43 * s); c.quadraticCurveTo(20 * s, -43 * s, 30 * s, -27 * s); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,40,30,0.95)'; c.shadowColor = PALETTE.ember; c.shadowBlur = 12; c.beginPath(); c.arc(70 * s, -10 * s, 3 * s, 0, TWO_PI); c.fill(); c.shadowBlur = 0;
  c.fillStyle = '#222'; c.beginPath(); c.arc(-44 * s, 0, 5 * s, 0, TWO_PI); c.arc(46 * s, 0, 5 * s, 0, TWO_PI); c.fill(); c.restore();
  // the car's lamps are light sources: warm headlight at the front, red tail-light at the rear
  const ly = gy - 9 * s, hl = X - 78 * s, tl = X + 74 * s;
  e.lightHalo(hl, ly, '255,238,196', 120 * s, 0.5); e.pushLight(hl, ly, '255,238,196', 150 * s, 0.5); e.floorRefl(hl, '255,238,196', 0.42, 20, 0);
  e.lightHalo(tl, ly, '255,40,30', 70 * s, 0.42); e.pushLight(tl, ly, '255,40,30', 90 * s, 0.42); e.floorRefl(tl, '255,40,30', 0.4, 14, 0);
});

// a kerbside traffic light; turns green on p.greenAt, and is itself a coloured light source
Noir.registerActor('trafficLight', (e, p) => {
  const c = e.ctx, s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit;
  const green = (p.greenAt != null && e.lineIdx >= p.greenAt);
  c.save(); c.translate(X, gy);
  c.fillStyle = PALETTE.ink; c.fillRect(-2 * s, -150 * s, 4 * s, 150 * s);               // pole
  c.fillStyle = '#0c0e12'; c.fillRect(-11 * s, -202 * s, 22 * s, 54 * s);                // housing
  const lamp = (yy, on, col) => { c.fillStyle = on ? col : 'rgba(70,70,74,0.5)'; if (on) { c.shadowColor = col; c.shadowBlur = 16 * s; } c.beginPath(); c.arc(0, yy * s, 5 * s, 0, TWO_PI); c.fill(); c.shadowBlur = 0; };
  lamp(-190, !green, '#ff2a2a'); lamp(-175, false, '#ffd400'); lamp(-160, green, '#36d36e');
  c.restore();
  // the lit lamp pours its colour onto the air + wet floor + rain, like every other light
  const ly = gy - (green ? 160 : 190) * s, col = green ? '54,211,110' : '255,42,42', r = 150 * (p.scale || 1);
  e.pushLight(X, ly, col, r, 0.6); e.lightHalo(X, ly, col, r, 0.6); e.floorRefl(X, col, 0.6, 18, 0);
});
