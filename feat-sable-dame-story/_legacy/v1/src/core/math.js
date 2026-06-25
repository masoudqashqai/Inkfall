// =====================================================================================
//  MATH & COLOUR HELPERS — tiny pure utilities used across the engine, effects and actors.
// =====================================================================================
export const TWO_PI = Math.PI * 2;

// a fast, seedable PRNG (mulberry32): rand32(seed) returns a function giving 0..1
export const rand32 = a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const lerp = (a, b, p) => a + (b - a) * p;
export const clamp01 = p => p < 0 ? 0 : p > 1 ? 1 : p;
export const smooth01 = p => { p = clamp01(p); return p * p * (3 - 2 * p); };

// colour helpers for the light model
export const hexRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16); };
export const cssRgb = col => { if (col[0] === '#') return hexRgb(col); const m = col.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); return m ? `${m[1]},${m[2]},${m[3]}` : '255,250,225'; };
