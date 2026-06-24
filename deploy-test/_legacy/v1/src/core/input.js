// =====================================================================================
//  INPUT — touch first: tap = advance, drag = parallax, hold = call down a lightning
//  strike. Synthetic mouse events that trail a real touch are ignored.
// =====================================================================================
import { Noir } from './engine.js';

Object.assign(Noir, {
  bindInput() {
    let down = 0, lastX = 0, moved = 0, hold = null, lastTouch = 0;
    const dn = x => { if (!this.started) return; lastX = x; moved = 0; down = performance.now(); hold = setTimeout(() => this.lightning = 1, 360); };
    const mv = x => { if (!this.started || !down) return; const dx = x - lastX; lastX = x; moved += Math.abs(dx); this.parTarget = Math.max(-100, Math.min(100, this.parTarget + dx * 0.5)); if (moved > 12 && hold) { clearTimeout(hold); hold = null; } };
    const up = () => { if (!this.started) return; if (hold) { clearTimeout(hold); hold = null; } if (moved < 12 && performance.now() - down < 360) this.advance(); down = 0; };
    // a real touch wins; the browser's synthetic mouse events that trail a tap are ignored
    const ghost = () => performance.now() - lastTouch < 700;
    this.cv.addEventListener('touchstart', e => { lastTouch = performance.now(); dn(e.touches[0].clientX); }, { passive: true });
    this.cv.addEventListener('touchmove', e => { lastTouch = performance.now(); mv(e.touches[0].clientX); }, { passive: true });
    this.cv.addEventListener('touchend', () => { lastTouch = performance.now(); up(); }, { passive: true });
    this.cv.addEventListener('touchcancel', () => { lastTouch = performance.now(); up(); }, { passive: true });
    this.cv.addEventListener('mousedown', e => { if (ghost()) return; dn(e.clientX); });
    addEventListener('mousemove', e => { if (ghost()) return; mv(e.clientX); });
    addEventListener('mouseup', () => { if (ghost()) return; up(); });
  },
});
