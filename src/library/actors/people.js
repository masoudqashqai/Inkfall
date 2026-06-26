// PEOPLE — the noir cast. Motion is read from scene timing (e.lineIdx / e.beat) + per-actor
// params. Every figure now uses the one shared directional ground shadow (v1 mixed blobs,
// directional shadows, and none). The detective's lit cigarette registers as a small warm light.
import { defineActor } from '../../objects/registry.js';
import { PALETTE, ANIM } from '../../style/palette.js';
import { TWO_PI, lerp, smooth01 } from '../../engine/math.js';
import { rimSign, bodyGrad, shadowPool, ember, cigSmoke, drawFedora, drawPistol, muzzleFlash } from '../shared.js';

// shared detective pose (so emitLight and draw agree without storing state)
function trenchPose(e, p) {
  const s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit, t = e.t, sway = Math.sin(t * ANIM.swaySpeed) * 1.2;
  const aim = p.raiseAt == null ? 1 : (e.lineIdx < p.raiseAt ? 0 : (e.lineIdx === p.raiseAt ? smooth01(e.beat() / 2.2) : 1));
  const litCig = p.lightAt == null ? true : (e.lineIdx >= p.lightAt);
  const flash = (p.lightAt != null && e.lineIdx === p.lightAt) ? Math.max(0, 1 - e.beat() / 0.8) : 0;
  const hx = lerp(26 * s, 13 * s, aim), hy = lerp(-38 * s, -101 * s, aim);   // resting hand hangs wide + low at his side; swings in/up to the mouth as he raises the cigarette
  return { s, X, gy, t, sway, aim, litCig, flash, hx, hy };
}

