# INKFALL — a noir story engine

A tiny **framework for noir comic scenes**, and a story told with it. Two plain files —
`index.html` (the engine) and `story.js` (the content) — drawn on an HTML5 `<canvas>`
with no libraries, no build step, and no internet at runtime. Works on any phone, even
offline.

The idea (the whole point): the **engine** owns the *look* — a fixed black-and-white
palette where only the things that bleed keep their colour, declared light sources, rain,
film grain, vignette, lightning, scene transitions, and comic-caption narration. The
**story is just data** (`window.INKFALL_STORY` in `story.js`). To tell a different tale
you edit that data, not the engine.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  NOIR ENGINE (the grammar)  │  ◀───  │  STORY (pure data)           │
│  palette · lights · rain    │        │  scenes → backdrop, lights,  │
│  grain · vignette · bolts   │        │  cast, script (the lines)    │
│  transitions · captions     │        └──────────────────────────────┘
└─────────────────────────────┘
```

## Live on GitHub Pages

> **Repo → Settings → Pages → Source: _Deploy from a branch_ → `main` / `/(root)` → Save.**

Then it's live at `https://masoudqashqai.github.io/Inkfall/` and every push to `main`
redeploys. The browser/CDN caches the old page, so after a push either hard-refresh or
open `…/Inkfall/?v=N` (any new number) to force the latest. A small **build tag** in the
bottom-left corner tells you which version you're actually running.

Locally: `python3 -m http.server 8000`, or just open `index.html` from disk.

## Controls — touch only

- **Tap** — next caption / next scene
- **Drag** — look across the scene (parallax)
- **Hold** — call down a lightning strike

## The default story

`story.js` ships with **“The Last Deal of Danny Cole”** — a small man tries to get rich
in the underground casinos of Basin City, loses everything, kills a man by accident in
the alley, and is gunned down by the mob. Five scenes: **The Itch → The Table → The Loss
→ The Accident → The Reckoning.**

## Writing a story — two ways

**1. Edit `story.js`.** The whole tale is the data in `window.INKFALL_STORY`. Change a
line, add a scene, swap a backdrop — no engine code involved.

**2. Use the in-app editor.** Tap **✎ STORY** (top-right). It opens the current story as
JSON; edit or paste a new one and hit **▶ PLAY** to run it instantly. What you play is
saved in your browser (`localStorage`), so it survives a refresh; **DEFAULT** restores
Danny Cole. This is the fastest way to feed it a story from your phone.

A story is a list of scenes. Each scene names a **backdrop**, declares its **lights**,
places a **cast** of actors at normalized `x` (0 = left, 1 = right), and lists a
**script** of caption lines. A line can fire effects (`muzzle`, `blood`, `lightning`),
and a cast member can be revealed or hidden by those effects via `onFlag` / `hideOnFlag`
(e.g. a standing man `hideOnFlag: 'blood'` and a body `onFlag: 'blood'` swap on the shot).

Story data is plain JSON — colours are **hex strings** (`'#ffd400'`), not `PALETTE.*` or
any JavaScript, so it pastes straight into the in-app editor:

```js
{
  title: 'THE&nbsp;STREET',
  ground: 0.8,                          // where the street meets the wall (0..1 of height)
  keyLight: { x: 0.3, y: 0.5 },         // direction figures are rim-lit from
  backdrop: { type: 'skyline', seed: 20051993, layers: [...], reflect: [...] },
  lights: [
    { type: 'lamp', x: 0.30, flicker: true },
    { type: 'neon', x: 0.66, y: 0.30, w: 40, h: 120, color: '#ffd400', label: 'XXX' },
  ],
  cast: [
    { actor: 'redCar',     x: 0.84, scale: 0.7 },
    { actor: 'womanInRed', x: 0.62, scale: 0.8 },
    { actor: 'trenchMan',  x: 0.34, smoke: true },
  ],
  script: [
    { text: 'She walks past in a dress the colour of <b>fresh blood</b>.' },
    { text: 'Two shots. The bricks wear <b>red</b>.', fx: ['muzzle', 'blood', 'lightning'] },
  ],
}
```

**Built-in backdrops:** `skyline`, `alley`, `rooftop`, `room` (interior — sets
`indoor: true`, so rain and lightning don't fall inside).
**Built-in light types:** `lamp`, `neon`, `bulb`, `glow`.
**Built-in actors:**
- *people* — `trenchMan` (detective), `thug`, `boss`, `gunman`, `dealer`, `womanInRed`, `singer`
- *weapons* — `knife` (`bloody:true` for a drip), `pistol`, `tommyGun`
- *casino* — `cardTable`, `slotMachine`, `rouletteWheel`, `drink` (`kind:'martini'|'whiskey'`), `cash`
- *street/props* — `redCar`, `barrelFire`, `fireHydrant`, `payphone`, `streetSign`, `cat`, `steam`, `crow`, `waterTower`, `newspaper`, `searchlight`
- *aftermath* — `bloodSplat`, `bodyOnGround`, `chalkOutline`

Common cast options: `x` (0..1), `y` (0..1, for floating props), `scale`, `dy` (vertical
nudge in units), `par` (parallax factor), `flip`, plus actor-specific ones noted above.

Inline `<b>…</b>` in a line renders **red**, like a Sin City caption.

## Extending the engine

Add a prop once and every story can use it by name:

```js
Noir.registerActor('streetSign', (e, p) => {
  const c = e.ctx, X = e.X(p);          // e = engine env: ctx, W, H, t, gy, unit, palette…
  // ...draw using e.palette so it stays on-style...
});
```

Backdrops are `{ build(e, sc), draw(e, sc) }` (build precomputes geometry on resize).

It's a hallucination, not the comic — a mood, and a machine for making more of them.
