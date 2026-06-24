// SKY PASS — sky gradient, faint stars, and the moon. The moon is a full-moon DISC only; its
// halo is real light from the lighting system (a registered light with glow), not a painted
// gradient, so the bloom composites like every other source. It also lends a faint cool rim
// (large, weak influence) and a long faint floor reflection.
import { PALETTE } from '../../style/palette.js';
import { TWO_PI } from '../../engine/math.js';

let _skyGrad = null, _skyH = 0;   // the sky gradient is constant per height: build once, reuse

export function sky(e) {
  const c = e.ctx, scene = e.scene, R = e.coverRect();
  if (!_skyGrad || _skyH !== e.H) {
    _skyGrad = c.createLinearGradient(0, 0, 0, e.H);
    _skyGrad.addColorStop(0, PALETTE.skyTop); _skyGrad.addColorStop(0.55, PALETTE.skyMid); _skyGrad.addColorStop(1, PALETTE.skyLow);
    _skyH = e.H;
  }
  c.fillStyle = _skyGrad; c.fillRect(R.x, R.y, R.w, R.h);
  c.fillStyle = 'rgba(200,210,230,0.5)';
  for (let i = 0; i < 40; i++) { const sx = (i * 197.3) % e.W, sy = (i * 91.7) % (e.H * 0.4); if ((i * 13) % 5 === 0) c.fillRect(sx, sy, 1.4, 1.4); }

  if (scene.hideMoon || scene.indoor) return;   // no moon when occluded (alley) or indoors (its glow is real light now, so it must not be registered where it can't be seen)
  const m = scene.moon || { x: 0.78, y: 0.18 }, mx = m.x * e.W + scene.camera.look * 0.1, my = m.y * e.H, mr = 34;

  // the moon disc: a soft radially-shaded body with a few faint craters
  const md = c.createRadialGradient(mx - mr * 0.32, my - mr * 0.32, mr * 0.15, mx, my, mr);
  md.addColorStop(0, '#f6f8fc'); md.addColorStop(0.65, PALETTE.moon); md.addColorStop(1, '#bcc4d4');
  c.fillStyle = md; c.beginPath(); c.arc(mx, my, mr, 0, TWO_PI); c.fill();
  c.fillStyle = 'rgba(116,128,152,0.55)';   // darker so they survive the additive halo
  c.beginPath(); c.arc(mx - 9, my - 5, 6, 0, TWO_PI); c.arc(mx + 11, my + 9, 8, 0, TWO_PI); c.arc(mx + 5, my - 13, 3.5, 0, TWO_PI); c.arc(mx - 13, my + 11, 4, 0, TWO_PI); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1; c.beginPath(); c.arc(mx, my, mr, 0, TWO_PI); c.stroke();

  // the moon's halo + floor reflection come from the real lighting system (glow decoupled from
  // the large, weak influence that tints the scene's rim).
  if (my < e.gy) e.addLight({
    x: mx, y: my, col: '210,222,245',
    r: e.H * 0.62, I: 0.3,                       // influence: large + faint (rim/rain tint)
    surface: false, ring: true, glowR: 92, glowI: 2.2, // halo: a real-light RING around the disc (glow, but craters survive)
    reflW: 26, reflI: 0.13, reflLen: 0.8,        // long faint wet-floor streak
  });
}
