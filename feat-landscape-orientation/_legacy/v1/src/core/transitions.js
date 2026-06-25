// =====================================================================================
//  TRANSITIONS — the legacy comic-panel ink wipe between scenes, and the act-name title
//  card shown over the covered (black) frame before a scene opens. (The transition state
//  machine itself lives in engine.frame; these are the two things it paints.)
// =====================================================================================
import { Noir } from './engine.js';
import { TWO_PI, rand32 } from './math.js';

Object.assign(Noir, {
  // the legacy comic-panel ink wipe: three torn-edged black bars slide in from alternating sides
  panelWipe(p) {
    const c = this.ctx, W = this.W, H = this.H;
    c.save();
    const bars = [{ y: 0, h: 0.40 }, { y: 0.38, h: 0.30 }, { y: 0.66, h: 0.40 }];
    bars.forEach((b, i) => {
      const fromLeft = i % 2 === 0, bw = W * Math.min(1, p * 1.25), bx = fromLeft ? 0 : W - bw;
      c.fillStyle = '#000'; c.fillRect(bx, b.y * H, bw, b.h * H);
      if (bw > 2 && bw < W) {                                  // torn, inky gutter edge
        const edge = fromLeft ? bw : W - bw, rng = rand32(i * 99 + Math.floor(p * 40));
        c.fillStyle = '#000';
        for (let k = 0; k < 10; k++) { const yy = b.y * H + rng() * b.h * H, rr = 2 + rng() * 9; c.beginPath(); c.arc(edge + (fromLeft ? -rr : rr), yy, rr, 0, TWO_PI); c.fill(); }
        c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 2; c.beginPath(); c.moveTo(edge, b.y * H); c.lineTo(edge, (b.y + b.h) * H); c.stroke();
      }
    });
    c.restore();
  },
  // the act-name title card shown over the covered (black) frame, before the scene opens
  drawCard() {
    const c = this.ctx, title = (this.scenes[this.sceneIdx].title || '').replace(/&nbsp;/g, ' ');
    let a = 1; if (this.cardT < 0.3) a = this.cardT / 0.3; else if (this.cardT > 1.0) a = Math.max(0, (1.3 - this.cardT) / 0.3);
    c.save(); c.globalAlpha = a; c.fillStyle = '#f3f0e6'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `600 ${Math.round(Math.min(this.W, this.H) * 0.07)}px "Oswald",sans-serif`;
    if ('letterSpacing' in c) c.letterSpacing = '0.32em';
    c.fillText(title, this.W / 2, this.H / 2);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.restore();
  },
});
