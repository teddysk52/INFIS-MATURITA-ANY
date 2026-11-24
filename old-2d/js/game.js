'use strict';
// =============================================================
//  game.js — hlavní smyčka, stav hry, hráč, postavy, HUD,
//  efekty, menu. Logické rozlišení 480×270, canvas = 480×270 × RS.s
//  (vše se kreslí 2× zvětšené, takže pixel-art zůstává ostrý).
// =============================================================
const CFG = window.INFIS_CONFIG;
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

const Game = {
  mode: 'menu', paused: false, time: 600, timerOn: false, cutscene: false,
  year: 1, objectives: [], npcs: [], player: null,
  parts: [], floats: [], hazards: [], popups: [], portals: null, later: [],
  shakeT: 0, shakeMag: 0, flashT: 0, flashMax: 0.2, flashCol: '#fff',
  glitchT: 0, slowT: 0, immuneT: 0, castleT: 0, flickerT: 0, bonusFx: 0, popupT: 0, timerPulse: 0,
  bigTitle: null, banner: null, yearcard: null, glitchMission: null, focus: null, room: null,
  flags: {}, stats: { hits: 0, pauses: 0, bumps: 0, vending: 0 }, thresholds: {}, actionLog: [],
  settings: Object.assign({ sfx: true, music: true, voice: true, shake: true, slowReader: false }, Store.get('infis_settings', {})),
  t: 0, idleT: 0, cam: { x: 0, y: 0 }, konami: [], tempo: 1, lastTick: 0,

  // -----------------------------------------------------------
  init() {
    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    Input.init();
    Input.onKey((e, k) => this.onKey(e, k));
    UI.init();
    Sound.setSfx(this.settings.sfx); Sound.setMusic(this.settings.music); Voice.enabled = this.settings.voice;
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.canvas.addEventListener('pointerdown', (e) => this.onPointer(e));
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.autoPause(); });
    const ready = () => { World.render(4); this.worldReady = true; };
    // počkáme na pixelové fonty (max 2,5 s), pak vykreslíme mapu
    const fontsLoad = document.fonts ? Promise.all([
      document.fonts.load('12px "VT323"', 'Aěščřžýáíéů'),
      document.fonts.load('12px "Silkscreen"', 'AĚŠČŘŽÝÁÍÉŮ'),
      document.fonts.load('bold 12px "Silkscreen"', 'AĚŠČŘŽÝÁÍÉŮ'),
    ]) : Promise.resolve();
    Promise.race([fontsLoad, new Promise(r => setTimeout(r, 2500))]).then(ready, ready);
    Director.checkAI().then(() => UI.refreshStatus());
    UI.refreshStatus();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  },

  // Vykreslujeme v nativním rozlišení displeje (480×270 × S), aby byl text i pixel-art ostrý.
  resize() {
    const s = Math.min(window.innerWidth / 960, window.innerHeight / 540);
    const el = document.getElementById('game');
    const cw = Math.floor(960 * s), ch = Math.floor(540 * s);
    el.style.width = cw + 'px';
    el.style.height = ch + 'px';
    el.style.setProperty('--u', s);
    // vždy 1920×1080 interně → ostrý text; na menším displeji se plynule zmenší
    const S = 4;
    this.canvas.style.imageRendering = (cw * (window.devicePixelRatio || 1) >= 1900) ? 'pixelated' : 'auto';
    if (S !== RS.s || this.canvas.width !== 480 * S) {
      RS.s = S;
      this.canvas.width = 480 * S; this.canvas.height = 270 * S;
      if (this.worldReady) { World.render(this.mode === 'menu' ? 4 : (this.year || 1)); if (Arena.active) Arena.rebuildBg(); }
    }
  },

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    try { this.update(dt); this.draw(); }
    catch (err) { console.error(err); }
    Input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  },

  // -----------------------------------------------------------
  //  Nová hra
  // -----------------------------------------------------------
  newGame() {
    Sound.unlock();
    Object.assign(this, {
      time: CFG.START_TIME, timerOn: false, cutscene: false, paused: false, year: 1,
      parts: [], floats: [], hazards: [], popups: [], portals: null, later: [],
      glitchT: 0, slowT: 0, immuneT: 0, castleT: 0, flickerT: 0, bonusFx: 0, popupT: 0, shakeT: 0, flashT: 0,
      bigTitle: null, banner: null, glitchMission: null, focus: null, room: null,
      flags: {}, stats: { hits: 0, pauses: 0, bumps: 0, vending: 0 }, thresholds: {}, actionLog: [], idleT: 0, tempo: 1,
    });
    Arena.active = false;
    Dialogue.reset();
    World.build();
    this.player = { x: 32 * 16, y: 41 * 16, dir: 'up', anim: 0, inv: 0, kx: 0, ky: 0, stepT: 0, bump: false, moving: false };
    Achievements.reset(); Director.reset(); Sound.setTempo(1);
    this.setupYear(1);
    UI.show(null);
    Sound.playMusic('school');
    this.showYearCard(1, null, () => Dialogue.start(Story.INTRO, () => {
      this.timerOn = true;
      Director.sayNow('Čas běží. Tik ťak. Úkoly máš vpravo nahoře.');
    }));
  },

  setupYear(y) {
    this.year = y;
    World.render(y);
    const s = Story.setupYear(y);
    this.npcs = s.npcs; this.objectives = s.objectives;
    this.room = World.roomAt(this.player.x, this.player.y);
  },

  showYearCard(y, setup, done) {
    this.mode = 'yearcard';
    this.yearcard = { y, t: 0, setup, done, didSetup: false };
    Sound.sfx.whoosh();
    if (y === 1) setTimeout(() => { if (this.mode === 'yearcard') Voice.play('První ročník. Ještě máš naději. Zatím.'); }, 500);
  },

  nextYear() {
    const ny = this.year + 1;
    this.hazards = []; this.portals = null; this.popups = []; this.glitchT = 0; this.slowT = 0;
    this.showYearCard(ny, () => {
      this.player.x = 32 * 16; this.player.y = 17 * 16 + 4; this.player.dir = 'down';
      this.setupYear(ny);
    }, () => {
      Director.sayNow(Story.YEAR_LINES[ny]);
      if (ny === 4) Sound.sfx.alarm();
    });
  },

  completeObjective(id) {
    const o = this.objectives.find(q => q.id === id);
    if (!o || o.done) return;
    o.done = true;
    Sound.sfx.collect();
    this.logAction('Splnil úkol: ' + o.text);
    this.floatText(240, 60, 'ÚKOL SPLNĚN!', '#3fff7a', true);
    if (!o.optional) Director.say(U.pickFresh('mission', Director.LINES.mission));
    this.checkYear();
  },

  checkYear() {
    const req = this.objectives.filter(o => !o.optional);
    if (this.year < 4) {
      if (req.every(o => o.done)) this.after(1.4, () => this.nextYear());
    } else if (!this.flags.examOpen && ['sign_hojer', 'sign_batkova', 'sign_ladman'].every(id => (this.objectives.find(o => o.id === id) || {}).done)) {
      this.flags.examOpen = true;
      World.setExamLocked(false);
      this.objectives.push({ id: 'exam', text: 'JDI DO MATURITNÍHO SÁLU!', target: () => ({ x: 56 * 16, y: 19 * 16 }) });
      Sound.sfx.bell();
      this.after(0.6, () => Director.sayNow('Dveře maturitního sálu jsou otevřené. To je past. …Nebo ne. Nemám to v datasetu.'));
    }
  },

  startGlitchMission() {
    this.glitchMission = { objs: Story.glitchObjects(), fixed: 0 };
    this.glitchT = 1; Sound.sfx.glitch();
  },
  glitchFixed(o) {
    o.fixed = true;
    const gm = this.glitchMission;
    gm.fixed++;
    Sound.sfx.collect();
    this.burst(o.x, o.y - 10, '#3fff7a', 18, true);
    this.floatText(o.x, o.y - 34, `BUG #${gm.fixed} OPRAVEN`, '#3fff7a');
    if (gm.fixed >= 3) {
      this.glitchMission = null; this.glitchT = 0;
      this.showBanner('REALITA OPRAVENA', '0 ERRORS · 47 WARNINGS');
      Achievements.unlock('realita');
      this.after(1.8, () => Story.MISSIONS.nagrOutro());
    }
  },

  startFinal() {
    this.flags.final = true;
    this.hazards = []; this.portals = null; this.popups = [];
    Arena.start(MiniGames.boss, () => this.victory());
  },

  enterArena() { this.fadeT = 0.35; this.mode = 'arena'; this.hazards = []; this.portals = null; this.popups = []; },
  exitArena() {
    this.fadeT = 0.35;
    if (this.mode === 'arena') this.mode = 'play';
    Sound.playMusic('school');
  },

  victory() {
    this.mode = 'victory'; this.timerOn = false;
    Achievements.unlock('absolvent');
    if (this.time > 180) Achievements.unlock('speedrun');
    if (this.stats.hits >= 10) Achievements.unlock('prezivac');
    Sound.stopMusic(); Sound.sfx.victory();
    setTimeout(() => Voice.play('Cože? Ty jsi odmaturoval? To… to není možné. Restartuji se.'), 2200);
    setTimeout(() => UI.showVictory(), 900);
  },

  gameOver() {
    this.mode = 'gameover'; this.timerOn = false; this.time = 0;
    Dialogue.reset(); Arena.active = false;
    Achievements.unlock('vecny');
    Sound.stopMusic(); Sound.sfx.gameover();
    setTimeout(() => Voice.play('Čas vypršel. Gratuluji. Právě z tebe je věčný student.'), 1500);
    setTimeout(() => UI.show('gameover'), 700);
  },

  // -----------------------------------------------------------
  //  Pomocné API pro ostatní moduly
  // -----------------------------------------------------------
  after(t, fn) { this.later.push({ t, fn }); },
  logAction(s) { this.actionLog.push(s); if (this.actionLog.length > 12) this.actionLog.shift(); },
  readMove() {
    let x = 0, y = 0;
    if (Input.isDown('a', 'arrowleft')) x -= 1;
    if (Input.isDown('d', 'arrowright')) x += 1;
    if (Input.isDown('w', 'arrowup')) y -= 1;
    if (Input.isDown('s', 'arrowdown')) y += 1;
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return { x, y, run: Input.isDown('shift') };
  },
  addTime(s, show) {
    this.time += s;
    if (show) { this.floatText(240, 30, (s > 0 ? '+' : '') + s + ' s', s > 0 ? '#3fff7a' : '#ff5a5a', true); this.timerPulse = 1; }
  },
  damage(amount, x, y, screen, label) {
    this.time -= amount;
    this.stats.hits++;
    this.floatText(x, y, label || `−${amount} s`, '#ff5a5a', screen);
    this.floatText(240, 30, `−${amount} s`, '#ff5a5a', true);
    this.shake(5, 0.3); this.flash('#ff2020', 0.15); Sound.sfx.hit();
    this.timerPulse = 1;
    this.logAction(`Zásah (−${amount} s)`);
    if (Math.random() < 0.22) Director.say(U.pickFresh('hit', Director.LINES.hit));
  },
  hurtWorld(amount, fx, fy) {
    const p = this.player;
    if (p.inv > 0 || this.immuneT > 0) return false;
    p.inv = 1.2;
    const dx = p.x - fx, dy = p.y - 6 - fy, d = Math.hypot(dx, dy) || 1;
    p.kx = dx / d * 150; p.ky = dy / d * 150;
    this.damage(amount, p.x, p.y - 30);
    return true;
  },
  shake(mag, t) { if (!this.settings.shake) return; this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, t); },
  flash(col, t) { this.flashCol = col; this.flashT = t; this.flashMax = t; },
  isScreenSpace() { return this.mode !== 'play' && this.mode !== 'yearcard'; },
  floatText(x, y, text, col = '#fff', screen) {
    this.floats.push({ x, y, text, col, t: 0, screen: screen === undefined ? this.isScreenSpace() : screen });
  },
  burst(x, y, col, n = 12, world) {
    const scr = world === undefined ? this.isScreenSpace() : !world;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = U.rand(30, 110);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: U.rand(0.3, 0.7), max: 0.7, col, size: U.randi(1, 2), grav: 120, screen: scr });
    }
  },
  confetti(x, y, n = 60) {
    for (let i = 0; i < n; i++) {
      const a = U.rand(-Math.PI, 0), s = U.rand(60, 200);
      this.parts.push({ x: x + U.rand(-30, 30), y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(1, 2.2), max: 2.2, col: Sprites.confettiColor(), size: 2, grav: 160, conf: true, spin: U.rand(0, 6), screen: true });
    }
  },
  showBanner(title, sub) { this.banner = { title, sub, t: 0, dur: 2.4 }; this.confetti(240, 110, 90); Sound.sfx.win(); this.shake(3, 0.3); },

  // -----------------------------------------------------------
  //  Klávesy mimo herní smyčku
  // -----------------------------------------------------------
  onKey(e, k) {
    if (k === 'escape') {
      if (this.mode === 'play' || this.mode === 'arena') { if (this.paused) this.resume(); else this.pause(); }
      else UI.back();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'v') && (this.mode === 'play' || this.mode === 'arena')) {
      if (Achievements.unlock('ctrlcv')) Director.say('Ctrl+C, Ctrl+V? Tady se nekopíruje. Tady se trpí.');
    }
    this.konami.push(k); if (this.konami.length > 10) this.konami.shift();
    if (this.konami.join(',') === KONAMI.join(',') && (this.mode === 'play' || this.mode === 'arena')) {
      this.konami = [];
      if (Achievements.unlock('konami')) { this.addTime(10, true); Director.sayNow('CHEAT DETEKOVÁN. Nahlásil jsem tě řediteli. …A dal ti 10 sekund. Nevím proč.'); }
    }
    if (CFG.DEBUG && this.mode === 'play' && !Dialogue.active) {
      if (k === 'n') this.objectives.filter(o => !o.done && !o.optional).forEach(o => this.completeObjective(o.id));
      if (k === 't') this.time -= 60;
      if (k === 'b') { World.setExamLocked(false); this.year = 4; this.startFinal(); }
    }
  },
  onPointer(e) {
    if (!this.popups.length || this.mode !== 'play' || this.paused) return;
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 480, y = (e.clientY - r.top) / r.height * 270;
    const top = this.popups[this.popups.length - 1];
    if (x >= top.x && x <= top.x + 200 && y >= top.y && y <= top.y + 64) this.closePopup();
  },
  closePopup() {
    this.popups.pop(); Sound.sfx.select();
    if (!this.popups.length) { Achievements.unlock('edupage'); }
  },
  pause() { if (this.paused) return; this.paused = true; Voice.stop(); this.stats.pauses++; if (this.stats.pauses >= 3) Achievements.unlock('nepritomen'); UI.show('pause'); },
  resume() { this.paused = false; UI.show(null); Input.down.clear(); },
  autoPause() { if ((this.mode === 'play' || this.mode === 'arena') && !this.paused) this.pause(); },

  // -----------------------------------------------------------
  //  UPDATE
  // -----------------------------------------------------------
  update(dt) {
    this.t += dt;
    if (this.mode === 'menu') { this.updateFx(dt); return; }
    if (this.paused || this.mode === 'gameover' || this.mode === 'victory') { this.updateFx(dt); Achievements.update(dt); return; }

    // časovač
    const readerPause = this.settings.slowReader && Dialogue.active;
    if (this.timerOn && this.mode !== 'yearcard' && !this.cutscene && !readerPause) {
      this.time -= dt;
      this.checkThresholds();
      if (this.time <= 0) { this.gameOver(); return; }
    }
    ['glitchT', 'slowT', 'immuneT', 'castleT', 'flickerT', 'bonusFx', 'timerPulse', 'fadeT'].forEach(k => { if (this[k] > 0) this[k] = Math.max(0, this[k] - dt); });
    if (this.bigTitle) { this.bigTitle.t += dt; if (this.bigTitle.t > this.bigTitle.dur) this.bigTitle = null; }
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    if (this.popups.length) { this.popupT -= dt; if (this.popupT <= 0) this.popups = []; }

    Achievements.update(dt);
    Director.update(dt);
    this.updateFx(dt);

    if (this.mode === 'yearcard') { this.updateYearCard(dt); return; }

    // odložené akce (jen když neběží dialog)
    if (!Dialogue.active && this.later.length) {
      const ready = [];
      for (const l of this.later) { l.t -= dt; if (l.t <= 0) ready.push(l); }
      this.later = this.later.filter(l => l.t > 0);
      ready.forEach(l => l.fn());
    }

    if (Dialogue.active) Dialogue.update(dt);
    if (this.mode === 'arena') Arena.update(dt);
    else if (this.mode === 'play') this.updateWorld(dt);
  },

  checkThresholds() {
    const th = this.thresholds, t = this.time;
    if (t <= 300 && !th.a) { th.a = true; Sound.sfx.warn(); this.timerPulse = 2; Director.sayNow('5 minut. Statisticky jsi už v háji.'); }
    if (t <= 120 && !th.b) { th.b = true; Sound.sfx.warn(); this.timerPulse = 2; Director.sayNow('2 minuty! Zrychluji hudbu. Protože můžu.'); }
    if (t <= 60 && !th.c) { th.c = true; Sound.sfx.alarm(); this.timerPulse = 2; Director.sayNow('Poslední minuta. Barvím obrazovku do červena. Pro atmosféru.'); }
    if (t <= 30 && !th.d) { th.d = true; Director.sayNow('30 sekund. Začni panikařit. Nebo ne, ať je to zajímavější.'); }
    const tempo = t < 30 ? 1.45 : t < 120 ? 1.25 : 1;
    if (tempo !== this.tempo) { this.tempo = tempo; Sound.setTempo(tempo); }
    if (t < 30 && Math.ceil(t) !== this.lastTick) { this.lastTick = Math.ceil(t); Sound.sfx.tick(); }
  },

  updateYearCard(dt) {
    const yc = this.yearcard;
    yc.t += dt;
    if (!yc.didSetup && yc.t > 0.4) { yc.didSetup = true; if (yc.setup) yc.setup(); }
    if (yc.t > 3.6 || (yc.t > 1.2 && Input.confirm())) {
      Input.consume('e', ' ', 'enter');
      if (!yc.didSetup && yc.setup) yc.setup();
      this.mode = 'play'; this.yearcard = null;
      if (yc.done) yc.done();
    }
  },

  updateFx(dt) {
    for (const p of this.parts) {
      p.life -= dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.conf) { p.vx *= 0.985; p.spin += dt * 10; }
    }
    this.parts = this.parts.filter(p => p.life > 0);
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.4);
    if (this.shakeT > 0) { this.shakeT -= dt; if (this.shakeT <= 0) this.shakeMag = 0; }
    if (this.flashT > 0) this.flashT -= dt;
  },

  updateWorld(dt) {
    const p = this.player;
    for (const n of this.npcs) n.t += dt;
    if (p.inv > 0) p.inv -= dt;
    if (Dialogue.active) { p.moving = false; return; }

    // EduPage okna: E je zavírá
    if (this.popups.length && Input.confirm()) { Input.consume('e', ' ', 'enter'); this.closePopup(); }

    this.updatePlayer(dt);
    this.updateNpcs(dt);
    this.updateGlitchMission(dt);
    Director.updateHazards(dt);
    if (Dialogue.active) return;

    // vstup do místnosti
    const r = World.roomAt(p.x, p.y);
    if (r !== this.room) { this.room = r; if (r !== 'door') Story.onEnterRoom(r); }
    if (Dialogue.active || this.mode !== 'play') return;

    // interakce
    this.focus = this.popups.length ? null : this.findFocus();
    if (this.focus && Input.confirm()) {
      Input.consume('e', ' ', 'enter');
      const f = this.focus;
      if (f.kind === 'npc') { const n = f.ref; n.dir = this.faceDir(n, p); Story.talk(n); }
      else if (f.kind === 'glitch') Dialogue.start(f.ref.msg, () => this.glitchFixed(f.ref));
      else if (f.kind === 'thing') Story.inspect(f.ref.id);
    }
  },

  faceDir(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  },

  updatePlayer(dt) {
    const p = this.player, v = this.readMove();
    let sp = v.run ? 120 : 80;
    if (this.slowT > 0) sp *= 0.5;
    const mx = v.x * sp * dt + p.kx * dt, my = v.y * sp * dt + p.ky * dt;
    const k = Math.pow(0.02, dt); p.kx *= k; p.ky *= k;
    if (Math.abs(p.kx) < 5) p.kx = 0; if (Math.abs(p.ky) < 5) p.ky = 0;
    let blocked = false;
    if (mx) { if (!World.rectSolid(p.x + mx - 5, p.y - 5, 10, 6)) p.x += mx; else { blocked = blocked || !!v.x; p.kx = 0; } }
    if (my) { if (!World.rectSolid(p.x - 5, p.y + my - 5, 10, 6)) p.y += my; else { blocked = blocked || !!v.y; p.ky = 0; } }
    // NPC nejsou průchozí
    for (const n of this.npcs) {
      const dx = p.x - n.x, dy = p.y - n.y, d = Math.hypot(dx, dy);
      if (d < 9 && d > 0.01) {
        const nx = n.x + dx / d * 9, ny = n.y + dy / d * 9;
        if (!World.rectSolid(nx - 5, ny - 5, 10, 6)) { p.x = nx; p.y = ny; }
      }
    }
    p.moving = !!(v.x || v.y);
    if (p.moving) {
      p.dir = Math.abs(v.x) > Math.abs(v.y) ? (v.x < 0 ? 'left' : 'right') : (v.y < 0 ? 'up' : 'down');
      p.anim += dt * (v.run ? 11 : 8);
      p.stepT -= dt; if (p.stepT <= 0) { p.stepT = v.run ? 0.22 : 0.3; Sound.sfx.step(); }
      this.idleT = 0;
    } else { p.anim = 0; this.idleT += dt; }
    if (this.idleT > 20 && Achievements.unlock('aktivni')) Director.say('Stojíš 20 sekund. Učitelé tomu říkají „aktivní účast“.');
    // náraz do zdi
    if (blocked && !p.bump) {
      p.bump = true; this.stats.bumps++;
      if (this.stats.bumps === 5 && Achievements.unlock('architektura')) Director.say('Zdi jsou pevné. Ověřeno tebou. Pětkrát.');
    }
    if (!blocked) p.bump = false;
  },

  updateNpcs(dt) {
    const p = this.player;
    for (const n of this.npcs) {
      const d = U.dist(n.x, n.y, p.x, p.y);
      n.moving = false;
      if (n.stun > 0) n.stun -= dt;
      if (n.beh === 'wander') {
        if (d < 30) { n.dir = this.faceDir(n, p); continue; }
        n.wt -= dt;
        if (n.wt <= 0) {
          n.wt = U.rand(0.8, 2.4);
          if (Math.random() < 0.35) { n.vx = 0; n.vy = 0; }
          else { const a = U.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); n.vx = a[0] * 34; n.vy = a[1] * 34; }
        }
        if (n.vx || n.vy) {
          const nx = n.x + n.vx * dt, ny = n.y + n.vy * dt, ar = n.area;
          if (ar && (nx < ar.x0 || nx > ar.x1 || ny < ar.y0 || ny > ar.y1) || World.rectSolid(nx - 5, ny - 5, 10, 6)) { n.vx *= -1; n.vy *= -1; }
          else { n.x = nx; n.y = ny; n.moving = true; n.anim += dt * 7; }
          n.dir = Math.abs(n.vx) > Math.abs(n.vy) ? (n.vx < 0 ? 'left' : 'right') : (n.vy < 0 ? 'up' : 'down');
        }
      } else if (n.beh === 'pester') {
        if (n.stun > 0 || d > 150 || this.immuneT > 0) { if (d < 40) n.dir = this.faceDir(n, p); continue; }
        const dx = p.x - n.x, dy = p.y - n.y, dd = d || 1, s = 30 * dt;
        if (!World.rectSolid(n.x + dx / dd * s - 5, n.y - 5, 10, 6)) n.x += dx / dd * s;
        if (!World.rectSolid(n.x - 5, n.y + dy / dd * s - 5, 10, 6)) n.y += dy / dd * s;
        n.dir = this.faceDir(n, p); n.moving = true; n.anim += dt * 6;
        if (d < 13) {
          n.stun = 6;
          this.damage(3, p.x, p.y - 30, false, 'Máš chvilku? −3 s');
          Achievements.unlock('chvilka');
          const dx2 = p.x - n.x, dy2 = p.y - n.y, d2 = Math.hypot(dx2, dy2) || 1; p.kx = dx2 / d2 * 140; p.ky = dy2 / d2 * 140;
        }
      } else if (d < 44) n.dir = this.faceDir(n, p);
    }
  },

  updateGlitchMission(dt) {
    const gm = this.glitchMission;
    if (!gm) return;
    const m = gm.objs.find(o => o.id === 'moon');
    if (m && !m.fixed) {
      m.t = (m.t || 0) + dt;
      m.x = Story.TX(38) + Math.sin(m.t * 0.6) * 64;
      m.dir = Math.cos(m.t * 0.6) > 0 ? 'left' : 'right'; // pozpátku!
    }
    if (Math.random() < dt * 0.25) { this.glitchT = 0.25; }
  },

  findFocus() {
    const p = this.player, dv = DIRV[p.dir];
    const fx = p.x + dv[0] * 12, fy = p.y - 4 + dv[1] * 12;
    let best = null, bd = 1e9;
    if (this.glitchMission) for (const o of this.glitchMission.objs) {
      if (o.fixed) continue;
      const d = Math.min(U.dist(fx, fy, o.x, o.y - 6), U.dist(p.x, p.y, o.x, o.y));
      if (d < 22 && d < bd) { bd = d; best = { kind: 'glitch', ref: o, x: o.x, y: o.y - 34 }; }
    }
    if (best) return best;
    for (const n of this.npcs) {
      const d = Math.min(U.dist(fx, fy, n.x, n.y - 6), U.dist(p.x, p.y, n.x, n.y) + 4);
      if (d < 20 && d < bd) { bd = d; best = { kind: 'npc', ref: n, x: n.x, y: n.y - 30 }; }
    }
    if (best) return best;
    for (const it of World.interactables) {
      const pad = it.wall ? 10 : 6;
      if (fx >= it.x - pad && fx <= it.x + it.w + pad && fy >= it.y - pad && fy <= it.y + it.h + pad) {
        return { kind: 'thing', ref: it, x: U.clamp(fx, it.x + 6, it.x + it.w - 6), y: it.y - 6 };
      }
    }
    return null;
  },

  // -----------------------------------------------------------
  //  DRAW
  // -----------------------------------------------------------
  draw() {
    const ctx = this.ctx, gt = this.t;
    ctx.setTransform(RS.s, 0, 0, RS.s, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(0, 0, 480, 270);
    if (!this.worldReady) { U.text(ctx, 'NAČÍTÁM INFIS…', 240, 130, { size: 14, align: 'center' }); return; }

    if (this.mode === 'menu') { this.drawMenuBg(ctx, gt); this.drawParticles(ctx, true); return; }

    let sx = 0, sy = 0;
    if (this.shakeT > 0) { sx = Math.round(U.rand(-1, 1) * this.shakeMag); sy = Math.round(U.rand(-1, 1) * this.shakeMag); }
    ctx.save(); ctx.translate(sx, sy);
    if (this.mode === 'arena' || (this.mode === 'victory' && Arena.def)) Arena.draw(ctx, gt);
    else this.drawWorld(ctx, gt);
    this.drawParticles(ctx, true);
    this.drawFloats(ctx, true);
    ctx.restore();

    this.drawScreenFx(ctx, gt);
    if (this.mode !== 'yearcard') this.drawHUD(ctx, gt);
    if (this.popups.length) this.drawPopups(ctx);
    if (this.banner) this.drawBanner(ctx);
    if (this.bigTitle) this.drawBigTitle(ctx, gt);
    Director.draw(ctx, gt);
    Dialogue.draw(ctx, gt);
    Achievements.draw(ctx, gt);
    if (this.mode === 'yearcard') this.drawYearCard(ctx, gt);
    if (this.fadeT > 0) { ctx.fillStyle = `rgba(6,4,12,${Math.min(1, this.fadeT / 0.35)})`; ctx.fillRect(0, 0, 480, 270); }
    if (this.flashT > 0) { ctx.globalAlpha = Math.max(0, this.flashT / this.flashMax) * 0.5; ctx.fillStyle = this.flashCol; ctx.fillRect(0, 0, 480, 270); ctx.globalAlpha = 1; }
  },

  // plynulá kamera (při teleportu skočí rovnou)
  camera() {
    const p = this.player;
    const tx = U.clamp(p.x - 240, 0, World.pxW - 480), ty = U.clamp(p.y - 150, 0, World.pxH - 270);
    const f = this.camF || (this.camF = { x: tx, y: ty });
    if (Math.abs(tx - f.x) > 160 || Math.abs(ty - f.y) > 120) { f.x = tx; f.y = ty; }
    else { f.x += (tx - f.x) * 0.16; f.y += (ty - f.y) * 0.16; }
    this.cam.x = Math.round(f.x * RS.s) / RS.s; this.cam.y = Math.round(f.y * RS.s) / RS.s;
    return this.cam;
  },

  drawWorld(ctx, gt) {
    const cam = this.camera(), p = this.player;
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    World.draw(ctx, cam.x, cam.y);
    World.drawDynamic(ctx, gt, this.year);

    // glitchnuté objekty
    const gm = this.glitchMission;
    if (gm) {
      for (let i = 0; i < 10; i++) {
        if (Math.random() < 0.3) { ctx.fillStyle = U.pick(['rgba(255,0,80,0.25)', 'rgba(0,255,200,0.25)', 'rgba(80,80,255,0.25)']); ctx.fillRect(cam.x + U.rand(0, 470), cam.y + U.rand(20, 260), U.rand(8, 40), U.rand(2, 6)); }
      }
      if ((gt * 2 | 0) % 3 === 0) U.text(ctx, U.pick(['NaN', 'undefined', 'null', '¿?', '0xDEAD']), cam.x + 60 + (gt * 37 % 360), cam.y + 60 + (gt * 53 % 160), { size: 9, color: '#ff4a8a' });
      const v = gm.objs.find(o => o.id === 'vending');
      if (v && !v.fixed) Sprites.glitchPC(ctx, v.x, v.y - 2, gt);
      const dr = gm.objs.find(o => o.id === 'door');
      if (dr && !dr.fixed) Sprites.door(ctx, dr.x, dr.y, gt);
    }

    // entity seřazené podle Y
    const ents = this.npcs.map(n => ({ y: n.y, draw: () => Sprites.draw(ctx, n.id, n.x, n.y + (n.moving ? 0 : (Math.sin(n.t * 2.4) > 0.6 ? -0 : 0)), n.dir, n.moving ? [1, 0, 2, 0][(n.anim | 0) % 4] : 0) }));
    if (gm) { const m = gm.objs.find(o => o.id === 'moon'); if (m && !m.fixed) ents.push({ y: m.y, draw: () => { Sprites.draw(ctx, 'kuba', m.x, m.y, m.dir, [1, 0, 2, 0][((m.t || 0) * 7 | 0) % 4]); U.text(ctx, '↺', m.x + 9, m.y - 30, { size: 10, color: '#ff4a8a' }); } }); }
    ents.push({ y: p.y, draw: () => { if (!(p.inv > 0 && ((gt * 18) | 0) % 2)) Sprites.draw(ctx, 'player', p.x, p.y, p.dir, p.moving ? [1, 0, 2, 0][(p.anim | 0) % 4] : 0); } });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    if (this.slowT > 0) U.text(ctx, 'BUFFERING…', p.x, p.y - 36, { size: 8, align: 'center', color: '#7fdcff' });
    if (this.immuneT > 0) { ctx.globalAlpha = 0.3 + Math.sin(gt * 8) * 0.15; ctx.fillStyle = '#4aa3ff'; ctx.fillRect(p.x - 9, p.y - 26, 18, 28); ctx.globalAlpha = 1; }

    Director.drawHazards(ctx, gt);
    Lighting.draw(ctx, cam, gt);

    // značky misí (!)
    for (const o of this.objectives) {
      if (o.done || !o.npc) continue;
      const n = this.npcs.find(q => q.id === o.npc);
      if (!n) continue;
      const b = Math.round(Math.sin(gt * 4) * 1.5), y = n.y - 40 + b;
      ctx.fillStyle = 'rgba(255,211,77,0.25)'; ctx.fillRect(n.x - 5, y - 1, 10, 13);
      U.pill(ctx, n.x - 4, y, 8, 11, '#ffd34d');
      U.text(ctx, '!', n.x, y + 1, { size: 11, font: 'bold', align: 'center', color: '#1a1322', outline: false });
    }
    if (this.glitchMission) for (const o of this.glitchMission.objs) if (!o.fixed) {
      const y = o.y - 48 + Math.sin(gt * 6) * 1.5;
      U.pill(ctx, o.x - 10, y, 20, 9, '#ff4a8a');
      U.text(ctx, 'BUG', o.x, y + 0.5, { size: 8, font: 'bold', align: 'center', color: '#1a0a14', outline: false });
    }

    // nápověda E
    if (this.focus && !Dialogue.active) {
      const f = this.focus, b = Math.round(Math.sin(gt * 5) * 1);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(f.x - 5, f.y - 9 + b, 11, 11);
      U.pill(ctx, f.x - 6, f.y - 12 + b, 12, 12, '#f4f0ff');
      ctx.fillStyle = '#b8b0cc'; ctx.fillRect(f.x - 4, f.y - 1 + b, 8, 1);
      U.text(ctx, 'E', f.x, f.y - 11 + b, { size: 10, font: 'bold', align: 'center', color: '#1a1322', outline: false });
    }
    this.drawParticles(ctx, false);
    this.drawFloats(ctx, false);
    ctx.restore();
  },

  drawParticles(ctx, screen) {
    for (const p of this.parts) {
      if (p.screen !== screen) continue;
      ctx.globalAlpha = U.clamp(p.life / 0.4, 0, 1);
      ctx.fillStyle = p.col;
      if (p.conf) { const w = Math.abs(Math.cos(p.spin)) * 3 + 1; ctx.fillRect(p.x, p.y, w, 2); }
      else ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  },
  drawFloats(ctx, screen) {
    for (const f of this.floats) {
      if (f.screen !== screen) continue;
      const a = f.t < 1 ? 1 : 1 - (f.t - 1) / 0.4;
      U.text(ctx, f.text, f.x, f.y - f.t * 16, { size: 11, align: 'center', color: f.col, alpha: Math.max(0, a), ow: 1 });
    }
  },

  drawScreenFx(ctx, gt) {
    if (this.mode === 'play' || this.mode === 'arena') Lighting.vignette(ctx, this.mode === 'play' ? 0.3 : 0.22);
    // hrad (metafora)
    if (this.castleT > 0) {
      const a = Math.min(1, this.castleT / 0.4, (2.8 - this.castleT) / 0.3);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(120,80,30,0.35)'; ctx.fillRect(0, 0, 480, 270);
      for (let x = 0; x < 480; x += 24) { Sprites.R(ctx, x, 20, 14, 12, '#7d7d86'); Sprites.R(ctx, x, 238, 14, 12, '#7d7d86'); }
      Sprites.R(ctx, 0, 30, 480, 8, '#6b6b74'); Sprites.R(ctx, 0, 248, 480, 22, '#6b6b74');
      for (let x = 0; x < 480; x += 16) { Sprites.R(ctx, x, 250 + (x / 16 % 2) * 6, 15, 5, '#5a5a62'); }
      for (const fx of [60, 420]) { Sprites.R(ctx, fx, 40, 2, 40, '#3a2a1a'); Sprites.R(ctx, fx + 2, 40, 22, 14, '#b0242c'); Sprites.R(ctx, fx + 8, 44, 8, 6, '#ffd23f'); }
      U.text(ctx, '~ ŠKOLA JE HRAD ~', 240, 110, { size: 22, font: 'Silkscreen', align: 'center', color: '#ffd84a', ow: 1.2 });
      U.text(ctx, '(metafora se právě stala realitou)', 240, 140, { size: 12, align: 'center', color: '#ffffff', ow: 1 });
      ctx.globalAlpha = 1;
    }
    // WiFi glitch / ostatní glitche
    if (this.glitchT > 0) {
      const cv = this.canvas;
      for (let i = 0; i < 6; i++) {
        const y = U.randi(0, 260), h = U.randi(3, 16), off = U.randi(-14, 14);
        ctx.drawImage(cv, 0, y * RS.s, 480 * RS.s, h * RS.s, off, y, 480, h);
      }
      ctx.fillStyle = U.pick(['rgba(255,0,80,0.08)', 'rgba(0,255,200,0.08)', 'rgba(80,80,255,0.1)']); ctx.fillRect(0, 0, 480, 270);
      if (this.slowT > 0) {
        U.panel(ctx, 140, 96, 200, 34, { border: '#7fdcff' });
        U.text(ctx, 'WI-FI: INFIS-GUEST', 240, 99, { size: 10, font: 'Silkscreen', align: 'center', color: '#7fdcff', outline: false });
        U.text(ctx, 'Připojeno, bez internetu', 240, 113, { size: 11, align: 'center', color: '#fff', outline: false });
      }
    }
    // Olga — blikání světel
    if (this.flickerT > 0) { if (Math.random() < 0.6) { ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 480, 270); } }
    // 4. ročník — rudý alarm
    if (this.mode === 'play' && this.year === 4) {
      ctx.fillStyle = `rgba(255,0,0,${0.04 + Math.max(0, Math.sin(gt * 3)) * 0.05})`; ctx.fillRect(0, 0, 480, 270);
    }
    // málo času — červená vinětace
    if (this.timerOn && this.time < 60 && (this.mode === 'play' || this.mode === 'arena')) {
      const k = this.time < 30 ? 0.55 : 0.35, pulse = 0.6 + Math.sin(gt * (this.time < 30 ? 9 : 5)) * 0.4;
      const g = ctx.createRadialGradient(240, 135, 120, 240, 135, 300);
      g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(220,0,0,${k * pulse})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 270);
    }
    // bonus — letící hodiny
    if (this.bonusFx > 0) {
      const k = 1 - this.bonusFx / 1.6;
      Sprites.drawArt(ctx, 'clock', U.lerp(60, 240, k), U.lerp(230, 12, k) - Math.sin(k * Math.PI) * 40, 2);
    }
  },

  drawHUD(ctx, gt) {
    if (this.mode === 'gameover' || this.mode === 'victory') return;
    const grd = ctx.createLinearGradient(0, 0, 0, 44);
    grd.addColorStop(0, 'rgba(6,4,12,0.75)'); grd.addColorStop(1, 'rgba(6,4,12,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 480, 44);
    const Y = Story.YEARS[this.year], ACC = '#ffd34d';
    // vlevo: ročník
    U.text(ctx, Y.title, 10, 7, { size: 11, font: 'bold', color: '#ffffff' });
    if (this.mode === 'play') U.text(ctx, Y.sub, 10, 19, { size: 7.5, color: '#a89fc2', ls: 0.6 });
    // uprostřed: časovač
    const t = this.time;
    let col = '#ffffff';
    if (t < 300) col = '#ffe7a0';
    if (t < 120) col = '#ffb45a';
    if (t < 60) col = (gt * 4 | 0) % 2 ? '#ff4d5e' : '#ffffff';
    const pulse = this.timerPulse > 0 ? 1 + Math.sin(this.timerPulse * 12) * 0.1 : (t < 30 ? 1 + Math.abs(Math.sin(gt * Math.PI)) * 0.1 : 1);
    ctx.save(); ctx.translate(240, 13); ctx.scale(pulse, pulse);
    U.text(ctx, U.fmtTime(t), 0, -10, { size: 20, font: 'bold', align: 'center', color: col });
    ctx.restore();
    U.text(ctx, this.timerOn || this.mode !== 'play' ? 'DO MATURITY' : 'ČAS ZATÍM STOJÍ', 240, 25, { size: 6.5, align: 'center', color: '#8d84a8', outline: false, ls: 1.2 });
    // průběh: 4 ročníky + maturita
    for (let i = 0; i < 5 && this.mode === 'play'; i++) {
      const x = 240 - 31 + i * 12.5, done = i < this.year - 1 || (i === 4 && this.flags.final && this.mode === 'victory');
      const cur = (i === this.year - 1 && !this.flags.final) || (i === 4 && this.flags.final);
      ctx.fillStyle = done ? 'rgba(255,255,255,0.85)' : cur ? `rgba(255,211,77,${0.6 + Math.sin(gt * 4) * 0.3})` : 'rgba(255,255,255,0.16)';
      ctx.fillRect(x, 34, 11, 1.5);
    }

    if (this.mode !== 'play') return;
    // vpravo: úkoly
    const list = this.objectives;
    ctx.font = U.font(9);
    let maxW = 40; for (const o of list) maxW = Math.max(maxW, ctx.measureText((o.sub && o.sub()) || o.text).width);
    const w = Math.round(U.clamp(maxW + 26, 110, 220)), x = 480 - w - 8, y = 8;
    const done = list.filter(o => o.done && !o.optional).length, req = list.filter(o => !o.optional).length;
    U.panel(ctx, x, y, w, 17 + list.length * 11, { bg: 'rgba(12,9,22,0.72)' });
    U.text(ctx, 'ÚKOLY', x + 8, y + 4, { size: 6.5, color: '#8d84a8', outline: false, ls: 1.2 });
    U.text(ctx, `${done}/${req}`, x + w - 8, y + 4, { size: 6.5, align: 'right', color: ACC, outline: false });
    list.forEach((o, i) => {
      const yy = y + 14 + i * 11;
      const txt = (o.sub && o.sub()) || o.text;
      if (o.done) {
        ctx.fillStyle = '#49e08a'; ctx.fillRect(x + 8, yy + 3.5, 5, 5);
        ctx.fillStyle = '#0c0916'; ctx.fillRect(x + 9, yy + 5.5, 1, 1); ctx.fillRect(x + 10, yy + 6.5, 1, 1); ctx.fillRect(x + 11, yy + 4.5, 1, 2);
      } else {
        ctx.fillStyle = o.optional ? 'rgba(255,255,255,0.25)' : ACC;
        ctx.fillRect(x + 8, yy + 3.5, 5, 1); ctx.fillRect(x + 8, yy + 7.5, 5, 1); ctx.fillRect(x + 8, yy + 3.5, 1, 5); ctx.fillRect(x + 12, yy + 3.5, 1, 5);
      }
      U.text(ctx, txt, x + 18, yy + 1, { size: 9, color: o.done ? '#6d6585' : o.optional ? '#8d84a8' : '#f4f0ff', outline: false });
      if (o.done) { ctx.font = U.font(9); ctx.fillStyle = '#6d6585'; ctx.fillRect(x + 18, yy + 6, Math.min(w - 26, ctx.measureText(txt).width), 0.75); }
    });
    U.text(ctx, 'Esc · pauza', 472, 261, { size: 6.5, align: 'right', color: 'rgba(255,255,255,0.35)', outline: false });
    this.drawObjectiveArrow(ctx, gt);
  },

  drawObjectiveArrow(ctx, gt) {
    const p = this.player, cam = this.cam;
    let target = null, bd = 1e9;
    const pts = [];
    if (this.glitchMission) this.glitchMission.objs.filter(o => !o.fixed).forEach(o => pts.push({ x: o.x, y: o.y - 8 }));
    else for (const o of this.objectives) {
      if (o.done || o.optional || !o.target) continue;
      const tp = o.target(); if (tp) pts.push(tp);
    }
    for (const q of pts) { const d = U.dist(p.x, p.y, q.x, q.y); if (d < bd) { bd = d; target = q; } }
    if (!target) return;
    const sx = target.x - cam.x, sy = target.y - cam.y;
    if (sx > 10 && sx < 470 && sy > 30 && sy < 250) return;
    const cx = 240, cy = 140, dx = sx - cx, dy = sy - cy, a = Math.atan2(dy, dx);
    const k = Math.min((dx > 0 ? 455 - cx : cx - 25) / Math.abs(dx || 1e-6), (dy > 0 ? 240 - cy : cy - 34) / Math.abs(dy || 1e-6));
    const ax = cx + dx * k, ay = cy + dy * k, b = Math.sin(gt * 6) * 2;
    ctx.save(); ctx.translate(ax + Math.cos(a) * b, ay + Math.sin(a) * b); ctx.rotate(a);
    ctx.fillStyle = Sprites.OUT; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -8); ctx.lineTo(-3, 0); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -6); ctx.lineTo(-2, 0); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  },

  drawPopups(ctx) {
    this.popups.forEach((pp, i) => {
      const x = pp.x, y = pp.y, w = 200, h = 64, top = i === this.popups.length - 1;
      Sprites.R(ctx, x + 3, y + 3, w, h, 'rgba(0,0,0,0.4)');
      Sprites.R(ctx, x, y, w, h, '#c0c0c0'); Sprites.R(ctx, x, y, w, 1, '#ffffff'); Sprites.R(ctx, x, y, 1, h, '#ffffff');
      Sprites.R(ctx, x + 2, y + 2, w - 4, 11, top ? '#1b3fa8' : '#7a7a8a');
      U.text(ctx, 'EduPage — Upozornění', x + 5, y + 2, { size: 9, color: '#fff', outline: false });
      Sprites.R(ctx, x + w - 12, y + 3, 9, 9, '#c0c0c0'); U.text(ctx, 'x', x + w - 7.5, y + 2, { size: 9, align: 'center', color: '#000', outline: false });
      U.wrap(ctx, pp.text, w - 16, 10).slice(0, 2).forEach((ln, j) => U.text(ctx, ln, x + 8, y + 17 + j * 11, { size: 10, color: '#111', outline: false }));
      Sprites.R(ctx, x + w / 2 - 22, y + h - 16, 44, 12, '#d4d4d4'); Sprites.R(ctx, x + w / 2 - 22, y + h - 16, 44, 1, '#fff');
      U.text(ctx, top ? '[E] OK' : 'OK', x + w / 2, y + h - 16, { size: 9, align: 'center', color: '#000', outline: false });
    });
  },

  drawBanner(ctx) {
    const b = this.banner, k = Math.min(1, b.t / 0.3), a = b.t > b.dur - 0.4 ? (b.dur - b.t) / 0.4 : 1;
    ctx.globalAlpha = Math.max(0, a);
    const gr = ctx.createLinearGradient(0, 92, 0, 152);
    gr.addColorStop(0, 'rgba(6,4,12,0)'); gr.addColorStop(0.5, 'rgba(6,4,12,0.7)'); gr.addColorStop(1, 'rgba(6,4,12,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 92, 480, 60);
    const e = 1 - Math.pow(1 - k, 3);
    U.text(ctx, b.title, 240, 104 + (1 - e) * 6, { size: 22, font: 'bold', align: 'center', color: '#49e08a', ls: 1 });
    ctx.fillStyle = 'rgba(73,224,138,0.6)'; ctx.fillRect(240 - 70 * e, 129, 140 * e, 0.75);
    if (b.sub) U.text(ctx, b.sub, 240, 133, { size: 9, align: 'center', color: '#c8c0dc', ls: 0.8 });
    ctx.globalAlpha = 1;
  },

  drawBigTitle(ctx, gt) {
    const b = this.bigTitle, k = Math.min(1, b.t / 0.4);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 480, 38 * k); ctx.fillRect(0, 270 - 38 * k, 480, 38 * k);
    ctx.fillStyle = `rgba(0,0,0,${0.55 * k})`; ctx.fillRect(0, 100, 480, 60);
    const j = Math.round(U.rand(-0.6, 0.6));
    U.text(ctx, 'TAJNÝ BOSS', 240, 108, { size: 7, align: 'center', color: '#ff8a96', outline: false, ls: 3 });
    U.text(ctx, b.text, 240 + j, 120, { size: 16, font: 'bold', align: 'center', color: '#ff4d5e', ls: 1 });
  },

  drawYearCard(ctx, gt) {
    const yc = this.yearcard, t = yc.t, Y = Story.YEARS[yc.y];
    const a = Math.min(1, t / 0.35) * (t > 3.25 ? Math.max(0, 1 - (t - 3.25) / 0.35) : 1);
    ctx.fillStyle = `rgba(8,6,14,${a})`; ctx.fillRect(0, 0, 480, 270);
    if (a < 0.6) return;
    ctx.globalAlpha = Math.min(1, (a - 0.6) / 0.4);
    const e = 1 - Math.pow(1 - U.clamp((t - 0.3) / 0.6, 0, 1), 3);
    U.text(ctx, `ROČNÍK ${yc.y} / 4`, 240, 82, { size: 7, align: 'center', color: '#8d84a8', outline: false, ls: 3 });
    U.text(ctx, Y.title, 240, 94 + (1 - e) * 8, { size: 34, font: 'bold', align: 'center', color: '#ffffff', outline: false, ls: 2 });
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(240 - 50 * e, 132, 100 * e, 1);
    const subLen = Math.floor(U.clamp((t - 0.7) * 34, 0, Y.sub.length));
    U.text(ctx, Y.sub.slice(0, subLen), 240, 140, { size: 11, align: 'center', color: '#ffd34d', outline: false, ls: 2 });
    if (t > 1.5) U.text(ctx, Y.note, 240, 162, { size: 8.5, align: 'center', color: '#8d84a8', outline: false });
    const px = -20 + ((t * 130) % 520);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, 236, 480, 0.75);
    Sprites.draw(ctx, 'player', px, 236, 'right', [1, 0, 2, 0][(t * 10 | 0) % 4], 1);
    if (t > 1.2) U.text(ctx, 'E  pokračovat', 470, 252, { size: 7, align: 'right', color: 'rgba(255,255,255,0.4)', outline: false, ls: 1 });
    ctx.globalAlpha = 1;
  },

  drawMenuBg(ctx, gt) {
    const range = World.pxW - 480;
    const camX = Math.round(range * 0.45 + Math.sin(gt * 0.05) * range * 0.4), camY = 33 * 16 - 150;
    ctx.save(); ctx.translate(-camX, -camY);
    World.draw(ctx, camX, camY);
    const walkers = ['hojer', 'prynych', 'batkova', 'novak', 'janda', 'ladman', 'horvath', 'nagr'];
    walkers.forEach((id, i) => {
      const sp = 18 + i * 2.5, dir = i % 2 ? 1 : -1, span = World.pxW + 80;
      const x = ((gt * sp * dir + i * 137) % span + span) % span - 40;
      const y = (38.5 + (i % 3) * 1.4) * 16;
      Sprites.draw(ctx, id, x, y, dir > 0 ? 'right' : 'left', [1, 0, 2, 0][(gt * 6 + i | 0) % 4]);
    });
    Lighting.draw(ctx, { x: camX, y: camY }, gt);
    ctx.restore();
    Lighting.vignette(ctx, 0.5);
    // MATURITRON jako "key art" vpravo
    const bob = Math.sin(gt * 1.2) * 2;
    const glow = ctx.createRadialGradient(390, 150, 4, 390, 150, 90);
    glow.addColorStop(0, 'rgba(255,60,80,0.28)'); glow.addColorStop(1, 'rgba(255,60,80,0)');
    ctx.fillStyle = glow; ctx.fillRect(290, 50, 200, 200);
    Sprites.maturitron(ctx, 352, 112 + bob, 3.2, gt, 'normal', (gt * 0.5 | 0) % 3 === 0);
    if ((gt * 0.5 | 0) % 3 === 0) Sprites.bubble(ctx, 392, 92 + bob, 'Ani to nezkoušej.', 9, '#b00020');
  },
};

