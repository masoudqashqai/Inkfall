// THE LOOK — the fixed art direction. Grayscale plus the colours that bleed.
// This is one of the central style knobs: change it and every story shifts.
export const PALETTE = {
  ink: '#020203', nearInk: '#050506', midInk: '#070809', farInk: '#0c0e13',
  paper: '#f5f2e8', bone: '#dcdcdc', steel: '#aab4c8',
  red: '#c8000f', redHot: '#ff0018', ember: '#ff2010', amber: '#ffd400',
  moon: '#e8edf6', skyTop: '#04050a', skyMid: '#0a0c12', skyLow: '#16181f',
  warmWin: 'rgba(255,236,196,0.9)', coolWin: 'rgba(202,220,255,0.72)',
};

// Global animation timing + overlay intensities. The other central style knob.
export const ANIM = {
  swaySpeed: 1.1, walkSpeed: 2.2, emberSpeed: 6, flickerSpeed: 9,
  rainAlpha: 0.35, grainAlpha: 0.015, grainAlphaEnd: 0.15, vignette: 0.7, parallaxLerp: 0.08,
  boltGap: [5, 13],
  transIn: 2.0, transOut: 1.6, cardHold: 1.7,   // scene-transition speed: higher in/out = faster wipe; cardHold = act-card dwell (s)
};
