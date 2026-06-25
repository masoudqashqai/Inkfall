// ATMOSPHERE — drifting steam, a sweeping rooftop searchlight, and a tabloid that blows in.
import { defineEffect } from '../../objects/registry.js';
import { smooth01, lerp } from '../../engine/math.js';

defineEffect('steam', function (e) {
  const c = e.ctx, X = e.X(this), gy = (this.y != null ? this.y * e.H : e.gy), t = e.t, seed = this.seed || 0;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { const life = ((t * 0.25 + i * 0.2 + seed) % 1), y = gy - life * 150, r = 8 + life * 46, a = 0.10 * (1 - life); c.fillStyle = `rgba(200,210,225,${a})`; c.beginPath(); c.arc(X + Math.sin(t + i + seed) * 14, y, r, 0, Math.PI * 2); c.fill(); }
  c.restore();
});

// a distant searchlight sweeping the sky. It is now a lighting-system beam (was a hand-drawn cone):
// emitLight registers an upward sweeping beam with negligible influence, so it lights nothing on the
// ground, it is purely the shaft of light in the air. No glow, washes or reflection.
defineEffect('searchlight', function (e) {}, {
  emitLight(e) {
    e.addLight({
      x: (this.x || 0.5) * e.W, y: e.H, col: '190,200,220',
      r: 1, I: 0, glow: false, surface: false, refl: false, wash: false,
      beam: { dir: Math.PI, len: e.H, farW: 70 * (this.scale || 1), I: this.intensity || 0.34, sweep: 0.5, sweepSpeed: 0.4 },
    });
  },
});

defineEffect('newspaper', function (e) {                      // blows in from the left, tumbles, settles
  const c = e.ctx, st = e.sceneT(), pP = smooth01(st / 4.5), tumbling = pP < 0.97;
  const k = e.scaleOf(this) * 0.6;   // scale with the viewport like every other asset (0.6 keeps the reference-desktop size); was fixed px, so it stayed big on mobile
  const restX = (this.restX != null ? this.restX : 0.2) * e.W;
  const px = lerp(-50 * k, restX, pP), py = tumbling ? (e.gy - 6 * k - Math.abs(Math.sin(st * 3)) * 50 * k * (1 - pP)) : (e.gy + 16 * k), rot = tumbling ? Math.sin(st * 5) : 0.1;
  const w = 72, h = 48;
  c.save(); c.translate(px, py); c.rotate(rot); c.scale(k, k);
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
