// VIEWPORT — keeps the story in a wide, fullscreen, landscape frame, degrading gracefully so it
// works on every phone and browser:
//   1. Letterbox (always works): the engine sizes the canvas to a target aspect band [ASPECT_MIN,
//      ASPECT_MAX], so a too-tall screen gets bars top and bottom and a too-wide one gets bars left
//      and right. Pure canvas sizing plus CSS, no browser feature needed, this is the fallback.
//   2. Immersion gate (touch devices): starting a story tries to enter fullscreen and lock to
//      landscape (the lock is fullscreen scoped and releases on exit). If the screen is not yet
//      fullscreen + landscape, a prompt offers a FULLSCREEN button (or a rotate hint where fullscreen
//      is impossible), and a "watch anyway" fallback plays letterboxed. Once immersion is reached or
//      skipped, a broken state mid story is non-blocking: it letterboxes and shows a HUD button.
//   3. Platform reality: where element fullscreen does not exist (iPhone Safari) the target relaxes
//      to landscape only, and the bundled web app manifest gives true fullscreen from the home
//      screen. Desktop never auto-prompts, it offers fullscreen from the menu and letterboxes if tall.
export const ASPECT_MIN = 16 / 10;       // below this the screen is too tall: bars top and bottom
export const ASPECT_MAX = 2.6;           // above this the screen is too wide: bars left and right. Loose
                                         // on purpose, normal desktops (a 1080p minus the dock and
                                         // browser chrome runs ~2.2), modern phones in landscape
                                         // (up to 23:9, about 2.56) and 21:9 monitors all fill. Only
                                         // genuinely extreme ultrawides (32:9, about 3.55) pillarbox
const SKIP_DELAY = 4000;                 // wait before the prompt offers the "watch anyway" fallback

// immersion helpers. matchMedia is wrapped because a few old engines throw on unknown queries.
const mq = q => { try { return matchMedia(q).matches; } catch (e) { return false; } };

// a device counts as rotatable if it is touch first (a phone or tablet that can physically turn)
export function isRotatable() {
  return mq('(pointer: coarse)') || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}
function isStandalone() { return mq('(display-mode: fullscreen)') || mq('(display-mode: standalone)') || navigator.standalone === true; }
function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
// can we actually put an element into fullscreen? Test for a request method on the root, not
// document.fullscreenEnabled: iPhone Safari reports that flag for video but cannot fullscreen a
// canvas, which would trap the gate forever. No request method means relax the target to landscape.
function canFullscreen() {
  const root = document.documentElement;
  return !!(root.requestFullscreen || root.webkitRequestFullscreen) && !isStandalone();
}
function landscape() { return innerWidth >= innerHeight; }

// the immersion target adapts to the platform: a real fullscreen where we can reach one, otherwise
// the best we can do (landscape) on engines with no element fullscreen, such as iPhone Safari. A
// home-screen PWA is already fullscreen, so there only landscape is needed.
export function isImmersive() {
  if (isStandalone()) return landscape();
  if (canFullscreen()) return isFullscreen() && landscape();
  return landscape();
}

