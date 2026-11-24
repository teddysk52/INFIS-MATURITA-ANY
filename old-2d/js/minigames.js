'use strict';
// =============================================================
//  minigames.js — "aréna" (samostatná obrazovka) a všechny
//  mini-hry. Žádná mini-hra se nedá prohrát natrvalo: zásah
//  jen ubere pár sekund z časovače.
// =============================================================
const Arena = (() => {
  const A = { active: false, d: {} };
  const DEFAULT_B = { x0: 14, y0: 70, x1: 466, y1: 244 };
  let bgCanvas = null;
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const T = (g, s, x, y, size, col, align = 'left', fam) => { g.font = U.font(size, fam, U.needsBig(s) ? 30 / RS.s : 0); g.textAlign = align; g.textBaseline = 'top'; g.fillStyle = col; g.fillText(s, x, y); };

  function makeBg(fn) {
    const S = RS.s;
    const c = document.createElement('canvas'); c.width = 480 * S; c.height = 270 * S;
    const g = c.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); g.imageSmoothingEnabled = false;
    fn(g); return c;
  }

  A.start = function (def, onWin) {
    A.def = def; A.onWin = onWin; A.t = 0; A.done = false; A.banner = null; A.d = {}; A.active = true; A.hidePlayer = false;
    A.bounds = Object.assign({}, DEFAULT_B, def.bounds || {});
    const s = def.start || [240, 240];
    A.p = { x: s[0], y: s[1], dir: 'up', anim: 0, inv: 0, kx: 0, ky: 0, moving: false, stepT: 0 };
    A.introT = def.title ? 1.7 : 0;
    Game.enterArena();
    def.init(A);
    bgCanvas = def.bg ? makeBg(g => def.bg(g, A)) : null;
    if (def.music !== null) Sound.playMusic(def.music || 'arena');
    if (A.introT) Sound.sfx.whoosh();
  };

  A.rebuildBg = function () { if (A.def && A.def.bg) bgCanvas = makeBg(g => A.def.bg(g, A)); };

  A.update = function (dt) {
    A.t += dt;
    const p = A.p;
    if (p.inv > 0) p.inv -= dt;
    if (A.banner) {
      A.banner.t += dt;
      if (A.def.updateWin) A.def.updateWin(A, dt);
      if (A.banner.t >= A.banner.dur) { const cb = A.onWin; A.banner = null; A.finish(); if (cb) cb(); }
      return;
    }
    if (Dialogue.active) { if (A.def.cutscene) A.def.cutscene(A, dt); return; }
    if (A.introT > 0) { A.introT -= dt; if (A.def.cutscene) A.def.cutscene(A, dt); return; }
    if (!A.def.noPlayer) move(dt);
    A.def.update(A, dt);
  };

  function move(dt) {
    const p = A.p, v = Game.readMove();
    const sp = (v.run ? 125 : 85) * (A.def.speed || 1);
    const dx = v.x * sp * dt + p.kx * dt, dy = v.y * sp * dt + p.ky * dt;
    const k = Math.pow(0.02, dt); p.kx *= k; p.ky *= k;
    if (Math.abs(p.kx) < 5) p.kx = 0; if (Math.abs(p.ky) < 5) p.ky = 0;
    const b = A.bounds;
    const ok = (nx, ny) => nx >= b.x0 && nx <= b.x1 && ny >= b.y0 && ny <= b.y1 && !(A.def.solid && A.def.solid(nx, ny));
    if (ok(p.x + dx, p.y)) p.x += dx; else p.kx = 0;
    if (ok(p.x, p.y + dy)) p.y += dy; else p.ky = 0;
    p.moving = !!(v.x || v.y);
    if (p.moving) {
      p.dir = Math.abs(v.x) > Math.abs(v.y) ? (v.x < 0 ? 'left' : 'right') : (v.y < 0 ? 'up' : 'down');
      p.anim += dt * (v.run ? 11 : 8);
      p.stepT -= dt; if (p.stepT <= 0) { p.stepT = v.run ? 0.22 : 0.3; Sound.sfx.step(); }
    } else p.anim = 0;
  }

  A.hurt = function (amount = 2, fx, fy) {
    const p = A.p;
    if (p.inv > 0 || A.done || Game.immuneT > 0) return false;
    p.inv = 1.2;
    Game.damage(amount, p.x, p.y - 26);
    if (fx !== undefined) { const dx = p.x - fx, dy = p.y - 7 - fy, d = Math.hypot(dx, dy) || 1; p.kx = dx / d * 170; p.ky = dy / d * 170; }
    return true;
  };
  A.touch = (x, y, r) => U.dist(A.p.x, A.p.y - 7, x, y) < r + 5;
  A.touchRect = (x, y, w, h) => {
    const px = A.p.x, py = A.p.y - 7;
    const cx = U.clamp(px, x, x + w), cy = U.clamp(py, y, y + h);
    return U.dist(px, py, cx, cy) < 6;
  };
  // náhodné místo daleko od hráče
  A.farSpot = (minD = 110, box) => {
    const b = box || { x0: 40, y0: A.bounds.y0 + 10, x1: 440, y1: A.bounds.y1 - 10 };
    for (let i = 0; i < 40; i++) {
      const x = U.rand(b.x0, b.x1), y = U.rand(b.y0, b.y1);
      if (U.dist(x, y, A.p.x, A.p.y) > minD && !(A.def.solid && A.def.solid(x, y + 6))) return { x, y };
    }
    return { x: A.p.x < 240 ? 400 : 80, y: (b.y0 + b.y1) / 2 };
  };

  A.win = function (title, sub, o = {}) {
    if (A.done) return;
    A.done = true;
    A.banner = { title, sub, t: 0, dur: o.dur || 2.3, color: o.color || '#49e08a', y: o.y || 110 };
    Sound.sfx.win();
    Game.confetti(240, 120, 90);
    Game.shake(4, 0.3);
  };
  A.finish = function () { A.active = false; Game.exitArena(); };

  A.draw = function (ctx, gt) {
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, bgCanvas.width, bgCanvas.height, 0, 0, 480, 270);
    A.def.draw(ctx, A, gt);
    if (!A.def.noPlayer && !A.hidePlayer) {
      const p = A.p;
      if (!(p.inv > 0 && ((gt * 18) | 0) % 2)) Sprites.draw(ctx, 'player', p.x, p.y, p.dir, p.moving ? [1, 0, 2, 0][(p.anim | 0) % 4] : 0);
    }
    if (A.def.drawTop) A.def.drawTop(ctx, A, gt);
    const hud = A.def.hud ? A.def.hud(A) : '';
    if (hud && !A.banner && A.introT <= 0 && !Dialogue.active) {
      ctx.font = U.font(10, 'bold');
      const w = ctx.measureText(hud).width + hud.length * 0.5 + 26, hy = A.def.hudY || 250;
      U.panel(ctx, 240 - w / 2, hy, w, 15, { bg: 'rgba(12,9,22,0.88)', border: 'rgba(255,211,77,0.4)' });
      U.text(ctx, hud, 240, hy + 3, { size: 10, font: 'bold', align: 'center', color: '#ffd34d', outline: false, ls: 0.5 });
    }
    if (A.introT > 0 && A.def.title && !Dialogue.active) {
      const k = U.clamp((1.7 - A.introT) / 0.3, 0, 1), out = U.clamp(A.introT / 0.3, 0, 1), a2 = Math.min(k, out);
      const gr = ctx.createLinearGradient(0, 80, 0, 170);
      gr.addColorStop(0, 'rgba(6,4,12,0)'); gr.addColorStop(0.5, `rgba(6,4,12,${0.82 * a2})`); gr.addColorStop(1, 'rgba(6,4,12,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 80, 480, 90);
      ctx.globalAlpha = a2;
      const e = 1 - Math.pow(1 - k, 3);
      U.text(ctx, 'MINI-HRA', 240, 100, { size: 7, align: 'center', color: '#ffd34d', outline: false, ls: 3 });
      U.text(ctx, A.def.title, 240, 110 + (1 - e) * 6, { size: 24, font: 'bold', align: 'center', color: '#ffffff', ls: 1 });
      ctx.fillStyle = '#ffd34d'; ctx.fillRect(240 - 40 * e, 140, 80 * e, 0.75);
      if (A.def.subtitle) U.text(ctx, A.def.subtitle, 240, 145, { size: 9.5, align: 'center', color: '#c8c0dc', outline: false });
      ctx.globalAlpha = 1;
    }
    if (A.banner) {
      const b = A.banner, k = Math.min(1, b.t / 0.25), s = 1 + Math.sin(Math.min(1, b.t / 0.35) * Math.PI) * 0.18;
      const gr = ctx.createLinearGradient(0, b.y - 34, 0, b.y + 34);
      gr.addColorStop(0, 'rgba(6,4,12,0)'); gr.addColorStop(0.5, 'rgba(6,4,12,0.65)'); gr.addColorStop(1, 'rgba(6,4,12,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, b.y - 34, 480, 68);
      ctx.save();
      ctx.translate(240, b.y); ctx.scale(s * k, s * k);
      U.text(ctx, b.title, 0, -15, { size: 24, font: 'bold', align: 'center', color: b.color, ow: 1, ls: 1 });
      ctx.restore();
      if (b.sub && b.t > 0.3) U.text(ctx, b.sub, 240, b.y + 14, { size: 10, align: 'center', color: '#ffffff', ls: 0.5 });
    }
  };

  // -------------------------------------------------------
  //  Pomocné kreslení pozadí
  // -------------------------------------------------------
  const BG = {
    wood(g, y0, base = '#c4915c') {
      for (let y = y0; y < 270; y += 4) { R(g, 0, y, 480, 4, base); R(g, 0, y + 3, 480, 1, U.shade(base, -0.18)); }
      for (let y = y0, r = 0; y < 270; y += 4, r++) for (let x = (r * 37) % 60; x < 480; x += 60) R(g, x, y, 1, 3, U.shade(base, -0.12));
    },
    tiles(g, y0, a, b) {
      for (let y = y0; y < 270; y += 16) for (let x = 0; x < 480; x += 16) { R(g, x, y, 16, 16, ((x + y) / 16) % 2 ? a : b); R(g, x, y, 16, 1, U.shade(a, 0.1)); }
    },
    wall(g, y0, y1, col, accent) {
      R(g, 0, y0, 480, y1 - y0, col); R(g, 0, y0, 480, 3, U.shade(col, -0.3));
      R(g, 0, y1 - 10, 480, 2, accent); R(g, 0, y1 - 5, 480, 5, '#5a4636');
      R(g, 0, 0, 480, y0, '#2a2238');
    },
    vignette(g, a = 0.35) {
      const gr = g.createRadialGradient(240, 150, 60, 240, 150, 300);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`);
      g.fillStyle = gr; g.fillRect(0, 0, 480, 270);
    },
  };

  A.BG = BG; A.R = R; A.T = T;
  return A;
})();

// =============================================================
//  Definice mini-her
// =============================================================
const MiniGames = (() => {
  const R = Arena.R, T = Arena.T, BG = Arena.BG;

  // ---------------------------------------------------------
  // 1) Hojer — UTÍKAJÍCÍ STŘEDNÍK
  // ---------------------------------------------------------
  const semicolon = {
    title: 'CHYŤ STŘEDNÍK!', subtitle: 'Bez středníku to nezkompiluješ. (Shift = sprint)',
    start: [120, 236], bounds: { y0: 76 },
    hud: A => `CHYŤ UTÍKAJÍCÍ STŘEDNÍK  ${A.d.caught}/3`,
    bg(g) {
      BG.wood(g, 60); BG.wall(g, 18, 60, '#ece3cf', '#6a3fa3');
      R(g, 168, 21, 196, 34, '#5d626b'); R(g, 170, 23, 192, 30, '#f5f7fa');
      T(g, 'static void Main() {', 175, 23, 8, '#2a4ab0');
      T(g, '  Console.WriteLine("Ahoj, INFIS")', 175, 31, 8, '#2a4ab0');
      T(g, '}', 175, 39, 8, '#2a4ab0');
      for (let i = 0; i < 22; i++) R(g, 250 + i * 4, 40 + (i % 2), 3, 1, '#e03030');
      R(g, 370, 24, 104, 26, '#2a0a0a'); R(g, 371, 25, 102, 24, '#4a1010');
      T(g, 'CS1002: ; expected', 422, 26, 8, '#ff8080', 'center');
      T(g, 'řádek 2, sloupec 37', 422, 36, 7, '#ffb3b3', 'center');
      R(g, 20, 26, 50, 26, '#6a3fa3'); T(g, 'C#', 45, 28, 16, '#ffffff', 'center', 'Silkscreen');
      BG.vignette(g, 0.25);
    },
    init(A) { A.d = { s: { x: 330, y: 160, vx: -40, vy: 30, pause: 0, tired: 0, say: '', sayT: 0 }, caught: 0, trail: [] }; },
    update(A, dt) {
      const s = A.d.s, p = A.p, b = A.bounds;
      s.tired += dt; s.sayT -= dt;
      if (s.tired > 2.7 && s.pause <= 0) { s.tired = 0; s.pause = 0.85; s.say = U.pick(['*funí*', 'kompiluju se…', 'pauza na kafe', 'loading…']); s.sayT = 0.85; }
      const dx = s.x - p.x, dy = s.y - (p.y - 8), d = Math.hypot(dx, dy) || 1;
      let tx, ty;
      if (s.pause > 0) { s.pause -= dt; tx = 0; ty = 0; }
      else if (d < 95) {
        const sp = 92 + A.d.caught * 8, wob = Math.sin(A.t * 5) * 0.6;
        tx = (dx / d - dy / d * wob) * sp; ty = (dy / d + dx / d * wob) * sp;
      } else { tx = Math.cos(A.t * 1.1 + 1) * 45; ty = Math.sin(A.t * 1.7) * 45; }
      const k = Math.min(1, dt * 5); s.vx += (tx - s.vx) * k; s.vy += (ty - s.vy) * k;
      s.x += s.vx * dt; s.y += s.vy * dt;
      const minX = b.x0 + 6, maxX = b.x1 - 6, minY = b.y0 - 6, maxY = b.y1 - 12;
      if (s.x < minX) { s.x = minX; s.vx = Math.abs(s.vx) * 0.3; }
      if (s.x > maxX) { s.x = maxX; s.vx = -Math.abs(s.vx) * 0.3; }
      if (s.y < minY) { s.y = minY; s.vy = Math.abs(s.vy) * 0.3; }
      if (s.y > maxY) { s.y = maxY; s.vy = -Math.abs(s.vy) * 0.3; }
      A.d.trail.push({ x: s.x, y: s.y, t: 0.25 });
      A.d.trail.forEach(q => q.t -= dt); A.d.trail = A.d.trail.filter(q => q.t > 0);
      if (d < 15) {
        A.d.caught++;
        Sound.sfx.collect(); Game.shake(3, 0.2); Game.burst(s.x, s.y - 8, '#ffe14d', 18);
        if (A.d.caught >= 3) { A.win('BUILD SUCCESSFUL', '0 chyb · 0 varování · 1 zázrak'); Achievements.unlock('build'); }
        else {
          Game.floatText(s.x, s.y - 26, A.d.caught === 1 ? '„Ještě ne!“ — středník' : 'NullReferenceException!', '#ff8080');
          s.x = p.x < 240 ? 420 : 60; s.y = p.y < 170 ? 230 : 110; s.pause = 0.5; s.tired = 0; Sound.sfx.teleport();
        }
      }
    },
    updateWin(A, dt) { if (Math.random() < dt * 25) Game.confetti(U.rand(40, 440), U.rand(60, 200), 4); },
    draw(ctx, A, gt) {
      const s = A.d.s;
      if (A.done) return;
      ctx.globalAlpha = 0.3; A.d.trail.forEach((q, i) => { if (i % 3 === 0) Sprites.semicolon(ctx, q.x, q.y, gt, false); }); ctx.globalAlpha = 1;
      Sprites.semicolon(ctx, s.x, s.y, gt, U.dist(s.x, s.y, A.p.x, A.p.y) < 95);
      if (s.sayT > 0) Sprites.bubble(ctx, s.x, s.y - 32, s.say, 8);
    },
  };

  // ---------------------------------------------------------
  // 2) Horváth — RAM MODULY (a jeden rohlík)
  // ---------------------------------------------------------
  const ram = {
    title: 'NAJDI RAM MODULY!', subtitle: 'Pozor na přehřáté procesory.',
    start: [240, 236], bounds: { y0: 76 },
    hud: A => `POSBÍREJ RAM MODULY  ${A.d.got}/5`,
    bg(g) {
      BG.tiles(g, 60, '#c3c8ce', '#b7bcc3'); BG.wall(g, 18, 60, '#e9e6dc', '#2b8a6b');
      for (let i = 0; i < 6; i++) { const x = 20 + i * 78; R(g, x, 20, 30, 38, '#22222a'); for (let j = 0; j < 6; j++) R(g, x + 3, 23 + j * 5, 24, 3, '#34343f'); }
      for (let i = 0; i < 9; i++) { const y = 80 + i * 21; R(g, 0, y, 480, 1, 'rgba(40,60,40,0.15)'); }
      BG.vignette(g, 0.2);
    },
    init(A) {
      const pts = U.shuffle([[70, 110], [400, 105], [100, 225], [385, 220], [240, 130]]);
      const roh = U.randi(0, 4);
      A.d = {
        got: 0, popup: 0,
        items: pts.map((q, i) => ({ x: q[0] + U.rand(-15, 15), y: q[1] + U.rand(-8, 8), roh: i === roh, got: false, ph: U.rand(0, 6) })),
        cpus: [{ x: 150, y: 170, vx: 55, vy: 42 }, { x: 330, y: 150, vx: -50, vy: 46 }],
      };
    },
    update(A, dt) {
      const b = A.bounds;
      A.d.popup -= dt;
      for (const c of A.d.cpus) {
        c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.x < 24 || c.x > 456) c.vx *= -1;
        if (c.y < b.y0 - 4 || c.y > b.y1 - 10) c.vy *= -1;
        if (A.touch(c.x, c.y, 8)) A.hurt(2, c.x, c.y);
      }
      for (const it of A.d.items) {
        if (it.got || !A.touch(it.x, it.y, 10)) continue;
        it.got = true; A.d.got++;
        Game.burst(it.x, it.y, it.roh ? '#f2d39b' : '#3fd36b', 14);
        if (it.roh) { A.d.popup = 2.6; Achievements.unlock('rohlik'); Sound.sfx.error(); }
        else { Sound.sfx.collect(); Game.floatText(it.x, it.y - 14, U.pick(['+16 GB', '+8 GB', 'DDR4!', '+32 GB']), '#49e08a'); }
        if (A.d.got >= 5) A.win('RAM NAINSTALOVÁNA', 'Kapacita: 64 GB + 1 rohlík', { dur: 2.6 });
      }
    },
    draw(ctx, A, gt) {
      for (const it of A.d.items) {
        if (it.got) continue;
        const y = it.y + Math.sin(gt * 3 + it.ph) * 3;
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(it.x - 8, it.y + 8, 16, 2);
        Sprites.drawArt(ctx, it.roh ? 'rohlik' : 'ram', it.x, y, 1);
        if ((gt * 4 | 0) % 4 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(it.x + 6, y - 6, 1, 1); }
      }
      for (const c of A.d.cpus) { Sprites.cpu(ctx, c.x, c.y, gt); U.text(ctx, '99°C', c.x, c.y + 8, { size: 7, align: 'center', color: '#ff8a5a' }); }
    },
    drawTop(ctx, A) {
      if (A.d.popup <= 0) return;
      const x = 110, y = 100;
      R(ctx, x, y, 260, 62, '#c0c0c0'); R(ctx, x, y, 260, 12, '#1b3fa8');
      U.text(ctx, 'Nový hardware', x + 4, y + 1, { size: 9, color: '#fff', outline: false });
      U.text(ctx, 'NOVÝ HARDWARE DETEKOVÁN:', x + 130, y + 16, { size: 11, align: 'center', color: '#111', outline: false });
      U.text(ctx, 'ROHLÍK DDR5', x + 130, y + 28, { size: 16, align: 'center', color: '#b8641a', outline: false, font: 'Silkscreen' });
      U.text(ctx, '[ Nainstalovat máslo ]', x + 130, y + 47, { size: 10, align: 'center', color: '#222', outline: false });
    },
  };

  // ---------------------------------------------------------
  // 3) Baťková — JAZYKOVÝ CHAOS (uhýbání bublinám)
  // ---------------------------------------------------------
  const WORDS = ['HELLO', 'GUTEN TAG', 'DOBRÝ DEN', 'WHY ARE YOU RUNNING?', 'ENTSCHULDIGUNG', 'PRESENT PERFECT!', 'DER? DIE? DAS?', 'ČAU',
    'THE APPLE IS RED', 'KARTOFFEL', 'SORRY', 'DO YOU SPEAK?', 'JA JA', 'NEIN!', 'TO BE OR NOT TO BE', 'DANKE SCHÖN', 'HOW ARE YOU?',
    'GUT.', 'SCHMETTERLING', 'IRREGULAR VERBS', 'PŘEDPŘÍTOMNÝ ČAS', 'WO IST DER BAHNHOF?'];
  const LANGCOL = w => /[ÄÖÜß]|GUTEN|DANKE|NEIN|JA JA|KARTOFFEL|SCHMETT|ENTSCH|DER\?|WO IST/.test(w) ? '#b8001f' : /[ČŘŠŽÝÁÍÉŮÚĚ]|ČAU|DOBRÝ/.test(w) ? '#11457e' : '#1d6b3a';
  const babel = {
    title: 'JAZYKOVÝ CHAOS!', subtitle: 'Uhýbej bublinám a doběhni k východu →',
    start: [36, 170], bounds: { y0: 74 },
    hud: A => A.d.load < 100 ? `UHÝBEJ! DVEŘE SE NAČÍTAJÍ… ${Math.floor(A.d.load)} %` : 'DVEŘE NAČTENY! BĚŽ K VÝCHODU →',
    bg(g) {
      for (let y = 58; y < 270; y += 16) for (let x = 0; x < 480; x += 16) { R(g, x, y, 16, 16, ((x + y) / 16) % 2 ? '#7d69ad' : '#6e5a9e'); }
      BG.wall(g, 18, 58, '#e9e6dc', '#d8a23a');
      T(g, 'SPRACHEN · LANGUAGES · JAZYKY · ???', 240, 30, 10, '#3a2d4a', 'center', 'Silkscreen');
      BG.vignette(g, 0.25);
    },
    init(A) { A.d = { bubbles: [], spawn: 0.2, load: 0, door: { x: 446, y: 140, w: 28, h: 44 } }; },
    update(A, dt) {
      const d = A.d;
      d.load = Math.min(100, d.load + dt * 100 / 11);
      d.spawn -= dt;
      if (d.spawn <= 0) {
        d.spawn = Math.max(0.3, 0.62 - A.t * 0.018);
        const text = U.pick(WORDS), big = text === 'WHY ARE YOU RUNNING?';
        d.bubbles.push({ text, x: U.rand(70, 430), y: 50, vy: U.rand(55, 92) + A.t * 1.5, ph: U.rand(0, 6), size: big ? 11 : 9, col: LANGCOL(text) });
      }
      for (const b of d.bubbles) {
        b.y += b.vy * dt; b.x += Math.sin(A.t * 2 + b.ph) * 18 * dt;
        if (!b.w) { const c = document.createElement('canvas').getContext('2d'); c.font = U.font(b.size, undefined, U.needsBig(b.text) ? 30 / RS.s : 0); b.w = c.measureText(b.text).width + 8; }
        if (!b.dead && A.touchRect(b.x - b.w / 2, b.y - b.size / 2 - 2, b.w, b.size + 4)) {
          if (A.hurt(2, b.x, b.y)) { b.dead = true; Game.burst(b.x, b.y, '#ffffff', 10); }
        }
      }
      d.bubbles = d.bubbles.filter(b => b.y < 290 && !b.dead);
      const dr = d.door;
      if (d.load >= 100 && A.touchRect(dr.x - 4, dr.y, dr.w + 4, dr.h)) {
        A.win('AUSGANG GEFUNDEN!', 'EXIT FOUND · VÝCHOD NALEZEN · ¿DÓNDE ESTOY?', { color: '#ffd34d' });
        Achievements.unlock('polyglot');
      }
    },
    draw(ctx, A, gt) {
      const dr = A.d.door, open = A.d.load >= 100;
      R(ctx, dr.x - 2, dr.y - 2, dr.w + 4, dr.h + 4, '#2a2238');
      R(ctx, dr.x, dr.y, dr.w, dr.h, open ? '#1a1a1a' : '#8b5a2b');
      if (open) { ctx.fillStyle = `rgba(255,230,120,${0.5 + Math.sin(gt * 6) * 0.3})`; ctx.fillRect(dr.x + 2, dr.y + 2, dr.w - 4, dr.h - 4); }
      else { R(ctx, dr.x + 3, dr.y + 3, dr.w - 6, 16, '#a06a35'); R(ctx, dr.x + 3, dr.y + 22, dr.w - 6, 18, '#a06a35'); }
      R(ctx, dr.x - 6, dr.y - 14, dr.w + 12, 10, '#1a8f3a'); U.text(ctx, 'EXIT', dr.x + dr.w / 2, dr.y - 14, { size: 9, align: 'center', color: '#fff', outline: false });
      R(ctx, dr.x - 8, dr.y + dr.h + 6, dr.w + 16, 5, '#222'); R(ctx, dr.x - 7, dr.y + dr.h + 7, (dr.w + 14) * A.d.load / 100, 3, '#49e08a');
      for (const b of A.d.bubbles) Sprites.bubble(ctx, b.x, b.y, b.text, b.size, b.col);
    },
  };

  // ---------------------------------------------------------
  // 4) Janda — ÚTĚK Z KNIHY (bludiště, honí tě knihy)
  // ---------------------------------------------------------
  function genMaze(cw, ch) {
    const W = cw * 2 + 1, H = ch * 2 + 1, g = [];
    for (let y = 0; y < H; y++) g.push(new Array(W).fill(1));
    const st = [[0, ch - 1]], vis = new Set([`0,${ch - 1}`]);
    g[(ch - 1) * 2 + 1][1] = 0;
    while (st.length) {
      const [cx, cy] = st[st.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy])
        .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cw && ny < ch && !vis.has(nx + ',' + ny));
      if (!nb.length) { st.pop(); continue; }
      const [nx, ny, dx, dy] = U.pick(nb);
      vis.add(nx + ',' + ny);
      g[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = 0; g[ny * 2 + 1][nx * 2 + 1] = 0;
      st.push([nx, ny]);
    }
    for (let i = 0; i < 40; i++) { // pár smyček navíc, ať to není frustrující
      const x = U.randi(1, W - 2), y = U.randi(1, H - 2);
      if (g[y][x] === 1 && ((g[y][x - 1] === 0 && g[y][x + 1] === 0) || (g[y - 1][x] === 0 && g[y + 1][x] === 0))) g[y][x] = 0;
    }
    return g;
  }
  const MZ = { ox: 8, oy: 54, ts: 16 };
  const book = {
    title: 'ÚTĚK Z KNIHY!', subtitle: 'Najdi KONEC kapitoly. Knihy koušou.',
    bounds: { x0: 0, y0: 0, x1: 480, y1: 270 },
    hud: A => `NAJDI VÝCHOD Z KNIHY · KAPITOLA KONČÍ ZA ${Math.ceil(A.d.chap)} s`,
    solid(x, y) {
      const g = this._g; if (!g) return false;
      const pts = [[x - 5, y - 6], [x + 5, y - 6], [x - 5, y], [x + 5, y]];
      for (const [px, py] of pts) {
        const tx = Math.floor((px - MZ.ox) / MZ.ts), ty = Math.floor((py - MZ.oy) / MZ.ts);
        if (ty < 0 || tx < 0 || ty >= g.length || tx >= g[0].length) return true;
        if (g[ty][tx]) return true;
      }
      return false;
    },
    init(A) {
      const g = genMaze(14, 6);
      this._g = g;
      const startT = [1, 11], exitT = [27, 1];
      A.d = { g, startT, exitT, chap: 40, books: [] };
      A.p.x = MZ.ox + startT[0] * MZ.ts + 8; A.p.y = MZ.oy + startT[1] * MZ.ts + 13;
      for (let i = 0; i < 3; i++) A.d.books.push({ x: 120 + i * 120, y: 70 + (i % 2) * 150, ph: i * 2, col: ['#8e2b25', '#1d3f8a', '#2e7d32'][i], stun: 1.5 });
    },
    bg(g, A) {
      R(g, 0, 0, 480, 270, '#3a2414');
      R(g, 4, 20, 472, 248, '#f3e6c4');
      for (let y = 30; y < 266; y += 9) R(g, 10, y, 460, 1, 'rgba(120,90,50,0.15)');
      const m = A.d.g;
      for (let y = 0; y < m.length; y++) for (let x = 0; x < m[0].length; x++) {
        if (!m[y][x]) continue;
        const px = MZ.ox + x * MZ.ts, py = MZ.oy + y * MZ.ts;
        R(g, px, py, 16, 16, '#5a3820');
        for (let i = 0; i < 5; i++) R(g, px + 1 + i * 3, py + 2, 2, 12, ['#8e2b25', '#1d3f8a', '#2e7d32', '#b8860b', '#6a1b9a'][(x * 7 + y * 3 + i) % 5]);
        R(g, px, py, 16, 1, '#7a5232');
      }
      T(g, 'KAPITOLA 13: ÚTĚK', 240, 20, 9, '#5a3820', 'center', 'Silkscreen');
      const ex = MZ.ox + A.d.exitT[0] * 16, ey = MZ.oy + A.d.exitT[1] * 16;
      R(g, ex + 1, ey + 1, 14, 14, '#1a1a1a'); T(g, 'KONEC', ex + 8, ey - 9, 8, '#c0392b', 'center');
    },
    update(A, dt) {
      const d = A.d;
      d.chap -= dt;
      if (d.chap <= 0) {
        d.chap = 40;
        A.p.x = MZ.ox + d.startT[0] * 16 + 8; A.p.y = MZ.oy + d.startT[1] * 16 + 13;
        Game.damage(5, A.p.x, A.p.y - 26);
        Game.floatText(240, 120, 'KAPITOLA SE OPAKUJE…', '#ffd34d', true);
        d.books.forEach(b => { b.stun = 1.5; });
      }
      for (const b of d.books) {
        if (b.stun > 0) { b.stun -= dt; continue; }
        const dx = A.p.x - b.x, dy = A.p.y - 10 - b.y, dist = Math.hypot(dx, dy) || 1;
        const sp = 36 + (40 - d.chap) * 0.4;
        b.x += dx / dist * sp * dt; b.y += dy / dist * sp * dt;
        if (A.touch(b.x, b.y, 7)) {
          if (A.hurt(2, b.x, b.y)) {
            const f = A.farSpot(170, { x0: 30, y0: 60, x1: 450, y1: 250 });
            Game.burst(b.x, b.y, '#f3ead2', 12); b.x = f.x; b.y = f.y; b.stun = 1.2;
          }
        }
      }
      const ex = MZ.ox + d.exitT[0] * 16 + 8, ey = MZ.oy + d.exitT[1] * 16 + 8;
      if (A.touch(ex, ey, 9)) { A.win('KNIHA DOČTENA', 'Konec. Rozbor odevzdej do pátku.', { color: '#ffd34d' }); }
    },
    draw(ctx, A, gt) {
      const d = A.d, ex = MZ.ox + d.exitT[0] * 16, ey = MZ.oy + d.exitT[1] * 16;
      ctx.fillStyle = `rgba(255,220,100,${0.35 + Math.sin(gt * 5) * 0.25})`; ctx.fillRect(ex + 1, ey + 1, 14, 14);
    },
    drawTop(ctx, A, gt) {
      for (const b of A.d.books) {
        ctx.globalAlpha = b.stun > 0 ? 0.5 : 1;
        Sprites.book(ctx, b.x, b.y + Math.sin(gt * 4 + b.ph) * 2, gt + b.ph, b.col);
        ctx.globalAlpha = 1;
      }
    },
  };

  // ---------------------------------------------------------
  // 5) Prynych — EXCEL APOCALYPSE (boss)
  // ---------------------------------------------------------
  const FORMULAS = ['#REF!', '=SUMA()', '#DIV/0!', 'SVYHLEDAT', '#N/A', '=KDYŽ()', '#NÁZEV?', '=PRŮMĚR', 'Sešit1', '$A$1'];
  const excel = {
    title: 'EXCEL APOCALYPSE', subtitle: 'Seber 3 zlaté diskety. Buňky se hýbou.', music: 'boss',
    start: [240, 236], bounds: { y0: 116, y1: 244 },
    hud: A => `SEBER ZLATÉ DISKETY  ${A.d.got}/3`,
    bg(g) {
      R(g, 0, 0, 480, 270, '#ffffff');
      R(g, 0, 18, 480, 20, '#1d7044');
      T(g, 'Soubor   Domů   Vložení   Vzorce   Data   POMOC', 10, 22, 9, '#e9f5ec');
      R(g, 0, 38, 480, 10, '#f3f3f3'); T(g, 'fx  =VŠECHNO_JE_TABULKA(TY)', 8, 38, 8, '#333');
      R(g, 0, 48, 480, 10, '#e6e6e6'); R(g, 0, 48, 22, 222, '#e6e6e6');
      for (let i = 0; i < 15; i++) { T(g, String.fromCharCode(65 + i), 22 + i * 32 + 16, 48, 8, '#555', 'center'); R(g, 22 + i * 32, 48, 1, 222, '#d4d4d4'); }
      for (let j = 0; j < 15; j++) { T(g, String(j + 1), 11, 58 + j * 14, 7, '#555', 'center'); R(g, 0, 58 + j * 14, 480, 1, '#d4d4d4'); }
      R(g, 54, 72, 32, 14, 'rgba(29,112,68,0.12)');
    },
    init(A) {
      A.d = { got: 0, icons: [], shoot: 1.2, hurt: 0, say: 'VŠECHNO JE TABULKA.', sayT: 3.2, floppy: null, lanes: [] };
      [[128, 1, 70], [166, -1, 88], [204, 1, 62]].forEach(([y, dir, sp]) => {
        const cells = []; const off = U.rand(0, 100);
        for (let i = 0; i < 5; i++) cells.push({ x: off + i * 135 - 60, text: U.pick(FORMULAS) });
        A.d.lanes.push({ y, dir, sp, cells });
      });
      this.spawnFloppy(A);
    },
    spawnFloppy(A) { A.d.floppy = A.farSpot(120, { x0: 40, y0: 125, x1: 440, y1: 245 }); },
    update(A, dt) {
      const d = A.d;
      d.hurt -= dt; d.sayT -= dt;
      for (const l of d.lanes) for (const c of l.cells) {
        c.x += l.dir * l.sp * (1 + d.got * 0.15) * dt;
        if (c.x > 540) c.x -= 675; if (c.x < -120) c.x += 675;
        if (A.touchRect(c.x, l.y - 8, 58, 16)) A.hurt(2, c.x + 29, l.y);
      }
      d.shoot -= dt;
      if (d.shoot <= 0) {
        d.shoot = Math.max(0.85, 1.6 - d.got * 0.3);
        const bx = 240, by = 82, dx = A.p.x - bx, dy = A.p.y - 8 - by, dd = Math.hypot(dx, dy) || 1, sp = 78 + d.got * 14;
        d.icons.push({ x: bx, y: by, vx: dx / dd * sp, vy: dy / dd * sp, life: 5 });
      }
      for (const ic of d.icons) {
        ic.x += ic.vx * dt; ic.y += ic.vy * dt; ic.life -= dt;
        if (A.touch(ic.x, ic.y, 6)) { if (A.hurt(2, ic.x, ic.y)) ic.life = 0; }
      }
      d.icons = d.icons.filter(i => i.life > 0);
      const f = d.floppy;
      if (f && A.touch(f.x, f.y, 10)) {
        d.got++; d.hurt = 0.6; Game.shake(5, 0.3); Sound.sfx.collect(); Game.burst(f.x, f.y, '#ffd34d', 20);
        if (d.got >= 3) {
          d.floppy = null; d.icons = [];
          A.win('#HODNOTA!', 'EXCEL.EXE přestal pracovat.', { color: '#49e08a', dur: 2.6 });
          Sound.sfx.explosion(); Achievements.unlock('excel_trauma');
        } else {
          d.say = U.pick(['CTRL+Z! CTRL+Z!', '#DĚLENÍ_NULOU!', 'TO NENÍ VE VZORCI!', 'KONTINGENČNÍ ODVETA!']); d.sayT = 2;
          this.spawnFloppy(A);
        }
      }
    },
    updateWin(A, dt) { if (A.banner.t < 1.4 && Math.random() < dt * 14) { Game.burst(240 + U.rand(-40, 40), 70 + U.rand(-25, 25), U.pick(['#1d7044', '#ffffff', '#ffd34d']), 14); Game.shake(3, 0.1); } },
    draw(ctx, A, gt) {
      for (const l of A.d.lanes) for (const c of l.cells) {
        R(ctx, c.x - 1, l.y - 9, 60, 18, Sprites.OUT); R(ctx, c.x, l.y - 8, 58, 16, '#ffffff'); R(ctx, c.x, l.y - 8, 58, 2, '#1d7044');
        U.text(ctx, c.text, c.x + 29, l.y - 6, { size: 9, align: 'center', color: c.text[0] === '#' ? '#c0392b' : '#1d7044', outline: false });
      }
      if (A.d.floppy) {
        const f = A.d.floppy, b = Math.sin(gt * 4) * 2;
        ctx.fillStyle = `rgba(255,210,63,${0.25 + Math.sin(gt * 6) * 0.15})`; ctx.fillRect(f.x - 10, f.y - 10 + b, 20, 20);
        Sprites.drawArt(ctx, 'floppy', f.x, f.y + b, 1.4);
      }
      for (const ic of A.d.icons) Sprites.drawArt(ctx, 'excel', ic.x, ic.y, 1);
      if (!(A.done && A.banner && A.banner.t > 1.4)) {
        Sprites.excelBoss(ctx, 240, 82, gt, A.d.hurt);
        // HP lišta
        R(ctx, 170, 44, 140, 9, Sprites.OUT); R(ctx, 171, 45, 138 * (3 - A.d.got) / 3, 7, '#3fd36b');
        U.text(ctx, 'EXCEL.EXE', 240, 44, { size: 8, align: 'center', color: '#fff' });
        if (A.d.sayT > 0) Sprites.bubble(ctx, 350, 60, A.d.say, 10, '#1d7044');
      }
    },
  };

  // ---------------------------------------------------------
  // 6) Láďman — VYROVNEJ ROZVAHU (mince vs. faktury)
  // ---------------------------------------------------------
  const economy = {
    title: 'VYROVNEJ ROZVAHU!', subtitle: 'Sbírej mince. Faktury bolí.',
    start: [240, 236], bounds: { y0: 76 },
    hud: A => `AKTIVA: ${A.d.coins}/10   ·   PASIVA: ∞`,
    bg(g) {
      for (let y = 60; y < 270; y += 20) for (let x = 0; x < 480; x += 20) { R(g, x, y, 20, 20, ((x + y) / 20) % 2 ? '#e8e2d6' : '#d9d1c2'); R(g, x + 3, y + 7, 9, 1, 'rgba(150,140,120,0.3)'); }
      BG.wall(g, 18, 60, '#e8e2d6', '#d4a017');
      R(g, 150, 22, 180, 32, '#ffffff'); R(g, 239, 24, 2, 28, '#222'); R(g, 152, 30, 176, 1, '#222');
      T(g, 'MÁ DÁTI', 195, 22, 8, '#222', 'center'); T(g, 'DAL', 285, 22, 8, '#222', 'center');
      T(g, '???', 195, 36, 10, '#c0392b', 'center'); T(g, '¯\\_(ツ)_/¯', 285, 36, 9, '#555', 'center');
      T(g, 'ÚČETNICTVÍ', 60, 30, 10, '#2a3352', 'center', 'Silkscreen'); T(g, '€ $ Kč', 410, 30, 12, '#d4a017', 'center', 'Silkscreen');
      BG.vignette(g, 0.2);
    },
    init(A) { A.d = { coins: 0, items: [], sc: 0.2, si: 0.8, tax: null, ann: 0 }; },
    update(A, dt) {
      const d = A.d;
      d.sc -= dt; d.si -= dt; d.ann -= dt;
      if (d.sc <= 0) { d.sc = 0.55; d.items.push({ k: 'coin', x: U.rand(30, 450), y: 52, vy: U.rand(55, 85), ph: U.rand(0, 6) }); }
      if (d.si <= 0) { d.si = Math.max(0.5, 0.85 - A.t * 0.01); d.items.push({ k: 'inv', x: U.rand(30, 450), y: 50, vy: U.rand(50, 82), label: U.pick(['FAKTURA', 'DPH 21%', 'PENÁLE', 'UPOMÍNKA', 'DAŇ Z ROHLÍKU', 'SLOŽENKA']), ph: U.rand(0, 6) }); }
      for (const it of d.items) {
        it.y += it.vy * dt; it.x += Math.sin(A.t * 3 + it.ph) * (it.k === 'inv' ? 25 : 8) * dt;
        if (it.dead) continue;
        if (it.k === 'coin' && A.touch(it.x, it.y, 8)) {
          it.dead = true; d.coins++; Sound.sfx.coin(); Game.floatText(it.x, it.y - 10, '+1 Kč', '#ffd34d');
          if (d.coins === 5 && !d.tax) { d.ann = 2.2; d.tax = { x: 240, y: 30, wait: 1.3 }; Sound.sfx.alarm(); Game.shake(4, 0.4); }
          if (d.coins >= 10) { A.win('ROZVAHA VYROVNÁNA', 'Aktiva = Pasiva. Účetně jsi neviditelný.', { color: '#ffd34d' }); Achievements.unlock('rozvaha'); }
        } else if (it.k === 'inv' && A.touchRect(it.x - 15, it.y - 8, 30, 16)) {
          if (A.hurt(2, it.x, it.y)) it.dead = true;
        }
      }
      d.items = d.items.filter(i => i.y < 285 && !i.dead);
      if (d.tax) {
        const t = d.tax;
        if (t.wait > 0) t.wait -= dt;
        else {
          const dx = A.p.x - t.x, dy = A.p.y - 14 - t.y, dd = Math.hypot(dx, dy) || 1;
          t.x += dx / dd * 44 * dt; t.y += dy / dd * 44 * dt;
          if (A.touchRect(t.x - 16, t.y - 20, 32, 40) && A.hurt(3, t.x, t.y)) { t.x = A.p.x < 240 ? 440 : 40; t.y = 60; t.wait = 0.8; }
        }
      }
    },
    draw(ctx, A, gt) {
      for (const it of A.d.items) {
        if (it.k === 'coin') Sprites.drawArt(ctx, ((gt * 6 + it.ph) | 0) % 2 ? 'coin' : 'coin2', it.x, it.y, 1.3);
        else Sprites.paper(ctx, it.x, it.y, it.label, 34, 16);
      }
      const t = A.d.tax;
      if (t) {
        const s = 1 + Math.sin(gt * 6) * 0.04;
        ctx.save(); ctx.translate(t.x, t.y); ctx.scale(s, s);
        Sprites.paper(ctx, 0, 0, 'DAŇOVÉ', 36, 44, '#fff3e0', '#8a1010');
        U.text(ctx, 'PŘIZNÁNÍ', 0, -8, { size: 7, align: 'center', color: '#8a1010', outline: false });
        R(ctx, -9, 4, 4, 3, '#111'); R(ctx, 5, 4, 4, 3, '#111'); R(ctx, -7, 12, 14, 2, '#8a1010');
        ctx.restore();
      }
    },
    drawTop(ctx, A, gt) {
      if (A.d.ann > 0 && (gt * 6 | 0) % 2) {
        R(ctx, 0, 112, 480, 34, 'rgba(120,0,0,0.75)');
        U.text(ctx, 'FINANČNÍ ÚŘAD TĚ NAŠEL.', 240, 118, { size: 20, font: 'Silkscreen', align: 'center', color: '#ffffff', ow: 1 });
      }
    },
  };

  // ---------------------------------------------------------
  // 7) Olga — PŘEŽIJ MATEMATIKU (tajný legendární boss)
  // ---------------------------------------------------------
  const SYMS = ['π', '∑', '√', '∫', 'x²', '÷', '∞', 'Δ', '≠', '%', 'sin', 'log', 'ƒ(x)', '=?', 'dx', 'n!'];
  const olga = {
    title: 'PŘEŽIJ MATEMATIKU', subtitle: '15 sekund. Žádné počítání. Jen přežití.', music: 'olga',
    start: [240, 236], bounds: { y0: 100 },
    hud: A => `PŘEŽIJ: ${Math.max(0, Math.ceil(A.d.left))} s`,
    bg(g) {
      BG.wood(g, 62, '#5a4636');
      BG.wall(g, 18, 62, '#3a3f3a', '#8b2d4f');
      R(g, 40, 22, 400, 36, '#2a4a35'); R(g, 38, 20, 404, 2, '#6b4a2a'); R(g, 38, 58, 404, 3, '#6b4a2a');
      T(g, '∫ eˣ dx = ?', 60, 26, 10, '#e9f0e6'); T(g, 'π = 3 (pro dnešek)', 60, 40, 9, '#e9f0e6');
      T(g, 'lim (důchod → ∞) = MATIKA', 260, 26, 9, '#ffe9a0'); T(g, 'x² + y² = :)', 300, 40, 9, '#e9f0e6');
      BG.vignette(g, 0.6);
    },
    init(A) { A.d = { left: 15, syms: [], sp: 0.4, ring: 2.5 }; },
    update(A, dt) {
      const d = A.d;
      d.left -= dt; d.sp -= dt; d.ring -= dt;
      if (d.sp <= 0) {
        d.sp = 0.42;
        const side = U.randi(0, 2);
        let x, y;
        if (side === 0) { x = -10; y = U.rand(110, 260); } else if (side === 1) { x = 490; y = U.rand(110, 260); } else { x = U.rand(20, 460); y = 80; }
        const tx = A.p.x + U.rand(-50, 50), ty = A.p.y - 8 + U.rand(-40, 40), dx = tx - x, dy = ty - y, dd = Math.hypot(dx, dy) || 1, sp = U.rand(75, 110);
        d.syms.push({ s: U.pick(SYMS), x, y, vx: dx / dd * sp, vy: dy / dd * sp, r: U.rand(0, 6), life: 7 });
      }
      if (d.ring <= 0) {
        d.ring = 3;
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + A.t; d.syms.push({ s: U.pick(SYMS), x: 240, y: 82, vx: Math.cos(a) * 62, vy: Math.abs(Math.sin(a)) * 62 + 12, r: 0, life: 6 }); }
        Sound.sfx.glitch();
      }
      for (const s of d.syms) {
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.r += dt * 3;
        if (A.touch(s.x, s.y, 6) && A.hurt(2, s.x, s.y)) s.life = 0;
      }
      d.syms = d.syms.filter(s => s.life > 0 && s.x > -30 && s.x < 510 && s.y < 300);
      if (d.left <= 0) { d.syms = []; A.win('MATEMATIKA PŘEŽITA', 'Bonus: +20 sekund do maturity', { color: '#ffd34d' }); Achievements.unlock('matematika'); }
    },
    draw(ctx, A, gt) {
      ctx.fillStyle = 'rgba(255,240,200,0.08)'; ctx.beginPath(); ctx.moveTo(220, 20); ctx.lineTo(260, 20); ctx.lineTo(300, 120); ctx.lineTo(180, 120); ctx.fill();
      Sprites.draw(ctx, 'olga', 240, 100, 'down', 0, 2);
      R(ctx, 196, 88, 88, 16, '#5a3820'); R(ctx, 196, 88, 88, 2, '#7a5232'); R(ctx, 200, 92, 20, 6, '#f3ead2');
      for (const s of A.d.syms) U.text(ctx, s.s, s.x, s.y - 6 + Math.sin(s.r) * 1.5, { size: 13, align: 'center', color: s.s.length > 1 ? '#ffe9a0' : '#ffffff', ow: 1 });
    },
  };

  // ---------------------------------------------------------
  // 8) Baťková (4. ročník) — PODPIS VE TŘECH JAZYCÍCH (timing)
  // ---------------------------------------------------------
  const qte = {
    title: 'PODPIS VE 3 JAZYCÍCH', subtitle: 'Zmáčkni E, když je ukazatel v zeleném poli.',
    noPlayer: true,
    hud: A => `PODEPIŠ SE!  ${A.d.ok}/3`,
    bg(g) {
      for (let y = 18; y < 270; y += 16) for (let x = 0; x < 480; x += 16) R(g, x, y, 16, 16, ((x + y) / 16) % 2 ? '#7d69ad' : '#6e5a9e');
      BG.vignette(g, 0.5);
    },
    init(A) { A.d = { ok: 0, pos: 0, dir: 1, speed: 0.9, zoneW: 0.26, zoneX: U.rand(0.25, 0.6), fb: '', fbT: 0, fbCol: '#49e08a', words: ['PODPIS', 'UNTERSCHRIFT', 'SIGNATURE'], cool: 0 }; },
    update(A, dt) {
      const d = A.d;
      d.fbT -= dt; d.cool -= dt;
      d.pos += d.dir * d.speed * dt;
      if (d.pos > 1) { d.pos = 1; d.dir = -1; } if (d.pos < 0) { d.pos = 0; d.dir = 1; }
      if (Input.confirm() && d.cool <= 0) {
        Input.consume('e', ' ', 'enter');
        d.cool = 0.25;
        if (d.pos >= d.zoneX && d.pos <= d.zoneX + d.zoneW) {
          d.ok++; Sound.sfx.collect(); d.fb = ['SPRÁVNĚ!', 'RICHTIG!', 'CORRECT!'][d.ok - 1]; d.fbCol = '#49e08a'; d.fbT = 0.8;
          Game.burst(240, 150, '#49e08a', 16);
          if (d.ok >= 3) A.win('PODEPSÁNO', '…ve třech jazycích. Ani jeden nebyl tvůj.', { color: '#ffd34d' });
          else { d.zoneW *= 0.8; d.speed *= 1.25; d.zoneX = U.rand(0.1, 0.9 - d.zoneW); }
        } else { Sound.sfx.error(); d.fb = U.pick(['FALSCH!', 'WRONG!', 'ŠPATNĚ!']); d.fbCol = '#ff5a5a'; d.fbT = 0.7; Game.shake(2, 0.15); }
      }
    },
    draw(ctx, A, gt) {
      const d = A.d;
      Sprites.draw(ctx, 'batkova', 90, 210, 'down', 0, 3);
      U.panel(ctx, 150, 80, 300, 120);
      U.text(ctx, 'PODEPIŠ SE JAKO:', 300, 88, { size: 11, align: 'center', color: '#bfb3d6', outline: false });
      U.text(ctx, d.words[Math.min(d.ok, 2)], 300, 100, { size: 20, font: 'Silkscreen', align: 'center', color: '#ffe14d' });
      const bx = 170, by = 140, bw = 260;
      R(ctx, bx - 2, by - 2, bw + 4, 20, '#ffffff'); R(ctx, bx, by, bw, 16, '#3a2238');
      R(ctx, bx + d.zoneX * bw, by, d.zoneW * bw, 16, '#2ecc71'); R(ctx, bx + d.zoneX * bw, by, d.zoneW * bw, 2, '#7dffb0');
      R(ctx, bx + d.pos * bw - 1, by - 6, 3, 28, '#ffffff'); R(ctx, bx + d.pos * bw - 3, by - 8, 7, 3, '#ffe14d');
      U.text(ctx, '[E] PODEPSAT', 300, 166, { size: 11, align: 'center', color: '#ffffff', outline: false });
      for (let i = 0; i < 3; i++) R(ctx, 270 + i * 22, 184, 16, 6, i < d.ok ? '#49e08a' : '#4a4060');
      if (d.fbT > 0) U.text(ctx, d.fb, 300, 60 - (0.8 - d.fbT) * 10, { size: 16, font: 'Silkscreen', align: 'center', color: d.fbCol, ow: 1 });
    },
  };

  // ---------------------------------------------------------
  // 9) FINÁLNÍ BOSS — MATURITA.EXE
  // ---------------------------------------------------------
  const PHASE_NAMES = ['EXCELOVÉ BUŇKY', 'MATEMATIKA', 'DAŇOVÉ PŘIZNÁNÍ', 'C# CHYBY', 'JAZYKOVÉ BUBLINY'];
  const TAUNTS = ['Excelové buňky! Neutečeš tabulce!', 'Matematika! Ta ze zkoušky nikdy neodejde!', 'Daňové přiznání! Termín byl včera!', 'Kompilační chyby! Středník tě nezachrání!', 'Sprechen Sie PANIKA?!'];
  const ERRORS = ['CS1002: ; expected', 'NullReferenceException', 'StackOverflow', 'error CS0103', 'IndexOutOfRange', 'Segmentation fault'];
  const boss = {
    music: null, start: [240, 238], bounds: { y0: 140, y1: 244 },
    hud: A => A.d.phase === 'fight' ? `SEBER VYSVĚDČENÍ  ${A.d.got}/5   ·   ÚTOK: ${PHASE_NAMES[Math.min(A.d.got, 4)]}` : '',
    bg(g) {
      for (let y = 18; y < 270; y += 4) { R(g, 0, y, 480, 4, '#3a2a1e'); R(g, 0, y + 3, 480, 1, '#2e2118'); }
      for (let y = 18, r = 0; y < 270; y += 4, r++) for (let x = (r * 23) % 40; x < 480; x += 40) R(g, x, y, 1, 3, '#2a1d14');
      R(g, 0, 18, 480, 40, '#2a2238'); R(g, 0, 56, 480, 4, '#5a4636');
      R(g, 140, 22, 200, 14, '#b0242c'); T(g, 'MATURITA', 240, 23, 11, '#ffd84a', 'center', 'Silkscreen');
      for (let y = 60; y < 270; y += 8) R(g, 222, y, 36, 8, y % 16 ? '#8a1e24' : '#7a1a20');
      BG.vignette(g, 0.65);
    },
    init(A) {
      A.d = { phase: 'intro', got: 0, bossY: -120, hurt: 0, objs: [], cert: null, certWait: 0, say: '', sayT: 0, atk: 0, atk2: 0, commX: 0, committee: true, rage: 0, diploma: -40 };
      Game.cutscene = true;
      Sound.stopMusic();
      Dialogue.start([
        L('komise', 'Dobrý den. Posaďte se a vylosujte si otázku.'),
        L('player', 'Číslo… třináct.'),
        L('komise', 'Otázka číslo 13: Vysvětlete, proč jste celé čtyři roky—'),
        { wait: 0.9, fx() { Game.glitchT = 1; Sound.sfx.glitch(); Game.shake(4, 0.5); } },
        L('maturitron', 'POČKAT.', { mood: 'normal' }),
        L('maturitron', 'TY CHCEŠ OPRAVDU ODMATUROVAT?'),
        L('maturitron', 'VŽDYŤ JSI CELOU HRU JEN UTÍKAL!'),
        L('player', '…to je taky dovednost. Měkká.'),
        L('maturitron', 'KOMISE, ODCHOD NA OBĚD. TUHLE ZKOUŠKU POVEDU JÁ.'),
        { wait: 1.4, fx() { A.d.phase = 'leave'; Sound.sfx.whoosh(); } },
      ], () => { A.d.phase = 'rise'; A.d.riseT = 0; Sound.sfx.bossIntro(); Game.shake(6, 1.6); Director.sayNow('MATURITA.EXE spuštěna. Bez taháku. Bez slitování.'); });
    },
    cutscene(A, dt) {
      const d = A.d;
      if (d.phase === 'leave') d.commX += dt * 220;
    },
    spawnCert(A) { A.d.cert = A.farSpot(120, { x0: 40, y0: 150, x1: 440, y1: 245 }); },
    clearObjs(A) { for (const o of A.d.objs) Game.burst(o.x, o.y, '#ffffff', 4); A.d.objs = []; },
    update(A, dt) {
      const d = A.d;
      d.hurt -= dt; d.sayT -= dt;
      if (d.phase === 'leave') { d.commX += dt * 220; return; }
      if (d.phase === 'rise') {
        d.riseT += dt; d.committee = false;
        d.bossY = U.lerp(-120, 34, Math.min(1, d.riseT / 1.4));
        if (d.riseT > 2.6) {
          d.phase = 'fight'; Game.cutscene = false; Sound.playMusic('boss');
          d.say = TAUNTS[0]; d.sayT = 2.5; this.spawnCert(A);
        }
        return;
      }
      if (d.phase !== 'fight') return;
      const ph = Math.min(d.got, 4);
      const objs = d.objs;
      d.atk -= dt; d.atk2 -= dt;
      // --- útoky podle fáze
      if (ph === 0) {
        if (!d.lanes) {
          d.lanes = [];
          [[168, 1, 82], [206, -1, 96]].forEach(([y, dir, sp]) => { for (let i = 0; i < 4; i++) objs.push({ k: 'cell', x: i * 160 + U.rand(0, 40), y, dir, sp, text: U.pick(FORMULAS) }); });
          d.lanes = true;
        }
      } else if (ph === 1) {
        if (d.atk <= 0) { d.atk = 0.4; const x = U.rand(20, 460); objs.push({ k: 'sym', s: U.pick(SYMS), x, y: 100, vx: (A.p.x - x) * 0.15, vy: U.rand(85, 120) }); }
        if (d.atk2 <= 0) { d.atk2 = 2.6; for (let i = 0; i < 8; i++) { const a = Math.PI * (0.15 + i * 0.1); objs.push({ k: 'sym', s: U.pick(SYMS), x: 240, y: 110, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 }); } }
      } else if (ph === 2) {
        if (!d.taxers) { d.taxers = true; objs.push({ k: 'tax', x: 60, y: 150, sp: 40 }, { k: 'tax', x: 420, y: 150, sp: 48 }); }
        if (d.atk <= 0) { d.atk = 1.1; objs.push({ k: 'inv', x: U.rand(30, 450), y: 100, vy: U.rand(60, 90), label: U.pick(['FAKTURA', 'DPH', 'PENÁLE']) }); }
      } else if (ph === 3) {
        if (d.atk <= 0) {
          d.atk = 1.35;
          const bx = 240, by = 112, dx = A.p.x - bx, dy = A.p.y - 8 - by, base = Math.atan2(dy, dx);
          for (let i = -1; i <= 1; i++) { const a = base + i * 0.28; objs.push({ k: 'err', text: U.pick(ERRORS), x: bx, y: by, vx: Math.cos(a) * 92, vy: Math.sin(a) * 92 }); }
          Sound.sfx.error();
        }
      } else {
        if (d.atk <= 0) { d.atk = 0.34; const t = U.pick(WORDS); objs.push({ k: 'bub', text: t, x: U.rand(40, 440), y: 110, vy: U.rand(70, 105), ph: U.rand(0, 6), col: LANGCOL(t) }); }
      }
      // --- pohyb a kolize
      for (const o of objs) {
        if (o.k === 'cell') {
          o.x += o.dir * o.sp * dt; if (o.x > 540) o.x -= 640; if (o.x < -100) o.x += 640;
          if (A.touchRect(o.x, o.y - 8, 58, 16)) A.hurt(3, o.x + 29, o.y);
        } else if (o.k === 'sym') {
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (A.touch(o.x, o.y, 6) && A.hurt(3, o.x, o.y)) o.dead = true;
        } else if (o.k === 'tax') {
          const dx = A.p.x - o.x, dy = A.p.y - 14 - o.y, dd = Math.hypot(dx, dy) || 1;
          o.x += dx / dd * o.sp * dt; o.y += dy / dd * o.sp * dt;
          if (A.touchRect(o.x - 14, o.y - 18, 28, 36) && A.hurt(3, o.x, o.y)) { o.x = o.x < 240 ? 460 : 20; o.y = 150; }
        } else if (o.k === 'inv') {
          o.y += o.vy * dt;
          if (A.touchRect(o.x - 15, o.y - 8, 30, 16) && A.hurt(3, o.x, o.y)) o.dead = true;
        } else if (o.k === 'err') {
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (!o.w) { const c = document.createElement('canvas').getContext('2d'); c.font = U.font(8); o.w = c.measureText(o.text).width + 6; }
          if (A.touchRect(o.x - o.w / 2, o.y - 5, o.w, 10) && A.hurt(3, o.x, o.y)) o.dead = true;
        } else if (o.k === 'bub') {
          o.y += o.vy * dt; o.x += Math.sin(A.t * 2 + o.ph) * 20 * dt;
          if (!o.w) { const c = document.createElement('canvas').getContext('2d'); c.font = U.font(9, undefined, U.needsBig(o.text) ? 30 / RS.s : 0); o.w = c.measureText(o.text).width + 8; }
          if (A.touchRect(o.x - o.w / 2, o.y - 7, o.w, 14) && A.hurt(3, o.x, o.y)) o.dead = true;
        }
      }
      d.objs = objs.filter(o => !o.dead && o.y < 300 && o.x > -150 && o.x < 640 && o.y > 40);
      // --- vysvědčení
      if (d.certWait > 0) { d.certWait -= dt; if (d.certWait <= 0) this.spawnCert(A); }
      const c = d.cert;
      if (c && A.touch(c.x, c.y, 10)) {
        d.cert = null; d.got++; d.hurt = 0.7; Game.shake(6, 0.4); Sound.sfx.explosion(); Game.burst(c.x, c.y, '#fff7e0', 22); Game.flash('#ffffff', 0.2);
        if (d.got >= 5) {
          d.objs = []; d.phase = 'dead';
          A.win('MATURITA.EXE PŘESTAL PRACOVAT', '…a ty jsi právě odmaturoval.', { color: '#ffd34d', dur: 4.2, y: 200 });
        } else {
          this.clearObjs(A); d.lanes = null; d.taxers = null; d.atk = 1.2; d.atk2 = 2;
          d.say = TAUNTS[d.got]; d.sayT = 2.5; d.certWait = 1.1; d.rage = d.got >= 3 ? 1 : 0;
          Director.say(U.pick(['AU! To bylo moje vysvědčení!', 'Přestaň sbírat dokumenty!', 'Tohle není fér. Teda je. Ale nelíbí se mi to.', 'Načítám plán B… plán B je plán A, ale hlasitěji.']));
        }
      }
    },
    updateWin(A, dt) {
      const b = A.banner;
      if (b.t < 2 && Math.random() < dt * 18) { Game.burst(240 + U.rand(-60, 60), 70 + U.rand(-30, 40), U.pick(['#ff5a3a', '#ffd34d', '#ffffff', '#49e08a']), 16); Game.shake(4, 0.15); if (Math.random() < 0.3) Sound.sfx.explosion(); }
      if (b.t > 1.8 && Math.random() < dt * 30) Game.confetti(U.rand(40, 440), U.rand(30, 100), 3);
      A.d.diploma = Math.min(135, A.d.diploma + dt * 70 * (b.t > 1.6 ? 1 : 0));
    },
    draw(ctx, A, gt) {
      const d = A.d;
      // stůl komise
      if (d.phase === 'intro' || d.phase === 'leave') {
        for (let i = 0; i < 3; i++) {
          const dir = i === 0 ? -1 : 1, x = 190 + i * 50 + (d.phase === 'leave' ? dir * d.commX : 0);
          Sprites.draw(ctx, 'komise', x, 100, d.phase === 'leave' ? (dir < 0 ? 'left' : 'right') : 'down', d.phase === 'leave' ? 1 + ((gt * 10 | 0) % 2) : 0, 1.5);
        }
      }
      R(ctx, 160, 98, 160, 16, '#1f6b3a'); R(ctx, 160, 98, 160, 2, '#2e8a50'); R(ctx, 160, 112, 160, 4, '#17552d');
      if (d.phase !== 'intro' && d.phase !== 'leave') {
        if (!(d.phase === 'dead' && A.banner && A.banner.t > 1.6)) Sprites.maturitaBoss(ctx, 240, d.bossY, gt, d.hurt, A.p.x, A.p.y, d.rage);
        if (d.phase === 'fight' || d.phase === 'dead') {
          R(ctx, 160, 24, 160, 8, Sprites.OUT); R(ctx, 161, 25, 158 * (5 - d.got) / 5, 6, '#ff3b3b');
        }
      }
      if (d.phase === 'rise' && d.riseT > 1.2) {
        const k = Math.min(1, (d.riseT - 1.2) / 0.3);
        R(ctx, 0, 150, 480, 44, `rgba(0,0,0,${0.7 * k})`);
        U.text(ctx, 'MATURITA.EXE', 240 + (1 - k) * 300, 154, { size: 26, font: 'Silkscreen', align: 'center', color: '#ff3b3b', ow: 1.2 });
        U.text(ctx, 'FINÁLNÍ ZKOUŠKA · BEZ TAHÁKU', 240 - (1 - k) * 300, 180, { size: 11, align: 'center', color: '#ffffff' });
      }
      // vysvědčení
      if (d.cert) {
        const c = d.cert, b = Math.sin(gt * 4) * 2;
        ctx.fillStyle = `rgba(255,247,224,${0.25 + Math.sin(gt * 6) * 0.15})`; ctx.fillRect(c.x - 11, c.y - 10 + b, 22, 20);
        Sprites.drawArt(ctx, 'cert', c.x, c.y + b, 1.5);
      }
      for (const o of d.objs) {
        if (o.k === 'cell') {
          R(ctx, o.x - 1, o.y - 9, 60, 18, Sprites.OUT); R(ctx, o.x, o.y - 8, 58, 16, '#ffffff'); R(ctx, o.x, o.y - 8, 58, 2, '#1d7044');
          U.text(ctx, o.text, o.x + 29, o.y - 6, { size: 9, align: 'center', color: o.text[0] === '#' ? '#c0392b' : '#1d7044', outline: false });
        } else if (o.k === 'sym') U.text(ctx, o.s, o.x, o.y - 7, { size: 13, align: 'center', color: '#ffe9a0', ow: 1 });
        else if (o.k === 'tax') { Sprites.paper(ctx, o.x, o.y, 'DAŇ', 28, 36, '#fff3e0', '#8a1010'); R(ctx, o.x - 7, o.y + 2, 3, 3, '#111'); R(ctx, o.x + 4, o.y + 2, 3, 3, '#111'); }
        else if (o.k === 'inv') Sprites.paper(ctx, o.x, o.y, o.label, 30, 16);
        else if (o.k === 'err') { R(ctx, o.x - (o.w || 60) / 2 - 1, o.y - 6, (o.w || 60) + 2, 12, '#ff3b3b'); R(ctx, o.x - (o.w || 60) / 2, o.y - 5, o.w || 60, 10, '#2a0a0a'); U.text(ctx, o.text, o.x, o.y - 5, { size: 8, align: 'center', color: '#ff8080', outline: false }); }
        else if (o.k === 'bub') Sprites.bubble(ctx, o.x, o.y, o.text, 9, o.col);
      }
      if (d.sayT > 0 && d.phase === 'fight') Sprites.bubble(ctx, 380, 40, d.say, 9, '#8a1010');
    },
    drawTop(ctx, A, gt) {
      const d = A.d;
      if (d.phase === 'dead' && A.banner && A.banner.t > 1.6) {
        const y = d.diploma;
        ctx.save(); ctx.translate(240, y); ctx.rotate(Math.sin(gt * 2) * 0.08 * Math.max(0, 1 - (y / 135)));
        Sprites.diploma(ctx, 0, 0, 2); ctx.restore();
      }
    },
  };

  return { semicolon, ram, babel, book, excel, economy, olga, qte, boss };
})();
