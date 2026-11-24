'use strict';
// =============================================================
//  audio.js — všechny zvuky i hudba se generují přes Web Audio
//  API (žádné soubory). Zvuk startuje až po první interakci.
// =============================================================
const Sound = (() => {
  let ac = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  const opts = { sfx: true, music: true };
  let track = null, trackName = '', step = 0, nextT = 0, timer = null, tempoMul = 1;

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
      musicBus = ac.createGain(); musicBus.gain.value = 0.2; musicBus.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
  }
  function unlock() { init(); if (ac && ac.state === 'suspended') ac.resume(); }

  function env(g, t, vol, dur, attack) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function osc(t, freq, dur, type, vol, bus, slide) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    env(g, t, vol, dur, 0.004);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function nz(t, dur, vol, freq, ftype, bus) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = ftype; f.frequency.value = freq;
    const g = ac.createGain(); env(g, t, vol, dur, 0.002);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function tone(freq, dur, o = {}) {
    if (!ac || !opts.sfx) return;
    osc(ac.currentTime + (o.at || 0), freq, dur, o.type || 'square', o.vol === undefined ? 0.12 : o.vol, sfxBus, o.slide || 0);
  }
  function noise(dur, o = {}) {
    if (!ac || !opts.sfx) return;
    nz(ac.currentTime + (o.at || 0), dur, o.vol === undefined ? 0.1 : o.vol, o.freq || 2000, o.type || 'highpass', sfxBus);
  }

  // ---------------- zvukové efekty ----------------
  let lastBlip = 0;
  const sfx = {
    blip(p = 1) { if (!ac) return; const n = ac.currentTime; if (n - lastBlip < 0.045) return; lastBlip = n; tone(380 * p + Math.random() * 30, 0.035, { vol: 0.05 }); },
    step() { noise(0.025, { vol: 0.025, freq: 700, type: 'lowpass' }); },
    select() { tone(660, 0.05, { vol: 0.1 }); tone(990, 0.07, { vol: 0.08, at: 0.045 }); },
    move() { tone(520, 0.03, { vol: 0.06 }); },
    collect() { tone(988, 0.06, { vol: 0.12 }); tone(1319, 0.12, { vol: 0.12, at: 0.06 }); },
    coin() { tone(1319, 0.05, { vol: 0.1 }); tone(1760, 0.14, { vol: 0.1, at: 0.05 }); },
    hit() { tone(320, 0.25, { type: 'sawtooth', vol: 0.16, slide: -250 }); noise(0.14, { vol: 0.14, freq: 600, type: 'lowpass' }); },
    warn() { tone(440, 0.12, { vol: 0.13 }); tone(440, 0.12, { vol: 0.13, at: 0.18 }); },
    alarm() { for (let i = 0; i < 4; i++) { tone(880, 0.1, { vol: 0.1, at: i * 0.2 }); tone(660, 0.1, { vol: 0.1, at: i * 0.2 + 0.1 }); } },
    achievement() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.13, { vol: 0.11, at: i * 0.075, type: 'triangle' })); tone(1568, 0.3, { vol: 0.08, at: 0.32 }); },
    explosion() { noise(0.9, { vol: 0.3, freq: 900, type: 'lowpass' }); tone(140, 0.6, { type: 'sawtooth', vol: 0.12, slide: -100 }); },
    powerup() { [440, 554, 659, 880, 1109].forEach((f, i) => tone(f, 0.08, { vol: 0.1, at: i * 0.05 })); },
    glitch() { for (let i = 0; i < 7; i++) tone(200 + Math.random() * 1800, 0.04, { vol: 0.06, at: i * 0.035, type: Math.random() < 0.5 ? 'square' : 'sawtooth' }); },
    teleport() { tone(300, 0.35, { vol: 0.1, slide: 900, type: 'triangle' }); },
    tick() { tone(1500, 0.03, { vol: 0.07 }); },
    error() { tone(880, 0.12, { vol: 0.1, type: 'triangle' }); tone(587, 0.22, { vol: 0.1, type: 'triangle', at: 0.12 }); },
    popup() { tone(1046, 0.08, { vol: 0.08, type: 'triangle' }); tone(784, 0.1, { vol: 0.08, type: 'triangle', at: 0.07 }); },
    bell() { tone(1318, 0.5, { vol: 0.1, type: 'triangle' }); tone(1046, 0.6, { vol: 0.1, type: 'triangle', at: 0.35 }); },
    win() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, { vol: 0.11, at: i * 0.09 })); },
    bossIntro() { tone(55, 1.8, { type: 'sawtooth', vol: 0.18, slide: 30 }); tone(82, 1.8, { type: 'square', vol: 0.06, slide: 20 }); noise(1.5, { vol: 0.08, freq: 300, type: 'lowpass' }); },
    trumpet() { [523, 523, 784, 659, 784].forEach((f, i) => tone(f, i === 4 ? 0.4 : 0.12, { vol: 0.1, at: i * 0.13, type: 'sawtooth' })); },
    victory() { [67, 72, 76, 79, 0, 76, 79, 84].forEach((n, i) => { if (n) tone(midi(n), i === 7 ? 0.7 : 0.16, { vol: 0.12, at: i * 0.14 }); }); [48, 55, 60].forEach((n, i) => tone(midi(n), 1.2, { type: 'triangle', vol: 0.12, at: 0.98 + i * 0.01 })); },
    gameover() { [67, 63, 60, 55].forEach((n, i) => tone(midi(n), 0.35, { vol: 0.12, at: i * 0.3, type: 'square' })); tone(midi(43), 1.2, { vol: 0.12, at: 1.2, type: 'triangle' }); },
    whoosh() { noise(0.3, { vol: 0.08, freq: 1200, type: 'bandpass' }); },
  };

  // ---------------- hudba (jednoduchý chiptune sekvencer) ----------------
  function bassLine(roots, pattern) { const out = []; for (const r of roots) for (const p of pattern) out.push(p === null ? 0 : r + p); return out; }
  const SCHOOL_LEAD = [72, 0, 76, 79, 76, 0, 72, 74, 76, 0, 72, 69, 72, 0, 76, 0, 77, 0, 76, 74, 72, 0, 69, 72, 74, 0, 71, 67, 71, 74, 79, 0,
    79, 0, 76, 72, 79, 81, 79, 76, 72, 0, 69, 72, 76, 0, 0, 0, 77, 76, 74, 72, 74, 0, 77, 0, 79, 0, 77, 74, 71, 0, 67, 0];
  const SCHOOL_BASS = bassLine([36, 33, 29, 31, 36, 33, 29, 31], [0, 12, 7, 12, 0, 12, 7, 12]);
  const TRACKS = {
    menu: { bpm: 104, lead: SCHOOL_LEAD, bass: SCHOOL_BASS, leadType: 'triangle', leadVol: 0.12, bassType: 'triangle', bassVol: 0.14, drums: 'k...h...k...h..h' },
    school: { bpm: 138, lead: SCHOOL_LEAD, bass: SCHOOL_BASS, leadType: 'square', leadVol: 0.06, bassType: 'triangle', bassVol: 0.16, drums: 'khshkhsh' },
    arena: { bpm: 168, lead: SCHOOL_LEAD, bass: SCHOOL_BASS, leadType: 'square', leadVol: 0.06, bassType: 'sawtooth', bassVol: 0.06, drums: 'khskkhsh' },
    boss: {
      bpm: 160, leadType: 'square', leadVol: 0.06, bassType: 'sawtooth', bassVol: 0.07, drums: 'kkshkksh',
      bass: bassLine([33, 33, 29, 29, 31, 31, 28, 28], [0, 0, 12, 0, 0, 12, 0, 12]),
      lead: [69, 72, 76, 72, 81, 76, 72, 76, 69, 72, 76, 72, 81, 76, 72, 76, 77, 72, 69, 72, 77, 81, 77, 72, 77, 0, 81, 0, 84, 81, 77, 81,
        79, 74, 71, 74, 79, 83, 79, 74, 79, 0, 74, 0, 79, 0, 83, 0, 76, 80, 83, 80, 76, 0, 75, 76, 80, 0, 83, 0, 88, 0, 0, 0],
    },
    olga: {
      bpm: 112, leadType: 'sawtooth', leadVol: 0.05, bassType: 'sawtooth', bassVol: 0.07, drums: 'k...s...k.k.s...',
      bass: bassLine([38, 38, 34, 34, 31, 31, 33, 33], [0, null, 12, null, 0, null, 12, null]),
      lead: [74, 0, 0, 77, 76, 0, 74, 0, 73, 0, 0, 0, 69, 0, 0, 0, 70, 0, 0, 74, 72, 0, 70, 0, 69, 0, 0, 0, 0, 0, 0, 0,
        74, 0, 77, 0, 81, 0, 79, 77, 76, 0, 74, 73, 74, 0, 0, 0, 79, 0, 77, 76, 74, 0, 72, 70, 69, 0, 73, 0, 76, 0, 81, 0],
    },
  };
  function playStep(i, t, sd) {
    const L = track.lead[i % track.lead.length], B = track.bass[i % track.bass.length];
    if (L) osc(t, midi(L), sd * (track.lead[(i + 1) % track.lead.length] ? 0.85 : 1.7), track.leadType, track.leadVol, musicBus, 0);
    if (B) osc(t, midi(B), sd * 0.9, track.bassType, track.bassVol, musicBus, 0);
    const d = track.drums[i % track.drums.length];
    if (d === 'k') osc(t, 150, 0.12, 'sine', 0.35, musicBus, -110);
    else if (d === 's') nz(t, 0.1, 0.14, 1800, 'highpass', musicBus);
    else if (d === 'h') nz(t, 0.025, 0.05, 7000, 'highpass', musicBus);
  }
  function schedule() {
    if (!ac || !track) return;
    const sd = 60 / (track.bpm * tempoMul) / 2;
    if (nextT < ac.currentTime - 0.3) nextT = ac.currentTime + 0.05; // po uspání tabu
    while (nextT < ac.currentTime + 0.15) {
      if (opts.music) playStep(step, nextT, sd);
      nextT += sd; step = (step + 1) % 64;
    }
  }
  function playMusic(name) {
    init();
    if (!ac || trackName === name) return;
    trackName = name; track = TRACKS[name] || null; step = 0; nextT = ac.currentTime + 0.08;
    if (!timer) timer = setInterval(schedule, 25);
  }
  function stopMusic() { trackName = ''; track = null; }

  // ztišení hudby, když mluví MATURITRON
  function duck(on) {
    if (!ac || !musicBus) return;
    const t = ac.currentTime;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setTargetAtTime(on ? 0.07 : 0.2, t, 0.15);
  }

  return {
    unlock, sfx, playMusic, stopMusic, duck,
    setTempo(m) { tempoMul = m; },
    setSfx(v) { opts.sfx = v; },
    setMusic(v) { opts.music = v; },
    get opts() { return opts; },
    get current() { return trackName; },
  };
})();

