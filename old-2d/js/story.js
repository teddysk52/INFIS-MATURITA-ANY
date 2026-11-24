'use strict';
// =============================================================
//  story.js — ročníky, rozmístění učitelů, mise, dialogy a vtipy.
//  VŠECHNY DIALOGY JSOU SMYŠLENÉ. Učitelé jsou přehnané, ale
//  laskavé herní postavy — žádné urážky, jen školní humor.
// =============================================================
const Story = (() => {
  const TX = x => x * 16 + 8, TY = y => y * 16 + 12;

  const YEARS = {
    1: { title: '1. ROČNÍK', sub: 'JEŠTĚ MÁŠ NADĚJI', note: 'Vysvědčení: prospěl. Tak nějak.' },
    2: { title: '2. ROČNÍK', sub: 'TEĎ UŽ JE POZDĚ ODEJÍT', note: 'Postup do 2. ročníku: schváleno Excelem.' },
    3: { title: '3. ROČNÍK', sub: 'EXCEL TĚ VIDÍ', note: 'Průměr: 2,47. Kontingenčně zaokrouhleno.' },
    4: { title: '4. ROČNÍK', sub: 'MATURITA SE BLÍŽÍ', note: 'Zbývá: 1 maturita. A pár podpisů.' },
  };

  const YEAR_LINES = {
    2: '2. ročník. Přihláška na jinou školu je v koši. Dal jsem ji tam já.',
    3: '3. ročník. Aktivuji EXCEL PROTOKOL. Všechno je teď tabulka.',
    4: '4. ročník. Režim MAXIMÁLNÍ CHAOS. Učitelé se vracejí. Všichni.',
  };

  const INTRO = [
    L('maturitron', 'Vítej na INFISu, studente.'),
    L('maturitron', 'Jsem MATURITRON 3000. Umělá inteligence. Důraz na „umělá“.'),
    L('maturitron', 'Mám jediný úkol: zabránit ti odmaturovat.'),
    L('maturitron', 'Máš 10 minut na 4 roky. Hodně štěstí.'),
    L('maturitron', '…To byl sarkasmus. Mám ho v systémovém promptu.'),
    L('narrator', 'WASD / šipky = pohyb · SHIFT = sprint · E = mluvit · ESC = pauza. Úkoly máš vpravo nahoře.'),
  ];

  // ---------------------------------------------------------
  //  Rozmístění postav v jednotlivých ročnících
  // ---------------------------------------------------------
  function npc(id, tx, ty, o = {}) {
    const x = o.px !== undefined ? o.px : TX(tx), y = TY(ty);
    return Object.assign({ id, x, y, dir: 'down', beh: 'idle', anim: 0, t: Math.random() * 5, wt: 0, vx: 0, vy: 0, stun: 0, home: { x, y } }, o, { x, y });
  }
  const CORR = (x0, x1) => ({ x0: TX(x0), x1: TX(x1), y0: TY(14) + 2, y1: TY(19) - 2 });

  function setupYear(y) {
    let npcs = [], objectives = [];
    const npcPos = (id) => () => { const n = Game.npcs.find(q => q.id === id); return n ? { x: n.x, y: n.y } : null; };
    if (y === 1) {
      npcs = [
        npc('hojer', 7, 5, { px: 128 }),
        npc('horvath', 23, 4, { px: 384 }),
        npc('nagr', 20, 16, { beh: 'wander', area: CORR(16, 27) }),
        npc('pepa', 45, 17, { beh: 'wander', area: CORR(36, 56) }),
        npc('klara', 30, 25),
        npc('kuba', 37, 39, { dir: 'up' }),
      ];
      objectives = [
        { id: 'hojer', npc: 'hojer', text: 'Pomoz Hojerovi (UČEBNA C#)' },
        { id: 'horvath', npc: 'horvath', text: 'Najdi RAM pro Horvátha (HW LAB)' },
        { id: 'nagr', npc: 'nagr', text: 'Promluv s Nágrem na chodbě', sub: () => Game.glitchMission ? `Oprav bugy v realitě ${Game.glitchMission.fixed}/3` : null },
      ];
    } else if (y === 2) {
      npcs = [
        npc('novak', 36, 5),
        npc('batkova', 43, 5),
        npc('janda', 55, 5),
        npc('hojer', 6, 16, { beh: 'wander', area: CORR(2, 12) }),
        npc('nagr', 33, 24),
        npc('horvath', 52, 15),
        npc('pepa', 22, 17, { beh: 'wander', area: CORR(16, 28) }),
        npc('klara', 31, 37),
      ];
      objectives = [
        { id: 'novak', npc: 'novak', text: 'Přežij angličtinu (JAZYKOVKA)' },
        { id: 'batkova', npc: 'batkova', text: 'Promluv s Baťkovou (JAZYKOVKA)' },
        { id: 'janda', npc: 'janda', text: 'Navštiv Jandu (KNIHOVNA)' },
      ];
    } else if (y === 3) {
      npcs = [
        npc('prynych', 7, 22, { px: 128 }),
        npc('ladman', 20, 22, { px: 336 }),
        npc('novak', 46, 16, { beh: 'wander', area: CORR(38, 56) }),
        npc('batkova', 30, 24),
        npc('janda', 60, 16),
        npc('hojer', 20, 4),
        npc('horvath', 8, 17, { beh: 'wander', area: CORR(2, 14) }),
        npc('nagr', 33, 38),
        npc('pepa', 26, 16),
      ];
      objectives = [
        { id: 'prynych', npc: 'prynych', text: 'Excelový Císař (EXCEL LAB)' },
        { id: 'ladman', npc: 'ladman', text: 'Vyrovnej účty (EKONOMIKA)' },
        { id: 'olga', optional: true, text: '??? Učebna 404 (bonus čas)', target: () => ({ x: TX(42), y: TY(21) }) },
      ];
    } else {
      npcs = [
        npc('hojer', 6, 16),
        npc('batkova', 33, 24),
        npc('ladman', 59, 16),
        npc('prynych', 24, 17, { beh: 'pester' }),
        npc('novak', 44, 17, { beh: 'pester' }),
        npc('janda', 51, 18),
        npc('nagr', 14, 18, { beh: 'wander', area: CORR(8, 20) }),
        npc('horvath', 29, 36),
        npc('klara', 38, 16, { beh: 'wander', area: CORR(36, 48) }),
      ];
      if (Game.flags.olgaDone) npcs.push(npc('olga', 42, 24));
      objectives = [
        { id: 'sign_hojer', npc: 'hojer', text: 'Podpis: Hojer (chodba)' },
        { id: 'sign_batkova', npc: 'batkova', text: 'Podpis: Baťková (hala)' },
        { id: 'sign_ladman', npc: 'ladman', text: 'Podpis: Láďman (chodba)' },
      ];
    }
    for (const o of objectives) if (o.npc && !o.target) o.target = npcPos(o.npc);
    return { npcs, objectives };
  }

  // ---------------------------------------------------------
  //  Hlášky, když učitel zrovna nemá misi
  // ---------------------------------------------------------
  const CAMEO = {
    hojer: ['Tak co, už ti to funguje?', 'Jestli to nefunguje, zkus to vypnout a zapnout. Na mě to taky platí.', 'Středník se vrátil. Prý kvůli lepším podmínkám.', 'Dneska píšeme test v C#. Na papír. Ručně. S IntelliSense v hlavě.'],
    nagr: ['To není chodba. To je pole o délce 64.', 'Vidím bug. …Jo, to jsi ty. Ale funkční.', 'Breakpoint. …Tak, a teď se ani nehni. Krokuju tě.', 'Tvoje docházka hází warning. Zatím jen warning.'],
    horvath: ['Tvoje kroky za dnešek: 2 341. Zapisuju do datasetu.', 'Kolik FPS má tahle chodba? Odhaduju 24. Kinematografický zážitek.', 'Ten rohlík DDR5 pořád běží. Teplota 21 °C. Stabilní.', 'Data nelžou. Lidi jo. Hlavně o domácích úkolech.'],
    novak: ['Hello! How are you? …Don\'t answer, we don\'t have time.', 'Mind the gap. Between you and maturita.', 'Present perfect is perfect. You are not. Yet.', 'Speak English! …Or at least try. Or at least smile.'],
    batkova: ['Hallo! Hello! Ahoj! …Kde to vlastně jsem?', 'Der, die, das. Ten, ta, to. Ty, tady, teď.', 'Ich bin müde. I am tired. Já jsem… v pátek.', 'Guten Tag! Have a nice den!'],
    janda: ['Škola je metafora. Ty jsi personifikace únavy.', 'Čti knihy. Nebo aspoň obaly. Obaly jsou taky literatura.', 'Tahle chodba je jako román. Dlouhá a nikdo ji nedočte.', 'Hodně štěstí u maturity. Nebo aspoň u rozboru.'],
    prynych: ['Zkoušel jsi to dát do Excelu?', 'Život je jedna velká kontingenční tabulka.', 'SVYHLEDAT tě najde. Vždycky.', 'Graf ti řekne víc než tisíc slov. Hlavně koláčový.'],
    ladman: ['Má dáti, dal. Já dal. Ty dáš?', 'Tvůj čas je aktivum. A právě ho odepisuješ.', 'Úsměv je zadarmo. Ale DPH z něj zaplatíš.', 'Rozvaha nikdy nelže. Jen se občas nesejde.'],
    olga: ['Matematika je věčná. Já taky.', 'Ještě jednou mě zavolej „paní učitelko v důchodu“ a dostaneš integrál.'],
    pepa: ['Máš úkol z matiky? …Já taky ne.', 'Prý se na maturitu nemusí učit. Řekl mi to MATURITRON.', 'Bufet má nový rohlík. Prý DDR5.', 'Neviděl jsi můj středník? Utekl mi o přestávce.'],
    klara: ['Já jsem tu od 1. ročníku. Pořád hledám východ.', 'Učím se na maturitu. Stihla jsem obal sešitu.', 'Slyšela jsem, že v učebně 404 straší. Matematika.', 'Excel lab je otevřený do 22:00. A pak se zavře. Navždy.'],
    kuba: ['Já jsem z vedlejší třídy. Tady jen čekám na Wi-Fi.', 'INFIS-GUEST: připojeno, bez internetu. Jako já.', 'Prý tu někde chodí AI. Jestli jo, dlužím jí úkol.'],
  };

  // ---------------------------------------------------------
  //  MISE
  // ---------------------------------------------------------
  const done = (id) => () => Game.completeObjective(id);

  const MISSIONS = {
    hojer() {
      Dialogue.start([
        L('hojer', 'Tak co, už ti to funguje?'),
        L('player', 'Ano.'),
        L('hojer', 'A zkoušel jsi to spustit?'),
        L('player', '…'),
        L('hojer', 'Ukaž. …Aha. Chybí ti středník.'),
        L('hojer', 'A on ti zrovna utíká po třídě. Chyť ho!'),
      ], () => Arena.start(MiniGames.semicolon, () => Dialogue.start([
        L('hojer', 'BUILD SUCCESSFUL. Výborně.'),
        L('hojer', 'Tak. A teď to přepiš do C#.'),
        L('player', 'Ale vždyť to BYLO v C#.'),
        L('hojer', 'Tak do novějšího C#.'),
      ], done('hojer'))));
    },

    horvath() {
      Dialogue.start([
        L('horvath', 'Ahoj. Rychlá otázka pro můj dataset.'),
        L('horvath', 'Kolik RAM má tvoje svačina?', {
          choices: [
            { t: '16 GB', then: [L('horvath', 'Málo. Na rohlík s máslem doporučuju aspoň 32.'), L('horvath', 'Zapisuju: „student podhodnocuje pečivo“.')] },
            { t: 'To je rohlík.', then: [L('horvath', 'Rohlík DDR4, nebo DDR5?'), L('player', '…Normální.'), L('horvath', 'Takže DDR3. Retro. Respekt.')] },
            { t: 'Záleží na benchmarku.', then: [L('horvath', '…'), L('horvath', 'Konečně někdo, kdo tomu rozumí.'), L('narrator', '*Horváth si setřel slzu dojetí. Zapsal ji do tabulky.*')] },
          ],
        }),
        L('horvath', 'Mimochodem, někdo mi rozkradl RAM moduly. Posbíráš je? Mám na ně dataset.'),
      ], () => Arena.start(MiniGames.ram, () => Dialogue.start([
        L('horvath', 'Čtyři RAMky a… rohlík.'),
        L('horvath', 'Rohlík DDR5. Nízká latence, vysoká chuť. Zapisuju.'),
      ], done('horvath'))));
    },

    nagr() {
      Dialogue.start([
        L('nagr', 'Proč stojíš na chodbě?'),
        L('player', 'Čekám na hodinu.'),
        L('nagr', 'To není čekání. To je nekonečná smyčka.'),
        L('nagr', '…Počkej. Vidíš to taky?'),
        { wait: 0.8, fx() { Game.glitchT = 1.2; Sound.sfx.glitch(); Game.shake(3, 0.5); } },
        L('nagr', 'Realita má bugy. Dveře, automat a jeden spolužák. Oprav je (E).'),
        L('nagr', 'Já si mezitím dám breakpoint. Na kafe.'),
      ], () => Game.startGlitchMission());
    },
    nagrOutro() {
      Dialogue.start([
        L('nagr', '0 errors. 47 warnings.'),
        L('nagr', 'Warningy neřešíme. To je feature.'),
      ], done('nagr'));
    },

    novak() {
      const meter = (p) => () => { Game.floatText(Game.player.x, Game.player.y - 34, `ÚNIK Z ANGLIČTINY: ${p} %`, '#7fdcff'); Sound.sfx.collect(); };
      Dialogue.start([
        L('novak', 'Good morning! Today we practise conversation. Tell me about your future.', {
          choices: [
            { t: 'My future is loading…', then: [L('novak', 'Loading?'), L('player', 'Error 404. Future not found.'), L('novak', '…That is honestly the most honest answer this year.')], fn: meter(33) },
            { t: 'I am future. Future is me.', then: [L('novak', 'That\'s… deep. Grammatically, no.')], fn: meter(33) },
            { t: 'Yes.', then: [L('novak', 'That was not a yes-or-no question.'), L('player', 'Yes.')], fn: meter(33) },
          ],
        }),
        L('novak', 'Interesting. And what did you do last weekend?', {
          choices: [
            { t: 'I was… weekend.', then: [L('novak', 'You WERE the weekend? Impressive.')], fn: meter(66) },
            { t: 'I play Minecraft very hardly.', then: [L('novak', '„Very hard.“ Not „hardly“.'), L('player', 'Very hardly hard.'), L('novak', '…I need a coffee.')], fn: meter(66) },
            { t: '*předstírat telefonát*', then: [L('player', 'Hello? Mom? Yes… Sorry, I must go, my mom is calling. In English.'), L('novak', 'Your phone is upside down.')], fn: meter(66) },
          ],
        }),
        L('novak', 'Final question. Why should I let you go?', {
          choices: [
            { t: 'Because bell is ringing.', then: [{ wait: 0.6, fx() { Sound.sfx.bell(); } }, L('novak', '…The bell IS ringing. Wow. Fine. Go.')], fn: meter(100) },
            { t: 'Because I am speak English very good.', then: [L('novak', 'I… okay. You win. Go.')], fn: meter(100) },
            { t: 'Sorry for my English.', then: [L('novak', 'Apology accepted. Grammar not. Go.')], fn: meter(100) },
          ],
        }),
        L('novak', 'See you next lesson!'),
        L('player', '(Nikdy.)'),
      ], () => { Achievements.unlock('sorry'); Game.completeObjective('novak'); });
    },

    batkova() {
      Dialogue.start([
        L('batkova', 'Guten Morgen!'),
        L('player', 'Dobrý den!'),
        L('batkova', 'How are you?'),
        L('player', 'Gut.'),
        L('batkova', 'Výborně. A teď česky.'),
        L('player', 'Já už nevím, kdo jsem.'),
        L('batkova', 'Perfekt! Dneska procvičíme… všechno najednou. ACHTUNG, slova padají!'),
      ], () => Arena.start(MiniGames.babel, () => Dialogue.start([
        L('batkova', 'Sehr gut! Very good! Výborně!'),
        L('batkova', 'Za domácí úkol: přelož tohle všechno do ticha.'),
      ], done('batkova'))));
    },

    janda() {
      const castle = { wait: 2.8, fx() { Game.castleT = 2.8; Sound.sfx.trumpet(); Achievements.unlock('metafora'); } };
      Dialogue.start([
        L('janda', 'Vítej v knihovně. Mluv tiše. Knihy mají citlivé hřbety.'),
        L('janda', 'Otázka do literatury: Co je to metafora?', {
          choices: [
            { t: 'To je, když řeknu, že škola je vězení?', then: [L('janda', 'Zajímavé…'), castle, L('janda', 'Pardon. Literatura je u nás někdy… doslovná.')] },
            { t: 'Druh salámu?', then: [L('janda', 'Ne. Ale ukážu ti to. Škola je… HRAD.'), castle, L('janda', 'Vidíš? Metafora. A trochu i halucinace.')] },
            { t: 'Ta věc z Máje?', then: [L('janda', 'Blízko. Máj je plný metafor. Třeba: „škola je pevnost“.'), castle, L('janda', 'Vidíš? Teď je pevnost doopravdy. To je ta moc slova.')] },
          ],
        }),
        L('janda', 'A teď tě musím vtáhnout do knihy. Kvůli rozboru. Hledej KONEC kapitoly.'),
      ], () => Arena.start(MiniGames.book, () => Dialogue.start([
        L('janda', 'Dočetl jsi to! Celou kapitolu!'),
        L('janda', 'Rozbor na 4 strany do pátku. Metafory podtrhni zeleně.'),
      ], done('janda'))));
    },

    prynych() {
      Dialogue.start([
        L('player', 'Pane učiteli, já mám problém.'),
        L('prynych', 'Zkoušel jsi to dát do Excelu?', {
          choices: [
            { t: 'Ztratil jsem klíče.', then: [L('prynych', 'Kontingenční tabulka.'), L('player', 'Na klíče?'), L('prynych', 'Na všechno.')] },
            { t: 'Nemám partnera na ples.', then: [L('prynych', 'SVYHLEDAT.'), L('prynych', 'Případně XLOOKUP. Jsme moderní škola.')] },
            { t: 'Mám hlad.', then: [L('prynych', 'Graf. Koláčový.'), L('narrator', '*Graf byl překvapivě sytý.*')] },
          ],
          // svěření se Excelovému Císaři = achievement
        }),
        () => { Achievements.unlock('kontingencni'); },
        L('prynych', 'Víš co? Ukážu ti, jak Excel vidí svět.'),
        L('prynych', 'VŠECHNO JE TABULKA.'),
        { wait: 0.8, fx() { Game.flash('#1d7044', 0.5); Sound.sfx.bossIntro(); Game.shake(5, 0.6); } },
      ], () => Arena.start(MiniGames.excel, () => Dialogue.start([
        L('prynych', 'Vidíš? Všechno je tabulka. I ty.'),
        L('player', 'Já jsem buňka?'),
        L('prynych', 'Sloučená. S podmíněným formátováním.'),
      ], done('prynych'))));
    },

    ladman() {
      Dialogue.start([
        L('ladman', 'Má dáti?'),
        L('player', 'Nemám.'),
        L('ladman', 'Dal?'),
        L('player', 'Taky nemám.'),
        L('ladman', 'Tak to máš problém.'),
        L('ladman', 'Pojď, vyrovnáme ti rozvahu. Aktiva padají ze stropu. Pasiva taky.'),
      ], () => Arena.start(MiniGames.economy, () => Dialogue.start([
        L('ladman', 'Rozvaha sedí. Skoro.'),
        L('ladman', 'Zbytek dáme do ostatních nákladů. Tam se vejde všechno.'),
      ], done('ladman'))));
    },

    sign_hojer() {
      Dialogue.start([
        L('hojer', 'Podpis na přihlášku k maturitě? Jasně. Jen jedna otázka.'),
        L('hojer', 'Funguje ti to?', {
          choices: [
            { t: 'Ano.', then: [L('hojer', 'A zkoušel jsi to spustit?'), L('player', '…ano?'), L('hojer', 'Podepsáno. S warningem.')] },
            { t: 'Ne.', then: [L('hojer', 'Upřímnost! Za to podpis. A jednička.')] },
            { t: 'Co přesně?', then: [L('hojer', 'Všechno.'), L('player', 'Tak to ne.'), L('hojer', 'Jsi první, kdo se zeptal. Podepisuju.')] },
          ],
        }),
      ], done('sign_hojer'));
    },
    sign_batkova() {
      Dialogue.start([
        L('batkova', 'Podpis? Natürlich! Of course! Samozřejmě!'),
        L('batkova', 'Ale musíš se podepsat ve třech jazycích. Rychle. Jsem v časovém presu. Zeitdruck!'),
      ], () => Arena.start(MiniGames.qte, () => Dialogue.start([
        L('batkova', 'Wunderbar! Perfect! …Ujde to.'),
      ], done('sign_batkova'))));
    },
    sign_ladman() {
      Dialogue.start([
        L('ladman', 'Podpis stojí jednu korunu.', {
          choices: [
            { t: 'Zaplatím.', then: [L('ladman', 'Výborně. Zaúčtováno jako dar. Odečti si to z daní.')] },
            { t: 'Dejte to na fakturu.', then: [L('ladman', 'Splatnost 14 dní. Maturita za pár minut. Zajímavá investice.')] },
            { t: 'Nemám.', then: [L('ladman', 'Tak ti to dám na leasing. 0 % úrok. Jen dnes.')] },
          ],
        }),
        L('ladman', 'Podepsáno. Hodně štěstí. A schovej si účtenku.'),
      ], done('sign_ladman'));
    },
  };

  // ---------------------------------------------------------
  //  Interakce s postavou
  // ---------------------------------------------------------
  function talk(n) {
    const obj = Game.objectives.find(o => o.npc === n.id && !o.done);
    if (obj && MISSIONS[obj.id] && !(obj.id === 'nagr' && Game.glitchMission)) { Game.logAction('Mluvil s: ' + Sprites.CHARS[n.id].name); return MISSIONS[obj.id](); }
    if (obj && obj.id === 'nagr' && Game.glitchMission) return Dialogue.start([L('nagr', 'Ještě tam jsou bugy. Hledej věci, které vypadají divně. Víc divně než obvykle.')]);
    if (n.beh === 'pester') return Dialogue.start([L(n.id, 'Máš chvilku? …Ne? Tak nic. Hodně štěstí u maturity!')]);
    Dialogue.start([L(n.id, U.pickFresh('c_' + n.id, CAMEO[n.id] || CAMEO.pepa, 2))]);
  }

  // ---------------------------------------------------------
  //  Glitchnutá realita (Nágr)
  // ---------------------------------------------------------
  function glitchObjects() {
    return [
      { id: 'door', x: TX(20), y: TY(17), fixed: false, msg: [L('player', 'Dveře uprostřed chodby. Vedou… do chodby.'), L('narrator', 'Dveře.exe přesunuty do koše. Koš: 1 položka.')] },
      { id: 'vending', x: TX(13), y: TY(15), fixed: false, msg: [L('narrator', 'Automat se změnil v počítač. Modrá obrazovka: „Došly drobné.“'), L('narrator', 'Ctrl+Alt+Del… Automat je zpátky. Drobné pořád nevrací.')] },
      { id: 'moon', x: TX(38), y: TY(17), fixed: false, moving: true, msg: [L('kuba', 'Ahoj. Chodím pozpátku od pondělí. Nevím proč.'), L('player', '*otočí Kubu o 180°*'), L('kuba', 'Óóó. Dopředu je to fakt lepší. Díky!')] },
    ];
  }

  // ---------------------------------------------------------
  //  Vstup do místnosti
  // ---------------------------------------------------------
  function onEnterRoom(r) {
    if (r === 'r404') {
      if (Game.year >= 3 && !Game.flags.olgaDone && !Game.flags.olgaScene) return olgaScene();
      if (Game.year < 3 && !Game.flags.saw404) {
        Game.flags.saw404 = true;
        Achievements.unlock('motivace404');
        Director.say('Učebna 404: nenalezena. Tvoje motivace taky ne.');
      }
    }
    if (r === 'exam' && Game.year === 4 && !World.examLocked && !Game.flags.final) Game.startFinal();
    if (r === 'lib' && Game.year === 1 && !Game.flags.libHint) { Game.flags.libHint = true; Director.say('Knihovna. Tady jsem si stáhl celou literaturu. Nečetl jsem ji.'); }
  }

  function olgaScene() {
    Game.flags.olgaScene = true;
    Sound.stopMusic();
    Dialogue.start([
      { wait: 1.3, fx() { Game.flickerT = 1.3; Sound.sfx.glitch(); } },
      { wait: 2.4, fx() { Game.bigTitle = { text: 'LEGENDÁRNÍ UČITELKA SE VRÁTILA.', t: 0, dur: 2.4 }; Sound.sfx.bossIntro(); Game.shake(5, 0.8); Sound.playMusic('olga'); Game.npcs.push(npc('olga', 42, 24)); Game.burst(TX(42), TY(24) - 10, '#ffffff', 26, true); } },
      L('olga', 'Já už jsem v důchodu…'),
      { wait: 1.1 },
      L('olga', '…ALE MATEMATIKA NIKDY.'),
    ], () => Arena.start(MiniGames.olga, () => {
      Game.addTime(20, true);
      Dialogue.start([
        L('olga', 'Přežil jsi. Za jedna. S hvězdičkou.'),
        L('olga', 'A teď mě omluv. Mám v důchodu ještě tři sbírky příkladů.'),
      ], () => { Game.flags.olgaDone = true; Game.flags.olgaScene = false; Game.completeObjective('olga'); });
    }));
  }

  // ---------------------------------------------------------
  //  Předměty v prostředí
  // ---------------------------------------------------------
  const POSTER = {
    poster1: { 1: 'Plakát: „VÍTEJTE NA INFISU!“ Pod tím malým písmem: „Východ nebyl nalezen.“', 2: 'Plakát: „MIND THE GAP“ (ve znalostech).', 3: 'Plakát: „=SUMA(ŽIVOT)“ → #HODNOTA!', 4: 'Plakát: „MATURITA ZA 0 DNÍ. PANIKA POVOLENA.“' },
    poster2: 'Plakát: „NEBĚHAT PO CHODBĚ.“ Někdo připsal: „Shift = sprint.“',
    poster3: 'Školní řád, čl. 404: Motivace je volitelná.',
    poster4: 'Hledá se: STŘEDNÍK. Naposledy viděn v učebně C#. Odměna: BUILD SUCCESSFUL.',
    poster5: 'Knihovna: TICHO! (Platí i pro umělou inteligenci.)',
  };
  const THINGS = {
    vending: () => {
      Game.stats.vending++;
      if (Game.stats.vending >= 3) Achievements.unlock('investor');
      return U.pickFresh('vend', ['Automat: Vložte 20 Kč. *cvak* Automat snědl peníze a spokojeně mlaská.', 'Automat: Na skladě: vzduch (0,5 l). Cena: 35 Kč.', 'Automat ti vrátil drobné! …Ne. To byla jen halucinace z únavy.']);
    },
    window: ['Okno. Venku je svoboda. Tady je maturita.', 'Okno. Ptáci venku nemají maturitu. Závidíš jim.'],
    fountain: ['Pítko. Voda chutná jako rok 1998.', 'Napil ses. +1 hydratace, −1 důstojnost.'],
    plant: ['Kytka: „Taky tady trčím čtyři roky.“', 'Kytka je jediná, kdo tu fotosyntetizuje naplno.', 'Kytka vypadá, že ví víc o maturitě než ty.'],
    bench: ['Lavička. Sedět nemáš čas. Máš maturitu.'],
    trash: ['Koš. Obsahuje: 3 rohlíky, 1 přihlášku na VŠ a tvoje sny.'],
    edupage: ['Nástěnka: „Kroužek Excelu — každý den, navždy.“', 'Nástěnka: „Ztratil se středník. Poctivému nálezci BUILD SUCCESSFUL.“', 'Nástěnka: „Rozvrh na příští týden: ano.“'],
    clock: ['Školní hodiny. Jdou o 5 minut napřed. Nebo o 4 roky pozadu.'],
    banner_wall: () => ({ 1: 'Banner „VÍTEJTE NA INFISU!“ Někdo připsal „…navždy“.', 2: 'Banner „WILLKOMMEN · WELCOME“. Česky tu není nic. Typické.', 3: 'Banner „=VÍTEJTE(INFIS)“ vrací #NÁZEV?.', 4: 'Banner „MATURITA SE BLÍŽÍ“. Rychleji, než by sis přál.' })[Game.year],
    whiteboard_cs: ['Na tabuli: Console.WriteLine("Ahoj") — středník chybí. Typické.'],
    whiteboard_hw: ['Na tabuli: 1 GB = 1024 MB = 1 rohlík (přibližně).'],
    flags: ['Vlajky: česká, britská, německá. A někde je určitě i bílá. Na kapitulaci.'],
    globe: ['Glóbus. Někdo na něj fixou napsal „TADY JE INFIS“. Je to uprostřed Pacifiku.'],
    books: ['Knihy. Všechny o tom, jak napsat rozbor. Žádná ho nenapíše za tebe.', 'Kniha „Maturita pro úplné začátečníky“. Vypůjčena od roku 2015.', 'Kniha „C# za 21 dní“. Někdo připsal: „+ 4 roky“.'],
    tdesk: ['Katedra. Leží na ní stoh opravených testů. Tvůj je úplně dole. Naštěstí.'],
    rack: ['Server. Bliká. Asi je šťastný. Nebo hoří.', 'Server hučí. Prý počítá tvoje šance na maturitu. Pořád počítá.'],
    excelscreen: ['Projektor ukazuje Excel. Excel ukazuje tebe. Ve sloupci „RIZIKA“.'],
    printer: ['Tiskárna: Došel papír. A toner. A naděje.'],
    chart: ['Graf: Tvoje motivace v čase. Klesající. Velmi.'],
    safe: ['Trezor. Obsahuje 3 Kč a účtenku z roku 2009.'],
    trophy: ['Vitrína: „Pohár za nejrychlejší odchod z hodiny“. Vítěz neznámý — utekl.', 'Vitrína: Medaile „Účast“. Ta nejcennější.'],
    kiosk: ['EduPage kiosek: „Přihlaste se.“ Heslo jsi zapomněl už v 1. ročníku.'],
    olddesk: ['Starý stůl. Vyryto: „Byla tu matematika. A ještě tu je.“'],
    committee: ['Stůl komise. Zelený ubrus. Klasika. Je cítit strach a káva.'],
    tree: ['Strom. Roste tu déle, než trvá maturita. O dost.', 'Strom. Nemá maturitu a vede se mu skvěle.'],
    sign: ['Cedule: INFIS. Vstupem souhlasíš s podmínkami Excelu.'],
    bikes: ['Kola. Žádné není tvoje. Ty jezdíš autobusem zklamání.'],
    gate: () => {
      Achievements.unlock('prvni_den');
      return U.pickFresh('gate', ['Brána je zamčená. Útěk ze vzdělání není podporován.', 'Brána: „Odchod povolen po maturitě.“ Hmm.']);
    },
    poster1: () => POSTER.poster1[Game.year],
    poster2: [POSTER.poster2], poster3: [POSTER.poster3], poster4: [POSTER.poster4], poster5: [POSTER.poster5],
  };
  function inspect(id) {
    const th = THINGS[id];
    if (!th) return;
    const text = typeof th === 'function' ? th() : U.pickFresh('th_' + id, th, 1);
    Dialogue.start([L('narrator', text)]);
  }

  return { YEARS, YEAR_LINES, INTRO, setupYear, talk, MISSIONS, glitchObjects, onEnterRoom, inspect, CAMEO, TX, TY, npc };
})();
