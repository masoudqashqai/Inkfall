# INKFALL — a noir story engine

A tiny **framework for noir comic scenes**, and a story told with it. One single
`index.html`, drawn on an HTML5 `<canvas>` — no libraries, no build step, no internet at
runtime. Works on any phone, even offline.

The idea (the whole point): the **engine** owns the *look* — a fixed black-and-white
palette where only the things that bleed keep their colour, declared light sources, rain,
film grain, vignette, lightning, scene transitions, and comic-caption narration. The
**story is just data**. To tell a different tale you edit the `STORY` object, not the
engine.

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
redeploys. (Hard-refresh on your phone after a push — the browser caches the old page.)

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

```js
{
  title: 'THE&nbsp;STREET',
  ground: 0.8,                          // where the street meets the wall (0..1 of height)
  keyLight: { x: 0.3, y: 0.5 },         // direction figures are rim-lit from
  backdrop: { type: 'skyline', seed: 20051993, layers: [...], reflect: [...] },
  lights: [
    { type: 'lamp', x: 0.30, flicker: true },
    { type: 'neon', x: 0.66, y: 0.30, w: 40, h: 120, color: PALETTE.amber, label: 'XXX' },
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

**Built-in backdrops:** `skyline`, `alley`, `rooftop`, `room`.
**Built-in light types:** `lamp`, `neon`, `bulb`, `glow`.
**Built-in actors:** `trenchMan`, `womanInRed`, `gunman`, `redCar`, `cardTable`,
`dealer`, `bodyOnGround`, `steam`, `bloodSplat`, `crow`, `waterTower`, `newspaper`,
`searchlight`.

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
