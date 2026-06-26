# INKFALL, engine operating guide

A 2D noir story engine (canvas) and stories told with it (pure data). Vanilla JS, native ES
modules, no build, no dependencies. Deploys as a static site.

## Run

- Dev: `python3 -m http.server 8000`, open `http://localhost:8000/`. (ES modules need an HTTP
  origin, so `file://` double-click does not work in dev.)
- Standalone double-click file: `node build.mjs` writes `inkfall.html`, a single self-contained
  page that opens from `file://` with no server. Rebuild after source changes.
- GitHub Pages: serve the repo root as is. `.nojekyll` is present. Nothing to compile.

## Map

```
index.html            shell: DOM + styles/inkfall.css + <script type="module" src="src/boot.js">
styles/inkfall.css    shell + HUD styles: design tokens (:root), the .hud-btn grid, the .overlay modal
build.mjs             zero-dep bundler → standalone inkfall.html
src/
  boot.js             DOM wiring, intro picker (from manifest), editor, story menu, HUD stage, starts the loop
  engine/
    engine.js         canvas (letterbox sizing) + offscreen light buffer + rain/grain + pausable rAF loop + the live Frame
    viewport.js       landscape frame: aspect band letterbox, rotate gate (fullscreen + orientation lock), pausable play clock
    frame.js          per-frame facade passed to passes + objects (e.*)
    camera.js         look (drag parallax), zoom (establishing), shake
    compositor.js     ordered render: world → light buffer → composite → weather → post → transition
    input.js          tap=advance, drag=look, hold=lightning
    math.js           rand32, lerp, clamp, clamp01, smooth01, hexRgb, cssRgb, TWO_PI
  style/palette.js    PALETTE + ANIM (central look + timing)
  style/materials.js  shared shading: rimSign, bodyGrad, shadowPool
  render/lighting.js  light+shadow service: addLight, dominantLight, litTint, litColor, groundShadow, drawLightLayer
  render/passes/      sky, lighting, weather, post, transition
  objects/            node + actor/mover/prop/effect/light + registry (define*, create, createBackdrop)
  library/            the art by category, self-registering via library/index.js
  scene/scene.js      one act: content + per-scene runtime (flags, lineIdx, timing, weather, shells, ripples)
  scene/manager.js    flow: scenes, transitions, establishing shot, narration, act picker, reset
  assets/audio.js     data-driven, story-scoped sound (with suspend/resumeAll for the gate)
stories/manifest.js   tales on the picker (lazy-loaded); <id>/story.js export default; SCHEMA.md
assets/audio/         shared mp3s (declared per story)
_legacy/              archived prior builds (do not edit)
```

## Render model (how a frame is drawn)

`manager.tick(e)` → update world, then `compositor.render(e)`:
1. world → main canvas (camera applied): `sky`, `scene.collectLights` (all lights register first,
   so rim/shadow are stable), backdrop, light fixtures, objects (depth order) + brass.
2. additive light buffer (camera applied): every light's halo + floor reflection + ripples.
3. composite light buffer onto main with `lighter`.
4. weather (rain, lightning) over the lit scene.
5. screen-space post (grain, vignette) and transition (ink wipe + act card).

## Viewport and HUD

The story always plays in a wide, landscape frame, and the chrome around it runs on one shared
system.

- Landscape frame (`engine/viewport.js` + `engine.js`): the canvas is sized to a target aspect band
  (`ASPECT_MIN` to `ASPECT_MAX`) and centered, so a too tall screen gets bars top and bottom and a
  too wide one gets bars left and right. Everything downstream reads `e.W/e.H` (the band), so the
  world never knows it is letterboxed. The cap is loose on purpose, so normal desktops and modern
  phones in landscape fill edge to edge and only genuine ultrawides pillarbox.
- Landscape prompt (`viewport.js`): on a touch device held in portrait, starting a story never turns
  the screen on its own. It raises a prompt that offers ROTATE TO LANDSCAPE (fullscreen where
  possible, then `screen.orientation.lock`) or STAY IN PORTRAIT (plays letterboxed). Turning the
  phone by hand while the prompt is up clears it and starts at once. Where fullscreen does not exist
  (iPhone), the prompt drops the rotate button, asks the viewer to turn the phone, and the STAY IN
  PORTRAIT fallback fades in after a short delay. Already landscape on a device that can fullscreen,
  it slips straight in with no prompt, and a return to portrait mid story is non-blocking
  (letterboxed, with the HUD fullscreen button).
- Pausable play clock (`engine.js`): `engine.pause()` and `engine.resume()` freeze one play clock
  (used by the gate) so animation holds and resumes with no time jump. Audio mirrors this through
  `Audio2.suspend()` and `Audio2.resumeAll()`, so the prompt is a full pause of motion and sound.
- HUD tokens (`styles/inkfall.css`): the `:root` block holds the design tokens, fonts (`--f-*`), the
  palette (`--c-*`), a vmin type scale (`--fs-*`) and a z-index ladder (`--z-*`). Sizing is vmin so
  the HUD never balloons in a wide frame. Restyle the chrome here, it is one edit.
- HUD primitives: buttons share one skin, `.hud-btn` plus `.hud-sm/.hud-md/.hud-lg` sized on a grid
  cell (`--hud-cell`, with whole cell widths). Full screen modals (poster, story menu, rotate
  prompt) share the `.overlay` primitive.
