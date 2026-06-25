// VIEWPORT — keeps the story in a wide, landscape frame. Two parts work together:
//   1. Letterbox: the engine sizes the canvas to a target aspect band [ASPECT_MIN, ASPECT_MAX], so
//      a vertical monitor gets bars top and bottom and an ultrawide gets bars left and right
//      (the sizing itself lives in engine.resize, these constants are the contract).
//   2. Orientation gate: on a device that can turn (phone, tablet) a portrait screen is asked to
//      rotate. Starting a story first goes fullscreen and tries to lock to landscape, so the prompt
//      only shows when the browser ignores that signal. If the screen reverts to portrait mid story
//      the prompt returns and the play clock pauses until landscape comes back. As a fallback the
//      prompt offers "watch anyway", which plays letterboxed.
export const ASPECT_MIN = 16 / 10;   // below this the screen is too tall: bars top and bottom
export const ASPECT_MAX = 2.0;       // above this the screen is too wide: bars left and right
const SKIP_DELAY = 4000;             // wait before the prompt offers the "watch anyway" fallback

// a device counts as rotatable if it is touch first and exposes the Screen Orientation API
export function isRotatable() {
  const coarse = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  return coarse && !!(window.screen && screen.orientation);
}

export class Viewport {
  constructor(engine) {
    this.engine = engine;
    this.rotatable = isRotatable();
    this.overlay = null; this.skipBtn = null;
    this.experienceStarted = false;   // ENTER pressed, a story is on its way in
    this.storyStarted = false;        // onStart has fired (the play clock is live)
    this.skipped = false;             // the user chose "watch anyway", stop nagging
    this.onStart = null;              // boot wires this to manager.requestStart
    this.onPause = null;              // boot wires this to Audio2.suspend (full story pause)
    this.onResume = null;             // boot wires this to Audio2.resumeAll
    this._skipTimer = null; this._settleTimer = null;
    const reeval = () => this.scheduleEvaluate();
    addEventListener('resize', reeval);
    addEventListener('orientationchange', reeval);
  }

  attach({ overlay, skip }) {
    this.overlay = overlay; this.skipBtn = skip;
    if (skip) skip.addEventListener('click', () => { this.skipped = true; this.evaluate(); });
  }

  // called when ENTER is pressed: go immersive, then decide whether to start now or prompt first
  async beginStory() {
    this.experienceStarted = true;
    await this.requestImmersive();
    this.evaluate();
  }

  // phones and tablets only: fullscreen first (orientation lock needs it), then ask for landscape
  async requestImmersive() {
    if (!this.rotatable) return;
    const root = document.documentElement;
    try { if (root.requestFullscreen) await root.requestFullscreen(); } catch (e) {}
    try { if (screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) {}
  }

  portrait() { return innerWidth / innerHeight < 1; }
  blocked() { return this.rotatable && !this.skipped && this.portrait(); }

  // rotation fires a burst of resize events, so settle briefly before judging the orientation
  scheduleEvaluate() {
    if (!this.experienceStarted) return;
    clearTimeout(this._settleTimer);
    this._settleTimer = setTimeout(() => this.evaluate(), 220);
  }

  evaluate() {
    if (!this.experienceStarted) return;
    if (this.blocked()) {
      this.showOverlay();
      this.engine.pause();                       // freeze the clock (animations) under the prompt
      if (this.onPause) this.onPause();           // and hold all audio
    } else {
      this.hideOverlay();
      this.engine.resume();
      if (this.onResume) this.onResume();
      if (!this.storyStarted) { this.storyStarted = true; if (this.onStart) this.onStart(); }
    }
  }

  showOverlay() {
    if (!this.overlay || this.overlay.classList.contains('show')) return;
    this.overlay.classList.add('show');
    if (this.skipBtn) {
      this.skipBtn.classList.remove('show');
      clearTimeout(this._skipTimer);
      this._skipTimer = setTimeout(() => this.skipBtn.classList.add('show'), SKIP_DELAY);
    }
  }

  hideOverlay() {
    if (!this.overlay) return;
    this.overlay.classList.remove('show');
    clearTimeout(this._skipTimer);
  }
}
