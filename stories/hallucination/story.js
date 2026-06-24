/* INKFALL — STORY: the original three-scene hallucination (pure data; no engine code).
   A story = { title, subtitle, blurb, audio?, scenes: [...] }. See stories/SCHEMA.md.
   Cast entries name a library object by `type`; lights name a light by `type`. */
export default {
  title: 'INKFALL',
  subtitle: 'A HALLUCINATION OF SIN CITY',
  blurb: 'It always rains in Basin City. The whole town is black and white, except the things that bleed. Tap through the long, wet night.',
  audio: {
    music: 'burning_silence.mp3', musicVol: 0.5, rain: 'rain.mp3', rainVol: 0.16,
    sfx: {
      gunshot: { src: 'gunshot.mp3', vol: 0.95, n: 3 },
      shell: { src: 'shell.mp3', vol: 0.5, n: 4 },
      heels: { src: 'heels.mp3', vol: 0.5, n: 2 },
      lidopen: { src: 'lidopen.mp3', vol: 0.8 },
      flint: { src: 'flint.mp3', vol: 0.8 },
      neon: { src: 'neon.mp3', vol: 0.5 },
      crack: { src: 'crack.mp3', vol: 0.7 },
      thunder: { src: 'thunder.mp3', vol: 0.5 },
      whoosh: { src: 'whoosh.mp3', vol: 0.5 },
    },
  },
  scenes: [

    { // 1 · THE STREET
      title: 'THE&nbsp;STREET', ground: 0.8, keyLight: { x: 0.30, y: 0.5 }, ambience: 'amb_street.mp3', ambienceVol: 0.4,
      backdrop: {
        type: 'skyline', seed: 1977,
        layers: [
          { depth: 0.25, top: 0.16, shade: '#0c0e13', minW: 60, maxW: 130, minH: 0.34, maxH: 0.62, win: 0.10 },
          { depth: 0.55, top: 0.26, shade: '#070809', minW: 80, maxW: 170, minH: 0.40, maxH: 0.74, win: 0.16 },
          { depth: 1.00, top: 0.38, shade: '#020203', minW: 110, maxW: 240, minH: 0.46, maxH: 0.92, win: 0.22 }
        ],
        reflect: [{ x: 0.12, color: '#ff0018' }, { x: 0.40, color: '#ff0018' }, { x: 0.66, color: '#ffd400' }]
      },
      lights: [
        { type: 'lamp', x: 0.30, intensity: 1, flicker: true, par: 0.5 },
        { type: 'neon', x: 0.10, y: 0.52, w: 92, h: 34, color: '#ff0018', label: 'BAR', seed: 1.3 },
        { type: 'neon', x: 0.40, y: 0.48, w: 120, h: 30, color: '#ff0018', label: 'GIRLS', seed: 2.7, par: 0.4 },
        { type: 'neon', x: 0.66, y: 0.40, w: 44, h: 120, color: '#ffd400', label: 'XXX', seed: 4.1 }
      ],
      cast: [
        { type: 'steam', x: 0.52, seed: 0.3 },
        { type: 'trafficLight', x: 0.90, scale: 0.9, par: 0.6, greenAt: 2 },
        { type: 'redCar', x: 0.84, scale: 0.7, dy: -6, par: 0.5, walk: [0.84, 0.84, 1.45, 1.7], walkDur: 3.2 },
        { type: 'womanInRed', x: 0.7, scale: 0.8, par: 0.4, walk: [0.72, 0.52, 0.30, -0.3], walkDur: 11, passX: 0.34 },
        { type: 'trenchMan', x: 0.34, scale: 1, dy: 4, par: 0.5, raiseAt: 1, lightAt: 3 }
      ],
      script: [
        { text: 'The night is wet and the city drinks it down.' },
        { text: 'She walks past in a dress the colour of <b>fresh blood</b>.' },
        { text: 'Neon hums a lullaby for the damned.' },
        { text: 'I light a smoke and let the dark make the first move.', fx: ['lighter'] }
      ]
    },

    { // 2 · THE ALLEY
      title: 'THE&nbsp;ALLEY', ground: 0.8, keyLight: { x: 0.74, y: 0.3 }, moon: { x: 0.5, y: 0.11 },
      backdrop: { type: 'alley', seed: 77123 },
      lights: [
        { type: 'neon', x: 0.72, y: 0.24, w: 64, h: 34, color: '#ff0018', label: 'EAT', seed: 5.2, par: 0.3, arrow: true, ignite: true }
      ],
      cast: [
        { type: 'dumpster', x: 0.11, scale: 1, par: 0.4 },
        { type: 'manhole', x: 0.6, scale: 1.1, par: 0.2 },
        { type: 'steam', x: 0.6, seed: 0.9 },
        { type: 'newspaper', x: 0, restX: 0.2, seed: 2.1 },
        { type: 'gunman', x: 0.30, scale: 1, par: 0.5, raiseAt: 1 },
        { type: 'bodyOnGround', x: 0.5, scale: 1, par: 0.5, onFlag: 'blood' },
        { type: 'bloodSplat', x: 0.5, onFlag: 'blood', seed: 999 },
        { type: 'bloodDrain', x: 0.5, drainX: 0.6, par: 0.2, onFlag: 'blood', drainAt: 3 }
      ],
      script: [
        { text: 'The alley stinks of rain and old sins.' },
        { text: 'A shape in the doorway. A <b>gun</b> that means it.' },
        { text: 'Two shots. The bricks wear a fresh coat of <b>red</b>.', fx: ['muzzle', 'blood', 'lightning'] },
        { text: 'Nobody heard a thing. Nobody ever does here.' }
      ]
    },

    { // 3 · THE ROOFTOP
      title: 'THE&nbsp;ROOFTOP', ground: 0.72, keyLight: { x: 0.6, y: 0.4 }, moon: { x: 0.78, y: 0.18 }, bloodRain: true, ambience: 'amb_rooftop.mp3', ambienceVol: 0.45,
      backdrop: { type: 'rooftop', seed: 55512 },
      lights: [],
      cast: [
        { type: 'searchlight', x: 0.5 },
        { type: 'waterTower', x: 0.18, scale: 1, par: 0.4 },
        { type: 'crow', x: 0.18, y: 0.43, scale: 1.5, par: 0.4, flyAt: 3, delay: 0.0 },
        { type: 'crow', x: 0.36, y: 0.25, scale: 1.1, flyAt: 3, delay: 0.14 },
        { type: 'crow', x: 0.67, y: 0.22, scale: 1.0, flyAt: 3, delay: 0.26 },
        { type: 'steam', x: 0.74, seed: 0.5 },
        { type: 'womanInRed', x: 0.6, scale: 0.85, par: 0.4 }
      ],
      script: [
        { text: "Up here the city's just a field of dirty stars." },
        { text: "Crows watch. They've seen worse. So have I." },
        { text: 'She stands on the ledge, between two kinds of falling.' },
        { text: "The rain'll wash it clean by morning. It always lies." }
      ]
    }

  ]
};
