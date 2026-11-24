'use strict';
// =============================================================
//  sprites.js — veškerá grafika se kreslí procedurálně
//  (pixel po pixelu) do malých canvasů. Žádné externí obrázky.
//  Postavička má 16×24 px, "nohy" (kotva) jsou v bodě (8, 23).
// =============================================================
const Sprites = (() => {
  const OUT = '#1a1322';
  const cache = new Map();

  // ---------------------------------------------------------
  //  POSTAVY (všechny dialogy i povahy jsou smyšlené)
  // ---------------------------------------------------------
  const CHARS = {
    player:  { name: 'TY', skin: '#f3c9a0', hair: '#5a3620', style: 'messy', shirt: '#3d74d9', pants: '#2b2f45', shoes: '#eeeeee', acc: ['hoodie', 'backpack'], voice: 1.0 },
    hojer:   { name: 'Adam Hojer', title: 'C# ČARODĚJ', skin: '#f1c49a', hair: '#2a1c12', style: 'messy', shirt: '#6a3fa3', pants: '#24283a', shoes: '#222222', acc: ['hoodie', 'csharp'], voice: 1.15 },
    nagr:    { name: 'Vladimír Nágr', title: 'MISTR DEBUGGINGU', skin: '#efc29b', hair: '#c79a55', style: 'side', shirt: '#33333a', pants: '#3a3f55', acc: ['hoodie', 'bug', 'glasses'], voice: 1.25 },
    horvath: { name: 'Tobiáš Horváth', title: 'SBĚRATEL DAT', skin: '#f0c8a2', hair: '#4e321e', style: 'quiff', shirt: '#2b8a6b', pants: '#2a2a35', acc: ['headset', 'ram'], voice: 1.1 },
    novak:   { name: 'Jan Novák', title: 'STRÁŽCE ANGLIČTINY', skin: '#f2c6a0', hair: '#3b2a1a', style: 'slick', shirt: '#22356b', pants: '#2c2c3a', acc: ['collar', 'tie', 'mug'], tie: '#c8102e', voice: 0.95 },
    batkova: { name: 'Eva Baťková', title: 'JAZYKOVÁ PŘEPÍNAČKA', skin: '#f3cba8', hair: '#8c3a1c', style: 'long', shirt: '#d8a23a', pants: '#3a2d4a', acc: ['scarf', 'earrings'], scarf: '#c0392b', voice: 1.4 },
    janda:   { name: 'Ondřej Janda', title: 'STRÁŽCE LITERATURY', skin: '#eec09a', hair: '#5e4b3c', style: 'short', shirt: '#7a5232', pants: '#3a3326', acc: ['beard', 'glasses', 'book', 'patches'], voice: 0.8 },
    prynych: { name: 'Miroslav Prynych', title: 'EXCELOVÝ CÍSAŘ', skin: '#efc49e', hair: '#a7a7ad', style: 'receding', shirt: '#1d7044', pants: '#2b2b33', acc: ['crown', 'glasses', 'collar', 'tie', 'tablet'], tie: '#ffd23f', voice: 0.85 },
    ladman:  { name: 'Adam Láďman', title: 'BOSS EKONOMIKY', skin: '#f0c59c', hair: '#1f1f22', style: 'slick', shirt: '#2a3352', pants: '#232838', acc: ['collar', 'tie', 'briefcase'], tie: '#d4a017', voice: 0.9 },
    olga:    { name: 'Olga Břízová', title: 'LEGENDÁRNÍ MATIKÁŘKA', skin: '#f1cba9', hair: '#dcdce6', style: 'bun', shirt: '#8b2d4f', pants: '#3a2a3a', acc: ['glasses', 'pearls', 'cardigan'], voice: 1.3 },
    pepa:    { name: 'Spolužák Pepa', skin: '#f2c49c', hair: '#e0b050', style: 'messy', shirt: '#e06a2c', pants: '#3b4a6b', acc: ['backpack'], voice: 1.2 },
    klara:   { name: 'Spolužačka Klára', skin: '#f4cfae', hair: '#2b1b12', style: 'long', shirt: '#47a36b', pants: '#2b2b3a', acc: [], voice: 1.45 },
    kuba:    { name: 'Kuba z vedlejší třídy', skin: '#d9a57a', hair: '#151515', style: 'short', shirt: '#9c3fc2', pants: '#222222', acc: ['headset'], voice: 1.0 },
    komise:  { name: 'KOMISE', skin: '#b9b4c4', hair: '#3a3a44', style: 'receding', shirt: '#26262e', pants: '#151518', acc: ['collar', 'tie', 'glasses'], tie: '#666677', voice: 0.7 },
  };

  // ---------------------------------------------------------
  //  Kreslení jedné postavičky
  // ---------------------------------------------------------
  function hair(style, P, dir, h, hS, hL, skin) {
    const S = U.shade;
    if (dir === 'up') {
      if (style === 'receding') { P(4, 3, 8, 2, S(skin, 0.1)); P(4, 5, 8, 5, h); return; }
      P(4, 2, 8, 8, h); P(4, 9, 8, 1, hS); P(5, 2, 6, 1, hL);
      if (style === 'long') { P(3, 3, 10, 10, h); P(4, 12, 8, 1, hS); }
      if (style === 'bun') { P(6, 0, 4, 3, h); P(7, 0, 2, 1, hL); }
      if (style === 'messy') { P(5, 1, 1, 1, h); P(8, 1, 1, 1, h); P(10, 1, 1, 1, h); }
      if (style === 'quiff') P(6, 1, 4, 1, h);
      return;
    }
    if (dir === 'left') {
      if (style === 'receding') { P(8, 4, 3, 4, h); P(5, 3, 3, 1, S(skin, 0.18)); return; }
      P(4, 2, 7, 2, h); P(8, 4, 3, 4, h); P(4, 4, 1, 1, h); P(5, 2, 3, 1, hL);
      if (style === 'long') P(8, 4, 4, 9, h);
      if (style === 'bun') P(8, 0, 3, 3, h);
      if (style === 'messy') { P(5, 1, 1, 1, h); P(8, 1, 1, 1, h); P(4, 4, 2, 1, h); }
      if (style === 'quiff') { P(3, 2, 4, 1, h); P(4, 1, 3, 1, h); }
      if (style === 'side') P(4, 4, 3, 1, h);
      return;
    }
    // dolů
    if (style === 'receding') {
      P(4, 4, 1, 4, h); P(11, 4, 1, 4, h); P(5, 3, 1, 1, h); P(10, 3, 1, 1, h);
      P(6, 3, 3, 1, S(skin, 0.25));
      return;
    }
    P(4, 2, 8, 2, h); P(4, 4, 1, 2, h); P(11, 4, 1, 2, h); P(6, 2, 3, 1, hL);
    switch (style) {
      case 'short': P(5, 4, 6, 1, h); break;
      case 'messy': P(5, 4, 2, 1, h); P(8, 4, 1, 1, h); P(10, 4, 1, 1, h); P(5, 1, 1, 1, h); P(8, 1, 1, 1, h); P(10, 1, 1, 1, h); break;
      case 'long': P(5, 4, 6, 1, h); P(3, 3, 1, 10, h); P(12, 3, 1, 10, h); P(4, 6, 1, 6, h); P(11, 6, 1, 6, h); break;
      case 'bun': P(5, 4, 6, 1, h); P(6, 0, 4, 2, h); P(7, 0, 2, 1, hL); break;
      case 'slick': P(4, 4, 7, 1, h); P(9, 2, 1, 2, hS); break;
      case 'quiff': P(5, 4, 6, 1, h); P(6, 1, 5, 1, h); P(7, 0, 3, 1, h); break;
      case 'side': P(4, 4, 5, 1, h); P(5, 5, 2, 1, h); break;
    }
  }

  function drawChar(g, c, dir, frame) {
    const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const has = a => (c.acc || []).includes(a);
    const S = U.shade;
    const skin = c.skin || '#f1c49a', skinS = S(skin, -0.18);
    const hc = c.hair || '#3a2a1a', hS = S(hc, -0.3), hL = S(hc, 0.3);
    const sh = c.shirt, shS = S(sh, -0.3), shL = S(sh, 0.2);
    const pants = c.pants || '#2a2d3e', pantsS = S(pants, -0.35);
    const shoes = c.shoes || '#2a1e18';
    const EYE = '#24161c', dark = '#1e1a22';
    const side = dir === 'left', up = dir === 'up', down = dir === 'down';

    // nohy
    if (!side) {
      const a = frame === 1 ? 1 : 0, b = frame === 2 ? 1 : 0;
      P(5, 18, 2, 4 - a, pants); P(9, 18, 2, 4 - b, pants);
      P(5, 22 - a, 2, 1, shoes); P(9, 22 - b, 2, 1, shoes);
    } else if (frame === 0) {
      P(6, 18, 2, 4, pantsS); P(8, 18, 2, 4, pants); P(5, 22, 3, 1, shoes); P(8, 22, 2, 1, shoes);
    } else {
      const fx = frame === 1 ? 5 : 9, bx = frame === 1 ? 9 : 5;
      P(bx, 18, 2, 3, pantsS); P(bx, 21, 2, 1, shoes);
      P(fx, 18, 2, 4, pants); P(fx - 1, 22, 3, 1, shoes);
    }
    // tělo
    if (!side) {
      P(4, 11, 8, 6, sh); P(4, 11, 1, 6, shL); P(11, 11, 1, 6, shS);
      P(4, 17, 8, 1, pantsS);
      const sa = frame === 1 ? 1 : frame === 2 ? -1 : 0;
      P(3, 12 + sa, 1, 4, shS); P(12, 12 - sa, 1, 4, shS);
      P(3, 16 + sa, 1, 1, skin); P(12, 16 - sa, 1, 1, skin);
    } else {
      P(5, 11, 6, 6, sh); P(10, 11, 1, 6, shS); P(5, 17, 6, 1, pantsS);
    }
    // hlava
    if (!side) {
      P(4, 3, 8, 8, skin); P(4, 10, 8, 1, skinS);
      if (down) {
        P(6, 6, 1, 2, EYE); P(9, 6, 1, 2, EYE);
        P(7, 9, 2, 1, S(skin, -0.32));
        P(5, 8, 1, 1, '#eea0a0'); P(10, 8, 1, 1, '#eea0a0');
      }
    } else {
      P(4, 3, 7, 8, skin); P(3, 6, 1, 2, skin); P(4, 10, 7, 1, skinS);
      P(5, 6, 1, 2, EYE); P(4, 9, 2, 1, S(skin, -0.32));
    }
    hair(c.style || 'short', P, dir, hc, hS, hL, skin);

    // doplňky
    if (has('backpack')) {
      if (up) { P(5, 11, 6, 6, '#c0392b'); P(5, 11, 6, 2, '#962d22'); P(7, 14, 2, 1, '#e8c547'); }
      else if (side) { P(10, 11, 2, 6, '#c0392b'); P(10, 11, 2, 1, '#962d22'); }
      else { P(5, 11, 1, 4, '#962d22'); P(10, 11, 1, 4, '#962d22'); }
    }
    if (has('hoodie')) {
      if (down) { P(5, 11, 6, 1, shS); P(6, 12, 1, 2, '#eeeeee'); P(9, 12, 1, 2, '#eeeeee'); }
      if (up && !has('backpack')) P(5, 11, 6, 2, shS);
    }
    if (down && has('csharp')) { P(6, 14, 4, 2, '#ffffff'); P(7, 14, 1, 1, sh); P(8, 15, 1, 1, sh); }
    if (down && has('bug')) { P(8, 14, 2, 2, '#53d353'); P(7, 14, 1, 1, dark); P(10, 15, 1, 1, dark); P(8, 13, 1, 1, dark); }
    if (has('collar') && !up) { if (down) { P(6, 11, 1, 1, '#ffffff'); P(9, 11, 1, 1, '#ffffff'); } else P(5, 11, 2, 1, '#ffffff'); }
    if (down && has('tie')) { const tc = c.tie || '#c0392b'; P(7, 11, 2, 1, S(tc, -0.25)); P(7, 12, 2, 4, tc); }
    if (down && has('cardigan')) { P(7, 11, 2, 6, '#efe6d6'); }
    if (down && has('pearls')) { P(5, 11, 1, 1, '#fff8e8'); P(6, 12, 1, 1, '#fff8e8'); P(9, 12, 1, 1, '#fff8e8'); P(10, 11, 1, 1, '#fff8e8'); }
    if (has('scarf')) {
      const sc = c.scarf || '#c0392b';
      if (side) { P(5, 11, 6, 2, sc); P(9, 13, 2, 3, sc); }
      else { P(4, 11, 8, 2, sc); if (down) P(9, 13, 2, 3, sc); }
    }
    if (has('patches') && !side) { P(3, 14, 1, 1, '#4a2f1a'); P(12, 14, 1, 1, '#4a2f1a'); }
    if (has('beard')) {
      if (down) { P(4, 8, 8, 3, hc); P(5, 11, 6, 1, hc); P(7, 9, 2, 1, S(skin, -0.4)); }
      else if (side) { P(4, 8, 6, 3, hc); P(4, 9, 1, 1, S(skin, -0.4)); }
    }
    if (has('glasses')) {
      if (down) { P(5, 6, 6, 1, '#222222'); P(6, 6, 1, 1, '#bfe6ff'); P(9, 6, 1, 1, '#bfe6ff'); P(6, 7, 1, 1, EYE); P(9, 7, 1, 1, EYE); }
      else if (side) { P(3, 6, 4, 1, '#222222'); P(5, 6, 1, 1, '#bfe6ff'); P(5, 7, 1, 1, EYE); P(7, 6, 3, 1, '#222222'); }
    }
    if (has('headset')) {
      P(4, 2, 8, 1, dark);
      if (!side) { P(3, 5, 1, 3, dark); P(12, 5, 1, 3, dark); if (down) P(3, 8, 3, 1, dark); }
      else P(8, 5, 2, 3, dark);
    }
    if (down && has('earrings')) { P(3, 8, 1, 1, '#ffd23f'); P(12, 8, 1, 1, '#ffd23f'); }
    if (has('crown')) { const gc = '#ffd23f'; P(5, 1, 6, 2, gc); P(5, 0, 1, 1, gc); P(7, 0, 2, 1, gc); P(10, 0, 1, 1, gc); P(7, 1, 2, 1, '#e8413c'); }
    if (down) {
      if (has('book')) { P(5, 14, 6, 4, '#8e2b25'); P(5, 14, 6, 1, '#f3ead2'); P(7, 15, 2, 1, '#e7c24a'); }
      if (has('mug')) { P(12, 14, 2, 3, '#f5f5f5'); P(14, 15, 1, 1, '#f5f5f5'); P(12, 14, 2, 1, '#6b3e1e'); }
      if (has('briefcase')) { P(12, 16, 3, 3, '#6b4423'); P(13, 15, 1, 1, '#3b2413'); }
      if (has('tablet')) { P(5, 14, 6, 4, '#1d7044'); P(6, 15, 1, 1, '#ffffff'); P(8, 15, 1, 1, '#ffffff'); P(7, 16, 1, 1, '#ffffff'); P(6, 17, 1, 1, '#ffffff'); P(8, 17, 1, 1, '#ffffff'); }
      if (has('ram')) { P(4, 15, 8, 2, '#1f7a3a'); P(5, 15, 1, 1, '#111111'); P(7, 15, 1, 1, '#111111'); P(9, 15, 1, 1, '#111111'); P(4, 17, 8, 1, '#d4af37'); }
    }
    if (side) { // ruka přes tělo
      const sw = frame === 1 ? -1 : frame === 2 ? 1 : 0;
      P(7 + sw, 12, 2, 4, shS); P(7 + sw, 16, 2, 1, skin);
    }
  }

  // 1px tmavý obrys kolem neprůhledných pixelů — dodá "profi" pixel-art vzhled
  function outline(cv) {
    const g = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    const img = g.getImageData(0, 0, w, h), d = img.data;
    const src = new Uint8ClampedArray(d);
    const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : src[(y * w + x) * 4 + 3];
    const r = parseInt(OUT.slice(1, 3), 16), gg = parseInt(OUT.slice(3, 5), 16), b = parseInt(OUT.slice(5, 7), 16);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (A(x, y) > 40) continue;
      if (A(x - 1, y) > 100 || A(x + 1, y) > 100 || A(x, y - 1) > 100 || A(x, y + 1) > 100) {
        const i = (y * w + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }

  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function build(id, dir, frame) {
    const c = CHARS[id] || CHARS.pepa;
    const cv = mk(16, 24);
    drawChar(cv.getContext('2d'), c, dir === 'right' ? 'left' : dir, frame);
    outline(cv);
    const fin = mk(16, 24), fg = fin.getContext('2d');
    fg.fillStyle = 'rgba(20,10,30,0.28)';
    fg.fillRect(4, 22, 8, 2); fg.fillRect(3, 23, 10, 1);
    if (dir === 'right') { fg.save(); fg.translate(16, 0); fg.scale(-1, 1); fg.drawImage(cv, 0, 0); fg.restore(); }
    else fg.drawImage(cv, 0, 0);
    return fin;
  }

  function get(id, dir = 'down', frame = 0) {
    const k = id + dir + frame;
    let c = cache.get(k);
    if (!c) { c = build(id, dir, frame); cache.set(k, c); }
    return c;
  }

  // Kreslení postavy: (x, y) = pozice nohou
  function draw(ctx, id, x, y, dir = 'down', frame = 0, scale = 1) {
    const img = get(id, dir, frame);
    ctx.drawImage(img, Math.round(x - 8 * scale), Math.round(y - 23 * scale), 16 * scale, 24 * scale);
  }

  // Portrét do dialogového okna
  function portrait(ctx, id, x, y, size, talking, t) {
    const img = get(id, 'down', 0);
    const bob = talking ? Math.round(Math.sin(t * 18) * 0.6) : 0;
    ctx.drawImage(img, 1, 0, 14, 15, x, y + bob, size, size * 15 / 14);
  }

  // ---------------------------------------------------------
  //  Pixel-art předměty definované jako textové matice
  // ---------------------------------------------------------
  const ART = {
    ram: { p: { g: '#1f7a3a', k: '#151515', y: '#e3bc3d', l: '#3fa35a' }, r: [
      'gggggggggggggg',
      'gkklkklkklkkgg',
      'gkkgkkgkkgkkgg',
      'gggggggggggggg',
      'yyyyyy.yyyyyyy',
      'y.y.y..y.y.y.y'] },
    rohlik: { p: { o: '#a8642a', O: '#d99a4e', h: '#f2d39b' }, r: [
      '....oooooooo....',
      '..ooOOOOOOOOoo..',
      '.oOOhOOhOOhOOOo.',
      'oOOOOOOOOOOOOOOo',
      'oOOOOOOOOOOOOOOo',
      '.ooOOOOOOOOOOoo.',
      '...oooooooooo...'] },
    floppy: { p: { Y: '#f2c230', s: '#b8bcc6', w: '#fff6d6', k: '#c9a227' }, r: [
      'YYYYYYYYYY',
      'YYsssssYYY',
      'YYsYYssYYY',
      'YYsssssYYY',
      'YYYYYYYYYY',
      'YwwwwwwwwY',
      'YwkkkkkkwY',
      'YwwwwwwwwY',
      'YwkkkkwwwY',
      'YYYYYYYYYY'] },
    coin: { p: { o: '#a0700f', y: '#f5c842', h: '#fff3b0' }, r: [
      '..oooo..',
      '.oyyyyo.',
      'oyyhyyyo',
      'oyhyyyyo',
      'oyyyyyyo',
      'oyyyyyyo',
      '.oyyyyo.',
      '..oooo..'] },
    coin2: { p: { o: '#a0700f', y: '#f5c842', h: '#fff3b0' }, r: [
      '...oo...',
      '..oyyo..',
      '..oyho..',
      '..oyyo..',
      '..oyyo..',
      '..oyyo..',
      '..oyyo..',
      '...oo...'] },
    excel: { p: { G: '#1d7044', w: '#ffffff', g: '#0f4a2a' }, r: [
      'GGGGGGGGGG',
      'GwwGGGGwwG',
      'GGwwGGwwGG',
      'GGGwwwwGGG',
      'GGGGwwGGGG',
      'GGGwwwwGGG',
      'GGwwGGwwGG',
      'GwwGGGGwwG',
      'GGGGGGGGGG',
      'gggggggggg'] },
    cert: { p: { w: '#c9b48a', W: '#fff7e0', k: '#8a7a5a', r: '#d33a3a' }, r: [
      '.wwwwwwwwww.',
      'wWWWWWWWWWWw',
      'wWkkkkkkkkWw',
      'wWWWWWWWWWWw',
      'wWkkkkkkWWWw',
      'wWWWWWWWWWWw',
      'wWWWWWWrrWWw',
      'wWWWWWWrrWWw',
      '.wwwwwwwwww.'] },
    clock: { p: { o: '#d33a3a', w: '#ffffff', k: '#222222' }, r: [
      '..ooooo..',
      '.owwwwwo.',
      'owwwkwwwo',
      'owwwkwwwo',
      'owwwkkkwo',
      'owwwwwwwo',
      'owwwwwwwo',
      '.owwwwwo.',
      '..ooooo..'] },
    trophy: { p: { y: '#e0a800', Y: '#ffd84a', o: '#7a4a1a' }, r: [
      '.yyyyyyyy.',
      'yyYYYYYYyy',
      'y.YYYYYY.y',
      '.yYYYYYYy.',
      '..yYYYYy..',
      '...yYYy...',
      '....yy....',
      '....yy....',
      '..oooooo..',
      '..oooooo..'] },
    lock: { p: { k: '#3a3a3a', y: '#f2c230', d: '#9a7a10' }, r: [
      '..kkkk..',
      '.k....k.',
      '.k....k.',
      'yyyyyyyy',
      'yyydyyyy',
      'yyyddyyy',
      'yyydyyyy',
      'yyyyyyyy'] },
  };
  const artCache = {};
  function art(key) {
    if (artCache[key]) return artCache[key];
    const a = ART[key];
    const h = a.r.length, w = a.r[0].length;
    const cv = mk(w, h), g = cv.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = a.r[y][x];
      if (ch !== '.' && a.p[ch]) { g.fillStyle = a.p[ch]; g.fillRect(x, y, 1, 1); }
    }
    outline(cv);
    artCache[key] = cv;
    return cv;
  }
  function drawArt(ctx, key, x, y, scale = 1) {
    const a = art(key);
    ctx.drawImage(a, Math.round(x - a.width * scale / 2), Math.round(y - a.height * scale / 2), a.width * scale, a.height * scale);
  }

  // ---------------------------------------------------------
  //  Procedurální objekty
  // ---------------------------------------------------------
  function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  // MATURITRON 3000 — retro monitor s rudýma očima
  function maturitron(ctx, x, y, s, t, mood = 'normal', talking = false) {
    const P = (px, py, w, h, c) => R(ctx, x + px * s, y + py * s, w * s, h * s, c);
    const blink = (t % 3.3) > 3.15;
    P(11, -3, 1, 3, '#555'); P(10, -4, 3, 1, (t * 2 | 0) % 2 ? '#ff3b3b' : '#661010');
    P(1, 0, 22, 17, OUT); P(2, 1, 20, 15, '#cfc8b8'); P(2, 14, 20, 2, '#a39d8f'); P(2, 1, 20, 1, '#e8e2d4');
    const scr = mood === 'error' ? '#1f4fd0' : '#0b140f';
    P(4, 3, 16, 10, scr);
    if (mood === 'error') {
      P(6, 5, 1, 1, '#fff'); P(6, 8, 1, 1, '#fff'); P(8, 5, 1, 4, '#fff'); P(9, 4, 1, 1, '#fff'); P(9, 9, 1, 1, '#fff');
      P(12, 6, 6, 1, '#cfe'); P(12, 8, 5, 1, '#cfe'); P(12, 10, 4, 1, '#cfe');
    } else {
      const ec = mood === 'happy' ? '#3fff7a' : '#ff3b3b';
      if (blink) { P(6, 7, 3, 1, ec); P(15, 7, 3, 1, ec); }
      else {
        P(6, 6, 3, 2, ec); P(15, 6, 3, 2, ec);
        P(7, 6, 1, 1, '#fff'); P(16, 6, 1, 1, '#fff');
      }
      if (mood !== 'happy') { P(5, 4, 3, 1, ec); P(8, 5, 1, 1, ec); P(16, 4, 3, 1, ec); P(15, 5, 1, 1, ec); }
      const m = talking ? ((t * 14 | 0) % 3) : 0;
      if (mood === 'happy') { P(9, 10, 6, 1, ec); P(8, 9, 1, 1, ec); P(15, 9, 1, 1, ec); }
      else { P(9, 10, 6, 1 + (m === 1 ? 1 : 0), ec); if (m === 2) P(10, 11, 4, 1, ec); }
      P(4, 3 + ((t * 12 | 0) % 10), 16, 1, 'rgba(255,255,255,0.08)');
    }
    P(19, 15, 1, 1, '#3f3'); P(17, 15, 1, 1, (t * 4 | 0) % 2 ? '#fb3' : '#650');
    P(9, 17, 6, 2, '#a39d8f'); P(6, 19, 12, 1, '#7a7468');
  }

  // Utíkající středník s očima a nožičkama
  function semicolon(ctx, x, y, t, scared) {
    const leg = (t * 16 | 0) % 2;
    R(ctx, x - 4, y - 18, 8, 8, OUT); R(ctx, x - 3, y - 17, 6, 6, '#ffe14d');
    R(ctx, x - 4, y - 8, 8, 8, OUT); R(ctx, x - 3, y - 7, 6, 6, '#ffe14d');
    R(ctx, x - 1, y, 4, 4, OUT); R(ctx, x, y - 1, 2, 4, '#ffe14d');
    // oči
    R(ctx, x - 2, y - 15, 1, 2, '#222'); R(ctx, x + 1, y - 15, 1, 2, '#222');
    if (scared) { R(ctx, x - 1, y - 12, 2, 1, '#222'); }
    // nožičky
    R(ctx, x - 3, y + 3 + leg, 1, 3 - leg, '#222'); R(ctx, x + 3, y + 3 + (1 - leg), 1, 2 + leg, '#222');
  }

  // Přehřátý procesor
  function cpu(ctx, x, y, t) {
    for (let i = 0; i < 4; i++) { R(ctx, x - 7, y - 5 + i * 3, 2, 1, '#aaa'); R(ctx, x + 6, y - 5 + i * 3, 2, 1, '#aaa'); }
    R(ctx, x - 6, y - 7, 12, 13, OUT); R(ctx, x - 5, y - 6, 10, 11, '#c0392b'); R(ctx, x - 3, y - 4, 6, 6, '#e8e8e8');
    R(ctx, x - 2, y - 3, 4, 4, '#888');
    const f = (t * 10 | 0) % 2;
    R(ctx, x - 3, y - 11 - f, 2, 3, '#ff9a1f'); R(ctx, x + 1, y - 12 + f, 2, 4, '#ffd23f'); R(ctx, x - 1, y - 10, 2, 2, '#ff5a1f');
  }

  // Létající kniha (mává deskami)
  function book(ctx, x, y, t, color = '#8e2b25') {
    const o = Math.abs(Math.sin(t * 9));
    const ww = Math.round(3 + o * 6);
    R(ctx, x - ww - 1, y - 6, ww * 2 + 2, 10, OUT);
    R(ctx, x - ww, y - 5, ww, 8, color); R(ctx, x, y - 5, ww, 8, color);
    R(ctx, x - ww + 1, y - 4, ww - 1, 6, '#f3ead2'); R(ctx, x + 1, y - 4, ww - 2, 6, '#f3ead2');
    R(ctx, x - 1, y - 6, 2, 10, U.shade(color, -0.3));
    R(ctx, x - ww + 2, y - 3, 1, 2, '#d22'); R(ctx, x + ww - 3, y - 3, 1, 2, '#d22');
  }

  // Faktura / daňový formulář s textem
  function paper(ctx, x, y, label, w = 26, h = 16, col = '#fffdf5', ink = '#c0392b') {
    ctx.font = U.font(7, undefined, U.needsBig(label) ? 30 / RS.s : 0);
    w = Math.max(w, Math.ceil(ctx.measureText(label).width) + 6);
    R(ctx, x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, OUT);
    R(ctx, x - w / 2, y - h / 2, w, h, col);
    R(ctx, x + w / 2 - 4, y - h / 2, 4, 4, '#ddd6c0');
    for (let i = 0; i < 2; i++) R(ctx, x - w / 2 + 3, y + 2 + i * 3, w - 8, 1, '#b8b0a0');
    U.text(ctx, label, x, y - h / 2 + 1, { size: 7, align: 'center', color: ink, outline: false });
  }

  // Řečová bublina
  function bubble(ctx, x, y, text, size = 8, col = '#1d3557', bg = '#ffffff') {
    ctx.font = U.font(size, undefined, U.needsBig(text) ? 30 / RS.s : 0);
    const w = Math.ceil(ctx.measureText(text).width) + 8, h = size + 5;
    R(ctx, x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, OUT);
    R(ctx, x - w / 2, y - h / 2, w, h, bg);
    R(ctx, x - 2, y + h / 2, 4, 2, bg); R(ctx, x - 1, y + h / 2 + 2, 2, 1, bg);
    R(ctx, x - 3, y + h / 2 + 1, 1, 2, OUT); R(ctx, x + 2, y + h / 2 + 1, 1, 2, OUT);
    U.text(ctx, text, x, y - h / 2 + 2, { size, align: 'center', color: col, outline: false });
    return { w, h };
  }

  // Obří EXCEL.EXE boss
  function excelBoss(ctx, x, y, t, hurt) {
    const bob = Math.round(Math.sin(t * 3) * 2);
    y += bob;
    const body = hurt > 0 && (t * 20 | 0) % 2 ? '#ffffff' : '#1d7044';
    R(ctx, x - 34, y - 26, 68, 54, OUT);
    R(ctx, x - 33, y - 25, 66, 52, body);
    R(ctx, x - 33, y - 25, 66, 3, U.shade('#1d7044', 0.25));
    R(ctx, x - 33, y + 22, 66, 5, '#0f4a2a');
    // velké X
    const w = '#ffffff';
    for (let i = 0; i < 9; i++) {
      R(ctx, x - 20 + i * 4, y - 14 + i * 3, 6, 4, w);
      R(ctx, x + 14 - i * 4, y - 14 + i * 3, 6, 4, w);
    }
    // naštvané oči
    R(ctx, x - 26, y - 22, 12, 6, '#fff'); R(ctx, x + 14, y - 22, 12, 6, '#fff');
    R(ctx, x - 20, y - 21, 4, 4, '#d00'); R(ctx, x + 16, y - 21, 4, 4, '#d00');
    R(ctx, x - 28, y - 25, 14, 2, OUT); R(ctx, x + 14, y - 25, 14, 2, OUT);
    // ruce-buňky
    const a = Math.round(Math.sin(t * 5) * 4);
    R(ctx, x - 52, y - 4 + a, 16, 10, OUT); R(ctx, x - 51, y - 3 + a, 14, 8, '#e9f5ec');
    R(ctx, x + 36, y - 4 - a, 16, 10, OUT); R(ctx, x + 37, y - 3 - a, 14, 8, '#e9f5ec');
    U.text(ctx, 'A1', x - 44, y - 3 + a, { size: 7, align: 'center', color: '#1d7044', outline: false });
    U.text(ctx, '#REF', x + 44, y - 3 - a, { size: 7, align: 'center', color: '#c0392b', outline: false });
  }

  // Finální boss MATURITA.EXE — obří počítač
  function maturitaBoss(ctx, x, y, t, hurt, px, py, rage) {
    const shakeX = rage ? Math.round(Math.sin(t * 40)) : 0;
    x += shakeX;
    R(ctx, x - 64, y - 4, 128, 92, OUT);
    R(ctx, x - 63, y - 3, 126, 90, '#cfc8b8');
    R(ctx, x - 63, y - 3, 126, 2, '#efe9db');
    R(ctx, x - 63, y + 80, 126, 7, '#a39d8f');
    // titulek okna
    R(ctx, x - 58, y + 2, 116, 10, '#1b3fa8');
    U.text(ctx, 'MATURITA.EXE', x - 54, y + 2, { size: 9, color: '#fff', outline: false });
    R(ctx, x + 46, y + 4, 8, 6, '#c0392b'); U.text(ctx, 'x', x + 50, y + 2, { size: 8, align: 'center', color: '#fff', outline: false });
    // obrazovka
    const scr = hurt > 0 && (t * 24 | 0) % 2 ? '#ffffff' : '#0b140f';
    R(ctx, x - 58, y + 12, 116, 62, scr);
    if (scr !== '#ffffff') {
      for (let i = 0; i < 62; i += 3) R(ctx, x - 58, y + 12 + i, 116, 1, 'rgba(60,255,120,0.05)');
      // oči sledují hráče
      const dx = U.clamp((px - x) / 40, -3, 3), dy = U.clamp((py - y - 40) / 60, -2, 3);
      const ec = rage ? '#ff2a2a' : '#ff5a3a';
      R(ctx, x - 40, y + 26, 22, 14, '#2a0a0a'); R(ctx, x + 18, y + 26, 22, 14, '#2a0a0a');
      R(ctx, x - 33 + dx * 2, y + 30 + dy, 8, 7, ec); R(ctx, x + 25 + dx * 2, y + 30 + dy, 8, 7, ec);
      R(ctx, x - 31 + dx * 2, y + 31 + dy, 2, 2, '#fff'); R(ctx, x + 27 + dx * 2, y + 31 + dy, 2, 2, '#fff');
      // obočí
      R(ctx, x - 44, y + 21, 26, 3, ec); R(ctx, x + 18, y + 21, 26, 3, ec);
      R(ctx, x - 22, y + 24, 6, 2, ec); R(ctx, x + 16, y + 24, 6, 2, ec);
      // pusa
      const m = (t * 8 | 0) % 2;
      R(ctx, x - 24, y + 52, 48, 4 + m * 3, ec);
      for (let i = 0; i < 6; i++) R(ctx, x - 22 + i * 8, y + 52, 4, 2, '#fff');
      U.text(ctx, 'C:\\> maturita --fail', x - 54, y + 62, { size: 7, color: '#3fff7a', outline: false });
    } else {
      U.text(ctx, '#HODNOTA!', x, y + 34, { size: 14, align: 'center', color: '#c00', outline: false });
    }
    // reproduktory + LED
    R(ctx, x - 58, y + 77, 10, 2, '#7a7468'); R(ctx, x + 50, y + 77, 4, 2, (t * 3 | 0) % 2 ? '#3f3' : '#141');
    // podstavec + kabely
    R(ctx, x - 20, y + 87, 40, 8, OUT); R(ctx, x - 19, y + 88, 38, 6, '#a39d8f');
    R(ctx, x - 70, y + 40, 6, 3, '#333'); R(ctx, x + 64, y + 46, 6, 3, '#333');
  }

  // Diplom
  function diploma(ctx, x, y, s = 1) {
    R(ctx, x - 22 * s, y - 15 * s, 44 * s, 30 * s, OUT);
    R(ctx, x - 21 * s, y - 14 * s, 42 * s, 28 * s, '#fff7e0');
    R(ctx, x - 19 * s, y - 12 * s, 38 * s, 24 * s, '#f2e2b8');
    R(ctx, x - 18 * s, y - 11 * s, 36 * s, 22 * s, '#fff7e0');
    U.text(ctx, 'MATURITNÍ', x, y - 10 * s, { size: 6 * s, align: 'center', color: '#5a3a10', outline: false });
    U.text(ctx, 'VYSVĚDČENÍ', x, y - 4 * s, { size: 6 * s, align: 'center', color: '#5a3a10', outline: false });
    R(ctx, x + 8 * s, y + 4 * s, 7 * s, 7 * s, '#d33a3a'); R(ctx, x + 9 * s, y + 11 * s, 2 * s, 3 * s, '#d33a3a'); R(ctx, x + 12 * s, y + 11 * s, 2 * s, 3 * s, '#d33a3a');
  }

  // Plovoucí dveře (glitch)
  function door(ctx, x, y, t) {
    const f = Math.round(Math.sin(t * 2) * 2);
    R(ctx, x - 8, y - 28 + f, 16, 26, OUT); R(ctx, x - 7, y - 27 + f, 14, 24, '#8b5a2b');
    R(ctx, x - 5, y - 25 + f, 10, 9, '#a06a35'); R(ctx, x - 5, y - 14 + f, 10, 9, '#a06a35');
    R(ctx, x + 3, y - 15 + f, 2, 2, '#ffd23f');
    R(ctx, x - 6, y + 2, 12, 2, 'rgba(0,0,0,0.25)');
  }

  // Počítač místo automatu (glitch)
  function glitchPC(ctx, x, y, t) {
    R(ctx, x - 8, y - 30, 16, 30, OUT); R(ctx, x - 7, y - 29, 14, 28, '#d9d4c7');
    R(ctx, x - 6, y - 27, 12, 9, '#1f4fd0');
    U.text(ctx, ':(', x, y - 28, { size: 8, align: 'center', color: '#fff', outline: false });
    R(ctx, x - 5, y - 15, 10, 2, '#555'); R(ctx, x - 5, y - 11, 10, 2, '#555');
    R(ctx, x + 3, y - 6, 2, 2, (t * 3 | 0) % 2 ? '#3f3' : '#141');
  }

  // Hodiny (bonus čas)
  function confettiColor() { return U.pick(['#ff5a5a', '#ffd23f', '#3fd36b', '#4aa3ff', '#c86bff', '#ff8ad8', '#ffffff']); }

  return { CHARS, get, draw, portrait, drawArt, art, maturitron, semicolon, cpu, book, paper, bubble, excelBoss, maturitaBoss, diploma, door, glitchPC, confettiColor, R, OUT };
})();
