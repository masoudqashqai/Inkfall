// TRANSITION PASS — the comic-panel ink wipe between scenes and the act-name title card shown
// over the covered frame. Screen-space; the scene/manager drives the state machine.
import { TWO_PI, rand32 } from '../../engine/math.js';
import { ANIM } from '../../style/palette.js';

export function transition(e) {
  const f = e.flow;
  if (f.transState === 'card' || f.transState === 'title') { panelWipe(e, 1); drawCard(e); }
  else if (f.transAlpha > 0) panelWipe(e, f.transAlpha);
  if (f.finishing || f.ended) drawEnd(e);   // rises over the closing wipe and stays through the reveal
}

// the closing "THE END" title, fading in over the frozen, desaturated final scene
function drawEnd(e) {
  const c = e.ctx, a = Math.min(1, (e.t - e.flow.endStart) / 1.6);
  c.save(); c.globalAlpha = a; c.fillStyle = '#ece6d6'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `600 ${Math.round(Math.min(e.W, e.H) * 0.085)}px "Oswald",sans-serif`;
  if ('letterSpacing' in c) c.letterSpacing = '0.42em';
  c.fillText('THE END', e.W / 2, e.H / 2);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.restore();
}

// three torn-edged black bars slide in from alternating sides
function panelWipe(e, p) {
  const c = e.ctx, W = e.W, H = e.H;
  c.save();
  const bars = [{ y: 0, h: 0.40 }, { y: 0.38, h: 0.30 }, { y: 0.66, h: 0.40 }];
  bars.forEach((b, i) => {
    const fromLeft = i % 2 === 0, bw = W * Math.min(1, p * 1.25), bx = fromLeft ? 0 : W - bw;
    c.fillStyle = '#000'; c.fillRect(bx, b.y * H, bw, b.h * H);
    if (bw > 2 && bw < W) {
      const edge = fromLeft ? bw : W - bw, rng = rand32(i * 99 + Math.floor(p * 40));
      c.fillStyle = '#000';
      for (let k = 0; k < 10; k++) { const yy = b.y * H + rng() * b.h * H, rr = 2 + rng() * 9; c.beginPath(); c.arc(edge + (fromLeft ? -rr : rr), yy, rr, 0, TWO_PI); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 2; c.beginPath(); c.moveTo(edge, b.y * H); c.lineTo(edge, (b.y + b.h) * H); c.stroke();
    }
  });
  c.restore();
}

// the act-name title card, reused for the opening story-title card ('title' state). The opening one
// shows the story name from f.titleText and dwells longer (titleHold).
function drawCard(e) {
  const c = e.ctx, f = e.flow, isTitle = f.transState === 'title', hold = isTitle ? ANIM.titleHold : (f.cardDur || ANIM.cardHold);
  const title = isTitle ? (f.titleText || '') : (e.scene.data.title || '').replace(/&nbsp;/g, ' ');
  let a = 1; if (f.cardT < 0.3) a = f.cardT / 0.3; else if (f.cardT > hold - 0.3) a = Math.max(0, (hold - f.cardT) / 0.3);
  c.save(); c.globalAlpha = a; c.fillStyle = '#f3f0e6'; c.textAlign = 'center'; c.textBaseline = 'middle';
  if ('letterSpacing' in c) c.letterSpacing = '0.32em';
  let fs = Math.round(Math.min(e.W, e.H) * (isTitle ? 0.06 : 0.07));   // story names run longer than act names
  c.font = `600 ${fs}px "Oswald",sans-serif`;
  while (fs > 12 && c.measureText(title).width > e.W * 0.84) { fs -= 2; c.font = `600 ${fs}px "Oswald",sans-serif`; }
  c.fillText(title, e.W / 2, e.H / 2);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.restore();
}
