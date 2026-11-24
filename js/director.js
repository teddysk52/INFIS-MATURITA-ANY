'use strict';
// =============================================================
//  director.js — MATURITRON 3000, sarkastický AI "game director".
//  OFFLINE režim: pravidla + náhoda (vždy funguje).
//  AI režim (volitelný): dotaz na Cloudflare Worker (/worker),
//  který vrátí JSON { line, event, target }. Odpověď se přísně
//  validuje — AI smí vybrat JEN z předem připravených událostí.
//  Žádný kód z AI se nikdy nespouští.
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
    outdoor: [
      'Venku? Maturita je UVNITŘ. Modrá budova. Nemůžeš ji minout.',
      'Čerstvý vzduch. Nesnáším ho. Nejde zazálohovat.',
      'Tramvaj číslo 4 jezdí přesně. Na rozdíl od tebe.',
      'Úřad práce je hned naproti. Jen tak, pro inspiraci.',
    ],
    car: [
      'Řidičák nemáš. Pojištění nemáš. Maturitu nemáš. Ale auto jo.',
      'Klíčky v zapalování? To je bezpečnostní díra. Já ji tam dal.',
      'Jízda po Borech. Rychlost: protizákonná. Pokrok: nulový.',
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
  let activeEvent = '', activeT = 0, immuneT = 0;
  const AI = { online: false, checked: false, requests: 0, lastReq: -1e9, fails: 0, pending: null, pendingAt: 0 };
  // stav událostí ve světě
  let chasers = [], portals = null, wifiT = 0, popupT = 0;

  function reset() {
    speech = null; queue = []; clock = 0; nextAt = U.rand(40, 50); warned = false; aiAsked = false; freeT = 0; lastSay = 0; recent = []; errT = 0; prepT = 0;
    activeEvent = ''; activeT = 0; immuneT = 0; AI.requests = 0; AI.pending = null; AI.fails = 0;
    clearEvents();
  }
  function clearEvents() {
    for (const c of chasers) Game.removeTemp(c.ch);
    chasers = []; portals = null; wifiT = 0; popupT = 0; UI.clearPopups(); Ents.clear('event');
  }
  function say(text, mood = 'normal') { if (queue.length < 3 && !queue.some(q => q.text === text)) queue.push({ text, mood }); lastSay = clock; }
  function startSpeech(text, mood) {
    const dur = Settings.s.voice ? Voice.play(text) : 0;
    speech = { text, mood, shown: 0, hold: Math.max(2.2 + text.length * 0.03, dur + 0.5 - text.length / 48), voiced: dur > 0 };
    UI.mtShow('', mood === 'angry' ? 'angry' : '');
    Chars.setMTMood(mood === 'angry' ? 'angry' : mood === 'happy' ? 'happy' : mood === 'error' ? 'error' : 'talk');
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
      year: Game.year, timeLeft: Math.round(Game.time), recentActions: Game.actionLog.slice(-6),
      completed: Game.objectives.filter(o => o.done).map(o => o.id), recentEvents: recent.slice(-3),
      allowedEvents: EVENTS, allowedTargets: TEACHERS,
    };
    try {
      const r = await fetchTimeout(base() + '/director', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }, CFG.AI_TIMEOUT_MS);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const v = validate(await r.json());
      if (!v) throw new Error('invalid');
      AI.pending = v; AI.pendingAt = clock; AI.fails = 0;
    } catch (e) {
      AI.fails++;
      if (AI.fails >= 3) AI.online = false;
    }
  }

  // ---------------------------------------------------------
  //  výběr a spuštění události
  // ---------------------------------------------------------
  function chooseEvent() {
    const y = Game.year, P = Game.player, inside = World.inside(P.x, P.z);
    const w = { bonus: 2, achievement: 2, wifi: 2, edupage: 2, rain: 3, test: 2, wrong: inside && y >= 2 ? 2 : 0, invasion: y >= 2 ? (y === 4 ? 3 : 2) : 0, tax: y >= 3 ? 3 : 1, malfunction: y >= 2 ? 1 : 0 };
    if (Game.time < 40) { w.bonus = 5; w.malfunction = 3; }
    if (Game.inCar) { w.test = 0; w.invasion = 0; w.wrong = 0; }
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
    if (ev !== 'none') { recent.push(ev); activeEvent = EVENT_NAMES[ev]; activeT = ev === 'achievement' || ev === 'bonus' ? 2.5 : 10; }
    sayNow(line || U.pickFresh('ev_' + ev, LINES.events[ev] || LINES.idle), ev === 'malfunction' ? 'error' : ev === 'bonus' ? 'happy' : 'normal');
    if (ev === 'malfunction') errT = 3.5;
    Game.logAction('MATURITRON spustil: ' + (EVENT_NAMES[ev] || ev));
  }

  // volné místo poblíž hráče
  function near(minD, maxD) {
    const P = Game.player;
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * Math.PI * 2, d = U.rand(minD, maxD), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
      if (Col.hitCircle(x, z, 0.4)) continue;
      if (World.inside(x, z) !== World.inside(P.x, P.z)) continue;
      if (Col.ray(P.x, 1.2, P.z, (x - P.x) / d, 0, (z - P.z) / d, d) < d - 0.4) continue; // viditelnost
      return { x, z };
    }
    return null;
  }
  function spawnChaser(id, s, o) {
    const ch = Game.addTemp(id, s.x, s.z);
    Ents.burst(s.x, 1, s.z, '#ffffff', 18, { up: 3 });
    chasers.push(Object.assign({ ch, t: 9, sp: 3.4 }, o));
  }
  const Events = {
    test(target) {
      const s = near(5, 9); if (!s) return false;
      spawnChaser(target || U.pick(TEACHERS), s, { t: 8, sp: 3.9, mode: 'test', label: 'PÍSEMKA!' });
      Sound.sfx.warn();
    },
    rain() {
      Sound.sfx.warn();
      let n = 0;
      const tick = () => {
        if (!Game.playing || n++ > 26) return;
        const P = Game.player, a = Math.random() * Math.PI * 2, r = U.chance(0.4) ? U.rand(0, 1.5) : U.rand(1, 7);
        const x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
        if (!Col.hitCircle(x, z, 0.3)) Ents.add({ tag: 'event', kind: 'hazard', spr: 'excel', x, z, y: World.inside(P.x, P.z) ? 3.1 : 9, vy: World.inside(P.x, P.z) ? -2.4 : -6, floor: 0, w: 0.8, r: 0.45, warn: true, life: 5, dmg: 2,
          onLand(e) { e.kind = 'deco'; e.life = e.t + 0.3; Ents.burst(e.x, 0.3, e.z, '#21a366', 8, { up: 2, speed: 2 }); } });
        setTimeout(tick, 320);
      };
      tick();
    },
    wifi() { wifiT = 5; Game.glitch(5); Sound.sfx.glitch(); UI.big('INFIS-GUEST', 2, '#7fdcff', 'Připojeno, bez internetu'); },
    invasion(target) {
      const ids = U.shuffle(TEACHERS.slice()); if (target) ids.unshift(target);
      let n = 0;
      for (let i = 0; i < 3; i++) { const s = near(5, 9); if (!s) continue; spawnChaser(ids[i], s, { t: 10, sp: 2.9 + i * 0.35, mode: 'chvilka', label: U.pick(['MÁŠ CHVILKU?', 'JEN JEDNA OTÁZKA!', 'POČKEJ!', 'DOMÁCÍ ÚKOL?']) }); n++; }
      Sound.sfx.alarm();
      return n > 0;
    },
    bonus() { Game.addTime(15, true); Sound.sfx.powerup(); const P = Game.player; for (let k = 0; k < 8; k++) Ents.add({ tag: 'event', kind: 'deco', spr: 'clockbonus', x: P.x + U.rand(-2, 2), z: P.z + U.rand(-2, 2), y: 2.5, vy: 2, gravity: 4, w: 0.5, life: 1.6, shadow: false }); },
    wrong() {
      const doors = Object.values(World.ROOMS).filter(r => r.door.length && !r.locked && r.id !== 'exam');
      if (!World.inside(Game.player.x, Game.player.z) || doors.length < 2) return false;
      const sel = U.shuffle(doors.slice()).slice(0, 4);
      portals = { list: sel.map(r => ({ x: r.dx, z: r.dz, room: r })), t: 20, cool: 0 };
      portals.ents = portals.list.map(p => Ents.add({ tag: 'event', kind: 'deco', spr: 'portal', x: p.x, z: p.z, y: 1.2, w: 1.6, shadow: false, blend: true, col: [1, 1, 1, 0.85] }));
      Sound.sfx.teleport();
    },
    edupage() {
      const W = window.innerWidth, H = window.innerHeight;
      U.shuffle(POPUPS.slice()).slice(0, 3).forEach((t, i) => UI.popup(t, W * 0.3 + i * 60 + U.rand(-30, 30), H * 0.25 + i * 70));
      popupT = 14; Sound.sfx.popup();
    },
    achievement() { if (!Achievements.randomUnlock()) Game.addTime(5, true); },
    tax() {
      const s = near(7, 11); if (!s) return false;
      Ents.add({ tag: 'event', kind: 'hazard', spr: 'tax_big', x: s.x, z: s.z, y: 1.5, w: 2.6, r: 0.9, life: 11, dmg: 3, armT: 1,
        upd(e, dt) {
          const P = Game.player, dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz) || 1;
          const sp = 3.3; e.vx = U.smooth(e.vx, dx / d * sp, 2, dt); e.vz = U.smooth(e.vz, dz / d * sp, 2, dt);
          if (Col.hitCircle(e.x + e.vx * dt * 4, e.z, 0.5)) e.vx *= 0.2; if (Col.hitCircle(e.x, e.z + e.vz * dt * 4, 0.5)) e.vz *= 0.2;
        },
        onHit() { UI.floatText(Game.player.x, 2.2, Game.player.z, 'SPLATNOST: TEĎ', '#ff4d5e'); } });
      Sound.sfx.alarm();
    },
    malfunction() {
      clearEvents(); immuneT = 8; Game.addTime(5, true); Sound.sfx.error(); Game.glitch(1.2);
      nextAt += 15;
    },
  };

  // ---------------------------------------------------------
  function caught(c) {
    const P = Game.player;
    if (c.mode === 'test') {
      chasers = chasers.filter(x => x !== c);
      const id = c.ch.id;
      Game.hurt(3, null, true);
      const q = U.pick([
        { q: 'Kolik je 2 + 2? Pozor, chyták.', a: [['4', 'Za 3. Chybí postup.'], ['22', 'Za 1. Konkatenace je taky operace.'], ['Záleží na Excelu', 'Za 1*. Excelový Císař by byl hrdý.']] },
        { q: 'Jaké je hlavní město Excelu?', a: [['List1', 'Za 2. List2 je hezčí.'], ['A1', 'Za 1. Absolutně. $A$1.'], ['Praha', 'Za 5. Praha není buňka.']] },
        { q: 'Napiš Hello World. Na papír. Rukou.', a: [['*píše*', 'Za 4. Chybí středník. Zase.'], ['print("hello")', 'Za 3. To je Python. My jsme C# rodina.'], ['Odmítám.', 'Za 1. Konečně někdo s páteří.']] },
        { q: 'Kdo napsal Máj?', a: [['Mácha', 'Za 1. Nečekané.'], ['ChatGPT', 'Za 5. Ten tehdy ještě nebyl.'], ['MATURITRON', 'Za 2. Lichotíš mi. — MATURITRON']] },
        { q: 'Kolik bitů má bajt?', a: [['8', 'Za 1. Nuda, ale správně.'], ['Jeden bajt', 'Za 4. Rekurze není odpověď.'], ['Kolik chceš?', 'Za 2. Obchodní talent oceněn.']] },
        { q: 'Kolik zastávek má tramvaj č. 4?', a: [['Hodně', 'Za 2. Přibližně správně.'], ['404', 'Za 1. Zastávka nenalezena.'], ['Jezdím autem', 'Za 5. Bez řidičáku. Vím to.']] },
      ]);
      Game.faceNpc(c.ch);
      Dialogue.start([
        L(id, 'Mám tě! Náhodný test. Jedna otázka.'),
        L(id, q.q, { choices: q.a.map(([t, grade]) => ({ t, then: [L(id, grade)], fn() { UI.floatText(P.x, 2.3, P.z, grade.split('.')[0].toUpperCase(), '#ffe14d'); } })) }),
      ], () => { Ents.burst(c.ch.x, 1, c.ch.z, '#ffffff', 16); Game.removeTemp(c.ch); });
    } else {
      c.t = 0;
      Game.hurt(3, null, true);
      UI.floatText(P.x, 2.3, P.z, 'Máš chvilku? −3 s', '#ffcf3f');
      Achievements.unlock('chvilka');
    }
  }
  function updateEvents(dt) {
    const P = Game.player;
    if (immuneT > 0) immuneT -= dt;
    for (const c of chasers) {
      c.t -= dt;
      const ch = c.ch, dx = P.x - ch.x, dz = P.z - ch.z, d = Math.hypot(dx, dz) || 1;
      const sp = Game.inCar ? 0 : c.sp;
      const m = Col.move(ch.x, ch.z, dx / d * sp * dt, dz / d * sp * dt, 0.3);
      ch.x = m.x; ch.z = m.z; ch.speed = sp; ch.yaw = Math.atan2(dx, dz);
      UI.bubble('ch' + ch.uid, ch.x, 2.35, ch.z, c.label, 0.2);
      if (d < 0.9 && c.t > 0 && immuneT <= 0 && !Dialogue.active) { caught(c); if (c.mode === 'test') return; }
      if (c.t <= 0) {
        Ents.burst(ch.x, 1, ch.z, '#ffffff', 14);
        if (c.mode === 'test' && !Achievements.has('utek')) { Achievements.unlock('utek'); say('Útěk z písemky úspěšný. Neomluvená hodina zapsána.'); }
      }
    }
    for (const c of chasers) if (c.t <= 0) Game.removeTemp(c.ch);
    chasers = chasers.filter(c => c.t > 0);
    if (portals) {
      portals.t -= dt; portals.cool -= dt;
      if (portals.cool <= 0) {
        const L2 = portals.list;
        for (let k = 0; k < L2.length; k++) {
          const p = L2[k];
          if (Math.hypot(P.x - p.x, P.z - p.z) < 0.8) {
            const to = L2[(k + 1 + U.randi(0, L2.length - 2)) % L2.length];
            const into = to.room.side === 'n' ? -1 : 1;
            Game.teleport(to.x, to.z + into * 1.4, into < 0 ? Math.PI : 0);
            portals.cool = 1.5; Sound.sfx.teleport(); Game.flash([0.8, 0.4, 1], 0.35);
            UI.floatText(P.x, 2.3, P.z, 'ŠPATNÁ TŘÍDA! → ' + to.room.name, '#e0a0ff', 2);
            break;
          }
        }
      }
      if (portals.t <= 0) { for (const e of portals.ents) e.dead = true; portals = null; }
    }
    if (wifiT > 0) wifiT -= dt;
    if (popupT > 0) { popupT -= dt; if (popupT <= 0) UI.clearPopups(); }
  }

  // ---------------------------------------------------------
  function update(dt) {
    if (errT > 0) errT -= dt;
    if (activeT > 0) { activeT -= dt; if (activeT <= 0) activeEvent = ''; }
    if (speech) {
      const len = speech.text.length, before = Math.floor(speech.shown);
      speech.shown = Math.min(len, speech.shown + dt * 46);
      if (Math.floor(speech.shown) !== before) { UI.mtType(speech.text.slice(0, Math.floor(speech.shown))); if (!speech.voiced && before % 3 === 0) Sound.sfx.blip(0.6); }
      if (speech.shown >= len) { speech.hold -= dt; if (speech.hold <= 0) { speech = null; UI.mtHide(); Chars.setMTMood('normal'); } }
    } else if (queue.length && !Dialogue.active) {
      const q = queue.shift(); startSpeech(q.text, q.mood);
    }
    UI.mtStatus(status());
    updateEvents(dt);
    if (!Game.timerOn) return;
    clock += dt;
    const busy = !!Arena.active || Dialogue.active || !!Game.glitchMission || UI.popupCount() > 0 || Game.qte || Game.cutscene;
    freeT = busy ? 0 : freeT + dt;
    if (prepT > 0) prepT -= dt;
    if (!warned && clock >= nextAt - 4 && freeT > 0.5) { warned = true; prepT = 4; say(U.pickFresh('prep', LINES.prep)); }
    if (!aiAsked && clock >= nextAt - 7) { aiAsked = true; requestAI(); }
    if (clock >= nextAt && freeT > 1.2) {
      let ev = chooseEvent(), line = null, target = null;
      if (AI.pending && clock - AI.pendingAt < 25) { ev = AI.pending.event; line = AI.pending.line; target = AI.pending.target; AI.pending = null; }
      trigger(ev, line, target);
      nextAt = clock + (Game.year === 4 ? U.rand(38, 52) : U.rand(45, 70));
      warned = false; prepT = 0; aiAsked = false;
    }
    if (!speech && !queue.length && !busy && clock - lastSay > 32 && clock < nextAt - 8) {
      const P = Game.player;
      const pool = Game.inCar ? LINES.car : !World.inside(P.x, P.z) && U.chance(0.6) ? LINES.outdoor : LINES.idle;
      say(U.pickFresh('idle' + pool.length, pool, 5));
    }
  }
  function status() {
    if (errT > 0) return 'SYSTÉM SE RESTARTUJE…';
    if (activeEvent) return 'PROBÍHÁ: ' + activeEvent;
    if (prepT > 0) return 'PŘIPRAVUJE PROBLÉM…';
    if (Game.year === 4 || Game.time < 60) return 'KRITICKÁ ÚROVEŇ CHAOSU';
    return AI.online ? 'SKUTEČNÁ AI · ONLINE' : 'AI JE PODEZŘELE TICHO…';
  }
  function onPopupClosed() { if (UI.popupCount() === 0 && popupT > 0) { popupT = 0; Achievements.unlock('edupage'); } }

  return {
    EVENTS, LINES, reset, say, sayNow, update, checkAI, validate, trigger, status, clearEvents, onPopupClosed,
    get ai() { return AI; }, get speaking() { return !!speech; }, get wifi() { return wifiT > 0; },
    _force(ev) { trigger(ev); },
  };
})();
