# INKFALL — a hallucination of *Sin City*

An open, walkable 3D environment that runs in a phone or desktop browser. No build
step, no install — it's a single `index.html` file using [Three.js](https://threejs.org/)
loaded from a CDN.

The look is a dream of Frank Miller's **Sin City** / Basin City: stark high-contrast
black & white, rain that never stops, film grain, vignette — and the only things that
keep their colour are the ones that *bleed*. Red neon, a yellow sign, a woman in a red
dress, a red car in the dark.

## Live on GitHub Pages

One-time setup (takes ~10 seconds, must be done by the repo owner):

> **Repo → Settings → Pages → Build and deployment**
> **→ Source: _Deploy from a branch_ → Branch: `main` / `/ (root)` → Save.**

GitHub then serves the site at:

```
https://masoudqashqai.github.io/Inkfall/
```

Every push to `main` automatically redeploys. Open that URL on your phone — that's the
whole experience. (The `.nojekyll` file tells Pages to serve the files as-is.)

## Run it locally

Because it loads ES modules over a CDN, open it through a web server (not `file://`):

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Controls — touch only

- **Drag** anywhere — look around
- **Tap** — start walking forward (toward where you're looking); **tap again** to stop
- **Two fingers** — run

(Mouse drag/click also works on a laptop for quick testing.)

## The noir grade

The signature effect is a custom post-processing shader (`NoirShader` in `index.html`):

- desaturate the whole frame to high-contrast luminance,
- **but** detect pixels that are strongly red or yellow and let their colour survive,
- add film grain, a vignette, bloom on the neon, and occasional lightning.

Toggle `keepYellow` in the shader uniforms to `0.0` for a red-only grade.

## Tech

- Three.js `r160` (ES modules via jsDelivr) + `EffectComposer`, `UnrealBloomPass`, custom `ShaderPass`
- Procedurally generated city (seeded, so it's the same town every time)
- Instanced geometry for towers and lit windows so it stays smooth on mobile
- GPU rain, drifting mist, flickering neon, a bruised moon

It's a hallucination, not the comic — a mood you can walk through.
