'use strict';
// =============================================================
//  characters.js — kostičkové 3D postavičky s pixel-art texturami.
//  Každá postava = 6 částí (nohy, tělo, ruce, hlava) + doplňky.
//  Vzhled učitelů je SMYŠLENÝ (podle předmětu, ne podle reality).
// =============================================================
const Chars = (() => {
  const SPECS = {
    player: { name: 'TY', title: 'student', skin: '#f1c7a5', hair: '#5a3a22', style: 'short', shirt: '#2a6bd1', pants: '#2f3f5c', shoes: '#f4f4f4', torso: 'hoodie_infis', acc: 'backpack', pitch: 1.1 },
    hojer: { name: 'ADAM HOJER', title: 'C# programování', skin: '#f0c4a0', hair: '#3b2616', style: 'spiky', shirt: '#6c3fb5', pants: '#30364a', shoes: '#222', torso: 'hoodie_cs', acc: 'laptop', pitch: 1.05 },
    nagr: { name: 'VLADIMÍR NÁGR', title: 'programování', skin: '#eec09a', hair: '#161616', style: 'short', glasses: true, shirt: '#1d1f24', pants: '#2b2b30', shoes: '#b0b0b0', torso: 'tee_bug', acc: 'mug', pitch: 0.95 },
    horvath: { name: 'TOBIÁŠ HORVÁTH', title: 'hardware & data', skin: '#e9b993', hair: '#7a4e2a', style: 'side', beard: 'stubble', shirt: '#b03a2e', pants: '#3a4e6e', shoes: '#4a3020', torso: 'plaid', acc: 'ram', pitch: 0.9 },
    novak: { name: 'JAN NOVÁK', title: 'angličtina', skin: '#f2c9a7', hair: '#b88a4a', style: 'side', shirt: '#1f2f5a', pants: '#c8b48a', shoes: '#5a3a22', torso: 'blazer', acc: 'tea', pitch: 1.0 },
    batkova: { name: 'EVA BAŤKOVÁ', title: 'němčina & angličtina', skin: '#f3cbb0', hair: '#7b3a22', style: 'long', shirt: '#c0392b', pants: '#2b2b38', shoes: '#222', torso: 'cardigan_flag', acc: 'book_de', pitch: 1.25 },
    janda: { name: 'ONDŘEJ JANDA', title: 'čeština & literatura', skin: '#ecbf9c', hair: '#6b5a4a', style: 'short', beard: 'full', glasses: true, shirt: '#7a5a36', pants: '#3a3028', shoes: '#2a1a10', torso: 'tweed', acc: 'book', pitch: 0.85 },
    prynych: { name: 'MIROSLAV PRYNYCH', title: 'zpracování dat (Excel)', skin: '#efc29e', hair: '#9a9a9a', style: 'bald', glasses: true, shirt: '#e8f5ee', pants: '#555a60', shoes: '#222', torso: 'excel_tie', acc: 'excel', pitch: 0.8 },
    ladman: { name: 'ADAM LÁĎMAN', title: 'ekonomika & účetnictví', skin: '#eec39f', hair: '#2a1a10', style: 'slick', shirt: '#5d6470', pants: '#3a3f46', shoes: '#111', torso: 'suit', acc: 'calc', pitch: 0.92 },
    olga: { name: 'OLGA BŘÍZOVÁ', title: 'matematika (v důchodu)', skin: '#f0c8ad', hair: '#d9d9de', style: 'bun', glasses: true, shirt: '#7d3c98', pants: '#3b2a4a', shoes: '#3a2010', torso: 'cardigan_pearls', acc: 'ruler', pitch: 1.3 },
    pepa: { name: 'PEPA', title: 'spolužák', skin: '#f1c7a5', hair: '#2a5fbf', style: 'beanie', shirt: '#ff8a2c', pants: '#2f3f5c', shoes: '#fff', torso: 'hoodie', acc: null, pitch: 1.15 },
    klara: { name: 'KLÁRA', title: 'spolužačka', skin: '#f6d2b8', hair: '#e6c15a', style: 'long', shirt: '#27ae60', pants: '#30364a', shoes: '#fff', torso: 'hoodie', acc: null, pitch: 1.35 },
    kuba: { name: 'KUBA', title: 'z vedlejší třídy', skin: '#c99872', hair: '#1a1a1a', style: 'curly', shirt: '#8a8f98', pants: '#2a2a30', shoes: '#c0392b', torso: 'tee', acc: null, pitch: 1.1 },
    komise: { name: 'PŘEDSEDA KOMISE', title: 'maturitní komise', skin: '#e9bf9d', hair: '#555', style: 'bald', glasses: true, beard: 'goatee', shirt: '#2d2d34', pants: '#2d2d34', shoes: '#111', torso: 'suit', acc: null, pitch: 0.75 },
  };

  // ---------------------------------------------------------
  //  pixel-art textury postav (32×32)
  // ---------------------------------------------------------
  function c32() { return Tex.cv(32); }
  const P = (x, col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const sh = Tex.sh;

  function drawFace(x, s, mood = 'normal') {
    const skin = s.skin, hair = s.hair, dk = sh(skin, -0.25);
    P(x, skin, 0, 0, 32, 32);
    P(x, sh(skin, -0.08), 0, 26, 32, 6);
    // vlasy
    const st = s.style;
    if (st === 'short' || st === 'side' || st === 'slick') {
      P(x, hair, 0, 0, 32, 8); P(x, hair, 0, 8, 3, 6); P(x, hair, 29, 8, 3, 6);
      if (st === 'side') { P(x, hair, 3, 8, 14, 3); P(x, hair, 3, 11, 6, 2); }
      if (st === 'slick') { P(x, sh(hair, 0.3), 4, 2, 20, 1); P(x, hair, 18, 8, 11, 2); }
      if (st === 'short') { P(x, hair, 4, 8, 6, 2); P(x, hair, 14, 8, 9, 2); }
    } else if (st === 'spiky') {
      P(x, hair, 0, 0, 32, 8); for (let i = 0; i < 32; i += 4) P(x, hair, i, 8, 3, 3 + (i % 8 ? 1 : 0)); P(x, hair, 0, 8, 3, 6); P(x, hair, 29, 8, 3, 6);
    } else if (st === 'long') {
      P(x, hair, 0, 0, 32, 9); P(x, hair, 0, 9, 4, 23); P(x, hair, 28, 9, 4, 23); P(x, hair, 4, 9, 10, 3); P(x, hair, 18, 9, 10, 2);
    } else if (st === 'bun' || st === 'bald') {
      if (st === 'bun') { P(x, hair, 0, 0, 32, 7); P(x, hair, 0, 7, 3, 7); P(x, hair, 29, 7, 3, 7); P(x, sh(hair, -0.15), 0, 6, 32, 1); }
      else { P(x, sh(skin, 0.08), 6, 1, 20, 5); P(x, hair, 0, 6, 3, 9); P(x, hair, 29, 6, 3, 9); }
    } else if (st === 'beanie') {
      P(x, hair, 0, 0, 32, 10); P(x, sh(hair, -0.2), 0, 8, 32, 2); for (let i = 1; i < 32; i += 3) P(x, sh(hair, 0.2), i, 1, 1, 6);
    } else if (st === 'curly') {
      for (let j = 0; j < 10; j++) for (let i = 0; i < 32; i += 2) P(x, (i + j) % 4 ? hair : sh(hair, 0.25), i + (j % 2), j, 2, 1);
      P(x, hair, 0, 10, 3, 5); P(x, hair, 29, 10, 3, 5);
    }
    // obočí
    const brow = st === 'bald' || st === 'bun' ? '#777' : sh(hair, -0.2);
    if (mood === 'angry') { P(x, brow, 7, 12, 3, 1); P(x, brow, 10, 13, 3, 1); P(x, brow, 19, 13, 3, 1); P(x, brow, 22, 12, 3, 1); }
    else { P(x, brow, 7, 12, 6, 2); P(x, brow, 19, 12, 6, 2); }
    // oči
    P(x, '#fff', 8, 15, 4, 4); P(x, '#fff', 20, 15, 4, 4);
    P(x, '#2a2018', 9, 16, 3, 3); P(x, '#2a2018', 21, 16, 3, 3);
    P(x, '#fff', 10, 16, 1, 1); P(x, '#fff', 22, 16, 1, 1);
    if (s.glasses) {
      const g = '#1a1a1a';
      P(x, g, 6, 14, 8, 1); P(x, g, 6, 20, 8, 1); P(x, g, 6, 14, 1, 7); P(x, g, 13, 14, 1, 7);
      P(x, g, 18, 14, 8, 1); P(x, g, 18, 20, 8, 1); P(x, g, 18, 14, 1, 7); P(x, g, 25, 14, 1, 7);
      P(x, g, 14, 16, 4, 1); P(x, g, 2, 15, 4, 1); P(x, g, 26, 15, 4, 1);
      P(x, 'rgba(255,255,255,0.35)', 7, 15, 2, 1); P(x, 'rgba(255,255,255,0.35)', 19, 15, 2, 1);
    }
    // nos, tváře
    P(x, dk, 15, 19, 2, 3); P(x, sh(skin, -0.12), 14, 22, 4, 1);
    P(x, 'rgba(255,120,120,0.25)', 5, 21, 3, 2); P(x, 'rgba(255,120,120,0.25)', 24, 21, 3, 2);
    // vousy
    if (s.beard === 'full') { P(x, sh(hair, 0.05), 3, 21, 26, 11); P(x, sh(hair, 0.05), 3, 17, 3, 4); P(x, sh(hair, 0.05), 26, 17, 3, 4); P(x, skin, 8, 21, 16, 2); P(x, sh(hair, 0.05), 11, 21, 10, 2); }
    if (s.beard === 'stubble') for (let j = 22; j < 31; j++) for (let i = 4 + (j % 2); i < 28; i += 2) P(x, sh(skin, -0.3), i, j, 1, 1);
    if (s.beard === 'goatee') P(x, '#555', 12, 26, 8, 5);
    // pusa
    if (mood === 'talk') { P(x, '#5a1f1f', 12, 24, 8, 4); P(x, '#c44', 13, 26, 6, 2); }
    else if (mood === 'angry') { P(x, '#5a1f1f', 11, 26, 10, 1); P(x, '#5a1f1f', 10, 27, 2, 1); P(x, '#5a1f1f', 20, 27, 2, 1); }
    else { P(x, '#7a2f2f', 12, 25, 8, 1); P(x, '#7a2f2f', 11, 24, 1, 1); P(x, '#7a2f2f', 20, 24, 1, 1); }
    if (s.beard === 'full') { P(x, '#5a1f1f', 13, 25, 6, 1); }
  }
  function drawSide(x, s) {
    P(x, s.skin, 0, 0, 32, 32); P(x, sh(s.skin, -0.08), 0, 26, 32, 6);
    const hair = s.hair, st = s.style;
    if (st === 'beanie') { P(x, hair, 0, 0, 32, 12); P(x, sh(hair, -0.2), 0, 9, 32, 2); }
    else if (st === 'long') { P(x, hair, 0, 0, 32, 9); P(x, hair, 0, 9, 22, 23); }
    else if (st === 'bald') { P(x, sh(s.skin, 0.05), 0, 0, 32, 6); P(x, hair, 0, 6, 20, 10); }
    else { P(x, hair, 0, 0, 32, 9); P(x, hair, 0, 9, 18, st === 'bun' ? 9 : 7); }
    if (s.beard === 'full') P(x, sh(hair, 0.05), 14, 18, 18, 14);
    P(x, sh(s.skin, -0.15), 14, 14, 4, 6); P(x, sh(s.skin, -0.3), 15, 15, 2, 4); // ucho
    if (s.glasses) P(x, '#1a1a1a', 18, 15, 14, 1);
  }
  function drawBack(x, s) {
    const hair = s.hair, st = s.style;
    P(x, s.skin, 0, 0, 32, 32);
    if (st === 'bald') { P(x, sh(s.skin, 0.05), 0, 0, 32, 8); P(x, hair, 0, 8, 32, 14); }
    else if (st === 'beanie') { P(x, hair, 0, 0, 32, 12); P(x, sh(hair, -0.2), 0, 9, 32, 2); P(x, sh(s.hair, -0.6), 0, 12, 32, 10); }
    else { P(x, hair, 0, 0, 32, st === 'long' ? 32 : 24); for (let i = 0; i < 32; i += 3) P(x, sh(hair, -0.12), i, 3, 1, st === 'long' ? 28 : 18); }
  }
  function drawTop(x, s) {
    const st = s.style;
    if (st === 'bald') { P(x, sh(s.skin, 0.05), 0, 0, 32, 32); P(x, s.hair, 0, 0, 32, 3); P(x, s.hair, 0, 29, 32, 3); P(x, s.hair, 0, 0, 3, 32); P(x, s.hair, 29, 0, 3, 32); return; }
    P(x, s.hair, 0, 0, 32, 32);
    for (let k = 0; k < 40; k++) P(x, sh(s.hair, (k % 2 ? 0.15 : -0.15)), (k * 7) % 32, (k * 13) % 32, 2, 1);
  }
  function drawTorso(x, s, front) {
    const c = s.shirt, t = s.torso;
    P(x, c, 0, 0, 32, 32);
    P(x, sh(c, -0.18), 0, 28, 32, 4); P(x, sh(c, 0.1), 0, 0, 32, 2);
    if (!front) {
      if (t === 'hoodie' || t === 'hoodie_infis' || t === 'hoodie_cs') { P(x, sh(c, -0.12), 6, 0, 20, 8); }
      if (t === 'cardigan_flag') { P(x, '#111', 0, 0, 32, 2); P(x, '#d00', 0, 2, 32, 2); P(x, '#ffce00', 0, 4, 32, 2); }
      if (t === 'plaid') plaid(x, c);
      return;
    }
    switch (t) {
      case 'hoodie': case 'hoodie_infis': case 'hoodie_cs':
        P(x, sh(c, -0.15), 10, 0, 12, 4); P(x, '#eee', 13, 3, 1, 7); P(x, '#eee', 18, 3, 1, 7);
        P(x, sh(c, -0.12), 7, 20, 18, 7);
        if (t === 'hoodie_infis') { Tex.text(x, 'INFIS', 16, 14, 7, '#fff'); P(x, '#ff7a1c', 15, 0, 2, 28); }
        if (t === 'hoodie_cs') { Tex.text(x, 'C#', 16, 13, 10, '#fff'); }
        break;
      case 'tee': P(x, sh(c, -0.2), 11, 0, 10, 3); break;
      case 'tee_bug':
        P(x, '#333', 11, 0, 10, 3);
        P(x, '#3cff7a', 12, 9, 8, 7); P(x, '#1d1f24', 15, 9, 2, 7); P(x, '#3cff7a', 10, 10, 2, 1); P(x, '#3cff7a', 20, 10, 2, 1); P(x, '#3cff7a', 10, 14, 2, 1); P(x, '#3cff7a', 20, 14, 2, 1);
        Tex.text(x, '0 bugs', 16, 22, 5, '#3cff7a', 'center', 500);
        break;
      case 'plaid': plaid(x, c); P(x, '#eee', 14, 0, 4, 28); P(x, '#111', 15, 6, 2, 1); P(x, '#111', 15, 12, 2, 1); P(x, '#2a2a2a', 4, 6, 3, 14); break;
      case 'blazer':
        P(x, '#f4f4f4', 11, 0, 10, 28); P(x, c, 0, 0, 11, 32); P(x, c, 21, 0, 11, 32);
        P(x, sh(c, 0.2), 9, 0, 3, 16); P(x, sh(c, 0.2), 20, 0, 3, 16); P(x, '#012169', 24, 8, 4, 3); P(x, '#c8102e', 25, 9, 2, 1);
        break;
      case 'cardigan_flag':
        P(x, '#f4f4f4', 11, 0, 10, 30); P(x, '#ddd', 15, 4, 2, 2); P(x, '#ddd', 15, 12, 2, 2);
        P(x, '#111', 4, 0, 24, 2); P(x, '#d00', 4, 2, 24, 2); P(x, '#ffce00', 4, 4, 24, 2); P(x, '#d00', 8, 6, 3, 10);
        break;
      case 'tweed':
        for (let j = 0; j < 32; j += 2) for (let i = (j / 2) % 2; i < 32; i += 2) P(x, sh(c, -0.12), i, j, 1, 1);
        P(x, '#e9e3d0', 12, 0, 8, 26); P(x, '#2b4f8e', 14, 2, 4, 22); P(x, sh(c, 0.15), 9, 0, 3, 18); P(x, sh(c, 0.15), 20, 0, 3, 18);
        P(x, '#8e2b2b', 22, 8, 4, 2);
        break;
      case 'excel_tie':
        P(x, '#c9d6cc', 0, 0, 32, 1); P(x, '#ddd', 13, 0, 6, 3);
        for (let j = 3; j < 26; j++) { const w = j < 6 ? 4 : 6; P(x, '#21a366', 16 - w / 2, j, w, 1); }
        P(x, '#107c41', 14, 8, 1, 16); P(x, '#107c41', 17, 8, 1, 16); for (let j = 8; j < 26; j += 4) P(x, '#107c41', 13, j, 6, 1);
        P(x, '#21a366', 4, 6, 5, 6); P(x, '#fff', 5, 7, 3, 1);
        break;
      case 'suit':
        P(x, '#f4f4f4', 12, 0, 8, 26); P(x, '#2b4fa0', 15, 2, 2, 22); P(x, sh(c, 0.2), 9, 0, 3, 18); P(x, sh(c, 0.2), 20, 0, 3, 18); P(x, '#ddd', 22, 6, 3, 1);
        break;
      case 'cardigan_pearls':
        P(x, '#f4e8f8', 11, 0, 10, 28); for (let i = 9; i < 24; i += 2) P(x, '#fff', i, 4 + Math.round(Math.sin((i - 9) / 15 * Math.PI) * 3), 2, 2);
        P(x, '#e6b3ff', 13, 12, 2, 2); P(x, '#e6b3ff', 13, 18, 2, 2);
        break;
    }
  }
  function plaid(x, c) {
    for (let k = 0; k < 32; k += 8) { P(x, sh(c, -0.35), k, 0, 3, 32); P(x, sh(c, -0.35), 0, k, 32, 3); P(x, sh(c, 0.25), k + 5, 0, 1, 32); P(x, sh(c, 0.25), 0, k + 5, 32, 1); }
  }
  function drawArm(x, s) {
    const sleeve = (s.torso === 'blazer' || s.torso === 'suit' || s.torso === 'tweed') ? s.shirt : s.torso === 'excel_tie' ? s.shirt : s.shirt;
    P(x, sleeve, 0, 0, 32, 24); P(x, sh(sleeve, -0.2), 0, 20, 32, 4);
    if (s.torso === 'tee' || s.torso === 'tee_bug') { P(x, s.skin, 0, 10, 32, 22); P(x, sleeve, 0, 0, 32, 10); }
    P(x, s.skin, 0, 24, 32, 8);
    if (s.torso === 'plaid') plaid(x, s.shirt);
  }
  function drawLeg(x, s) {
    P(x, s.pants, 0, 0, 32, 26); P(x, sh(s.pants, -0.15), 0, 0, 32, 2); P(x, sh(s.pants, 0.12), 14, 2, 2, 22);
    P(x, s.shoes, 0, 26, 32, 6); P(x, sh(s.shoes, -0.3), 0, 31, 32, 1);
  }

  function makeLayers(id) {
    const s = SPECS[id], L = {};
    const mk = (name, fn) => { const c = c32(), x = c.getContext('2d'); fn(x); L[name] = Tex.addCanvas('ch_' + id + '_' + name, c); s['cv_' + name] = c; };
    mk('face', (x) => drawFace(x, s));
    mk('side', (x) => drawSide(x, s));
    mk('back', (x) => drawBack(x, s));
    mk('top', (x) => drawTop(x, s));
    mk('tf', (x) => drawTorso(x, s, true));
    mk('tb', (x) => drawTorso(x, s, false));
    mk('arm', (x) => drawArm(x, s));
    mk('leg', (x) => drawLeg(x, s));
    s.layers = L;
  }

  // portrét do dialogu (canvas)
  const portraits = {};
  function portrait(id, mood = 'normal') {
    const key = id + mood;
    if (portraits[key]) return portraits[key];
    const s = SPECS[id];
    const c = Tex.cv(40, 40), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    // tělo
    const tf = c32(); drawTorso(tf.getContext('2d'), s, true);
    x.drawImage(tf, 0, 0, 32, 20, 2, 30, 36, 20);
    const f = c32(); drawFace(f.getContext('2d'), s, mood);
    x.drawImage(f, 4, 1);
    if (s.style === 'long') { P(x, s.hair, 2, 6, 3, 26); P(x, s.hair, 35, 6, 3, 26); }
    if (s.style === 'bun') { P(x, s.hair, 14, 0, 12, 3); }
    portraits[key] = c;
    return c;
  }

  // MATURITRON: obličej na CRT (dynamická textura)
  function drawMTFace(x, size, mood, t, boss) {
    const s = size / 32;
    const R = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(a * s, b * s, w * s, h * s); };
    R(boss ? '#1a0306' : '#04140b', 0, 0, 32, 32);
    const g = boss ? '#ff3344' : '#3cff7a', gd = boss ? '#7a0f18' : '#145a2c';
    for (let j = 0; j < 32; j += 2) R(boss ? 'rgba(255,50,70,0.08)' : 'rgba(60,255,122,0.06)', 0, j, 32, 1);
    R(gd, 2, 2, 28, 1); R(gd, 2, 29, 28, 1);
    const blink = (t % 3.2) < 0.12;
    if (mood === 'error') { Tex.text(x, 'ERR', size / 2, size * 0.4, size * 0.28, g); Tex.text(x, ':(', size / 2, size * 0.72, size * 0.25, g); return; }
    // oči
    if (blink) { R(g, 7, 12, 6, 1); R(g, 19, 12, 6, 1); }
    else if (mood === 'angry') { R(g, 7, 9, 2, 1); R(g, 9, 10, 2, 1); R(g, 11, 11, 2, 1); R(g, 23, 9, 2, 1); R(g, 21, 10, 2, 1); R(g, 19, 11, 2, 1); R(g, 8, 12, 4, 3); R(g, 20, 12, 4, 3); }
    else if (mood === 'happy') { R(g, 7, 12, 1, 1); R(g, 8, 11, 4, 1); R(g, 12, 12, 1, 1); R(g, 19, 12, 1, 1); R(g, 20, 11, 4, 1); R(g, 24, 12, 1, 1); }
    else { R(g, 8, 10, 4, 4); R(g, 20, 10, 4, 4); R(boss ? '#fff' : '#cfffe0', 9, 11, 1, 1); R(boss ? '#fff' : '#cfffe0', 21, 11, 1, 1); }
    // pusa (mluví)
    const open = mood === 'talk' ? Math.abs(Math.sin(t * 14)) * 4 : 0;
    if (mood === 'angry' || boss) { R(g, 10, 21, 12, 1); for (let i = 10; i < 22; i += 3) R(g, i, 22, 2, 2); R(g, 10, 24, 12, 1); }
    else if (mood === 'happy') { R(g, 9, 20, 1, 1); R(g, 10, 21, 12, 1); R(g, 22, 20, 1, 1); }
    else { R(g, 11, 21, 10, 1 + open); }
  }

  // ---------------------------------------------------------
  //  3D model postavy
  // ---------------------------------------------------------
  const models = {};
  function buildModel(id) {
    const s = SPECS[id], L = s.layers, m = new MeshBuilder(), parts = {};
    const part = (name, fn) => { const st = m.indexCount; fn(); parts[name] = [st, m.indexCount - st]; };
    const pantsTop = Tex.L('white'), pc = U.hex(s.pants).concat([0]);
    part('legL', () => m.box(-0.1, -0.78, -0.11, 0.1, 0, 0.11, { tex: { side: L.leg, top: pantsTop, bottom: Tex.L('black') }, uv: 'fit', col: undefined }));
    part('legR', () => m.box(-0.1, -0.78, -0.11, 0.1, 0, 0.11, { tex: { side: L.leg, top: pantsTop, bottom: Tex.L('black') }, uv: 'fit' }));
    part('torso', () => {
      m.box(-0.25, 0, -0.14, 0.25, 0.62, 0.14, { tex: { pz: L.tf, nz: L.tb, px: L.tb, nx: L.tb, top: L.tb, bottom: L.tb }, uv: 'fit' });
      if (s.acc === 'backpack') m.box(-0.2, 0.12, -0.3, 0.2, 0.55, -0.14, { tex: Tex.L('orange') });
      if (s.torso === 'hoodie' || s.torso === 'hoodie_infis' || s.torso === 'hoodie_cs') m.box(-0.18, 0.5, -0.2, 0.18, 0.66, -0.12, { tex: L.tb, uv: 'fit' });
    });
    void pc;
    const handAcc = (side) => {
      if (side !== 'R') return;
      const a = s.acc;
      if (a === 'laptop') m.box(-0.05, -0.7, -0.05, 0.05, -0.45, 0.28, { tex: Tex.L('plastic') });
      if (a === 'mug' || a === 'tea') { m.box(-0.06, -0.72, 0.05, 0.06, -0.58, 0.17, { tex: Tex.L('white'), col: a === 'tea' ? [1, 1, 1, 0] : [0.15, 0.15, 0.17, 0] }); }
      if (a === 'book' || a === 'book_de') m.box(-0.04, -0.72, 0.0, 0.06, -0.45, 0.2, { tex: Tex.L('white'), col: a === 'book' ? [0.6, 0.15, 0.15, 0] : [0.9, 0.75, 0.1, 0] });
      if (a === 'ram') m.box(-0.02, -0.7, 0.02, 0.02, -0.62, 0.3, { tex: Tex.L('white'), col: [0.05, 0.45, 0.25, 0] });
      if (a === 'excel') m.box(-0.04, -0.72, 0.0, 0.04, -0.46, 0.22, { tex: Tex.L('excel_logo'), uv: 'fit' });
      if (a === 'calc') m.box(-0.05, -0.7, 0.04, 0.05, -0.56, 0.2, { tex: Tex.L('keyboard'), uv: 'fit' });
      if (a === 'ruler') m.box(-0.015, -0.68, -0.05, 0.015, -0.62, 0.45, { tex: Tex.L('wood') });
    };
    for (const side of ['L', 'R']) part('arm' + side, () => { m.box(-0.075, -0.62, -0.085, 0.075, 0.02, 0.085, { tex: { side: L.arm, top: L.arm, bottom: Tex.L('white') }, uv: 'fit', col: undefined }); handAcc(side); });
    part('head', () => {
      m.box(-0.22, 0, -0.22, 0.22, 0.44, 0.22, { tex: { pz: L.face, nz: L.back, px: L.side, nx: L.side, top: L.top, bottom: L.back }, uv: 'fit' });
      if (s.style === 'long') m.box(-0.23, -0.28, -0.24, 0.23, 0.38, -0.1, { tex: L.top, uv: 'fit' });
      if (s.style === 'bun') m.box(-0.1, 0.36, -0.26, 0.1, 0.56, -0.06, { tex: L.top, uv: 'fit' });
      if (s.style === 'spiky') for (let k = 0; k < 4; k++) m.box(-0.18 + k * 0.1, 0.44, -0.12 + (k % 2) * 0.08, -0.12 + k * 0.1, 0.52, -0.04 + (k % 2) * 0.08, { tex: L.top, uv: 'fit' });
      if (s.style === 'beanie') m.box(-0.06, 0.44, -0.06, 0.06, 0.52, 0.06, { tex: L.top, uv: 'fit' });
      if (s.style === 'curly') m.box(-0.23, 0.36, -0.23, 0.23, 0.5, 0.2, { tex: L.top, uv: 'fit' });
    });
    models[id] = { mesh: m.build(), parts };
  }

  // MATURITRON (CRT monitor s obličejem) — sdílený model pro dron i bosse
  let mtModel = null;
  const mtCanvas = Tex.cv(128), bossCanvas = Tex.cv(128);
  let mtLayer = 0, bossLayer = 0;
  function buildMT() {
    mtLayer = Tex.addCanvas('mt_face', mtCanvas);
    bossLayer = Tex.addCanvas('boss_face', bossCanvas);
  }
  function buildMTModels() {
    const mk = (layer) => {
      const m = new MeshBuilder(), CR = Tex.L('crt');
      m.box(-0.5, -0.4, -0.45, 0.5, 0.4, 0.3, { tex: CR, uv: 'fit' });
      m.box(-0.36, -0.3, -0.75, 0.36, 0.3, -0.45, { tex: CR, uv: 'fit' });
      m.box(-0.42, -0.32, 0.3, 0.42, 0.32, 0.31, { tex: layer, uv: 'fit', col: [1, 1, 1, 1] });
      m.box(0.3, -0.38, 0.29, 0.42, -0.34, 0.32, { tex: Tex.L('lamp'), col: [0.3, 1.5, 0.5, 1] });
      m.box(-0.02, 0.4, -0.1, 0.02, 0.75, -0.06, { tex: Tex.L('metal') });
      m.box(-0.06, 0.75, -0.12, 0.06, 0.85, -0.02, { tex: Tex.L('white'), col: [1.5, 0.2, 0.2, 1] });
      return m.build();
    };
    mtModel = { drone: mk(mtLayer), boss: mk(bossLayer) };
  }
  let mtMood = 'normal', bossMood = 'angry', faceT = 0, lastFace = '';
  function updateFaces(dt, bossActive) {
    faceT += dt;
    const key = mtMood + Math.floor(faceT * 15) + (bossActive ? bossMood : '');
    if (key === lastFace) return; lastFace = key;
    const x = mtCanvas.getContext('2d'); drawMTFace(x, 128, mtMood, faceT, false); GFX.updateLayer(mtLayer, mtCanvas);
    if (bossActive) { const y = bossCanvas.getContext('2d'); drawMTFace(y, 128, bossMood, faceT, true); GFX.updateLayer(bossLayer, bossCanvas); }
  }

  function init() {
    for (const id in SPECS) makeLayers(id);
    buildMT();
  }
  function buildMeshes() {
    for (const id in SPECS) buildModel(id);
    buildMTModels();
  }

  // ---------------------------------------------------------
  //  Postava ve světě
  // ---------------------------------------------------------
  class Char {
    constructor(id, x, z, o = {}) {
      this.id = id; this.spec = SPECS[id];
      this.x = x; this.z = z; this.y = 0; this.yaw = o.yaw || 0;
      this.speed = 0; this.phase = Math.random() * 6; this.t = Math.random() * 10;
      this.scale = o.scale || 1; this.talk = 0; this.wave = 0; this.vy = 0;
      this.visible = true; this.tint = null; this.spin = 0; this.flip = 0;
      Object.assign(this, o);
    }
    update(dt) {
      this.t += dt;
      if (this.speed > 0.05) this.phase += dt * (4 + this.speed * 1.6);
      this.talk = Math.max(0, this.talk - dt);
      this.wave = Math.max(0, this.wave - dt);
    }
    draw() {
      if (!this.visible) return;
      const md = models[this.id]; if (!md) return;
      const s = this.scale, moving = this.speed > 0.05;
      const sw = moving ? Math.sin(this.phase) * Math.min(1, this.speed / 3) * 0.75 : 0;
      const bob = moving ? Math.abs(Math.sin(this.phase)) * 0.05 : Math.sin(this.t * 2) * 0.008;
      const base = GFX.mat();
      M4.translate(base, base, this.x, this.y + bob * s, this.z);
      M4.rotY(base, base, this.yaw + this.spin);
      if (this.flip) M4.rotX(base, base, this.flip);
      M4.scale(base, base, s, s, s);
      const opt = this.tint ? { tint: this.tint } : null;
      const drawPart = (name, px, py, pz, rx, rz = 0) => {
        const m = GFX.mat(); M4.copy(m, base); M4.translate(m, m, px, py, pz);
        if (rx) M4.rotX(m, m, rx); if (rz) M4.rotZ(m, m, rz);
        const p = md.parts[name]; GFX.submit(md.mesh, m, p[0], p[1], opt);
      };
      drawPart('legL', -0.11, 0.78, 0, sw);
      drawPart('legR', 0.11, 0.78, 0, -sw);
      drawPart('torso', 0, 0.78, 0, moving ? 0.06 : 0);
      const talkA = this.talk > 0 ? Math.sin(this.t * 9) * 0.25 - 0.35 : 0;
      const waveA = this.wave > 0 ? -2.6 + Math.sin(this.t * 14) * 0.3 : 0;
      const idleA = Math.sin(this.t * 1.7) * 0.04;
      drawPart('armL', -0.33, 1.38, 0, -sw * 0.9 + idleA + (waveA ? 0 : 0), 0.06);
      drawPart('armR', 0.33, 1.38, 0, sw * 0.9 - idleA + (waveA || talkA || (this.spec.acc && !moving ? -0.45 : 0)), waveA ? -0.2 : -0.06);
      const nod = this.talk > 0 ? Math.sin(this.t * 7) * 0.08 : Math.sin(this.t * 0.9) * 0.03;
      drawPart('head', 0, 1.40, 0, nod);
    }
  }

  function drawMT(x, y, z, yaw, scale, boss, pitch = 0, opt = null) {
    if (!mtModel) return;
    const m = GFX.mat(); M4.translate(m, m, x, y, z); M4.rotY(m, m, yaw); if (pitch) M4.rotX(m, m, pitch); M4.scale(m, m, scale, scale, scale);
    GFX.submit(boss ? mtModel.boss : mtModel.drone, m, 0, -1, opt);
  }

  return {
    SPECS, init, buildMeshes, Char, portrait, drawMT, updateFaces, drawMTFace,
    setMTMood(m) { mtMood = m; }, setBossMood(m) { bossMood = m; },
  };
})();
