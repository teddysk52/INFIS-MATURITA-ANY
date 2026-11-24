'use strict';
// =============================================================
//  world.js — mapa školy INFIS (jedna mapa, která se mění
//  podle ročníku), kolize po dlaždicích a vykreslení.
//  Dlaždice = 16×16 px. Mapa = 64×46 dlaždic.
// =============================================================
const World = (() => {
  const TS = 16, W = 64, H = 46;
  const WALL = 1, FACE = 2, FLOOR = 3, COR = 4, LOBBY = 5, GRASS = 6, PATH = 7, DOOR = 8, BRICK = 9, HEDGE = 10;

  // Místnosti (souřadnice v dlaždicích, vnitřek místnosti)
  const ROOMS = [
    { id: 'csharp', name: 'UČEBNA C#',     x0: 1,  x1: 14, y0: 2,  y1: 11, floor: 'wood',   door: { x: 7, y: 12 },  top: true },
    { id: 'hw',     name: 'HW LAB',        x0: 16, x1: 30, y0: 2,  y1: 11, floor: 'tile',   door: { x: 23, y: 12 }, top: true },
    { id: 'lang',   name: 'JAZYKOVKA',     x0: 32, x1: 46, y0: 2,  y1: 11, floor: 'carpet', door: { x: 39, y: 12 }, top: true },
    { id: 'lib',    name: 'KNIHOVNA',      x0: 48, x1: 62, y0: 2,  y1: 11, floor: 'lib',    door: { x: 55, y: 12 }, top: true },
    { id: 'excel',  name: 'EXCEL LAB',     x0: 1,  x1: 14, y0: 22, y1: 31, floor: 'excel',  door: { x: 7, y: 20 } },
    { id: 'eco',    name: 'EKONOMIKA',     x0: 16, x1: 26, y0: 22, y1: 31, floor: 'eco',    door: { x: 21, y: 20 } },
    { id: 'lobby',  name: 'VSTUPNÍ HALA',  x0: 28, x1: 35, y0: 20, y1: 31, floor: 'lobby' },
    { id: 'r404',   name: 'UČEBNA 404',    x0: 37, x1: 47, y0: 22, y1: 31, floor: 'dust',   door: { x: 41, y: 20 } },
    { id: 'exam',   name: 'MATURITNÍ SÁL', x0: 49, x1: 62, y0: 22, y1: 31, floor: 'hall',   door: { x: 55, y: 20 } },
  ];

  // Nábytek: [typ, x, y, šířka, výška, volby]  (it = id interakce)
  const FURN = [
    // UČEBNA C#
    ['whiteboard', 4, 1, 7, 1, { decor: true, it: 'whiteboard_cs', text: 'Console.WriteLine("Ahoj")' }],
    ['tdesk', 6, 3, 4, 1, { it: 'tdesk' }],
    ['pcdesk', 2, 6, 4, 1], ['pcdesk', 10, 6, 4, 1], ['pcdesk', 2, 9, 4, 1], ['pcdesk', 10, 9, 4, 1],
    ['plant', 1, 2, 1, 1, { it: 'plant' }], ['plant', 14, 2, 1, 1, { it: 'plant' }],
    // HW LAB
    ['rack', 17, 2, 2, 1, { it: 'rack' }], ['rack', 28, 2, 2, 1, { it: 'rack' }],
    ['whiteboard', 21, 1, 6, 1, { decor: true, it: 'whiteboard_hw', text: '1 GB = 1024 MB = 1 rohlík' }],
    ['workbench', 18, 6, 4, 1], ['workbench', 25, 6, 4, 1], ['workbench', 18, 9, 4, 1], ['workbench', 25, 9, 4, 1],
    // JAZYKOVKA
    ['flags', 34, 1, 9, 1, { decor: true, it: 'flags' }],
    ['window', 1, 1, 2, 1, { decor: true, it: 'window' }], ['window', 12, 1, 2, 1, { decor: true, it: 'window' }],
    ['window', 32, 1, 2, 1, { decor: true, it: 'window' }], ['window', 44, 1, 2, 1, { decor: true, it: 'window' }],
    ['tdesk', 37, 3, 4, 1, { it: 'tdesk' }],
    ['desk', 33, 6, 4, 1], ['desk', 42, 6, 4, 1], ['desk', 33, 9, 4, 1], ['desk', 42, 9, 4, 1],
    ['globe', 46, 2, 1, 1, { it: 'globe' }],
    // KNIHOVNA
    ['wallshelf', 48, 1, 15, 1, { decor: true }],
    ['shelf', 49, 3, 5, 1, { it: 'books' }], ['shelf', 57, 3, 5, 1, { it: 'books' }],
    ['shelf', 49, 6, 5, 1, { it: 'books' }], ['shelf', 57, 6, 5, 1, { it: 'books' }],
    ['table', 50, 9, 3, 1, { it: 'books' }], ['table', 58, 9, 3, 1, { it: 'books' }],
    // CHODBA
    ['vending', 13, 14, 1, 1, { it: 'vending' }],
    ['fountain', 47, 14, 1, 1, { it: 'fountain' }],
    ['plant', 1, 14, 1, 1, { it: 'plant' }], ['plant', 62, 14, 1, 1, { it: 'plant' }],
    ['bench', 17, 19, 3, 1, { it: 'bench' }], ['bench', 44, 19, 3, 1, { it: 'bench' }],
    ['trash', 26, 19, 1, 1, { it: 'trash' }],
    ['banner_wall', 28, 13, 5, 1, { decor: true, it: 'banner_wall' }],
    ['clock', 33, 13, 1, 1, { decor: true, it: 'clock' }],
    ['board', 35, 13, 3, 1, { decor: true, it: 'edupage' }],
    ['poster', 4, 13, 1, 1, { decor: true, it: 'poster1', col: '#e05a47' }],
    ['poster', 19, 13, 1, 1, { decor: true, it: 'poster2', col: '#4a8fd6' }],
    ['poster', 26, 13, 1, 1, { decor: true, it: 'poster3', col: '#d6a64a' }],
    ['poster', 44, 13, 1, 1, { decor: true, it: 'poster4', col: '#ffe14d' }],
    ['poster', 60, 13, 1, 1, { decor: true, it: 'poster5', col: '#8a5ad6' }],
    // EXCEL LAB
    ['excelscreen', 3, 21, 10, 1, { decor: true, it: 'excelscreen' }],
    ['pcdesk', 2, 24, 4, 1, { green: true }], ['pcdesk', 10, 24, 4, 1, { green: true }],
    ['pcdesk', 2, 27, 4, 1, { green: true }], ['pcdesk', 10, 27, 4, 1, { green: true }],
    ['printer', 1, 30, 1, 1, { it: 'printer' }],
    // EKONOMIKA
    ['chart', 18, 21, 6, 1, { decor: true, it: 'chart' }],
    ['desk', 17, 24, 3, 1], ['desk', 22, 24, 3, 1], ['desk', 17, 27, 3, 1], ['desk', 22, 27, 3, 1],
    ['safe', 25, 30, 1, 1, { it: 'safe' }],
    // HALA
    ['trophy', 28, 22, 1, 2, { it: 'trophy' }],
    ['kiosk', 35, 23, 1, 1, { it: 'kiosk' }],
    ['plant', 28, 30, 1, 1, { it: 'plant' }], ['plant', 35, 30, 1, 1, { it: 'plant' }],
    // UČEBNA 404
    ['olddesk', 39, 26, 2, 1, { it: 'olddesk' }],
    // MATURITNÍ SÁL
    ['banner', 52, 21, 8, 1, { decor: true }],
    ['committee', 52, 24, 8, 1, { it: 'committee' }],
    ['examchair', 55, 28, 2, 1, { decor: true }],
    // VENKU
    ['tree', 3, 36, 2, 2, { it: 'tree' }], ['tree', 9, 40, 2, 2, { it: 'tree' }], ['tree', 15, 36, 2, 2, { it: 'tree' }],
    ['tree', 20, 41, 2, 2, { it: 'tree' }], ['tree', 41, 40, 2, 2, { it: 'tree' }], ['tree', 47, 36, 2, 2, { it: 'tree' }],
    ['tree', 53, 41, 2, 2, { it: 'tree' }], ['tree', 59, 36, 2, 2, { it: 'tree' }],
    ['infissign', 23, 36, 5, 2, { it: 'sign' }],
    ['bench', 36, 37, 3, 1, { it: 'bench' }],
    ['bikes', 41, 34, 3, 1, { it: 'bikes' }],
    ['flowers', 25, 41, 3, 1, { decor: true, walk: true }], ['flowers', 35, 42, 3, 1, { decor: true, walk: true }],
    ['lamp', 29, 35, 1, 1], ['lamp', 34, 35, 1, 1],
    ['gate', 30, 45, 4, 1, { it: 'gate' }],
  ];

  const THEMES = {
    1: { accent: '#4fae6e', wall: '#efe4cc', wood: '#c4915c', corA: '#e6dfcf', corB: '#d6cdb8', locker: '#5d7fa3', banner: 'VÍTEJTE NA INFISU!', bannerCol: '#2f8a52' },
    2: { accent: '#4a78d0', wall: '#e9e6dc', wood: '#be8a58', corA: '#e3e1d6', corB: '#d0cdc0', locker: '#5a74a8', banner: 'WILLKOMMEN · WELCOME', bannerCol: '#2a4a9a' },
    3: { accent: '#1f8f4f', wall: '#e1ead6', wood: '#b88a5a', corA: '#dfe6d6', corB: '#cbd6c0', locker: '#4f8a6a', banner: '=VÍTEJTE(INFIS)', bannerCol: '#1d7044' },
    4: { accent: '#d23c3c', wall: '#e8d8cc', wood: '#a87a50', corA: '#e0d4cc', corB: '#cdbdb2', locker: '#8a5a5a', banner: 'MATURITA SE BLÍŽÍ', bannerCol: '#a01e1e' },
  };

  let tiles = [], solid = [], floorOf = [];
  let canvas = null, cx = null, curYear = 1;
  let furniture = [], interactables = [], blinkers = [];
  let examLocked = true;
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // ---------------------------------------------------------
  //  Stavba mapy
  // ---------------------------------------------------------
  function build() {
    tiles = []; solid = []; floorOf = [];
    for (let y = 0; y < H; y++) { tiles.push(new Array(W).fill(WALL)); floorOf.push(new Array(W).fill('')); }
    const fill = (x0, y0, x1, y1, t, fk) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (x >= 0 && y >= 0 && x < W && y < H) { tiles[y][x] = t; if (fk) floorOf[y][x] = fk; }
      }
    };
    for (const r of ROOMS) {
      fill(r.x0, r.y0, r.x1, r.y1, r.id === 'lobby' ? LOBBY : FLOOR, r.floor);
      if (r.id !== 'lobby') fill(r.x0, r.y0 - 1, r.x1, r.y0 - 1, FACE);
    }
    fill(1, 13, 62, 13, FACE);
    fill(1, 14, 62, 19, COR, 'cor');
    fill(28, 20, 35, 21, LOBBY, 'lobby');
    fill(0, 33, 63, 33, BRICK);
    fill(1, 34, 62, 44, GRASS, 'grass');
    fill(30, 34, 33, 44, PATH, 'path');
    fill(0, 45, 63, 45, HEDGE); fill(0, 34, 0, 45, HEDGE); fill(63, 34, 63, 45, HEDGE);
    // dveře
    for (const r of ROOMS) if (r.door) fill(r.door.x, r.door.y, r.door.x + 1, r.door.y + 1, DOOR, r.top ? 'cor' : r.floor);
    fill(31, 32, 32, 33, DOOR, 'lobby');

    for (let y = 0; y < H; y++) {
      solid.push([]);
      for (let x = 0; x < W; x++) solid[y].push([WALL, FACE, BRICK, HEDGE].includes(tiles[y][x]));
    }
    furniture = []; interactables = [];
    for (const f of FURN) {
      const [type, x, y, w, h, o = {}] = f;
      const item = { type, x, y, w, h, o };
      furniture.push(item);
      if (!o.decor && !o.walk) for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) solid[yy][xx] = true;
      if (o.it) interactables.push({ id: o.it, x: x * TS, y: y * TS, w: w * TS, h: h * TS, wall: !!o.decor });
    }
    setExamLocked(true);
  }

  function setExamLocked(v) {
    examLocked = v;
    const d = ROOMS.find(r => r.id === 'exam').door;
    for (let y = d.y; y <= d.y + 1; y++) for (let x = d.x; x <= d.x + 1; x++) solid[y][x] = v;
  }

  // ---------------------------------------------------------
  //  Kolize a dotazy
  // ---------------------------------------------------------
  function solidTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
    return solid[ty][tx];
  }
  function rectSolid(x, y, w, h) {
    const x0 = Math.floor(x / TS), x1 = Math.floor((x + w - 0.01) / TS);
    const y0 = Math.floor(y / TS), y1 = Math.floor((y + h - 0.01) / TS);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidTile(tx, ty)) return true;
    return false;
  }
  function roomAt(px, py) {
    const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    for (const r of ROOMS) if (tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1) return r.id;
    if (ty >= 14 && ty <= 19) return 'corridor';
    if (ty >= 34) return 'outside';
    return 'door';
  }
  function room(id) { return ROOMS.find(r => r.id === id); }
  // Náhodné průchozí místo v okolí bodu
  function randomFree(px, py, minD, maxD, tries = 40) {
    for (let i = 0; i < tries; i++) {
      const a = Math.random() * Math.PI * 2, d = U.rand(minD, maxD);
      const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
      if (!rectSolid(x - 6, y - 6, 12, 8)) return { x, y };
    }
    return null;
  }

  // ---------------------------------------------------------
  //  Vykreslení mapy do offscreen canvasu (2× rozlišení)
  // ---------------------------------------------------------
  function P(x, y, w, h, c) { cx.fillStyle = c; cx.fillRect(x, y, w, h); }
  function T(str, x, y, size, col, align = 'center', fam) {
    cx.font = U.font(size, fam, U.needsBig(str) ? 30 / RS.s : 0); cx.textAlign = align; cx.textBaseline = 'top'; cx.fillStyle = col; cx.fillText(str, x, y);
  }

  function drawFloor(kind, x, y, tx, ty, th) {
    switch (kind) {
      case 'wood': case 'eco': case 'hall': case 'dust': {
        const base = kind === 'wood' ? th.wood : kind === 'eco' ? U.shade(th.wood, -0.12) : kind === 'hall' ? '#6b4a32' : '#8d806e';
        for (let k = 0; k < 4; k++) {
          const h = (tx * 7 + ty * 13 + k * 5 + ((tx >> 1) * 3)) % 4;
          const tone = U.shade(base, [-0.05, 0, 0.04, -0.02][h]);
          P(x, y + k * 4, 16, 3, tone);
          P(x, y + k * 4 + 3, 16, 1, U.shade(base, -0.2));
          const sx = ((ty * 4 + k) * 7 + tx * 5) % 16;
          P(x + sx, y + k * 4, 1, 3, U.shade(base, -0.16));
          P(x + (sx + 1) % 16, y + k * 4, 2, 1, U.shade(tone, 0.07));
        }
        if (kind === 'dust') { for (let i = 0; i < 3; i++) P(x + ((rnd() * 15) | 0), y + ((rnd() * 15) | 0), 1, 1, '#b9ad9a'); if (rnd() < 0.08) P(x + 2, y + 6, 9, 1, '#5d5446'); }
        if (kind === 'hall' && (tx + ty) % 2 === 0) P(x + 7, y + 7, 2, 2, '#7a573c');
        break;
      }
      case 'tile': {
        P(x, y, 16, 16, '#c3c8ce'); P(x, y, 16, 1, '#a9afb6'); P(x, y, 1, 16, '#a9afb6'); P(x + 8, y, 1, 16, '#b4bac1'); P(x, y + 8, 16, 1, '#b4bac1');
        if (rnd() < 0.08) P(x + 2, y + 12, 10, 1, '#3a6a3a');
        break;
      }
      case 'carpet': { P(x, y, 16, 16, '#6e5a9e'); for (let i = 0; i < 3; i++) P(x + ((rnd() * 15) | 0), y + ((rnd() * 15) | 0), 1, 1, '#7d69ad'); break; }
      case 'lib': { P(x, y, 16, 16, '#7d3434'); if ((tx + ty) % 2) P(x + 6, y + 6, 4, 4, '#8a3e3e'); P(x, y + 15, 16, 1, '#6e2c2c'); break; }
      case 'excel': { P(x, y, 16, 16, '#61788a'); P(x, y, 16, 1, '#6c8496'); P(x, y, 1, 16, '#6c8496'); if (rnd() < 0.2) P(x + 5, y + 9, 1, 1, '#7690a3'); break; }
      case 'cor': {
        const a = (tx + ty) % 2 ? th.corA : th.corB;
        P(x, y, 16, 16, a); P(x, y, 16, 1, U.shade(a, 0.15)); P(x, y, 1, 16, U.shade(a, 0.1)); P(x, y + 15, 16, 1, U.shade(a, -0.1));
        break;
      }
      case 'lobby': {
        P(x, y, 16, 16, '#dad5cc'); P(x, y, 16, 1, '#e8e4dc'); P(x, y + 15, 16, 1, '#c6c0b6');
        if (rnd() < 0.3) P(x + ((rnd() * 10) | 0), y + ((rnd() * 14) | 0), 5, 1, '#c9c3ba');
        break;
      }
      case 'grass': {
        P(x, y, 16, 16, '#5c9e48');
        if ((tx + ty) % 2) P(x, y, 16, 16, '#5a9a46');
        const h = (tx * 31 + ty * 17) % 7;
        P(x + 3 + h, y + 4, 1, 2, '#4c8a3c'); P(x + 4 + h, y + 3, 1, 2, '#6fb457');
        P(x + 10 - h, y + 11, 1, 2, '#4c8a3c'); P(x + 11 - h, y + 10, 1, 2, '#6fb457');
        if (h === 3 && (tx + ty * 3) % 5 === 0) { P(x + 7, y + 7, 2, 2, ['#ffe14d', '#ff8ad8', '#ffffff'][(tx + ty) % 3]); P(x + 7, y + 9, 1, 1, '#3f7a33'); }
        break;
      }
      case 'path': { P(x, y, 16, 16, '#b9b2a2'); P(x, y, 16, 1, '#9a9282'); P(x, y + 8, 16, 1, '#9a9282'); P(x + ((ty % 2) ? 4 : 12), y, 1, 8, '#9a9282'); P(x + ((ty % 2) ? 12 : 4), y + 8, 1, 8, '#9a9282'); break; }
      default: P(x, y, 16, 16, '#888');
    }
  }

  function drawTile(tx, ty, th) {
    const t = tiles[ty][tx], x = tx * TS, y = ty * TS;
    switch (t) {
      case WALL: {
        P(x, y, 16, 16, '#3b3150');
        P(x, y, 16, 1, '#4f4468');
        const below = ty + 1 < H ? tiles[ty + 1][tx] : WALL;
        if (below !== WALL && below !== FACE && below !== BRICK) P(x, y + 14, 16, 2, '#2a2238');
        break;
      }
      case FACE: {
        P(x, y, 16, 16, th.wall); P(x, y, 16, 2, U.shade(th.wall, -0.28)); P(x, y + 2, 16, 1, U.shade(th.wall, -0.1));
        P(x, y + 9, 16, 2, th.accent); P(x, y + 12, 16, 1, '#7a6250'); P(x, y + 13, 16, 3, '#5a4636');
        break;
      }
      case BRICK: {
        P(x, y, 16, 16, '#a0523d');
        for (let r = 0; r < 4; r++) { P(x, y + r * 4 + 3, 16, 1, '#7a3d2d'); P(x + (r % 2 ? 4 : 12), y + r * 4, 1, 3, '#7a3d2d'); }
        if (tx % 4 === 1 && Math.abs(tx - 31.5) > 4) { P(x + 1, y + 2, 14, 10, '#5a3a2a'); P(x + 2, y + 3, 12, 8, '#8fc6dc'); P(x + 7, y + 3, 1, 8, '#5a3a2a'); P(x + 2, y + 3, 5, 2, '#c9e8f2'); }
        break;
      }
      case HEDGE: {
        P(x, y, 16, 16, '#2f6b33');
        for (let i = 0; i < 5; i++) P(x + ((rnd() * 13) | 0), y + ((rnd() * 13) | 0), 3, 3, rnd() < 0.5 ? '#3f8a43' : '#285c2b');
        break;
      }
      case DOOR: {
        drawFloor(floorOf[ty][tx] || 'cor', x, y, tx, ty, th);
        const leftEdge = tiles[ty][tx - 1] !== DOOR;
        if (leftEdge) { P(x, y, 3, 16, '#6b4226'); P(x, y, 1, 16, '#4a2d18'); }
        else { P(x + 13, y, 3, 16, '#6b4226'); P(x + 15, y, 1, 16, '#4a2d18'); }
        break;
      }
      default:
        drawFloor(floorOf[ty][tx], x, y, tx, ty, th);
    }
  }

  // jednotlivé kusy nábytku
  function desk(x, y, w, col = '#9b6b3c') {
    P(x + 1, y + 1, w - 2, 9, col); P(x + 1, y + 1, w - 2, 1, U.shade(col, 0.25));
    P(x + 1, y + 10, w - 2, 3, U.shade(col, -0.35));
    P(x + 2, y + 13, 2, 3, '#3b2a1c'); P(x + w - 4, y + 13, 2, 3, '#3b2a1c');
  }
  function chairs(x, y, w) {
    for (let i = 0; i < w / 16; i++) { const c = x + i * 16 + 4; P(c, y + 17, 8, 5, '#3e4c6e'); P(c, y + 17, 8, 1, '#566690'); }
  }
  function drawFurn(f, th) {
    const x = f.x * TS, y = f.y * TS, w = f.w * TS, h = f.h * TS, o = f.o;
    switch (f.type) {
      case 'whiteboard':
        P(x + 3, y + 1, w - 6, 11, '#7d828c'); P(x + 4, y + 2, w - 8, 9, '#f5f7fa'); P(x + 4, y + 11, w - 8, 1, '#5d626b');
        if (o.text) T(o.text, x + w / 2, y + 2, 6, '#2a4ab0');
        P(x + 8, y + 9, w - 30, 1, '#d13a3a');
        break;
      case 'tdesk': desk(x, y, w, '#7a4a2a'); P(x + 6, y + 3, 9, 5, '#ffffff'); P(x + 8, y + 2, 9, 5, '#f0f0e8'); P(x + w - 10, y + 2, 4, 4, '#d33'); P(x + w - 9, y + 2, 2, 1, '#6b3e1e'); break;
      case 'desk': desk(x, y, w); chairs(x, y, w); P(x + 5, y + 3, 6, 4, '#fff'); break;
      case 'pcdesk': {
        desk(x, y, w, o.green ? '#8a7a6a' : '#9b6b3c'); chairs(x, y, w);
        for (let i = 0; i < w / 16; i++) {
          const mx = x + i * 16;
          P(mx + 2, y - 5, 12, 9, '#1d1d24'); P(mx + 3, y - 4, 10, 6, o.green ? '#1d7044' : '#2d6cdf');
          P(mx + 4, y - 3, 5, 1, o.green ? '#bff0cf' : '#9fe0ff'); P(mx + 4, y - 1, 7, 1, o.green ? '#e9f5ec' : '#ffd98a');
          P(mx + 7, y + 4, 2, 2, '#333'); P(mx + 3, y + 6, 10, 2, '#d9d9d9');
        }
        break;
      }
      case 'rack':
        P(x + 1, y - 14, w - 2, 28, '#22222a'); P(x + 1, y - 14, w - 2, 1, '#44444f');
        for (let i = 0; i < 5; i++) { P(x + 3, y - 12 + i * 5, w - 6, 3, '#34343f'); blinkers.push({ x: x + w - 7, y: y - 11 + i * 5, c: i % 2 ? '#3f3' : '#4af' }); }
        break;
      case 'workbench':
        desk(x, y, w, '#8d939c');
        P(x + 4, y + 2, 12, 7, '#2e8b57'); P(x + 6, y + 4, 3, 3, '#222'); P(x + 11, y + 3, 4, 2, '#d4af37');
        P(x + w - 18, y + 3, 12, 5, '#555'); P(x + w - 16, y + 4, 8, 3, '#888');
        chairs(x, y, w);
        break;
      case 'window': {
        const sky = { 1: ['#bfe3ff', '#ffe8c4'], 2: ['#8fd0ff', '#d8f0ff'], 3: ['#b7c4c8', '#dfe6e6'], 4: ['#ff9a5a', '#ffd37a'] }[curYear] || ['#8fd0ff', '#d8f0ff'];
        P(x + 2, y, w - 4, 13, '#4a3a30');
        const gr = cx.createLinearGradient(0, y + 1, 0, y + 12); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]);
        cx.fillStyle = gr; cx.fillRect(x + 3, y + 1, w - 6, 11);
        P(x + w / 2 - 0.5, y + 1, 1, 11, '#4a3a30'); P(x + 3, y + 6, w - 6, 1, '#4a3a30');
        P(x + 4, y + 2, 3, 1, 'rgba(255,255,255,0.7)'); P(x + w / 2 + 2, y + 2, 2, 1, 'rgba(255,255,255,0.5)');
        P(x + 1, y + 12, w - 2, 2, '#d8cfc0');
        break;
      }
      case 'flags': {
        const fx = [x + 6, x + 56, x + 106];
        // CZ
        P(fx[0], y + 1, 18, 10, '#222'); P(fx[0] + 1, y + 2, 16, 4, '#fff'); P(fx[0] + 1, y + 6, 16, 4, '#d7141a'); P(fx[0] + 1, y + 2, 4, 8, '#11457e'); P(fx[0] + 5, y + 4, 2, 4, '#11457e');
        // UK (zjednodušeně)
        P(fx[1], y + 1, 18, 10, '#222'); P(fx[1] + 1, y + 2, 16, 8, '#012169'); P(fx[1] + 1, y + 5, 16, 2, '#fff'); P(fx[1] + 8, y + 2, 2, 8, '#fff'); P(fx[1] + 1, y + 5, 16, 1, '#c8102e'); P(fx[1] + 8, y + 2, 1, 8, '#c8102e');
        // DE
        P(fx[2], y + 1, 18, 10, '#222'); P(fx[2] + 1, y + 2, 16, 3, '#000'); P(fx[2] + 1, y + 5, 16, 3, '#dd0000'); P(fx[2] + 1, y + 8, 16, 2, '#ffce00');
        break;
      }
      case 'globe': P(x + 6, y + 10, 4, 4, '#6b4226'); P(x + 3, y - 2, 10, 10, '#1f6fb2'); P(x + 5, y, 3, 3, '#3fae5a'); P(x + 9, y + 3, 2, 3, '#3fae5a'); P(x + 7, y + 8, 2, 3, '#555'); break;
      case 'wallshelf':
        P(x, y, w, 14, '#5a3820');
        for (let bx = x + 2; bx < x + w - 2; bx += 3) P(bx, y + 3 + ((rnd() * 3) | 0), 2, 9, U.pick(['#c0392b', '#2e86de', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#ecf0f1']));
        break;
      case 'shelf':
        P(x, y - 8, w, 22, '#6b4226'); P(x, y - 8, w, 2, '#835430'); P(x, y + 3, w, 2, '#4a2d18');
        for (let bx = x + 2; bx < x + w - 2; bx += 3) {
          P(bx, y - 5 + ((rnd() * 3) | 0), 2, 8, U.pick(['#c0392b', '#2e86de', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#ecf0f1']));
          P(bx, y + 6 + ((rnd() * 2) | 0), 2, 7, U.pick(['#c0392b', '#2e86de', '#27ae60', '#f1c40f', '#8e44ad', '#16a085']));
        }
        break;
      case 'table': desk(x, y, w, '#7a5232'); P(x + 6, y + 3, 8, 5, '#f3ead2'); P(x + w - 12, y - 4, 2, 8, '#333'); P(x + w - 15, y - 6, 8, 3, '#2e8b57'); break;
      case 'vending':
        P(x + 1, y - 15, 14, 29, '#a8281f'); P(x + 2, y - 14, 12, 27, '#c0392b'); P(x + 2, y - 14, 12, 2, '#e74c3c');
        P(x + 3, y - 11, 8, 16, '#a8d8ea');
        for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) P(x + 4 + c * 3, y - 10 + r * 4, 2, 2, U.pick(['#f1c40f', '#e67e22', '#27ae60', '#ecf0f1', '#8e44ad']));
        P(x + 12, y - 8, 1, 6, '#222'); P(x + 4, y + 7, 7, 3, '#222');
        break;
      case 'fountain': P(x + 2, y - 2, 12, 12, '#9aa2ad'); P(x + 3, y - 1, 10, 9, '#b8c0ca'); P(x + 5, y + 1, 6, 5, '#7fc8ee'); P(x + 7, y - 4, 2, 4, '#666'); P(x + 6, y + 10, 4, 4, '#777'); break;
      case 'plant':
        P(x + 4, y + 6, 8, 8, '#b5651d'); P(x + 3, y + 5, 10, 2, '#d27d2c');
        P(x + 2, y - 4, 5, 9, '#2f8f46'); P(x + 9, y - 6, 5, 11, '#2f8f46'); P(x + 6, y - 10, 4, 15, '#3fb35a'); P(x + 3, y - 2, 2, 3, '#4fc46a'); P(x + 10, y - 4, 2, 3, '#4fc46a');
        break;
      case 'bench':
        P(x + 1, y + 3, w - 2, 3, '#a0703c'); P(x + 1, y + 7, w - 2, 3, '#a0703c'); P(x + 1, y + 3, w - 2, 1, '#c08a50');
        P(x + 3, y + 10, 2, 4, '#444'); P(x + w - 5, y + 10, 2, 4, '#444');
        break;
      case 'trash': P(x + 4, y + 1, 8, 12, '#7d8590'); P(x + 3, y, 10, 2, '#9aa2ad'); P(x + 6, y - 2, 4, 3, '#f3ead2'); P(x + 5, y + 4, 1, 7, '#6a717b'); P(x + 9, y + 4, 1, 7, '#6a717b'); break;
      case 'banner_wall':
        P(x + 2, y + 1, w - 4, 8, th.bannerCol); P(x + 2, y + 1, w - 4, 1, U.shade(th.bannerCol, 0.3));
        T(th.banner, x + w / 2, y + 1, 7, '#ffffff');
        break;
      case 'clock':
        P(x + 3, y + 1, 10, 10, '#222'); P(x + 4, y + 2, 8, 8, '#fff'); P(x + 7, y + 3, 1, 4, '#222'); P(x + 7, y + 6, 3, 1, '#c00');
        break;
      case 'board':
        P(x + 2, y, w - 4, 12, '#5a3820'); P(x + 3, y + 1, w - 6, 10, '#c08a50');
        for (let i = 0; i < 6; i++) P(x + 5 + i * 7, y + 2 + (i % 2) * 2, 5, 6, i === 2 ? '#bff0cf' : i === 4 ? '#ffe9a0' : '#ffffff');
        for (let i = 0; i < 6; i++) P(x + 7 + i * 7, y + 2 + (i % 2) * 2, 1, 1, '#d00');
        T('EDUPAGE', x + w / 2, y - 1, 5, '#1d3557');
        break;
      case 'poster':
        P(x + 3, y + 1, 10, 11, '#222'); P(x + 4, y + 2, 8, 9, o.col);
        P(x + 5, y + 4, 6, 1, '#fff'); P(x + 5, y + 6, 4, 1, '#fff'); P(x + 5, y + 8, 5, 1, 'rgba(255,255,255,0.6)');
        break;
      case 'excelscreen':
        P(x + 2, y, w - 4, 14, '#222'); P(x + 3, y + 1, w - 6, 12, '#ffffff'); P(x + 3, y + 1, w - 6, 3, '#1d7044');
        for (let i = 0; i < 12; i++) P(x + 3 + i * 13, y + 4, 1, 9, '#bfd9c6');
        for (let j = 0; j < 3; j++) P(x + 3, y + 6 + j * 3, w - 6, 1, '#bfd9c6');
        T('SEŠIT1.XLSX — HODNOCENÍ STUDENTŮ', x + w / 2, y, 5, '#ffffff');
        break;
      case 'chart':
        P(x + 2, y, w - 4, 13, '#fff'); P(x + 2, y, w - 4, 1, '#999');
        for (let i = 0; i < 6; i++) P(x + 8 + i * 12, y + 3 + i * 1.5, 7, 9 - i * 1.5, i < 3 ? '#27ae60' : '#c0392b');
        T('MOTIVACE', x + w / 2, y - 1, 5, '#333');
        break;
      case 'printer': P(x + 1, y + 1, 14, 11, '#d0d0d0'); P(x + 3, y - 2, 10, 4, '#fff'); P(x + 3, y + 8, 10, 2, '#555'); P(x + 11, y + 3, 2, 2, '#c00'); break;
      case 'safe': P(x + 1, y - 3, 14, 17, '#3a3f48'); P(x + 2, y - 2, 12, 15, '#4a4f58'); P(x + 5, y + 2, 6, 6, '#c0c0c0'); P(x + 7, y + 4, 2, 2, '#333'); P(x + 12, y + 3, 1, 4, '#999'); break;
      case 'trophy':
        P(x + 1, y - 10, 14, 42, '#5a3820'); P(x + 3, y - 8, 10, 37, '#bfe3ef');
        for (let i = 0; i < 3; i++) { P(x + 5, y - 5 + i * 12, 6, 4, '#ffd84a'); P(x + 7, y - 1 + i * 12, 2, 3, '#e0a800'); P(x + 5, y + 2 + i * 12, 6, 1, '#7a4a1a'); P(x + 3, y + 3 + i * 12, 10, 1, '#5a3820'); }
        break;
      case 'kiosk': P(x + 4, y - 8, 8, 20, '#2a2a33'); P(x + 5, y - 7, 6, 7, '#4aa3ff'); P(x + 6, y - 6, 4, 1, '#fff'); P(x + 3, y + 10, 10, 3, '#444'); break;
      case 'olddesk': desk(x, y, w, '#7d6a55'); for (let i = 0; i < 6; i++) P(x + ((rnd() * (w - 4)) | 0) + 2, y + 2 + ((rnd() * 6) | 0), 1, 1, '#b9ad9a'); T('∫ dx', x + w / 2, y + 2, 5, '#4a3e30'); break;
      case 'committee':
        for (let i = 0; i < 3; i++) { const c = x + 18 + i * 36; P(c, y - 14, 12, 12, '#3a2414'); P(c + 1, y - 13, 10, 3, '#5a3820'); }
        P(x, y - 2, w, 12, '#1f6b3a'); P(x, y - 2, w, 2, '#2e8a50'); P(x, y + 10, w, 4, '#17552d');
        for (let i = 0; i < 4; i++) P(x + 10 + i * 30, y + 1, 10, 6, '#ffffff');
        P(x + w / 2 - 2, y - 6, 4, 6, '#88c'); // váza
        break;
      case 'banner':
        P(x + 4, y, w - 8, 12, '#b0242c'); P(x + 4, y, w - 8, 1, '#d84a52');
        T('MATURITA', x + w / 2, y + 1, 9, '#ffd84a', 'center', 'Silkscreen');
        break;
      case 'examchair': P(x + 12, y + 2, 9, 10, '#5a3a22'); P(x + 12, y + 2, 9, 3, '#7a5232'); P(x + 13, y + 12, 2, 3, '#333'); P(x + 18, y + 12, 2, 3, '#333'); break;
      case 'tree':
        P(x + 4, y + 26, 24, 5, 'rgba(0,0,0,0.2)');
        P(x + 13, y + 16, 6, 13, '#6b4423'); P(x + 13, y + 16, 2, 13, '#7d5430');
        P(x + 4, y - 6, 24, 24, '#2f7d32'); P(x + 1, y - 2, 30, 16, '#2f7d32'); P(x + 8, y - 10, 16, 6, '#2f7d32');
        P(x + 7, y - 6, 8, 6, '#43a047'); P(x + 17, y - 2, 7, 5, '#43a047'); P(x + 5, y + 5, 6, 4, '#43a047'); P(x + 20, y + 8, 6, 4, '#256628'); P(x + 10, y + 10, 8, 4, '#256628');
        break;
      case 'infissign':
        P(x + 8, y + 14, 4, 16, '#555'); P(x + w - 12, y + 14, 4, 16, '#555');
        P(x + 1, y - 6, w - 2, 24, '#0f1b33'); P(x + 2, y - 5, w - 4, 22, '#1d3557'); P(x + 2, y - 5, w - 4, 2, '#2c4a73');
        T('INFIS', x + w / 2, y - 4, 12, '#ffffff', 'center', 'Silkscreen');
        T('střední škola · maturita any%', x + w / 2, y + 9, 5, '#9fd3ff');
        break;
      case 'bikes':
        P(x + 2, y + 6, w - 4, 2, '#888');
        for (let i = 0; i < 3; i++) { const b = x + 4 + i * 15; P(b, y + 2, 4, 4, '#222'); P(b + 7, y + 2, 4, 4, '#222'); P(b + 2, y + 1, 8, 1, U.pick(['#c0392b', '#2e86de', '#f1c40f'])); }
        break;
      case 'flowers':
        P(x, y + 4, w, 9, '#6b4423');
        for (let i = 0; i < 14; i++) P(x + 2 + ((rnd() * (w - 5)) | 0), y + 4 + ((rnd() * 7) | 0), 2, 2, U.pick(['#ff5a5a', '#ffe14d', '#ff8ad8', '#ffffff', '#c86bff']));
        break;
      case 'lamp': P(x + 7, y - 18, 2, 30, '#333'); P(x + 4, y - 21, 8, 4, '#444'); P(x + 5, y - 17, 6, 1, '#ffe9a0'); P(x + 5, y + 11, 6, 3, '#333'); break;
      case 'gate':
        P(x, y, w, 16, '#2f6b33');
        P(x + 2, y + 2, w - 4, 2, '#333'); P(x + 2, y + 11, w - 4, 2, '#333');
        for (let i = 0; i < 15; i++) { P(x + 3 + i * 4, y, 2, 15, '#3a3a3a'); P(x + 3 + i * 4, y - 1, 2, 1, '#ffd23f'); }
        break;
    }
  }

  function drawYearDeco(th) {
    // cedulky s názvy učeben
    for (const r of ROOMS) {
      if (!r.door) continue;
      const px = (r.door.x - 3) * TS + 2, py = r.top ? 13 * TS + 1 : 20 * TS + 3;
      cx.font = U.font(6, undefined, U.needsBig(r.name) ? 30 / RS.s : 0);
      const pw = Math.max(44, Math.ceil(cx.measureText(r.name).width) + 8);
      P(px, py - 1, pw, 11, '#14121c'); P(px + 0.5, py - 0.5, pw - 1, 10, '#262433');
      T(r.name, px + pw / 2, py, 6, '#ffe9a0');
    }
    // skříňky na chodbě
    const busy = new Set();
    for (const f of furniture) if (f.y === 13) for (let i = f.x; i < f.x + f.w; i++) busy.add(i);
    for (const r of ROOMS) if (r.door && r.top) { [r.door.x - 3, r.door.x - 2, r.door.x - 1, r.door.x, r.door.x + 1].forEach(i => busy.add(i)); }
    for (let tx = 1; tx <= 62; tx++) {
      if (busy.has(tx) || tiles[13][tx] !== FACE) continue;
      const x = tx * TS, y = 13 * TS;
      P(x + 1, y + 1, 14, 12, U.shade(th.locker, -0.3)); P(x + 2, y + 1, 12, 11, th.locker);
      P(x + 8, y + 1, 1, 11, U.shade(th.locker, -0.3));
      for (let v = 0; v < 2; v++) { P(x + 3, y + 3 + v * 2, 4, 1, U.shade(th.locker, -0.25)); P(x + 10, y + 3 + v * 2, 3, 1, U.shade(th.locker, -0.25)); }
      P(x + 6, y + 7, 1, 2, '#ddd'); P(x + 10, y + 7, 1, 2, '#ddd');
    }
    // červený koberec v hale + logo
    for (let ty = 20; ty <= 33; ty++) { P(31 * TS + 2, ty * TS, 28, 16, '#a3282e'); P(31 * TS + 2, ty * TS, 2, 16, '#ffd23f'); P(33 * TS - 4, ty * TS, 2, 16, '#ffd23f'); }
    T('INFIS', 32 * TS, 27 * TS + 2, 10, 'rgba(255,233,160,0.85)', 'center', 'Silkscreen');
    // pavučiny v učebně 404
    const rr = room('r404');
    const web = (x, y, sx, sy) => { for (let i = 0; i < 8; i++) { P(x + i * sx, y, 1, 1, '#cfcfcf'); P(x, y + i * sy, 1, 1, '#cfcfcf'); P(x + i * sx * 0.7, y + i * sy * 0.7, 1, 1, '#cfcfcf'); } };
    web(rr.x0 * TS + 1, rr.y0 * TS + 1, 1, 1); web((rr.x1 + 1) * TS - 2, rr.y0 * TS + 1, -1, 1);

    if (curYear === 2) { // praporky přes chodbu
      for (let x = TS; x < 63 * TS; x += 8) {
        const c = ['#d7141a', '#ffffff', '#11457e', '#000000', '#dd0000', '#ffce00'][(x / 8 | 0) % 6];
        P(x, 14 * TS, 7, 1, '#555'); P(x + 1, 14 * TS + 1, 5, 2, c); P(x + 2, 14 * TS + 3, 3, 2, c); P(x + 3, 14 * TS + 5, 1, 1, c);
      }
      T('DER · DIE · DAS', 8 * TS, 41 * TS, 7, '#ffffff');
    }
    if (curYear === 3) { // vytištěné tabulky všude
      for (let i = 0; i < 18; i++) {
        const x = (2 + ((rnd() * 59) | 0)) * TS + 3, y = 13 * TS + 2;
        if (tiles[13][Math.floor(x / TS)] !== FACE) continue;
        P(x, y, 9, 9, '#ffffff'); P(x, y, 9, 2, '#1d7044'); P(x + 3, y + 2, 1, 7, '#bfd9c6'); P(x, y + 5, 9, 1, '#bfd9c6');
      }
      for (let i = 0; i < 10; i++) T(U.pick(['#REF!', '=SUMA()', '#N/A', 'SVYHLEDAT']), (3 + rnd() * 58) * TS, (14.3 + rnd() * 5) * TS, 6, 'rgba(29,112,68,0.45)');
    }
    if (curYear === 4) { // výstražná páska, papíry, praskliny
      for (let x = TS; x < 63 * TS; x += 4) { P(x, 13 * TS + 9, 2, 3, (x / 4 | 0) % 2 ? '#111' : '#ffd23f'); }
      for (let i = 0; i < 40; i++) {
        const tx = 1 + ((rnd() * 61) | 0), ty = 14 + ((rnd() * 6) | 0);
        if (!solid[ty][tx]) { const x = tx * TS + ((rnd() * 8) | 0), y = ty * TS + ((rnd() * 8) | 0); P(x, y, 6, 5, '#fffdf5'); P(x + 1, y + 2, 4, 1, '#bbb'); }
      }
      for (let i = 0; i < 6; i++) { const x = (3 + rnd() * 58) * TS, y = (14.5 + rnd() * 4.5) * TS; for (let k = 0; k < 7; k++) P(x + k * 2, y + (k % 2) * 2 - k, 2, 1, '#6a5a4a'); }
      T('PANIKA POVOLENA', 32 * TS, 31 * TS, 7, '#ffd84a');
    }
  }

  function render(year) {
    curYear = year; seed = 1234; blinkers = [];
    const S = RS.s;
    if (!canvas) { canvas = document.createElement('canvas'); cx = canvas.getContext('2d'); }
    if (canvas.width !== W * TS * S) { canvas.width = W * TS * S; canvas.height = H * TS * S; }
    cx.setTransform(S, 0, 0, S, 0, 0); cx.imageSmoothingEnabled = false;
    const th = THEMES[year] || THEMES[1];
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) drawTile(tx, ty, th);
    for (const f of furniture) drawFurn(f, th);
    drawYearDeco(th);
    if (typeof Lighting !== 'undefined') { Lighting.build(year); Lighting.bake(cx); }
  }

  // Vykreslení výřezu mapy na obrazovku
  function draw(ctx, camX, camY) {
    const S = canvas.width / (W * TS);
    ctx.drawImage(canvas, camX * S, camY * S, 480 * S, 270 * S, camX, camY, 480, 270);
  }

  // Dynamické prvky (blikající LED, tma v 404, zamčené dveře)
  function drawDynamic(ctx, t, year) {
    for (const b of blinkers) if (((t * 3 + b.x) | 0) % 3) { ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, 2, 1); }
    // zamčené / otevřené dveře maturitního sálu
    const d = room('exam').door, dx = d.x * TS, dy = d.y * TS;
    if (examLocked) {
      ctx.fillStyle = '#5a3820'; ctx.fillRect(dx, dy, 32, 30);
      ctx.fillStyle = '#7a5232'; ctx.fillRect(dx + 2, dy + 2, 13, 26); ctx.fillRect(dx + 17, dy + 2, 13, 26);
      Sprites.drawArt(ctx, 'lock', dx + 16, dy + 16, 1);
    } else {
      const g = 0.4 + Math.sin(t * 4) * 0.2;
      ctx.fillStyle = `rgba(255,220,100,${g})`; ctx.fillRect(dx, dy, 32, 32);
    }
    // tma a blikající světlo v 404
    const r = room('r404');
    const flick = Math.sin(t * 23) > 0.85 || Math.sin(t * 7.3) > 0.97;
    ctx.fillStyle = flick ? 'rgba(10,8,20,0.0)' : 'rgba(10,8,20,0.25)';
    ctx.fillRect(r.x0 * TS, (r.y0 - 1) * TS, (r.x1 - r.x0 + 1) * TS, (r.y1 - r.y0 + 2) * TS);
    // automat svítí
    ctx.fillStyle = `rgba(255,240,200,${0.08 + Math.sin(t * 2) * 0.04})`; ctx.fillRect(13 * TS - 4, 14 * TS - 18, 24, 34);
  }

  build();
  return {
    TS, W, H, ROOMS, THEMES, T: { WALL, FACE, FLOOR, COR, LOBBY, GRASS, PATH, DOOR, BRICK, HEDGE },
    tileAt: (tx, ty) => (tx < 0 || ty < 0 || tx >= W || ty >= H) ? WALL : tiles[ty][tx],
    get furniture() { return furniture; },
    get year() { return curYear; },
    build, render, draw, drawDynamic, rectSolid, solidTile, roomAt, room, randomFree, setExamLocked,
    get examLocked() { return examLocked; },
    get interactables() { return interactables; },
    pxW: W * TS, pxH: H * TS,
  };
})();
