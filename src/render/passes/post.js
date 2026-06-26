// POST PASS — the screen-space finish: film grain + vignette, drawn with no camera transform.
// Grain is subtle on the scenes (ANIM.grainAlpha) and heavier on the black THE END screen
// (ANIM.grainAlphaEnd) for an aged-print feel. The central place to evolve the global grade.
import { ANIM, NOIR, FILM } from '../../style/palette.js';

let _vig = null, _vigKey = '';   // vignette gradient cached per size + strength
let _bloom = null, _bw = 0, _bh = 0;   // small offscreen for the bloom (downscale = a cheap blur)

// FILMIC FINISH — bloom on the highlights, a warm tint in the highlights, and a gentle contrast S.
// Reads the composited frame (the main canvas itself) so it grades the whole picture together. The
// bloom must NOT lift the noir blacks, so it isolates only the genuinely bright sources (neon, the
// moon, headlights): a downscaled copy is raised to the FOURTH power (squared twice), which crushes
// midtones to nothing while keeping highlights, then added back blurred. No per-pixel work, no blur.
function filmic(e) {
  const c = e.ctx, cv = e.main.canvas, W = e.W, H = e.H;
  if (FILM.bloom > 0) {
    const bw = Math.max(1, cv.width >> 2), bh = Math.max(1, cv.height >> 2);
    if (!_bloom) _bloom = document.createElement('canvas');
    if (_bw !== bw || _bh !== bh) { _bloom.width = _bw = bw; _bloom.height = _bh = bh; }
    const b = _bloom.getContext('2d');
    b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, bw, bh); b.drawImage(cv, 0, 0, bw, bh);
    b.globalCompositeOperation = 'multiply'; b.drawImage(_bloom, 0, 0); b.drawImage(_bloom, 0, 0);   // ^4: highlights only, no midtone haze
    b.globalCompositeOperation = 'source-over';
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = FILM.bloom; c.imageSmoothingEnabled = true;
    c.drawImage(_bloom, 0, 0, bw, bh, 0, 0, W, H); c.restore();
  }
  // a gentle warm temperature via soft-light (kept low so it tints rather than lifts the picture).
  if (FILM.temp > 0) { c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = FILM.temp; c.fillStyle = `rgb(${FILM.warm})`; c.fillRect(0, 0, W, H); c.restore(); }
  if (FILM.contrast > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'overlay'; c.globalAlpha = FILM.contrast; c.drawImage(cv, 0, 0); c.restore(); }
}

export function post(e) {
  const c = e.ctx, ended = !!(e.flow && e.flow.ended);

  // NOIR GRADE — over the fully composited frame. First pull saturation out (a grey fill through the
  // 'saturation' blend leaves luma + hue but flattens chroma, so the world goes toward black and
  // white while the most saturated sources keep the most colour), then a faint cool tint. One pass,
  // so everything grades together. Skipped on the black THE END screen (nothing to grade).
  if (!ended) {
    if (NOIR.saturation < 1) { c.save(); c.globalCompositeOperation = 'saturation'; c.globalAlpha = 1 - NOIR.saturation; c.fillStyle = '#808080'; c.fillRect(0, 0, e.W, e.H); c.restore(); }
    if (NOIR.tintAmt > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = NOIR.tintAmt; c.fillStyle = `rgb(${NOIR.tint})`; c.fillRect(0, 0, e.W, e.H); c.restore(); }
    filmic(e);   // bloom + temperature + contrast, the filmic finish over the graded frame
  }

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
