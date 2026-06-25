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
    compositor.js     ordered render: set → back light → cast (each caster's shadow just before it) → front light → weather → post → transition
    input.js          tap=advance, drag=look, hold=lightning
    math.js           rand32, lerp, clamp, clamp01, smooth01, hexRgb, cssRgb, TWO_PI
  style/palette.js    PALETTE + ANIM (central look + timing)
  style/materials.js  surface light model: rimSign (the per-figure light field), bodyGrad + shade (ambient fill + diffuse wrap)
  style/shadows.js    SHADE + AMBIENT + WASH + ENV (shadow/ambient/wash knobs + the indoor vs outdoor profile)
  render/stage.js     the shared floor + wall stage geometry both lighting and shadows read
  render/lighting.js  light service: addLight, litTint, litColor, drawBackLight/drawFrontLight (beams, glow, washes, refl)
  render/shadows.js   shadow service: casterRecord, paintCaster, tintBuffer (silhouettes projected onto the stage)
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
1. the SET → main canvas (camera applied): `sky`, `scene.collectLights` (every light registers
   first, so rim, washes and shadows are stable), the back layer (distant elements drawn behind the
   backdrop, e.g. the rooftop searchlight beam, so the buildings occlude it), backdrop, light
   fixtures.
2. the BACK light buffer (camera applied, composited with `lighter` BEFORE the cast): a faint
   ambient lift, the backdrop's distant window bloom (soft halos + the odd failing-tube flicker),
   then per scene light its volumetric beam (the street lamp shaft), halo, floor + wall washes, and
   the wet-floor reflection + ripples. Being behind the cast, a foreground figure correctly occludes
   the light and the beams behind it. (A distant beam like the searchlight uses the same beam model
   but draws in the back layer in step 1, so the buildings occlude it too.)
3. the CAST → main, BACK TO FRONT. Each object whose `castsShadow` is true has its shadow painted
   (to the shadow buffer, projected through the strongest lights onto the floor and, where the set
   has one, up the back wall) and composited onto the scene RIGHT BEFORE the object is drawn. So a
   shadow lands not only on the floor and wall but on the cast already drawn behind it (a figure in
   front shadows a figure behind), and the object then draws over its own shadow. Brass last.
4. the FRONT light buffer (composited with `lighter` AFTER the cast): only lights flagged `front`
   (a cigarette ember, a held match), so their glow reads over the figure.
5. weather (rain, lightning) over the lit scene.
6. screen-space post (grain, vignette) and transition (ink wipe + act card).

Light and shadow are two services over one shared stage (`render/stage.js`: the floor plane plus an
optional near wall). A light is described once with `addLight({...})`, the lighting passes paint it.
A shadow needs nothing from the object beyond `castsShadow` (and an optional `shadowSil`): the
compositor turns each `castsShadow` object into a caster and paints it in depth order. The look is
tuned centrally in `style/shadows.js` (SHADE, AMBIENT, WASH).

## Viewport and HUD

The story always plays in a wide, landscape frame, and the chrome around it runs on one shared
system.

- Landscape frame (`engine/viewport.js` + `engine.js`): the canvas is sized to a target aspect band
  (`ASPECT_MIN` to `ASPECT_MAX`) and centered, so a too tall screen gets bars top and bottom and a
  too wide one gets bars left and right. Everything downstream reads `e.W/e.H` (the band), so the
  world never knows it is letterboxed. The cap is loose on purpose, so normal desktops and modern
  phones in landscape fill edge to edge and only genuine ultrawides pillarbox.
- 1080p anchor (the scaling contract): the world is drawn in a FIXED virtual resolution. The band is
  always `REF_H` logical units tall (1080, our anchor), so `e.H` is always 1080 and `e.W` is
  `1080 * aspect`. The engine folds a single scale `ls` (real band height over 1080) into the world
  transform (`DPR * ls`), so the whole scene is one uniform zoom of the same 1080p composition at any
  size: a phone, a 1080p screen, a 4K screen all show the identical framing, just at more or fewer
  pixels. The upshot for draw code: every size literal means "pixels at 1080p", and `e.unit` is a
  constant 3. Same aspect ratio, bigger or smaller screen is a pure uniform zoom. A different aspect
  ratio keeps the same vertical scale and only shows more or less world on the sides, it never
  resizes objects. Offscreen sprites that cache art (the skyline) bake at the real device scale
  `DPR * ls` so they stay crisp, while their geometry stays in logical units so the composition is
  identical at any resolution. Pointer drags are CSS px, so `boot.js` divides them by `ls` before the
  camera, keeping the look feel the same everywhere.
- Rotate gate (`viewport.js`): on a touch device held in portrait, starting a story goes fullscreen
  and asks for landscape (`screen.orientation.lock`), and the "rotate your screen" prompt shows only
  if that is refused. Reverting to portrait mid story shows the prompt again, and a "watch anyway"
  fallback plays letterboxed.
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
`e.litColor(...)`, `e.addLight({...})`, `e.walkSound(bool)`.

`opts`: `castsShadow`, `depth`, the optional hooks `update(dt, e)`, `emitLight(e)`, `shadowSil(e, c)`,
and shadow sizing `shadowW`/`shadowH`/`shadowDensity`. To emit light, `emitLight` calls
`e.addLight({ x, y, col:'r,g,b', r, I, ew, eh, beam?, front?, shade?, ... })`; the lighting pass
draws the halo, washes, reflection and the optional volumetric `beam` (a cone of light in the air),
so objects never draw their own glow or beam. `front:true` paints a light in front of the cast (a
cigarette ember), the default is behind it. `shade:true` caps the glow above the emitter (a hooded
lamp). A backdrop may also paint distant window bloom on the light buffer via an optional `glow(e)`
hook. Shadows are automatic: the compositor turns each `castsShadow` object into a caster and paints
its shadow in depth order, right before drawing it. Give it a `shadowSil(e, c)` to cast its real
shape (draw the solid body in local feet-origin coords, plain fills, into the passed ctx `c`);
without one it falls back to a billboard from `shadowW`/`shadowH`. Objects never draw their own
shadow.

Backdrops: `defineBackdrop(name, data => ({ indoor?, wallTop?, build(e){ return geom }, draw(e){ /* this.geom */ } }))`.
`build` precomputes geometry on resize (cached on `this.geom`); `draw` paints each frame. A set with
a near back wall (room, alley) sets `wallTop` (0..1 or px) so light washes and shadows project onto
it; omit it on open sets (skyline, rooftop) to keep them floor only.

## Extending

- New object: add a `define*` to the right `src/library/**` file (or a new file imported by
  `src/library/index.js`), then add the name to the editor help in `index.html` and to `stories/SCHEMA.md`.
- New story: `stories/<id>/story.js` (`export default {...}`, see `SCHEMA.md`) + a `manifest.js` entry.
  Per-story behaviour is data (params, `fx`, `onFlag`/`hideOnFlag`), not engine edits.
- Restyle the world: `style/palette.js` (palette/timing), `style/materials.js` (shading),
  `style/shadows.js` (shadow + ambient + surface-wash look), `render/lighting.js` (light model),
  `render/shadows.js` + `render/stage.js` (shadow model + stage geometry), `render/passes/post.js`
  (screen finish).
- Restyle the HUD chrome: the design tokens in the `:root` block of `styles/inkfall.css`.
- New HUD control: give it `class="hud-btn hud-sm|hud-md|hud-lg"` and show it from a stage rule
  (`body[data-stage="playing"] ...`) rather than toggling it by hand.

## Conventions

- Vanilla JS, native modules, no bundler in dev, no dependencies. Stories are pure data (default
  exports). Do not reintroduce globals.
- Lighting and shadows go through the two shared services (`render/lighting.js`, `render/shadows.js`)
  over the one stage (`render/stage.js`). Do not hand-roll per-object lighting or shadows, that is
  what keeps the look uniform.
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
