# INKFALL — a hallucination of *Sin City*

A 2D noir tableau that runs in any phone or desktop browser. No build step, no install,
no libraries, no internet needed at runtime — it's a single `index.html` drawn entirely
on an HTML5 `<canvas>`.

The look is a dream of Frank Miller's **Sin City** / Basin City: stark high-contrast
black & white, rain that never stops, film grain and a heavy vignette — and the only
things that keep their colour are the ones that *bleed*. A woman in a red dress walking
away, red & yellow neon humming over the street, the ember of a cigarette.

You stand on the wet street as a trench-coat figure under a streetlamp while
hard-boiled captions narrate the night.

## Live on GitHub Pages

One-time setup (takes ~10 seconds, must be done by the repo owner):

> **Repo → Settings → Pages → Build and deployment**
> **→ Source: _Deploy from a branch_ → Branch: `main` / `/ (root)` → Save.**

GitHub then serves the site at:

```
https://masoudqashqai.github.io/Inkfall/
```

Every push to `main` automatically redeploys. Open that URL on your phone — that's the
whole experience.

## Run it locally

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

It also works opened straight from disk (`file://`) — no server required, since there
are no external dependencies.

## Controls — touch only

- **Tap** — next caption line
- **Drag** — look left/right (parallax across the city)
- **Hold** — call down a lightning strike

(Mouse also works for quick testing on a laptop.)

## How the noir look is made

Everything is hand-drawn on a 2D canvas, so the selective colour is trivial: the whole
palette is grayscale **except** the things drawn in red/yellow (the dress, the neon, the
cigarette ember). On top of that:

- a seeded, parallaxing city skyline (3 depth layers) with scattered lit windows,
- slanted rain, a cone-of-light streetlamp, a bruised crescent moon,
- procedural film grain, a radial vignette, and timed lightning flashes,
- comic-panel caption boxes with original hard-boiled narration.

It's a hallucination, not the comic — a mood, not a port.
