'use strict';
// =============================================================
//  story.js — ročníky, rozmístění učitelů, mise, dialogy, vtipy.
//  VŠECHNY DIALOGY JSOU SMYŠLENÉ. Učitelé jsou přehnané, ale
//  laskavé herní postavy — žádné urážky, jen školní humor.
// =============================================================
const Story = (() => {
  const YEARS = {
    1: { title: '1. ROČNÍK', sub: 'JEŠTĚ MÁŠ NADĚJI', note: 'Září. Svítí slunce. Ještě netušíš nic.' },
    2: { title: '2. ROČNÍK', sub: 'TEĎ UŽ JE POZDĚ ODEJÍT', note: 'Zima. Sníh. Vánoční stromek v hale. Angličtina.' },
    3: { title: '3. ROČNÍK', sub: 'EXCEL TĚ VIDÍ', note: 'Podzim. Západ slunce. Všechno je tabulka.' },
    4: { title: '4. ROČNÍK', sub: 'MATURITA SE BLÍŽÍ', note: 'Noc před maturitou. Škola je otevřená. Proč?' },
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
    L('narrator', 'Klikni do hry a rozhlížej se myší. Žlutá značka ukazuje cíl.'),
  ];

  // ---------------------------------------------------------
  //  rozmístění postav
  // ---------------------------------------------------------
  const CORR = (x0, x1) => ({ x0, x1, z0: -0.2, z1: 1.6 });
  function setupYear(y) {
    let npcs = [], objectives = [];
    if (y === 1) {
      npcs = [
        { id: 'hojer', x: -22.6, z: -7.8, yaw: 0 },
        { id: 'horvath', x: -11.8, z: -6.8, yaw: 0 },
        { id: 'nagr', x: -12, z: 0.8, beh: 'wander', area: CORR(-20, -4) },
        { id: 'pepa', x: 12, z: 0.8, beh: 'wander', area: CORR(5, 25) },
        { id: 'klara', x: -4.2, z: 4.4, yaw: -Math.PI / 2 },
        { id: 'kuba', x: 19.7, z: 15.6, yaw: 0 },
      ];
      objectives = [
        { id: 'hojer', npc: 'hojer', text: 'Pomoz Hojerovi' },
        { id: 'horvath', npc: 'horvath', text: 'Najdi RAM pro Horvátha' },
        { id: 'nagr', npc: 'nagr', text: 'Promluv s Nágrem', sub: () => Game.glitchMission ? `Bugy ${Game.glitchMission.fixed}/3` : null },
      ];
    } else if (y === 2) {
      npcs = [
        { id: 'novak', x: -0.6, z: -7.7, yaw: 0 },
        { id: 'batkova', x: 2.35, z: -4.4, yaw: -Math.PI / 2 },
        { id: 'janda', x: 12.6, z: -7.6, yaw: 0 },
        { id: 'hojer', x: -24, z: 0.8, beh: 'wander', area: CORR(-28, -14) },
        { id: 'nagr', x: 3.2, z: 4.6, yaw: -Math.PI / 2 },
        { id: 'horvath', x: 65.4, z: 1.5, yaw: Math.PI / 2 },
        { id: 'pepa', x: 16, z: 0.8, beh: 'wander', area: CORR(10, 27) },
        { id: 'klara', x: 5.2, z: -3.2, yaw: Math.PI },
      ];
      objectives = [
        { id: 'novak', npc: 'novak', text: 'Přežij angličtinu' },
        { id: 'batkova', npc: 'batkova', text: 'Promluv s Baťkovou' },
        { id: 'janda', npc: 'janda', text: 'Navštiv knihovnu' },
      ];
    } else if (y === 3) {
      npcs = [
        { id: 'prynych', x: 22, z: -8.0, yaw: 0 },
        { id: 'ladman', x: -22.3, z: 7.6, yaw: Math.PI },
        { id: 'novak', x: 16, z: 0.8, beh: 'wander', area: CORR(10, 27) },
        { id: 'batkova', x: -3, z: 4.6, yaw: Math.PI / 2 },
        { id: 'janda', x: -7, z: 1.2, yaw: Math.PI },
        { id: 'hojer', x: -22.6, z: -7.8, yaw: 0 },
        { id: 'horvath', x: -11.8, z: -6.8, yaw: 0 },
        { id: 'nagr', x: -42, z: 2, yaw: Math.PI / 2 },
        { id: 'pepa', x: -15, z: 0.8, beh: 'wander', area: CORR(-27, -8) },
      ];
      objectives = [
        { id: 'prynych', npc: 'prynych', text: 'Excel lab' },
        { id: 'ladman', npc: 'ladman', text: 'Vyrovnej účty' },
        { id: 'olga', optional: true, text: 'Učebna 404', target: () => ({ x: World.ROOMS.r404.dx, z: World.ROOMS.r404.dz }) },
      ];
    } else {
      npcs = [
        { id: 'hojer', x: -26.5, z: 0.8, yaw: Math.PI / 2 },
        { id: 'batkova', x: 0, z: 4.8, yaw: Math.PI },
        { id: 'ladman', x: -38.6, z: 13.2, yaw: -Math.PI / 2 },
        { id: 'prynych', x: -8, z: 0.8, beh: 'pester', area: CORR(-20, 5) },
        { id: 'novak', x: 12, z: 0.8, beh: 'pester', area: CORR(5, 27) },
        { id: 'janda', x: 12.6, z: -7.6, yaw: 0 },
        { id: 'nagr', x: 3.2, z: 4.6, yaw: -Math.PI / 2 },
        { id: 'horvath', x: 4, z: 17, yaw: Math.PI },
        { id: 'klara', x: -14, z: 0.8, beh: 'wander', area: CORR(-27, -10) },
      ];
      if (Game.flags.olgaDone) npcs.push({ id: 'olga', x: -14.5, z: 7.6, yaw: Math.PI });
      objectives = [
        { id: 'sign_hojer', npc: 'hojer', text: 'Podpis — Hojer' },
        { id: 'sign_batkova', npc: 'batkova', text: 'Podpis — Baťková' },
        { id: 'sign_ladman', npc: 'ladman', text: 'Podpis — Láďman (parkoviště)' },
      ];
    }
    return { npcs, objectives };
  }

  // ---------------------------------------------------------
  //  hlášky, když učitel zrovna nemá misi
  // ---------------------------------------------------------
  const CAMEO = {
    hojer: ['Tak co, už ti to funguje?', 'Jestli to nefunguje, zkus to vypnout a zapnout. Na mě to taky platí.', 'Středník se vrátil. Prý kvůli lepším podmínkám.', 'Dneska píšeme test v C#. Na papír. Ručně. S IntelliSense v hlavě.'],
    nagr: ['To není chodba. To je pole o délce 60.', 'Vidím bug. …Jo, to jsi ty. Ale funkční.', 'Breakpoint. …Tak, a teď se ani nehni. Krokuju tě.', 'Tvoje docházka hází warning. Zatím jen warning.', 'Parkoviště je jen velké pole aut. Indexované od nuly.'],
    horvath: ['Tvoje kroky za dnešek: 2 341. Zapisuju do datasetu.', 'Kolik FPS má tahle chodba? Odhaduju 60. Vlastní engine, respekt.', 'Ten rohlík DDR5 pořád běží. Teplota 21 °C. Stabilní.', 'Data nelžou. Lidi jo. Hlavně o domácích úkolech.', 'Tramvaj č. 4 má zpoždění 3,7 s. Zapisuju. Tohle je nejlepší den mého života.'],
    novak: ['Hello! How are you? …Don\'t answer, we don\'t have time.', 'Mind the gap. Between you and maturita.', 'Present perfect is perfect. You are not. Yet.', 'Speak English! …Or at least try. Or at least smile.'],
    batkova: ['Hallo! Hello! Ahoj! …Kde to vlastně jsem?', 'Der, die, das. Ten, ta, to. Ty, tady, teď.', 'Ich bin müde. I am tired. Já jsem… v pátek.', 'Guten Tag! Have a nice den!', 'Frohe Weihnachten! Merry Christmas! Hezké Vánoce! Teď test.'],
    janda: ['Škola je metafora. Ty jsi personifikace únavy.', 'Čti knihy. Nebo aspoň obaly. Obaly jsou taky literatura.', 'Tahle chodba je jako román. Dlouhá a nikdo ji nedočte.', 'Hodně štěstí u maturity. Nebo aspoň u rozboru.'],
    prynych: ['Zkoušel jsi to dát do Excelu?', 'Život je jedna velká kontingenční tabulka.', 'SVYHLEDAT tě najde. Vždycky.', 'Graf ti řekne víc než tisíc slov. Hlavně koláčový.'],
    ladman: ['Má dáti, dal. Já dal. Ty dáš?', 'Tvůj čas je aktivum. A právě ho odepisuješ.', 'Úsměv je zadarmo. Ale DPH z něj zaplatíš.', 'Rozvaha nikdy nelže. Jen se občas nesejde.'],
    olga: ['Matematika je věčná. Já taky.', 'Ještě jednou mě zavolej „paní učitelko v důchodu“ a dostaneš integrál.'],
    pepa: ['Máš úkol z matiky? …Já taky ne.', 'Prý se na maturitu nemusí učit. Řekl mi to MATURITRON.', 'Bufet má nový rohlík. Prý DDR5.', 'Neviděl jsi můj středník? Utekl mi o přestávce.', 'Na parkovišti stojí oranžový auťák s klíčkama. Jen říkám.'],
    klara: ['Já jsem tu od 1. ročníku. Pořád hledám východ.', 'Učím se na maturitu. Stihla jsem obal sešitu.', 'Slyšela jsem, že v učebně 404 straší. Matematika.', 'Excel lab je otevřený do 22:00. A pak se zavře. Navždy.'],
    kuba: ['Já jsem z vedlejší třídy. Tady jen čekám na Wi-Fi.', 'INFIS-GUEST: připojeno, bez internetu. Jako já.', 'Prý tu někde chodí AI. Jestli jo, dlužím jí úkol.', 'Tramvaj čtyřka jede přímo k Úřadu práce. Plánuju dopředu.'],
    komise: ['Posaďte se. Teda… postavte se. Nemáme židli.'],
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
        L('hojer', 'A on ti zrovna utíká po třídě. Chyť ho! Třikrát. Je to rekurze.'),
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
        { wait: 0.9, fx() { Game.glitch(1.2); Sound.sfx.glitch(); Game.shake(0.4, 0.5); } },
        L('nagr', 'Realita má bugy. Dveře uprostřed chodby, automat ve vestibulu a jeden spolužák. Oprav je.'),
        L('nagr', 'Já si mezitím dám breakpoint. Na kafe.'),
      ], () => startGlitchMission());
    },
    nagrOutro() {
      Dialogue.start([L('nagr', '0 errors. 47 warnings.'), L('nagr', 'Warningy neřešíme. To je feature.')], () => { Achievements.unlock('realita'); Game.completeObjective('nagr'); });
    },
    novak() {
      const meter = (p) => () => { const P = Game.player; UI.floatText(P.x, 2.3, P.z, `ÚNIK Z ANGLIČTINY: ${p} %`, '#7fdcff'); Sound.sfx.collect(); };
      Dialogue.start([
        L('novak', 'Good morning! Today we practise conversation. Tell me about your future.', {
          choices: [
            { t: 'My future is loading…', then: [L('novak', 'Loading?'), L('player', 'Error 404. Future not found.'), L('novak', '…That is honestly the most honest answer this year.')], fn: meter(33) },
            { t: 'I am future. Future is me.', then: [L('novak', 'That\'s… deep. Grammatically, no.')], fn: meter(33) },
            { t: 'Yes.', then: [L('novak', 'That was not a yes-or-no question.'), L('player', 'Yes.')], fn: meter(33) },
          ],
        }),
        L('novak', 'Interesting. And how did you get to school today?', {
          choices: [
            { t: 'By tram number four. Very tram.', then: [L('novak', '„Very tram.“ I will put it on the wall.')], fn: meter(66) },
            { t: 'I drive car. Not my car.', then: [L('novak', 'Whose car?'), L('player', 'Yes.'), L('novak', '…I need a coffee.')], fn: meter(66) },
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
      const castle = { wait: 3.2, fx() { Game.castle(3.2); Achievements.unlock('metafora'); } };
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
        { wait: 0.6, fx() { Game.glitch(0.6); Sound.sfx.teleport(); UI.fade(true); setTimeout(() => UI.fade(false), 450); } },
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
        }),
        () => Achievements.unlock('kontingencni'),
        L('prynych', 'Víš co? Ukážu ti, jak Excel vidí svět.'),
        L('prynych', 'VŠECHNO JE TABULKA.'),
        { wait: 1.0, fx() { Game.flash([0.13, 0.64, 0.4], 0.8); Sound.sfx.bossIntro(); Game.shake(0.6, 0.8); Tex.swap('wall_in', 'wall_excel'); Tex.swap('wall_low', 'wall_low_excel'); Tex.swap('floor_class', 'floor_excel'); } },
      ], () => {
        Tex.swap('wall_in'); Tex.swap('wall_low'); Tex.swap('floor_class');
        Arena.start(MiniGames.excel, () => Dialogue.start([
          L('prynych', 'Vidíš? Všechno je tabulka. I ty.'),
          L('player', 'Já jsem buňka?'),
          L('prynych', 'Sloučená. S podmíněným formátováním.'),
        ], done('prynych')));
      });
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
        L('batkova', 'Ale musíš se podepsat ve třech jazycích. Rychle. Mačkej písmena! Zeitdruck!'),
      ], () => MiniGames.QTE.start(() => Dialogue.start([L('batkova', 'Wunderbar! Perfect! …Ujde to.')], done('sign_batkova'))));
    },
    sign_ladman() {
      Dialogue.start([
        L('ladman', 'Á, student. Koukáš na to oranžové auto? Mám ho na leasing. Teda… měl jsem.'),
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

  function talk(n) {
    const obj = Game.objectives.find(o => o.npc === n.id && !o.done);
    if (obj && MISSIONS[obj.id] && !(obj.id === 'nagr' && Game.glitchMission)) { Game.logAction('Mluvil s: ' + Chars.SPECS[n.id].name); return MISSIONS[obj.id](); }
    if (obj && obj.id === 'nagr' && Game.glitchMission) {
      if (Game.glitchMission.fixed >= 3) return MISSIONS.nagrOutro();
      return Dialogue.start([L('nagr', 'Ještě tam jsou bugy. Hledej věci, které vypadají divně. Víc než obvykle.')]);
    }
    if (n.beh === 'pester') return Dialogue.start([L(n.id, 'Máš chvilku? …Ne? Tak nic. Hodně štěstí u maturity!')]);
    Dialogue.start([L(n.id, U.pickFresh('c_' + n.id, CAMEO[n.id] || CAMEO.pepa, 2))]);
  }

  // ---------------------------------------------------------
  //  Nágr: oprava reality
  // ---------------------------------------------------------
  function startGlitchMission() {
    const gm = { fixed: 0, items: {} };
    Game.glitchMission = gm;
    Game.wobble = 0.18;
    // 1) dveře uprostřed chodby
    gm.items.door = Ents.add({ tag: 'glitch', kind: 'deco', spr: 'door_float', x: -16, z: 0.6, y: 1.25, w: 1.05, upright: true, upd(e) { e.y = 1.25 + Math.sin(e.t * 2) * 0.1; } });
    gm.items.doorBug = Ents.add({ tag: 'glitch', kind: 'deco', spr: 'bug', x: -16, z: 0.6, y: 2.7, w: 0.5, bob: 0.15, shadow: false });
    // 2) automat se změnil v počítač
    Tex.swap('vending', 'vending_pc');
    gm.items.vendBug = Ents.add({ tag: 'glitch', kind: 'deco', spr: 'bug', x: -5.4, z: 4.4, y: 2.4, w: 0.5, bob: 0.15, shadow: false });
    // 3) Kuba chodí pozpátku
    const k = Game.addTemp('kuba', 6, 0.8);
    k.beh = 'moonwalk'; k.area = CORR(-2, 14); k.glitch = true;
    gm.items.kuba = k;
    Game.extraInteract = [
      { id: 'g_door', x: -16, z: 0.6, r: 1.6, label: 'Opravit dveře', fn: () => fixBug('door') },
      { id: 'g_vend', x: -4.7, z: 4.4, r: 1.8, label: 'Opravit automat', fn: () => fixBug('vend') },
      { id: 'g_vend2', x: -4.7, z: 5.6, r: 1.8, label: 'Opravit automat', fn: () => fixBug('vend') },
      { id: 'g_kuba', npcRef: k, r: 1.8, label: 'Opravit Kubu', fn: () => fixBug('kuba') },
    ];
  }
  function fixBug(which) {
    const gm = Game.glitchMission; if (!gm || gm.items[which + 'Fixed']) return;
    gm.items[which + 'Fixed'] = true;
    const after = () => {
      gm.fixed++;
      const P = Game.player; UI.floatText(P.x, 2.4, P.z, `FIXED ${gm.fixed}/3`, '#3cff7a'); Sound.sfx.collect(); Ents.burst(P.x, 1.5, P.z, '#3cff7a', 20);
      Game.extraInteract = Game.extraInteract.filter(i => !i.id.startsWith('g_' + which));
      if (gm.fixed >= 3) {
        Game.wobble = 0; Game.extraInteract = [];
        UI.big('REALITA OPRAVENA — 0 ERRORS', 2, '#3cff7a');
        Director.say('Hm. Splněno. Asi bug v mé logice.');
      }
    };
    if (which === 'door') {
      Dialogue.start([L('player', 'Dveře uprostřed chodby. Vedou… do chodby.'), L('narrator', 'Dveře.exe přesunuty do koše. Koš: 1 položka.')], () => { gm.items.door.dead = true; gm.items.doorBug.dead = true; after(); });
    } else if (which === 'vend') {
      Dialogue.start([L('narrator', 'Automat se změnil v počítač. Modrá obrazovka: „Došly drobné.“'), L('narrator', 'Ctrl+Alt+Del… Automat je zpátky. Drobné pořád nevrací.')], () => { Tex.swap('vending'); gm.items.vendBug.dead = true; after(); });
    } else {
      const k = gm.items.kuba;
      Dialogue.start([L('kuba', 'Ahoj. Chodím pozpátku od pondělí. Nevím proč.'), L('player', '*otočí Kubu o 180°*'), L('kuba', 'Óóó. Dopředu je to fakt lepší. Díky!')], () => { k.beh = 'wander'; k.glitch = false; after(); });
    }
  }

  // ---------------------------------------------------------
  //  Vstup do místnosti
  // ---------------------------------------------------------
  function onEnterRoom(r) {
    if (r === 'r404') {
      if (Game.year === 3 && !Game.flags.olgaDone && !Game.flags.olgaScene) return olgaScene();
      if (Game.year < 3 && !Game.flags.saw404) { Game.flags.saw404 = true; Achievements.unlock('motivace404'); Director.say('Učebna 404: nenalezena. Tvoje motivace taky ne.'); }
    }
    if (r === 'lib' && Game.year === 1 && !Game.flags.libHint) { Game.flags.libHint = true; Director.say('Knihovna. Tady jsem si stáhl celou literaturu. Nečetl jsem ji.'); }
    if (r === 'exam' && Game.year === 4 && Game.flags.examOpen && !Game.flags.final) startFinal();
  }

  function olgaScene() {
    Game.flags.olgaScene = true;
    Sound.stopMusic();
    Game.cutscene = true;
    Dialogue.start([
      { wait: 1.4, fx() { Game.flicker(1.4); Sound.sfx.glitch(); } },
      { wait: 2.6, fx() { UI.big('LEGENDÁRNÍ UČITELKA SE VRÁTILA.', 2.6, '#ffe27a'); Sound.sfx.bossIntro(); Game.shake(0.6, 0.8); Sound.playMusic('olga'); const o = Game.spawnNpc({ id: 'olga', x: -14.5, z: 7.6, yaw: Math.PI }); Ents.burst(o.x, 1.2, o.z, '#ffffff', 40, { up: 4 }); Ents.burst(o.x, 1.2, o.z, '#e6b3ff', 30, { up: 5 }); } },
      L('olga', 'Já už jsem v důchodu…'),
      { wait: 1.1 },
      L('olga', '…ALE MATEMATIKA NIKDY.', { mood: 'angry' }),
    ], () => {
      Game.cutscene = false;
      Arena.start(MiniGames.olga, () => {
        Game.addTime(20, true);
        Dialogue.start([
          L('olga', 'Přežil jsi. Za jedna. S hvězdičkou.'),
          L('olga', 'Tady máš 20 sekund navíc. Ze sbírky příkladů, strana 404.'),
          L('olga', 'A teď mě omluv. Mám v důchodu ještě tři sbírky příkladů.'),
        ], () => { Game.flags.olgaDone = true; Game.completeObjective('olga'); });
      });
    });
  }

  // ---------------------------------------------------------
  //  FINÁLE
  // ---------------------------------------------------------
  function startFinal() {
    Game.flags.final = true;
    Game.cutscene = true;
    Director.clearEvents();
    const R = World.ROOMS.exam;
    Game.setNpcs([
      { id: 'komise', x: R.cx, z: 8.15, yaw: Math.PI },
      { id: 'janda', x: R.cx - 1.6, z: 8.15, yaw: Math.PI },
      { id: 'batkova', x: R.cx + 1.6, z: 8.15, yaw: Math.PI },
    ]);
    Game.teleport(R.cx, 4.2, 0);
    Sound.stopMusic();
    Dialogue.start([
      L('komise', 'Dobrý den. Posaďte se. Teda… postavte se. Nemáme židli.'),
      L('komise', 'Vylosujte si maturitní otázku.', {
        choices: [
          { t: 'Otázka č. 1: Excel', then: [L('komise', 'Výborně. Máte 15 minut na přípravu.')] },
          { t: 'Otázka č. 7: C#', then: [L('komise', 'Výborně. Středník máte?'), L('player', 'Chytil jsem ho.')] },
          { t: 'Otázka č. 404', then: [L('komise', 'Ta otázka… neexistuje.'), L('player', 'Jako moje příprava.')] },
        ],
      }),
      L('player', 'Já mám na přípravu tak 15 sekund.'),
      { wait: 1.0, fx() { Game.glitch(1.0); Sound.sfx.glitch(); Game.shake(0.5, 1); Game.flicker(1.0); } },
      L('maturitron', 'POČKAT.', { mood: 'angry' }),
      L('maturitron', 'TY CHCEŠ OPRAVDU ODMATUROVAT?', { mood: 'angry' }),
      L('maturitron', 'VŽDYŤ JSI CELOU HRU JEN UTÍKAL!', { mood: 'angry' }),
      L('janda', 'To je… personifikace počítače?'),
      L('maturitron', 'KOMISE, ODCHOD NA OBĚD. TUHLE ZKOUŠKU POVEDU JÁ.', { mood: 'angry' }),
      { wait: 1.2, fx() { Game.glitch(1.3); Sound.sfx.bossIntro(); Game.flash([1, 0.1, 0.2], 1); UI.fade(true); setTimeout(() => UI.fade(false), 700); } },
    ], () => {
      Game.cutscene = false;
      Arena.start(MiniGames.boss, () => {
        // po vítězství zpět v sále
        Game.teleport(R.cx, 4.4, 0);
        Game.setNpcs([{ id: 'komise', x: R.cx, z: 8.15, yaw: Math.PI }, { id: 'janda', x: R.cx - 1.6, z: 8.15, yaw: Math.PI }, { id: 'batkova', x: R.cx + 1.6, z: 8.15, yaw: Math.PI }, { id: 'prynych', x: R.x0 + 1.5, z: 6.5, yaw: Math.PI / 2 }, { id: 'hojer', x: R.x1 - 1.5, z: 6.5, yaw: -Math.PI / 2 }]);
        Game.timerOn = false;
        Ents.confetti(R.cx, 3, 6, 260, 6);
        Sound.sfx.victory();
        Dialogue.start([
          L('maturitron', 'Cože? Ty jsi odmaturoval? To… to není možné. Restartuji se.', { mood: 'error' }),
          L('komise', '…Kde jsme to byli? Aha.'),
          L('komise', 'Gratulujeme. Prospěl jste. Tak nějak.'),
          L('prynych', 'Zapíšu to do Excelu. Zeleně.'),
          L('hojer', 'A zkoušel jsi to spustit? …Jo, vidím. Funguje to.'),
        ], () => Game.victory());
      });
    });
  }

  // ---------------------------------------------------------
  //  Předměty v prostředí
  // ---------------------------------------------------------
  const THINGS = {
    vending: () => { Game.stats.vending++; if (Game.stats.vending >= 3) Achievements.unlock('investor'); return U.pickFresh('vend', ['Automat: Vložte 20 Kč. *cvak* Automat snědl peníze a spokojeně mlaská.', 'Automat: Na skladě: vzduch (0,5 l). Cena: 35 Kč.', 'Automat ti vrátil drobné! …Ne. To byla jen halucinace z únavy.']); },
    vending2: () => THINGS.vending(),
    plant: ['Kytka: „Taky tady trčím čtyři roky.“', 'Kytka je jediná, kdo tu fotosyntetizuje naplno.'],
    bench: ['Lavička. Sedět nemáš čas. Máš maturitu.'],
    trash: ['Koš. Obsahuje: 3 rohlíky, 1 přihlášku na VŠ a tvoje sny.'],
    clock: ['Školní hodiny. Jdou o 5 minut napřed. Nebo o 4 roky pozadu.'],
    whiteboard_cs: ['Na tabuli: Console.Write("Ahoj") — středník chybí. Typické.'],
    rack: ['Server. Bliká. Asi je šťastný. Nebo hoří.', 'Server hučí. Prý počítá tvoje šance na maturitu. Pořád počítá.'],
    excelscreen: ['Projektor ukazuje Excel. Excel ukazuje tebe. Ve sloupci „RIZIKA“.'],
    books: ['Knihy. Všechny o tom, jak napsat rozbor. Žádná ho nenapíše za tebe.', 'Kniha „Maturita pro úplné začátečníky“. Vypůjčena od roku 2015.', 'Kniha „C# za 21 dní“. Někdo připsal: „+ 4 roky“.'],
    flags: ['Vlajky: česká, britská, německá. A někde je určitě i bílá. Na kapitulaci.'],
    safe: ['Trezor. Obsahuje 3 Kč a účtenku z roku 2009.'],
    olddesk: ['Starý stůl. Vyryto: „Byla tu matematika. A ještě tu je.“'],
    committee: ['Stůl komise. Zelený ubrus. Klasika. Je cítit strach a káva.'],
    wc: ['WC: „Mimo provoz od roku 2019.“ Pod tím tužkou: „Jako moje motivace.“'],
    bufet: ['Bufet: „Rohlík DDR5 — 12 Kč.“ Paní za pultem: „Došly. Všechny si vzal nějaký Horváth.“', 'Bufet: „Kafe síly C#.“ Ochutnal jsi. Teď vidíš kód.'],
    trophy: ['Vitrína: „Pohár za nejrychlejší odchod z hodiny“. Vítěz neznámý — utekl.', 'Vitrína: Medaile „Účast“. Ta nejcennější.'],
    kiosk: ['EduPage kiosek: „Přihlaste se.“ Heslo jsi zapomněl už v 1. ročníku.'],
    staffdoor: ['Sborovna. Zamčeno. Slyšíš smích. Asi opravují testy.', 'Na dveřích sborovny: „NERUŠIT — KÁVA PROBÍHÁ“.'],
    sign: () => { return 'Cedule: INFIS — Střední škola informatiky a finančních služeb. Vstupem souhlasíš s podmínkami Excelu.'; },
    bikes: ['Kola. Žádné není tvoje. Ty jezdíš tramvají zklamání.'],
    tramstop: ['Zastávka Borský park. Tramvaj č. 4: „Další spoj za 404 s.“', 'Jízdní řád: Bory → Úřad práce → Bory. Kruh se uzavírá.'],
    ambulance: () => { Achievements.unlock('zachranka'); return 'Záchranka. Řidič: „Maturita? To je u nás nejčastější diagnóza v květnu.“'; },
    urad: () => { Achievements.unlock('urad'); return U.pickFresh('urad', ['Úřad práce ČR. Paní za přepážkou: „Vy jste z INFISu? Přijďte po maturitě. Máme pro vás místo. Hned vedle.“', 'Úřad práce: „Číslo 404, jste na řadě.“ Ty nemáš číslo. Ty nemáš nic.']); },
    parcelbox: () => { Achievements.unlock('balik'); return 'Balíkobox: „Zadejte kód.“ Zadal jsi „maturita“. Balík: „Nesprávný kód. Zkuste to v září.“'; },
    parkbench: ['Lavička v Borském parku. Tady by se dalo učit. Teoreticky.'],
    cork: ['Nástěnka: „Jak přežít písemku“. Bod 1: nepsat ji. Body 2–7 někdo strhl.', 'Nástěnka: „Pomoc nekuřákům“. Pod tím: „Pomoc maturantům“ — prázdný papír.'],
    firmy: ['Nástěnka „fiktivní firmy — To jsme my“. Firma INFIS s.r.o.: zisk 0 Kč, ztráta 4 roky.', 'Fiktivní firma „CLEANERS s.r.o.“. Uklidili i tvoje známky.'],
    poster_run: ['Plakát: „NEBĚHAT PO CHODBĚ.“ Někdo připsal: „Shift = sprint.“'],
    poster_404: ['Školní řád, čl. 404: Motivace je volitelná.'],
    poster_semicolon: ['Hledá se: STŘEDNÍK. Naposledy viděn v učebně C#. Odměna: BUILD SUCCESSFUL.'],
    poster_maturita: ['Plakát: „MATURITA ZA 0 DNÍ. PANIKA POVOLENA.“'],
    poster_excel: ['Plakát: „Kroužek Excelu — každý den, navždy.“'],
    poster_welcome: () => ({ 1: 'Plakát: „VÍTEJTE NA INFISU!“ Pod tím malým písmem: „Východ nebyl nalezen.“', 2: 'Plakát: „WILLKOMMEN · WELCOME“. Česky tu není nic. Typické.', 3: 'Plakát: „=VÍTEJTE(INFIS)“ vrací #NÁZEV?.', 4: 'Plakát: „MATURITA SE BLÍŽÍ“. Rychleji, než by sis přál.' })[Game.year],
  };
  function inspect(id) {
    const th = THINGS[id];
    if (!th) return;
    const text = typeof th === 'function' ? th() : U.pickFresh('th_' + id, th, 1);
    Game.logAction('Prozkoumal: ' + id);
    Dialogue.start([L('narrator', text)]);
  }

  return { YEARS, YEAR_LINES, INTRO, setupYear, talk, MISSIONS, onEnterRoom, inspect, CAMEO, startFinal, fixBug };
})();
