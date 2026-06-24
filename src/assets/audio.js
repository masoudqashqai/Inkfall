// AUDIO — data-driven and scoped to the story. The engine plays nothing on its own; a story
// declares `audio: { music, rain, sfx{} }` and each scene may declare `ambience`. A story
// with no audio block is silent, so sounds never bleed between stories.
export const Audio2 = (() => {
  const A = 'assets/audio/';
  let on = true, started = false, cfg = null;
  let music = null, rain = null, amb = null;
  const pools = {}, loops = {};
  function mkLoop(src, v) { const a = new Audio(A + src); a.loop = true; a._v = v; a.volume = on ? v : 0; a.preload = 'auto'; return a; }
  function stop(a) { if (a) try { a.pause(); } catch (e) {} }
  function resume(a) { if (a && on && started) a.play().catch(() => {}); }
  function setStory(c) {
    [music, rain, amb].forEach(stop); music = rain = amb = null;
    for (const k in pools) delete pools[k]; for (const k in loops) { stop(loops[k]); delete loops[k]; }
    cfg = c || null; started = false;
    if (!cfg) return;
    if (cfg.music) music = mkLoop(cfg.music, cfg.musicVol == null ? 0.5 : cfg.musicVol);
    if (cfg.rain) rain = mkLoop(cfg.rain, 0);
    for (const k in (cfg.sfx || {})) { const d = cfg.sfx[k], n = d.n || 2, pool = []; for (let i = 0; i < n; i++) { const a = new Audio(A + d.src); a.preload = 'auto'; pool.push(a); } pools[k] = { pool, i: 0, vol: d.vol == null ? 0.7 : d.vol }; }
  }
  function start() { started = true; resume(music); resume(rain); resume(amb); }
  function stopLoops() { for (const k in loops) stop(loops[k]); }
  function scene(sc) {
    stop(amb); amb = null; stopLoops();
    if (cfg && sc.ambience) { amb = mkLoop(sc.ambience, sc.ambienceVol == null ? 0.4 : sc.ambienceVol); resume(amb); }
    if (rain) { const want = cfg.rain && !sc.indoor; rain._v = want ? (sc.rainVol == null ? (cfg.rainVol == null ? 0.16 : cfg.rainVol) : sc.rainVol) : 0; rain.volume = on ? rain._v : 0; if (want) resume(rain); else stop(rain); }
  }
  function play(name, volScale = 1, rate = 1) {
    if (!on || !started || !pools[name]) return;
    const s = pools[name], a = s.pool[s.i++ % s.pool.length];
    try { a.pause(); a.currentTime = 0; a.volume = Math.min(1, s.vol * volScale); a.playbackRate = rate; a.play().catch(() => {}); } catch (e) {}
  }
  function setLoop(name, on2) {
    if (!on || !started || !cfg || !cfg.sfx || !cfg.sfx[name]) return;
    let a = loops[name];
    if (on2) { if (!a) { const d = cfg.sfx[name]; a = loops[name] = new Audio(A + d.src); a.loop = true; a.volume = d.vol == null ? 0.7 : d.vol; } if (a.paused) a.play().catch(() => {}); }
    else if (a && !a.paused) a.pause();
  }
  function toggle() {
    on = !on;
    [music, rain, amb].forEach(a => { if (a) { a.volume = on ? a._v : 0; if (on) resume(a); else stop(a); } });
    if (!on) stopLoops();
    return on;
  }
  return {
    setStory, start, scene, play, setLoop, stopLoops, toggle, isOn: () => on,
    gun: () => play('gunshot', 1, 0.97 + Math.random() * 0.06),
    shellClink: () => play('shell', 0.8 + Math.random() * 0.3, 0.95 + Math.random() * 0.1),
    lightningCrack: () => play('crack'),
    thunder: () => play('thunder'),
    neonZap: () => play('neon'),
    whoosh: () => play('whoosh'),
    lidOpen: () => play('lidopen'),
    flint: () => play('flint'),
  };
})();
