// SHADOW + AMBIENT + SURFACE-WASH knobs — the central style for the stage-aware light and shadow
// system. Like palette.js and materials.js this is a look knob: tune the noir here and the whole
// cast restyles. SHADE drives the shadow service, AMBIENT the floor light both services read, and
// WASH the diffuse pools lights paint on the floor and the wall.
export const SHADE = {
  color: '4,5,8',        // the ink a shadow is tinted with (deep cool near-black, never pure 0)
  floorAlpha: 0.7,        // peak opacity of a floor shadow at the contact point
  wallAlpha: 0.64,       // peak opacity of a wall shadow at its base
  contactAlpha: 0.5,      // the dark grounding dab right under every caster
  floorTilt: 0.32,       // how far a floor shadow lays toward the camera (down screen) vs its length
  lengthGain: 1.0,       // global multiplier on projected shadow length
  maxLen: 3.4,           // cap on shadow length as a multiple of the caster height
  penumbra: 0.5,         // base softness; emitter size and length widen it further
  softTaps: 5,           // layered stamps used to fake a soft edge (no blur filter on mobile)
  edgeFeather: 0.05,     // per tap outward growth, so the edge fades on all sides (not a razor copy)
  maxLights: 2,          // how many of the strongest lights throw a shadow per caster
  minWeight: 0.07,       // a light weaker than this at the caster throws no shadow
};

// AMBIENT — the scene fill so a shadow core is deep grey, not a black hole, and unlit surfaces
// still read. A scene can override level/col in its data; these are the defaults.
export const AMBIENT = { level: 0.16, col: '40,46,60' };

// WASH — the diffuse light pools painted on the stage surfaces (separate from the existing tight
// surface glow and the wet specular streak). Gentle, so they read as light on brick and floor.
export const WASH = {
  floorAlpha: 0.2, floorReach: 0.55,   // floor pool brightness + how far down the floor it reaches
  wallAlpha: 0.22, wallReach: 0.7,      // wall pool brightness + how far up the wall it reaches
  ambientAlpha: 0.05,                    // a flat ambient lift on the lit buffer, tinted by AMBIENT
};

// ENV — the one place the system splits indoor from outdoor, the whole light/shadow/material model
// reads it off the stage. The physics: OUTDOOR light falls into open dark (low fill, deep long hard
// shadows, contained reach), INDOOR light bounces off walls/floor/ceiling and splashes (more fill,
// softer lighter shorter shadows, broader reach, stronger surface washes). A future window scene
// rides the indoor profile: the window is just another light (a soft beam + cool wash) on top of it.
export const ENV = {
  //         ambient  fill  reach  shadow  soft  length  wash
  outdoor: { ambient: 0.16, fill: 0.20, reach: 1.8, shadow: 1.0, soft: 1.0, length: 1.0, wash: 1.0 },
  indoor: { ambient: 0.30, fill: 0.34, reach: 2.5, shadow: 0.68, soft: 1.7, length: 0.8, wash: 1.5 },
};