export class Viewport {
  constructor(engine) {
    this.engine = engine;
    this.rotatable = isRotatable();
    this.overlay = null; this.skipBtn = null; this.fsBtn = null;
    this.experienceStarted = false;   // ENTER pressed, a story is on its way in
    this.storyStarted = false;        // onStart has fired (the play clock is live)
    this.gatePassed = false;          // immersion reached, or "watch anyway" chosen, at least once
    this.gateBlocked = false;         // the immersion prompt is up
    this.menuPaused = false;          // a menu/modal is open (the pause menu)
    this.onStart = null;              // boot wires this to manager.requestStart
    this.onPause = null;              // boot wires this to Audio2.suspend (full story pause)
    this.onResume = null;             // boot wires this to Audio2.resumeAll
    this._skipTimer = null; this._settleTimer = null;
    const reeval = () => this.scheduleEvaluate();
    addEventListener('resize', reeval);
    addEventListener('orientationchange', reeval);
    addEventListener('fullscreenchange', reeval);
    addEventListener('webkitfullscreenchange', reeval);
    if (window.screen && screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', reeval);
  }

  // overlay = the immersion prompt, skip = its "watch anyway", fsCta = its FULLSCREEN button,
  // fsBtn = the in-story HUD fullscreen button
  attach({ overlay, skip, fsCta, fsBtn }) {
    this.overlay = overlay; this.skipBtn = skip; this.fsBtn = fsBtn;
    if (skip) skip.addEventListener('click', () => { this.gatePassed = true; this.evaluate(); });
    if (fsCta) fsCta.addEventListener('click', () => this.enter());
    if (fsBtn) fsBtn.addEventListener('click', () => this.enter());
  }

  // enter the immersive view: fullscreen, then lock to landscape. The lock is fullscreen scoped and
  // releases by itself when fullscreen ends, it is not a persistent global lock. Both are guarded,
  // so an unsupported call is simply a no-op and the prompt handles the rest.
  async enter() {
    const root = document.documentElement;
    const fs = root.requestFullscreen || root.webkitRequestFullscreen;
    // skip requestFullscreen when already fullscreen or running as an installed PWA, it would be
    // redundant and re-trigger Chrome's "swipe to exit" toast. (An installed PWA is fullscreen with
    // no Fullscreen API call, so it never shows that toast at all.)
    try { if (fs && !isFullscreen() && !isStandalone()) await fs.call(root); } catch (e) {}
    try { if (window.screen && screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) {}
    this.evaluate();
  }
  exit() {
    try { const x = document.exitFullscreen || document.webkitExitFullscreen; if (x && isFullscreen()) x.call(document); } catch (e) {}
  }
  toggleFullscreen() { if (isFullscreen()) this.exit(); else this.enter(); }
  fullscreenOn() { return isFullscreen(); }

  // ENTER pressed: on a touch device try to go straight into the immersive view (the tap is the user
  // gesture fullscreen needs). Where that cannot or will not happen, evaluate() raises the prompt.
  async beginStory() {
    this.experienceStarted = true;
    if (this.rotatable) await this.enter(); else this.evaluate();
  }

  // back to the start screen: leave fullscreen and reset the gate so it runs again next time
  reset() {
    this.experienceStarted = false; this.storyStarted = false; this.gatePassed = false;
    this.gateBlocked = false; this.menuPaused = false;
    this.hideOverlay(); this.engine.resume(); this.exit();
  }

  // the play clock + audio pause while the immersion prompt is up OR a menu/modal is open. One
  // coordinator so the gate and the pause menu never fight over the engine. All calls are idempotent.
  applyPause() {
    if (this.gateBlocked || this.menuPaused) { this.engine.pause(); if (this.onPause) this.onPause(); }
    else { this.engine.resume(); if (this.onResume) this.onResume(); }
  }
  setMenuPaused(on) { this.menuPaused = on; this.applyPause(); }

  // the gate only blocks on a touch device that has not yet reached immersion (or chosen to skip).
  // After that, a broken immersion mid story is non-blocking: it letterboxes and shows the HUD button.
  blocked() { return this.rotatable && !this.gatePassed && !isImmersive(); }

  // orientation + fullscreen changes can fire a burst of events, so settle briefly before judging
  scheduleEvaluate() {
    if (!this.experienceStarted) return;
    clearTimeout(this._settleTimer);
    this._settleTimer = setTimeout(() => this.evaluate(), 220);
  }

  evaluate() {
    if (!this.experienceStarted) return;
    if (isImmersive()) this.gatePassed = true;
    this.gateBlocked = this.blocked();
    if (this.gateBlocked) this.showOverlay();
    else {
      this.hideOverlay();
      if (!this.storyStarted) { this.storyStarted = true; if (this.onStart) this.onStart(); }
    }
    this.applyPause();
    this.updateFsBtn();
  }

  // HUD fullscreen button: shown once playing on a touch device that can fullscreen but is not in it
  // (so a viewer who left fullscreen, or who chose to watch anyway, can re-enter). Hidden while the
  // prompt is up, since the prompt already offers it.
  updateFsBtn() {
    if (!this.fsBtn) return;
    const show = this.storyStarted && this.rotatable && canFullscreen() && !isFullscreen() && !this.blocked();
    this.fsBtn.classList.toggle('show', show);
  }

  // the prompt adapts: where fullscreen is possible it leads with the FULLSCREEN button, otherwise it
  // becomes a rotate-your-phone hint (the .no-fs class swaps the copy and hides the button via CSS)
  showOverlay() {
    if (!this.overlay) return;
    this.overlay.classList.toggle('no-fs', !canFullscreen());
    if (this.overlay.classList.contains('show')) return;
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
