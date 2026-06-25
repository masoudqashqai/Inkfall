// POST PASS — the screen-space finish: film grain + vignette, drawn with no camera transform.
// Grain is subtle on the scenes (ANIM.grainAlpha) and heavier on the black THE END screen
// (ANIM.grainAlphaEnd) for an aged-print feel. The central place to evolve the global grade.
import { ANIM } from '../../style/palette.js';

let _vig = null, _vigKey = '';   // vignette gradient cached per size + strength

export function post(e) {
  const c = e.ctx, ended = !!(e.flow && e.flow.ended);

  if (e.grain) {
    c.globalAlpha = ended ? ANIM.grainAlphaEnd : ANIM.grainAlpha;
    const gx = -Math.random() * 80, gy = -Math.random() * 80;
    for (let yy = gy; yy < e.H; yy += 220) for (let xx = gx; xx < e.W; xx += 220) c.drawImage(e.grain, xx, yy);
    c.globalAlpha = 1;
  }

  const vig = ended ? Math.min(0.92, ANIM.vignette + 0.16) : ANIM.vignette;
  const key = `${e.W}x${e.H}:${vig}`;
  if (_vigKey !== key) {
    _vig = c.createRadialGradient(e.W / 2, e.H / 2, Math.min(e.W, e.H) * 0.3, e.W / 2, e.H / 2, Math.max(e.W, e.H) * 0.75);
    _vig.addColorStop(0, 'rgba(0,0,0,0)'); _vig.addColorStop(1, `rgba(0,0,0,${vig})`); _vigKey = key;
  }
  c.fillStyle = _vig; c.fillRect(0, 0, e.W, e.H);
}
