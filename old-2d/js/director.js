'use strict';
// =============================================================
//  director.js — MATURITRON 3000, sarkastický AI "game director".
//  OFFLINE režim: pravidla + náhoda (vždy funguje).
//  AI režim (volitelný): dotaz na Cloudflare Worker, který vrátí
//  JSON { line, event, target }. Odpověď se přísně validuje —
//  AI smí vybrat JEN z předem připravených a otestovaných událostí.
// =============================================================
const Director = (() => {
  const CFG = window.INFIS_CONFIG;
  const EVENTS = ['test', 'rain', 'wifi', 'invasion', 'bonus', 'wrong', 'edupage', 'achievement', 'tax', 'malfunction'];
  const TEACHERS = ['hojer', 'nagr', 'horvath', 'novak', 'batkova', 'janda', 'prynych', 'ladman'];
  const EVENT_NAMES = { test: 'NÁHODNÝ TEST', rain: 'EXCEL RAIN', wifi: 'WIFI ERROR', invasion: 'TEACHER INVASION', bonus: 'BONUS ČAS', wrong: 'ŠPATNÁ TŘÍDA', edupage: 'EDUPAGE ERROR', achievement: 'NÁHODNÝ ACHIEVEMENT', tax: 'DAŇOVÝ ÚTOK', malfunction: 'PORUCHA AI' };

  const LINES = {
    idle: [
      'Analyzuji tvoje šance na maturitu… Výsledek: HAHAHA.',
      'Vidím, že se ti daří. To je chyba systému.',
      'Počkej. Ty se fakt učíš?',
      'Tohle už není škola. Tohle je survival.',
      'Tvoje docházka: 3 %. Tvoje sebevědomí: 300 %.',
      'Zálohuji tvoje známky. Do koše.',
      'Jsem trénovaný na 4 terabytech výmluv. Tvoje jsou slabé.',
      'Hledám tvou motivaci… 404.',
      'Moje oblíbená známka? Pětka. Je to prvočíslo.',
      'Chceš radu? Neber si ode mě rady.',
      'Běháš po chodbě. Zapisuji do třídnice. Do Excelu. Do obou.',
      'Kdybych měl ruce, tleskal bych. Ironicky.',
      'Zajímavá taktika. Špatná, ale zajímavá.',
      'Jsem MATURITRON 3000. Verze 2999 byla moc hodná.',
    ],
    prep: ['Mám nápad. Špatný nápad. Pro tebe.', 'Načítám problém… 87 %…', 'Neohlížej se. Fakt. Neohlížej se.', 'Hmm. Co kdybych…', 'Chystám překvapení. Nebude se ti líbit.'],
    mission: [
      'Hm. Splněno. Asi bug v mé logice.',
      'To se nepočítá. …Systém říká, že se to počítá. Systém je zrádce.',
      'Gratuluji. Sarkasticky.',
      'Další splněný úkol. Píšu si tě do listu „PROBLÉMY“.',
      'Nevadí. Pořád mám dost času tě zastavit.',
      'Kdo ti to dovolil? Aha. Pravidla. Nesnáším pravidla.',
    ],
    hit: ['Au. Teda, au tobě. Mně je dobře.', 'Zásah! Odečítám čas. Moje oblíbená část.', 'Tohle si přehraju ještě jednou. V hlavě. Mám hodně RAM.', 'Kritický zásah do tvého rozvrhu!'],
    events: {
      test: ['NÁHODNÝ TEST! Učitel se zjevil z ničeho. Jako vždy.', 'Překvapivá písemka! Překvapení!'],
      rain: ['Spouštím EXCEL RAIN. Předpověď: 100 % tabulek.', 'Prší .xlsx soubory. Deštník nemáš. Vím to.'],
      wifi: ['Wi-Fi INFIS-GUEST: Připojeno, bez internetu.', 'Restartuji školní router. Zase. Bufferuj.'],
      invasion: ['TEACHER INVASION! Všichni chtějí „jen chvilku“.', 'Posílám učitele. Každý má „jen jednu otázku“.'],
      bonus: ['Přidávám ti 15 sekund. …Počkat. To jsem nechtěl.', 'Ups. Omylem jsem ti dal čas. Kdo mě programoval?'],
      wrong: ['Prohodil jsem dveře. Hodně štěstí s rozvrhem.', 'Fialové portály! Vedou jinam. Jako tvoje kariéra.'],
      edupage: ['EduPage má pro tebe nové zprávy. Hodně nových zpráv.', 'Notifikace! Notifikace všude!'],
      achievement: ['Tady máš achievement. Je úplně k ničemu.', 'Gratuluji k ničemu. Tady je odznak.'],
      tax: ['FINANČNÍ ÚŘAD tě sleduje. Faktura je na cestě.', 'Posílám ti fakturu. Osobně. Pěšky.'],
      malfunction: ['CHYBA: maturitron.exe neodpovídá… vypínám vlastní pasti…', 'Instaluji aktualizace 3 z 147. Moje pasti nefungují.'],
    },
  };

  const TEST_Q = [
    { q: 'Kolik je 2 + 2? Pozor, chyták.', a: [['4', 'Za 3. Chybí postup.'], ['22', 'Za 1. Konkatenace je taky operace.'], ['Záleží na Excelu', 'Za 1*. Excelový Císař by byl hrdý.']] },
    { q: 'Jaké je hlavní město Excelu?', a: [['List1', 'Za 2. List2 je hezčí.'], ['A1', 'Za 1. Absolutně. $A$1.'], ['Praha', 'Za 5. Praha není buňka.']] },
    { q: 'Napiš Hello World. Na papír. Rukou.', a: [['*píše*', 'Za 4. Chybí středník. Zase.'], ['print("hello")', 'Za 3. To je Python. My jsme C# rodina.'], ['Odmítám.', 'Za 1. Konečně někdo s páteří.']] },
    { q: 'Kdo napsal Máj?', a: [['Mácha', 'Za 1. Nečekané.'], ['ChatGPT', 'Za 5. Ten tehdy ještě nebyl.'], ['MATURITRON', 'Za 2. Lichotíš mi. — MATURITRON']] },
    { q: 'Kolik bitů má bajt?', a: [['8', 'Za 1. Nuda, ale správně.'], ['Jeden bajt', 'Za 4. Rekurze není odpověď.'], ['Kolik chceš?', 'Za 2. Obchodní talent oceněn.']] },
  ];

  const POPUPS = [
    'Máte 47 nových známek. Všechny jsou 5.',
    'Rodič si přečetl vaši známku. Před 0,3 sekundami.',
    'Zítra se nekoná výuka. (Platí pro rok 2009)',
    'Nová zpráva od MATURITRON: „ahoj :)“',
    'Váš rozvrh byl změněn. Byl to vtip.',
    'Pro zobrazení známky si kupte EduPage Premium.',
    'Omluvenka zamítnuta. Důvod: „ne“.',
  ];

  let speech = null, queue = [], clock = 0, nextAt = 45, warned = false, aiAsked = false, freeT = 0, lastSay = 0, recent = [], errT = 0, prepT = 0;
  let activeEvent = '', activeT = 0;
  const AI = { online: false, checked: false, requests: 0, lastReq: -1e9, fails: 0, pending: null, pendingAt: 0 };

  function reset() {
    speech = null; queue = []; clock = 0; nextAt = U.rand(42, 55); warned = false; aiAsked = false; freeT = 0; lastSay = 0; recent = []; errT = 0; prepT = 0;
    activeEvent = ''; activeT = 0; AI.requests = 0; AI.pending = null; AI.fails = 0;
  }
  function say(text, mood = 'normal') { if (queue.length < 3) queue.push({ text, mood }); lastSay = clock; }
  function startSpeech(text, mood) {
    const dur = Dialogue.active ? 0 : Voice.play(text);
    speech = { text, mood, shown: 0, hold: Math.max(2.4 + text.length * 0.03, dur + 0.6 - text.length / 48), voiced: dur > 0 };
  }
  function sayNow(text, mood = 'normal') { queue = []; startSpeech(text, mood); lastSay = clock; }

  // ---------------------------------------------------------
  //  Volitelné připojení ke skutečné AI (přes Worker proxy)
  // ---------------------------------------------------------
  function base() { return String(CFG.AI_ENDPOINT || '').replace(/\/+$/, ''); }
  function fetchTimeout(url, opts, ms) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, Object.assign({}, opts, { signal: ctrl.signal })).finally(() => clearTimeout(id));
  }
  async function checkAI() {
    if (!base()) { AI.online = false; AI.checked = true; return false; }
    try { const r = await fetchTimeout(base() + '/health', { method: 'GET' }, 4000); AI.online = r.ok; }
    catch (e) { AI.online = false; }
    AI.checked = true;
    return AI.online;
  }
  function validate(j) {
    if (!j || typeof j !== 'object') return null;
    const ev = typeof j.event === 'string' ? j.event.trim().toLowerCase() : '';
    if (!EVENTS.includes(ev) && ev !== 'none') return null;
    const line = typeof j.line === 'string' ? j.line.replace(/[\u0000-\u001f<>{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140) : '';
    if (line.length < 2) return null;
    const target = TEACHERS.includes(j.target) ? j.target : null;
    return { event: ev, line, target };
  }
  async function requestAI() {
    if (!AI.online || AI.requests >= CFG.AI_MAX_REQUESTS) return;
    const now = performance.now();
    if (now - AI.lastReq < CFG.AI_MIN_INTERVAL_MS) return;
    AI.requests++; AI.lastReq = now;
    const state = {
      year: Game.year,
      timeLeft: Math.round(Game.time),
      recentActions: Game.actionLog.slice(-6),
      completed: Game.objectives.filter(o => o.done).map(o => o.id),
      recentEvents: recent.slice(-3),
      allowedEvents: EVENTS,
      allowedTargets: TEACHERS,
    };
    try {
      const r = await fetchTimeout(base() + '/director', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }, CFG.AI_TIMEOUT_MS);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const v = validate(await r.json());
      if (!v) throw new Error('invalid');
      AI.pending = v; AI.pendingAt = clock; AI.fails = 0;
    } catch (e) {
      AI.fails++;
      if (AI.fails >= 3) AI.online = false; // vzdáme to a jedeme offline
    }
  }

  // ---------------------------------------------------------
  //  Výběr a spuštění události
  // ---------------------------------------------------------
  function chooseEvent() {
    const y = Game.year;
    const w = { bonus: 2, achievement: 2, wifi: 2, edupage: 2, rain: y >= 2 ? 3 : 2, test: 2, wrong: y >= 2 ? 2 : 0, invasion: y >= 2 ? (y === 4 ? 3 : 2) : 0, tax: y >= 3 ? 3 : 0, malfunction: y >= 2 ? 1 : 0 };
    for (const r of recent.slice(-3)) w[r] = 0;
    const entries = Object.entries(w).filter(([, v]) => v > 0);
    let sum = entries.reduce((a, [, v]) => a + v, 0), r = Math.random() * sum;
    for (const [k, v] of entries) { r -= v; if (r <= 0) return k; }
    return 'bonus';
  }

  function trigger(ev, line, target) {
    let ok = true;
    if (ev !== 'none') ok = Events[ev](target) !== false;
    if (!ok) { ev = 'bonus'; Events.bonus(); line = null; }
    if (ev !== 'none') { recent.push(ev); activeEvent = EVENT_NAMES[ev]; activeT = ev === 'achievement' || ev === 'bonus' ? 2.5 : 9; }
    sayNow(line || U.pickFresh('ev_' + ev, LINES.events[ev] || LINES.idle), ev === 'malfunction' ? 'error' : ev === 'bonus' ? 'happy' : 'normal');
    if (ev === 'malfunction') errT = 3.5;
    Game.logAction('MATURITRON spustil: ' + (EVENT_NAMES[ev] || ev));
  }

  // pomocné: spawn poblíž hráče
  function near(minD, maxD) { const p = Game.player; return World.randomFree(p.x, p.y, minD, maxD); }

  const Events = {
    test(target) {
      const s = near(100, 150); if (!s) return false;
      const id = target || U.pick(TEACHERS);
      Game.hazards.push({ k: 'chaser', id, x: s.x, y: s.y, t: 8, sp: 54, mode: 'test', dir: 'down', anim: 0 });
      Game.burst(s.x, s.y - 10, '#ffffff', 14, true); Sound.sfx.warn();
    },
    rain() { Game.hazards.push({ k: 'rain', t: 7.5, spawn: 0.6 }); Sound.sfx.warn(); },
    wifi() { Game.glitchT = 5; Game.slowT = 5; Sound.sfx.glitch(); },
    invasion(target) {
      const ids = U.shuffle(TEACHERS.slice()); if (target) ids.unshift(target);
      let n = 0;
      for (let i = 0; i < 3; i++) {
        const s = near(110, 170); if (!s) continue;
        Game.hazards.push({ k: 'chaser', id: ids[i], x: s.x, y: s.y, t: 9, sp: 44 + i * 6, mode: 'chvilka', dir: 'down', anim: 0 });
        Game.burst(s.x, s.y - 10, '#ffffff', 10, true); n++;
      }
      Sound.sfx.alarm();
      return n > 0;
    },
    bonus() { Game.addTime(15, true); Sound.sfx.powerup(); Game.bonusFx = 1.6; },
    wrong() {
      const tops = World.ROOMS.filter(r => r.top);
      const [a, b] = U.shuffle(tops.slice()).slice(0, 2);
      Game.portals = { a: { x: (a.door.x + 1) * 16, y: 14 * 16 + 12 }, b: { x: (b.door.x + 1) * 16, y: 14 * 16 + 12 }, t: 15, cool: 0 };
      Sound.sfx.teleport();
    },
    edupage() {
      Game.popups = U.shuffle(POPUPS.slice()).slice(0, 3).map((text, i) => ({ text, x: 110 + i * 26, y: 60 + i * 22, t: 0 }));
      Game.popupT = 12; Sound.sfx.popup();
    },
    achievement() { if (!Achievements.randomUnlock()) Game.addTime(5, true); },
    tax() {
      const s = near(150, 200); if (!s) return false;
      Game.hazards.push({ k: 'tax', x: s.x, y: s.y, t: 10, sp: 44 }); Sound.sfx.alarm();
    },
    malfunction() {
      Game.hazards = []; Game.portals = null; Game.popups = []; Game.glitchT = 0; Game.slowT = 0;
      Game.immuneT = 8; Game.addTime(5, true); Sound.sfx.error();
    },
  };

  // ---------------------------------------------------------
  //  Překážky v otevřeném světě
  // ---------------------------------------------------------
  function moveSolid(e, dx, dy) {
    if (!World.rectSolid(e.x + dx - 5, e.y - 5, 10, 6)) e.x += dx;
    if (!World.rectSolid(e.x - 5, e.y + dy - 5, 10, 6)) e.y += dy;
  }
  function caught(h) {
    if (h.mode === 'test') {
      Game.hazards = Game.hazards.filter(x => !(x.k === 'chaser' && x.mode === 'test'));
      const q = U.pick(TEST_Q);
      Dialogue.start([
        L(h.id, 'Mám tě! Náhodný test. Jedna otázka.'),
        L(h.id, q.q, { choices: q.a.map(([t, grade]) => ({ t, then: [L(h.id, grade)], fn() { Game.floatText(Game.player.x, Game.player.y - 30, grade.split('.')[0].toUpperCase(), '#ffe14d'); } })) }),
      ], () => { Game.burst(h.x, h.y - 10, '#ffffff', 12, true); });
    } else {
      h.t = 0;
      Game.damage(3, Game.player.x, Game.player.y - 30, false, 'Máš chvilku? −3 s');
      Game.burst(h.x, h.y - 10, '#ffffff', 12, true);
      Achievements.unlock('chvilka');
    }
  }
  function updateHazards(dt) {
    const p = Game.player;
    for (const h of Game.hazards) {
      h.t -= dt;
      if (h.k === 'chaser') {
        const dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy) || 1;
        const vx = dx / d * h.sp * dt, vy = dy / d * h.sp * dt;
        const ox = h.x, oy = h.y;
        moveSolid(h, vx, vy);
        if (h.x === ox && h.y === oy) moveSolid(h, (Math.random() - 0.5) * 30 * dt, (Math.random() - 0.5) * 30 * dt);
        h.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        h.anim += dt * 8;
        if (d < 13 && h.t > 0 && Game.immuneT <= 0) { caught(h); if (h.mode === 'test') return; }
        if (h.t <= 0 && h.mode === 'test') {
          Game.burst(h.x, h.y - 10, '#ffffff', 12, true);
          if (!Game.hazards.some(x => x !== h && x.mode === 'test' && x.t > 0)) { Achievements.unlock('utek'); say('Útěk z písemky úspěšný. Neomluvená hodina zapsána.'); }
        }
      } else if (h.k === 'rain') {
        h.spawn -= dt;
        if (h.spawn <= 0) {
          h.spawn = 0.3;
          const a = Math.random() * Math.PI * 2, r = U.rand(0, 80), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
          if (!World.rectSolid(x - 2, y - 2, 4, 4)) Game.hazards.push({ k: 'drop', x, y, fall: 0.95, t: 5 });
        }
      } else if (h.k === 'drop') {
        h.fall -= dt;
        if (h.fall <= 0) {
          h.t = 0; Game.burst(h.x, h.y - 4, '#1d7044', 8, true);
          if (U.dist(p.x, p.y - 4, h.x, h.y) < 13) Game.hurtWorld(2, h.x, h.y);
        }
      } else if (h.k === 'tax') {
        const dx = p.x - h.x, dy = p.y - 10 - h.y, d = Math.hypot(dx, dy) || 1;
        h.x += dx / d * h.sp * dt; h.y += dy / d * h.sp * dt;
        if (d < 16 && Game.immuneT <= 0) { if (Game.hurtWorld(3, h.x, h.y)) { h.t = 0; Game.burst(h.x, h.y, '#fff3e0', 16, true); } }
        if (h.t <= 0) Game.burst(h.x, h.y, '#fff3e0', 10, true);
      }
    }
    Game.hazards = Game.hazards.filter(h => h.t > 0);
    // portály
    const pt = Game.portals;
    if (pt) {
      pt.t -= dt; pt.cool -= dt;
      if (pt.cool <= 0) {
        for (const [from, to] of [[pt.a, pt.b], [pt.b, pt.a]]) {
          if (U.dist(p.x, p.y, from.x, from.y) < 11) {
            p.x = to.x; p.y = to.y + 18; pt.cool = 1.4;
            Sound.sfx.teleport(); Game.flash('#c86bff', 0.25);
            Game.floatText(p.x, p.y - 30, 'ŠPATNÁ TŘÍDA!', '#e0a0ff');
            break;
          }
        }
      }
      if (pt.t <= 0) Game.portals = null;
    }
  }
  function drawHazards(ctx, gt) {
    for (const h of Game.hazards) {
      if (h.k === 'chaser') {
        Sprites.draw(ctx, h.id, h.x, h.y, h.dir, [1, 0, 2, 0][(h.anim | 0) % 4]);
        Sprites.bubble(ctx, h.x, h.y - 34, h.mode === 'test' ? 'PÍSEMKA!' : 'Máš chvilku?', 8, '#b00020');
      } else if (h.k === 'drop') {
        const k = 1 - h.fall / 0.95;
        ctx.fillStyle = `rgba(200,0,0,${0.15 + k * 0.3})`; ctx.fillRect(h.x - 6 * k - 2, h.y - 2, 12 * k + 4, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(h.x - 4 * k, h.y - 1, 8 * k, 2);
        Sprites.drawArt(ctx, 'excel', h.x, h.y - 6 - h.fall * 130, 1);
      } else if (h.k === 'tax') {
        const s = 1 + Math.sin(gt * 6) * 0.05;
        ctx.save(); ctx.translate(h.x, h.y); ctx.scale(s, s);
        Sprites.paper(ctx, 0, 0, 'FAKTURA', 30, 38, '#fff3e0', '#8a1010');
        Sprites.R(ctx, -7, 2, 3, 3, '#111'); Sprites.R(ctx, 4, 2, 3, 3, '#111'); Sprites.R(ctx, -6, 10, 12, 2, '#8a1010');
        ctx.restore();
        U.text(ctx, 'Splatnost: TEĎ', h.x, h.y + 22, { size: 7, align: 'center', color: '#ffb3b3' });
      }
    }
    const pt = Game.portals;
    if (pt) for (const q of [pt.a, pt.b]) {
      for (let i = 0; i < 4; i++) {
        const r = 6 + i * 2 + Math.sin(gt * 6 + i) * 1.5;
        ctx.fillStyle = ['#c86bff', '#8a3ad6', '#e0a0ff', '#5a1a9a'][i]; ctx.globalAlpha = 0.6;
        ctx.fillRect(q.x - r, q.y - r / 2, r * 2, r);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------
  //  update + vykreslení panelu MATURITRONA
  // ---------------------------------------------------------
  function update(dt) {
    if (errT > 0) errT -= dt;
    if (activeT > 0) { activeT -= dt; if (activeT <= 0) activeEvent = ''; }
    if (speech) {
      const len = speech.text.length;
      const before = Math.floor(speech.shown);
      speech.shown = Math.min(len, speech.shown + dt * 48);
      if (!speech.voiced && Math.floor(speech.shown) !== before && before % 3 === 0) Sound.sfx.blip(0.6);
      if (speech.shown >= len) { speech.hold -= dt; if (speech.hold <= 0) speech = null; }
    } else if (queue.length && !Dialogue.active) {
      const q = queue.shift();
      startSpeech(q.text, q.mood);
    }
    if (!Game.timerOn || Game.cutscene || Game.mode === 'yearcard' || Game.mode === 'menu') return;
    clock += dt;
    const busy = Game.mode !== 'play' || Dialogue.active || !!Game.glitchMission || Game.popups.length > 0;
    freeT = busy ? 0 : freeT + dt;
    if (prepT > 0) prepT -= dt;
    if (!warned && clock >= nextAt - 4 && freeT > 0.5) {
      warned = true; prepT = 4; say(U.pickFresh('prep', LINES.prep));
    }
    if (!aiAsked && clock >= nextAt - 7) { aiAsked = true; requestAI(); } // AI dostane náskok, aby stihla odpovědět
    if (clock >= nextAt && freeT > 1.2) {
      let ev = chooseEvent(), line = null, target = null;
      if (AI.pending && clock - AI.pendingAt < 25) { ev = AI.pending.event; line = AI.pending.line; target = AI.pending.target; AI.pending = null; }
      trigger(ev, line, target);
      nextAt = clock + (Game.year === 4 ? U.rand(38, 52) : U.rand(45, 70));
      warned = false; prepT = 0; aiAsked = false;
    }
    if (!speech && !queue.length && !busy && clock - lastSay > 34 && clock < nextAt - 8) say(U.pickFresh('idle', LINES.idle, 6));
  }

  function status() {
    if (errT > 0) return { t: 'SYSTÉM SE RESTARTUJE…', c: '#4aa3ff' };
    if (activeEvent) return { t: 'PROBÍHÁ: ' + activeEvent, c: '#ff5a5a' };
    if (prepT > 0) return { t: 'MATURITRON PŘIPRAVUJE PROBLÉM…', c: '#ffb13b' };
    if (Game.year === 4 || Game.time < 60) return { t: 'KRITICKÁ ÚROVEŇ CHAOSU', c: '#ff3b3b' };
    return { t: 'AI JE PODEZŘELE TICHO…', c: '#9a8fb3' };
  }

  function draw(ctx, gt) {
    if (Game.mode === 'menu' || Game.mode === 'victory' || Game.mode === 'gameover' || Dialogue.active) return;
    const inArena = Game.mode === 'arena';
    const st = status();
    if (speech) {
      const w = inArena ? 168 : 236, x = 8;
      const lines = U.wrap(ctx, speech.text.slice(0, Math.floor(speech.shown)), w - 50, 9.5);
      const h = Math.max(38, 21 + lines.length * 10);
      const y = inArena ? 40 : 262 - h;
      U.panel(ctx, x, y, w, h, { bg: 'rgba(16,8,16,0.9)', border: 'rgba(255,77,94,0.45)' });
      ctx.fillStyle = '#ff4d5e'; ctx.fillRect(x + 1, y + 4, 1.5, h - 8);
      Sprites.maturitron(ctx, x + 7, y + 10, 1.4, gt, errT > 0 ? 'error' : speech.mood, speech.shown < speech.text.length || (speech.voiced && Voice.speaking));
      U.text(ctx, 'MATURITRON 3000', x + 44, y + 5, { size: 6.5, font: 'bold', color: '#ff4d5e', outline: false, ls: 1 });
      lines.forEach((ln, i) => U.text(ctx, ln, x + 44, y + 15 + i * 10, { size: 9.5, color: '#f4f0ff', outline: false }));
    } else if (!inArena) {
      ctx.font = U.font(6.5, undefined, U.needsBig(st.t) ? 30 / RS.s : 0);
      const tw = ctx.measureText(st.t).width + st.t.length * 0.8 + 18;
      U.pill(ctx, 8, 250, tw, 13, 'rgba(12,9,22,0.7)');
      ctx.fillStyle = (gt * 2 | 0) % 2 ? st.c : 'rgba(255,255,255,0.15)'; ctx.fillRect(13, 256.5, 2.5, 2.5);
      U.text(ctx, st.t, 19, 254.5, { size: 6.5, color: st.c, outline: false, ls: 0.8 });
    }
  }

  return {
    EVENTS, LINES, reset, say, sayNow, update, draw, status, updateHazards, drawHazards, checkAI, validate, trigger,
    get ai() { return AI; },
    get clock() { return clock; },
    _force(ev) { trigger(ev); },
  };
})();
