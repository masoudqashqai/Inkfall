// MANAGER — the flow controller. Owns the camera, the compositor, the list of scenes, the
// transition state machine, the establishing shot, narration (captions + fx), and the scene
// navigator. Drives one tick: update the world, then render it. Render runs every frame (so
// the scene plays behind the intro); narration + transitions only run once started.
import { Camera } from '../engine/camera.js';
import { Compositor } from '../engine/compositor.js';
import { Scene } from './scene.js';
import { Audio2 } from '../assets/audio.js';
import { lerp, smooth01 } from '../engine/math.js';
import { ANIM } from '../style/palette.js';

export class Manager {
  constructor(engine) {
    this.engine = engine;
    this.camera = new Camera();
    this.compositor = new Compositor(engine);
    this.scenes = []; this.idx = 0;
    this.started = false; this._startReq = false;
    this.transState = null; this.transAlpha = 0; this.cardT = 0; this.pending = 0; this.opening = false;
    this.finishing = false; this.ended = false; this.endStart = 0;   // the story has run its last act
    this.fadeT = null; this.fadeDur = 0.7;                            // beat crossfade: dissolve the old frame into the new line
    this.seen = []; this.navShown = false;
    this.dom = {};
    engine.frame.flow = this;                         // the transition pass reads e.flow
    engine.onResize = () => this.scenes.forEach(s => s.invalidateGeometry());
  }

  attachDom(dom) { this.dom = dom; }                  // { cap, tag, tap, nav, onNav }
  get current() { return this.scenes[this.idx]; }

  loadStory(story) {
    this.story = story;
    this.scenes = (story.scenes || []).map(d => new Scene(d, this.camera));
    this.scenes.forEach(s => s.buildContent());
    this.idx = 0; this.transState = null; this.transAlpha = 0; this.camera.reset();
    this.finishing = false; this.ended = false;
    if (this.started) { this.current.onEnter(this.engine.frame); this.showTag(); }
    this.buildSceneNav();
  }

  requestStart() { this._startReq = true; }

  // tear down a run and return to the unstarted state (used by "back to start menu"), so a fresh
  // ENTER replays the story from act one instead of needing a page reload
  reset() { this.started = false; this._startReq = false; this.loadStory(this.story); }

  tick(e) {
    e.scene = this.current;
    this.current.ensureGeometry(e);
    this.camera.update(e.dt);

    if (this._startReq && !this.started) { this._startReq = false; this.doStart(e); }
    if (this.started) { this.runFlow(e); this.runEstablishing(e); }
    e.scene = this.current;   // runFlow may have switched scenes: update + render the SAME (new) scene, so the old scene is not re-drawn (which was restarting its walk-loop into the next act)
    e.scene.update(e.dt, e);

    this.compositor.render(e);
    this.applyOverlayVisibility();
  }

  doStart(e) {
    this.started = true; this.seen = []; this.navShown = false; this.opening = true;
    this.finishing = false; this.ended = false;
    this.transAlpha = 1; this.enterScene(0, e); this.transState = 'card'; this.cardT = 0;
  }

  // establishing shot: open wide and push in to the framed view. The zoom goes below 1 (a true
  // zoom-in), so the full-screen washes (sky, wet floor, lightning) overscan via e.coverRect()
  // to cover the wider field, leaving no black borders.
  runEstablishing(e) {
    if (!this.opening) return;
    const ob = e.sceneT();
    this.camera.focal = { x: e.W / 2, y: e.gy - 70 * e.unit };
    this.camera.zoom = lerp(0.86, 1, smooth01(ob / 3.4));
    if (ob > 3.6) { this.opening = false; this.camera.zoom = 1; }
  }

  runFlow(e) {
    if (this.transState === 'in') {
      this.transAlpha += e.dt * ANIM.transIn;
      if (this.transAlpha >= 1) {
        this.transAlpha = 1;
        if (this.finishing) { this.finishing = false; this.ended = true; this.transState = null; this.transAlpha = 0; this.revealNav(); Audio2.whoosh(); }  // last act done: cut to the black THE END screen + scene picker
        else { this.enterScene(this.pending, e); this.transState = 'card'; this.cardT = 0; }
      }
    } else if (this.transState === 'card') {
      this.cardT += e.dt;
      if (this.cardT >= ANIM.cardHold) { this.current.sceneStart = e.t; this.showLine(e); this.showTag(); this.transState = 'out'; }
    } else if (this.transState === 'out') {
      this.transAlpha -= e.dt * ANIM.transOut;
      if (this.transAlpha <= 0) { this.transAlpha = 0; this.transState = null; }
    }
  }

