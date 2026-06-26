// VIEWPORT — keeps the story in a wide landscape frame, degrading gracefully so it works on every
// phone and browser:
//   1. Letterbox (always works): the engine sizes the canvas to a target aspect band [ASPECT_MIN,
//      ASPECT_MAX], so a too tall screen gets bars top and bottom and a too wide one gets bars left
//      and right. Pure canvas sizing plus CSS, no browser feature needed, this is the fallback.
//   2. Landscape prompt (touch devices, portrait): starting a story never forces a turn. Instead a
//      prompt explains the story reads best in landscape and offers two choices, a ROTATE TO
//      LANDSCAPE button (fullscreen where possible, then an orientation lock) and a STAY IN PORTRAIT
//      button that plays letterboxed. Turning the phone by hand while the prompt is up dismisses it
//      and starts at once, so a sudden rotation never catches the viewer off guard. Already in
//      landscape on a device that can fullscreen, it slips straight in with no prompt. Once cleared,
//      a return to portrait mid story is non-blocking: it letterboxes and shows the HUD button.
//   3. Platform reality: where element fullscreen does not exist (iPhone Safari) the prompt drops the
//      rotate button and just asks the viewer to turn the phone, with a STAY IN PORTRAIT fallback,
//      and the bundled web app manifest gives true fullscreen from the home screen. Desktop never
//      prompts, it offers fullscreen from the HUD and letterboxes if the window is tall.
export const ASPECT_MIN = 16 / 10;       // below this the screen is too tall: bars top and bottom
export const ASPECT_MAX = 2.6;           // above this the screen is too wide: bars left and right. Loose
                                         // on purpose, normal desktops (a 1080p minus the dock and
                                         // browser chrome runs ~2.2), modern phones in landscape
                                         // (up to 23:9, about 2.56) and 21:9 monitors all fill. Only
                                         // genuinely extreme ultrawides (32:9, about 3.55) pillarbox
const SKIP_DELAY = 4000;                 // no-fs prompt only: wait before the STAY IN PORTRAIT fallback fades in

// immersion helpers. matchMedia is wrapped because a few old engines throw on unknown queries.
const mq = q => { try { return matchMedia(q).matches; } catch (e) { return false; } };

// a device counts as rotatable if it is touch first (a phone or tablet that can physically turn)
export function isRotatable() {
  return mq('(pointer: coarse)') || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}
function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
// an installed app (home-screen PWA), NOT element fullscreen via the API: the (display-mode: fullscreen)
// query matches both, so exclude the API case (which sets document.fullscreenElement) or the fullscreen
// toggle would vanish the instant you entered fullscreen, leaving no way out.
function isStandalone() {
  if (isFullscreen()) return false;
  return mq('(display-mode: fullscreen)') || mq('(display-mode: standalone)') || navigator.standalone === true;
}
// can we actually put an element into fullscreen? Test for a request method on the root, not
// document.fullscreenEnabled: iPhone Safari reports that flag for video but cannot fullscreen a
// canvas, which would trap the gate forever. No request method means relax the target to landscape.
function canFullscreen() {
  const root = document.documentElement;
  return !!(root.requestFullscreen || root.webkitRequestFullscreen) && !isStandalone();
}
// Prefer the Screen Orientation API, which is authoritative the instant a lock resolves, over
// innerWidth/innerHeight, which lag a frame or two behind the reflow and caused the prompt to flash.
// Fall back to the window size where the API is absent.
function landscape() {
  const o = window.screen && screen.orientation;
  if (o && typeof o.type === 'string' && o.type) return o.type.indexOf('landscape') === 0;
  return innerWidth >= innerHeight;
}

