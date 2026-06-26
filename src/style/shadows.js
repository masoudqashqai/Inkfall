// SHADOW + AMBIENT + SURFACE-WASH knobs — the central style for the stage-aware light and shadow
// system. Like palette.js and materials.js this is a look knob: tune the noir here and the whole
// cast restyles. SHADE drives the shadow service, AMBIENT the ambient light hue both services read,
// and WASH the diffuse pools lights paint on the floor and the wall.
export const SHADE = {
  color: '4,5,9',        // the ink a shadow is tinted with (deep cool near-black, never pure 0)
  floorAlpha: 0.82,      // peak opacity of a floor shadow at the contact point (noir: deep, committed)
  wallAlpha: 0.7,        // peak opacity of a wall shadow at its base
  contactAlpha: 0.6,     // the wide soft grounding dab right under every caster
  aoCore: 0.5,           // a tighter darker contact core where the form meets the surface (ambient light blocked, present with no key)
  floorTilt: 0.3,        // how far a floor shadow lays toward the camera (down screen) vs its length
  lengthGain: 1.25,      // global multiplier on projected shadow length (noir: long, thrown shadows)
  maxLen: 4.0,           // cap on shadow length as a multiple of the caster height
  creaseAlpha: 0.35,     // darkening of the floor-to-wall junction (ambient occlusion in the crease)
  penumbra: 0.45,        // base softness, emitter size and length widen it further (noir: fairly hard)
  softTaps: 5,           // layered stamps used to fake a soft edge (no blur filter on mobile)
  wallTaps: 3,           // fewer taps on the less prominent wall stamp (the floor keeps softTaps)
  edgeFeather: 0.045,    // per tap outward growth, so the edge fades on all sides (not a razor copy)
  maxLights: 2,          // how many of the strongest lights throw a shadow per caster
  minWeight: 0.07,       // a light weaker than this at the caster throws no shadow
};

// AMBIENT — the shared HUE of the ambient light (cool blue night), so a shadow core is a deep cool
// grey, not a black hole. The ambient LEVEL is per environment (ENV.indoor/outdoor.ambient), since
// indoor light bounces and fills more. A scene can override the hue in its data (data.ambient.col).
export const AMBIENT = { col: '40,48,70' };

// WASH — the diffuse light pools painted on the stage surfaces (separate from the existing tight
// surface glow and the wet specular streak). Gentle, so they read as light on brick and floor.
export const WASH = {
  floorAlpha: 0.18, floorReach: 0.55,   // floor pool brightness + how far down the floor it reaches
  wallAlpha: 0.2, wallReach: 0.7,       // wall pool brightness + how far up the wall it reaches
  ambientAlpha: 0.045,                   // a flat ambient lift on the lit buffer, tinted by AMBIENT
};

// AIR — the volumetric atmosphere knobs. motes: how many dust specks drift in each light beam.
// moteAlpha: their brightness. groundHaze: a low band of mist hanging along the floor, catching the
// ambient (so the air itself reads, not just empty black). hazeCol: that mist's cool hue.
export const AIR = { motes: 7, moteAlpha: 0.5, groundHaze: 0.03, hazeCol: '64,76,100' };

// ENV — the one place the system splits indoor from outdoor, the whole light/shadow/material model
// reads it off the stage. The physics: OUTDOOR light falls into open dark (low fill, deep long hard
// shadows, contained reach), INDOOR light bounces off walls/floor/ceiling and splashes (more fill,
// softer lighter shorter shadows, broader reach, stronger surface washes). A future window scene
// rides the indoor profile: the window is just another light (a soft beam + cool wash) on top of it.
export const ENV = {
  //         ambient  fill  reach  shadow  soft  length  wash
  outdoor: { ambient: 0.32, fill: 0.44, reach: 2.0, shadow: 0.95, soft: 0.9, length: 1.2, wash: 1.35 },
  indoor: { ambient: 0.44, fill: 0.58, reach: 2.9, shadow: 0.66, soft: 1.6, length: 0.85, wash: 2.2 },
};
