// ANIMALS — an alley cat with a glowing eye, and crows that lift off in slow motion.
import { defineActor } from '../../objects/registry.js';
import { PALETTE } from '../../style/palette.js';
import { TWO_PI, clamp01, smooth01 } from '../../engine/math.js';

defineActor('cat', function (e) {
  const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit, t = e.t;
  c.save(); c.translate(X, gy); if (this.flip) c.scale(-1, 1);
  c.fillStyle = PALETTE.ink; c.beginPath(); c.ellipse(0, -5 * s, 12 * s, 5 * s, 0, 0, TWO_PI); c.fill();
  c.fillRect(-11 * s, -6 * s, 2.5 * s, 6 * s); c.fillRect(8 * s, -6 * s, 2.5 * s, 6 * s);
  c.beginPath(); c.arc(11 * s, -12 * s, 4 * s, 0, TWO_PI); c.fill();
  c.beginPath(); c.moveTo(8 * s, -15 * s); c.lineTo(9 * s, -20 * s); c.lineTo(11 * s, -15 * s); c.closePath(); c.moveTo(11 * s, -15 * s); c.lineTo(13 * s, -20 * s); c.lineTo(14 * s, -15 * s); c.closePath(); c.fill();
  c.strokeStyle = PALETTE.ink; c.lineWidth = 2.5 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(-11 * s, -6 * s); c.quadraticCurveTo(-20 * s, -10 * s + Math.sin(t * 2) * 3 * s, -16 * s, -18 * s); c.stroke();
  c.restore();
}, {
  castsShadow: false,
  glow(e) {                                                   // EMISSIVE: the glowing eye
    const c = e.ctx, s = e.scaleOf(this), X = e.X(this), gy = e.gy + (this.dy || 0) * e.unit;
    c.save(); c.translate(X, gy); if (this.flip) c.scale(-1, 1);
    c.fillStyle = PALETTE.amber; c.shadowColor = PALETTE.amber; c.shadowBlur = 4; c.beginPath(); c.arc(12.5 * s, -12 * s, 1 * s, 0, TWO_PI); c.fill();
    c.restore();
  },
});

// how far through its lift-off the crow is (0 resting, 1 gone). Shared by the draw and the transform
// so the lit layer is scoped to where the bird actually is mid-flight.
const crowFly = (e, n) => (n.flyAt != null && e.lineIdx >= n.flyAt) ? clamp01((smooth01(e.beat() / 11) - (n.delay || 0)) / (1 - (n.delay || 0))) : 0;

defineActor('crow', function (e) {                            // faces right; flies off in slow motion on flyAt
  const c = e.ctx, t = e.t, sc = (this.scale || 1);
  const fly = crowFly(e, this);
  if (fly >= 0.99) return;
  const X = e.X(this) + fly * e.W * 0.5, y = this.y * e.H - fly * e.H * 0.6, flying = fly > 0.02;
  const w = Math.sin(t * (flying ? 2.4 : 1.0)) * 0.5 + 0.5, wingTipY = -2 - (flying ? 13 : 4) * w, tail = Math.sin(t * 1.6) * 2.2;
  c.save(); c.translate(X, y); c.scale(-sc, sc); c.globalAlpha = 1 - fly; c.fillStyle = PALETTE.ink;
  c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, TWO_PI); c.fill();
  c.beginPath(); c.arc(-6, -3, 3, 0, TWO_PI); c.fill(); c.fillRect(-10, -3, 4, 1.4);
  c.beginPath(); c.moveTo(5, -1); c.quadraticCurveTo(11, 1 + tail, 14, 2 + tail); c.lineTo(5, 2); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2, -1); c.quadraticCurveTo(8, wingTipY * 0.6, 13, wingTipY); c.quadraticCurveTo(8, 1, 3, 1.5); c.closePath(); c.fill();
  if (!flying) c.fillRect(1, 4, 1.4, 5);
  c.restore(); c.globalAlpha = 1;
}, {
  castsShadow: false,
  // declares its in-flight position so the lit layer follows it across and up (no unlit workaround)
  xform(e) { const fly = crowFly(e, this); return { x: e.X(this) + fly * e.W * 0.5, anchorY: this.y * e.H - fly * e.H * 0.6 }; },
});
