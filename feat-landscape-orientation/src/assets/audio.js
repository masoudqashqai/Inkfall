// AUDIO — data-driven and scoped to the story. The engine plays nothing on its own; a story
// declares `audio: { music, musicStart?, rain, sfx{} }` and each scene may declare `ambience`.
//
// Fade policy (so sound never hard-cuts or leaks across a beat/act):
//   - loops (e.g. footsteps) are tied to their animation: held full while active, faded out when
//     it stops or on an act change.
//   - one-shots still ringing are ducked (faded) on a beat OR act change via duck().
//   - ambience + rain crossfade between acts in scene().
// A story with no audio block is silent, so sounds never bleed between stories.
export const Audio2 = (() => {
  const A = 'assets/audio/';
  let on = true, started = false, cfg = null, suspended = false;
  let music = null, rain = null, amb = null;
  const pools = {}, loops = {};

  function mkLoop(src, v) { const a = new Audio(A + src); a.loop = true; a._v = v; a.volume = on ? v : 0; a.preload = 'auto'; return a; }
  function stop(a) { if (!a) return; if (a._ramp) { clearInterval(a._ramp); a._ramp = null; } try { a.pause(); } catch (e) {} }

  // smoothly ramp an element's volume; pause it once it reaches silence (so nothing keeps playing)
  function ramp(a, to, dur) {
    if (!a) return;
    if (a._ramp) { clearInterval(a._ramp); a._ramp = null; }
    to = Math.max(0, Math.min(1, to));
    if (!(dur > 0)) { a.volume = to; if (to === 0) stop(a); return; }
    const from = a.volume, steps = Math.max(1, Math.round(dur / 0.03)); let i = 0;
    a._ramp = setInterval(() => {
      i++; a.volume = Math.max(0, Math.min(1, from + (to - from) * i / steps));
      if (i >= steps) { clearInterval(a._ramp); a._ramp = null; if (to === 0) stop(a); }
    }, 30);
  }

  function resume(a) { if (!a || !on || !started) return; if (a._start && a.currentTime < a._start) { try { a.currentTime = a._start; } catch (e) {} } a.play().catch(() => {}); }

  function setStory(c) {
    [music, rain, amb].forEach(stop); music = rain = amb = null;
    for (const k in pools) delete pools[k]; for (const k in loops) { stop(loops[k]); delete loops[k]; }
    cfg = c || null; started = false;
    if (!cfg) return;
    if (cfg.music) {
      music = mkLoop(cfg.music, cfg.musicVol == null ? 0.5 : cfg.musicVol);
      const st = cfg.musicStart || 0;
      if (st > 0) {   // start + loop from this offset (seconds) instead of 0
        music.loop = false; music._start = st;
        music.addEventListener('loadedmetadata', () => { try { music.currentTime = st; } catch (e) {} });
        music.addEventListener('ended', () => { try { music.currentTime = st; } catch (e) {} resume(music); });
      }
    }
    if (cfg.rain) rain = mkLoop(cfg.rain, 0);
    for (const k in (cfg.sfx || {})) { const d = cfg.sfx[k], n = d.n || 2, pool = []; for (let i = 0; i < n; i++) { const a = new Audio(A + d.src); a.preload = 'auto'; pool.push(a); } pools[k] = { pool, i: 0, vol: d.vol == null ? 0.7 : d.vol }; }
  }
  function start() { started = true; resume(music); resume(rain); resume(amb); }

  function stopLoops(dur = 0.45) { for (const k in loops) ramp(loops[k], 0, dur); }   // fade every loop out
  function duck(dur = 0.6) { for (const k in pools) for (const a of pools[k].pool) if (!a.paused) ramp(a, 0, dur); }   // fade ringing one-shots

  function scene(sc) {
    duck(0.5);                                       // any lingering one-shot from the last act fades out
    stopLoops();                                     // walk/animation loops fade out
    if (amb) { ramp(amb, 0, 0.5); amb = null; }      // crossfade ambience out
    if (cfg && sc.ambience) { amb = mkLoop(sc.ambience, sc.ambienceVol == null ? 0.4 : sc.ambienceVol); amb.volume = 0; resume(amb); ramp(amb, on ? amb._v : 0, 0.6); }
    if (rain) { const want = cfg.rain && !sc.indoor; rain._v = want ? (sc.rainVol == null ? (cfg.rainVol == null ? 0.16 : cfg.rainVol) : sc.rainVol) : 0; if (want) { resume(rain); ramp(rain, on ? rain._v : 0, 0.6); } else ramp(rain, 0, 0.6); }
  }

  function play(name, volScale = 1, rate = 1) {
    if (!on || !started || !pools[name]) return;
    const s = pools[name], a = s.pool[s.i++ % s.pool.length];
    if (a._ramp) { clearInterval(a._ramp); a._ramp = null; }   // cancel a duck on this element before reusing it
    try { a.pause(); a.currentTime = 0; a.volume = Math.min(1, s.vol * volScale); a.playbackRate = rate; a.play().catch(() => {}); } catch (e) {}
  }
  function setLoop(name, on2) {
    if (!on || !started || !cfg || !cfg.sfx || !cfg.sfx[name]) return;
    let a = loops[name]; const d = cfg.sfx[name], tgt = d.vol == null ? 0.7 : d.vol;
    if (on2) {   // animation active: hold at full (this also cancels a fade-out in progress, e.g. a duck)
      if (!a) { a = loops[name] = new Audio(A + d.src); a.loop = true; a.volume = 0; }
      if (a._ramp) { clearInterval(a._ramp); a._ramp = null; }
      a.volume = tgt; if (a.paused) a.play().catch(() => {});
    } else if (a && !a.paused) ramp(a, 0, 0.4);   // animation ended: fade out + pause
  }
  // full pause for the orientation gate: hold every sound where it is. The persistent loops
  // (music, rain, ambience, active animation loops) remember they were playing so resumeAll can
  // bring them back. One-shots are just silenced, they are transient and re-fire on their own.
  function suspend() {
    if (suspended) return; suspended = true;
    const keep = [music, rain, amb]; for (const k in loops) keep.push(loops[k]);
    for (const a of keep) { if (a && !a.paused) { a._wasPlaying = true; try { a.pause(); } catch (e) {} } }
    for (const k in pools) for (const a of pools[k].pool) { try { a.pause(); } catch (e) {} }
  }
  function resumeAll() {
    if (!suspended) return; suspended = false;
    if (!on || !started) return;
    const keep = [music, rain, amb]; for (const k in loops) keep.push(loops[k]);
    for (const a of keep) { if (a && a._wasPlaying) { a._wasPlaying = false; a.play().catch(() => {}); } }
  }
  function toggle() {
    on = !on;
    [music, rain, amb].forEach(a => { if (a) { a.volume = on ? a._v : 0; if (on) resume(a); else stop(a); } });
    if (!on) for (const k in loops) stop(loops[k]);
    return on;
  }
  return {
    setStory, start, scene, play, setLoop, stopLoops, duck, toggle, suspend, resumeAll, isOn: () => on,
    gun: () => play('gunshot', 1, 0.97 + Math.random() * 0.06),
    gunCock: () => play('hammer'),
    shellClink: () => play('shell', 0.8 + Math.random() * 0.3, 0.95 + Math.random() * 0.1),
    thunder: () => play('thunder'),
    neonZap: () => play('neon'),
    whoosh: () => play('whoosh'),
    lidOpen: () => play('lidopen'),
    flint: () => play('flint'),
  };
})();
