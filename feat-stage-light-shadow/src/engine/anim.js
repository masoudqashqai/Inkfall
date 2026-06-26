// ANIM — a tiny keyframe TRACK sampler, the engine's animation primitive. A track is a list of
// keyframes [{ t, v, ease? }] sorted by time t (seconds), holding flat before the first and after
// the last. Easing is per segment (named on the destination keyframe). Objects animate by carrying
// `tracks` (data), which the Frame samples into the coordinate helpers, so a tracked x/y/scale flows
// through place() to the renderer, shadows, depth sort and bounds with no per-asset code.
import { lerp, smooth01, clamp01 } from './math.js';

const EASES = {
  linear: u => u,
  in: u => u * u,                       // ease in (slow start)
  out: u => 1 - (1 - u) * (1 - u),      // ease out (slow stop)
  inout: u => smooth01(u),              // smoothstep (slow start + stop)
};

// sample a track at time t. Returns null for an absent or empty track, so a caller falls back to the
// object's static value (tracks are always opt-in, never change an untracked object).
export function sampleTrack(track, t) {
  if (!track || !track.length) return null;
  if (t <= track[0].t) return track[0].v;
  const n = track.length;
  if (t >= track[n - 1].t) return track[n - 1].v;
  let i = 1;
  while (i < n && track[i].t <= t) i++;
  const a = track[i - 1], b = track[i], span = b.t - a.t || 1;
  const u = clamp01((t - a.t) / span);
  return lerp(a.v, b.v, (EASES[b.ease] || EASES.linear)(u));
}
