// CAMERA — the single owner of how the world maps to the screen: a horizontal "look"
// offset (drag parallax), an establishing zoom, and a decaying shake. Objects keep their
// own parallax factor `par`; the camera supplies the shared `look` they multiply by.
import { ANIM } from '../style/palette.js';

export class Camera {
  constructor() {
    this.look = 0; this.lookTarget = 0;     // drag parallax (-100..100)
    this.zoom = 1; this.focal = { x: 0, y: 0 };
    this.shakeAmt = 0; this.shx = 0; this.shy = 0;
  }
  dragBy(dx) { this.lookTarget = Math.max(-100, Math.min(100, this.lookTarget + dx * 0.5)); }
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
  reset() { this.look = this.lookTarget = 0; this.zoom = 1; this.shakeAmt = 0; }

  update(dt) {
    this.look += (this.lookTarget - this.look) * ANIM.parallaxLerp;
    if (this.shakeAmt > 0.001) {
      this.shx = (Math.random() - 0.5) * this.shakeAmt; this.shy = (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 60);
    } else { this.shx = this.shy = this.shakeAmt = 0; }
  }

  // apply zoom (around the focal point) + shake to a context; caller wraps in save/restore
  apply(ctx) {
    if (this.shx || this.shy) ctx.translate(this.shx, this.shy);
    if (this.zoom !== 1) { ctx.translate(this.focal.x, this.focal.y); ctx.scale(this.zoom, this.zoom); ctx.translate(-this.focal.x, -this.focal.y); }
  }
}
