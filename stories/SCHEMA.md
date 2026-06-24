# Story schema (v2)

A story is **pure data** (no engine code): a folder `stories/<id>/story.js` that does
`export default { ... }`, registered in `stories/manifest.js`. The in-app **STORY** editor
reads and writes this same shape as JSON, so anything here can be pasted and played live.

## Story

```js
export default {
  title: 'INKFALL',          // intro title (first 3 chars render red) + used on the act card
  subtitle: 'A TAGLINE',     // intro subtitle
  blurb: 'One paragraph.',   // intro description
  audio: { ... },            // optional; omit for a silent story (see Audio)
  scenes: [ /* Scene, ... */ ]
}
```

## Scene

```js
{
  title: 'THE&nbsp;STREET',     // act card + scene tag (use &nbsp; for hard spaces)
  ground: 0.8,                  // 0..1 of height: where the floor meets the wall
  keyLight: { x: 0.3, y: 0.5 }, // fallback rim direction when no real light dominates
  moon: { x: 0.78, y: 0.18 },   // optional moon position (a weak cool light)
  hideMoon: false,              // optional: walls occlude the moon (alley)
  indoor: false,                // optional: no rain/lightning (also implied by an indoor backdrop)
  bloodRain: false,             // optional: rain + ripples run red
  ambience: 'amb_street.mp3',   // optional per-scene looping bed
  ambienceVol: 0.4, rainVol: 0.16,
  backdrop: { type, ...options },
  lights:  [ Light, ... ],
  cast:    [ CastEntry, ... ],  // a CastEntry names a library object by `type`
  script:  [ Line, ... ],
}
```

## Backdrop (`backdrop.type`)

- **skyline** `{ seed, layers: [{ depth, top, shade, minW, maxW, minH, maxH, win }], reflect: [{ x, color }] }`
  (`reflect` paints static neon reflections on the wet floor.)
- **alley** `{ seed }`
- **rooftop** `{ seed }`
- **room** (interior, sets `indoor`) `{ wall, wallTop, door }` (`door` is 0..1 x, or omit)

## Light (`lights[].type`)

Common: `x` (0..1), `y` (0..1), `par` (parallax factor), `intensity`, `flicker`, `seed`.
- **lamp** street lamp at `x`. `scale`.
- **neon** `{ x, y, w, h, color, label, arrow?, ignite? }` (arrow = diner arrow; ignite = strikes on once at scene start).
- **bulb** bare hanging bulb at `{ x, y }`.
- **glow** soft area light `{ x, y, r, color }` where `color` contains the token `ALPHA`, e.g. `'rgba(190,200,220,ALPHA)'`.

## CastEntry (`cast[].type`)

Common: `x` (0..1), `y` (0..1, floating props), `scale`, `dy` (vertical nudge in units),
`par` (parallax factor), `flip`. Reveal/hide by event flag: `onFlag` / `hideOnFlag` (flags
are set by a line's `fx`). Optional `depth` controls draw order (lower drawn first).

Per-type options used today: `walk` (array of x marks, one per line) + `walkDur`, `passX`
(womanInRed, redCar), `raiseAt` / `lightAt` (trenchMan), `raiseAt` (gunman), `greenAt`
(trafficLight), `flyAt` / `delay` (crow), `drainAt` / `drainX` (bloodDrain),
`kind: 'martini'|'whiskey'` (drink), `bloody` (knife), `glow: false` (cardTable),
`label` (streetSign), `seed` (steam / bloodSplat / newspaper), `red` (singer).

Library objects by category (see `src/library/`):
- **actors (people)** trenchMan, thug, boss, gunman, dealer, womanInRed, singer
- **actors (animals)** cat, crow
- **movers** redCar
- **props (casino)** cardTable, slotMachine, rouletteWheel, drink, cash
- **props (weapons)** knife, pistol, tommyGun
- **props (street)** trafficLight, barrelFire, fireHydrant, payphone, streetSign, waterTower, dumpster, manhole
- **effects** steam, searchlight, newspaper, bloodSplat, bodyOnGround, chalkOutline, bloodDrain

## Line (`script[]`)

```js
{ text: 'A caption. <b>red</b> words bleed.', fx: ['muzzle', 'blood', 'lightning'] }
```

`fx` fires events for that line:
- **muzzle** muzzle flash + gunshots + ejected shells (from the `gunman` in the cast) + a camera shake
- **blood** sets the `blood` flag (reveals `onFlag:'blood'`, hides `hideOnFlag:'blood'`)
- **lightning** a bolt + thunder
- **lighter** Zippo lid + flint (paired with trenchMan `lightAt`)

## Audio (optional, story-scoped)

```js
audio: {
  music: 'burning_silence.mp3', musicVol: 0.5,
  rain:  'rain.mp3',  rainVol: 0.16,
  sfx: { gunshot: { src: 'gunshot.mp3', vol: 0.95, n: 3 }, /* keys: gunshot, shell, hammer, footstep, lidopen, flint, neon, thunder, whoosh */ },
  musicStart: 55,                 // optional: start + loop the music from this offset (seconds) instead of 0
}
```

Files resolve under `assets/audio/`. No `audio` block means silent. Per-scene `ambience`
is a looping bed swapped in on scene entry.