// =============================================================
//  Voice — namluvené repliky MATURITRONA (soubory ve složce /voice).
//  Přehrává se přes <audio>, takže to funguje i při otevření
//  index.html dvojklikem (file://).
// =============================================================
const Voice = (() => {
  let cur = null, enabled = true;
  const map = () => window.INFIS_VOICES || {};
  function stop() {
    if (cur) { try { cur.pause(); } catch (e) { /* nic */ } cur = null; }
    Sound.duck(false);
  }
  function play(text) {
    const v = map()[text];
    if (!enabled || !v) return 0;
    stop();
    try {
      cur = new Audio('voice/' + v[0] + '.mp3');
      cur.volume = 1;
      const me = cur;
      cur.addEventListener('ended', () => { if (cur === me) { cur = null; Sound.duck(false); } });
      const p = cur.play();
      if (p && p.catch) p.catch(() => { if (cur === me) { cur = null; Sound.duck(false); } });
      Sound.duck(true);
    } catch (e) { cur = null; return 0; }
    return v[1];
  }
  return {
    play, stop,
    has: (t) => !!map()[t],
    duration: (t) => (map()[t] || [0, 0])[1],
    get speaking() { return !!cur; },
    set enabled(v) { enabled = v; if (!v) stop(); },
    get enabled() { return enabled; },
  };
})();
