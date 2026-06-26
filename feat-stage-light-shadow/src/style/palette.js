// THE LOOK — the fixed art direction. Grayscale plus the colours that bleed.
// This is one of the central style knobs: change it and every story shifts.
export const PALETTE = {
  ink: '#020203', farInk: '#0c0e13', steel: '#aab4c8',
  redHot: '#ff0018', ember: '#ff2010', amber: '#ffd400',
  moon: '#e8edf6', skyTop: '#04050a', skyMid: '#0a0c12', skyLow: '#16181f',
  warmWin: 'rgba(255,236,196,0.9)', coolWin: 'rgba(202,220,255,0.72)',
};

// NOIR GRADE — the screen-space film look applied once over the whole composited frame (in the post
// pass), so figures, set, sky and weather all grade together. Materials hold HONEST albedo and the
// scene is pulled toward black and white here, the most saturated sources (the neon, the dress, the
// blood) staying the most coloured, so "the only colour is the colour that bleeds". saturation: 1 =
// full colour, 0 = grayscale. tint/tintAmt: a faint cool wash multiplied over the frame. A live knob
// (tunable in the Shadow & Light lab).
export const NOIR = { saturation: 0.85, tint: '150,170,205', tintAmt: 0.05 };

// FILM — the filmic finish in the post pass, after the noir grade. bloom: how strongly the bright
// parts (neon, headlights, the moon) bleed a soft glow into the frame. warm: the hue of the warmth
// pushed into the highlights. temp: how much of that warmth (warm in the highlights against the cool
// shadows, the classic noir temperature). contrast: a gentle filmic S curve, so blacks sit deeper and
// the picture has more snap. A live knob set in the Shadow & Light lab.
export const FILM = { bloom: 0.5, warm: '255,184,120', temp: 0.1, contrast: 0.12 };

// Global animation timing + overlay intensities. The other central style knob.
export const ANIM = {
  swaySpeed: 1.1, walkSpeed: 2.2, emberSpeed: 6,
  rainAlpha: 0.32, grainAlpha: 0.01, grainAlphaEnd: 0.15, vignette: 0.35, parallaxLerp: 0.08,
  boltGap: [5, 13],
  transIn: 2.0, transOut: 1.6, cardHold: 2.0,   // scene-transition speed: higher in/out = faster wipe; cardHold = act-card dwell (s)
  openCardHold: 2.8,                             // the first act card (right after the story title) lingers a touch longer
  titleHold: 3.4,                                // opening story-title card dwell (s), spans the fullscreen toast
};
