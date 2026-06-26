// VEHICLES — the red car. It can glide on a `walk` path (pulling away when the light turns
// green) and registers its head + tail lamps as lights (drawn by the lighting pass).
import { defineMover } from '../../objects/registry.js';
import { PALETTE } from '../../style/palette.js';
import { TWO_PI } from '../../engine/math.js';

defineMover('redCar', function (e) {
  const c = e.ctx, s = e.scaleOf(this), X = e.walkX(this), gy = e.gy + (this.dy || 0) * e.unit;
  const P = pts => { c.beginPath(); c.moveTo(pts[0][0] * s, pts[0][1] * s); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * s, pts[i][1] * s); c.closePath(); };
  c.save(); c.translate(X, gy); c.scale(this.flip ? 1 : -1, 1);   // authored front-left; default faces RIGHT (its travel direction)

  // the floor shadow is cast by the shadow system now (castsShadow + shadowSil below). The coloured
  // wet glow comes from the head/tail lamps via the lighting pass, not a red box.

  // chrome bumpers (dim steel), front-left + rear-right, behind the body
  for (const [x0, x1] of [[-82, -66], [66, 82]]) { const sg = c.createLinearGradient(0, -16 * s, 0, -7 * s); sg.addColorStop(0, '#454a52'); sg.addColorStop(1, '#1b1f25'); c.fillStyle = sg; c.fillRect(x0 * s, -16 * s, (x1 - x0) * s, 9 * s); }

  // BODY — a boxy 1980s American sedan, front to the LEFT. Deep oxblood: dark + noir, on the red motif.
  const body = [[-78, -9], [-78, -21], [-72, -31], [-30, -34], [-26, -34], [-13, -54], [-7, -55], [29, -55], [41, -37], [71, -35], [76, -34], [78, -23], [78, -9]];
  const bg = c.createLinearGradient(0, -55 * s, 0, -9 * s); bg.addColorStop(0, '#54111b'); bg.addColorStop(0.5, '#3a0c14'); bg.addColorStop(1, '#22070e');
  c.fillStyle = bg; P(body); c.fill();
  // beltline crease (a hard chrome trim line, the 80s look)
  c.strokeStyle = 'rgba(158,52,66,0.5)'; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(-76 * s, -35 * s); c.lineTo(77 * s, -36 * s); c.stroke();

  // black-tinted glass greenhouse (dim), with a B-pillar splitting front + rear windows
  c.fillStyle = '#0a0c12'; P([[-22, -35], [-12, -52], [27, -52], [38, -37]]); c.fill();
  c.fillStyle = 'rgba(125,145,175,0.08)'; P([[-12, -51], [-1, -51], [-13, -37], [-20, -37]]); c.fill();   // faint reflection streak
  c.fillStyle = '#1c0a0f'; c.fillRect(6 * s, -52 * s, 3.5 * s, 17 * s);                                      // B-pillar

  // door seams + handles
  c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1 * s; c.beginPath(); c.moveTo(-30 * s, -34 * s); c.lineTo(-30 * s, -9 * s); c.moveTo(8 * s, -35 * s); c.lineTo(8 * s, -9 * s); c.moveTo(40 * s, -37 * s); c.lineTo(40 * s, -9 * s); c.stroke();
  c.fillStyle = 'rgba(165,170,180,0.45)'; c.fillRect(-22 * s, -31 * s, 7 * s, 1.6 * s); c.fillRect(18 * s, -32 * s, 7 * s, 1.6 * s);

  // FRONT (left): grille (the sealed-beam headlight is emissive, drawn in glow())
  c.fillStyle = '#0c0e12'; c.fillRect(-78 * s, -30 * s, 7 * s, 14 * s);
  c.strokeStyle = 'rgba(92,98,110,0.5)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo((-77 + i * 2.4) * s, -30 * s); c.lineTo((-77 + i * 2.4) * s, -16 * s); c.stroke(); }

  // wheels: on top, sitting on the ground, with squared 80s wheel arches
  for (const wx of [-44, 46]) {
    c.strokeStyle = '#1c0a0f'; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo((wx - 14) * s, -24 * s); c.lineTo((wx - 14) * s, -12 * s); c.lineTo((wx + 14) * s, -12 * s); c.lineTo((wx + 14) * s, -24 * s); c.stroke();
    c.fillStyle = '#101216'; c.beginPath(); c.arc(wx * s, -12 * s, 12 * s, 0, TWO_PI); c.fill();   // bottom sits on the ground (y 0)
    c.fillStyle = '#2c313a'; c.beginPath(); c.arc(wx * s, -12 * s, 5.5 * s, 0, TWO_PI); c.fill();
    c.fillStyle = '#0a0b0e'; c.beginPath(); c.arc(wx * s, -12 * s, 2 * s, 0, TWO_PI); c.fill();
  }
  c.restore();
}, {
  shadowW: 82, shadowH: 55, spec: 0.22,                       // waxed bodywork catches a rolling highlight
  glow(e) {                                                   // EMISSIVE: the sealed-beam headlight + the red tail light
    const c = e.ctx, s = e.scaleOf(this), X = e.walkX(this), gy = e.gy + (this.dy || 0) * e.unit;
    c.save(); c.translate(X, gy); c.scale(this.flip ? 1 : -1, 1);
    c.fillStyle = '#ffe7ad'; c.shadowColor = '#ffe7ad'; c.shadowBlur = 8; c.fillRect(-71 * s, -30 * s, 5 * s, 7 * s);
    c.fillStyle = 'rgba(255,46,42,0.95)'; c.shadowColor = PALETTE.ember; c.shadowBlur = 10; c.fillRect(72 * s, -31 * s, 5 * s, 10 * s);
    c.restore();
  },
  shadowSil(e, c) {                                            // the car body footprint, cast on the wet floor
    const s = e.scaleOf(this);
    const body = [[-78, -9], [-78, -21], [-72, -31], [-30, -34], [-26, -34], [-13, -54], [-7, -55], [29, -55], [41, -37], [71, -35], [76, -34], [78, -23], [78, -9]];
    c.beginPath(); c.moveTo(body[0][0] * s, body[0][1] * s); for (let i = 1; i < body.length; i++) c.lineTo(body[i][0] * s, body[i][1] * s); c.closePath(); c.fill();
    c.fillRect(-80 * s, -12 * s, 160 * s, 12 * s);
    for (const wx of [-44, 46]) { c.beginPath(); c.arc(wx * s, -12 * s, 12 * s, 0, TWO_PI); c.fill(); }
  },
  emitLight(e) {
    const s = e.scaleOf(this), X = e.walkX(this), gy = e.gy + (this.dy || 0) * e.unit, ly = gy - 9 * s, dir = this.flip ? -1 : 1;
    e.addLight({ x: X + dir * 78 * s, y: ly, col: '255,238,196', r: 150 * s, I: 0.5, ew: 10 * s, eh: 7 * s });   // headlight (front)
    e.addLight({ x: X - dir * 74 * s, y: ly, col: '255,40,30', r: 90 * s, I: 0.42, ew: 8 * s, eh: 6 * s });        // tail (rear)
  },
});
