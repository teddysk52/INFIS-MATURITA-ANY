'use strict';
// =============================================================
//  textures.js — všechny textury se kreslí kódem do <canvas>.
//  Pixel-art: kreslíme v nízkém rozlišení (32×32) a zvětšujeme
//  bez vyhlazení. Výsledek je pole vrstev (TEXTURE_2D_ARRAY).
//  + SpriteAtlas: 2D atlas pro sprity a efekty.
// =============================================================
const Tex = (() => {
  const SIZE = 128;
  const layers = [], names = {}, variants = {};
  const FONT = '"Pixelify Sans", "Courier New", monospace';

  function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function up(small) { // zvětšení na 128 bez vyhlazení
    const big = cv(SIZE); const x = big.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(small, 0, 0, SIZE, SIZE); return big;
  }
  function addCanvas(name, c) {
    if (c.width !== SIZE) c = up(c);
    if (names[name] !== undefined) { layers[names[name]] = c; return names[name]; }
    names[name] = layers.length; layers.push(c); return names[name];
  }
  function px(name, r, draw, seed) {
    const c = cv(r), x = c.getContext('2d');
    draw(x, r, U.rng(seed || hash(name)));
    return addCanvas(name, c);
  }
  function hi(name, draw, seed) {
    const c = cv(SIZE), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    draw(x, SIZE, U.rng(seed || hash(name)));
    return addCanvas(name, c);
  }
  // varianta textury pro pozdější výměnu (roční období, hrad...)
  function variant(name, r, draw) {
    const c = cv(r), x = c.getContext('2d'); draw(x, r, U.rng(hash(name)));
    variants[name] = r === SIZE ? c : up(c);
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // --- barvy
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function css(c) { return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; }
  function sh(hex, f) { const c = rgb(hex); return css(c.map(v => Math.max(0, Math.min(255, f > 0 ? v + (255 - v) * f : v * (1 + f))))); }
  function noise(x, w, h, hex, amt, rnd, x0 = 0, y0 = 0) {
    const c = rgb(hex);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (rnd() - 0.5) * 2 * amt;
      x.fillStyle = css(c.map(v => v * (1 + k))); x.fillRect(x0 + i, y0 + j, 1, 1);
    }
  }
  function rect(x, c, a, b, w, h) { x.fillStyle = c; x.fillRect(a, b, w, h); }
  function text(x, t, X, Y, size, col, align = 'center', weight = 500, maxW) {
    x.font = `${weight} ${size}px ${FONT}`; x.fillStyle = col; x.textAlign = align; x.textBaseline = 'middle';
    if (maxW) x.fillText(t, X, Y, maxW); else x.fillText(t, X, Y);
  }

  // ---------------------------------------------------------
  //  SVĚT
  // ---------------------------------------------------------
  function buildWorld() {
    px('white', 4, (x) => rect(x, '#fff', 0, 0, 4, 4));
    px('black', 4, (x) => rect(x, '#111', 0, 0, 4, 4));

    const grass = (x, r, rnd, base, blade, flowers) => {
      noise(x, r, r, base, 0.08, rnd);
      for (let i = 0; i < 70; i++) { x.fillStyle = rnd() < 0.5 ? sh(base, 0.18) : sh(base, -0.18); x.fillRect(rnd() * r | 0, rnd() * r | 0, 1, 2); }
      if (flowers) for (let i = 0; i < 3; i++) { x.fillStyle = rnd() < 0.5 ? '#fff6c8' : '#ffd23f'; x.fillRect(rnd() * r | 0, rnd() * r | 0, 1, 1); }
    };
    px('grass', 32, (x, r, rnd) => grass(x, r, rnd, '#5f9e3f', 1, true));
    variant('grass_snow', 32, (x, r, rnd) => { noise(x, r, r, '#e9f0f7', 0.04, rnd); for (let i = 0; i < 14; i++) { x.fillStyle = '#c9d6e4'; x.fillRect(rnd() * r | 0, rnd() * r | 0, 2, 1); } for (let i = 0; i < 8; i++) { x.fillStyle = '#6a9a4a'; x.fillRect(rnd() * r | 0, rnd() * r | 0, 1, 2); } });
    variant('grass_autumn', 32, (x, r, rnd) => { grass(x, r, rnd, '#7f9a3e', 1, false); for (let i = 0; i < 26; i++) { x.fillStyle = ['#d9822b', '#c4471f', '#e6b13a'][i % 3]; x.fillRect(rnd() * r | 0, rnd() * r | 0, 2, 1); } });
    variant('grass_night', 32, (x, r, rnd) => grass(x, r, rnd, '#4f8a3a', 1, true));

    px('asphalt', 32, (x, r, rnd) => { noise(x, r, r, '#55585e', 0.1, rnd); for (let i = 0; i < 40; i++) { x.fillStyle = rnd() < 0.5 ? '#6b6e74' : '#3f4247'; x.fillRect(rnd() * r | 0, rnd() * r | 0, 1, 1); } });
    px('sidewalk', 32, (x, r, rnd) => {
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) noise(x, 7, 7, ['#a7a7a2', '#9d9d98', '#b0b0aa'][(i + j * 2) % 3], 0.05, rnd, i * 8, j * 8);
      x.fillStyle = '#7d7d79'; for (let k = 0; k < 4; k++) { x.fillRect(k * 8 + 7, 0, 1, r); x.fillRect(0, k * 8 + 7, r, 1); }
    });
    px('curb', 16, (x, r, rnd) => { noise(x, r, r, '#c3c3bd', 0.05, rnd); rect(x, '#9a9a94', 0, r - 2, r, 2); });
    px('dirt', 32, (x, r, rnd) => { noise(x, r, r, '#c9b38a', 0.08, rnd); for (let i = 0; i < 30; i++) { x.fillStyle = rnd() < 0.5 ? '#a8926c' : '#ddc9a2'; x.fillRect(rnd() * r | 0, rnd() * r | 0, 1, 1); } });
    px('clay', 32, (x, r, rnd) => noise(x, r, r, '#c4643a', 0.07, rnd));
    px('court', 32, (x, r, rnd) => noise(x, r, r, '#3f7fb5', 0.05, rnd));
    px('gravel', 32, (x, r, rnd) => { noise(x, r, r, '#8f8c86', 0.15, rnd); });

    // fasáda
    px('plaster_blue', 32, (x, r, rnd) => { noise(x, r, r, '#8cb8e8', 0.035, rnd); });
    variant('plaster_stone', 32, (x, r, rnd) => { stoneBlocks(x, r, rnd, '#8a8a86'); });
    px('plaster_white', 32, (x, r, rnd) => noise(x, r, r, '#f1f3f5', 0.025, rnd));
    px('plinth', 32, (x, r, rnd) => { noise(x, r, r, '#7f8388', 0.07, rnd); x.fillStyle = '#62666b'; for (let k = 0; k < 2; k++) x.fillRect(0, k * 16 + 15, r, 1); x.fillRect(16, 0, 1, 15); x.fillRect(4, 16, 1, 15); x.fillRect(26, 16, 1, 15); });
    hi('win_out', (x, s, rnd) => {
      rect(x, '#f4f6f8', 0, 0, s, s);
      const g = x.createLinearGradient(0, 0, s, s); g.addColorStop(0, '#2c4f7c'); g.addColorStop(0.55, '#3f6fa6'); g.addColorStop(1, '#1f3a5e');
      x.fillStyle = g; x.fillRect(10, 10, s - 20, s - 24);
      x.fillStyle = 'rgba(255,255,255,0.28)'; x.beginPath(); x.moveTo(20, s - 14); x.lineTo(54, 10); x.lineTo(70, 10); x.lineTo(36, s - 14); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.15)'; x.beginPath(); x.moveTo(60, s - 14); x.lineTo(94, 10); x.lineTo(100, 10); x.lineTo(66, s - 14); x.fill();
      rect(x, '#f4f6f8', 0, 46, s, 6); rect(x, '#f4f6f8', s / 2 - 3, 52, 6, s - 66);
      rect(x, '#d9dde2', 4, s - 14, s - 8, 8); rect(x, '#b9bfc6', 4, s - 6, s - 8, 3);
    });
    hi('win_in', (x, s) => {
      rect(x, '#f4f6f8', 0, 0, s, s);
      const g = x.createLinearGradient(0, 10, 0, s - 14); g.addColorStop(0, '#bfe3ff'); g.addColorStop(0.7, '#e9f6ff'); g.addColorStop(1, '#a7d59a');
      x.fillStyle = g; x.fillRect(10, 10, s - 20, s - 24);
      x.fillStyle = '#6aa84f'; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(18 + i * 24, s - 18, 13, 0, Math.PI * 2); x.fill(); }
      rect(x, '#f4f6f8', 0, 46, s, 6); rect(x, '#f4f6f8', s / 2 - 3, 52, 6, s - 66);
      rect(x, '#d9dde2', 4, s - 14, s - 8, 10);
    });
    px('roof', 32, (x, r, rnd) => {
      for (let row = 0; row < 4; row++) {
        const off = row % 2 ? 4 : 0;
        for (let i = -1; i < 4; i++) {
          noise(x, 7, 7, ['#9b4632', '#8d3f2d', '#a54f36'][(i + row) % 3 < 0 ? 0 : (i + row) % 3], 0.06, rnd, i * 8 + off, row * 8);
          x.fillStyle = '#6a2c1f'; x.fillRect(i * 8 + off + 7, row * 8, 1, 8);
        }
        x.fillStyle = '#5a2419'; x.fillRect(0, row * 8 + 7, r, 1);
        x.fillStyle = '#b86549'; x.fillRect(0, row * 8, r, 1);
      }
    });
    variant('roof_snow', 32, (x, r, rnd) => { noise(x, r, r, '#eef3f8', 0.03, rnd); for (let row = 0; row < 4; row++) { x.fillStyle = '#c8d4e2'; x.fillRect(0, row * 8 + 7, r, 1); } for (let i = 0; i < 10; i++) { x.fillStyle = '#9b4632'; x.fillRect(rnd() * r | 0, (rnd() * 4 | 0) * 8 + 6, 3, 1); } });
    px('skylight', 16, (x, r) => { rect(x, '#d8dde3', 0, 0, r, r); rect(x, '#304a6a', 2, 2, r - 4, r - 4); rect(x, '#5f86b3', 3, 3, 3, r - 6); });
    hi('door_out', (x, s) => {
      rect(x, '#ff7a1c', 0, 0, s, s);
      for (const ox of [10, 68]) {
        const g = x.createLinearGradient(0, 0, 0, s); g.addColorStop(0, '#9fc6e6'); g.addColorStop(1, '#5d86ad');
        x.fillStyle = g; x.fillRect(ox, 10, 50, s - 20);
        rect(x, '#ff7a1c', ox, s * 0.45, 50, 6);
        rect(x, '#d9d9d9', ox + (ox < 60 ? 44 : 2), s * 0.5, 4, 18);
      }
      rect(x, '#c95c10', s / 2 - 1, 0, 2, s);
    });
    hi('sign_infis', (x, s) => {
      rect(x, '#fff', 0, 0, s, s); rect(x, '#1b2a44', 0, 0, s, 4); rect(x, '#1b2a44', 0, s - 4, s, 4);
      text(x, 'STŘEDNÍ ŠKOLA', s / 2, 26, 15, '#1b2a44');
      text(x, 'INFORMATIKY', s / 2, 50, 15, '#1b2a44');
      text(x, 'A FINANČNÍCH', s / 2, 74, 15, '#1b2a44');
      text(x, 'SLUŽEB', s / 2, 98, 15, '#1b2a44');
      text(x, 'Plzeň, Klatovská 200 G', s / 2, 117, 9, '#555', 'center', 500);
    });
    hi('logo_infis', (x, s) => {
      rect(x, '#1d4fa0', 0, 0, s, s);
      x.fillStyle = '#fff'; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { if ((i + j) % 3 === 0) continue; x.beginPath(); x.arc(20 + i * 12, 34 + j * 12, 4, 0, 7); x.fill(); }
      text(x, 'INFIS', 92, 64, 34, '#fff');
      rect(x, '#ff7a1c', 0, s - 12, s, 12);
    });

    // interiér
    px('wall_in', 32, (x, r, rnd) => noise(x, r, r, '#f3f1ea', 0.012, rnd));
    variant('wall_castle', 32, (x, r, rnd) => stoneBlocks(x, r, rnd, '#8e8a80'));
    variant('wall_excel', 32, (x, r, rnd) => { rect(x, '#fff', 0, 0, r, r); x.fillStyle = '#c8d3c8'; for (let k = 0; k < r; k += 8) { x.fillRect(k, 0, 1, r); } for (let k = 0; k < r; k += 4) x.fillRect(0, k, r, 1); x.fillStyle = '#21a366'; x.fillRect(8, 8, 8, 4); });
    px('wall_low', 32, (x, r, rnd) => { noise(x, r, r, '#f3f1ea', 0.012, rnd); rect(x, '#9b8a78', 0, r - 3, r, 3); rect(x, '#b8a894', 0, r - 3, r, 1); });
    variant('wall_low_castle', 32, (x, r, rnd) => { stoneBlocks(x, r, rnd, '#6d6a62'); rect(x, '#8a1f1f', 0, 0, r, 3); });
    variant('wall_low_excel', 32, (x, r, rnd) => { rect(x, '#21a366', 0, 0, r, r); x.fillStyle = '#1b7f4f'; for (let k = 0; k < r; k += 8) x.fillRect(k, 0, 1, r); for (let k = 0; k < r; k += 4) x.fillRect(0, k, r, 1); });
    px('floor_lino', 32, (x, r, rnd) => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) noise(x, 8, 8, ['#e6dfd2', '#e1dacc', '#e9e3d7'][(i * 7 + j * 3) % 3], 0.03, rnd, i * 8, j * 8); x.fillStyle = '#bdb5a7'; for (let k = 0; k < 4; k++) { x.fillRect(k * 8 + 7, 0, 1, r); x.fillRect(0, k * 8 + 7, r, 1); } });
    variant('floor_castle', 32, (x, r, rnd) => { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) noise(x, 15, 15, ['#7a766d', '#6f6b63', '#85817a'][(i + j * 2) % 3], 0.08, rnd, i * 16, j * 16); });
    variant('floor_excel', 32, (x, r, rnd) => { rect(x, '#fff', 0, 0, r, r); x.fillStyle = '#b5c7b5'; for (let k = 0; k < r; k += 16) x.fillRect(k, 0, 1, r); for (let k = 0; k < r; k += 8) x.fillRect(0, k, r, 1); });
    px('floor_class', 32, (x, r, rnd) => { noise(x, r, r, '#c9b897', 0.045, rnd); x.fillStyle = '#a99a7c'; x.fillRect(0, r - 1, r, 1); x.fillRect(r - 1, 0, 1, r); });
    px('floor_wood', 32, (x, r, rnd) => {
      for (let j = 0; j < 8; j++) for (let i = 0; i < 2; i++) { const o = (j % 2) * 8; noise(x, 16, 4, ['#a8743f', '#9a6a39', '#b37d47'][(i + j) % 3], 0.05, rnd, i * 16 + o - (o ? 16 : 0), j * 4); }
      for (let j = 0; j < 8; j++) { x.fillStyle = '#7c522b'; x.fillRect(0, j * 4 + 3, r, 1); x.fillRect((j % 2) * 8 + 15, j * 4, 1, 3); }
    });
    px('floor_hall', 32, (x, r, rnd) => { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) noise(x, 11, 11, (i + j) % 2 ? '#ddd5c6' : '#d2c9b8', 0.03, rnd, i * 11, j * 11); x.fillStyle = '#b3aa9a'; for (let k = 0; k < 3; k++) { x.fillRect(k * 11 + 10, 0, 1, r); x.fillRect(0, k * 11 + 10, r, 1); } });
    px('ceiling', 32, (x, r, rnd) => { noise(x, r, r, '#f2f2ee', 0.03, rnd); x.fillStyle = '#c9c9c2'; x.fillRect(0, 15, r, 1); x.fillRect(15, 0, 1, r); x.fillRect(0, 31, r, 1); x.fillRect(31, 0, 1, r); });
    px('ceil_light', 16, (x, r) => { rect(x, '#c9c9c2', 0, 0, r, r); rect(x, '#fffef6', 1, 4, r - 2, 8); x.fillStyle = '#d7d6cc'; for (let k = 2; k < r - 1; k += 2) x.fillRect(k, 4, 1, 8); });
    hi('door_in', (x, s, rnd) => {
      noise(x, 32, 32, '#c8955a', 0.04, rnd); x.drawImage(x.canvas, 0, 0, 32, 32, 0, 0, s, s);
      rect(x, '#a8793f', 0, 0, 6, s); rect(x, '#a8793f', s - 6, 0, 6, s); rect(x, '#a8793f', 0, 0, s, 6);
      rect(x, '#9c6f3a', 46, 16, 36, 60); rect(x, '#cfe6f5', 50, 20, 28, 52); rect(x, 'rgba(255,255,255,0.5)', 54, 24, 4, 40);
      rect(x, '#d8d8d8', 96, 72, 14, 4); rect(x, '#9a9a9a', 96, 76, 4, 10);
    });
    px('orange', 8, (x, r) => rect(x, '#ff7a1c', 0, 0, r, r));
    hi('door_glass', (x, s) => {
      rect(x, '#c69a5e', 0, 0, s, s); rect(x, '#d7eaf6', 14, 12, s - 28, s * 0.55); rect(x, 'rgba(255,255,255,0.55)', 20, 18, 6, s * 0.45);
      rect(x, '#c69a5e', 14, 12 + s * 0.55, s - 28, 6); rect(x, '#b8874c', 0, 0, s, 4); rect(x, '#9a9a9a', s - 24, s * 0.62, 14, 4);
    });
    hi('cork_board', (x, s, rnd) => {
      rect(x, '#1f3fa0', 0, 0, s, s); rect(x, '#f6dc2a', 6, 6, s - 12, s - 12);
      const cols = ['#ffffff', '#dfe8ff', '#7fb0ff', '#ffffff', '#fbe3e3'];
      for (let k = 0; k < 14; k++) { const w = 16 + rnd() * 26 | 0, h = 14 + rnd() * 30 | 0, xx = 10 + rnd() * (s - 20 - w) | 0, yy = 10 + rnd() * (s - 20 - h) | 0; rect(x, 'rgba(0,0,0,0.15)', xx + 2, yy + 2, w, h); rect(x, cols[k % 5], xx, yy, w, h); for (let l = 4; l < h - 3; l += 3) rect(x, '#9aa3b5', xx + 3, yy + l, w - 6 - (l * 7 % 9), 1); }
      for (let k = 0; k < 3; k++) { const xx = 14 + k * 36, yy = 76; rect(x, '#fff', xx, yy, 30, 22); rect(x, ['#c86b4a', '#4a86c8', '#6ab04c'][k], xx + 2, yy + 2, 26, 14); }
      text(x, 'NÁSTĚNKA', s / 2, 16, 11, '#1f3fa0');
    });
    hi('board_firmy', (x, s) => {
      rect(x, '#dfeaff', 0, 0, s, s); rect(x, '#2f5fd0', 0, 0, s, 4); rect(x, '#2f5fd0', 0, s - 4, s, 4);
      rect(x, '#fff', 8, 10, 54, 30); text(x, 'fiktivní', 35, 25, 13, '#222'); rect(x, '#fff', 66, 10, 50, 30); text(x, 'firmy', 91, 25, 14, '#222');
      text(x, 'To jsme my:', 36, 52, 10, '#333', 'center', 500);
      x.save(); x.translate(80, 84); x.rotate(-0.5); text(x, 'INFIS s.r.o.', 0, 0, 16, '#2f5fd0'); x.restore();
      rect(x, '#fff', 10, 66, 40, 50); rect(x, '#8fb0d0', 14, 70, 32, 22); for (let l = 96; l < 112; l += 4) rect(x, '#999', 14, l, 30, 1);
    });
    px('blue', 8, (x, r) => rect(x, '#2a6bd1', 0, 0, r, r));
    px('wood', 32, (x, r, rnd) => { noise(x, r, r, '#c69c6d', 0.05, rnd); x.fillStyle = '#a77f52'; for (let k = 0; k < 4; k++) x.fillRect(0, k * 8 + 7, r, 1); for (let i = 0; i < 12; i++) x.fillRect(rnd() * r | 0, rnd() * r | 0, 3, 1); });
    px('wood_dark', 32, (x, r, rnd) => { noise(x, r, r, '#6e4a2c', 0.06, rnd); x.fillStyle = '#583a21'; for (let k = 0; k < 4; k++) x.fillRect(0, k * 8 + 7, r, 1); });
    px('desk', 32, (x, r, rnd) => { noise(x, r, r, '#e7dcc6', 0.025, rnd); rect(x, '#b9a98b', 0, 0, r, 1); rect(x, '#b9a98b', 0, r - 1, r, 1); });
    px('metal', 16, (x, r, rnd) => { noise(x, r, r, '#9aa1a8', 0.06, rnd); });
    px('plastic', 16, (x, r, rnd) => noise(x, r, r, '#2e3238', 0.06, rnd));
    px('chair', 16, (x, r, rnd) => noise(x, r, r, '#2f6fd0', 0.06, rnd));
    px('fabric', 16, (x, r, rnd) => noise(x, r, r, '#8a3b3b', 0.08, rnd));
    px('green_cloth', 16, (x, r, rnd) => noise(x, r, r, '#2f7a3f', 0.06, rnd));
    px('locker', 32, (x, r, rnd) => {
      noise(x, r, r, '#3f78c4', 0.03, rnd);
      x.fillStyle = '#2e5c99'; x.fillRect(0, 0, 1, r); x.fillRect(r - 1, 0, 1, r); x.fillRect(15, 0, 2, r);
      x.fillStyle = '#244a7d'; for (let k = 0; k < 4; k++) { x.fillRect(4, 3 + k * 2, 8, 1); x.fillRect(20, 3 + k * 2, 8, 1); }
      rect(x, '#d9dde3', 12, 15, 2, 4); rect(x, '#d9dde3', 18, 15, 2, 4);
      rect(x, '#fff', 5, 24, 5, 3); rect(x, '#fff', 21, 24, 5, 3);
    });
    px('locker_orange', 32, (x, r, rnd) => {
      noise(x, r, r, '#ff8a2c', 0.03, rnd);
      x.fillStyle = '#c9661a'; x.fillRect(0, 0, 1, r); x.fillRect(r - 1, 0, 1, r); x.fillRect(15, 0, 2, r);
      for (let k = 0; k < 4; k++) { x.fillRect(4, 3 + k * 2, 8, 1); x.fillRect(20, 3 + k * 2, 8, 1); }
      rect(x, '#eee', 12, 15, 2, 4); rect(x, '#eee', 18, 15, 2, 4);
    });

    // tabule a obrazovky
    const board = (name, bg, frame, lines) => hi(name, (x, s) => {
      rect(x, frame, 0, 0, s, s); rect(x, bg, 4, 4, s - 8, s - 8);
      lines.forEach((l, i) => text(x, l[0], 10, 18 + i * 17, l[2] || 11, l[1], 'left', 600, s - 18));
    });
    board('board_cs', '#f8f8f6', '#9aa0a6', [['class Program {', '#1f4fb3'], [' static void Main()', '#1f4fb3'], [' {', '#1f4fb3'], ['  Console.Write("Ahoj")', '#c22'], ['  // chybí ; !!!', '#2a8a2a'], [' }', '#1f4fb3'], ['}', '#1f4fb3']]);
    board('board_hw', '#f8f8f6', '#9aa0a6', [['1 GB = 1024 MB', '#1f4fb3'], ['= 1 rohlík (cca)', '#c22'], ['CPU ─ RAM ─ GPU', '#333'], ['FPS chodby: 24', '#2a8a2a'], ['DATA NELŽOU.', '#1f4fb3', 14], ['LIDI JO.', '#c22', 14]]);
    board('board_lang', '#f8f8f6', '#9aa0a6', [['Guten Tag =', '#c22'], ['Hello =', '#1f4fb3'], ['Dobrý den =', '#2a8a2a'], ['= ??? (help)', '#333'], ['der / die / das', '#c22'], ['I am be good.', '#1f4fb3']]);
    board('board_eco', '#f8f8f6', '#9aa0a6', [['  MÁ DÁTI │ DAL', '#1f4fb3', 12], ['─────────┼──────', '#333'], ['  rohlík │ 15 Kč', '#333'], ['  naděje │  0 Kč', '#c22'], ['  DPH    │ vždy', '#333'], ['ROZVAHA SEDÍ?', '#2a8a2a', 13]]);
    board('board_math', '#22402f', '#6b4a2b', [['∫ e^x dx = e^x + C', '#f4f4ea'], ['π ≈ 3,14159…', '#f4f4ea'], ['√(maturita) = ?', '#ffe27a'], ['lim x→∞ (stres)', '#f4f4ea'], ['sin²x + cos²x = 1', '#f4f4ea'], ['NIKDY NEKONČÍ.', '#ff8a8a', 13]]);
    board('board_lit', '#22402f', '#6b4a2b', [['K. H. Mácha: Máj', '#f4f4ea'], ['metafora: škola', '#f4f4ea'], ['= vězení?', '#ffe27a'], ['personifikace:', '#f4f4ea'], ['  „lavice pláče“', '#f4f4ea'], ['ROZBOR DO PÁTKU', '#ff8a8a', 13]]);
    hi('screen_code', (x, s, rnd) => {
      rect(x, '#1e1e2e', 0, 0, s, s); rect(x, '#2d2d44', 0, 0, s, 12); text(x, 'Program.cs', 8, 6, 8, '#ccc', 'left', 500);
      const cols = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff'];
      for (let i = 0; i < 9; i++) { let xx = 8 + (i % 3) * 8; const n = 2 + (rnd() * 4 | 0); for (let k = 0; k < n; k++) { const w = 8 + rnd() * 22 | 0; rect(x, cols[(rnd() * 5) | 0], xx, 18 + i * 11, w, 5); xx += w + 4; } }
      rect(x, '#f44', 4, 18 + 4 * 11, 3, 6);
    });
    hi('screen_excel', (x, s) => {
      rect(x, '#fff', 0, 0, s, s); rect(x, '#21a366', 0, 0, s, 14); text(x, 'Sešit1 - Excel', s / 2, 7, 8, '#fff', 'center', 500);
      x.fillStyle = '#d4d4d4'; for (let i = 0; i < 6; i++) x.fillRect(i * 22 + 10, 14, 1, s); for (let j = 0; j < 12; j++) x.fillRect(0, 22 + j * 9, s, 1);
      rect(x, '#e8f5ee', 10, 22, s, 9);
      x.fillStyle = '#21a366'; [30, 50, 22, 70, 44].forEach((h, i) => x.fillRect(80 + i * 8, 120 - h * 0.7, 6, h * 0.7));
    });
    hi('screen_bsod', (x, s) => {
      rect(x, '#1172d8', 0, 0, s, s); text(x, ':(', 14, 26, 30, '#fff', 'left');
      text(x, 'Automat narazil', 12, 60, 11, '#fff', 'left', 500); text(x, 'na problém.', 12, 74, 11, '#fff', 'left', 500);
      text(x, 'DOŠLY_DROBNÉ', 12, 98, 10, '#cfe3ff', 'left', 500); text(x, '0x0000RHLK', 12, 112, 9, '#cfe3ff', 'left', 500);
    });
    hi('screen_edupage', (x, s) => {
      rect(x, '#fff', 0, 0, s, s); rect(x, '#2b7de9', 0, 0, s, 22); text(x, 'EduPage', 10, 11, 12, '#fff', 'left');
      text(x, 'Nové známky: 47', 10, 40, 10, '#c22', 'left', 600); text(x, 'Rozvrh: ano', 10, 58, 10, '#333', 'left', 500);
      text(x, 'Suplování: vždy', 10, 76, 10, '#333', 'left', 500); rect(x, '#2b7de9', 10, 92, 70, 18); text(x, 'PŘIHLÁSIT', 45, 101, 9, '#fff');
    });
    hi('screen_off', (x, s) => { rect(x, '#15181c', 0, 0, s, s); x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(10, 10, 30, s - 20); });
    px('pc_case', 16, (x, r) => { rect(x, '#25282d', 0, 0, r, r); rect(x, '#3a3e45', 2, 2, r - 4, 3); rect(x, '#38e06a', 3, 7, 1, 1); rect(x, '#3a3e45', 2, 10, r - 4, 1); rect(x, '#3a3e45', 2, 12, r - 4, 1); });
    px('keyboard', 16, (x, r) => { rect(x, '#2a2d33', 0, 0, r, r); x.fillStyle = '#4b5059'; for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) x.fillRect(1 + i * 2, 2 + j * 3, 1, 2); });
    px('rack', 32, (x, r, rnd) => {
      rect(x, '#16181c', 0, 0, r, r);
      for (let j = 0; j < 7; j++) { rect(x, '#2b2f36', 2, 2 + j * 4, r - 4, 3); for (let i = 0; i < 5; i++) { x.fillStyle = rnd() < 0.6 ? (rnd() < 0.7 ? '#3cff7a' : '#ffb43c') : '#22262c'; x.fillRect(20 + i * 2, 3 + j * 4, 1, 1); } }
    });
    px('books', 32, (x, r, rnd) => {
      rect(x, '#6e4a2c', 0, 0, r, r);
      for (let row = 0; row < 4; row++) {
        let xx = 1; const y0 = row * 8 + 1;
        while (xx < r - 1) { const w = 1 + (rnd() * 3 | 0), h = 5 + (rnd() * 2 | 0); x.fillStyle = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#ecf0f1', '#34495e'][rnd() * 8 | 0]; x.fillRect(xx, y0 + 7 - h, w, h); if (w > 1) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(xx, y0 + 8 - h, w, 1); } xx += w; }
        rect(x, '#4f331d', 0, row * 8 + 7, r, 1);
      }
    });
    hi('vending', (x, s, rnd) => {
      rect(x, '#c4222b', 0, 0, s, s); rect(x, '#1b1d22', 8, 8, 78, 104);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { x.fillStyle = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#ecf0f1', '#ff7a1c'][(i * 3 + j * 2) % 6]; x.fillRect(14 + i * 14, 14 + j * 19, 8, 14); x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(15 + i * 14, 15 + j * 19, 2, 10); }
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(10, 10, 18, 100);
      rect(x, '#e9e9e9', 94, 14, 26, 14); text(x, '35 Kč', 107, 21, 8, '#111');
      for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) rect(x, '#ddd', 96 + i * 8, 36 + j * 8, 6, 6);
      rect(x, '#111', 98, 76, 18, 4); rect(x, '#111', 14, 114, 66, 8);
      text(x, 'NÁPOJE', 107, 100, 9, '#fff');
    });
    hi('vending_pc', (x, s) => {
      rect(x, '#d8d8d0', 0, 0, s, s); rect(x, '#1172d8', 10, 10, s - 20, 70); text(x, ':(', 20, 30, 22, '#fff', 'left');
      text(x, 'AUTOMAT.EXE', s / 2, 60, 11, '#fff'); rect(x, '#bbb', 10, 90, s - 20, 26); text(x, 'Ctrl+Alt+Del?', s / 2, 103, 10, '#333');
    });
    hi('bufet', (x, s, rnd) => {
      noise(x, 32, 32, '#c69c6d', 0.05, rnd); x.drawImage(x.canvas, 0, 0, 32, 32, 0, 0, s, s);
      rect(x, '#ff7a1c', 0, 0, s, 34); text(x, 'BUFET', s / 2, 18, 22, '#fff');
      text(x, 'rohlík DDR5 … 12 Kč', s / 2, 54, 10, '#3b2410', 'center', 600);
      text(x, 'kafe (síla: C#) … 25 Kč', s / 2, 72, 9, '#3b2410', 'center', 600);
      text(x, 'naděje … VYPRODÁNO', s / 2, 90, 9, '#a31616', 'center', 500);
    });
    hi('trophy', (x, s) => {
      rect(x, '#6e4a2c', 0, 0, s, s); rect(x, '#bcd8ec', 6, 6, s - 12, s - 12);
      for (const [cx, cy, c] of [[30, 40, '#f1c40f'], [64, 40, '#bdc3c7'], [98, 40, '#cd7f32'], [40, 90, '#f1c40f'], [88, 90, '#f1c40f']]) { rect(x, c, cx - 8, cy - 12, 16, 12); rect(x, c, cx - 2, cy, 4, 8); rect(x, c, cx - 7, cy + 8, 14, 4); }
      rect(x, '#6e4a2c', 6, 62, s - 12, 4);
    });

    // plakáty
    const poster = (name, bg, lines, deco) => hi(name, (x, s) => {
      rect(x, '#fff', 0, 0, s, s); rect(x, bg, 4, 4, s - 8, s - 8);
      if (deco) deco(x, s);
      lines.forEach(l => text(x, l[0], s / 2, l[1], l[2], l[3] || '#fff', 'center', 500, s - 14));
    });
    poster('poster_welcome', '#1d4fa0', [['VÍTEJTE', 30, 20], ['NA INFISU!', 54, 20, '#ffcf3f'], ['východ nebyl', 92, 10, '#cfe0ff'], ['nalezen', 106, 10, '#cfe0ff']]);
    poster('poster_run', '#c0392b', [['NEBĚHAT', 36, 20], ['PO CHODBĚ', 60, 16], ['(SHIFT = sprint)', 98, 10, '#ffd9d9']]);
    poster('poster_semicolon', '#f4d03f', [['HLEDÁ SE', 22, 14, '#222'], [';', 66, 60, '#222'], ['odměna: BUILD', 108, 10, '#222']]);
    poster('poster_404', '#2c3e50', [['ŠKOLNÍ ŘÁD', 26, 13], ['čl. 404', 52, 22, '#ff8a8a'], ['Motivace je', 84, 11], ['volitelná.', 100, 11]]);
    poster('poster_excel', '#21a366', [['KROUŽEK', 28, 16], ['EXCELU', 50, 18], ['každý den', 80, 11], ['NAVŽDY', 100, 15, '#ffef8a']]);
    poster('poster_csharp', '#68217a', [['C#', 46, 46], ['> všechno', 96, 14]]);
    poster('poster_maturita', '#111', [['MATURITA', 30, 18, '#ff4d4d'], ['ZA', 56, 14], ['0 DNÍ', 82, 22, '#ffcf3f'], ['panika povolena', 110, 9, '#aaa']]);
    poster('poster_ram', '#0e6655', [['RAM', 36, 30], ['víc je víc', 70, 12], ['(rohlík taky)', 92, 11, '#bff']]);
    poster('poster_map', '#5dade2', [], (x, s) => { x.fillStyle = '#58a75a'; [[20, 30, 30, 20], [60, 26, 40, 30], [30, 64, 20, 40], [80, 70, 30, 20]].forEach(r => x.fillRect(...r)); text(x, 'WORLD', s / 2, 112, 12, '#fff'); });
    poster('poster_tax', '#ecf0f1', [['FINANČNÍ', 28, 14, '#222'], ['ÚŘAD', 48, 16, '#222'], ['TĚ VIDÍ', 72, 16, '#c0392b'], ['přiznání do 1. 4.', 104, 9, '#555']]);
    poster('poster_chart', '#fff', [['MOTIVACE V ČASE', 16, 9, '#222']], (x, s) => { x.strokeStyle = '#c0392b'; x.lineWidth = 4; x.beginPath(); x.moveTo(14, 30); x.lineTo(40, 44); x.lineTo(62, 70); x.lineTo(84, 82); x.lineTo(112, 112); x.stroke(); x.fillStyle = '#222'; x.fillRect(12, 28, 2, 88); x.fillRect(12, 114, 104, 2); });
    poster('poster_janda', '#7b241c', [['ČTI', 34, 26], ['KNIHY.', 62, 20], ['nebo aspoň', 92, 10, '#f5cba7'], ['obaly', 106, 10, '#f5cba7']]);

    // cedule místností (text v horní části vrstvy: v 0..0.3)
    const sign = (name, t, col = '#1d4fa0') => hi(name, (x, s) => { rect(x, col, 0, 0, s, 38); rect(x, '#fff', 3, 3, s - 6, 32); rect(x, col, 5, 5, s - 10, 28); text(x, t, s / 2, 20, 15, '#fff', 'center', 500, s - 16); });
    sign('sign_cs', 'UČEBNA C#', '#68217a'); sign('sign_hw', 'HW LAB'); sign('sign_lang', 'JAZYKOVKA', '#c0392b'); sign('sign_lib', 'KNIHOVNA', '#7b241c');
    sign('sign_excel', 'EXCEL LAB', '#1b7f4f'); sign('sign_eco', 'EKONOMIKA', '#b9770e'); sign('sign_404', 'UČEBNA 404', '#2c3e50'); sign('sign_wc', 'WC', '#555');
    sign('sign_staff', 'SBOROVNA', '#555'); sign('sign_exam', 'MATURITA', '#a31616'); sign('sign_hall', 'VESTIBUL', '#1d4fa0');

    px('flag_cz', 16, (x, r) => { rect(x, '#fff', 0, 0, r, r / 2); rect(x, '#d7141a', 0, r / 2, r, r / 2); x.fillStyle = '#11457e'; x.beginPath(); x.moveTo(0, 0); x.lineTo(r / 2, r / 2); x.lineTo(0, r); x.fill(); });
    px('flag_uk', 16, (x, r) => { rect(x, '#012169', 0, 0, r, r); x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0); x.lineTo(r, r); x.moveTo(r, 0); x.lineTo(0, r); x.stroke(); x.strokeStyle = '#c8102e'; x.lineWidth = 1; x.stroke(); rect(x, '#fff', 6, 0, 4, r); rect(x, '#fff', 0, 6, r, 4); rect(x, '#c8102e', 7, 0, 2, r); rect(x, '#c8102e', 0, 7, r, 2); });
    px('flag_de', 12, (x, r) => { rect(x, '#000', 0, 0, r, 4); rect(x, '#dd0000', 0, 4, r, 4); rect(x, '#ffce00', 0, 8, r, 4); });
    px('flag_excel', 16, (x, r) => { rect(x, '#21a366', 0, 0, r, r); text(x, 'X', 8, 8, 12, '#fff'); });
    hi('clock', (x, s) => { x.clearRect(0, 0, s, s); x.fillStyle = '#222'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.fill(); x.fillStyle = '#222'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillRect(64 + Math.sin(a) * 44 - 2, 64 - Math.cos(a) * 44 - 2, 4, 4); } x.save(); x.translate(64, 64); x.rotate(-0.5); x.fillRect(-2, -34, 4, 34); x.rotate(1.9); x.fillRect(-2, -44, 3, 44); x.restore(); x.fillStyle = '#c00'; x.fillRect(62, 62, 4, 4); });

    // rostliny
    const leaves = (x, r, rnd, cols, holes = 0.12) => { for (let j = 0; j < r; j++) for (let i = 0; i < r; i++) { if (rnd() < holes) continue; x.fillStyle = cols[(rnd() * cols.length) | 0]; x.fillRect(i, j, 1, 1); } };
    px('leaves', 16, (x, r, rnd) => leaves(x, r, rnd, ['#3f7f2e', '#4f9a37', '#356b27', '#5aa840', '#2d5c22']));
    variant('leaves_snow', 16, (x, r, rnd) => leaves(x, r, rnd, ['#eef4fa', '#dfe8f2', '#3f6f2e', '#f7fbff', '#cfdae6']));
    variant('leaves_autumn', 16, (x, r, rnd) => leaves(x, r, rnd, ['#d9822b', '#c4471f', '#e6b13a', '#a8381c', '#f0a640']));
    px('pine', 16, (x, r, rnd) => leaves(x, r, rnd, ['#244d2c', '#2f5f35', '#1d3f24', '#386b3d'], 0.06));
    variant('pine_snow', 16, (x, r, rnd) => leaves(x, r, rnd, ['#244d2c', '#eef4fa', '#dfe8f2', '#2f5f35'], 0.06));
    px('bark', 16, (x, r, rnd) => { noise(x, r, r, '#6b4d33', 0.1, rnd); x.fillStyle = '#4e3826'; for (let i = 0; i < 6; i++) x.fillRect(rnd() * r | 0, 0, 1, r); });
    px('hedge', 16, (x, r, rnd) => leaves(x, r, rnd, ['#3a7a2c', '#468f33', '#2f6524'], 0));
    px('plant', 16, (x, r, rnd) => { x.clearRect(0, 0, r, r); for (let k = 0; k < 7; k++) { const cx = 8 + (rnd() - 0.5) * 10; x.fillStyle = ['#3f9a3a', '#2f7d2c', '#58b84a'][k % 3]; for (let j = 0; j < 12; j++) x.fillRect(cx + Math.sin(j * 0.6 + k) * (j / 4), r - 1 - j, 2, 1); } });
    px('pot', 16, (x, r, rnd) => { noise(x, r, r, '#c0643a', 0.06, rnd); rect(x, '#a34f2b', 0, 0, r, 2); });

    // okolí
    px('panel', 32, (x, r, rnd) => { noise(x, r, r, '#e8e1d0', 0.03, rnd); rect(x, '#bfb6a2', 0, 30, r, 2); rect(x, '#9fb2c4', 7, 8, 18, 14); rect(x, '#fff', 7, 8, 18, 1); rect(x, '#fff', 15, 8, 1, 14); rect(x, '#d0c8b8', 6, 22, 20, 2); });
    px('panel_red', 32, (x, r, rnd) => { noise(x, r, r, '#e8e1d0', 0.03, rnd); rect(x, '#bfb6a2', 0, 30, r, 2); rect(x, '#5a7a96', 7, 8, 18, 14); rect(x, '#fff', 15, 8, 1, 14); rect(x, '#c0492b', 3, 22, 26, 6); });
    px('office', 32, (x, r, rnd) => { noise(x, r, r, '#b9bcc0', 0.03, rnd); rect(x, '#5f7f9f', 0, 8, r, 14); x.fillStyle = '#8fb0cc'; for (let i = 0; i < 4; i++) x.fillRect(i * 8 + 1, 9, 3, 12); rect(x, '#888', 0, 22, r, 2); });
    px('zzs_wall', 32, (x, r, rnd) => { noise(x, r, r, '#f2f2ee', 0.03, rnd); rect(x, '#f2c200', 0, 24, r, 4); rect(x, '#6d8faa', 6, 6, 20, 12); });
    px('garage', 32, (x, r) => { rect(x, '#d8d8d8', 0, 0, r, r); x.fillStyle = '#b8b8b8'; for (let k = 0; k < r; k += 4) x.fillRect(0, k, r, 1); });
    hi('sign_urad', (x, s) => { rect(x, '#1d4fa0', 0, 0, s, 44); text(x, 'ÚŘAD PRÁCE ČR', s / 2, 16, 14, '#fff'); text(x, 'kontaktní pracoviště Plzeň', s / 2, 33, 8, '#cfe0ff', 'center', 500); });
    hi('sign_zzs', (x, s) => { rect(x, '#fff', 0, 0, s, 44); rect(x, '#d7141a', 0, 0, 10, 44); text(x, 'ZDRAVOTNICKÁ', 70, 14, 11, '#d7141a'); text(x, 'ZÁCHRANNÁ SLUŽBA', 70, 30, 10, '#d7141a'); });
    hi('sign_hotel', (x, s) => { rect(x, '#6b2d5c', 0, 0, s, 44); text(x, 'HOTELOVÁ ŠKOLA', s / 2, 22, 13, '#fff'); });
    hi('sign_stop', (x, s) => { rect(x, '#fff', 0, 0, s, s); rect(x, '#1d4fa0', 4, 4, s - 8, 50); text(x, 'BORSKÝ PARK', s / 2, 22, 14, '#fff'); text(x, 'tram 4 · Bory', s / 2, 42, 10, '#cfe0ff', 'center', 500); rect(x, '#ffcf3f', 4, 60, s - 8, 6); text(x, 'další spoj: za 404 s', s / 2, 84, 10, '#222', 'center', 600); });
    hi('sign_park', (x, s) => { rect(x, '#2e6b30', 0, 0, s, 44); text(x, 'BORSKÝ PARK', s / 2, 22, 14, '#fff'); });
    hi('sign_tennis', (x, s) => { rect(x, '#fff', 0, 0, s, 44); text(x, 'TENIS · SLAVIA', s / 2, 22, 12, '#c4643a'); });
    hi('parcelbox', (x, s) => { rect(x, '#8cc63f', 0, 0, s, s); x.fillStyle = '#6fa22f'; for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) { x.fillRect(6 + i * 30, 30 + j * 19, 26, 16); } rect(x, '#222', 0, 0, s, 24); text(x, 'BALÍKOBOX', s / 2, 12, 12, '#8cc63f'); rect(x, '#333', 50, 70, 28, 22); });
    px('glass', 16, (x, r) => { x.clearRect(0, 0, r, r); x.fillStyle = '#d8dde3'; x.fillRect(0, 0, r, 1); x.fillRect(0, r - 1, r, 1); x.fillRect(0, 0, 1, r); x.fillRect(r - 1, 0, 1, r); x.fillStyle = 'rgba(220,240,255,1)'; x.fillRect(3, 10, 1, 1); x.fillRect(4, 9, 1, 1); x.fillRect(5, 8, 1, 1); x.fillRect(9, 6, 1, 1); x.fillRect(10, 5, 1, 1); });
    px('fence', 16, (x, r) => { x.clearRect(0, 0, r, r); x.fillStyle = '#9aa2a8'; for (let i = 0; i < r; i++) { x.fillRect((i) % r, i, 1, 1); x.fillRect((r - 1 - i + 8) % r, i, 1, 1); } x.fillRect(0, 0, r, 1); });
    px('net', 16, (x, r) => { x.clearRect(0, 0, r, r); x.fillStyle = '#eee'; for (let i = 0; i < r; i += 3) { x.fillRect(i, 0, 1, r); x.fillRect(0, i, r, 1); } x.fillRect(0, 0, r, 2); });
    px('rail', 8, (x, r) => { rect(x, '#8c9096', 0, 0, r, r); rect(x, '#c9ced4', 0, 0, r, 2); });
    px('sleeper', 8, (x, r, rnd) => noise(x, r, r, '#6b5a48', 0.1, rnd));
    px('lamp', 8, (x, r) => rect(x, '#fff8dc', 0, 0, r, r));
    px('car_glass', 16, (x, r) => { rect(x, '#24364a', 0, 0, r, r); x.fillStyle = '#4c6a8c'; x.fillRect(2, 2, 2, r - 4); x.fillRect(5, 2, 1, r - 6); });
    px('tire', 16, (x, r) => { rect(x, '#1a1a1a', 0, 0, r, r); x.fillStyle = '#b9bec4'; x.beginPath(); x.arc(8, 8, 4.5, 0, 7); x.fill(); x.fillStyle = '#666'; x.fillRect(7, 7, 2, 2); });
    px('headlight', 8, (x, r) => { rect(x, '#fffbe0', 0, 0, r, r); rect(x, '#d6d0a0', 0, r - 1, r, 1); });
    px('taillight', 8, (x, r) => rect(x, '#d61f2c', 0, 0, r, r));
    hi('plate', (x, s) => { rect(x, '#fff', 0, 0, s, 30); rect(x, '#1d4fa0', 0, 0, 14, 30); text(x, 'CZ', 7, 22, 7, '#fff'); text(x, '4P2 0404', 70, 15, 16, '#111'); });
    hi('tram_side', (x, s) => {
      rect(x, '#e9ecef', 0, 0, s, s); rect(x, '#c4222b', 0, 92, s, 14); rect(x, '#9da3a8', 0, 106, s, 22);
      for (let i = 0; i < 4; i++) { rect(x, '#1f2a36', 6 + i * 31, 26, 25, 52); rect(x, '#3c5470', 8 + i * 31, 28, 6, 48); }
      rect(x, '#c4222b', 0, 8, s, 6); text(x, '4  BORY', 64, 18, 9, '#fff');
    });
    hi('tram_front', (x, s) => { rect(x, '#e9ecef', 0, 0, s, s); rect(x, '#1f2a36', 10, 14, s - 20, 60); rect(x, '#111', 30, 0, 68, 14); text(x, '4 BORY', 64, 7, 10, '#ffb43c'); rect(x, '#c4222b', 0, 92, s, 14); rect(x, '#fffbe0', 12, 80, 18, 8); rect(x, '#fffbe0', s - 30, 80, 18, 8); });
    hi('ambulance', (x, s) => {
      rect(x, '#f6f6f0', 0, 0, s, s);
      for (let i = 0; i < 16; i++) rect(x, i % 2 ? '#f2c200' : '#2a7a3a', i * 8, 70, 8, 10);
      for (let i = 0; i < 16; i++) rect(x, i % 2 ? '#2a7a3a' : '#f2c200', i * 8, 80, 8, 10);
      text(x, 'ZÁCHRANNÁ SLUŽBA', 64, 50, 10, '#d7141a'); rect(x, '#d7141a', 58, 14, 12, 26); rect(x, '#d7141a', 51, 21, 26, 12);
    });

    // speciální světy
    hi('page', (x, s, rnd) => { rect(x, '#f6efdc', 0, 0, s, s); x.fillStyle = '#b9ad90'; for (let j = 0; j < 12; j++) { let xx = 8; while (xx < s - 10) { const w = 4 + rnd() * 16 | 0; x.fillRect(xx, 8 + j * 10, Math.min(w, s - 10 - xx), 2); xx += w + 3; } } });
    px('spines', 32, (x, r, rnd) => { for (let j = 0; j < 8; j++) { x.fillStyle = ['#8e2b2b', '#2b4f8e', '#2b7a3f', '#8e6a2b', '#5a2b8e', '#1f1f1f'][rnd() * 6 | 0]; x.fillRect(0, j * 4, r, 4); x.fillStyle = '#e8d9a8'; x.fillRect(2 + (rnd() * 6 | 0), j * 4 + 1, 10 + (rnd() * 10 | 0), 1); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, j * 4 + 3, r, 1); } });
    px('excel_cell', 16, (x, r) => { rect(x, '#21a366', 0, 0, r, r); rect(x, '#107c41', 0, 0, r, 1); rect(x, '#107c41', 0, 0, 1, r); rect(x, '#185c37', 0, r - 1, r, 1); rect(x, '#185c37', r - 1, 0, 1, r); rect(x, '#e7f6ee', 3, 6, 9, 2); });
    hi('excel_floor', (x, s) => { rect(x, '#ffffff', 0, 0, s, s); x.fillStyle = '#c6d2c6'; for (let k = 0; k <= s; k += 32) x.fillRect(k, 0, 2, s); for (let k = 0; k <= s; k += 16) x.fillRect(0, k, s, 2); });
    hi('excel_logo', (x, s) => { rect(x, '#107c41', 0, 0, s, s); rect(x, '#21a366', 10, 10, s - 20, s - 20); text(x, 'X', s / 2, s / 2 + 4, 80, '#fff'); });
    hi('cyber_floor', (x, s) => { rect(x, '#06100c', 0, 0, s, s); x.fillStyle = '#0f3', x.fillStyle = '#18ff8c'; x.fillRect(0, 0, s, 3); x.fillRect(0, 0, 3, s); x.fillStyle = 'rgba(24,255,140,0.25)'; x.fillRect(0, s / 2, s, 1); x.fillRect(s / 2, 0, 1, s); });
    hi('cyber_wall', (x, s, rnd) => { rect(x, '#050a12', 0, 0, s, s); for (let i = 0; i < 40; i++) { x.fillStyle = rnd() < 0.5 ? '#18ff8c' : '#2a7bff'; x.fillRect(rnd() * s | 0, rnd() * s | 0, 2 + rnd() * 10 | 0, 2); } });
    px('crt', 16, (x, r, rnd) => { noise(x, r, r, '#d9d3c0', 0.04, rnd); rect(x, '#b9b39f', 0, r - 2, r, 2); });
    px('castle_banner', 16, (x, r) => { rect(x, '#b3191f', 0, 0, r, r); x.fillStyle = '#fff'; x.fillRect(6, 3, 4, 2); x.fillRect(5, 5, 6, 4); x.fillRect(6, 9, 2, 3); x.fillRect(9, 9, 2, 3); x.fillRect(10, 2, 2, 2); x.fillStyle = '#f1c40f'; x.fillRect(6, 2, 1, 1); x.fillRect(8, 2, 1, 1); rect(x, '#8a1015', 0, r - 2, r, 2); });
    px('torch', 8, (x, r) => { rect(x, '#5a3a1f', 3, 3, 2, 5); rect(x, '#ffb43c', 2, 0, 4, 3); rect(x, '#fff3a0', 3, 1, 2, 1); });
  }

  function stoneBlocks(x, r, rnd, base) {
    for (let j = 0; j < 4; j++) { const off = j % 2 ? 8 : 0; for (let i = -1; i < 3; i++) noise(x, 15, 7, [base, sh(base, -0.08), sh(base, 0.08)][(i + j + 9) % 3], 0.06, rnd, i * 16 + off, j * 8); }
    x.fillStyle = sh(base, -0.35); for (let j = 0; j < 4; j++) { x.fillRect(0, j * 8 + 7, r, 1); const off = j % 2 ? 8 : 0; for (let i = 0; i < 3; i++) x.fillRect(i * 16 + off + 15, j * 8, 1, 7); }
  }

  function L(name) { const i = names[name]; if (i === undefined) { console.warn('Chybí textura', name); return 0; } return i; }
  function has(name) { return names[name] !== undefined; }
  // výměna obsahu vrstvy (roční období, hrad, Excel...)
  const originals = {};
  function swap(name, variantName) {
    const i = names[name]; if (i === undefined) return;
    if (!originals[name]) originals[name] = layers[i];
    const src = variantName ? (variants[variantName] || originals[variantName] || layers[names[variantName]]) : originals[name];
    if (!src) return;
    GFX.updateLayer(i, src);
  }
  function upload() { GFX.createTexArray(SIZE, layers); }
  return { buildWorld, addCanvas, L, has, swap, upload, variant, cv, noise, rect, text, sh, FONT, SIZE, get count() { return layers.length; } };
})();

