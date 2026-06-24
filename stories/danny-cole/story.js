/* INKFALL — STORY: "The Last Deal of Danny Cole" (pure data; no engine code).
   See stories/SCHEMA.md. Cast entries name a library object by `type`. Reveal/hide a cast
   member with onFlag / hideOnFlag (set by a line's fx). <b>…</b> prints in blood red. */
export default {
  title: 'INKFALL',
  subtitle: 'THE LAST DEAL OF DANNY COLE',
  blurb: 'A small man with a big debt goes looking for easy money in the underground casinos of Basin City. The house always wins. Tap through his last bad night.',
  scenes: [

    { // 1 · THE ITCH
      title: 'THE&nbsp;ITCH', ground: 0.8, keyLight: { x: 0.3, y: 0.5 },
      backdrop: {
        type: 'skyline', seed: 19880420,
        layers: [
          { depth: 0.25, top: 0.18, shade: '#0c0e13', minW: 60, maxW: 130, minH: 0.34, maxH: 0.62, win: 0.10 },
          { depth: 0.55, top: 0.28, shade: '#070809', minW: 80, maxW: 170, minH: 0.40, maxH: 0.74, win: 0.16 },
          { depth: 1.00, top: 0.40, shade: '#020203', minW: 110, maxW: 240, minH: 0.46, maxH: 0.92, win: 0.22 }
        ],
        reflect: [{ x: 0.16, color: '#ff0018' }, { x: 0.66, color: '#ffd400' }, { x: 0.44, color: '#ff0018' }]
      },
      lights: [
        { type: 'lamp', x: 0.30, intensity: 1, flicker: true, par: 0.5 },
        { type: 'neon', x: 0.10, y: 0.40, w: 130, h: 34, color: '#ff0018', label: 'CASINO', seed: 1.3 },
        { type: 'neon', x: 0.70, y: 0.28, w: 44, h: 118, color: '#ffd400', label: 'LUCK', seed: 4.1 }
      ],
      cast: [
        { type: 'steam', x: 0.52, seed: 0.3 },
        { type: 'barrelFire', x: 0.07, scale: 0.85, par: 0.5 },
        { type: 'cat', x: 0.92, flip: true, par: 0.5 },
        { type: 'redCar', x: 0.86, scale: 0.7, dy: -6, par: 0.5 },
        { type: 'womanInRed', x: 0.62, scale: 0.8, par: 0.4 },
        { type: 'trenchMan', x: 0.34, scale: 1, dy: 4, par: 0.5 }
      ],
      script: [
        { text: 'Danny Cole had two suits, one good lung, and a dream the size of a debt.' },
        { text: 'Get rich or get gone. In Basin City that’s the same bus.' },
        { text: 'The neon promised him everything. Neon’s a liar with a pretty mouth.' },
        { text: 'Tonight he’d play the deep tables — the ones <b>under</b> the city.' }
      ]
    },

    { // 2 · THE TABLE
      title: 'THE&nbsp;TABLE', ground: 0.82, keyLight: { x: 0.5, y: 0.3 },
      backdrop: { type: 'room', wall: '#06070b', wallTop: '#0b0d12', door: 0.64 },
      lights: [
        { type: 'bulb', x: 0.45, y: 0.30, intensity: 1, flicker: true, par: 0.2 },
        { type: 'neon', x: 0.14, y: 0.20, w: 120, h: 30, color: '#ff0018', label: 'FORTUNE', seed: 2.2, par: 0.2 }
      ],
      cast: [
        { type: 'rouletteWheel', x: 0.20, y: 0.74, scale: 0.8, par: 0.2 },
        { type: 'slotMachine', x: 0.07, scale: 0.85, par: 0.2 },
        { type: 'slotMachine', x: 0.93, scale: 0.85, par: 0.2 },
        { type: 'dealer', x: 0.45, scale: 0.95 },
        { type: 'cardTable', x: 0.45, scale: 1.05 },
        { type: 'cash', x: 0.52, y: 0.79, scale: 0.85 },
        { type: 'drink', x: 0.63, y: 0.80, kind: 'whiskey', scale: 0.9 },
        { type: 'trenchMan', x: 0.76, scale: 1, par: 0.2 }
      ],
      script: [
        { text: 'Down past the meat locker, the air goes blue with smoke and worse.' },
        { text: 'Green felt. <b>Red</b> chips. A dealer who smiles like a closing door.' },
        { text: 'He bets the rent. Then the car. Then his father’s watch.' },
        { text: 'The cards turn cold. The house just breathes in, slow.' }
      ]
    },

    { // 3 · THE LOSS
      title: 'THE&nbsp;LOSS', ground: 0.82, keyLight: { x: 0.5, y: 0.3 },
      backdrop: { type: 'room', wall: '#05060a', wallTop: '#090b10', door: 0.62 },
      lights: [
        { type: 'bulb', x: 0.45, y: 0.30, intensity: 0.8, flicker: true, par: 0.2 }
      ],
      cast: [
        { type: 'slotMachine', x: 0.08, scale: 0.85, par: 0.2 },
        { type: 'dealer', x: 0.45, scale: 0.95 },
        { type: 'cardTable', x: 0.45, scale: 1.05, glow: false },
        { type: 'trenchMan', x: 0.74, scale: 0.97, par: 0.2 },
        { type: 'boss', x: 0.92, scale: 0.95, par: 0.2 }
      ],
      script: [
        { text: 'Cleaned out. Pockets full of lint and a marker he can’t cover.' },
        { text: 'The boss gives him till dawn. The boss is being <b>generous</b>.' },
        { text: 'No system beats a debt with your name carved in it.' },
        { text: 'Danny walks out owing more than he’s worth. Which isn’t much.' }
      ]
    },

    { // 4 · THE ACCIDENT
      title: 'THE&nbsp;ACCIDENT', ground: 0.8, keyLight: { x: 0.5, y: 0.3 },
      backdrop: { type: 'alley', seed: 44021 },
      lights: [
        { type: 'bulb', x: 0.5, y: 0.3, intensity: 1, flicker: true, par: 0.3 },
        { type: 'neon', x: 0.47, y: 0.42, w: 52, h: 22, color: '#ff0018', label: 'EAT', seed: 3.3, par: 0.3 }
      ],
      cast: [
        { type: 'steam', x: 0.40, seed: 0.9 },
        { type: 'barrelFire', x: 0.88, scale: 0.85, par: 0.5 },
        { type: 'fireHydrant', x: 0.06, par: 0.5 },
        { type: 'cat', x: 0.14, par: 0.5 },
        { type: 'newspaper', x: 0, seed: 2.1 },
        { type: 'gunman', x: 0.34, scale: 1, par: 0.5, hideOnFlag: 'blood' },
        { type: 'knife', x: 0.40, y: 0.84, angle: 0.2, bloody: true, onFlag: 'blood' },
        { type: 'bodyOnGround', x: 0.34, scale: 1, par: 0.5, onFlag: 'blood' },
        { type: 'bloodSplat', x: 0.40, onFlag: 'blood', seed: 7 },
        { type: 'trenchMan', x: 0.72, scale: 1, par: 0.5 }
      ],
      script: [
        { text: 'A collector trails him into the alley. Knuckles, bad teeth, worse intentions.' },
        { text: 'They go for the same gun. It only answers to one of them.', fx: ['muzzle', 'blood', 'lightning'] },
        { text: 'The collector folds like a cheap hand. Danny didn’t mean it. Doesn’t matter.' },
        { text: 'He’s not a gambler anymore. He’s a <b>killer</b> with nowhere left to run.' }
      ]
    },

    { // 5 · THE RECKONING
      title: 'THE&nbsp;RECKONING', ground: 0.8, keyLight: { x: 0.7, y: 0.4 },
      backdrop: {
        type: 'skyline', seed: 90218,
        layers: [
          { depth: 0.3, top: 0.20, shade: '#0c0e13', minW: 60, maxW: 140, minH: 0.34, maxH: 0.66, win: 0.10 },
          { depth: 0.6, top: 0.30, shade: '#070809', minW: 90, maxW: 180, minH: 0.40, maxH: 0.78, win: 0.14 },
          { depth: 1.0, top: 0.42, shade: '#020203', minW: 120, maxW: 250, minH: 0.46, maxH: 0.94, win: 0.18 }
        ],
        reflect: [{ x: 0.30, color: '#ff0018' }, { x: 0.74, color: '#ff0018' }]
      },
      lights: [
        { type: 'lamp', x: 0.50, intensity: 1, flicker: true, par: 0.5 },
        { type: 'neon', x: 0.78, y: 0.30, w: 90, h: 30, color: '#ff0018', label: 'DEAD END', seed: 5.5 }
      ],
      cast: [
        { type: 'steam', x: 0.55, seed: 1.1 },
        { type: 'gunman', x: 0.66, scale: 1, par: 0.5 },
        { type: 'thug', x: 0.84, scale: 1, par: 0.5 },
        { type: 'boss', x: 0.97, scale: 0.92, par: 0.5 },
        { type: 'trenchMan', x: 0.30, scale: 1, par: 0.5, hideOnFlag: 'blood' },
        { type: 'bodyOnGround', x: 0.30, scale: 1, par: 0.5, flip: true, onFlag: 'blood' },
        { type: 'bloodSplat', x: 0.34, onFlag: 'blood', seed: 13 }
      ],
      script: [
        { text: 'Word travels fast when a made man stops breathing.' },
        { text: 'They find him where the rain pools deepest. Three coats, three guns.' },
        { text: 'He opens his mouth to deal one last time.', fx: ['muzzle'] },
        { text: 'The guns answer first. The gutter drinks him down.', fx: ['muzzle', 'blood', 'lightning'] },
        { text: 'Basin City balances its books by morning. Danny Cole doesn’t even leave a stain.' }
      ]
    }

  ]
};
