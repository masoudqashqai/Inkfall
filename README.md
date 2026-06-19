# INKFALL — a hallucination of *Sin City*

An open, walkable 3D environment that runs in a phone or desktop browser. No build
step, no install — it's a single `index.html` file using [Three.js](https://threejs.org/)
loaded from a CDN.

The look is a dream of Frank Miller's **Sin City** / Basin City: stark high-contrast
black & white, rain that never stops, film grain, vignette — and the only things that
keep their colour are the ones that *bleed*. Red neon, a yellow sign, a woman in a red
dress, a red car in the dark.

## Live on GitHub Pages

This repo deploys itself. The workflow in `.github/workflows/deploy.yml` publishes the
site to GitHub Pages on every push to `main`. One-time setup:

> **Repo → Settings → Pages → Build and deployment → Source: _GitHub Actions_.**

After that, every push to `main` redeploys, and the city is live at:

```
https://masoudqashqai.github.io/inkfall/
```

Open that URL on your phone — that's the whole experience.

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
