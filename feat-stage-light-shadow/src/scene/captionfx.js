// CAPTION FX — builds the torn paper-cut reveal for a narration line as Web Animations keyframes.
// The cut depths and segment lengths vary per line but are seeded, so a replay always draws the same
// edge. Everything is capped (D_MAX, ROWS, SEG) so the tear stays tasteful and never goes crazy.
import { rand32, clamp } from '../engine/math.js';

const D_MAX = 6;        // deepest a cut reaches in from the edge, % of width
const ROWS = [7, 11];   // number of cut segments down the edge, min..max
const SEG = [6, 26];    // each segment's length, min..max, % of height

const r1 = v => +clamp(v, 0, 100).toFixed(1);

// a per-line edge profile: row y positions (uneven) + two depth arrays (one per side for centre-out)
function profile(rng) {
  const n = ROWS[0] + Math.floor(rng() * (ROWS[1] - ROWS[0] + 1));
  const segs = []; for (let i = 0; i < n - 1; i++) segs.push(0.5 + rng());
  const sum = segs.reduce((a, b) => a + b, 0);
  const ys = [0]; let acc = 0;
  for (let i = 0; i < n - 1; i++) { acc += clamp(segs[i] / sum * 100, SEG[0], SEG[1]); ys.push(acc); }
  const span = ys[ys.length - 1]; for (let i = 0; i < ys.length; i++) ys[i] = +(ys[i] / span * 100).toFixed(2);
  const depths = () => ys.map((y, i) => (i === 0 || i === ys.length - 1) ? 0 : clamp(Math.pow(rng(), 1.4) * D_MAX, 0, D_MAX));
  return { ys, dA: depths(), dB: depths() };
}

// a clip-path polygon from per-row left/right edge x positions, walked clockwise
function poly(ys, lx, rx) {
  const n = ys.length, p = [`${lx[0]}% 0%`, `${rx[0]}% 0%`];
  for (let i = 1; i < n; i++) p.push(`${rx[i]}% ${ys[i]}%`);
  p.push(`${lx[n - 1]}% 100%`);
  for (let i = n - 2; i >= 1; i--) p.push(`${lx[i]}% ${ys[i]}%`);
  return `polygon(${p.join(', ')})`;
}

// keyframes for one render: variant = lr | rl | co, mode = in | out. Same seed gives the same teeth
// for a line's entrance and its exit, so the cut looks consistent.
export function capKeyframes(variant, seed, mode) {
  const { ys, dA, dB } = profile(rand32(seed));
  const n = ys.length;
  const frame = (edge, offset) => {
    const lx = [], rx = [];
    for (let i = 0; i < n; i++) { const e = edge(i); lx.push(r1(e[0])); rx.push(r1(e[1])); }
    return { clipPath: poly(ys, lx, rx), offset };
  };

  if (variant === 'co') {                                   // centre out: both edges torn, opening from the middle
    const co = (H, s, o) => frame(i => { const eL = Math.min(dA[i] * s, H * 0.9), eR = Math.min(dB[i] * s, H * 0.9); return [50 - H + eL, 50 + H - eR]; }, o);
    return mode === 'in'
      ? [co(0.6, 0, 0), co(16, 1, 0.32), co(50, 1, 0.72), co(50, 0, 1)]
      : [co(50, 0.6, 0), co(16, 1, 0.6), co(0.6, 0, 1)];
  }
  if (variant === 'rl') {                                   // right to left: a torn left edge sweeps across
    return mode === 'in'
      ? [frame(i => [(100 - D_MAX) + dA[i], 100], 0), frame(i => [dA[i], 100], 0.7), frame(i => [0, 100], 1)]
      : [frame(i => [0, 100 - dA[i]], 0), frame(i => [0, D_MAX - dA[i]], 0.7), frame(i => [0, 0], 1)];
  }
  return mode === 'in'                                      // left to right (default): a torn right edge sweeps across
    ? [frame(i => [0, D_MAX - dA[i]], 0), frame(i => [0, 100 - dA[i]], 0.7), frame(i => [0, 100], 1)]
    : [frame(i => [dA[i], 100], 0), frame(i => [(100 - D_MAX) + dA[i], 100], 0.7), frame(i => [100, 100], 1)];
}
