/* INKFALL — STORY: "The Sable Dame" (pure data; no engine code). See stories/SCHEMA.md.
   A homicide detective, a woman in black, and a murder that opens and shuts too easily.
   Cast entries name a library object by `type`; <b>…</b> prints in blood red. */
export default {
  title: 'INKFALL',
  subtitle: 'THE SABLE DAME',
  blurb: 'A union baron dies clean in his tower and the woman in black says she did it. Homicide detective Butch Deckard works it like she is innocent — and falls. Two files, one river, one truth he will never tell.',
  audio: {
    music: 'piano_noir.wav', musicVol: 0.62, rain: 'rain.mp3', rainVol: 0.16,
    sfx: {
      gunshot: { src: 'gunshot.mp3', vol: 0.95, n: 3 },
      shell: { src: 'shell.mp3', vol: 0.5, n: 4 },
      hammer: { src: 'hammer.mp3', vol: 0.9, n: 2 },
      footstep: { src: 'footstep.mp3', vol: 0.5 },
      lidopen: { src: 'lidopen.mp3', vol: 0.8 },
      flint: { src: 'flint.mp3', vol: 0.8 },
      neon: { src: 'neon_crackle.mp3', vol: 0.3 },
      thunder: { src: 'thunder.mp3', vol: 0.5 },
      whoosh: { src: 'whoosh.mp3', vol: 0.5 },
    },
  },
  scenes: [

    { // 1 · THE CALL
      title: 'THE&nbsp;CALL', ground: 0.8, keyLight: { x: 0.30, y: 0.5 }, ambience: 'amb_street.mp3', ambienceVol: 0.4,
      backdrop: {
        type: 'skyline', seed: 2049,
        layers: [
          { depth: 0.25, top: 0.12, shade: '#0c0e13', minW: 60, maxW: 130, minH: 0.42, maxH: 0.72, win: 0.10 },
          { depth: 0.55, top: 0.20, shade: '#070809', minW: 80, maxW: 170, minH: 0.48, maxH: 0.86, win: 0.16 },
          { depth: 1.00, top: 0.28, shade: '#020203', minW: 120, maxW: 260, minH: 0.58, maxH: 0.98, win: 0.20 }
        ],
        reflect: [{ x: 0.5, color: '#9fb4d6' }, { x: 0.2, color: '#ff0018' }]
      },
      lights: [
        { type: 'lamp', x: 0.30, intensity: 1, flicker: true, par: 0.5 },
        { type: 'neon', x: 0.62, y: 0.14, w: 52, h: 150, color: '#9fb4d6', label: 'VANE', seed: 3.0 }
      ],
      cast: [
        { type: 'steam', x: 0.5, seed: 0.3 },
        { type: 'redCar', x: 0.86, scale: 0.7, par: 0.5 },
        { type: 'trenchMan', x: 0.34, scale: 1, dy: 4, par: 0.5, lightAt: 3 }
      ],
      script: [
        { text: 'Rain in Basin City doesn’t fall. It hunts.' },
        { text: 'Two a.m. Penthouse, Vane Tower. One stiff.' },
        { text: '<b>Tobias Vane</b> built half the skyline on union money and broken kneecaps.' },
        { text: 'Now he’s a stain on imported marble. Somebody balanced the books.', fx: ['lighter'] }
      ]
    },

    { // 2 · THE PENTHOUSE
      title: 'THE&nbsp;PENTHOUSE', ground: 0.82, keyLight: { x: 0.7, y: 0.3 },
      backdrop: { type: 'penthouse', seed: 4040 },
      lights: [
        { type: 'glow', x: 0.5, y: 0.34, r: 260, color: 'rgba(150,170,205,ALPHA)', intensity: 0.5 }
      ],
      cast: [
        { type: 'bodyOnGround', x: 0.62, scale: 1, par: 0.4 },
        { type: 'bloodSplat', x: 0.62, seed: 7 },
        { type: 'pistol', x: 0.5, y: 0.86, par: 0.4 },
        { type: 'womanInBlack', x: 0.16, scale: 0.85, par: 0.4 }
      ],
      script: [
        { text: 'One bullet. Right where the spine meets the skull. Professional.' },
        { text: 'The gun still in the room, dropped like a hot coal. Amateur panic.' },
        { text: 'She sat in the corner — a black dress the colour of the space between streetlights.' },
        { text: '<b>Vera Sable.</b> “I was his.” In this town, that covered it.', fx: ['lightning'] }
      ]
    },

    { // 3 · THE CAGE
      title: 'THE&nbsp;CAGE', ground: 0.82, keyLight: { x: 0.5, y: 0.3 },
      backdrop: { type: 'room', wall: '#06070b', wallTop: '#0b0d12', door: 0.9 },
      lights: [
        { type: 'bulb', x: 0.5, y: 0.26, intensity: 0.9, flicker: true, par: 0.2 }
      ],
      cast: [
        { type: 'trenchMan', x: 0.34, scale: 0.95, par: 0.3 },
        { type: 'coffee', x: 0.5, y: 0.8, scale: 1 },
        { type: 'womanInBlack', x: 0.66, scale: 0.9, par: 0.3 }
      ],
      script: [
        { text: 'I should’ve handed her to the prosecutors. Instead I bought her coffee.' },
        { text: '“Did you do it?” “Would it change anything if I said no?”' },
        { text: '“Then no.” The one true thing in a week of lies. A splinter.' },
        { text: 'I worked it like she was innocent. Told myself it was thoroughness.' }
      ]
    },

    { // 4 · THE PARTNER
      title: 'THE&nbsp;PARTNER', ground: 0.82, keyLight: { x: 0.4, y: 0.3 },
      backdrop: { type: 'room', wall: '#05060a', wallTop: '#090b10', door: 0.12 },
      lights: [
        { type: 'bulb', x: 0.42, y: 0.26, intensity: 0.8, flicker: true, par: 0.2 }
      ],
      cast: [
        { type: 'trenchMan', x: 0.32, scale: 0.95, par: 0.3 },
        { type: 'thug', x: 0.7, scale: 1, par: 0.3 }
      ],
      script: [
        { text: 'Vane was about to <b>talk</b>. Names. Ledgers. The whole rotten architecture.' },
        { text: 'That made powerful men want him quiet — and cops want it closed fast.' },
        { text: 'My partner. <b>Hollis Renn.</b> Twenty years, a smile too wide for two a.m.' },
        { text: 'I kept pulling the thread. The more I pulled, the more Hollis was on the end of it.' }
      ]
    },

    { // 5 · THE PULSE
      title: 'THE&nbsp;PULSE', ground: 0.82, keyLight: { x: 0.55, y: 0.35 },
      backdrop: { type: 'room', wall: '#070608', wallTop: '#0c0a0e' },
      lights: [
        { type: 'neon', x: 0.16, y: 0.18, w: 116, h: 34, color: '#ff0018', label: 'HOTEL', seed: 2.2, par: 0.2 }
      ],
      cast: [
        { type: 'womanInBlack', x: 0.56, scale: 0.96, par: 0.3 },
        { type: 'trenchMan', x: 0.40, scale: 0.98, par: 0.3 }
      ],
      script: [
        { text: '“Who are you protecting?” “Knowing gets you a bullet in this town.”' },
        { text: 'Rain and gardenias and a fear so old it forgot how to be anything else.' },
        { text: 'She kissed me instead. God help me, I let her.' },
        { text: '“<b>I did it, Butch.</b> Vane killed my sister. I learned where the spine meets the skull.”', fx: ['muzzle', 'lightning'] },
        { text: 'Except — Vera Sable had no sister on any record. Not one.' }
      ]
    },

    { // 6 · THE RIVER
      title: 'THE&nbsp;RIVER', ground: 0.8, keyLight: { x: 0.5, y: 0.4 }, ambience: 'amb_rooftop.mp3', ambienceVol: 0.4,
      backdrop: {
        type: 'skyline', seed: 909,
        layers: [
          { depth: 0.3, top: 0.2, shade: '#0c0e13', minW: 60, maxW: 140, minH: 0.34, maxH: 0.66, win: 0.10 },
          { depth: 0.6, top: 0.3, shade: '#070809', minW: 90, maxW: 180, minH: 0.40, maxH: 0.78, win: 0.14 },
          { depth: 1.0, top: 0.42, shade: '#020203', minW: 120, maxW: 250, minH: 0.46, maxH: 0.94, win: 0.16 }
        ],
        reflect: [{ x: 0.5, color: '#9fb4d6' }, { x: 0.3, color: '#ff0018' }]
      },
      lights: [
        { type: 'lamp', x: 0.7, intensity: 1, flicker: true, par: 0.5 }
      ],
      cast: [
        { type: 'steam', x: 0.4, seed: 1.1 },
        { type: 'trenchMan', x: 0.5, scale: 1, par: 0.5 }
      ],
      script: [
        { text: 'Two files in my coat. One hanged Renn and freed her. One hanged her.' },
        { text: 'I stood on the Vane Tower steps a long time. Soaked through to the skin.' },
        { text: 'I dropped one in the river. Ink running black into black, gone before it hit the dark.', fx: ['lightning'] },
        { text: 'I’m not going to tell you which one I kept.' },
        { text: 'A year later: a postcard. No return address. “<b>Thank you, detective.</b>”' }
      ]
    }

  ]
};