export class Viewport {
  constructor(engine) {
    this.engine = engine;
    this.rotatable = isRotatable();
    this.overlay = null; this.skipBtn = null; this.fsBtn = null;
    this.experienceStarted = false;   // ENTER pressed, a story is on its way in
    this.storyStarted = false;        // onStart has fired (the play clock is live)
    this.gatePassed = false;          // landscape reached (button or by hand), or portrait kept, at least once
    this.gateBlocked = false;         // the landscape prompt is up
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

  // overlay = the landscape prompt, skip = its STAY IN PORTRAIT button, fsCta = its ROTATE TO
  // LANDSCAPE button, fsBtn = the in story HUD fullscreen button
  attach({ overlay, skip, fsCta, fsBtn }) {
    this.overlay = overlay; this.skipBtn = skip; this.fsBtn = fsBtn;
    if (skip) skip.addEventListener('click', () => { this.gatePassed = true; this.evaluate(); });
    if (fsCta) fsCta.addEventListener('click', () => this.enter());
    if (fsBtn) fsBtn.addEventListener('click', () => this.toggleFullscreen());
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
    this.scheduleEvaluate();
  }
  toggleFullscreen() { if (isFullscreen()) this.exit(); else this.enter(); }
  fullscreenOn() { return isFullscreen(); }

  // ENTER pressed: never force a turn. Already in landscape on a device that can fullscreen, slip
  // straight into the immersive view (no jarring rotation) and start. Otherwise evaluate() raises the
  // landscape prompt and the viewer chooses ROTATE TO LANDSCAPE or STAY IN PORTRAIT.
  async beginStory() {
    this.experienceStarted = true;
    if (this.rotatable && canFullscreen() && landscape()) await this.enter();
    else this.evaluate();
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

  // the gate only blocks on a touch device that is still in portrait and has not yet cleared the
  // prompt (rotated, or chosen to stay). After that, a return to portrait mid story is non-blocking:
  // it letterboxes and shows the HUD button. Landscape alone clears it, fullscreen is a bonus the
  // ROTATE button adds, not a requirement, so turning the phone by hand is enough to start.
  blocked() { return this.rotatable && !this.gatePassed && !landscape(); }

  // orientation + fullscreen changes can fire a burst of events, so settle briefly before judging
  scheduleEvaluate() {
    if (!this.experienceStarted) return;
    clearTimeout(this._settleTimer);
    this._settleTimer = setTimeout(() => this.evaluate(), 220);
  }

  // Judge immediately: the orientation comes from the Screen Orientation API (authoritative the moment
  // a lock resolves), so there is no layout-size lag to wait out, the prompt covers the scene at once.
  evaluate() {
    if (!this.experienceStarted) return;
    if (landscape()) this.gatePassed = true;   // rotated to landscape, by the button or by hand: gate cleared
    this.gateBlocked = this.blocked();
    if (this.gateBlocked) this.showOverlay();
    else {
      this.hideOverlay();
      if (!this.storyStarted) { this.storyStarted = true; if (this.onStart) this.onStart(); }
    }
    this.applyPause();
    this.updateFsBtn();
  }

  // HUD fullscreen toggle: shown while playing on any device that can fullscreen (hidden during the
  // gate prompt). Click enters or exits fullscreen.
  updateFsBtn() {
    if (!this.fsBtn) return;
    this.fsBtn.classList.toggle('show', this.storyStarted && canFullscreen() && !this.blocked());   // a HUD enter/exit toggle, any device that can fullscreen
    this.fsBtn.title = isFullscreen() ? 'exit fullscreen' : 'fullscreen';
  }

  // the prompt adapts: where fullscreen is possible it offers both choices at once, ROTATE TO
  // LANDSCAPE and STAY IN PORTRAIT, so the viewer decides and nothing turns on its own. Where it is
  // not (iPhone), the .no-fs class swaps the copy to a rotate hint, drops the rotate button, and the
  // STAY IN PORTRAIT fallback fades in after a short delay to nudge a turn first.
  showOverlay() {
    if (!this.overlay) return;
    const noFs = !canFullscreen();
    this.overlay.classList.toggle('no-fs', noFs);
    if (this.overlay.classList.contains('show')) return;
    this.overlay.classList.add('show');
    if (this.skipBtn) {
      this.skipBtn.classList.remove('show');
      clearTimeout(this._skipTimer);
      if (noFs) this._skipTimer = setTimeout(() => this.skipBtn.classList.add('show'), SKIP_DELAY);
      else this.skipBtn.classList.add('show');
    }
  }

  hideOverlay() {
    if (!this.overlay) return;
    this.overlay.classList.remove('show');
    clearTimeout(this._skipTimer);
  }
}
