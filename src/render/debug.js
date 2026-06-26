// STAGE DEBUG OVERLAY — draws the scene's hidden geometry on top of the frame so a designer can see
// exactly what the light and shadow systems see: the floor line, the wall band and any openings in
// it, every light with its influence radius and where its beam lands, and every cast object's anchor
// point. This is how the "effect landed on a surface that is not there" class of bug is caught at
// author time instead of by squinting at the rendered scene. Toggled from the Shadow & Light lab.
import { stageOf } from './stage.js';

export const DEBUG = { stage: false };

const dot = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };

export function drawStageDebug(e) {
  const c = e.ctx, st = stageOf(e), R = e.coverRect(), x0 = R.x, x1 = R.x + R.w;
  c.save();
  c.lineWidth = 1.5; c.font = '11px "Courier New",monospace'; c.textBaseline = 'bottom';

  // FLOOR — the ground line every scene has
  c.strokeStyle = 'rgba(0,220,255,0.9)'; c.beginPath(); c.moveTo(x0, st.gy); c.lineTo(x1, st.gy); c.stroke();
  c.fillStyle = 'rgba(0,220,255,0.95)'; c.fillText('floor', x0 + 8, st.gy - 3);

  // WALLS — each real wall segment a shadow can climb. A finite side edge of a segment is an opening
  // (red): there is no wall beyond it, so nothing should climb past it.
  for (const w of st.walls) {
    c.strokeStyle = 'rgba(255,90,210,0.9)'; c.beginPath(); c.moveTo(Math.max(x0, w.x0), w.top); c.lineTo(Math.min(x1, w.x1), w.top); c.stroke();
    c.strokeStyle = 'rgba(255,70,70,0.9)';
    if (w.x0 > x0) { c.beginPath(); c.moveTo(w.x0, w.top); c.lineTo(w.x0, st.gy); c.stroke(); }
    if (w.x1 < x1) { c.beginPath(); c.moveTo(w.x1, w.top); c.lineTo(w.x1, st.gy); c.stroke(); }
  }
  if (st.walls.length) { c.fillStyle = 'rgba(255,90,210,0.95)'; c.fillText('wall', x0 + 8, st.walls[0].top + 12); }

  // LIGHTS — position, influence radius, and where a beam lands (front lights warm, scene lights yellow)
  for (const L of e.lights) {
    const col = L.front ? 'rgba(255,170,40,0.95)' : 'rgba(255,240,120,0.95)';
    c.strokeStyle = 'rgba(255,240,120,0.28)'; c.beginPath(); c.arc(L.x, L.y, L.r, 0, Math.PI * 2); c.stroke();
    dot(c, L.x, L.y, 5, col);
    if (L.beam) {
      const b = L.beam, len = b.len != null ? b.len : 200, fx = L.x + Math.sin(b.dir || 0) * len, fy = L.y + Math.cos(b.dir || 0) * len;
      c.strokeStyle = 'rgba(120,220,255,0.8)'; c.beginPath(); c.moveTo(L.x, L.y); c.lineTo(fx, fy); c.stroke();
      dot(c, fx, fy, 4, fy > st.gy + 2 ? 'rgba(255,60,60,0.95)' : 'rgba(120,220,255,0.95)');   // red if the beam lands below the floor
    }
  }

  // RAISED SURFACES — table tops and the like that props expose (green line)
  c.strokeStyle = 'rgba(90,255,130,0.9)';
  for (const s of (e.surfaces || [])) { c.beginPath(); c.moveTo(s.x0, s.y); c.lineTo(s.x1, s.y); c.stroke(); c.fillStyle = 'rgba(90,255,130,0.95)'; c.fillText(s.id, s.x0 + 6, s.y - 3); }

  // CAST — each object's resolved anchor. Red only when it asked to sit `on` a surface that is not
  // there (the real authoring mistake, it fell back to the floor); free placements read green.
  for (const o of e.scene.castObjects(e)) {
    const t = e.place(o), bx = t.x, by = t.anchorY;
    const badAnchor = o.on && !(e.surfaces || []).some(su => su.id === o.on && bx >= su.x0 && bx <= su.x1);
    dot(c, bx, by, 4, badAnchor ? 'rgba(255,80,80,0.95)' : 'rgba(90,255,130,0.95)');
  }
  c.restore();
}
