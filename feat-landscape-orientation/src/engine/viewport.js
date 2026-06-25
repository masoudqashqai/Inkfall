// VIEWPORT — keeps the story in a wide, landscape frame. It is built to degrade gracefully so the
// experience works on every phone and browser, even where the immersive APIs do not exist:
//   1. Letterbox (always works): the engine sizes the canvas to a target aspect band [ASPECT_MIN,
//      ASPECT_MAX], so a too-tall screen gets bars top and bottom and a too-wide one gets bars left
//      and right. This is pure canvas sizing plus CSS, no browser feature needed.
//   2. Rotate prompt (always works): on any touch device held in portrait the prompt shows, driven
//      by resize/orientationchange + a window aspect check, no API required. A "watch anyway"
//      fallback plays letterboxed.
//   3. Fullscreen + orientation lock (progressive enhancement): on start we try to go fullscreen and
//      lock to landscape so the prompt is skipped. Where that is unsupported or refused (notably iOS
//      Safari), it is caught and the prompt from step 2 takes over. So the worst case is still a
//      correctly framed, landscape experience.
export const ASPECT_MIN = 16 / 10;       // below this the screen is too tall: bars top and bottom
export const ASPECT_MAX = 2.6;           // above this the screen is too wide: bars left and right. Loose
                                         // on purpose, normal desktops (a 1080p minus the dock and
                                         // browser chrome runs ~2.2), modern phones in landscape
                                         // (up to 23:9, about 2.56) and 21:9 monitors all fill. Only
                                         // genuinely extreme ultrawides (32:9, about 3.55) pillarbox
const SKIP_DELAY = 4000;                 // wait before the prompt offers the "watch anyway" fallback

// a device counts as rotatable if it is touch first (a phone or tablet that can physically turn).
// The Screen Orientation API is NOT required here, the rotate prompt is the fallback for when the
// fullscreen + lock signal cannot be honoured (for example iOS Safari).
export function isRotatable() {
  return matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
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
    if (window.screen && screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', reeval);
  }

  attach({ overlay, skip }) {
    this.overlay = overlay; this.skipBtn = skip;
    if (skip) skip.addEventListener('click', () => { this.skipped = true; this.evaluate(); });
  }

  // return to the pre-ENTER state so the gate runs again on the next start (used by "back to start menu")
  reset() {
    this.experienceStarted = false; this.storyStarted = false; this.skipped = false;
    this.hideOverlay(); this.engine.resume();
  }

  // called when ENTER is pressed: go immersive, then decide whether to start now or prompt first
  async beginStory() {
    this.experienceStarted = true;
    await this.requestImmersive();
    this.evaluate();
  }

  // phones and tablets only: fullscreen first (orientation lock needs it), then ask for landscape.
  // Both are best effort and fully guarded, so an unsupported or refused call just leaves the rotate
  // prompt to handle it. requestFullscreen accepts webkit/ms prefixes for older engines.
  async requestImmersive() {
    if (!this.rotatable) return;
    const root = document.documentElement;
    const fs = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
    try { if (fs) await fs.call(root); } catch (e) {}
    try { if (window.screen && screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) {}
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
