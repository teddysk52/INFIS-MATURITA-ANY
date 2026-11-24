'use strict';
// =============================================================
//  main.js — hlavní smyčka, hráč, kamera, ročníky, menu.
// =============================================================
const Game = (() => {
  const CFG = window.INFIS_CONFIG;
  const canvas = document.getElementById('gl');
  const keys = {}, pressed = {};
  let lastT = 0, gt = 0;

  // ---------------- stav hry ----------------
  const G = {
    state: 'loading', year: 1, time: CFG.START_TIME, timerOn: false, playing: false,
    player: { x: 0.8, z: 24, y: 0, vy: 0, yaw: Math.PI, speed: 0, vx: 0, vz: 0, pushX: 0, pushZ: 0, char: null, inv: 0, grounded: true },
    npcs: [], objectives: [], flags: {}, stats: { hits: 0, vending: 0, pauses: 0, bumps: 0, jumps: 0, horns: 0, still: 0 },
    actionLog: [], special: null, inCar: false, cutscene: false, qte: false, glitchMission: null, extraInteract: [], wobble: 0,
  };
  let uidN = 1;

  // ---------------- prostředí (světlo/obloha) ----------------
  const V = (r, g, b) => [r, g, b];
  const ENVS = {
    1: { sunDir: norm([0.55, 0.55, 0.45]), sunCol: V(1.05, 0.92, 0.75), skyAmb: V(0.42, 0.5, 0.62), gndAmb: V(0.28, 0.26, 0.2), fogCol: V(0.74, 0.84, 0.94), fogDen: 0.0065, zenith: V(0.3, 0.55, 0.92), horizon: V(0.78, 0.88, 0.97), inAmb: V(0.42, 0.42, 0.42), inTop: V(0.55, 0.55, 0.52), night: 0, grade: V(1.02, 1.0, 0.97), sat: 1.12, weather: null },
    2: { sunDir: norm([0.25, 0.8, 0.45]), sunCol: V(0.95, 0.95, 0.95), skyAmb: V(0.55, 0.6, 0.7), gndAmb: V(0.45, 0.47, 0.52), fogCol: V(0.82, 0.86, 0.92), fogDen: 0.0105, zenith: V(0.55, 0.65, 0.8), horizon: V(0.85, 0.88, 0.93), inAmb: V(0.44, 0.45, 0.48), inTop: V(0.55, 0.56, 0.58), night: 0, grade: V(0.98, 1.0, 1.05), sat: 0.95, weather: 'snow' },
    3: { sunDir: norm([-0.75, 0.25, 0.35]), sunCol: V(1.35, 0.72, 0.38), skyAmb: V(0.42, 0.34, 0.45), gndAmb: V(0.3, 0.2, 0.15), fogCol: V(0.92, 0.62, 0.48), fogDen: 0.0075, zenith: V(0.32, 0.32, 0.62), horizon: V(1.0, 0.62, 0.42), inAmb: V(0.45, 0.4, 0.36), inTop: V(0.58, 0.5, 0.42), night: 0.15, grade: V(1.06, 0.98, 0.9), sat: 1.15, weather: 'leaves' },
    4: { sunDir: norm([0.3, 0.6, -0.4]), sunCol: V(0.22, 0.27, 0.42), skyAmb: V(0.12, 0.14, 0.24), gndAmb: V(0.05, 0.05, 0.08), fogCol: V(0.05, 0.07, 0.13), fogDen: 0.011, zenith: V(0.01, 0.02, 0.07), horizon: V(0.07, 0.09, 0.18), inAmb: V(0.36, 0.36, 0.4), inTop: V(0.5, 0.5, 0.52), night: 1, grade: V(0.95, 0.97, 1.1), sat: 1.05, weather: null },
    book: { sunDir: norm([0.4, 0.7, 0.3]), sunCol: V(1.0, 0.9, 0.7), skyAmb: V(0.55, 0.48, 0.38), gndAmb: V(0.4, 0.35, 0.28), fogCol: V(0.85, 0.76, 0.6), fogDen: 0.012, zenith: V(0.7, 0.6, 0.45), horizon: V(0.95, 0.88, 0.72), inAmb: V(0.4, 0.4, 0.4), inTop: V(0.5, 0.5, 0.5), night: 0, grade: V(1.06, 1.0, 0.88), sat: 0.8, weather: null },
    excel: { sunDir: norm([0.3, 0.8, 0.4]), sunCol: V(0.9, 0.95, 0.9), skyAmb: V(0.6, 0.68, 0.62), gndAmb: V(0.5, 0.55, 0.5), fogCol: V(0.86, 0.95, 0.89), fogDen: 0.01, zenith: V(0.13, 0.64, 0.4), horizon: V(0.85, 0.96, 0.9), inAmb: V(0.4, 0.4, 0.4), inTop: V(0.5, 0.5, 0.5), night: 0, grade: V(1, 1.02, 1), sat: 1.1, weather: null },
    boss: { sunDir: norm([0.2, 0.9, 0.3]), sunCol: V(0.35, 0.3, 0.4), skyAmb: V(0.12, 0.14, 0.2), gndAmb: V(0.05, 0.05, 0.08), fogCol: V(0.02, 0.03, 0.05), fogDen: 0.012, zenith: V(0.0, 0.02, 0.04), horizon: V(0.04, 0.1, 0.08), inAmb: V(0.3, 0.3, 0.3), inTop: V(0.4, 0.4, 0.4), night: 0, grade: V(1.05, 0.98, 1.02), sat: 1.15, weather: null, cyber: 1 },
  };
  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  const env = { time: 0, lights: [], focus: [0, 0, 0], bld: [World.BX0 + 0.02, World.BZ0 + 0.02, World.BX1 - 0.02, World.BZ1 - 0.02], ceil: World.CEIL, winLayer: -1, shadows: true, shadowRadius: 40 };
  const post = { glitch: 0, red: 0, flash: 0, flashCol: [1, 1, 1], vig: 1.1, sat: 1.1, grade: [1, 1, 1], gray: 0 };
  let glitchT = 0, flashA = 0, shakeA = 0, shakeT = 0, flickerT = 0, castleT = 0;

  // ---------------- kamera ----------------
  const cam = { pos: [0, 5, 10], vp: M4.create(), view: M4.create(), proj: M4.create(), right: [1, 0, 0], up: [0, 1, 0], yaw: 0, pitch: 0.32, dist: 4.4, curDist: 4.4, fp: false, mouseT: 99, look: [0, 1, 0], snap: true };
  const camPos = [0, 5, 10], camLook = [0, 1, 0];

  // =============================================================
  //  INIT
  // =============================================================
  async function init() {
    const ld = (p, t) => { document.getElementById('ld-bar').style.width = (p * 100) + '%'; if (t) document.getElementById('ld-text').textContent = t; };
    try {
      if (!GFX.init(canvas)) { document.getElementById('ld-text').textContent = 'Tvůj prohlížeč nepodporuje WebGL2. Zkus Chrome, Edge nebo Firefox.'; return; }
      ld(0.05);
      try { await Promise.race([document.fonts.load('500 20px "Pixelify Sans"'), new Promise(r => setTimeout(r, 2500))]); await document.fonts.load('500 20px "Pixelify Sans"'); } catch (e) { /* nic */ }
      await frame(); ld(0.15);
      Tex.buildWorld(); Spr.init(); Spr.buildBase();
      await frame(); ld(0.35);
      Chars.init();
      Tex.upload(); Spr.upload();
      env.winLayer = Tex.L('win_out');
      await frame(); ld(0.5);
      World.build();
      await frame(); ld(0.7);
      Chars.buildMeshes(); Vehicles.build(); Arena.buildStatic();
      await Icons.load(); Icons.applyToSprites();
      await frame(); ld(0.85);
      UI.init(); UI.buildMinimap(); Dialogue.init();
      Settings.bind(); Settings.apply();
      bindInput(); bindMenus();
      G.player.char = new Chars.Char('player', G.player.x, G.player.z, { yaw: Math.PI });
      setupYearVisuals(1);
      applyYearNpcs(1);
      ld(1);
      resize(); window.addEventListener('resize', resize);
      Director.checkAI().then(ok => { const el = document.getElementById('ai-status'); if (ok) { el.textContent = 'MATURITRON: SKUTEČNÁ AI PŘIPOJENA'; el.classList.add('on'); } });
      setTimeout(() => document.getElementById('loading').classList.add('done'), 200);
      G.state = 'menu'; UI.show('menu');
      requestAnimationFrame(loop);
      if (CFG.DEBUG) {
        window.G = G;
        // testovací krokování (jen ?debug=1)
        window.__step = (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) { gt += dt; env.time = gt; update(dt); for (const k in pressed) pressed[k] = false; } if (!window.__noRender) render(dt); };
        window.__key = (code, on = true) => { if (on && !keys[code]) pressed[code] = true; keys[code] = on; };
        window.__tap = (code) => { pressed[code] = true; keys[code] = true; window.__step(1); keys[code] = false; };
        const bs = document.createElement('script'); bs.src = 'tools/bot.js'; document.body.appendChild(bs);
      }
    } catch (err) {
      console.error(err);
      document.getElementById('ld-text').textContent = 'Chyba při načítání: ' + err.message;
    }
  }
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr); canvas.height = Math.floor(window.innerHeight * dpr);
  }

  // =============================================================
  //  VSTUP
  // =============================================================
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  let konami = [];
  function bindInput() {
    window.addEventListener('keydown', (e) => {
      Sound.unlock();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!keys[e.code]) pressed[e.code] = true;
      keys[e.code] = true;
      konami.push(e.code); if (konami.length > 10) konami.shift();
      if (G.state === 'play' && konami.join() === KONAMI.join() && !Achievements.has('konami')) { Achievements.unlock('konami'); Director.sayNow('CHEAT DETEKOVÁN. Nahlásil jsem tě řediteli. …A dal ti 10 sekund. Nevím proč.'); addTime(10, true); }
      if (G.state === 'play' && (e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.code === 'KeyV')) { if (Achievements.unlock('ctrlcv')) Director.say('Ctrl+C, Ctrl+V? Tady se nekopíruje. Tady se trpí.'); }
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    canvas.addEventListener('mousedown', (e) => {
      Sound.unlock();
      if (G.state === 'play' && !document.pointerLockElement) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (er) { /* nic */ } }
      dragging = true; lastMX = e.clientX; lastMY = e.clientY;
    });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('mousemove', (e) => {
      let dx = 0, dy = 0;
      if (document.pointerLockElement === canvas) { dx = e.movementX; dy = e.movementY; }
      else if (dragging) { dx = e.clientX - lastMX; dy = e.clientY - lastMY; lastMX = e.clientX; lastMY = e.clientY; }
      if (!dx && !dy) return;
      if (G.state !== 'play') return;
      const s = 0.0026 * Settings.s.sens;
      cam.yaw -= dx * s;
      cam.pitch = U.clamp(cam.pitch + dy * s * (Settings.s.invertY ? -1 : 1) * (cam.fp ? -1 : 1), cam.fp ? -1.2 : -0.25, cam.fp ? 1.2 : 1.25);
      cam.mouseT = 0;
    });
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && G.state === 'play' && !suppressPause) pause();
      suppressPause = false;
    });
  }
  let pausedAt = 0;
  let dragging = false, lastMX = 0, lastMY = 0, suppressPause = false;
  function unlockPointer() { if (document.pointerLockElement) { suppressPause = true; document.exitPointerLock(); } }
  const down = (...c) => c.some(k => keys[k]);
  const hit = (...c) => c.some(k => pressed[k]);

  function bindMenus() {
    document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { Sound.unlock(); Sound.sfx.select(); act(b.dataset.act); }));
  }
  function act(a) {
    switch (a) {
      case 'start': newGame(); break;
      case 'howto': UI.show('howto'); break;
      case 'settings': UI.show('settings'); break;
      case 'achievements': UI.show('achievements'); break;
      case 'back': UI.back(); break;
      case 'resume': resume(); break;
      case 'restart': newGame(); break;
      case 'mainmenu': toMenu(); break;
      case 'uni': document.getElementById('vs-error').classList.remove('hidden'); Sound.sfx.error(); Achievements.unlock('vysoka'); break;
      case 'credits': showCredits(); break;
    }
  }

  // =============================================================
  //  PRŮBĚH HRY
  // =============================================================
  function newGame() {
    UI.hideScreens(); UI.clearWorld(); UI.clearPopups(); Dialogue.abort(); Arena.abort(); MiniGames.QTE.abort();
    Ents.clear(); Ents.clearParts(); Director.reset(); Achievements.reset(); Vehicles.reset();
    Object.assign(G, { year: 1, time: CFG.START_TIME, timerOn: false, flags: {}, stats: { hits: 0, vending: 0, pauses: 0, bumps: 0, jumps: 0, horns: 0, still: 0 }, actionLog: [], special: null, inCar: false, cutscene: true, qte: false, glitchMission: null, extraInteract: [], wobble: 0 });
    for (const n of ['wall_in', 'wall_low', 'floor_class', 'floor_lino', 'floor_wood', 'plaster_blue', 'vending']) Tex.swap(n);
    Object.assign(G.player, { x: 0.8, z: 24.2, y: 0, vy: 0, yaw: Math.PI, speed: 0, vx: 0, vz: 0, pushX: 0, pushZ: 0, inv: 0 });
    warned = {}; stillT = 0; lastRoom = null; bumpCd = 0;
    G.state = 'play'; G.playing = true;
    document.getElementById('hud').classList.remove('hidden');
    setYear(1);
    cam.yaw = 0; cam.pitch = 0.3; cam.fp = false; cam.snap = true;
    // úvodní průlet kamerou
    introT = -2.4; introDur = 3.2;
    UI.yearCard(Story.YEARS[1].title, Story.YEARS[1].sub, Story.YEARS[1].note, 2.4);
    Sound.playMusic('menu');
    const gen = ++gameGen;
    const startIntro = () => {
      if (gen !== gameGen) return;
      if (G.state === 'paused') { setTimeout(startIntro, 400); return; }
      if (G.state !== 'play') return;
      Dialogue.start(Story.INTRO, () => { G.cutscene = false; G.timerOn = true; Sound.playMusic('school'); Director.say('Čas běží. Tik ťak. Úkoly máš vpravo nahoře.'); });
    };
    setTimeout(startIntro, 5300);
    G.logAction('Začal hru');
  }
  let introT = 99, introDur = 1, gameGen = 0;

  function setYear(y) {
    G.year = y;
    const Y = Story.YEARS[y];
    UI.setYear(Y.title);
    setupYearVisuals(y);
    applyYearNpcs(y);
    const s = Story.setupYear(y);
    G.objectives = s.objectives.map(o => Object.assign({ done: false }, o));
    G.flags.examOpen = false;
    World.buildYear(y);
  }
  function setupYearVisuals(y) {
    const seasons = { 1: {}, 2: { grass: 'grass_snow', leaves: 'leaves_snow', pine: 'pine_snow', roof: 'roof_snow' }, 3: { grass: 'grass_autumn', leaves: 'leaves_autumn' }, 4: { grass: 'grass_night' } };
    for (const n of ['grass', 'leaves', 'pine', 'roof']) Tex.swap(n, seasons[y][n]);
    World.buildYear(y);
  }
  function applyYearNpcs(y) {
    const s = Story.setupYear(y);
    setNpcs(s.npcs);
  }
  function setNpcs(list) {
    G.npcs = list.map(d => makeNpc(d));
  }
  function makeNpc(d) {
    const c = new Chars.Char(d.id, d.x, d.z, { yaw: d.yaw || 0 });
    c.uid = uidN++; c.beh = d.beh || 'idle'; c.area = d.area; c.baseYaw = d.yaw || 0; c.homeX = d.x; c.homeZ = d.z; c.wt = U.rand(0, 2); c.tx = d.x; c.tz = d.z; c.cd = 0;
    return c;
  }
  function spawnNpc(d) { const c = makeNpc(d); G.npcs.push(c); return c; }
  function addTemp(id, x, z) { const c = makeNpc({ id, x, z, beh: 'temp' }); c.temp = true; G.npcs.push(c); return c; }
  function removeTemp(c) { G.npcs = G.npcs.filter(n => n !== c); }
  function findNpc(id) { return G.npcs.find(n => n.id === id && !n.temp) || G.npcs.find(n => n.id === id); }

  function completeObjective(id) {
    const o = G.objectives.find(q => q.id === id);
    if (!o || o.done) return;
    o.done = true; o.flash = true; setTimeout(() => { o.flash = false; }, 900);
    Sound.sfx.win();
    G.logAction('Splnil: ' + o.text);
    if (G.year === 4 && ['sign_hojer', 'sign_batkova', 'sign_ladman'].every(k => G.objectives.find(q => q.id === k && q.done))) {
      if (!G.flags.examOpen) {
        G.flags.examOpen = true;
        World.buildYear(4, true);
        const R = World.ROOMS.exam;
        G.objectives.push({ id: 'maturita', text: 'Maturita', target: () => ({ x: R.dx, z: R.dz }), done: false });
        Director.sayNow('Dveře maturitního sálu jsou otevřené. To je past. …Nebo ne. Nemám to v datasetu.');
        UI.big('VŠECHNY PODPISY!', 2, '#3cff7a', 'Maturitní sál je otevřený');
      }
      return;
    }
    const req = G.objectives.filter(q => !q.optional);
    if (G.year < 4 && req.every(q => q.done)) {
      setTimeout(yearEnd, 900);
      UI.big('ROČNÍK DOKONČEN', 1.6, '#ffcf3f');
    } else if (!o.optional) Director.say(U.pickFresh('mission', Director.LINES.mission));
  }
  function yearEnd() {
    if (G.state === 'paused') { setTimeout(yearEnd, 400); return; }
    if (G.state !== 'play') return;
    const y = G.year + 1;
    G.cutscene = true;
    Director.clearEvents();
    if (G.inCar) exitCar(true);
    UI.fade(true);
    const step2 = () => {
      if (G.state === 'paused') { setTimeout(step2, 400); return; }
      if (G.state !== 'play') { UI.fade(false); return; }
      UI.fade(false);
      // hráč na chodbě u haly
      teleport(0.5, 1.0, Math.PI);
      if (G.glitchMission) { Ents.clear('glitch'); G.glitchMission = null; G.extraInteract = []; G.wobble = 0; Tex.swap('vending'); }
      setYear(y);
      cam.yaw = 0; cam.snap = true;
      UI.yearCard(Story.YEARS[y].title, Story.YEARS[y].sub, Story.YEARS[y].note, 2.8, () => {
        G.cutscene = false;
        if (G.state !== 'play' && G.state !== 'paused') return;
        Director.sayNow(Story.YEAR_LINES[y]);
        Sound.playMusic(musicFor());
      });
    };
    setTimeout(step2, 450);
  }
  function addTime(s, show) {
    G.time += s;
    if (show) { const P = G.player; UI.floatText(P.x, 2.4, P.z, `+${s} s`, '#3cff7a', 1.6); timerBonusT = 1.4; Ents.burst(P.x, 1.5, P.z, '#ffd23f', 20); }
  }
  let timerBonusT = 0;
  function hurt(sec, src, force) {
    const P = G.player;
    if (P.inv > 0 && !force) return false;
    if (G.state !== 'play') return false;
    G.time = Math.max(0, G.time - sec);
    P.inv = 1.1; G.stats.hits++;
    UI.hit(); shake(0.35, 0.3); Sound.sfx.hit();
    UI.floatText(P.x, 2.3, P.z, `−${sec} s`, '#ff4d5e');
    if (src) { const dx = P.x - src.x, dz = P.z - src.z, d = Math.hypot(dx, dz) || 1; push(dx / d * 5, dz / d * 5); }
    if (U.chance(0.3) && !Director.speaking) Director.say(U.pickFresh('hit', Director.LINES.hit));
    return true;
  }
  function push(vx, vz) { G.player.pushX = vx; G.player.pushZ = vz; }
  function teleport(x, z, yaw) {
    const P = G.player;
    let p = [x, z];
    if (!G.special && x < 160) p = Col.unstick(x, z, 0.3);
    P.x = p[0]; P.z = p[1]; P.y = 0; P.vy = 0; P.pushX = P.pushZ = 0;
    if (yaw !== undefined) { P.yaw = yaw; cam.yaw = yaw + Math.PI; }
    cam.snap = true;
  }
  function shake(a, d) { shakeA = Math.max(shakeA, a); shakeT = Math.max(shakeT, d); }
  function flash(col, a) { post.flashCol = col; flashA = Math.max(flashA, a); }
  function glitch(t) { glitchT = Math.max(glitchT, t); }
  function flicker(t) { flickerT = t; }
  function castle(t) {
    castleT = t;
    Tex.swap('wall_in', 'wall_castle'); Tex.swap('wall_low', 'wall_low_castle'); Tex.swap('floor_lino', 'floor_castle'); Tex.swap('floor_wood', 'floor_castle'); Tex.swap('floor_class', 'floor_castle'); Tex.swap('plaster_blue', 'plaster_stone');
    Sound.sfx.castle(); shake(0.3, 0.5); UI.big('ŠKOLA JE HRAD.', 2, '#ffcf3f', 'metafora se stala realitou');
  }
  function logAction(s) { G.actionLog.push(s); if (G.actionLog.length > 20) G.actionLog.shift(); }
  function musicFor() { return G.year === 4 ? 'arena' : 'school'; }

  function pause() {
    if (G.state !== 'play') return;
    G.state = 'paused'; G.stats.pauses++; pausedAt = performance.now();
    for (const k in pressed) pressed[k] = false;
    if (G.stats.pauses >= 3) Achievements.unlock('nepritomen');
    document.getElementById('pause-quip').textContent = U.pick(['MATURITRON mezitím přepočítává tvoje šance.', 'Čas stojí. Jediná věc ve škole, která to umí.', 'Pauza. Jako přestávka, ale bez bufetu.', 'MATURITRON si mezitím dává kafe. Elektrické.']);
    Sound.engine(false);
    UI.show('pause');
  }
  function resume() { UI.hideScreens(); G.state = 'play'; try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* nic */ } }
  function toMenu() {
    unlockPointer();
    Dialogue.abort(); Arena.abort(); MiniGames.QTE.abort(); Director.clearEvents(); Ents.clear(); Ents.clearParts(); UI.clearWorld(); UI.mtHide();
    G.state = 'menu'; G.playing = false; G.timerOn = false; G.special = null; G.inCar = false; Sound.engine(false);
    document.getElementById('hud').classList.add('hidden');
    UI.hideScreens(); UI.show('menu'); Sound.playMusic('menu');
  }
  function gameOver() {
    document.getElementById('hud').classList.add('hidden'); UI.clearWorld();
    G.state = 'over'; G.playing = false; G.timerOn = false; unlockPointer(); Sound.engine(false);
    Dialogue.abort(); Arena.abort(); MiniGames.QTE.abort(); Director.clearEvents(); UI.mtHide();
    Achievements.unlock('vecny');
    if (Settings.s.voice) Voice.play('Čas vypršel. Gratuluji. Právě z tebe je věčný student.');
    Sound.stopMusic(); Sound.sfx.gameover();
    const done = G.objectives.filter(o => o.done).length;
    document.getElementById('go-stats').textContent = `Dosažený ročník: ${G.year}. · Splněné úkoly v ročníku: ${done}/${G.objectives.length} · Zásahy: ${G.stats.hits} · Uvidíme se v září.`;
    UI.show('gameover');
  }
  function victory() {
    document.getElementById('hud').classList.add('hidden'); UI.clearWorld();
    G.state = 'victory'; G.playing = false; G.timerOn = false; unlockPointer(); Sound.engine(false); UI.mtHide();
    Achievements.unlock('absolvent');
    if (G.time > 120) Achievements.unlock('speedrun');
    if (G.stats.hits >= 10) Achievements.unlock('prezivac');
    document.getElementById('vs-error').classList.add('hidden');
    document.getElementById('vic-stats').textContent = `Zbývající čas: ${U.fmtTime(G.time)} · Zásahy: ${G.stats.hits} · Achievementy: ${Achievements.count}`;
    Sound.playMusic('menu');
    UI.show('victory');
  }
  function showCredits() {
    const a = U.esc(CFG.CREDITS_AUTHOR || 'student INFISu');
    document.getElementById('credits-roll').innerHTML = `
      <h3>INFIS: MATURITA ANY%</h3><div class="small">3D komedie o čtyřech letech za deset minut</div>
      <h3>Hru vytvořil</h3><div>${a}</div><div class="small">pololetní práce z programování</div>
      <h3>Engine</h3><div>vlastní WebGL2 renderer, stíny, mlha, obloha</div><div class="small">čisté HTML · CSS · JavaScript · žádné knihovny</div>
      <h3>Hrají (smyšlené verze)</h3>
      <div>Adam Hojer — C# Wizard</div><div>Vladimír Nágr — Debugging Master</div><div>Tobiáš Horváth — Data Collector</div>
      <div>Jan Novák — English Guardian</div><div>Eva Baťková — Language Switcher</div><div>Ondřej Janda — Literature Guardian</div>
      <div>Miroslav Prynych — Excel Emperor</div><div>Adam Láďman — Economy Boss</div><div>Olga Břízová — Legendární Boss (v důchodu)</div>
      <div>MATURITRON 3000 — sám sebe</div><div>Tramvaj č. 4 — sama sebe</div>
      <h3>Lokace</h3><div>INFIS, Klatovská tř., Plzeň-Bory</div><div class="small">+ Borský park, Úřad práce, záchranka, balíkobox</div>
      <h3>Hlas MATURITRONA</h3><div>ElevenLabs (předgenerováno)</div>
      <h3>Font</h3><div>Pixelify Sans (SIL OFL)</div>
      <h3>Speciální poděkování</h3><div>Excelu. Za všechno.</div><div>Středníku. Že se vrátil.</div>
      <div class="small">Všechny postavy a dialogy jsou smyšlené. Při tvorbě nebyl zraněn žádný učitel. Jen Excel.</div>
      <h3>KONEC</h3><div class="small">…nebo začátek? (Úřad práce otevírá v 8:00)</div>`;
    UI.show('credits');
  }

  // =============================================================
  //  SMYČKA
  // =============================================================
  let warned = {}, stillT = 0, lastRoom = null, bumpCd = 0, wasBump = false;
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    gt += dt; env.time = gt;
    try { update(dt); render(dt); } catch (e) { console.error(e); }
    for (const k in pressed) pressed[k] = false;
  }

  function update(dt) {
    if (G.state === 'menu' || G.state === 'loading') { menuCam(dt); updateNpcs(dt); Vehicles.update(dt, { px: 9999, pz: 9999 }); Ents.update(dt, null); return; }
    if (G.state === 'paused' || G.state === 'over' || G.state === 'victory') { if (hit('Escape') && G.state === 'paused' && performance.now() - pausedAt > 400) resume(); return; }

    // pauza
    if (hit('Escape')) { if (UI.closePopup()) { Director.onPopupClosed(); } else { pause(); return; } }

    // časovač
    const dialogPause = Dialogue.active && Settings.s.pauseDialog;
    const cardOn = !document.getElementById('yearcard').classList.contains('hidden');
    if (G.timerOn && !dialogPause && !G.cutscene && !cardOn) {
      G.time -= dt;
      for (const [th, line] of [[300, '5 minut. Statisticky jsi už v háji.'], [120, '2 minuty! Zrychluji hudbu. Protože můžu.'], [60, 'Poslední minuta. Barvím obrazovku do červena. Pro atmosféru.'], [30, '30 sekund. Začni panikařit. Nebo ne, ať je to zajímavější.']]) {
        if (G.time <= th && !warned[th]) { warned[th] = true; Director.sayNow(line, 'angry'); Sound.sfx.warn(); if (th === 120) Sound.setTempo(1.15); if (th === 30) Sound.setTempo(1.3); }
      }
      if (G.time <= 0) { G.time = 0; gameOver(); return; }
    }
    if (timerBonusT > 0) timerBonusT -= dt;
    UI.setTimer(G.time, timerBonusT > 0 ? 'bonus' : '');

    // dialog
    if (Dialogue.active) {
      Dialogue.update(dt);
      if (hit('KeyE', 'Space', 'Enter')) Dialogue.advance();
      if (hit('Digit1', 'Numpad1')) Dialogue.choose(0); if (hit('Digit2', 'Numpad2')) Dialogue.choose(1); if (hit('Digit3', 'Numpad3')) Dialogue.choose(2);
      if (hit('ArrowUp', 'KeyW')) Dialogue.move(-1); if (hit('ArrowDown', 'KeyS')) Dialogue.move(1);
    }
    if (MiniGames.QTE.active) { for (const k in pressed) if (pressed[k]) MiniGames.QTE.key(k); MiniGames.QTE.update(dt); }

    // úvodní průlet
    if (introT < introDur) introT += dt;

    const frozen = Dialogue.active || G.cutscene || MiniGames.QTE.active || cardOn;
    if (!frozen) {
      if (UI.popupCount() && hit('KeyE')) { UI.closePopup(); Sound.sfx.move(); Director.onPopupClosed(); }
      else if (G.inCar) updateCar(dt);
      else { updatePlayer(dt); interaction(); }
      if (hit('KeyV')) { cam.fp = !cam.fp; if (cam.fp) Achievements.unlock('fps'); cam.pitch = cam.fp ? 0 : 0.3; }
    } else { G.player.speed = 0; if (G.player.char) G.player.char.speed = 0; Sound.engine(G.inCar, 0); UI.prompt(''); }

    // debug
    if (CFG.DEBUG && !Dialogue.active) {
      if (hit('KeyN')) { for (const o of G.objectives) if (!o.done && !o.optional) completeObjective(o.id); }
      if (hit('KeyT')) G.time -= 60;
      if (hit('KeyB')) { G.year = 4; setYear(4); for (const o of G.objectives) o.done = true; completeObjective('sign_ladman'); G.objectives.forEach(o => { if (o.id.startsWith('sign')) o.done = true; }); G.flags.examOpen = true; World.buildYear(4, true); teleport(22, 0.8, Math.PI); }
      if (hit('KeyG')) Director._force(U.pick(Director.EVENTS));
      if (hit('KeyY') && G.year < 4) { setYear(G.year + 1); teleport(0.5, 1.0, Math.PI); }
    }

    Arena.update(dt);
    updateNpcs(dt);
    Director.update(dt);
    Vehicles.update(dt, { px: G.inCar ? Vehicles.car.x : G.player.x, pz: G.inCar ? Vehicles.car.z : G.player.z, inCar: G.inCar, onTramHit, onCarHit, onBell: () => Sound.sfx.tramBell(), onHonk: () => Sound.sfx.horn() });
    Ents.update(dt, G.inCar ? null : G.player);
    Ents.weather((G.special ? null : ENVS[G.year].weather), G.player.x, G.player.z, dt, World.inside(G.player.x, G.player.z));
    Chars.updateFaces(dt, G.special === 'boss');
    if (G.player.char) { G.player.char.update(dt); }

    // místnosti
    const room = G.special ? null : World.roomAt(G.player.x, G.player.z);
    if (room !== lastRoom) {
      lastRoom = room;
      UI.setRoom(room ? World.ROOMS[room].name : (G.special ? '' : outdoorName()));
      if (room) Story.onEnterRoom(room);
    }
    outdoorChecks();

    // achievement "aktivní účast"
    if (G.timerOn && !frozen && G.player.speed < 0.05 && !G.inCar && !Arena.active) { stillT += dt; if (stillT > 20 && !Achievements.has('aktivni')) { Achievements.unlock('aktivni'); Director.say('Stojíš 20 sekund. Učitelé tomu říkají „aktivní účast“.'); } } else stillT = 0;

    // HUD úkoly
    for (const o of G.objectives) o.subText = o.sub ? o.sub() : null;
    UI.setObjectives(G.objectives);

    // efekty
    G.player.inv = Math.max(0, G.player.inv - dt);
    glitchT = Math.max(0, glitchT - dt); flashA = Math.max(0, flashA - dt * 2.2); shakeT = Math.max(0, shakeT - dt); if (shakeT <= 0) shakeA = 0;
    if (flickerT > 0) flickerT -= dt;
    if (castleT > 0) { castleT -= dt; if (castleT <= 0) for (const n of ['wall_in', 'wall_low', 'floor_lino', 'floor_wood', 'floor_class', 'plaster_blue']) Tex.swap(n); }
    updateCamera(dt);
  }
  function outdoorName() {
    const P = G.player;
    if (P.x > 84) return 'BORSKÝ PARK';
    if (P.x > 58) return 'KLATOVSKÁ TŘÍDA';
    if (P.z < -47 && P.x > -10 && P.x < 40) return 'ÚŘAD PRÁCE';
    if (P.z < -34) return 'KAPLÍŘOVA';
    if (P.x < -52 && P.z < 0) return 'ZÁCHRANKA';
    if (P.x < -32 && P.z > -8 && P.z < 22) return 'PARKOVIŠTĚ';
    if (P.z > 23) return 'ULICE';
    return 'AREÁL INFIS';
  }
  function outdoorChecks() {
    const P = G.inCar ? Vehicles.car : G.player;
    if (P.x > 84) Achievements.unlock('turista') && Director.say('Borský park. Maturita je na druhé straně. Jen připomínám.');
    if (P.x > 118 && P.z > 28 && P.z < 66) Achievements.unlock('tenis');
    if (G.year === 1 && G.timerOn && P.z > 36 && !Achievements.has('prvni_den')) { Achievements.unlock('prvni_den'); Director.say('První den a už chceš domů? Škola je TAM. Ta modrá.'); }
  }

  // ---------------- hráč ----------------
  function updatePlayer(dt) {
    const P = G.player, A = Arena.active;
    let ix = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
    let iz = (down('KeyW', 'ArrowUp') ? 1 : 0) - (down('KeyS', 'ArrowDown') ? 1 : 0);
    const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
    const yaw = ((A && !A.def.followCam) || window.__bot) ? 0 : cam.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let mx = fx * iz + rx * ix, mz = fz * iz + rz * ix;
    const sprint = down('ShiftLeft', 'ShiftRight');
    const maxSp = sprint ? 6.8 : 4.3;
    const tvx = mx * maxSp, tvz = mz * maxSp;
    P.vx = U.smooth(P.vx, tvx, 14, dt); P.vz = U.smooth(P.vz, tvz, 14, dt);
    P.pushX *= Math.exp(-6 * dt); P.pushZ *= Math.exp(-6 * dt);
    const dx = (P.vx + P.pushX) * dt, dz = (P.vz + P.pushZ) * dt;
    const bounds = A ? A.bounds : null;
    const m = Col.move(P.x, P.z, dx, dz, 0.3, bounds);
    P.x = m.x; P.z = m.z;
    P.speed = Math.hypot(P.vx, P.vz);
    if (il > 0.1) P.yaw = U.angleLerp(P.yaw, Math.atan2(mx, mz), 1 - Math.exp(-14 * dt));
    // náraz do zdi
    bumpCd -= dt;
    if (m.hit && P.speed > 2.5 && !wasBump && bumpCd <= 0) { G.stats.bumps++; bumpCd = 0.6; if (G.stats.bumps === 5) { Achievements.unlock('architektura'); Director.say('Zdi jsou pevné. Ověřeno tebou. Pětkrát.'); } }
    wasBump = m.hit && P.speed > 2.5;
    // skok
    if (hit('Space') && P.y <= 0.001 && !nearest) { P.vy = 5.4; G.stats.jumps++; Sound.sfx.jump(); if (G.stats.jumps === 25) Achievements.unlock('skokan'); }
    P.vy -= 16 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y <= 0) P.vy = 0;
    // kroky
    stepT -= dt * P.speed; if (stepT <= 0 && P.y === 0 && P.speed > 1) { stepT = 1.6; Sound.sfx.step(); }
    // auto
    if (hit('KeyF') && !A && !G.special) {
      const c = Vehicles.car;
      if (Math.hypot(c.x - P.x, c.z - P.z) < 3.4) enterCar();
    }
    const ch = P.char; ch.x = P.x; ch.z = P.z; ch.y = P.y; ch.yaw = P.yaw; ch.speed = P.speed;
    ch.visible = !cam.fp;
    ch.tint = P.inv > 0 && (gt * 16 | 0) % 2 ? [1, 0.5, 0.5, 0.3] : null;
  }
  let stepT = 0;
  function enterCar() {
    G.inCar = true; G.player.char.visible = false; Sound.sfx.door();
    if (Achievements.unlock('ridicak')) Director.say('Řidičák nemáš. Pojištění nemáš. Maturitu nemáš. Ale auto jo.');
    cam.snap = true; cam.yaw = Math.atan2(-Math.cos(Vehicles.car.yaw), Math.sin(Vehicles.car.yaw));
    G.logAction('Ukradl auto');
  }
  function exitCar(silent) {
    const c = Vehicles.car;
    G.inCar = false; Sound.engine(false); if (!silent) Sound.sfx.door();
    const lx = Math.sin(c.yaw), lz = Math.cos(c.yaw); // levá strana
    teleport(c.x + lx * 2.0, c.z + lz * 2.0);
    G.player.char.visible = true; UI.carHud(false);
  }
  function updateCar(dt) {
    const c = Vehicles.car;
    const input = { up: down('KeyW', 'ArrowUp'), down: down('KeyS', 'ArrowDown'), left: down('KeyA', 'ArrowLeft'), right: down('KeyD', 'ArrowRight'), brake: down('Space'), boost: down('ShiftLeft', 'ShiftRight') };
    const crash = Vehicles.updateCar(dt, input, true);
    if (crash) { Sound.sfx.crash(); shake(0.6, 0.4); c.crashes++; if (Achievements.unlock('pojistovna')) Director.say('Pojišťovna právě začala plakat. Slyším ji až sem.'); }
    if (Math.abs(c.speed) * 3.6 >= 100) Achievements.unlock('rychlik');
    if (hit('KeyH')) { Sound.sfx.horn(); G.stats.horns++; if (G.stats.horns === 10) Achievements.unlock('troubic'); }
    if (hit('KeyF') && Math.abs(c.speed) < 4) exitCar();
    G.player.x = c.x; G.player.z = c.z; G.player.speed = 0;
    Sound.engine(true, c.speed);
    UI.carHud(true, c.speed * 3.6);
    UI.prompt('');
  }
  function onTramHit(t) {
    if (G.state !== 'play' || G.cutscene) return;
    if (G.inCar) { const c = Vehicles.car; c.x += (c.x < t.x ? -1 : 1) * 2.5; c.speed = -c.speed * 0.3; Sound.sfx.crash(); shake(0.8, 0.5); if (hurt(5, null, false)) Director.sayNow('Tramvaj má přednost. Ty ne.', 'angry'); Achievements.unlock('tramvaj'); return; }
    const P = G.player;
    const side = P.x < t.x ? -1 : 1;
    if (hurt(5, null, false)) { push(side * 9, 0); Sound.sfx.crash(); Achievements.unlock('tramvaj'); Director.sayNow('Tramvaj má přednost. Ty ne.', 'angry'); }
    P.x = t.x + side * (1.25 + 0.6);
  }
  function onCarHit(c) {
    if (G.state !== 'play' || G.cutscene || G.inCar) return;
    const P = G.player;
    if (hurt(3, null, false)) { push((P.x < c.x ? -1 : 1) * 7, c.dir * 4); Sound.sfx.horn(); UI.floatText(P.x, 2.3, P.z, 'TÚÚÚT!', '#ffcf3f'); }
  }

  // ---------------- interakce ----------------
  let nearest = null;
  function interaction() {
    const P = G.player;
    nearest = null; let best = 1e9;
    const consider = (x, z, r, item) => {
      const d = Math.hypot(x - P.x, z - P.z);
      if (d > r) return;
      // trochu preferuj věci před hráčem
      const a = Math.atan2(x - P.x, z - P.z), facing = Math.abs(U.angleDiff(P.yaw, a));
      const score = d + facing * 0.35;
      if (score < best) { best = score; nearest = item; }
    };
    if (!Arena.active && !G.special) {
      for (const n of G.npcs) if (!n.temp) consider(n.x, n.z, 2.3, { kind: 'npc', n });
      for (const i of G.extraInteract) { const x = i.npcRef ? i.npcRef.x : i.x, z = i.npcRef ? i.npcRef.z : i.z; consider(x, z, i.r, { kind: 'extra', i }); }
      for (const i of World.interact) consider(i.x, i.z, i.r, { kind: 'thing', i });
    }
    const c = Vehicles.car, carNear = !Arena.active && !G.special && Math.hypot(c.x - P.x, c.z - P.z) < 3.4;
    let html = '';
    if (nearest) {
      const pr = (k, t) => `<span class="pr"><kbd>${k}</kbd>${U.esc(t)}</span>`;
      if (nearest.kind === 'npc') { const s = Chars.SPECS[nearest.n.id]; html = pr('E', s.name.split(' ').pop().charAt(0) + s.name.split(' ').pop().slice(1).toLowerCase()); }
      else html = pr('E', nearest.i.label);
    }
    if (carNear) html += '<span class="pr"><kbd>F</kbd>Řídit</span>';
    UI.prompt(html);
    if (nearest && hit('KeyE')) {
      if (nearest.kind === 'npc') { const n = nearest.n; faceEachOther(n); Story.talk(n); }
      else if (nearest.kind === 'extra') nearest.i.fn();
      else Story.inspect(nearest.i.id);
    }
  }
  function faceEachOther(n) {
    const P = G.player;
    n.yaw = Math.atan2(P.x - n.x, P.z - n.z); n.talkTarget = true;
    P.yaw = Math.atan2(n.x - P.x, n.z - P.z);
    dialogNpc = n;
  }
  let dialogNpc = null;

  // ---------------- NPC ----------------
  function updateNpcs(dt) {
    const P = G.player;
    for (const n of G.npcs) {
      n.update(dt);
      const dx = P.x - n.x, dz = P.z - n.z, d = Math.hypot(dx, dz);
      const inDialog = Dialogue.active && dialogNpc === n;
      if (n.beh === 'temp') continue; // řídí Director
      if (inDialog) { n.speed = 0; n.yaw = U.angleLerp(n.yaw, Math.atan2(dx, dz), 1 - Math.exp(-8 * dt)); continue; }
      if (n.beh === 'idle') {
        n.speed = 0;
        const target = d < 4.5 && G.state === 'play' ? Math.atan2(dx, dz) : n.baseYaw;
        n.yaw = U.angleLerp(n.yaw, target, 1 - Math.exp(-4 * dt));
      } else if (n.beh === 'wander' || n.beh === 'moonwalk' || (n.beh === 'pester' && !(d < 9 && G.state === 'play' && !G.inCar && G.timerOn))) {
        n.wt -= dt;
        const tdx = n.tx - n.x, tdz = n.tz - n.z, td = Math.hypot(tdx, tdz);
        if (n.wt > 0 || td < 0.2) {
          n.speed = 0;
          if (n.wt <= 0) { n.wt = U.rand(1, 3); const a = n.area; if (a) { n.tx = U.rand(a.x0, a.x1); n.tz = U.rand(a.z0, a.z1); } }
          if (d < 3 && G.state === 'play') n.yaw = U.angleLerp(n.yaw, Math.atan2(dx, dz), 1 - Math.exp(-4 * dt));
        } else {
          const sp = n.beh === 'moonwalk' ? 1.0 : 1.3;
          const m = Col.move(n.x, n.z, tdx / td * sp * dt, tdz / td * sp * dt, 0.28);
          if (Math.hypot(m.x - n.x, m.z - n.z) < sp * dt * 0.3) { n.wt = 0.5; n.tx = n.x; n.tz = n.z; }
          n.x = m.x; n.z = m.z; n.speed = sp;
          const my = Math.atan2(tdx, tdz);
          n.yaw = U.angleLerp(n.yaw, n.beh === 'moonwalk' ? my + Math.PI : my, 1 - Math.exp(-8 * dt));
        }
      } else if (n.beh === 'pester') {
        n.cd = Math.max(0, n.cd - dt);
        if (n.cd <= 0 && !Arena.active && !Dialogue.active && !G.cutscene) {
          const sp = 2.4;
          const m = Col.move(n.x, n.z, dx / d * sp * dt, dz / d * sp * dt, 0.28);
          n.x = m.x; n.z = m.z; n.speed = sp; n.yaw = Math.atan2(dx, dz);
          UI.bubble('p' + n.uid, n.x, 2.35, n.z, 'Máš chvilku?', 0.2);
          if (d < 0.9 && hurt(3, n)) { n.cd = 7; Achievements.unlock('chvilka'); UI.floatText(P.x, 2.6, P.z, 'Máš chvilku? −3 s', '#ffcf3f'); }
        } else n.speed = 0;
      }
      // odstrčení hráče
      if (d < 0.6 && !G.inCar && d > 0.001) { const pdx = dx / d * (0.6 - d), pdz = dz / d * (0.6 - d); const m = Col.move(P.x, P.z, pdx, pdz, 0.3, Arena.active ? Arena.active.bounds : null); P.x = m.x; P.z = m.z; }
    }
    if (!Dialogue.active) dialogNpc = null;
  }
  function onSpeak(who) {
    for (const n of G.npcs) if (n.id === who) n.talk = 1.2;
    if (who === 'player' && G.player.char) G.player.char.talk = 1.0;
  }

  // ---------------- kamera ----------------
  function menuCam(dt) {
    const a = gt * 0.06;
    camPos[0] = Math.sin(a) * 48 + 4; camPos[1] = 17 + Math.sin(gt * 0.1) * 3; camPos[2] = Math.cos(a) * 40 + 8;
    camLook[0] = 2; camLook[1] = 4; camLook[2] = 2;
    finishCam(1);
  }
  function updateCamera(dt) {
    const P = G.player, A = Arena.active;
    cam.mouseT += dt;
    let tp, tl, rate = 10;
    if (introT < introDur && G.state === 'play') {
      const k = U.clamp(introT / introDur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      const from = [30, 40, 70], to = [P.x + Math.sin(cam.yaw) * 4.4, 1.5 + 1.6, P.z + Math.cos(cam.yaw) * 4.4];
      tp = [U.lerp(from[0], to[0], e), U.lerp(from[1], to[1], e), U.lerp(from[2], to[2], e)];
      tl = [U.lerp(0, P.x, e), U.lerp(3, 1.5, e), U.lerp(0, P.z, e)];
      camPos[0] = tp[0]; camPos[1] = tp[1]; camPos[2] = tp[2]; camLook[0] = tl[0]; camLook[1] = tl[1]; camLook[2] = tl[2];
      finishCam(1); return;
    }
    if (A && !A.def.followCam) {
      const b = A.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      const big = A.world ? 1 : 0;
      const W = b.x1 - b.x0, D = b.z1 - b.z1 + (b.z1 - b.z0);
      const h = big ? Math.max(16, W * 0.5) : Math.max(8.5, Math.max(W, D) * 0.95);
      const back = big ? h * 0.55 : h * 0.55;
      const fx = U.lerp(cx, P.x, big ? 0.75 : 0.4), fz = U.lerp(cz, P.z, big ? 0.75 : 0.4);
      tp = [fx, h, fz + back]; tl = [fx, 0, fz - 0.6];
      rate = 6;
    } else if (Dialogue.active && dialogNpc && !cam.fp) {
      const n = dialogNpc, dx = P.x - n.x, dz = P.z - n.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
      const px = -uz, pz = ux;
      tp = [P.x + ux * 1.9 + px * 0.9, 2.0, P.z + uz * 1.9 + pz * 0.9];
      tl = [n.x, 1.55, n.z];
      const dd = Math.hypot(tp[0] - P.x, tp[2] - P.z);
      const r = Col.ray(P.x, 1.7, P.z, (tp[0] - P.x) / dd, 0, (tp[2] - P.z) / dd, dd);
      if (r < dd) { tp[0] = P.x + (tp[0] - P.x) * r / dd; tp[2] = P.z + (tp[2] - P.z) * r / dd; }
      rate = 5;
    } else if (G.inCar) {
      const c = Vehicles.car;
      const want = Math.atan2(-Math.cos(c.yaw), Math.sin(c.yaw));
      if (cam.mouseT > 1.2) cam.yaw = U.angleLerp(cam.yaw, want, 1 - Math.exp(-3 * dt));
      const d = 7.5, pitch = 0.3;
      const tx = c.x, ty = 1.3, tz = c.z;
      tp = [tx + Math.sin(cam.yaw) * Math.cos(pitch) * d, ty + Math.sin(pitch) * d + 0.6, tz + Math.cos(cam.yaw) * Math.cos(pitch) * d];
      tl = [tx, ty + 0.4, tz];
      rate = 12;
    } else {
      const inside = World.inside(P.x, P.z) && !G.special;
      // automatické natočení za hráče, když nehýbe myší
      if (cam.mouseT > 2 && P.speed > 1 && !cam.fp) cam.yaw = U.angleLerp(cam.yaw, P.yaw + Math.PI, 1 - Math.exp(-1.2 * dt));
      const tx = P.x, ty = P.y + 1.5, tz = P.z;
      if (cam.fp) {
        tp = [tx, P.y + 1.62, tz];
        tl = [tx - Math.sin(cam.yaw) * Math.cos(cam.pitch), P.y + 1.62 - Math.sin(cam.pitch), tz - Math.cos(cam.yaw) * Math.cos(cam.pitch)];
        rate = 40;
      } else {
        const dist = inside ? 3.6 : 4.8;
        const pitch = cam.pitch;
        const dx = Math.sin(cam.yaw) * Math.cos(pitch), dy = Math.sin(pitch), dz = Math.cos(cam.yaw) * Math.cos(pitch);
        let d = dist;
        if (!G.special) d = Math.min(d, Col.ray(tx, ty, tz, dx, dy, dz, dist));
        d = Math.max(0.6, d);
        tp = [tx + dx * d, ty + dy * d, tz + dz * d];
        if (inside) tp[1] = Math.min(tp[1], World.CEIL - 0.25);
        tl = [tx, ty, tz];
        rate = 18;
      }
    }
    const k = cam.snap ? 1 : 1 - Math.exp(-rate * dt);
    for (let i = 0; i < 3; i++) { camPos[i] += (tp[i] - camPos[i]) * k; camLook[i] += (tl[i] - camLook[i]) * k; }
    cam.snap = false;
    finishCam(1);
  }
  function finishCam() {
    let px = camPos[0], py = camPos[1], pz = camPos[2];
    if (shakeA > 0) { px += (Math.random() - 0.5) * shakeA; py += (Math.random() - 0.5) * shakeA; pz += (Math.random() - 0.5) * shakeA; }
    const aspect = canvas.width / canvas.height;
    const fov = (G.inCar ? 68 : cam.fp ? 75 : 62) * Math.PI / 180;
    M4.perspective(cam.proj, fov, aspect, 0.08, 400);
    M4.lookAt(cam.view, px, py, pz, camLook[0], camLook[1], camLook[2]);
    M4.mul(cam.vp, cam.proj, cam.view);
    cam.pos = [px, py, pz];
    const v = cam.view;
    cam.right = [v[0], v[4], v[8]]; cam.up = [v[1], v[5], v[9]];
    // yaw kamery pro minimapu (z pozice vůči cíli)
    cam.mapYaw = Math.atan2(px - camLook[0], pz - camLook[2]);
  }

  // =============================================================
  //  VYKRESLENÍ
  // =============================================================
  function render(dt) {
    const P = G.player;
    const sp = G.special;
    const E = ENVS[sp || (G.state === 'menu' ? 1 : G.year)] || ENVS[1];
    Object.assign(env, E);
    env.cyber = E.cyber || 0;
    env.shadows = Settings.s.shadows;
    env.focus = G.state === 'menu' ? [4, 0, 4] : [P.x, 0, P.z];
    env.shadowRadius = G.state === 'menu' ? 60 : 40;
    env.wobble = G.wobble;
    env.indoorForce = false;
    env.sprBright = E.night > 0.5 ? 0.85 : 1;
    // světla
    env.lights = [];
    if (E.night > 0.5 && !sp) {
      const ls = World.lamps.map(l => ({ l, d: (l.x - P.x) ** 2 + (l.z - P.z) ** 2 })).sort((a, b) => a.d - b.d).slice(0, 5);
      for (const { l } of ls) env.lights.push({ x: l.x, y: 4.6, z: l.z, r: 16, c: [1, 0.85, 0.55], i: 1.4 });
      if (G.year === 4 && World.inside(P.x, P.z)) {
        const pulse = 0.5 + 0.5 * Math.sin(gt * 4);
        for (const x of [-26, -18, -10, -2, 6, 14, 22].sort((a, b) => Math.abs(a - P.x) - Math.abs(b - P.x)).slice(0, 2)) env.lights.push({ x, y: 2.9, z: 0.5, r: 7, c: [1, 0.1, 0.1], i: 0.9 * pulse });
      }
    }
    if (sp === 'boss') { const A = Arena.active; env.lights.push({ x: A ? A.data.bx : 500, y: 6, z: -12, r: 26, c: [1, 0.15, 0.2], i: 1.5 }); env.lights.push({ x: P.x, y: 2.5, z: P.z, r: 7, c: [0.3, 1, 0.6], i: 0.6 }); }
    if (castleT > 0) env.lights.push({ x: P.x, y: 2.5, z: P.z, r: 10, c: [1, 0.55, 0.2], i: 0.9 });
    // blikání světel (Olga, finále)
    if (flickerT > 0) { const f = Math.random() < 0.5 ? 0.15 : 1; env.inAmb = env.inAmb.map(v => v * f); env.inTop = env.inTop.map(v => v * f); }
    if (G.flags.final && !sp) { env.inAmb = [0.3, 0.22, 0.24]; env.inTop = [0.45, 0.3, 0.3]; }
    if (G.year === 3 && lastRoom === 'r404' && !G.flags.olgaDone && !sp) { env.inAmb = env.inAmb.map(v => v * 0.55); }

    // post-processing
    post.glitch = Math.min(1, glitchT * 1.5) + (G.wobble ? 0.12 : 0) + (Director.wifi ? 0.35 : 0);
    const low = G.state === 'play' && G.timerOn ? (G.time < 30 ? 0.35 + 0.25 * Math.sin(gt * 8) : G.time < 60 ? 0.12 + 0.1 * Math.sin(gt * 4) : 0) : 0;
    post.red = Math.max(0, low);
    post.flash = flashA;
    post.vig = 1.2; post.sat = E.sat; post.grade = E.grade; post.gray = G.state === 'over' ? 0.8 : 0;

    // --- scéna
    if (!sp) {
      const insideCam = World.inside(camPos[0], camPos[2]) && camPos[1] < World.CEIL;
      const doll = !!(Arena.active && !Arena.active.world);
      void insideCam;
      World.draw({ dollhouse: doll });
      Vehicles.draw(G.inCar);
    }
    Arena.draw();
    for (const n of G.npcs) n.draw();
    if (G.state !== 'menu' && P.char && !G.inCar) P.char.draw();
    // MATURITRON dron
    if (Director.speaking && G.state === 'play' && sp !== 'boss') {
      droneA = Math.min(1, droneA + dt * 3);
      const tx = P.x + Math.cos(cam.yaw) * 1.3, tz = P.z - Math.sin(cam.yaw) * 1.3;
      drone[0] += (tx - drone[0]) * (1 - Math.exp(-5 * dt)); drone[2] += (tz - drone[2]) * (1 - Math.exp(-5 * dt));
      const yy = (World.inside(P.x, P.z) ? 2.45 : 2.7) + Math.sin(gt * 2.4) * 0.12;
      drone[1] = yy;
      Chars.drawMT(drone[0], drone[1], drone[2], Math.atan2(camPos[0] - drone[0], camPos[2] - drone[2]), 0.42 * droneA, false, 0);
    } else { droneA = 0; drone[0] = P.x; drone[2] = P.z; }
    // značky cílů
    const markers = [];
    if (G.state === 'play' && !Arena.active && !sp) {
      for (const o of G.objectives) {
        if (o.done) continue;
        let t = null;
        if (o.npc) { const n = findNpc(o.npc); if (n) t = { x: n.x, z: n.z, y: 2.55 }; }
        else if (o.target) { const q = o.target(); t = { x: q.x, z: q.z, y: 2.3 }; }
        if (!t) continue;
        markers.push({ x: t.x, z: t.z, col: o.optional ? '#e6b3ff' : '#ffcf3f', big: true });
        if (Math.hypot(t.x - P.x, t.z - P.z) > 3.2) GFX.sprite(Spr.get('marker'), t.x, t.y + Math.sin(gt * 3) * 0.12, t.z, 0.45, 0.6, o.optional ? [0.9, 0.7, 1, 1] : [1, 1, 1, 1], 0, false, true);
      }
      if (G.glitchMission) for (const i of G.extraInteract) markers.push({ x: i.npcRef ? i.npcRef.x : i.x, z: i.npcRef ? i.npcRef.z : i.z, col: '#ff4d5e' });
      if (!G.inCar) markers.push({ x: Vehicles.car.x, z: Vehicles.car.z, col: '#ff7a1c' });
    }
    // stíny pod postavami
    const shS = Spr.get('shadow');
    for (const n of G.npcs) if (n.visible) GFX.decal(shS, n.x, 0.03, n.z, 0.9, 0.9, [1, 1, 1, 0.55]);
    if (P.char && P.char.visible && !G.inCar && G.state !== 'menu') GFX.decal(shS, P.x, 0.03, P.z, 0.9 - P.y * 0.2, 0.9 - P.y * 0.2, [1, 1, 1, 0.55]);
    Ents.draw();
    Spr.flush();
    const scale = (Settings.s.pixel ? CFG.RENDER_SCALE_PIXEL : CFG.RENDER_SCALE_SHARP);
    GFX.render(cam, env, post, scale);

    // --- UI ve světě
    const W = window.innerWidth, H = window.innerHeight;
    if (G.state === 'play' && !Dialogue.active && !Arena.active && !sp) {
      const tags = [];
      for (const n of G.npcs) { const d = Math.hypot(n.x - P.x, n.z - P.z); if (d < 7.5 && !n.temp) tags.push({ key: n.uid, x: n.x, y: 2.15, z: n.z, name: Chars.SPECS[n.id].name, title: Chars.SPECS[n.id].title, alpha: U.clamp((7.5 - d) / 2, 0, 1) }); }
      UI.nameTags(tags, cam.vp, W, H);
    } else UI.nameTags([], cam.vp, W, H);
    UI.updateLabels(dt, cam.vp, W, H);
    if (G.state === 'play') {
      if (Director.wifi) UI.els().minimap.style.opacity = 0.2; else UI.els().minimap.style.opacity = 1;
      UI.minimap(P.x, P.z, G.inCar ? Math.atan2(Math.cos(Vehicles.car.yaw), -Math.sin(Vehicles.car.yaw)) : P.yaw, World.inside(P.x, P.z), markers, cam.mapYaw || 0);
      if (Director.speaking) UI.mtFace(Chars && 'talk', gt);
      if (!G.inCar) UI.carHud(false);
    }
  }
  const drone = [0, 2.5, 0]; let droneA = 0;

  // ---------------- veřejné API ----------------
  return Object.assign(G, {
    init, hurt, push, teleport, addTime, completeObjective, shake, flash, glitch, flicker, castle, logAction, musicFor,
    addTemp, removeTemp, spawnNpc, setNpcs, findNpc, faceNpc: (c) => faceEachOther(c), victory, onSpeak,
    get env() { return env; },
  });
})();

window.addEventListener('load', () => Game.init());
