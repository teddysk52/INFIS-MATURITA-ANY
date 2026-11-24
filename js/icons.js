'use strict';
// =============================================================
//  icons.js — vlastní 3D ikony (PNG s průhledným pozadím).
//  Stačí nahrát soubory do složky assets/icons/ (názvy viz LIST).
//  Když ikona chybí, hra použije záložní zobrazení — nic se nerozbije.
// =============================================================
const Icons = (() => {
  const LIST = ['semicolon', 'ram', 'rohlik', 'bug', 'laptop', 'bubble_en', 'bubble_de', 'book', 'excel', 'coins', 'pi', 'pen',
    'diploma', 'stopwatch', 'car', 'tram', 'office', 'trophy', 'bell', 'castle', 'gamepad', 'floppy', 'maturitron', 'can'];
  const ok = {}, imgs = {};

  // které ikony patří ke kterému úkolu / učiteli
  const FOR_OBJECTIVE = {
    hojer: 'laptop', horvath: 'ram', nagr: 'bug', novak: 'bubble_en', batkova: 'bubble_de', janda: 'book',
    prynych: 'excel', ladman: 'coins', olga: 'pi', sign_hojer: 'pen', sign_batkova: 'pen', sign_ladman: 'pen', maturita: 'diploma',
  };
  const FOR_ACH = {
    build: 'semicolon', rohlik: 'rohlik', realita: 'bug', sorry: 'bubble_en', polyglot: 'bubble_de', metafora: 'castle', kapitola: 'book',
    excel_trauma: 'excel', kontingencni: 'excel', rozvaha: 'coins', matematika: 'pi', absolvent: 'diploma', speedrun: 'stopwatch', vecny: 'stopwatch',
    ridicak: 'car', rychlik: 'car', pojistovna: 'car', troubic: 'car', tramvaj: 'tram', urad: 'office', edupage: 'bell', konami: 'gamepad',
    investor: 'can', ctrlcv: 'laptop', r_umela: 'maturitron', chvilka: 'book', utek: 'stopwatch',
  };
  // sprity ve 3D světě, které nahradíme ikonou
  const SPRITES = { semicolon: 'semicolon', ram: 'ram', rohlik: 'rohlik', floppy: 'floppy', cert: 'diploma', excel: 'excel', bug: 'bug', book: 'book' };

  function load() {
    const files = (window.INFIS_ICON_FILES || []).filter(n => LIST.includes(n));
    return Promise.all(files.map(n => new Promise(res => {
      const im = new Image();
      im.onload = () => { ok[n] = true; imgs[n] = im; res(); };
      im.onerror = () => res();
      im.src = 'assets/icons/' + n + '.png';
    })));
  }
  function html(key, fallback = '') {
    return key && ok[key] ? `<img src="assets/icons/${key}.png" alt="">` : fallback;
  }
  // vloží načtené ikony do atlasu spritů (sběratelné předměty ve světě)
  function applyToSprites() {
    for (const [spr, key] of Object.entries(SPRITES)) if (imgs[key]) Spr.replace(spr, imgs[key]);
  }
  return { LIST, load, html, applyToSprites, has: (k) => !!ok[k], FOR_OBJECTIVE, FOR_ACH };
})();
