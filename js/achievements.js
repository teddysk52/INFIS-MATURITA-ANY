'use strict';
// =============================================================
//  achievements.js — absurdní achievementy (ukládají se do prohlížeče)
// =============================================================
const Achievements = (() => {
  const LIST = {
    prvni_den: ['🚪', 'PRVNÍ DEN A UŽ CHCEŠ DOMŮ', 'Zkusil jsi odejít ze školy hned na začátku.'],
    ctrlcv: ['📋', 'CTRL+C, CTRL+V MASTER', 'Zmáčkl jsi Ctrl+C nebo Ctrl+V. Ve hře. Proč?'],
    excel_trauma: ['📊', 'EXCELENTNÍ TRAUMA', 'Porazil jsi EXCEL.EXE.'],
    motivace404: ['❓', '404: MOTIVACE NOT FOUND', 'Vešel jsi do prázdné učebny 404.'],
    kontingencni: ['🧮', 'ŽIVOT JE JEDNA VELKÁ KONTINGENČNÍ TABULKA', 'Svěřil ses Excelovému Císaři.'],
    speedrun: ['⚡', 'MATURITA SPEEDRUNNER', 'Odmaturuj s víc než 2 minutami v záloze.'],
    nepritomen: ['💤', 'NEPŘÍTOMEN DUŠEVNĚ', 'Dal sis pauzu třikrát.'],
    prezivac: ['🛡️', 'PROFESIONÁLNÍ PŘEŽÍVAČ', 'Odmaturuj i přes 10+ zásahů.'],
    absolvent: ['🎓', 'ABSOLVENT INFISU', 'Složil jsi maturitu. Legenda.'],
    architektura: ['🧱', 'ARCHITEKTURA ŠKOLY OVĚŘENA', 'Narazil jsi 5× do zdi. Zdi drží.'],
    aktivni: ['🧍', 'AKTIVNÍ ÚČAST VE VÝUCE', 'Stál jsi 20 sekund bez hnutí.'],
    matematika: ['∑', 'MATEMATIKA PŘEŽITA', 'Legendární učitelka tě nechala žít.'],
    rohlik: ['🥖', 'ROHLÍK DDR5', 'Nainstaloval jsi pečivo do počítače.'],
    build: ['✅', 'BUILD SUCCESSFUL', 'Chytil jsi uprchlý středník.'],
    realita: ['🐞', 'REALITA OPRAVENA', '0 errors. 47 warnings.'],
    sorry: ['🇬🇧', 'SORRY FOR MY ENGLISH', 'Utekl jsi z anglické konverzace.'],
    polyglot: ['💬', 'POLYGLOT (NEDOBROVOLNÝ)', 'Přežil jsi jazykový chaos.'],
    metafora: ['🏰', 'ŠKOLA JE HRAD', 'Tvoje metafora se stala realitou.'],
    kapitola: ['📖', 'DOČETL JSEM KAPITOLU', 'Utekl jsi z knihy. Rozbor do pátku.'],
    rozvaha: ['💰', 'ÚČETNĚ NEVIDITELNÝ', 'Vyrovnal jsi rozvahu.'],
    investor: ['🥤', 'INVESTOR ROKU', 'Krmil jsi automat 3×. Nic nevydal.'],
    konami: ['🕹️', 'CHEATER (NAHLÁŠENO)', '↑↑↓↓←→←→BA. MATURITRON to viděl.'],
    vecny: ['♾️', 'VĚČNÝ STUDENT', 'Čas vypršel. Uvidíme se v září.'],
    vysoka: ['🧠', 'MENTÁLNÍ KAPACITA NEDOSTATEČNÁ', 'Zkusil jsi jít na vysokou.'],
    edupage: ['🔔', '47 NOVÝCH ZNÁMEK', 'Zavřel jsi všechna okna EduPage.'],
    chvilka: ['✋', 'MÁŠ CHVILKU?', 'Učitel tě odchytil na chodbě.'],
    utek: ['🏃', 'ÚTĚK Z PÍSEMKY', 'Utekl jsi před náhodným testem.'],
    // nové ve 3D
    ridicak: ['🚗', 'ŘIDIČÁK? NE.', 'Sedl sis do cizího auta. Klíčky byly v zapalování.'],
    pojistovna: ['💥', 'POJIŠŤOVNA PLÁČE', 'Narazil jsi autem do něčeho pevného.'],
    tramvaj: ['🚋', 'SRAŽEN TRAMVAJÍ Č. 4', 'Tramvaj má přednost. Ty ne.'],
    urad: ['🏢', 'KARIÉRNÍ PLÁNOVÁNÍ', 'Navštívil jsi Úřad práce ještě před maturitou.'],
    turista: ['🗺️', 'TURISTA', 'Došel jsi až do Borského parku. Maturita počká. Nepočká.'],
    tenis: ['🎾', 'MATURITA? NE, TENIS.', 'Našel jsi tenisové kurty.'],
    troubic: ['📯', 'MISTR KLAKSONU', 'Zatroubil jsi 10×. Sousedé děkují.'],
    fps: ['👀', 'PRVNÍ OSOBA, PRVNÍ PROBLÉMY', 'Přepnul ses do pohledu z první osoby.'],
    skokan: ['🦘', 'SKOK DO NEZNÁMA', 'Skočil jsi 25×. Na maturitu to nepomůže.'],
    zachranka: ['🚑', 'PREVENTIVNÍ PROHLÍDKA', 'Prohlédl sis záchranku. Pro jistotu.'],
    balik: ['📦', 'BALÍK NEPŘEVZAT', 'Zkusil jsi otevřít balíkobox bez kódu.'],
    rychlik: ['🏎️', '0 → 100 ZA ŠKOLNÍ PŘESTÁVKU', 'Rozjel ses na 100 km/h.'],
    // náhodné od MATURITRONA
    r_umela: ['🤖', 'UMĚLÁ INTELIGENCE, PŘIROZENÁ HLOUPOST', 'Dostal jsi achievement od AI. Za nic.'],
    r_dochazka: ['📉', 'DOCHÁZKA: 3 %', 'Ale ta 3 % byla intenzivní.'],
    r_prezuvky: ['👟', 'ZAPOMNĚL JSI SI PŘEZŮVKY', 'Klasika.'],
    r_nazivu: ['❤️', 'OFICIÁLNĚ NAŽIVU', 'Gratulujeme k existenci.'],
    r_nejlepsi: ['🥇', 'NEJLEPŠÍ STUDENT V TÉTO MÍSTNOSTI', 'Jsi tu sám.'],
    r_klik: ['⌨️', 'ZMÁČKL JSI KLÁVESU', 'Pokrok je pokrok.'],
  };
  const RANDOM_POOL = ['r_umela', 'r_dochazka', 'r_prezuvky', 'r_nazivu', 'r_nejlepsi', 'r_klik'];
  let unlocked = new Set();
  const allTime = new Set(Store.get('infis3d_ach', []));

  function unlock(id) {
    if (!LIST[id] || unlocked.has(id)) return false;
    unlocked.add(id); allTime.add(id);
    Store.set('infis3d_ach', [...allTime]);
    const [ic, name, desc] = LIST[id];
    UI.toast(ic, name, desc, Icons.FOR_ACH[id] || 'trophy');
    Sound.sfx.achievement();
    return true;
  }
  function randomUnlock() {
    const pool = RANDOM_POOL.filter(id => !unlocked.has(id));
    if (!pool.length) return false;
    return unlock(U.pick(pool));
  }
  function reset() { unlocked = new Set(); }
  return { LIST, unlock, randomUnlock, reset, has: (id) => unlocked.has(id), get count() { return unlocked.size; }, allTime };
})();
