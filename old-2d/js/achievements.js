'use strict';
// =============================================================
//  achievements.js — absurdní achievementy s animací
// =============================================================
const Achievements = (() => {
  const LIST = {
    prvni_den:    ['PRVNÍ DEN A UŽ CHCEŠ DOMŮ', 'Zkusil jsi utéct hlavní bránou.'],
    ctrlcv:       ['CTRL+C, CTRL+V MASTER', 'Zmáčkl jsi Ctrl+C nebo Ctrl+V. Ve hře. Proč?'],
    excel_trauma: ['EXCELENTNÍ TRAUMA', 'Porazil jsi EXCEL.EXE.'],
    motivace404:  ['404: MOTIVACE NOT FOUND', 'Vešel jsi do prázdné učebny 404.'],
    kontingencni: ['ŽIVOT JE JEDNA VELKÁ KONTINGENČNÍ TABULKA', 'Svěřil ses Excelovému Císaři.'],
    speedrun:     ['MATURITA SPEEDRUNNER', 'Odmaturuj s víc než 3 minutami v záloze.'],
    nepritomen:   ['NEPŘÍTOMEN DUŠEVNĚ', 'Dal sis pauzu třikrát. Duchem jinde.'],
    prezivac:     ['PROFESIONÁLNÍ PŘEŽÍVAČ', 'Odmaturuj i přes 10+ zásahů.'],
    absolvent:    ['ABSOLVENT INFISU', 'Složil jsi maturitu. Legenda.'],
    architektura: ['ARCHITEKTURA ŠKOLY OVĚŘENA', 'Narazil jsi 5× do zdi. Zdi drží.'],
    aktivni:      ['AKTIVNÍ ÚČAST VE VÝUCE', 'Stál jsi 20 sekund bez hnutí.'],
    matematika:   ['MATEMATIKA PŘEŽITA', 'Legendární učitelka tě nechala žít.'],
    rohlik:       ['ROHLÍK DDR5', 'Nainstaloval jsi pečivo do počítače.'],
    build:        ['BUILD SUCCESSFUL', 'Chytil jsi uprchlý středník.'],
    realita:      ['REALITA OPRAVENA', '0 errors. 47 warnings.'],
    sorry:        ['SORRY FOR MY ENGLISH', 'Utekl jsi z anglické konverzace.'],
    polyglot:     ['POLYGLOT (NEDOBROVOLNÝ)', 'Přežil jsi jazykový chaos.'],
    metafora:     ['ŠKOLA JE HRAD', 'Tvoje metafora se stala realitou.'],
    rozvaha:      ['ÚČETNĚ NEVIDITELNÝ', 'Vyrovnal jsi rozvahu.'],
    investor:     ['INVESTOR ROKU', 'Krmil jsi automat 3×. Nic nevydal.'],
    konami:       ['CHEATER (NAHLÁŠENO)', '↑↑↓↓←→←→BA. MATURITRON to viděl.'],
    vecny:        ['VĚČNÝ STUDENT', 'Čas vypršel. Uvidíme se v září.'],
    vysoka:       ['MENTÁLNÍ KAPACITA NEDOSTATEČNÁ', 'Zkusil jsi jít na vysokou.'],
    edupage:      ['47 NOVÝCH ZNÁMEK', 'Zavřel jsi všechna okna EduPage.'],
    chvilka:      ['MÁŠ CHVILKU?', 'Učitel tě odchytil na chodbě.'],
    utek:         ['ÚTĚK Z PÍSEMKY', 'Utekl jsi před náhodným testem.'],
    // náhodné od MATURITRONA
    r_umela:      ['UMĚLÁ INTELIGENCE, PŘIROZENÁ HLOUPOST', 'Dostal jsi achievement od AI. Za nic.'],
    r_dochazka:   ['DOCHÁZKA: 3 %', 'Ale ta 3 % byla intenzivní.'],
    r_prezuvky:   ['ZAPOMNĚL JSI SI PŘEZŮVKY', 'Klasika.'],
    r_nazivu:     ['OFICIÁLNĚ NAŽIVU', 'Gratulujeme k existenci.'],
    r_nejlepsi:   ['NEJLEPŠÍ STUDENT V TÉTO MÍSTNOSTI', 'Jsi tu sám.'],
    r_klik:       ['ZMÁČKL JSI KLÁVESU', 'Pokrok je pokrok.'],
  };
  const RANDOM_POOL = ['r_umela', 'r_dochazka', 'r_prezuvky', 'r_nazivu', 'r_nejlepsi', 'r_klik'];

  let unlocked = new Set();
  let toasts = [];
  const allTime = new Set(Store.get('infis_ach', []));

  function unlock(id) {
    if (!LIST[id] || unlocked.has(id)) return false;
    unlocked.add(id); allTime.add(id);
    Store.set('infis_ach', [...allTime]);
    toasts.push({ id, t: 0 });
    Sound.sfx.achievement();
    return true;
  }
  function randomUnlock() {
    const pool = RANDOM_POOL.filter(id => !unlocked.has(id));
    if (!pool.length) return false;
    return unlock(U.pick(pool));
  }
  function update(dt) {
    if (toasts.length) { toasts[0].t += dt; if (toasts[0].t > 3.4) toasts.shift(); }
  }
  function draw(ctx, gt) {
    if (!toasts.length) return;
    const ts = toasts[0], [title, desc] = LIST[ts.id];
    const k = ts.t < 0.35 ? ts.t / 0.35 : ts.t > 3.0 ? 1 - (ts.t - 3.0) / 0.4 : 1;
    const e = 1 - Math.pow(1 - U.clamp(k, 0, 1), 3);
    ctx.font = U.font(10, 'bold');
    const w = Math.max(200, ctx.measureText(title).width + 64), h = 32, x = 240 - w / 2, y = 44 - (1 - e) * 12;
    ctx.globalAlpha = U.clamp(k, 0, 1);
    U.panel(ctx, x, y, w, h, { bg: 'rgba(14,10,22,0.94)', border: 'rgba(255,211,77,0.5)' });
    const glow = ctx.createRadialGradient(x + 17, y + 16, 1, x + 17, y + 16, 18);
    glow.addColorStop(0, 'rgba(255,211,77,0.35)'); glow.addColorStop(1, 'rgba(255,211,77,0)');
    ctx.fillStyle = glow; ctx.fillRect(x, y, 36, h);
    Sprites.drawArt(ctx, 'trophy', x + 17, y + 16 + Math.round(Math.sin(gt * 6)), 1.6);
    U.text(ctx, 'ACHIEVEMENT ODEMČEN', x + 34, y + 5, { size: 6, color: '#ffd34d', outline: false, ls: 1.4 });
    U.text(ctx, title, x + 34, y + 12, { size: 10, font: 'bold', color: '#ffffff', outline: false });
    U.text(ctx, desc, x + 34, y + 23, { size: 7, color: '#8d84a8', outline: false });
    ctx.globalAlpha = 1;
  }
  function reset() { unlocked = new Set(); toasts = []; }

  return {
    LIST, unlock, randomUnlock, update, draw, reset,
    has: id => unlocked.has(id),
    get count() { return unlocked.size; },
    get unlockedList() { return [...unlocked]; },
    get allTimeCount() { return allTime.size; },
    get total() { return Object.keys(LIST).length; },
  };
})();
