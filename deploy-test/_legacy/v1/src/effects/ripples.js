// expanding puddle ripples on the wet floor, each tinted by the light above it
export const Ripples = {
  list: [],
  spawn(e) {
    const x = Math.random() * e.W, y = e.gy + Math.random() * (e.H - e.gy) * 0.9;
    const sc = e.scenes[e.sceneIdx];
    const col = sc && sc.bloodRain ? [196, 26, 36] : e.litColor(x, 150, 162, 180);   // bloody on a blood-rain scene, else the colour of the light above
    this.list.push({ x, y, r: 1, max: 10 + Math.random() * 26, life: 1, col });
  },
  clear() { this.list.length = 0; },
  draw(e) {
    const c = e.ctx; c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.r += e.dt * 34; p.life -= e.dt * 1.1;
      if (p.life <= 0 || p.r > p.max) { this.list.splice(i, 1); continue; }
      c.globalAlpha = 0.22 * p.life; c.strokeStyle = `rgb(${p.col[0]},${p.col[1]},${p.col[2]})`; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 0.4, 0, 0, Math.PI * 2); c.stroke();
    }
    c.restore(); c.globalAlpha = 1;
  },
};
