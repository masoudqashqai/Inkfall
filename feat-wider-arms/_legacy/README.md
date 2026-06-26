# INKFALL — a hallucination of *Sin City*

A 2D noir tableau that runs in any phone or desktop browser. No build step, no install,
no libraries, and no internet needed at runtime. It is a single `index.html` drawn entirely
on an HTML5 `<canvas>`, with a handful of bundled sound files under `assets/audio/` for the
rain, neon, and thunder ambiences.

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

## Three scenes, one long night

Tapping walks you through a noir story that re-stages itself with a comic-panel ink wipe,
looping through the same three scenes the way the original did. Each caption is staged on
screen as you read it.

1. **The Street**: a trench-coat man under a streetlamp takes out a cigarette, the woman in
   red walks in from the night, a parked red car pulls away as the light turns green, and he
   strikes a light while she glides slowly past him. Neon, manhole steam, a parked red car.
2. **The Alley**: converging brick walls, fire escapes, a hanging bulb, a gunman in the
   doorway with a red and yellow muzzle flash, blood on the bricks, blowing newspaper.
3. **The Rooftop**: the city as a field of dirty stars, a water tower with crows perched on
   it and the wires (they take off into the night on the last line), a sweeping searchlight,
   a lone figure on the ledge.

## Controls

- **Tap**: advance the caption, then ink-wipe to the next scene
- **Drag**: look left and right (parallax), and lean the rain into the wind
- **Hold**: call down a lightning strike (jagged bolt, flash, thunder)
- **♪ (top right)**: toggle the sound on or off
- **❖ (top right)**: pull a frame, freezing the moment into a downloadable poster

(Mouse also works for quick testing on a laptop.)

## Sound

Every sound is a real recording. A continuous film-noir music bed runs under the whole night,
joined by rain (whose level rises as the storm builds) and deep thunder after each strike. The
reactive hits are real one-shot samples too: the electric crack of the lightning, the Zippo
being struck, the gunshot in the alley, the brass casings ringing on the ground, the neon tube
crackling as it flickers, a cinematic whoosh as each scene lands, and her heels on the wet
pavement. Sound starts when you enter the city and can be muted any time with the corner control.

All audio is from [Mixkit](https://mixkit.co/free-sound-effects/) under the Mixkit Free License
(free to use, no attribution required).

## How the noir look is made

Everything is hand-drawn on a 2D canvas, so the selective colour is trivial: the whole
palette is grayscale **except** the things drawn in red and yellow (the dress, the neon, the
cigarette ember). On top of that:

- a seeded, parallaxing city skyline (3 depth layers) with scattered lit windows,
- a storm that breathes from drizzle to downpour and peaks on the gunshot, with rain that
  leans on the wind and puddle ripples that catch the neon,
- a cone of light from the streetlamp, a bruised crescent moon, procedural film grain, a
  ben-day halftone texture, and a radial vignette,
- comic-panel ink wipe transitions between scenes,
- comic-panel caption boxes with original hard-boiled narration, each line staged on screen
  (she walks in, the match flares, the light turns green and the car pulls away).

It's a hallucination, not the comic. A mood, not a port.
