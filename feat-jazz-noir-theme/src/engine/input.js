// INPUT — touch first: tap = advance, drag = camera look, hold = call down lightning. Synthetic
// mouse events that trail a real touch are ignored.
export function bindInput(cv, { isReady, onTap, onDrag, onHold }) {
  let down = 0, lastX = 0, moved = 0, hold = null, lastTouch = 0;
  const dn = x => { if (!isReady()) return; lastX = x; moved = 0; down = performance.now(); hold = setTimeout(onHold, 360); };
  const mv = x => { if (!isReady() || !down) return; const dx = x - lastX; lastX = x; moved += Math.abs(dx); onDrag(dx); if (moved > 12 && hold) { clearTimeout(hold); hold = null; } };
  const up = () => { if (!isReady()) return; if (hold) { clearTimeout(hold); hold = null; } if (moved < 12 && performance.now() - down < 360) onTap(); down = 0; };
  const ghost = () => performance.now() - lastTouch < 700;
  cv.addEventListener('touchstart', e => { lastTouch = performance.now(); dn(e.touches[0].clientX); }, { passive: true });
  cv.addEventListener('touchmove', e => { lastTouch = performance.now(); mv(e.touches[0].clientX); }, { passive: true });
  cv.addEventListener('touchend', () => { lastTouch = performance.now(); up(); }, { passive: true });
  cv.addEventListener('touchcancel', () => { lastTouch = performance.now(); up(); }, { passive: true });
  cv.addEventListener('mousedown', e => { if (ghost()) return; dn(e.clientX); });
  addEventListener('mousemove', e => { if (ghost()) return; mv(e.clientX); });
  addEventListener('mouseup', () => { if (ghost()) return; up(); });
}