// =============================================================
//  UI — HTML menu (hlavní menu, pauza, nastavení, konec hry)
// =============================================================
const UI = {
  returnTo: null,
  init() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-action]');
      if (!b) return;
      Sound.unlock(); Sound.sfx.select();
      this.action(b.dataset.action);
    });
    // myš nad tlačítkem = výběr (aby nebyly zvýrazněné dvě položky najednou)
    document.addEventListener('mouseover', (e) => { const b = e.target.closest && e.target.closest('.overlay button'); if (b && document.activeElement !== b) b.focus({ preventScroll: true }); });
    const menuMusic = () => { if (Game.mode === 'menu') { Sound.unlock(); Sound.playMusic('menu'); } };
    document.addEventListener('pointerdown', menuMusic);
    document.addEventListener('keydown', menuMusic);
    document.addEventListener('keydown', (e) => {
      const ov = this.visible();
      if (!ov) return;
      const btns = [...ov.querySelectorAll('button:not([disabled])')].filter(b => b.offsetParent !== null);
      if (!btns.length) return;
      const k = e.key.toLowerCase();
      let i = btns.indexOf(document.activeElement);
      if (k === 'arrowdown' || k === 's' || k === 'arrowright') { e.preventDefault(); btns[(i + 1 + btns.length) % btns.length].focus(); Sound.unlock(); Sound.sfx.move(); }
      if (k === 'arrowup' || k === 'w' || k === 'arrowleft') { e.preventDefault(); btns[(i - 1 + btns.length * 2) % btns.length].focus(); Sound.unlock(); Sound.sfx.move(); }
      if (k === 'e') { e.preventDefault(); (i >= 0 ? btns[i] : btns[0]).click(); }
    });
    this.refreshSettings();
    this.initTouch();
  },
  // Dotyková tlačítka pro mobil — simulují klávesy
  initTouch() {
    const touch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    const el = document.getElementById('touch');
    if (!touch || !el) return;
    el.classList.remove('hidden');
    el.querySelectorAll('button[data-key]').forEach(b => {
      const k = b.dataset.key;
      const down = (e) => {
        e.preventDefault(); Sound.unlock(); b.classList.add('on');
        if (k === 'escape') { Game.onKey({}, 'escape'); return; }
        if (!Input.down.has(k)) Input.pressed.add(k);
        Input.down.add(k);
      };
      const up = (e) => { e.preventDefault(); b.classList.remove('on'); Input.down.delete(k); };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    });
  },
  visible() { return document.querySelector('.overlay:not(.hidden)'); },
  show(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    if (!id) { if (document.activeElement) document.activeElement.blur(); return; }
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    const b = el.querySelector('button:not([disabled])');
    if (b) setTimeout(() => b.focus(), 30);
    if (id === 'menu') this.refreshStatus();
  },
  back() {
    const v = this.visible();
    if (!v) return;
    if (v.id === 'howto' || v.id === 'settings') this.show(this.returnTo || 'menu');
    else if (v.id === 'pause') Game.resume();
  },
  action(a) {
    switch (a) {
      case 'start': Game.newGame(); break;
      case 'howto': this.returnTo = Game.paused ? 'pause' : 'menu'; this.show('howto'); break;
      case 'settings': this.returnTo = Game.paused ? 'pause' : 'menu'; this.show('settings'); break;
      case 'back': this.show(this.returnTo || 'menu'); break;
      case 'resume': Game.resume(); break;
      case 'restart': Game.newGame(); break;
      case 'menu': World.render(4); Game.mode = 'menu'; Game.paused = false; Dialogue.reset(); Arena.active = false; Sound.playMusic('menu'); this.show('menu'); break;
      case 'toggle-sfx': Game.settings.sfx = !Game.settings.sfx; Sound.setSfx(Game.settings.sfx); this.saveSettings(); break;
      case 'toggle-music': Game.settings.music = !Game.settings.music; Sound.setMusic(Game.settings.music); this.saveSettings(); break;
      case 'toggle-voice': Game.settings.voice = !Game.settings.voice; Voice.enabled = Game.settings.voice; this.saveSettings(); break;
      case 'toggle-shake': Game.settings.shake = !Game.settings.shake; this.saveSettings(); break;
      case 'toggle-slow': Game.settings.slowReader = !Game.settings.slowReader; this.saveSettings(); break;
      case 'mute': Game.settings.sfx = Game.settings.music = Game.settings.voice = !(Game.settings.sfx || Game.settings.music); Sound.setSfx(Game.settings.sfx); Sound.setMusic(Game.settings.music); Voice.enabled = Game.settings.voice; this.saveSettings(); break;
      case 'university': this.university(); break;
      case 'credits': this.victoryStage('v-credits'); break;
    }
  },
  saveSettings() { Store.set('infis_settings', Game.settings); this.refreshSettings(); },
  refreshSettings() {
    const s = Game.settings, on = v => (v ? 'zap' : 'vyp');
    const set = (sel, txt) => document.querySelectorAll(sel).forEach(b => { b.textContent = txt; });
    set('[data-action="toggle-sfx"]', 'Zvukové efekty: ' + on(s.sfx));
    set('[data-action="toggle-music"]', 'Hudba: ' + on(s.music));
    set('[data-action="toggle-voice"]', 'Hlas MATURITRONA: ' + on(s.voice));
    set('[data-action="toggle-shake"]', 'Třesení obrazovky: ' + on(s.shake));
    set('[data-action="toggle-slow"]', 'Čas stojí při dialozích: ' + on(s.slowReader));
    set('[data-action="mute"]', (s.sfx || s.music) ? 'Ztlumit zvuk' : 'Zapnout zvuk');
  },
  refreshStatus() {
    const ai = Director.ai, el = document.getElementById('ai-status');
    if (el) {
      if (!CFG.AI_ENDPOINT) el.textContent = 'MATURITRON: offline režim · hlas ElevenLabs';
      else if (!ai.checked) el.textContent = 'MATURITRON: připojuji se k AI…';
      else el.textContent = ai.online ? 'MATURITRON: skutečná AI připojena' : 'MATURITRON: AI nedostupná → offline režim';
      el.className = ai.online ? 'online' : '';
    }
    const ac = document.getElementById('ach-count');
    if (ac) ac.textContent = `v2.0 · achievementy ${Achievements.allTimeCount}/${Achievements.total}`;
  },
  showVictory() {
    const st = document.getElementById('v-stats');
    st.innerHTML = '';
    const rows = [
      ['ZBÝVAJÍCÍ ČAS', U.fmtTime(Game.time)],
      ['ZÁSAHY', String(Game.stats.hits)],
      ['ACHIEVEMENTY', `${Achievements.count}`],
    ];
    for (const [k, v] of rows) { const d = document.createElement('div'); d.innerHTML = `<span></span><b></b>`; d.firstChild.textContent = k; d.lastChild.textContent = v; st.appendChild(d); }
    const al = document.getElementById('v-ach'); al.innerHTML = '';
    for (const id of Achievements.unlockedList) { const s = document.createElement('span'); s.textContent = '🏆 ' + Achievements.LIST[id][0]; al.appendChild(s); }
    this.victoryStage('v-main');
    this.show('victory');
  },
  victoryStage(id) {
    ['v-main', 'v-error', 'v-credits'].forEach(s => document.getElementById(s).classList.toggle('hidden', s !== id));
    const b = document.querySelector('#' + id + ' button'); if (b) setTimeout(() => b.focus(), 30);
    if (id === 'v-credits') {
      const a = document.getElementById('credit-author'); if (a) a.textContent = CFG.CREDITS_AUTHOR || '';
    }
  },
  university() {
    Sound.sfx.error();
    Achievements.unlock('vysoka');
    this.victoryStage('v-error');
  },
};

window.addEventListener('load', () => {
  Game.init();
  window.__INFIS = { Game, World, Arena, MiniGames, Story, Director, Achievements, Dialogue, Sound, Input, UI };
});
