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
build.mjs             zero-dep bundler → standalone inkfall.html
src/
  boot.js             DOM wiring, intro picker (from manifest), editor, starts the loop
  engine/
    engine.js         canvas + offscreen light buffer + rain/grain + rAF loop + the live Frame
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
  scene/manager.js    flow: scenes, transitions, establishing shot, narration, scene nav
  assets/audio.js     data-driven, story-scoped sound
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
- Restyle everything: `style/palette.js` (palette/timing), `style/materials.js` (shading),
  `render/lighting.js` (light model), `render/passes/post.js` (screen finish).

## Conventions

- Vanilla JS, native modules, no bundler in dev, no dependencies. Stories are pure data (default
  exports). Do not reintroduce globals.
- Lighting and shadows go through the one shared service (`render/lighting.js`). Do not hand-roll
  per-object lighting, that is what keeps the look uniform.
- Library draw functions are regular functions (use `this`).
- Animation today is param-driven from scene timing. The intended growth point is a clip/timeline
  system on `Actor`, and the Node contract is built to absorb it without changing objects.
- Bump the `BUILD` tag in `src/boot.js` on a noticeable change.
- Prose in docs/comments: no em or en dashes, no semicolons, no hyphenated modifiers.

## Verify

No test suite. Serve, open, confirm the console logs `INKFALL v2 build ...` with no errors, ENTER,
tap through both stories, and check the STORY editor round-trips JSON. Fast headless check: load in
headless Chrome and grep the console for errors.
