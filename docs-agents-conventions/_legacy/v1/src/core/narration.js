// =====================================================================================
//  NARRATION & SCENE FLOW — scene entry (resets per-scene state, unlocks the navigator),
//  the comic caption per line, story-driven fx (muzzle/blood/lightning/lighter) and their
//  sounds, the gun choreography, the scene tag, and advance()/start().
// =====================================================================================
import { Noir } from './engine.js';
import { Audio2 } from './audio.js';
import { Shells } from '../effects/shells.js';

Object.assign(Noir, {
  // ---- scene entry: reset per-scene state + unlock the navigator after a full loop ----
  enterScene(idx) {
    this.sceneIdx = idx; this.lineIdx = 0; this.flags = {}; this.sceneStart = this.t; Shells.clear();
    Audio2.scene(this.scenes[idx]); Audio2.whoosh();
    if (!this.seen.includes(idx)) this.seen.push(idx);
    if (!this.navShown && idx === 0 && this.seen.includes(1) && this.seen.includes(2)) { this.navShown = true; const n = document.getElementById('scenenav'); if (n) n.classList.add('show'); }
    if (this.navShown) document.querySelectorAll('#scenenav button').forEach(b => b.classList.toggle('cur', +b.dataset.s === idx));
  },

  // ---- narration ----
  showLine() {
    const sc = this.scenes[this.sceneIdx], line = sc.script[this.lineIdx];
    this.lineStart = this.t;
    this.capEl.style.opacity = '0';
    setTimeout(() => { this.capEl.innerHTML = line.text; this.capEl.style.opacity = '1'; }, 170);
    for (const fx of (line.fx || [])) {                 // story-driven events + their sounds
      if (fx === 'muzzle') { this.flags.muzzle = 1.0; this.fireGun(); }
      else if (fx === 'blood') { this.flags.blood = true; this.flags._bloodT = this.t; }
      else if (fx === 'lightning') { this.lightning = Math.max(this.lightning, 0.8); Audio2.lightningCrack(); setTimeout(() => Audio2.thunder(), 200 + Math.random() * 400); }
      else if (fx === 'lighter') { Audio2.lidOpen(); setTimeout(() => Audio2.flint(), 650); } // pop the Zippo lid, then strike it
    }
  },
  sfx(name) { Audio2.play(name); },
  walkSound(on) { Audio2.setLoop('heels', on); },   // continuous heels, only while an actor is actually moving
  // two shots: each is its own gunshot sound + a brass casing from the shooter in the cast
  fireGun() {
    const g = (this.scenes[this.sceneIdx].cast || []).find(p => p.actor === 'gunman');
    const shot = () => { Audio2.gun(); if (g) { const s = this.scaleOf(g), x = this.X(g) + 48 * s, y = this.gy - 84 * s; Shells.spawn(x, y, s, this.gy + 6); } };
    shot(); setTimeout(shot, 230);
  },
  showTag() { this.tagEl.innerHTML = this.scenes[this.sceneIdx].title; this.tagEl.style.opacity = '0.85'; clearTimeout(this._tag); this._tag = setTimeout(() => this.tagEl.style.opacity = '0', 2600); },
  advance() { const sc = this.scenes[this.sceneIdx]; if (this.lineIdx < sc.script.length - 1) { this.lineIdx++; this.showLine(); } else if (!this.transState) { this.pending = (this.sceneIdx + 1) % this.scenes.length; this.transState = 'in'; } },
  start() { this.started = true; this.seen = []; this.navShown = false; this.opening = true; this.transAlpha = 1; this.enterScene(0); this.transState = 'card'; this.cardT = 0; },   // open on the act-1 title card, then reveal with the establishing zoom
});