// =============================================================
//  SpriteAtlas — 2D atlas pro billboardy (2048×2048, police)
// =============================================================
const Spr = (() => {
  const S = 2048;
  let canvas, ctx, sx = 0, sy = 0, rowH = 0, dirty = true;
  const map = {};
  const FONT = '"Pixelify Sans", "Courier New", monospace';
  function init() {
    canvas = document.createElement('canvas'); canvas.width = canvas.height = S;
    ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  }
  function alloc(w, h) {
    if (sx + w + 2 > S) { sx = 0; sy += rowH + 2; rowH = 0; }
    if (sy + h > S) { console.warn('Atlas plný'); sx = sy = 0; rowH = 0; }
    const r = { x: sx, y: sy, w, h }; sx += w + 2; rowH = Math.max(rowH, h); return r;
  }
  // nakreslí sprite funkcí draw(ctx, w, h) — pixel-art v malém rozlišení, zvětšený `scale`krát
  function make(name, w, h, draw, scale = 4) {
    if (map[name]) return map[name];
    const small = document.createElement('canvas'); small.width = w; small.height = h;
    const sc = small.getContext('2d'); sc.imageSmoothingEnabled = false; draw(sc, w, h);
    const W = w * scale, H = h * scale, r = alloc(W, H);
    ctx.clearRect(r.x, r.y, W, H); ctx.drawImage(small, r.x, r.y, W, H);
    const s = { u0: (r.x + 0.5) / S, v0: (r.y + 0.5) / S, u1: (r.x + W - 0.5) / S, v1: (r.y + H - 0.5) / S, w: W, h: H, aspect: W / H };
    map[name] = s; dirty = true; return s;
  }
  // textová bublina / nápis (ostrý text v plném rozlišení)
  function label(name, txt, o = {}) {
    if (map[name]) return map[name];
    const size = o.size || 28, pad = o.pad === undefined ? 10 : o.pad;
    ctx.font = `500 ${size}px ${FONT}`;
    const tw = Math.ceil(ctx.measureText(txt).width);
    const W = tw + pad * 2 + (o.tail ? 0 : 0), H = size + pad * 2 + (o.tail ? 12 : 0);
    const r = alloc(W, H);
    ctx.clearRect(r.x, r.y, W, H);
    if (o.bg) {
      ctx.fillStyle = o.border || '#000'; ctx.fillRect(r.x, r.y, W, H - (o.tail ? 12 : 0));
      ctx.fillStyle = o.bg; ctx.fillRect(r.x + 4, r.y + 4, W - 8, H - 8 - (o.tail ? 12 : 0));
      if (o.tail) { ctx.fillStyle = o.border || '#000'; ctx.fillRect(r.x + 16, r.y + H - 14, 14, 14); ctx.fillStyle = o.bg; ctx.fillRect(r.x + 20, r.y + H - 14, 6, 8); }
    }
    ctx.font = `500 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (o.stroke) { ctx.lineWidth = 6; ctx.strokeStyle = o.stroke; ctx.strokeText(txt, r.x + W / 2, r.y + pad + size / 2 + 2); }
    ctx.fillStyle = o.color || '#fff'; ctx.fillText(txt, r.x + W / 2, r.y + pad + size / 2 + 2);
    const s = { u0: (r.x + 0.5) / S, v0: (r.y + 0.5) / S, u1: (r.x + W - 0.5) / S, v1: (r.y + H - 0.5) / S, w: W, h: H, aspect: W / H };
    map[name] = s; dirty = true; return s;
  }
  function get(name) { return map[name]; }
  // nahradí sprite obrázkem ve vyšším rozlišení (stejný poměr stran, obsah "contain")
  function replace(name, img, H = 160) {
    const s = map[name]; if (!s) return;
    const W = H, r = alloc(W, H); // ikony jsou čtvercové
    ctx.clearRect(r.x, r.y, W, H);
    const k = Math.min(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
    ctx.imageSmoothingEnabled = true; ctx.drawImage(img, r.x + (W - w) / 2, r.y + (H - h) / 2, w, h); ctx.imageSmoothingEnabled = false;
    Object.assign(s, { u0: (r.x + 0.5) / S, v0: (r.y + 0.5) / S, u1: (r.x + W - 0.5) / S, v1: (r.y + H - 0.5) / S, w: W, h: H, aspect: 1, smooth: true });
    dirty = true;
  }
  function flush() { if (dirty) { GFX.updateAtlas(canvas); dirty = false; } }
  function upload() { GFX.createAtlas(canvas); dirty = false; }

  // --- základní sprity
  function buildBase() {
    const P = (c, col, a, b, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(a, b, w, h); };
    make('px', 2, 2, (c) => P(c, '#fff', 0, 0, 2, 2), 2);
    make('shadow', 32, 32, (c) => { const g = c.createRadialGradient(16, 16, 2, 16, 16, 16); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); }, 2);
    make('ring', 32, 32, (c) => { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(16, 16, 13, 0, 7); c.stroke(); }, 2);
    make('glow', 32, 32, (c) => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); }, 2);
    make('warn', 32, 32, (c) => { c.fillStyle = 'rgba(255,40,40,0.35)'; c.beginPath(); c.arc(16, 16, 15, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,60,60,0.95)'; c.lineWidth = 2; c.beginPath(); c.arc(16, 16, 14, 0, 7); c.stroke(); }, 2);
    make('marker', 9, 12, (c) => { const o = ['....#....', '...###...', '..#####..', '.##!!!##.', '##!!!!!##', '##!!!!!##', '.##!!!##.', '..#####..', '...###...', '....#....', '.........', '.........']; o.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') P(c, '#1d1d1d', i, j); if (ch === '!') P(c, '#ffcf3f', i, j); })); P(c, '#1d1d1d', 4, 3, 1, 3); P(c, '#1d1d1d', 4, 7); }, 6);
    make('semicolon', 8, 14, (c) => { P(c, '#2b2b2b', 2, 1, 4, 4); P(c, '#ffd23f', 3, 2, 2, 2); P(c, '#2b2b2b', 2, 7, 4, 4); P(c, '#ffd23f', 3, 8, 2, 2); P(c, '#2b2b2b', 3, 11, 2, 2); P(c, '#2b2b2b', 2, 12, 2, 2); P(c, '#ffd23f', 3, 10, 1, 2); }, 6);
    make('ram', 16, 6, (c) => { P(c, '#0b5d3b', 0, 0, 16, 5); P(c, '#1a1a1a', 1, 1, 3, 3); P(c, '#1a1a1a', 5, 1, 3, 3); P(c, '#1a1a1a', 9, 1, 3, 3); P(c, '#1a1a1a', 13, 1, 2, 3); P(c, '#e2b13c', 0, 5, 16, 1); P(c, '#0b5d3b', 7, 5, 1, 1); }, 5);
    make('rohlik', 16, 8, (c) => { P(c, '#b8742c', 2, 2, 12, 4); P(c, '#d99a4a', 3, 2, 10, 2); P(c, '#8a5420', 0, 4, 3, 2); P(c, '#8a5420', 13, 4, 3, 2); P(c, '#f1d39a', 5, 3, 1, 1); P(c, '#f1d39a', 9, 3, 1, 1); }, 5);
    make('coin', 10, 10, (c) => { c.fillStyle = '#c9961e'; c.beginPath(); c.arc(5, 5, 5, 0, 7); c.fill(); c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(5, 5, 3.6, 0, 7); c.fill(); P(c, '#c9961e', 4, 3, 2, 4); }, 5);
    make('invoice', 10, 13, (c) => { P(c, '#fff', 0, 0, 10, 13); P(c, '#888', 0, 0, 10, 1); for (let j = 3; j < 11; j += 2) P(c, '#999', 1, j, 6 + (j % 3), 1); P(c, '#d61f2c', 1, 1, 5, 1); P(c, '#d61f2c', 6, 10, 3, 2); }, 5);
    make('floppy', 12, 12, (c) => { P(c, '#ffcc33', 0, 0, 12, 12); P(c, '#fff3c0', 2, 0, 8, 4); P(c, '#c99a1f', 6, 1, 2, 2); P(c, '#fff', 2, 6, 8, 6); P(c, '#c99a1f', 0, 11, 12, 1); }, 5);
    make('cert', 12, 14, (c) => { P(c, '#fff8e0', 0, 0, 12, 14); P(c, '#c9a227', 0, 0, 12, 1); P(c, '#c9a227', 0, 13, 12, 1); P(c, '#1d4fa0', 2, 2, 8, 2); for (let j = 6; j < 10; j += 2) P(c, '#aaa', 2, j, 8, 1); P(c, '#d61f2c', 8, 10, 3, 3); }, 5);
    make('excel', 10, 10, (c) => { P(c, '#107c41', 0, 0, 10, 10); P(c, '#21a366', 1, 1, 8, 8); const X = [[2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [7, 2], [6, 3], [3, 6], [2, 7]]; X.forEach(([a, b]) => P(c, '#fff', a, b)); }, 5);
    make('book', 12, 10, (c) => { P(c, '#8e2b2b', 0, 0, 5, 10); P(c, '#8e2b2b', 7, 0, 5, 10); P(c, '#f6efdc', 5, 1, 2, 9); P(c, '#e8d9a8', 1, 2, 3, 1); P(c, '#e8d9a8', 8, 2, 3, 1); }, 5);
    make('spark', 8, 8, (c) => { P(c, '#7fe7ff', 3, 0, 2, 8); P(c, '#7fe7ff', 0, 3, 8, 2); P(c, '#fff', 3, 3, 2, 2); }, 5);
    make('heart', 7, 6, (c) => { P(c, '#ff4d6d', 1, 0, 2, 1); P(c, '#ff4d6d', 4, 0, 2, 1); P(c, '#ff4d6d', 0, 1, 7, 2); P(c, '#ff4d6d', 1, 3, 5, 1); P(c, '#ff4d6d', 2, 4, 3, 1); P(c, '#ff4d6d', 3, 5, 1, 1); }, 5);
    make('clockbonus', 10, 10, (c) => { c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(5, 5, 5, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(5, 5, 3.5, 0, 7); c.fill(); P(c, '#222', 5, 2, 1, 3); P(c, '#222', 5, 5, 2, 1); }, 5);
    make('portal', 16, 24, (c) => { for (let j = 0; j < 24; j++) for (let i = 0; i < 16; i++) { const dx = (i - 7.5) / 8, dy = (j - 11.5) / 12, d = dx * dx + dy * dy; if (d < 1) { c.fillStyle = d > 0.75 ? '#e6b3ff' : ((i + j) % 3 ? '#8a2be2' : '#b65cff'); c.fillRect(i, j, 1, 1); } } }, 4);
    make('snow', 2, 2, (c) => P(c, '#fff', 0, 0, 2, 2), 2);
    make('rain', 1, 6, (c) => P(c, '#a8c8ff', 0, 0, 1, 6), 2);
    make('leaf', 3, 2, (c) => { P(c, '#d9822b', 0, 0, 3, 2); P(c, '#a8381c', 1, 0, 1, 1); }, 3);
    make('door_float', 10, 16, (c) => { P(c, '#ff7a1c', 0, 0, 10, 16); P(c, '#c8955a', 1, 1, 8, 15); P(c, '#b3d6f2', 3, 3, 4, 4); P(c, '#ddd', 7, 9, 2, 1); }, 6);
    make('bug', 10, 8, (c) => { P(c, '#1f1f1f', 2, 1, 6, 6); P(c, '#d61f2c', 3, 2, 4, 4); P(c, '#1f1f1f', 5, 2, 1, 4); P(c, '#1f1f1f', 0, 2, 2, 1); P(c, '#1f1f1f', 8, 2, 2, 1); P(c, '#1f1f1f', 0, 5, 2, 1); P(c, '#1f1f1f', 8, 5, 2, 1); P(c, '#1f1f1f', 3, 0, 1, 1); P(c, '#1f1f1f', 6, 0, 1, 1); }, 5);
    make('diploma', 16, 12, (c) => { P(c, '#fff8e0', 0, 0, 16, 12); P(c, '#c9a227', 0, 0, 16, 1); P(c, '#c9a227', 0, 11, 16, 1); P(c, '#c9a227', 0, 0, 1, 12); P(c, '#c9a227', 15, 0, 1, 12); P(c, '#1d4fa0', 3, 2, 10, 2); P(c, '#999', 3, 5, 10, 1); P(c, '#999', 3, 7, 7, 1); P(c, '#d61f2c', 11, 7, 3, 3); P(c, '#d61f2c', 12, 10, 1, 2); }, 6);
    make('esd', 8, 8, (c) => { P(c, '#2a7bff', 1, 1, 6, 6); P(c, '#9fe6ff', 2, 2, 4, 4); P(c, '#fff', 3, 3, 2, 2); }, 5);
    // matematické symboly
    for (const s of ['∑', '∫', 'π', '√', '÷', 'x²', '∞', 'sin', '≠', 'Δ']) label('m_' + s, s, { size: 34, color: '#ffe27a', stroke: '#3b2a00', pad: 6 });
    for (const s of ['HELLO', 'GUTEN TAG', 'DOBRÝ DEN', 'WHY ARE YOU RUNNING?', 'ACHTUNG!', 'SORRY', 'DER DIE DAS', 'HOW ARE YOU?', 'TSCHÜSS', 'AHOJ']) label('b_' + s, s, { size: 26, color: '#111', bg: '#fff', border: '#111', tail: true });
    for (const s of ['CS1002: ; expected', 'NullReferenceException', 'StackOverflow', 'IndexOutOfRange', 'error CS0103']) label('e_' + s, s, { size: 22, color: '#fff', bg: '#c0392b', border: '#5a0f0f' });
    for (const s of ['#REF!', '#HODNOTA!', '#DĚLENÍ_NULOU!', '#NÁZEV?', '=SUMA(BOLEST)']) label('x_' + s, s, { size: 26, color: '#fff', bg: '#107c41', border: '#063d20' });
    for (const s of ['MÁŠ CHVILKU?', 'JEN JEDNA OTÁZKA!', 'PÍSEMKA!', 'POČKEJ!', 'DOMÁCÍ ÚKOL?']) label('t_' + s, s, { size: 22, color: '#111', bg: '#ffe27a', border: '#111', tail: true });
    label('tax_big', 'DAŇOVÉ PŘIZNÁNÍ', { size: 30, color: '#111', bg: '#f5f5f0', border: '#d61f2c' });
    label('exit_book', 'KONEC KAPITOLY ►', { size: 28, color: '#fff', bg: '#2e7d32', border: '#0f3d12' });
    label('exit_lang', 'AUSGANG · EXIT · VÝCHOD', { size: 26, color: '#fff', bg: '#1d4fa0', border: '#0a2350' });
    label('build_ok', 'BUILD SUCCESSFUL', { size: 40, color: '#3cff7a', stroke: '#063d20', pad: 8 });
    label('hodnota', '#HODNOTA!', { size: 64, color: '#fff', stroke: '#063d20', pad: 8 });
    label('ram_rohlik', 'ROHLÍK DDR5', { size: 30, color: '#ffd23f', stroke: '#3b2a00', pad: 6 });
  }
  return { init, make, label, get, replace, flush, upload, buildBase, markDirty() { dirty = true; }, get canvas() { return canvas; } };
})();
