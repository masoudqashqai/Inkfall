import { Audio2 } from '../core/audio.js';

// ejected brass casings: spawned on a muzzle flash, tumbling and settling in slow motion
export const Shells = {
  list: [],
  spawn(x, y, s, gy) { this.list.push({ x, y, s, gy, vx: 0.2 + Math.random() * 0.7, vy: -2.6 - Math.random() * 1.0, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.7, rest: false }); },
  clear() { this.list.length = 0; },
  draw(e) {
    const c = e.ctx, sdt = Math.min(e.dt, 0.05) * 0.32;
    for (const sh of this.list) {
      if (!sh.rest) {
        sh.vy += 16 * sdt; sh.x += sh.vx * 60 * sdt; sh.y += sh.vy * 60 * sdt; sh.rot += sh.vr * sdt * 18;
        if (sh.y >= sh.gy) { if (sh.vy > 1.0) Audio2.shellClink(); sh.y = sh.gy; sh.vy *= -0.34; sh.vx *= 0.5; sh.vr *= 0.5; if (Math.abs(sh.vy) < 0.7) { sh.rest = true; sh.vy = 0; } }
      }
      c.save(); c.translate(sh.x, sh.y); c.rotate(sh.rot);
      c.fillStyle = '#c9a24a'; c.fillRect(-3.4 * sh.s, -1.4 * sh.s, 6.8 * sh.s, 2.8 * sh.s);
      c.fillStyle = '#e6c878'; c.fillRect(-3.4 * sh.s, -1.4 * sh.s, 2 * sh.s, 2.8 * sh.s);
      c.restore();
    }
  },
};
