// PEOPLE — the noir cast. Motion is read from scene timing (e.lineIdx / e.beat) + per-actor
// params. Every figure now uses the one shared directional ground shadow (v1 mixed blobs,
// directional shadows, and none). The detective's lit cigarette registers as a small warm light.
import { defineActor } from '../../objects/registry.js';
import { PALETTE, ANIM } from '../../style/palette.js';
import { TWO_PI, lerp, smooth01 } from '../../engine/math.js';
import { rimSign, bodyGrad, ember, cigSmoke, drawFedora, drawPistol, muzzleFlash } from '../shared.js';

// cloth albedos (the cast's own material colours, noir-desaturated). bodyGrad shades from these, so
// a dark suit stays dark under a bright light and the detective's pale trench lifts more.
const TRENCH = [120, 112, 94], HEAVY = [54, 58, 66], PINSTRIPE = [44, 46, 56], SUIT = [66, 70, 80];

// a one-shot strike (from the legacy build): rises 0 -> 1 over `rise`, then decays over `fall`, so a
// lighter ignites quickly and settles, instead of starting at full and fading linearly.
const pulse = (b, rise, fall) => b < rise ? smooth01(b / rise) : Math.max(0, 1 - (b - rise) / fall);

// shared detective pose (so emitLight and draw agree without storing state)
function trenchPose(e, p) {
  const s = e.scaleOf(p), X = e.X(p), gy = e.gy + (p.dy || 0) * e.unit, t = e.t, sway = Math.sin(t * ANIM.swaySpeed) * 1.2;
  const aim = p.raiseAt == null ? 1 : (e.lineIdx < p.raiseAt ? 0 : (e.lineIdx === p.raiseAt ? smooth01(e.beat() / 2.2) : 1));
  const litCig = p.lightAt == null ? true : (e.lineIdx >= p.lightAt);
  const flash = (p.lightAt != null && e.lineIdx === p.lightAt) ? pulse(e.beat(), 0.12, 0.6) : 0;
  const hx = lerp(17 * s, 13 * s, aim), hy = lerp(-44 * s, -101 * s, aim);
  return { s, X, gy, t, sway, aim, litCig, flash, hx, hy };
}

