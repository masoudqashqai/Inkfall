// RIPPLES — expanding puddle ripples on the wet floor, each tinted by the light above it (or
// bloody on a blood-rain scene). A scene-owned system; draws additively to the LIGHT buffer.
export class Ripples {
  constructor() { this.list = []; }
  spawn(e) {
    // size + growth track the scene scale (k = 1 at a 1080p screen), so a ripple looks like 1080p
    // everywhere instead of being huge on a phone and a speck on a desktop.
    const k = e.unit / 3, x = Math.random() * e.W, y = e.gy + Math.random() * (e.H - e.gy) * 0.9, blood = e.scene.data.bloodRain;
    const col = blood ? [220, 24, 34] : e.litColor(x, 150, 162, 180);
    this.list.push({ x, y, r: k, max: (10 + Math.random() * 26) * k, gr: 34 * k, life: 1, col, blood });
  }
  clear() { this.list.length = 0; }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.r += dt * p.gr; p.life -= dt * 1.1;
      if (p.life <= 0 || p.r > p.max) this.list.splice(i, 1);
    }
  }
  draw(e) {
    const c = e.light, k = e.unit / 3; c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of this.list) {
      c.globalAlpha = (p.blood ? 0.42 : 0.22) * p.life; c.strokeStyle = `rgb(${p.col[0]},${p.col[1]},${p.col[2]})`; c.lineWidth = (p.blood ? 1.9 : 1.2) * k;
      c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 0.4, 0, 0, Math.PI * 2); c.stroke();
    }
    c.restore(); c.globalAlpha = 1;
  }
}
