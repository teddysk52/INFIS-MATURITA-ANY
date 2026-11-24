'use strict';
// =============================================================
//  minigames.js — všechny mini-hry. Nikde se nezkouší znalosti:
//  jen pohyb, uhýbání, sbírání a načasování. Zásah = −2/−3 s.
// =============================================================
const MiniGames = (() => {
  const P = () => Game.player;
  const rndIn = (b, m = 0.8) => [U.rand(b.x0 + m, b.x1 - m), U.rand(b.z0 + m, b.z1 - m)];
  function farFromPlayer(b, minD = 3, m = 0.8) {
    for (let k = 0; k < 30; k++) { const p = rndIn(b, m); if (Math.hypot(p[0] - P().x, p[1] - P().z) > minD) return p; }
    return rndIn(b, m);
  }
  // padající věc s varováním na zemi
  function dropHazard(A, x, z, spr, o = {}) {
    return Ents.add(Object.assign({ tag: 'arena', kind: 'hazard', spr, x, z, y: o.y || 7, vy: -(o.speed || 4.5), w: o.w || 0.9, r: o.r || 0.5, floor: 0, warn: true, life: o.life || 6, armT: 0, dmg: o.dmg || 2,
      onLand: (e) => { e.kind = 'deco'; e.life = e.t + 0.35; Ents.burst(e.x, 0.3, e.z, o.burst || '#ffffff', 6, { up: 2, speed: 2 }); } }, o.extra || {}));
  }
  function aimAt(e, speed) { const dx = P().x - e.x, dz = P().z - e.z, d = Math.hypot(dx, dz) || 1; e.vx = dx / d * speed; e.vz = dz / d * speed; }
  // honí hráče; po zásahu (e.cool) na chvíli ustoupí, aby nezasahoval pořád dokola
  function chase(e, speed, dt, turn = 3) {
    const dx = P().x - e.x, dz = P().z - e.z, d = Math.hypot(dx, dz) || 1;
    let s = speed;
    if (e.cool > 0) { e.cool -= dt; s = -speed * 0.9; turn = 8; }
    e.vx = U.smooth(e.vx, dx / d * s, turn, dt); e.vz = U.smooth(e.vz, dz / d * s, turn, dt);
  }
  function bounceIn(e, b) {
    if (e.x < b.x0 + e.r) { e.x = b.x0 + e.r; e.vx = Math.abs(e.vx); } if (e.x > b.x1 - e.r) { e.x = b.x1 - e.r; e.vx = -Math.abs(e.vx); }
    if (e.z < b.z0 + e.r) { e.z = b.z0 + e.r; e.vz = Math.abs(e.vz); } if (e.z > b.z1 - e.r) { e.z = b.z1 - e.r; e.vz = -Math.abs(e.vz); }
  }

  // ---------------------------------------------------------
  //  1) HOJER — uprchlý středník
  // ---------------------------------------------------------
  const semicolon = {
    title: 'CHYŤ STŘEDNÍK!', hint: 'Doběhni ho (SHIFT = sprint). Je rychlý, ale hloupý.', room: 'cs', music: 'arena',
    init(A) { A.data.caught = 0; spawnSemi(A); },
    update(A, dt) {
      const e = A.data.e;
      if (!e) return;
      const d = Math.hypot(e.x - P().x, e.z - P().z);
      // středník uskočí na volné místo (max. 2×), pak je unavený a dá se chytit
      e.rest -= dt;
      if (e.dash) {
        const k = Math.min(1, (e.t - e.dashT) / 0.45);
        e.x = U.lerp(e.fx, e.tx, k); e.z = U.lerp(e.fz, e.tz, k); e.y = 1.1 + Math.sin(k * Math.PI) * 1.4;
        if (k >= 1) { e.dash = false; e.rest = 0.5; }
      } else {
        e.y = 1.0 + Math.abs(Math.sin(A.t * 6)) * (e.energy > 0 ? 0.5 : 0.12);
        if (d < 2.4 && e.energy > 0 && e.rest <= 0) {
          const t = freeSpot(A.bounds, 4);
          Object.assign(e, { dash: true, dashT: e.t, fx: e.x, fz: e.z, tx: t[0], tz: t[1] }); e.energy--;
          Sound.sfx.whoosh();
          UI.floatText(e.x, 2.1, e.z, e.energy > 0 ? 'NOPE!' : 'už nemůžu…', '#ffd23f');
        }
      }
      A.hint = e.energy > 0 ? `Doběhni ho (SHIFT = sprint). Ještě ${e.energy}× uskočí.` : 'Středník je unavený — TEĎ HO CHYŤ!';
      A.prog = A.data.caught / 3;
    },
  };
  // volné místo na zemi (ne ve stolech), daleko od hráče
  function freeSpot(b, minD) {
    for (let k = 0; k < 60; k++) { const p = rndIn(b, 0.7); if (!Col.hitCircle(p[0], p[1], 0.45) && Math.hypot(p[0] - P().x, p[1] - P().z) > minD) return p; }
    for (let k = 0; k < 60; k++) { const p = rndIn(b, 0.7); if (!Col.hitCircle(p[0], p[1], 0.45)) return p; }
    return rndIn(b);
  }
  function spawnSemi(A) {
    const [x, z] = freeSpot(A.bounds, 4);
    A.data.e = Ents.add({ tag: 'arena', kind: 'pickup', spr: 'semicolon', x, z, y: 1, w: 0.85, r: 0.75, energy: 2, rest: 0.8, dash: false,
      onPick(e) {
        A.data.caught++; Sound.sfx.collect(); Game.shake(0.15, 0.2);
        UI.floatText(e.x, 2, e.z, A.data.caught < 3 ? 'error CS1002: ; expected' : ';', '#ffd23f');
        Ents.burst(e.x, 1, e.z, '#ffd23f', 18);
        if (A.data.caught >= 3) { A.data.e = null; A.prog = 1; Ents.confetti(A.room.cx, 3, A.room.cz, 220, 6); Arena.win('BUILD SUCCESSFUL', '#3cff7a', '0 errors · 1 warning: student'); Achievements.unlock('build'); }
        else spawnSemi(A);
      } });
  }

  // ---------------------------------------------------------
  //  2) HORVÁTH — RAM moduly (+ rohlík DDR5)
  // ---------------------------------------------------------
  const ram = {
    title: 'NAJDI RAM MODULY', hint: 'Seber 4 RAMky. Pozor na elektrostatické výboje (ESD)!', room: 'hw',
    init(A) {
      A.data.got = 0; A.data.rohlik = false;
      for (let k = 0; k < 4; k++) spawnRam(A, k);
      for (let k = 0; k < 3; k++) { const [x, z] = farFromPlayer(A.bounds, 3); Ents.add({ tag: 'arena', kind: 'hazard', spr: 'esd', x, z, y: 1, w: 0.5, r: 0.35, vx: U.rand(-1.6, 1.6), vz: U.rand(-1.6, 1.6), bob: 0.3, dieOnHit: false, upd: (e) => bounceIn(e, A.bounds) }); }
    },
    update(A) {
      A.prog = (A.data.got + (A.data.rohlik ? 1 : 0)) / 5;
      if (A.data.got >= 4 && !A.data.rohlik && !A.data.rSpawned) {
        A.data.rSpawned = true; A.hint = 'Detekován 5. modul… vypadá jako pečivo.';
        const [x, z] = freeSpot(A.bounds, 3);
        Ents.add({ tag: 'arena', kind: 'pickup', spr: 'rohlik', x, z, y: 1.1, w: 0.8, r: 0.6, bob: 0.25, spin: 0,
          onPick(e) {
            A.data.rohlik = true; A.prog = 1; Sound.sfx.powerup();
            UI.floatText(e.x, 2.2, e.z, 'NOVÝ HARDWARE DETEKOVÁN: ROHLÍK DDR5', '#ffd23f', 2.2);
            Achievements.unlock('rohlik');
            Arena.win('ROHLÍK DDR5', '#ffd23f', 'latence: nízká · chuť: vysoká');
          } });
      }
    },
  };
  function spawnRam(A, k) {
    const [x, z] = freeSpot(A.bounds, 2.5);
    Ents.add({ tag: 'arena', kind: 'pickup', spr: 'ram', x, z, y: 1.1, w: 0.75, r: 0.6, bob: 0.25, rot: 0, ox: x, oz: z, ph: k * 1.7,
      upd(e) { e.x = e.ox + Math.sin(e.t * 1.3 + e.ph) * 0.35; e.z = e.oz + Math.cos(e.t * 1.1 + e.ph) * 0.25; },
      onPick(e) { A.data.got++; Sound.sfx.collect(); UI.floatText(e.x, 2, e.z, `+${[8, 16, 32, 64][A.data.got - 1] || 8} GB`, '#3cff7a'); Ents.burst(e.x, 1, e.z, '#3cff7a', 12); } });
  }

  // ---------------------------------------------------------
  //  3) BAŤKOVÁ — jazykový chaos (padající bubliny, dojdi k východu)
  // ---------------------------------------------------------
  const BUBBLES = ['HELLO', 'GUTEN TAG', 'DOBRÝ DEN', 'WHY ARE YOU RUNNING?', 'ACHTUNG!', 'SORRY', 'DER DIE DAS', 'HOW ARE YOU?', 'TSCHÜSS', 'AHOJ'];
  const babel = {
    title: 'JAZYKOVÝ CHAOS', hint: 'Uhýbej bublinám! Východ se načítá…', room: 'lang', music: 'arena',
    init(A) {
      A.data.spawn = 0; A.data.load = 0;
      const r = A.room; A.data.exit = { x: r.x0 + 1.0, z: r.z0 + 1.0 };
      A.data.sign = Ents.add({ tag: 'arena', kind: 'deco', spr: 'exit_lang', x: A.data.exit.x + 0.6, z: A.data.exit.z, y: 2.4, w: 2.6, shadow: false });
      A.data.portal = null;
    },
    update(A, dt) {
      const LOAD = 13;
      A.data.load = Math.min(1, A.t / LOAD);
      A.data.spawn -= dt;
      if (A.data.spawn <= 0 && A.data.load < 1.2) {
        A.data.spawn = Math.max(0.28, 0.6 - A.t * 0.02);
        const near = U.chance(0.3);
        const x = near ? U.clamp(P().x + U.rand(-1.5, 1.5), A.bounds.x0 + 1, A.bounds.x1 - 1) : U.rand(A.bounds.x0 + 1, A.bounds.x1 - 1);
        const z = near ? U.clamp(P().z + U.rand(-1.5, 1.5), A.bounds.z0 + 1, A.bounds.z1 - 1) : U.rand(A.bounds.z0 + 1, A.bounds.z1 - 1);
        dropHazard(A, x, z, 'b_' + U.pick(BUBBLES), { w: 1.7, r: 0.6, speed: 3.2, burst: '#ffffff' });
      }
      if (A.data.load < 1) { A.hint = `Uhýbej bublinám! Východ se načítá… ${Math.floor(A.data.load * 100)} %`; A.prog = A.data.load; }
      else {
        if (!A.data.portal) { A.data.portal = Ents.add({ tag: 'arena', kind: 'deco', spr: 'portal', x: A.data.exit.x, z: A.data.exit.z, y: 1.1, w: 1.3, shadow: false }); Sound.sfx.teleport(); A.hint = 'VÝCHOD NAČTEN! Běž k němu (vlevo vzadu).'; }
        A.prog = 1;
        if (Math.hypot(P().x - A.data.exit.x, P().z - A.data.exit.z) < 1.1) { Achievements.unlock('polyglot'); Arena.win('AUF WIEDERSEHEN!', '#ffcf3f', 'Goodbye · Nashle · Tschüss'); }
      }
    },
  };

  // ---------------------------------------------------------
  //  4) JANDA — útěk z knihy (bludiště)
  // ---------------------------------------------------------
  const book = {
    title: 'ÚTĚK Z KNIHY', hint: 'Najdi KONEC KAPITOLY (vpravo). Knihy tě honí!', world: 'book', music: 'olga',
    init(A) {
      const w = Arena.WORLDS.book;
      Game.teleport(w.x0 + 2, 0, Math.PI / 2);
      A.data.exit = { x: w.x1 - 2, z: w.z0 + 2 + 4 * U.randi(0, 4) };
      Ents.add({ tag: 'arena', kind: 'deco', spr: 'exit_book', x: A.data.exit.x, z: A.data.exit.z, y: 2.6, w: 3, shadow: false });
      A.data.portal = Ents.add({ tag: 'arena', kind: 'deco', spr: 'portal', x: A.data.exit.x, z: A.data.exit.z, y: 1.1, w: 1.3, shadow: false });
      for (let k = 0; k < 3; k++) {
        Ents.add({ tag: 'arena', kind: 'hazard', spr: 'book', x: w.x1 - 6 - k * 7, z: U.rand(w.z0 + 2, w.z1 - 2), y: 1.3, w: 0.8, r: 0.45, bob: 0.3, dieOnHit: false, armT: 1.5,
          upd(e, dt) { chase(e, 2.1 + A.t * 0.03, dt, 1.5); },
          onHit(e) { UI.floatText(P().x, 2, P().z, 'SPOILER!', '#ff8a8a'); } });
      }
      A.data.limit = 40;
    },
    update(A) {
      const d = Math.hypot(P().x - A.data.exit.x, P().z - A.data.exit.z);
      A.prog = Math.min(1, A.t / A.data.limit);
      A.hint = `Najdi KONEC KAPITOLY (žlutý nápis vpravo). Strana ${Math.min(999, 12 + Math.floor(A.t * 7))}`;
      if (A.t > A.data.limit && !A.data.helped) { A.data.helped = true; Col.removeExtra('book'); UI.big('NUDNÁ KAPITOLA PŘESKOČENA', 1.6, '#ffcf3f'); A.hint = 'Zdi knihy se rozpadly. Běž rovnou k východu!'; }
      if (d < 1.3) { Achievements.unlock('kapitola'); Arena.win('KONEC KAPITOLY', '#ffcf3f', 'Rozbor na 4 strany do pátku.'); }
    },
  };

  // ---------------------------------------------------------
  //  5) PRYNYCH — EXCEL APOCALYPSE (boss EXCEL.EXE)
  // ---------------------------------------------------------
  const ERRS = ['#REF!', '#HODNOTA!', '#DĚLENÍ_NULOU!', '#NÁZEV?', '=SUMA(BOLEST)'];
  const excel = {
    title: 'EXCEL APOCALYPSE', hint: 'Seber 3 zlaté diskety. Vyhýbej se buňkám a chybám!', world: 'excel', music: 'boss',
    init(A) {
      const w = Arena.WORLDS.excel;
      Game.teleport(w.ox, w.z1 - 3, Math.PI);
      A.data.got = 0; A.data.shoot = 2; A.data.bossHit = 0;
      // posuvné řádky buněk
      A.data.rows = [];
      for (let k = 0; k < 5; k++) {
        const z = w.z0 + 4 + k * 4.2;
        A.data.rows.push({ z, x: U.rand(w.x0 + 2, w.x1 - 2), dir: k % 2 ? 1 : -1, sp: 4 + k * 0.7, len: U.randi(2, 3) });
      }
      for (let k = 0; k < 3; k++) spawnFloppy(A, k);
      // honící Excel ikonky
      for (let k = 0; k < 2; k++) Ents.add({ tag: 'arena', kind: 'hazard', spr: 'excel', x: w.x0 + 4 + k * 26, z: w.z0 + 3, y: 1.2, w: 0.7, r: 0.4, bob: 0.2, dieOnHit: false, armT: 2,
        upd(e, dt) { chase(e, 2.6, dt, 2); } });
      UI.big('VŠECHNO JE TABULKA.', 2, '#3cff7a', 'EXCEL.EXE se probudil');
    },
    update(A, dt) {
      const w = Arena.WORLDS.excel;
      A.prog = A.data.got / 3;
      A.data.bossHit = Math.max(0, A.data.bossHit - dt);
      // buňky
      for (const r of A.data.rows) {
        r.x += r.dir * r.sp * dt;
        if (r.x > w.x1 + 4) r.x = w.x0 - 4 - r.len * 2; if (r.x < w.x0 - 4 - r.len * 2) r.x = w.x1 + 4;
        for (let k = 0; k < r.len; k++) {
          const cx = r.x + k * 2 * (r.dir > 0 ? -1 : 1);
          if (Math.abs(P().x - cx) < 1.25 && Math.abs(P().z - r.z) < 0.85 && P().y < 1.1) {
            if (Game.hurt(2, null)) { Game.push(0, (P().z > r.z ? 1 : -1) * 6); UI.floatText(P().x, 2, P().z, '=SUMA(AU)', '#3cff7a'); }
          }
        }
      }
      // boss střílí chyby
      A.data.shoot -= dt;
      if (A.data.shoot <= 0) {
        A.data.shoot = Math.max(1.1, 2.2 - A.t * 0.03);
        const bx = w.ox + Math.sin(A.t * 0.6) * 10, bz = w.z0 + 1;
        const e = Ents.add({ tag: 'arena', kind: 'hazard', spr: 'x_' + U.pick(ERRS), x: bx, z: bz, y: 1.4, w: 2.0, r: 0.6, life: 7, dmg: 2 });
        aimAt(e, 6.5);
        Sound.sfx.error();
      }
    },
    draw(A) {
      const w = Arena.WORLDS.excel;
      for (const r of A.data.rows) for (let k = 0; k < r.len; k++) Arena.drawCell(r.x + k * 2 * (r.dir > 0 ? -1 : 1), r.z);
      Arena.drawExcelBoss(w.ox + Math.sin(A.t * 0.6) * 10, 5 + Math.sin(A.t * 2) * 0.4, w.z0 - 1, A.t, A.data.bossHit);
      // záhlaví
      for (let i = 0; i < 18; i++) GFX.decal(Spr.get('col_' + i), w.x0 + 1 + i * 2, 0.42, w.z0 - 1, 0.7, 0.8);
      for (let j = 1; j <= 26; j++) GFX.decal(Spr.get('row_' + j), w.x0 - 1, 0.42, w.z0 + j - 0.5, 0.6, 0.6);
    },
  };
  function spawnFloppy(A, k) {
    const w = Arena.WORLDS.excel;
    const x = w.x0 + 5 + k * 13 + U.rand(-2, 2), z = U.rand(w.z0 + 3, w.z1 - 6);
    Ents.add({ tag: 'arena', kind: 'pickup', spr: 'floppy', x, z, y: 1.1, w: 0.75, r: 0.6, bob: 0.25,
      onPick(e) {
        A.data.got++; A.data.bossHit = 0.4; Sound.sfx.powerup(); Game.shake(0.3, 0.3);
        UI.floatText(e.x, 2, e.z, `ULOŽENO ${A.data.got}/3`, '#ffcf3f');
        if (A.data.got >= 3) { Achievements.unlock('excel_trauma'); Ents.confetti(w.ox, 6, w.z0, 200, 8); Arena.win('#HODNOTA!', '#3cff7a', 'EXCEL.EXE neodpovídá'); }
      } });
  }

  // ---------------------------------------------------------
  //  6) LÁĎMAN — mince vs. faktury + Finanční úřad
  // ---------------------------------------------------------
  const economy = {
    title: 'VYROVNEJ ROZVAHU', hint: 'Sbírej mince (aktiva), uhýbej fakturám (pasiva).', room: 'eco', music: 'arena',
    init(A) { A.data.coins = 0; A.data.spawn = 0.3; A.data.tax = null; },
    update(A, dt) {
      const NEED = 10;
      A.prog = A.data.coins / NEED;
      A.data.spawn -= dt;
      if (A.data.spawn <= 0) {
        A.data.spawn = 0.42;
        const [x, z] = freeSpot(A.bounds, 0);
        if (U.chance(0.55)) Ents.add({ tag: 'arena', kind: 'pickup', spr: 'coin', x, z, y: 6, vy: -3.2, floor: 0, w: 0.55, r: 0.55, life: 7, spin: 4,
          onLand(e) { e.vy = 0; },
          onPick(e) { A.data.coins++; Sound.sfx.coin(); UI.floatText(e.x, 1.8, e.z, '+1 000 Kč', '#ffd84a'); } });
        else dropHazard(A, x, z, 'invoice', { w: 0.7, r: 0.5, speed: 3.6, burst: '#ffffff' });
      }
      if (A.data.coins >= 5 && !A.data.tax) {
        UI.big('FINANČNÍ ÚŘAD TĚ NAŠEL.', 2, '#ff4d5e'); Sound.sfx.alarm(); Game.shake(0.4, 0.5);
        const r = A.room;
        A.data.tax = Ents.add({ tag: 'arena', kind: 'hazard', spr: 'tax_big', x: r.x0 + 1, z: r.z0 + 1, y: 1.5, w: 2.6, r: 0.9, dieOnHit: false, dmg: 3, armT: 1.2,
          upd(e, dt) { chase(e, 2.3, dt, 2); },
          onHit(e) { UI.floatText(P().x, 2.2, P().z, 'PENÁLE!', '#ff4d5e'); } });
        A.hint = 'Daňové přiznání tě honí! Pořád sbírej mince.';
      }
      if (A.data.coins >= NEED) { Achievements.unlock('rozvaha'); Arena.win('ROZVAHA SEDÍ', '#ffd84a', 'Skoro. Zbytek do ostatních nákladů.'); }
    },
  };

  // ---------------------------------------------------------
  //  7) OLGA BŘÍZOVÁ — přežij matematiku 15 s
  // ---------------------------------------------------------
  const MATH = ['∑', '∫', 'π', '√', '÷', 'x²', '∞', 'sin', '≠', 'Δ'];
  const olga = {
    title: 'MATEMATIKA NIKDY NEKONČÍ', hint: 'Přežij 15 sekund. Žádné počítání. Jen běhání.', room: 'r404', music: 'olga',
    init(A) { A.data.shot = 0; A.data.pat = 0; const o = Game.findNpc('olga'); A.data.src = o ? { x: o.x, z: o.z } : { x: A.room.cx, z: A.room.z1 - 1 }; },
    update(A, dt) {
      const DUR = 15;
      A.prog = A.t / DUR; A.hint = `Přežij ještě ${Math.max(0, Math.ceil(DUR - A.t))} s. Žádné počítání. Jen běhání.`;
      A.data.shot -= dt;
      if (A.data.shot <= 0 && A.t < DUR - 0.5) {
        const pat = Math.floor(A.t / 4) % 3;
        const s = A.data.src;
        if (pat === 0) { // spirála
          A.data.shot = 0.16; A.data.pat += 0.55;
          for (const off of [0, Math.PI]) { const a = A.data.pat + off; Ents.add({ tag: 'arena', kind: 'hazard', spr: 'm_' + U.pick(MATH), x: s.x, z: s.z, y: 1.1, w: 0.55, r: 0.3, vx: Math.cos(a) * 4, vz: Math.sin(a) * 4, life: 4, dmg: 2 }); }
        } else if (pat === 1) { // vějíř na hráče
          A.data.shot = 0.7;
          const base = Math.atan2(P().z - s.z, P().x - s.x);
          for (let k = -2; k <= 2; k++) { const a = base + k * 0.28; Ents.add({ tag: 'arena', kind: 'hazard', spr: 'm_' + U.pick(MATH), x: s.x, z: s.z, y: 1.1, w: 0.55, r: 0.3, vx: Math.cos(a) * 5, vz: Math.sin(a) * 5, life: 4, dmg: 2 }); }
        } else { // déšť π
          A.data.shot = 0.22;
          const [x, z] = rndIn(A.bounds, 0.6);
          dropHazard(A, x, z, 'm_π', { w: 0.7, r: 0.45, speed: 5 });
        }
      }
      if (A.t >= DUR) { Achievements.unlock('matematika'); Arena.win('MATEMATIKA PŘEŽITA', '#ffe27a', 'Za jedna. S hvězdičkou.'); }
    },
  };

  // ---------------------------------------------------------
  //  8) Nágr — opravy reality (není aréna, řeší se na chodbě)
  // ---------------------------------------------------------

  // ---------------------------------------------------------
  //  9) BAŤKOVÁ (4. roč.) — podpis ve 3 jazycích (QTE)
  // ---------------------------------------------------------
  const QTE = (() => {
    let st = null;
    const WORDS = [['UNTERSCHRIFT', 'U'], ['SIGNATURE', 'S'], ['PODPIS', 'P']];
    function start(onDone) {
      st = { k: 0, t: 0, lim: 2.6, onDone, fails: 0 };
      Game.qte = true;
      render();
    }
    function render() {
      const el = document.getElementById('qte'); el.classList.remove('hidden');
      const [w, key] = WORDS[st.k];
      el.innerHTML = `<div class="qw">Rychle! Podepiš se: <b>${w}</b></div><div class="qk">${key}</div><div class="qbar"><i style="width:${(100 - st.t / st.lim * 100).toFixed(0)}%"></i></div>`;
    }
    function update(dt) {
      if (!st) return;
      st.t += dt;
      if (st.t >= st.lim) { st.t = 0; st.fails++; Game.hurt(2, null); Sound.sfx.error(); UI.floatText(P().x, 2, P().z, 'ZEITDRUCK!', '#ff4d5e'); st.lim = Math.min(4, st.lim + 0.5); }
      render();
    }
    function key(code) {
      if (!st) return false;
      const [, k] = WORDS[st.k];
      if (code === 'Key' + k) {
        Sound.sfx.collect(); UI.floatText(P().x, 2.2, P().z, WORDS[st.k][0] + ' ✓', '#3cff7a');
        st.k++; st.t = 0;
        if (st.k >= WORDS.length) { const d = st.onDone; st = null; Game.qte = false; document.getElementById('qte').classList.add('hidden'); d && d(); return true; }
      } else if (/^Key[A-Z]$/.test(code)) { Sound.sfx.error(); st.t += 0.4; }
      return true;
    }
    function abort() { st = null; Game.qte = false; document.getElementById('qte').classList.add('hidden'); }
    return { start, update, key, abort, get active() { return !!st; } };
  })();

  // ---------------------------------------------------------
  //  10) FINÁLE — MATURITA.EXE
  // ---------------------------------------------------------
  const PHASES = [
    { name: 'ÚTOK 1: EXCELOVÉ BUŇKY', col: '#3cff7a' },
    { name: 'ÚTOK 2: MATEMATIKA', col: '#ffe27a' },
    { name: 'ÚTOK 3: DAŇOVÁ PŘIZNÁNÍ', col: '#ff4d5e' },
    { name: 'ÚTOK 4: C# CHYBY', col: '#ff8a8a' },
    { name: 'ÚTOK 5: JAZYKOVÉ BUBLINY', col: '#7fdcff' },
  ];
  const CS_ERR = ['CS1002: ; expected', 'NullReferenceException', 'StackOverflow', 'IndexOutOfRange', 'error CS0103'];
  const boss = {
    title: 'MATURITA.EXE', hint: 'Seber 5 vysvědčení. Uhýbej útokům!', world: 'boss', music: 'boss',
    init(A) {
      const w = Arena.WORLDS.boss;
      Game.teleport(w.ox, w.z1 - 4, Math.PI);
      A.data.got = 0; A.data.phase = -1; A.data.pt = 0; A.data.shot = 0; A.data.rows = []; A.data.hitT = 0; A.data.bx = w.ox; A.data.by = 7;
      Chars.setBossMood('angry');
      Director.sayNow('MATURITA.EXE spuštěna. Bez taháku. Bez slitování.', 'angry');
      nextPhase(A);
    },
    update(A, dt) {
      const w = Arena.WORLDS.boss;
      A.prog = A.data.got / 5;
      A.data.pt += dt; A.data.shot -= dt; A.data.hitT = Math.max(0, A.data.hitT - dt);
      if (A.data.nextT > 0) { A.data.nextT -= dt; if (A.data.nextT <= 0 && !A.data.done) nextPhase(A); }
      A.data.bx = w.ox + Math.sin(A.t * 0.5) * 8; A.data.by = 7 + Math.sin(A.t * 1.6) * 0.6;
      const ph = A.data.phase, bx = A.data.bx, bz = w.z0 + 3;
      // vysvědčení se objeví 3 s po začátku fáze
      if (A.data.pt > 3 && !A.data.certOut && !A.data.certTaken) {
        A.data.certOut = true;
        const [x, z] = farFromPlayer({ x0: w.x0 + 3, x1: w.x1 - 3, z0: w.z0 + 5, z1: w.z1 - 3 }, 7, 0);
        A.data.cert = Ents.add({ tag: 'arena', kind: 'pickup', spr: 'cert', x, z, y: 1.2, w: 0.8, r: 0.7, bob: 0.3,
          onPick(e) {
            A.data.got++; A.data.certTaken = true; A.data.hitT = 0.6; Sound.sfx.powerup(); Game.shake(0.5, 0.4);
            UI.floatText(e.x, 2.2, e.z, `VYSVĚDČENÍ ${A.data.got}/5`, '#ffcf3f');
            Ents.burst(A.data.bx, A.data.by, bz, '#ff3344', 30, { speed: 8 });
            Director.sayNow(A.data.got === 1 ? 'AU! To bylo moje vysvědčení!' : A.data.got === 2 ? 'Přestaň sbírat dokumenty!' : A.data.got === 3 ? 'Tohle není fér. Teda je. Ale nelíbí se mi to.' : 'Načítám plán B… plán B je plán A, ale hlasitěji.', 'angry');
            if (A.data.got >= 5) { bossDefeat(A); return; }
            A.data.nextT = 0.9;
          } });
      }
      if (A.data.done) { if (A.data.endT > 0) { A.data.endT -= dt; if (A.data.endT <= 0) { A.winT = 0.01; A.won = true; } } return; }
      if (ph === 0) { // posuvné Excel buňky
        if (A.data.shot <= 0) { A.data.shot = 1.4; const z = U.rand(w.z0 + 5, w.z1 - 2), dir = U.chance(0.5) ? 1 : -1; A.data.rows.push({ z, x: dir > 0 ? w.x0 - 3 : w.x1 + 3, dir, sp: 7, len: 3 }); }
      } else if (ph === 1) { // matematika ze všech stran
        if (A.data.shot <= 0) { A.data.shot = 0.14; A.data.spin = (A.data.spin || 0) + 0.42; const a = A.data.spin; Ents.add({ tag: 'arena', kind: 'hazard', spr: 'm_' + U.pick(MATH), x: bx, z: bz, y: 1.2, w: 0.6, r: 0.35, vx: Math.cos(a) * 5.5, vz: Math.abs(Math.sin(a)) * 5.5 + 1, life: 6 }); }
      } else if (ph === 2) { // daňová přiznání padají + jedno honí
        if (A.data.shot <= 0) { A.data.shot = 0.4; dropHazard(A, U.clamp(P().x + U.rand(-3, 3), w.x0 + 1, w.x1 - 1), U.clamp(P().z + U.rand(-3, 3), w.z0 + 1, w.z1 - 1), 'invoice', { w: 0.9, speed: 6 }); }
        if (!A.data.taxer) A.data.taxer = Ents.add({ tag: 'arena', kind: 'hazard', spr: 'tax_big', x: bx, z: bz, y: 1.5, w: 2.6, r: 0.9, dieOnHit: false, dmg: 3, armT: 1, upd(e, dt) { chase(e, 2.6, dt, 2); } });
      } else if (ph === 3) { // zdi z C# chyb s mezerou
        if (A.data.shot <= 0) {
          A.data.shot = 1.6; const gap = U.rand(w.x0 + 4, w.x1 - 4), err = U.pick(CS_ERR);
          for (let x = w.x0 + 1.5; x < w.x1; x += 3) { if (Math.abs(x - gap) < 3) continue; Ents.add({ tag: 'arena', kind: 'hazard', spr: 'e_' + err, x, z: w.z0 + 2, y: 1.1, w: 2.8, r: 0.9, vz: 4.2, life: 9, dmg: 2 }); }
        }
      } else if (ph === 4) { // jazykové bubliny
        if (A.data.shot <= 0) { A.data.shot = 0.22; const near = U.chance(0.5); const x = near ? P().x + U.rand(-2, 2) : U.rand(w.x0 + 1, w.x1 - 1), z = near ? P().z + U.rand(-2, 2) : U.rand(w.z0 + 1, w.z1 - 1); dropHazard(A, U.clamp(x, w.x0 + 1, w.x1 - 1), U.clamp(z, w.z0 + 1, w.z1 - 1), 'b_' + U.pick(BUBBLES), { w: 1.8, r: 0.65, speed: 6 }); }
      }
      // pohyb buněk
      for (let k = A.data.rows.length - 1; k >= 0; k--) {
        const r = A.data.rows[k]; r.x += r.dir * r.sp * dt;
        if (r.x > w.x1 + 10 || r.x < w.x0 - 10) { A.data.rows.splice(k, 1); continue; }
        for (let i = 0; i < r.len; i++) { const cx = r.x - i * 2 * r.dir; if (Math.abs(P().x - cx) < 1.25 && Math.abs(P().z - r.z) < 0.85 && P().y < 1.1 && Game.hurt(2, null)) Game.push(r.dir * 4, (P().z > r.z ? 1 : -1) * 5); }
      }
    },
    draw(A) {
      const w = Arena.WORLDS.boss;
      for (const r of A.data.rows) for (let i = 0; i < r.len; i++) Arena.drawCell(r.x - i * 2 * r.dir, r.z);
      if (!A.data.dead) Chars.drawMT(A.data.bx, A.data.by, w.z0 + 2, 0, 5, true, 0.15, A.data.hitT > 0 ? { tint: [1, 1, 1, 0.7] } : null);
    },
  };
  function nextPhase(A) {
    A.data.phase = (A.data.phase + 1) % 5; A.data.pt = 0; A.data.shot = 1; A.data.certOut = false; A.data.certTaken = false; A.data.rows.length = 0;
    if (A.data.taxer) { A.data.taxer.dead = true; A.data.taxer = null; }
    const ph = PHASES[A.data.phase];
    A.title = 'MATURITA.EXE — ' + ph.name;
    UI.big(ph.name, 1.6, ph.col);
    Sound.sfx.warn();
  }
  function bossDefeat(A) {
    const w = Arena.WORLDS.boss;
    A.data.done = true; A.data.dead = true; Ents.clear('arena');
    Chars.setBossMood('error');
    Sound.sfx.explosion(); Game.shake(1.2, 1.5); Game.flash([1, 1, 1], 1);
    for (let k = 0; k < 6; k++) setTimeout(() => { Ents.confetti(A.data.bx + U.rand(-3, 3), A.data.by + U.rand(-2, 2), w.z0 + 2, 120, 10); Sound.sfx.explosion(); }, k * 250);
    // diplom padá z nebe
    Ents.add({ tag: 'final', kind: 'deco', spr: 'diploma', x: P().x, z: P().z - 2, y: 14, vy: -2.5, floor: 0.6, w: 1.4, shadow: true, upd(e) { e.rot = Math.sin(e.t * 2) * 0.3; } });
    UI.big('MATURITA.EXE NEODPOVÍDÁ', 3, '#3cff7a');
    A.data.endT = 3.2;
  }

  return { semicolon, ram, babel, book, excel, economy, olga, boss, QTE };
})();
