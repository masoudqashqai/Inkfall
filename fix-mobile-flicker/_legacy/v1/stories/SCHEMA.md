# Story schema

A story is **pure data** (no engine code). Each story is a folder under `stories/<id>/`
with a `story.js` that does `export default { ... }`, registered in `stories/manifest.js`.
The same shape is what the in-app **✎ STORY** editor reads and writes as JSON, so anything
expressible here can be pasted into the editor and played live.

## Story

```js
export default {
  title: 'INKFALL',          // shown on the intro; first 3 chars are coloured red
  subtitle: 'A TAGLINE',     // intro subtitle
  blurb: 'One paragraph…',   // intro description
  audio: { … },              // optional; omit for a silent story (see Audio)
  scenes: [ /* Scene, … */ ] // required, non-empty
}
```

## Scene

```js
{
  title: 'THE&nbsp;STREET',     // act-name card + scene tag (use &nbsp; for hard spaces)
  ground: 0.8,                  // 0..1 of height: where the floor/street meets the wall
  keyLight: { x: 0.3, y: 0.5 }, // direction figures are rim-lit from when no real light dominates
  moon: { x: 0.78, y: 0.18 },   // optional moon position (a weak cool light)
  hideMoon: false,              // optional: walls occlude the moon (alley) → no phantom reflection
  indoor: false,                // optional: no rain/lightning falls (also implied by an indoor backdrop)
  bloodRain: false,             // optional: rain + ripples run red
  ambience: 'amb_street.mp3',   // optional per-scene looping bed (must be declared in audio.sfx? no — see Audio)
  ambienceVol: 0.4, rainVol: 0.16,
  backdrop: { type, …options }, // skyline | alley | rooftop | room
  lights:  [ Light, … ],        // lamp | neon | bulb | glow
  cast:    [ Cast, … ],         // actors at normalized x (0 = left, 1 = right)
  script:  [ Line, … ],         // the caption lines
}
```

## Backdrop (`backdrop.type`)

- **skyline** — `{ seed, layers: [{ depth, top, shade, minW, maxW, minH, maxH, win }], reflect: [{ x, color }] }`
- **alley** — `{ seed }`
- **rooftop** — `{ seed }`
- **room** (interior, sets `indoor`) — `{ wall, wallTop, door }` (`door` is 0..1 x, or omit)

## Light (`lights[].type`)

Common: `x` (0..1), `y` (0..1), `par` (parallax factor), `intensity`, `flicker`, `seed`.

- **lamp** — street lamp at `x` (rises from the ground). `scale`.
- **neon** — `{ x, y, w, h, color, label, arrow?, ignite? }` (`arrow` = diner arrow; `ignite` = strikes on once at scene start).
- **bulb** — bare hanging bulb at `{ x, y }`.
- **glow** — soft area light `{ x, y, r, color }` where `color` contains the token `ALPHA`, e.g. `'rgba(190,200,220,ALPHA)'`.

## Cast (`cast[].actor`)

Common options: `x` (0..1), `y` (0..1, floating props), `scale`, `dy` (vertical nudge in units),
`par` (parallax factor), `flip`. Reveal/hide by event flag: `onFlag` / `hideOnFlag` (flags are
set by a line's `fx`, e.g. a standing `gunman` with `hideOnFlag: 'blood'` and a `bodyOnGround`
with `onFlag: 'blood'` swap on the shot).

Choreography options used by some actors: `walk` (array of x marks, one per line), `walkDur`,
`passX`, `raiseAt`, `lightAt` (trenchMan/gunman), `greenAt` (trafficLight), `flyAt`/`delay`
(crow), `drainAt`/`drainX` (bloodDrain), `kind` (drink: `'martini'|'whiskey'`), `bloody` (knife),
`glow:false` (cardTable), `label` (streetSign), `seed` (steam/bloodSplat/newspaper).

Built-in actors by group (see `src/actors/`):
- **people** — `trenchMan`, `thug`, `boss`, `gunman`, `dealer`, `womanInRed`, `singer`
- **weapons** — `knife`, `pistol`, `tommyGun`
- **casino** — `cardTable`, `slotMachine`, `rouletteWheel`, `drink`, `cash`
- **street/props** — `redCar`, `trafficLight`, `barrelFire`, `fireHydrant`, `payphone`, `streetSign`, `cat`, `steam`, `crow`, `waterTower`, `newspaper`, `manhole`, `dumpster`, `searchlight`
- **aftermath** — `bloodSplat`, `bodyOnGround`, `chalkOutline`, `bloodDrain`

## Line (`script[]`)

```js
{ text: 'A caption. <b>red</b> words bleed.', fx: ['muzzle', 'blood', 'lightning'] }
```

`fx` fires events for that line:
- **muzzle** — muzzle flash + gunshots + ejected shells (from the `gunman` in the cast)
- **blood** — sets the `blood` flag (reveals `onFlag:'blood'` cast, hides `hideOnFlag:'blood'`)
- **lightning** — a bolt + thunder
- **lighter** — Zippo lid + flint sound (paired with trenchMan `lightAt`)

## Audio (optional, story-scoped)

```js
audio: {
  music: 'theme.mp3', musicVol: 0.5,
  rain:  'rain.mp3',  rainVol: 0.16,
  sfx: {
    gunshot: { src: 'gunshot.mp3', vol: 0.95, n: 3 }, // n = pool size for rapid retriggers
    // … keys map to engine sounds: gunshot, shell, heels, lidopen, flint, neon, crack, thunder, whoosh
  },
}
```

Files resolve under `assets/audio/`. A story with no `audio` block is silent. Per-scene
`ambience` is a looping bed swapped in on scene entry.