- HUD stage (`boot.js`): `document.body.dataset.stage` is `menu` or `playing`, and CSS keys off it
  for coarse visibility (the intro fades for `menu`, the in story HUD and narration show for
  `playing`). The manager still drives the per frame caption and tap note fades. The REVIEW ACT
  picker stays hidden until THE END is reached once (the manager toggles `#actsel.unlocked`), drops
  open as a drawer below the HUD, and `manager.reset()` returns to the start screen without a reload.

## Object contract

Library objects are registered with `defineActor/defineMover/defineProp/defineEffect(name, fn, opts)`.
Inside `fn`, `this` is the placed instance (its story params) and `e` is the Frame. Use regular
functions, not arrows (they rely on `this`).

Frame API objects use: `e.ctx` (draw target), `e.W/e.H/e.unit/e.t/e.gy`, `e.X(this)`, `e.scaleOf(this)`,
`e.walkX(this)`, `e.beat()`, `e.sceneT()`, `e.lineIdx`, `e.flags`, `e.palette`, `e.litTint(x)`,
`e.litColor(...)`, `e.groundShadow(x, halfW, objH)`, `e.addLight({...})`, `e.walkSound(bool)`.

`opts`: `castsShadow`, `depth`, and the optional hooks `update(dt, e)` and `emitLight(e)`. To emit
light, `emitLight` calls `e.addLight({ x, y, col:'r,g,b', r, I, haloR, haloI, reflW, reflI })`. The
lighting pass draws the halo + reflection, so objects never draw their own glow.

Backdrops: `defineBackdrop(name, data => ({ indoor?, build(e){ return geom }, draw(e){ /* this.geom */ } }))`.
`build` precomputes geometry on resize (cached on `this.geom`); `draw` paints each frame.

## Extending

- New object: add a `define*` to the right `src/library/**` file (or a new file imported by
  `src/library/index.js`), then add the name to the editor help in `index.html` and to `stories/SCHEMA.md`.
- New story: `stories/<id>/story.js` (`export default {...}`, see `SCHEMA.md`) + a `manifest.js` entry.
  Per-story behaviour is data (params, `fx`, `onFlag`/`hideOnFlag`), not engine edits.
- Restyle the world: `style/palette.js` (palette/timing), `style/materials.js` (shading),
  `render/lighting.js` (light model), `render/passes/post.js` (screen finish).
- Restyle the HUD chrome: the design tokens in the `:root` block of `styles/inkfall.css`.
- New HUD control: give it `class="hud-btn hud-sm|hud-md|hud-lg"` and show it from a stage rule
  (`body[data-stage="playing"] ...`) rather than toggling it by hand.

## Conventions

- Vanilla JS, native modules, no bundler in dev, no dependencies. Stories are pure data (default
  exports). Do not reintroduce globals.
- Lighting and shadows go through the one shared service (`render/lighting.js`). Do not hand-roll
  per-object lighting, that is what keeps the look uniform.
- Library draw functions are regular functions (use `this`).
- Animation today is param-driven from scene timing. The intended growth point is a clip/timeline
  system on `Actor`, and the Node contract is built to absorb it without changing objects.
- Bump the `BUILD` tag in `src/boot.js` on a noticeable change.
- All prose (docs, comments, commit messages, PR descriptions) follows the Output rules below.

## Output rules (apply to ALL written output)

These apply to every piece of text: docs, code comments, commit messages, PR and release
descriptions, the README, and the in app copy. They do not apply to code itself.

1. Never use the em dash or en dash. Use a comma, colon, parentheses, or a full stop. Rewrite the
   sentence if needed.
2. Never hyphenate compound modifiers (write "read only", "follow up", "black and white", "low
   latency"). Genuine identifiers stay as is: package names, CLI flags, code symbols, file names.
3. Never use the semicolon in prose. Use a full stop or a comma, or rewrite. This does not apply to
   code.
4. No bare URLs in places that render links (PRs, README, docs). Hyperlink a short descriptive
   phrase, for example [the live build](https://masoudqashqai.github.io/Inkfall/).

## Git

A few conventions for working in this repo.

- Work on a branch off `main`, never commit straight to `main`. Name branches by intent, for
  example `fix/mobile-flicker`, `feat/clip-system`, `docs/...`.
- Open a pull request into `main` for review, then merge once it looks good. Keep each PR focused on
  one change so it is easy to review.
- No CI quality gates here (no CodeScene or SonarQube). Verify by hand (see Verify below): serve it,
  check the console is clean, tap through both stories, and run `node build.mjs`.
- Before opening a PR for a noticeable change, bump the `BUILD` tag in `src/boot.js` and rebuild the
  standalone with `node build.mjs` so `inkfall.html` stays in sync.
- GitHub Pages serves `main`, so merging publishes to [the live build](https://masoudqashqai.github.io/Inkfall/).
- Do not push or merge unless asked. Never force push or rewrite shared history, and never resolve a
  merge conflict without checking first.

## Verify

No test suite. Serve, open, confirm the console logs `INKFALL v2 build ...` with no errors, ENTER,
tap through both stories, and check the STORY editor round-trips JSON. Fast headless check: load in
headless Chrome and grep the console for errors.

For HUD or viewport changes also check: the frame stays landscape (bars on a too tall or too wide
window, no bars on a normal desktop), the STORY menu offers back to start and edit, REVIEW ACT is
hidden until THE END and then drops open, and a narrow portrait window shows the rotate prompt.