  enterScene(idx, e) {
    this.idx = idx; this.current.ensureGeometry(e); this.current.onEnter(e);
    this.fadeT = null;                                  // no stale beat-crossfade bleeding into a new act
    Audio2.scene(this.current.data); Audio2.whoosh();   // swap ambience + play the swoosh as the act-name card renders
    if (!this.seen.includes(idx)) this.seen.push(idx);
    this.highlightNav();   // keep the current act marked in the picker, open or not
  }

  // on THE END, unlock the act picker (hidden until the story is finished once) and drop it open
  revealNav() { this.navShown = true; if (this.dom.actsel) this.dom.actsel.classList.add('unlocked'); this.openNav(true); this.highlightNav(); }
  openNav(on) { if (this.dom.nav) this.dom.nav.classList.toggle('open', on); if (this.dom.act) this.dom.act.classList.toggle('open', on); }
  highlightNav() { if (this.dom.nav) this.dom.nav.querySelectorAll('button').forEach(b => b.classList.toggle('cur', +b.dataset.s === this.idx)); }

  advance() {
    if (!this.started || this.transState || this.ended) return;
    const s = this.current, e = this.engine.frame;
    if (s.lineIdx < s.data.script.length - 1) { this.engine.snapshot(); this.fadeT = e.t; Audio2.duck(this.fadeDur); s.lineIdx++; this.showLine(e); return; }   // crossfade the beat + fade any lingering sfx with it
    Audio2.duck(0.8);                                                                                       // act change: fade ringing sfx out across the wipe (loops fade in scene())
    if (this.idx < this.scenes.length - 1) { this.pending = this.idx + 1; this.transState = 'in'; }         // next act
    else { this.finishing = true; this.endStart = e.t; this.transState = 'in'; }                            // last act: wipe to THE END
  }

  // replay any act. Works mid-story and from THE END (clears the ending so colour + play resume).
  jumpTo(idx) {
    if (!this.started || this.transState) return;
    if (idx === this.idx && !this.ended) return;
    this.ended = false; this.finishing = false;
    Audio2.duck(0.8);
    this.pending = idx; this.transState = 'in';
  }

  holdLightning() { if (this.started) this.current.lightning = 1; }
  drag(dx) { this.camera.dragBy(dx); }

  showLine(e) {
    const s = this.current, line = s.data.script[s.lineIdx]; s.lineStart = e.t;
    const cap = this.dom.cap;
    if (cap) { cap.style.opacity = '0'; setTimeout(() => { cap.innerHTML = line.text; cap.style.opacity = '1'; }, 170); }
    for (const fx of (line.fx || [])) {
      if (fx === 'muzzle') { s.flags.muzzle = 1.0; s.fireGun(e); this.camera.shake(6); }
      else if (fx === 'blood') { s.flags.blood = true; s.flags._bloodT = e.t; }
      else if (fx === 'lightning') { s.lightning = Math.max(s.lightning, 0.8); setTimeout(() => Audio2.thunder(), 200 + Math.random() * 400); }
      else if (fx === 'hammer') Audio2.gunCock();   // revolver hammer pull (cocking the gun)
      else if (fx === 'lighter') { Audio2.lidOpen(); setTimeout(() => Audio2.flint(), 650); }
    }
  }

  showTag() { const t = this.dom.tag; if (!t) return; t.innerHTML = this.current.title; t.style.opacity = '0.85'; clearTimeout(this._tag); this._tag = setTimeout(() => t.style.opacity = '0', 2600); }

  applyOverlayVisibility() {
    const covering = this.transState === 'in' || this.transState === 'card';
    if (this.dom.cap && (covering || this.ended)) this.dom.cap.style.opacity = '0';   // no caption over THE END
    if (this.dom.tap) this.dom.tap.style.opacity = (covering || this.ended) ? '0' : (this.started ? '1' : '0');
  }

  buildSceneNav() {
    const nav = this.dom.nav; if (!nav) return;
    nav.innerHTML = ''; this.openNav(false); this.navShown = false;
    if (this.dom.actsel) this.dom.actsel.classList.remove('unlocked');   // re-lock until this story is finished again
    (this.scenes || []).forEach((s, i) => {
      const b = document.createElement('button'); b.dataset.s = i;
      b.innerHTML = (s.data.title || ('SCENE ' + i)).replace(/&nbsp;/g, ' ');
      b.addEventListener('click', () => { this.jumpTo(i); this.openNav(false); });   // pick an act, then collapse the drawer
      nav.appendChild(b);
    });
  }
}