defineActor('trenchMan', function (e) {                       // detective: trench coat + fedora
  const c = e.ctx, P = trenchPose(e, this), s = P.s, X = P.X, gy = P.gy, t = P.t, sway = P.sway;
  const rim = rimSign(e, this), tint = e.litTint(X, this);
  c.save(); c.translate(X + sway, gy);
  c.fillStyle = '#050608'; c.fillRect(-13 * s, -32 * s, 11 * s, 32 * s); c.fillRect(3 * s, -32 * s, 11 * s, 32 * s);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(-9 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.ellipse(10 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 96, s, rim, tint, TRENCH);
  c.beginPath(); c.moveTo(-22 * s, -36 * s); c.lineTo(-18 * s, -92 * s); c.lineTo(18 * s, -92 * s); c.lineTo(22 * s, -36 * s); c.quadraticCurveTo(0, -28 * s, -22 * s, -36 * s); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(2 * s, -90 * s); c.lineTo(5 * s, -38 * s); c.stroke();
  c.fillStyle = '#0c0d10'; c.fillRect(-20 * s, -58 * s, 40 * s, 6 * s); c.fillStyle = '#26282e'; c.fillRect(-4 * s, -58 * s, 8 * s, 6 * s);
  const aim = P.aim, litCig = P.litCig, flash = P.flash;
  const hx = P.hx, hy = P.hy, sx = 11 * s, sy = -87 * s;
  // the cigarette arm: its elbow sits ON the shoulder->hand line while the arm is down (so it reads
  // as a straight, relaxed arm with no false bent-arm line), and bows out into a crook only as it
  // raises to the mouth. Driven by aim, so it interpolates cleanly through the raise.
  const ex = sx + (hx - sx) * 0.5 + 14 * s * aim, ey = sy + (hy - sy) * 0.5 + 21 * s * aim;
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#2a2f37'; c.lineWidth = 8.5 * s;
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
  c.beginPath(); c.moveTo(-11 * s, -87 * s); c.lineTo(-16 * s, -42 * s); c.stroke();   // the other arm hangs straight at his side
  c.strokeStyle = 'rgba(150,160,178,0.3)'; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(12 * s, -90 * s); c.lineTo(ex, ey); c.stroke();
  c.fillStyle = '#bcbab0'; c.beginPath(); c.arc(hx, hy, 2.9 * s, 0, TWO_PI); c.arc(-16 * s, -42 * s, 2.9 * s, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 24, s, rim, tint, TRENCH);
  c.beginPath(); c.moveTo(-26 * s, -90 * s); c.quadraticCurveTo(0, -104 * s, 26 * s, -90 * s); c.lineTo(18 * s, -84 * s); c.quadraticCurveTo(0, -94 * s, -18 * s, -84 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.moveTo(-10 * s, -96 * s); c.lineTo(-2 * s, -107 * s); c.lineTo(-1 * s, -92 * s); c.closePath(); c.moveTo(10 * s, -96 * s); c.lineTo(2 * s, -107 * s); c.lineTo(1 * s, -92 * s); c.closePath(); c.fill();
  c.fillStyle = '#15161a'; c.fillRect(-6 * s, -104 * s, 12 * s, 10 * s);
  c.fillStyle = '#1a1b20'; c.beginPath(); c.arc(0, -112 * s, 10 * s, 0, TWO_PI); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(0, -112 * s, 10 * s, Math.PI * 1.15, Math.PI * 1.95); c.fill();
  drawFedora(c, 0, -120 * s, 13 * s, rim);
  if (aim > 0.5) {
    c.save(); c.translate(hx, hy); c.fillStyle = '#d8d2c4'; c.fillRect(2 * s, -1 * s, 7 * s, 2 * s); c.restore();
    if (litCig) { cigSmoke(c, hx + 9 * s, hy, s, t); ember(c, hx + 9 * s, hy, s, t); }
    // the lighter held to the cigarette: a small teardrop flame that flickers for a moment then is
    // gone. Its glow on the scene comes from emitLight (the light system), not a painted gradient.
    if (flash > 0) {
      const lx = hx + 9 * s, ly = hy, fh = (7 + Math.sin(t * 40) * 1.6) * s * (0.5 + 0.5 * flash);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(255,140,40,${0.85 * flash})`; c.beginPath(); c.moveTo(lx - 2.4 * s, ly); c.quadraticCurveTo(lx - 2.2 * s, ly - fh * 0.6, lx, ly - fh); c.quadraticCurveTo(lx + 2.2 * s, ly - fh * 0.6, lx + 2.4 * s, ly); c.quadraticCurveTo(lx, ly + 1.6 * s, lx - 2.4 * s, ly); c.fill();
      c.fillStyle = `rgba(255,242,190,${0.95 * flash})`; c.beginPath(); c.moveTo(lx - 1.1 * s, ly); c.quadraticCurveTo(lx - 1 * s, ly - fh * 0.45, lx, ly - fh * 0.7); c.quadraticCurveTo(lx + 1 * s, ly - fh * 0.45, lx + 1.1 * s, ly); c.quadraticCurveTo(lx, ly + s, lx - 1.1 * s, ly); c.fill();
      c.restore();
    }
  }
  c.restore();
}, {
  shadowW: 22, shadowH: 130,
  shadowSil(e, c) {                                            // coat + shoulders + head + fedora
    const s = e.scaleOf(this);
    c.beginPath(); c.rect(-13 * s, -34 * s, 11 * s, 34 * s); c.rect(3 * s, -34 * s, 11 * s, 34 * s); c.fill();
    c.beginPath(); c.moveTo(-22 * s, -36 * s); c.lineTo(-18 * s, -92 * s); c.lineTo(18 * s, -92 * s); c.lineTo(22 * s, -36 * s); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-26 * s, -90 * s); c.quadraticCurveTo(0, -104 * s, 26 * s, -90 * s); c.lineTo(0, -84 * s); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, -112 * s, 10 * s, 0, TWO_PI); c.fill();
    c.beginPath(); c.ellipse(0, -119 * s, 17 * s, 5 * s, 0, 0, TWO_PI); c.fill();
    c.beginPath(); c.rect(-9 * s, -130 * s, 18 * s, 12 * s); c.fill();
  },
  emitLight(e) {
    const P = trenchPose(e, this);
    if (!(P.aim > 0.5 && P.litCig)) return;
    const cwx = P.X + P.sway + P.hx + 9 * P.s, cwy = P.gy + P.hy;
    e.addLight({ x: cwx, y: cwy, col: '255,150,60', r: 84 * P.s, I: 0.21, ew: 4 * P.s, eh: 4 * P.s, front: true });   // the steady ember
    // its glint on the wet floor, faint for the ember and flaring as the lighter strikes (legacy floorRefl)
    e.addLight({ x: cwx, y: cwy, col: '255,160,70', r: 100 * P.s, I: 0.3, glow: false, wash: false, reflW: (8 + 6 * P.flash) * P.s, reflI: 0.13 + 0.5 * P.flash, reflLen: 0.32 + 0.12 * P.flash });
    // the lighter's flame: a brief, brighter, warmer flare at the instant of lighting, then gone
    if (P.flash > 0) e.addLight({ x: cwx, y: cwy - 4 * P.s, col: '255,214,150', r: 150 * P.s, I: 0.95 * P.flash, ew: 6 * P.s, eh: 9 * P.s, front: true });
  },
});

defineActor('thug', function (e) {                            // the heavy: broad, flat cap, big fists
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, rim = rimSign(e, this);
  c.save(); c.translate(X, gy);
  c.fillStyle = '#050608'; c.fillRect(-18 * s, -36 * s, 15 * s, 36 * s); c.fillRect(3 * s, -36 * s, 15 * s, 36 * s);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(-11 * s, -1 * s, 12 * s, 4 * s, 0, 0, TWO_PI); c.ellipse(12 * s, -1 * s, 12 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 82, s, rim, null, HEAVY);
  c.beginPath(); c.moveTo(-30 * s, -36 * s); c.lineTo(-34 * s, -78 * s); c.quadraticCurveTo(0, -96 * s, 34 * s, -78 * s); c.lineTo(30 * s, -36 * s); c.quadraticCurveTo(0, -28 * s, -30 * s, -36 * s); c.closePath(); c.fill();
  c.fillStyle = '#cfcdc3'; c.beginPath(); c.moveTo(-6 * s, -82 * s); c.lineTo(6 * s, -82 * s); c.lineTo(3 * s, -54 * s); c.lineTo(-3 * s, -54 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.moveTo(-2.5 * s, -80 * s); c.lineTo(2.5 * s, -80 * s); c.lineTo(1.5 * s, -56 * s); c.lineTo(-1.5 * s, -56 * s); c.closePath(); c.fill();
  c.fillStyle = bodyGrad(c, 36, s, rim, null, HEAVY); c.beginPath(); c.moveTo(-12 * s, -84 * s); c.lineTo(-6 * s, -82 * s); c.lineTo(-7 * s, -52 * s); c.lineTo(-16 * s, -56 * s); c.closePath(); c.moveTo(12 * s, -84 * s); c.lineTo(6 * s, -82 * s); c.lineTo(7 * s, -52 * s); c.lineTo(16 * s, -56 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.ink; c.fillRect(-34 * s, -80 * s, 9 * s, 42 * s); c.fillRect(25 * s, -80 * s, 9 * s, 42 * s);
  c.beginPath(); c.arc(-30 * s, -36 * s, 7 * s, 0, TWO_PI); c.arc(30 * s, -36 * s, 7 * s, 0, TWO_PI); c.fill();
  c.fillStyle = '#1a1b20'; c.beginPath(); c.arc(0, -90 * s, 11 * s, 0, TWO_PI); c.fill();
  c.fillStyle = PALETTE.ink; c.beginPath(); c.arc(0, -90 * s, 11 * s, Math.PI * 1.1, Math.PI * 2.0); c.fill();
  c.beginPath(); c.arc(0, -98 * s, 11 * s, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(-9 * s, -98 * s, 9 * s, 3 * s, 0, 0, TWO_PI); c.fill();
  c.restore();
}, {
  shadowW: 34, shadowH: 102,
  shadowSil(e, c) {                                            // broad torso, fists, flat cap
    const s = e.scaleOf(this);
    c.beginPath(); c.rect(-18 * s, -38 * s, 15 * s, 38 * s); c.rect(3 * s, -38 * s, 15 * s, 38 * s); c.fill();
    c.beginPath(); c.moveTo(-30 * s, -36 * s); c.lineTo(-34 * s, -78 * s); c.quadraticCurveTo(0, -96 * s, 34 * s, -78 * s); c.lineTo(30 * s, -36 * s); c.closePath(); c.fill();
    c.beginPath(); c.rect(-34 * s, -80 * s, 9 * s, 44 * s); c.rect(25 * s, -80 * s, 9 * s, 44 * s); c.fill();
    c.beginPath(); c.arc(0, -90 * s, 11 * s, 0, TWO_PI); c.fill();
    c.beginPath(); c.arc(0, -98 * s, 11 * s, Math.PI, 0); c.fill();
  },
});

defineActor('boss', function (e) {                            // mob boss: pinstripe suit, fedora, cigar
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, t = e.t, rim = rimSign(e, this);
  c.save(); c.translate(X, gy);
  c.fillStyle = '#050608'; c.fillRect(-13 * s, -32 * s, 11 * s, 32 * s); c.fillRect(3 * s, -32 * s, 11 * s, 32 * s);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(-9 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.ellipse(10 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 92, s, rim, null, PINSTRIPE);
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
}, {
  shadowW: 24, shadowH: 126,
  shadowSil(e, c) {                                            // suit, head, fedora
    const s = e.scaleOf(this);
    c.beginPath(); c.rect(-13 * s, -34 * s, 11 * s, 34 * s); c.rect(3 * s, -34 * s, 11 * s, 34 * s); c.fill();
    c.beginPath(); c.moveTo(-24 * s, -34 * s); c.lineTo(-20 * s, -88 * s); c.quadraticCurveTo(0, -100 * s, 20 * s, -88 * s); c.lineTo(24 * s, -34 * s); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, -108 * s, 9 * s, 0, TWO_PI); c.fill();
    c.beginPath(); c.ellipse(0, -115 * s, 16 * s, 4.5 * s, 0, 0, TWO_PI); c.fill();
    c.beginPath(); c.rect(-8 * s, -126 * s, 16 * s, 12 * s); c.fill();
  },
  emitLight(e) {                                               // the lit cigar tip is a small warm light, in front of him
    const s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
    e.addLight({ x: X + 19 * s, y: gy - 102.5 * s, col: '255,140,50', r: 60 * s, I: 0.28, ew: 3 * s, eh: 3 * s, front: true });
  },
});

defineActor('gunman', function (e) {                          // shooter, arm extended, muzzle flash on 'muzzle'
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, rim = rimSign(e, this), tint = e.litTint(X, this), flash = e.flags.muzzle || 0;
  c.save(); c.translate(X, gy); if (this.flip) c.scale(-1, 1);
  c.fillStyle = '#050608'; c.fillRect(-12 * s, -32 * s, 10 * s, 32 * s); c.fillRect(4 * s, -32 * s, 10 * s, 32 * s);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(-8 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.ellipse(11 * s, -1 * s, 10 * s, 4 * s, 0, 0, TWO_PI); c.fill();
  c.fillStyle = bodyGrad(c, 88, s, rim, tint, SUIT);
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
}, {
  shadowW: 22, shadowH: 121,
  // the gunshot floods the scene like the original: a warm flash over the cast (front halo) plus real
  // light on the wet floor and the back wall with a reflection, all through the light system.
  emitLight(e) {
    const flash = e.flags.muzzle || 0;
    if (flash <= 0) return;
    const s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, dir = this.flip ? -1 : 1;
    const aim = (this.raiseAt != null) ? (e.lineIdx < this.raiseAt ? 0 : (e.lineIdx === this.raiseAt ? smooth01(e.beat() / 2.4) : 1)) : 1;
    const sy = -86 * s, hx = lerp(13 * s, 34 * s, aim), hy = lerp(-52 * s, -82 * s, aim), ang = Math.atan2(hy - sy, hx - 6 * s);
    const mx = X + dir * (hx + Math.cos(ang) * 18 * s), my = gy + hy + Math.sin(ang) * 18 * s;
    e.addLight({ x: mx, y: my, col: '255,178,90', r: 240 * s, I: flash, ew: 9 * s, eh: 9 * s, front: true });                                   // the flash over the scene
    e.addLight({ x: mx, y: my, col: '255,150,60', r: 300 * s, I: 0.9 * flash, glow: false, reflW: 22 * s, reflI: 0.55 * flash, reflLen: 0.5 }); // floor + wall + the wet shimmer
  },
  shadowSil(e, c) {                                            // suit, head, fedora + the extended gun arm
    const s = e.scaleOf(this);
    if (this.flip) c.scale(-1, 1);
    const aim = (this.raiseAt != null) ? (e.lineIdx < this.raiseAt ? 0 : (e.lineIdx === this.raiseAt ? smooth01(e.beat() / 2.4) : 1)) : 1;
    const sx = 6 * s, sy = -86 * s, hx = lerp(13 * s, 34 * s, aim), hy = lerp(-52 * s, -82 * s, aim);
    c.beginPath(); c.rect(-12 * s, -34 * s, 10 * s, 34 * s); c.rect(4 * s, -34 * s, 10 * s, 34 * s); c.fill();
    c.beginPath(); c.moveTo(-20 * s, -34 * s); c.lineTo(-16 * s, -86 * s); c.quadraticCurveTo(0, -98 * s, 16 * s, -86 * s); c.lineTo(20 * s, -34 * s); c.closePath(); c.fill();
    c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 9 * s; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
    c.beginPath(); c.arc(0, -104 * s, 9 * s, 0, TWO_PI); c.fill();
    c.beginPath(); c.rect(-7 * s, -121 * s, 14 * s, 12 * s); c.fill();
  },
});

defineActor('womanInRed', function (e) {                      // femme fatale — the colour that bleeds
  const c = e.ctx, s = e.scaleOf(this), X = e.walkX(this), gy = e.gy + (this.dy || 0) * e.unit, t = e.t, walk = Math.sin(t * ANIM.walkSpeed);
  if (this.walk) { const i = Math.min(e.lineIdx, this.walk.length - 1), prev = i > 0 ? this.walk[i - 1] : this.walk[0]; e.walkSound(prev !== this.walk[i] && e.beat() < (this.walkDur || 3.4) - 0.2); }
  const rim = rimSign(e, this), tint = e.litTint(X, this), sw = walk * 2 * s;   // sw: the hem drifts as she moves
  c.save(); c.translate(X, gy);
  // a leg through the thigh slit (bone) + a red heel
  c.fillStyle = PALETTE.bone; c.save(); c.translate(walk * 2 * s, 0); c.beginPath(); c.moveTo(-2 * s, -36 * s); c.lineTo(3 * s, -36 * s); c.lineTo(4 * s, -2 * s); c.lineTo(0, -2 * s); c.closePath(); c.fill(); c.restore();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.moveTo(sw, -2 * s); c.lineTo(8 * s + sw, 0); c.lineTo(sw, 1 * s); c.closePath(); c.fill();
  // slim bone arms with a soft bend, hands resting at the waist
  c.strokeStyle = PALETTE.bone; c.lineWidth = 3.2 * s; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-7 * s, -70 * s); c.lineTo(-12 * s, -56 * s); c.lineTo(-9 * s, -44 * s); c.stroke();
  c.beginPath(); c.moveTo(7 * s, -70 * s); c.lineTo(12 * s, -56 * s); c.lineTo(9 * s, -44 * s); c.stroke();
  // a slim neck (bone) so the head meets the gown
  c.fillStyle = PALETTE.bone; c.beginPath(); c.moveTo(-2.5 * s, -80 * s); c.lineTo(2.5 * s, -80 * s); c.lineTo(2 * s, -68 * s); c.lineTo(-2 * s, -68 * s); c.closePath(); c.fill();
  // the gown: shaded by the lighting system (a red material, lit edge toward the light, not a baked
  // sheen), sweetheart neckline, cinched waist, curvy hips, a long mermaid skirt. The soft red bleed
  // is her motif (the colour that bleeds).
  c.fillStyle = bodyGrad(c, 80, s, rim, tint, [205, 14, 24]); c.shadowColor = 'rgba(210,0,24,0.45)'; c.shadowBlur = 16 * s;
  c.beginPath();
  c.moveTo(-9 * s, -66 * s);                                   // left bust
  c.quadraticCurveTo(-5 * s, -52 * s, -5 * s, -48 * s);        // into the cinched waist
  c.quadraticCurveTo(-15 * s, -30 * s, -12 * s + sw, 0);       // hip flares out to the hem
  c.quadraticCurveTo(0, 6 * s, 12 * s + sw, 0);                // hem
  c.quadraticCurveTo(15 * s, -30 * s, 5 * s, -48 * s);         // right hip back to the waist
  c.quadraticCurveTo(5 * s, -52 * s, 9 * s, -66 * s);          // waist up to the right bust
  c.quadraticCurveTo(7 * s, -74 * s, 3 * s, -72 * s);          // right cup
  c.quadraticCurveTo(0, -67 * s, -3 * s, -72 * s);             // the sweetheart dip
  c.quadraticCurveTo(-7 * s, -74 * s, -9 * s, -66 * s);        // left cup
  c.closePath(); c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = '#b8000d'; c.lineWidth = 1.3 * s;            // thin shoulder straps
  c.beginPath(); c.moveTo(-6 * s, -73 * s); c.lineTo(-3 * s, -82 * s); c.moveTo(6 * s, -73 * s); c.lineTo(3 * s, -82 * s); c.stroke();
  // head (bone), dark bob, red lips
  c.fillStyle = PALETTE.bone; c.beginPath(); c.arc(0, -84 * s, 6.5 * s, 0, TWO_PI); c.fill();
  c.fillStyle = '#070708'; c.beginPath(); c.arc(0, -86 * s, 8 * s, Math.PI * 0.9, Math.PI * 2.2); c.fill();
  c.beginPath(); c.moveTo(6 * s, -88 * s); c.quadraticCurveTo(12 * s, -78 * s, 7 * s, -66 * s); c.quadraticCurveTo(4 * s, -74 * s, 4 * s, -84 * s); c.closePath(); c.fill();
  c.fillStyle = PALETTE.redHot; c.beginPath(); c.ellipse(-1 * s, -81 * s, 2.2 * s, 1.1 * s, 0, 0, TWO_PI); c.fill();
  c.restore();
}, {
  shadowW: 15, shadowH: 91,
  shadowSil(e, c) {                                            // the shapely gown + head
    const s = e.scaleOf(this);
    c.beginPath();
    c.moveTo(-9 * s, -66 * s); c.quadraticCurveTo(-5 * s, -52 * s, -5 * s, -48 * s); c.quadraticCurveTo(-15 * s, -30 * s, -12 * s, 0);
    c.quadraticCurveTo(0, 6 * s, 12 * s, 0); c.quadraticCurveTo(15 * s, -30 * s, 5 * s, -48 * s); c.quadraticCurveTo(5 * s, -52 * s, 9 * s, -66 * s);
    c.quadraticCurveTo(7 * s, -74 * s, 0, -72 * s); c.quadraticCurveTo(-7 * s, -74 * s, -9 * s, -66 * s); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, -84 * s, 7 * s, 0, TWO_PI); c.fill();
  },
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
}, {
  shadowW: 16, shadowH: 90,
  shadowSil(e, c) {                                            // gown + head, cast by the overhead spotlight
    const s = e.scaleOf(this);
    c.beginPath(); c.moveTo(-6 * s, -66 * s); c.quadraticCurveTo(-10 * s, -30 * s, -16 * s, 0); c.quadraticCurveTo(0, 5 * s, 16 * s, 0); c.quadraticCurveTo(10 * s, -30 * s, 6 * s, -66 * s); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, -86 * s, 8 * s, 0, TWO_PI); c.fill();
  },
  emitLight(e) {                                               // the spotlight is a real overhead light (was a hand-drawn cone)
    const s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
    e.addLight({ x: X, y: gy - 150 * s, col: '255,250,230', r: 110 * s, I: 0.5, ew: 7 * s, eh: 7 * s, shade: true, beam: { dir: 0, len: 150 * s, farW: 46 * s, I: 0.6 } });
  },
});