defineActor('trenchMan', function (e) {                       // detective: trench coat + fedora
  const c = e.ctx, P = trenchPose(e, this), s = P.s, X = P.X, gy = P.gy, t = P.t, sway = P.sway;
  const rim = rimSign(e, this), tint = e.litTint(X);
  e.groundShadow(X + sway, 22 * s, 96 * s);
  c.save(); c.translate(X + sway, gy);
  c.fillStyle = '#050608'; c.fillRect(-13 * s, -32 * s, 11 * s, 32 * s); c.fillRect(3 * s, -32 * s, 11 * s, 32 * s);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(-9 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.ellipse(10 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  const coat = bodyGrad(c, 96, s, rim, tint); c.fillStyle = coat;
  c.beginPath(); c.moveTo(-22 * s, -36 * s); c.lineTo(-18 * s, -92 * s); c.lineTo(18 * s, -92 * s); c.lineTo(22 * s, -36 * s); c.quadraticCurveTo(0, -28 * s, -22 * s, -36 * s); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(2 * s, -90 * s); c.lineTo(5 * s, -38 * s); c.stroke();
  c.fillStyle = '#0c0d10'; c.fillRect(-20 * s, -58 * s, 40 * s, 6 * s); c.fillStyle = '#26282e'; c.fillRect(-4 * s, -58 * s, 8 * s, 6 * s);
  const aim = P.aim, litCig = P.litCig, flash = P.flash;
  const ex = lerp(22 * s, 26 * s, aim), ey = lerp(-62 * s, -73 * s, aim), hx = P.hx, hy = P.hy;
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = coat; c.lineWidth = 8.5 * s;
  c.beginPath(); c.moveTo(18 * s, -85 * s); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();   // cigarette arm: off the shoulder, out to the side, up to the mouth as it raises
  c.beginPath(); c.moveTo(-18 * s, -85 * s); c.lineTo(-26 * s, -38 * s); c.stroke();           // other arm hangs straight + wide at his side
  c.strokeStyle = 'rgba(150,160,178,0.3)'; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(18 * s, -87 * s); c.lineTo(ex, ey); c.stroke();
  c.fillStyle = '#bcbab0'; c.beginPath(); c.arc(hx, hy, 2.9 * s, 0, TWO_PI); c.arc(-26 * s, -38 * s, 3.2 * s, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 24, s, rim, tint);
  c.beginPath(); c.moveTo(-26 * s, -90 * s); c.quadraticCurveTo(0, -104 * s, 26 * s, -90 * s); c.lineTo(18 * s, -84 * s); c.quadraticCurveTo(0, -94 * s, -18 * s, -84 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.moveTo(-10 * s, -96 * s); c.lineTo(-2 * s, -107 * s); c.lineTo(-1 * s, -92 * s); c.closePath(); c.moveTo(10 * s, -96 * s); c.lineTo(2 * s, -107 * s); c.lineTo(1 * s, -92 * s); c.closePath(); c.fill();
  c.fillStyle = '#15161a'; c.fillRect(-6 * s, -104 * s, 12 * s, 10 * s);
  c.fillStyle = '#1a1b20'; c.beginPath(); c.arc(0, -112 * s, 10 * s, 0, TWO_PI); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(0, -112 * s, 10 * s, Math.PI * 1.15, Math.PI * 1.95); c.fill();
  drawFedora(c, 0, -120 * s, 13 * s, rim);
  if (aim > 0.5) {
    c.save(); c.translate(hx, hy); c.fillStyle = '#d8d2c4'; c.fillRect(2 * s, -1 * s, 7 * s, 2 * s); c.restore();
    if (litCig) { cigSmoke(c, hx + 9 * s, hy, s, t); ember(c, hx + 9 * s, hy, s, t); }
    if (flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const fg = c.createRadialGradient(hx + 6 * s, hy, 0, hx + 6 * s, hy, 46 * s); fg.addColorStop(0, `rgba(255,170,80,${0.55 * flash})`); fg.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = fg; c.beginPath(); c.arc(hx + 6 * s, hy, 46 * s, 0, TWO_PI); c.fill(); c.restore(); }
  }
  c.restore();
}, {
  emitLight(e) {
    const P = trenchPose(e, this);
    if (P.aim > 0.5 && P.litCig) {
      const cwx = P.X + P.sway + P.hx + 9 * P.s, cwy = P.gy + P.hy, I = 0.3 + P.flash * 0.6;
      e.addLight({ x: cwx, y: cwy, col: '255,150,60', r: 84 * P.s, I: I * 0.7, ew: 4 * P.s, eh: 4 * P.s });
    }
  },
});

defineActor('thug', function (e) {                            // the heavy: broad, flat cap, big fists
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, rim = rimSign(e, this);
  e.groundShadow(X, 30 * s, 86 * s);
  c.save(); c.translate(X, gy);
  c.fillStyle = '#050608'; c.fillRect(-18 * s, -36 * s, 15 * s, 36 * s); c.fillRect(3 * s, -36 * s, 15 * s, 36 * s);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(-11 * s, -1 * s, 12 * s, 4 * s, 0, 0, TWO_PI); c.ellipse(12 * s, -1 * s, 12 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 82, s, rim);
  c.beginPath(); c.moveTo(-30 * s, -36 * s); c.lineTo(-34 * s, -78 * s); c.quadraticCurveTo(0, -96 * s, 34 * s, -78 * s); c.lineTo(30 * s, -36 * s); c.quadraticCurveTo(0, -28 * s, -30 * s, -36 * s); c.closePath(); c.fill();
  c.fillStyle = '#cfcdc3'; c.beginPath(); c.moveTo(-6 * s, -82 * s); c.lineTo(6 * s, -82 * s); c.lineTo(3 * s, -54 * s); c.lineTo(-3 * s, -54 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.moveTo(-2.5 * s, -80 * s); c.lineTo(2.5 * s, -80 * s); c.lineTo(1.5 * s, -56 * s); c.lineTo(-1.5 * s, -56 * s); c.closePath(); c.fill();
  c.fillStyle = bodyGrad(c, 36, s, rim); c.beginPath(); c.moveTo(-12 * s, -84 * s); c.lineTo(-6 * s, -82 * s); c.lineTo(-7 * s, -52 * s); c.lineTo(-16 * s, -56 * s); c.closePath(); c.moveTo(12 * s, -84 * s); c.lineTo(6 * s, -82 * s); c.lineTo(7 * s, -52 * s); c.lineTo(16 * s, -56 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.ink; c.fillRect(-34 * s, -80 * s, 9 * s, 42 * s); c.fillRect(25 * s, -80 * s, 9 * s, 42 * s);
  c.beginPath(); c.arc(-30 * s, -36 * s, 7 * s, 0, TWO_PI); c.arc(30 * s, -36 * s, 7 * s, 0, TWO_PI); c.fill();
  c.fillStyle = '#1a1b20'; c.beginPath(); c.arc(0, -90 * s, 11 * s, 0, TWO_PI); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(0, -90 * s, 11 * s, Math.PI * 1.1, Math.PI * 2.0); c.fill();
  c.beginPath(); c.arc(0, -98 * s, 11 * s, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(-9 * s, -98 * s, 9 * s, 3 * s, 0, 0, TWO_PI); c.fill();
  c.restore();
});

defineActor('boss', function (e) {                            // mob boss: pinstripe suit, fedora, cigar
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, t = e.t, rim = rimSign(e, this);
  e.groundShadow(X, 24 * s, 92 * s);
  c.save(); c.translate(X, gy);
  c.fillStyle = '#050608'; c.fillRect(-13 * s, -32 * s, 11 * s, 32 * s); c.fillRect(3 * s, -32 * s, 11 * s, 32 * s);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(-9 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.ellipse(10 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 92, s, rim);
  c.beginPath(); c.moveTo(-24 * s, -34 * s); c.lineTo(-20 * s, -88 * s); c.quadraticCurveTo(0, -100 * s, 20 * s, -88 * s); c.lineTo(24 * s, -34 * s); c.quadraticCurveTo(0, -28 * s, -24 * s, -34 * s); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(150,160,180,0.16)'; c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 6 * s, -88 * s); c.lineTo(i * 6 * s + i * 1.2 * s, -34 * s); c.stroke(); }
  c.fillStyle = '#cfcdc3'; c.beginPath(); c.moveTo(-5 * s, -88 * s); c.lineTo(5 * s, -88 * s); c.lineTo(3 * s, -60 * s); c.lineTo(-3 * s, -60 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.moveTo(-2.5 * s, -86 * s); c.lineTo(2.5 * s, -86 * s); c.lineTo(1.4 * s, -58 * s); c.lineTo(-1.4 * s, -58 * s); c.closePath(); c.fill();
  c.fillStyle = '#15161a'; c.fillRect(-5 * s, -100 * s, 10 * s, 10 * s);
  c.fillStyle = '#1a1b20'; c.beginPath(); c.arc(0, -108 * s, 9 * s, 0, TWO_PI); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(0, -108 * s, 9 * s, Math.PI * 1.1, Math.PI * 2.0); c.fill();
  drawFedora(c, 0, -116 * s, 12 * s, rim);
  c.fillStyle = '#3a2a1c'; c.fillRect(6 * s, -104 * s, 13 * s, 3 * s);
  cigSmoke(c, 19 * s, -104 * s, s, t);
  c.save(); c.fillStyle = 'rgba(255,80,30,0.95)'; c.shadowColor = PALETTE.ember; c.shadowBlur = 12; c.beginPath(); c.arc(19 * s, -102.5 * s, 2.4 * s, 0, TWO_PI); c.fill(); c.restore();
  c.restore();
});

defineActor('gunman', function (e) {                          // shooter, arm extended, muzzle flash on 'muzzle'
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, rim = rimSign(e, this), tint = e.litTint(X), flash = e.flags.muzzle || 0;
  e.groundShadow(X, 20 * s, 90 * s);
  c.save(); c.translate(X, gy); if (this.flip) c.scale(-1, 1);
  c.fillStyle = '#050608'; c.fillRect(-12 * s, -32 * s, 10 * s, 32 * s); c.fillRect(4 * s, -32 * s, 10 * s, 32 * s);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(-8 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.ellipse(11 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 88, s, rim, tint);
  c.beginPath(); c.moveTo(-20 * s, -34 * s); c.lineTo(-16 * s, -86 * s); c.quadraticCurveTo(0, -98 * s, 16 * s, -86 * s); c.lineTo(20 * s, -34 * s); c.quadraticCurveTo(0, -28 * s, -20 * s, -34 * s); c.closePath(); c.fill();
  c.fillStyle = '#1a1b20'; c.beginPath(); c.arc(0, -104 * s, 9 * s, 0, TWO_PI); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(0, -104 * s, 9 * s, Math.PI * 1.1, Math.PI * 2.0); c.fill();
  drawFedora(c, 0, -112 * s, 11 * s, rim);
  const aim = (this.raiseAt != null) ? (e.lineIdx < this.raiseAt ? 0 : (e.lineIdx === this.raiseAt ? smooth01(e.beat() / 2.4) : 1)) : 1;
  const sx = 6 * s, sy = -86 * s, hx = lerp(13 * s, 34 * s, aim), hy = lerp(-52 * s, -82 * s, aim), ang = Math.atan2(hy - sy, hx - sx);
  c.strokeStyle = PALETTE.ink; c.lineWidth = 8 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
  c.save(); c.translate(hx, hy); c.rotate(ang); drawPistol(c, 0, 0, s); c.restore();
  if (flash > 0 && aim > 0.82) muzzleFlash(c, hx + Math.cos(ang) * 18 * s, hy + Math.sin(ang) * 18 * s, s, flash);
  c.restore();
});

defineActor('womanInRed', function (e) {                      // femme fatale — the colour that bleeds
  const c = e.ctx, s = e.scaleOf(this), X = e.walkX(this), gy = e.gy + (this.dy || 0) * e.unit, t = e.t, walk = Math.sin(t * ANIM.walkSpeed);
  if (this.walk) { const i = Math.min(e.lineIdx, this.walk.length - 1), prev = i > 0 ? this.walk[i - 1] : this.walk[0]; e.walkSound(prev !== this.walk[i] && e.beat() < (this.walkDur || 3.4) - 0.2); }
  let reflA = 1;
  if (this.passX != null) { const manX = this.passX * e.W + e.scene.camera.look * (this.par == null ? 0.5 : this.par); reflA = smooth01((Math.abs(X - manX) - 20 * s) / (40 * s)); }
  e.groundShadow(X, 13 * s, 84 * s);
  c.save(); c.translate(X, gy);
  if (reflA > 0.01) { c.globalAlpha = 0.4 * reflA; const grd = c.createLinearGradient(0, 0, 0, 46 * s); grd.addColorStop(0, 'rgba(200,0,20,0.5)'); grd.addColorStop(1, 'rgba(200,0,20,0)'); c.fillStyle = grd; c.fillRect(-14 * s, 0, 28 * s, 48 * s); c.globalAlpha = 1; }
  c.fillStyle = PALETTE.bone; c.save(); c.translate(walk * 2 * s, 0); c.beginPath(); c.moveTo(-2 * s, -32 * s); c.lineTo(2 * s, -32 * s); c.lineTo(3 * s, -2 * s); c.lineTo(-1 * s, -2 * s); c.closePath(); c.fill(); c.restore();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.moveTo(1 * s, -2 * s); c.lineTo(7 * s, 0); c.lineTo(1 * s, 1 * s); c.closePath(); c.fill();
  const dg = c.createLinearGradient(-12 * s, 0, 12 * s, 0); dg.addColorStop(0, '#8e0009'); dg.addColorStop(0.5, '#e2101a'); dg.addColorStop(1, '#9e000c');
  c.fillStyle = dg; c.shadowColor = 'rgba(210,0,24,0.5)'; c.shadowBlur = 18 * s;
  c.beginPath(); c.moveTo(-7 * s, -58 * s); c.quadraticCurveTo(-12 * s, -40 * s, -6 * s, -34 * s); c.quadraticCurveTo(-16 * s, -18 * s, -12 * s + walk * 2 * s, 0); c.quadraticCurveTo(0, 6 * s, 12 * s + walk * 2 * s, 0); c.quadraticCurveTo(16 * s, -18 * s, 6 * s, -34 * s); c.quadraticCurveTo(12 * s, -40 * s, 7 * s, -58 * s); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-7 * s, -58 * s); c.quadraticCurveTo(-8 * s, -70 * s, -5 * s, -76 * s); c.lineTo(5 * s, -76 * s); c.quadraticCurveTo(8 * s, -70 * s, 7 * s, -58 * s); c.closePath(); c.fill();
  c.shadowBlur = 0;
  c.fillStyle = PALETTE.bone; c.beginPath(); c.moveTo(-5 * s, -76 * s); c.quadraticCurveTo(-12 * s, -72 * s, -10 * s, -50 * s); c.lineTo(-7 * s, -50 * s); c.quadraticCurveTo(-8 * s, -70 * s, -3 * s, -74 * s); c.closePath(); c.fill();
  c.beginPath(); c.arc(0, -84 * s, 6.5 * s, 0, TWO_PI); c.fill();
  c.fillStyle = '#070708'; c.beginPath(); c.arc(0, -86 * s, 8 * s, Math.PI * 0.9, Math.PI * 2.2); c.fill();
  c.beginPath(); c.moveTo(6 * s, -88 * s); c.quadraticCurveTo(12 * s, -78 * s, 7 * s, -66 * s); c.quadraticCurveTo(4 * s, -74 * s, 4 * s, -84 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.ellipse(-1 * s, -81 * s, 2.2 * s, 1.1 * s, 0, 0, TWO_PI); c.fill();
  c.restore();
});

defineActor('dealer', function (e) {                          // croupier behind the table (the felt covers his lower half)
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, rim = rimSign(e, this);
  c.save(); c.translate(X, gy);
  c.fillStyle = bodyGrad(c, 70, s, rim);
  c.beginPath(); c.moveTo(-19 * s, 0); c.lineTo(-17 * s, -52 * s); c.quadraticCurveTo(-22 * s, -64 * s, -12 * s, -68 * s); c.quadraticCurveTo(0, -76 * s, 12 * s, -68 * s); c.quadraticCurveTo(22 * s, -64 * s, 17 * s, -52 * s); c.lineTo(19 * s, 0); c.closePath(); c.fill();
  c.fillStyle = '#cdcbc1'; c.beginPath(); c.moveTo(-4 * s, -66 * s); c.lineTo(4 * s, -66 * s); c.lineTo(3 * s, -30 * s); c.lineTo(-3 * s, -30 * s); c.closePath(); c.fill();
  c.fillStyle = '#0c0e13'; c.beginPath(); c.moveTo(-12 * s, -68 * s); c.lineTo(-4 * s, -66 * s); c.lineTo(-3 * s, -30 * s); c.lineTo(-13 * s, -36 * s); c.closePath(); c.moveTo(12 * s, -68 * s); c.lineTo(4 * s, -66 * s); c.lineTo(3 * s, -30 * s); c.lineTo(13 * s, -36 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.moveTo(-4.5 * s, -67 * s); c.lineTo(0, -64 * s); c.lineTo(-4.5 * s, -61 * s); c.closePath(); c.moveTo(4.5 * s, -67 * s); c.lineTo(0, -64 * s); c.lineTo(4.5 * s, -61 * s); c.closePath(); c.fill();
  c.fillStyle = '#7a0008'; c.fillRect(-1.2 * s, -65.5 * s, 2.4 * s, 3 * s);
  c.strokeStyle = '#101319'; c.lineWidth = 7 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-13 * s, -56 * s); c.lineTo(-22 * s, -30 * s); c.moveTo(13 * s, -56 * s); c.lineTo(22 * s, -30 * s); c.stroke();
  c.fillStyle = '#bdbbb0'; c.beginPath(); c.arc(-23 * s, -28 * s, 3.5 * s, 0, TWO_PI); c.arc(23 * s, -28 * s, 3.5 * s, 0, TWO_PI); c.fill();
  c.fillStyle = '#1a1b20'; c.beginPath(); c.arc(0, -80 * s, 8 * s, 0, TWO_PI); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(0, -82 * s, 8 * s, Math.PI, 0); c.fill();
  c.fillStyle = 'rgba(170,135,45,0.6)'; c.beginPath(); c.ellipse(0, -79 * s, 9.5 * s, 3 * s, 0, 0, Math.PI); c.fill();
  c.restore();
}, { castsShadow: false });

defineActor('singer', function (e) {                          // lounge singer at the mic, in a spotlight
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, gown = this.red ? '#cf0a16' : '#cdc9bf';
  c.save(); c.translate(X, gy);
  const sl = c.createRadialGradient(0, -60 * s, 0, 0, -60 * s, 84 * s); sl.addColorStop(0, 'rgba(255,250,230,0.12)'); sl.addColorStop(1, 'rgba(255,250,230,0)'); c.fillStyle = sl; c.beginPath(); c.arc(0, -60 * s, 84 * s, 0, TWO_PI); c.fill();
  shadowPool(c, 0, 4 * s, 22 * s, 6 * s);
  c.fillStyle = gown; c.shadowColor = this.red ? 'rgba(210,0,24,0.4)' : 'rgba(0,0,0,0)'; c.shadowBlur = this.red ? 14 * s : 0;
  c.beginPath(); c.moveTo(-6 * s, -66 * s); c.quadraticCurveTo(-10 * s, -30 * s, -16 * s, 0); c.quadraticCurveTo(0, 5 * s, 16 * s, 0); c.quadraticCurveTo(10 * s, -30 * s, 6 * s, -66 * s); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-6 * s, -66 * s); c.quadraticCurveTo(-7 * s, -78 * s, -4 * s, -84 * s); c.lineTo(4 * s, -84 * s); c.quadraticCurveTo(7 * s, -78 * s, 6 * s, -66 * s); c.closePath(); c.fill(); c.shadowBlur = 0;
  c.strokeStyle = gown; c.lineWidth = 5 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(4 * s, -80 * s); c.lineTo(16 * s, -92 * s); c.stroke();
  c.fillStyle = PALETTE.bone; c.beginPath(); c.arc(16 * s, -92 * s, 3.5 * s, 0, TWO_PI); c.fill();
  c.beginPath(); c.arc(0, -92 * s, 6.5 * s, 0, TWO_PI); c.fill();
  c.fillStyle = '#070708'; c.beginPath(); c.arc(0, -94 * s, 8 * s, Math.PI * 0.85, Math.PI * 2.25); c.fill();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.ellipse(0, -89 * s, 2.2 * s, 1.1 * s, 0, 0, TWO_PI); c.fill();
  c.strokeStyle = PALETTE.ink; c.lineWidth = 2.5 * s; c.beginPath(); c.moveTo(21 * s, -86 * s); c.lineTo(21 * s, 0); c.stroke();
  c.fillStyle = '#1a1d22'; c.beginPath(); c.ellipse(20 * s, -90 * s, 4 * s, 5 * s, 0, 0, TWO_PI); c.fill();
  c.strokeStyle = 'rgba(200,210,225,0.4)'; c.lineWidth = 1; c.beginPath(); c.ellipse(20 * s, -90 * s, 4 * s, 5 * s, 0, 0, TWO_PI); c.stroke();
  c.restore();
});
