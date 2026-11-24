'use strict';
// =============================================================
//  world.js — 3D mapa INFISu a okolí (Klatovská tř., Plzeň-Bory).
//  Budova: 60 × 20 m, přízemí se dá celé projít. Venku silnice,
//  tramvajová trať (linka 4), Borský park, Úřad práce, záchranka.
//  Souřadnice v metrech: X = východ, Z = jih, Y = nahoru.
// =============================================================
const World = (() => {
  const BX0 = -30, BX1 = 30, BZ0 = -10, BZ1 = 10, CEIL = 3.2, TOP = 7.4;
  const GW = 60, GH = 20;
  // kódy buněk
  const OUT = 0, FLOOR = 1, IWALL = 2, OWALL = 3, OWIN = 4, DOOR = 5, EDOOR = 6, LOCKED = 7;
  const grid = new Uint8Array(GW * GH);
  const roomGrid = new Array(GW * GH).fill(null);

  // místnosti v buňkách (i = x+30, j = z+10)
  const ROOMS = {
    cs: { name: 'UČEBNA C#', i0: 1, i1: 10, j0: 1, j1: 7, door: [5, 6], side: 'n', floor: 'floor_class', sign: 'sign_cs' },
    hw: { name: 'HW LAB', i0: 12, i1: 20, j0: 1, j1: 7, door: [13, 14], side: 'n', floor: 'floor_class', sign: 'sign_hw' },
    lang: { name: 'JAZYKOVKA', i0: 22, i1: 32, j0: 1, j1: 7, door: [25, 26], side: 'n', floor: 'floor_class', sign: 'sign_lang' },
    lib: { name: 'KNIHOVNA', i0: 34, i1: 43, j0: 1, j1: 7, door: [38, 39], side: 'n', floor: 'floor_wood', sign: 'sign_lib' },
    excel: { name: 'EXCEL LAB', i0: 45, i1: 58, j0: 1, j1: 7, door: [48, 49], side: 'n', floor: 'floor_class', sign: 'sign_excel' },
    eco: { name: 'EKONOMIKA', i0: 1, i1: 10, j0: 13, j1: 18, door: [5, 6], side: 's', floor: 'floor_class', sign: 'sign_eco' },
    r404: { name: 'UČEBNA 404', i0: 12, i1: 18, j0: 13, j1: 18, door: [15], side: 's', floor: 'floor_wood', sign: 'sign_404' },
    wc: { name: 'WC', i0: 20, i1: 22, j0: 13, j1: 18, door: [21], side: 's', floor: 'floor_hall', sign: 'sign_wc' },
    hall: { name: 'VESTIBUL', i0: 24, i1: 36, j0: 12, j1: 18, door: [], side: 's', floor: 'floor_hall', open: true },
    staff: { name: 'SBOROVNA', i0: 38, i1: 44, j0: 13, j1: 18, door: [41], side: 's', floor: 'floor_class', sign: 'sign_staff', locked: true },
    exam: { name: 'MATURITNÍ SÁL', i0: 46, i1: 58, j0: 13, j1: 18, door: [51, 52], side: 's', floor: 'floor_wood', sign: 'sign_exam' },
    corr: { name: 'CHODBA', i0: 1, i1: 58, j0: 9, j1: 11, door: [], floor: 'floor_lino' },
  };
  for (const k in ROOMS) {
    const r = ROOMS[k];
    r.id = k; r.x0 = BX0 + r.i0; r.x1 = BX0 + r.i1 + 1; r.z0 = BZ0 + r.j0; r.z1 = BZ0 + r.j1 + 1;
    r.cx = (r.x0 + r.x1) / 2; r.cz = (r.z0 + r.z1) / 2;
    if (r.door.length) { r.dx = BX0 + (r.door[0] + r.door[r.door.length - 1] + 1) / 2; r.dz = r.side === 'n' ? BZ0 + 8.5 : BZ0 + 12.5; }
  }

  const G = (i, j) => (i < 0 || j < 0 || i >= GW || j >= GH) ? OUT : grid[j * GW + i];
  function buildGrid() {
    grid.fill(FLOOR);
    for (let i = 0; i < GW; i++) { grid[i] = OWALL; grid[(GH - 1) * GW + i] = OWALL; }
    for (let j = 0; j < GH; j++) { grid[j * GW] = OWALL; grid[j * GW + GW - 1] = OWALL; }
    // vnitřní stěny: řady j=8 a j=12, sloupce mezi místnostmi
    for (let i = 1; i < GW - 1; i++) { grid[8 * GW + i] = IWALL; grid[12 * GW + i] = IWALL; }
    for (const j of [1, 2, 3, 4, 5, 6, 7]) for (const i of [11, 21, 33, 44]) grid[j * GW + i] = IWALL;
    for (const j of [13, 14, 15, 16, 17, 18]) for (const i of [11, 19, 23, 37, 45]) grid[j * GW + i] = IWALL;
    for (let i = 24; i <= 36; i++) grid[12 * GW + i] = FLOOR; // hala otevřená do chodby
    for (const k in ROOMS) { const r = ROOMS[k]; for (const i of r.door) grid[(r.side === 'n' ? 8 : 12) * GW + i] = r.locked ? LOCKED : DOOR; }
    // okna ve vnější zdi
    for (let i = 1; i < GW - 1; i++) { if (i % 3 !== 0) { grid[i] = OWIN; grid[(GH - 1) * GW + i] = OWIN; } }
    for (const j of [2, 3, 5, 6, 14, 15, 17]) { grid[j * GW] = OWIN; grid[j * GW + GW - 1] = OWIN; }
    // vchody
    for (const i of [29, 30, 31]) grid[(GH - 1) * GW + i] = EDOOR;
    grid[10 * GW] = EDOOR; grid[10 * GW + GW - 1] = EDOOR;
    // místnosti
    for (const k in ROOMS) { const r = ROOMS[k]; for (let j = r.j0; j <= r.j1; j++) for (let i = r.i0; i <= r.i1; i++) if (grid[j * GW + i] === FLOOR) roomGrid[j * GW + i] = k; }
    for (const k in ROOMS) { const r = ROOMS[k]; for (const i of r.door) roomGrid[(r.side === 'n' ? 8 : 12) * GW + i] = 'corr'; }
    for (let j = 9; j <= 11; j++) { roomGrid[j * GW] = 'corr'; roomGrid[j * GW + GW - 1] = 'corr'; }
    for (const i of [29, 30, 31]) roomGrid[(GH - 1) * GW + i] = 'hall';
  }
  function roomAt(x, z) {
    const i = Math.floor(x - BX0), j = Math.floor(z - BZ0);
    if (i < 0 || j < 0 || i >= GW || j >= GH) return null;
    return roomGrid[j * GW + i];
  }
  function inside(x, z) { return x > BX0 && x < BX1 && z > BZ0 && z < BZ1; }

  // ---------------------------------------------------------
  //  stavba geometrie
  // ---------------------------------------------------------
  let lo, hiM, fol;
  const meshes = {};
  const interact = [];   // { id, x, z, r, label, y }
  const lamps = [];      // pouliční lampy {x,z}
  const treePos = [];
  const W = () => Tex.L('white');
  const C = (hex, em = 0) => { const c = U.hex(hex); return [c[0], c[1], c[2], em]; };
  function I(id, x, z, label, r = 1.6, y = 1.2) { interact.push({ id, x, z, r, label, y }); }

  // fasádní pás rozdělený na spodní (do 3.2 m) a horní část (skryje se v "domečkovém" pohledu)
  function fq(ax, az, bx, bz, y0, y1, layer, o) {
    if (y1 <= CEIL + 0.001) { lo.wall(ax, az, bx, bz, y0, y1, layer, o); return; }
    if (y0 >= CEIL - 0.001) { hiM.wall(ax, az, bx, bz, y0, y1, layer, o); return; }
    if (o && o.uv === 'fit') { lo.wall(ax, az, bx, bz, y0, y1, layer, o); return; }
    lo.wall(ax, az, bx, bz, y0, CEIL, layer, o); hiM.wall(ax, az, bx, bz, CEIL, y1, layer, o);
  }

  function buildBuilding() {
    const LW = Tex.L('wall_in'), LL = Tex.L('wall_low'), LP = Tex.L('plaster_blue'), LPL = Tex.L('plinth'),
      LWO = Tex.L('win_out'), LWI = Tex.L('win_in'), LWH = Tex.L('plaster_white'), LOR = Tex.L('orange'), LWD = Tex.L('wood');
    const isWall = (c) => c === IWALL || c === OWALL || c === OWIN;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const c = G(i, j);
      const x0 = BX0 + i, x1 = x0 + 1, z0 = BZ0 + j, z1 = z0 + 1;
      if (isWall(c)) {
        Col.addBox(x0, z0, x1, z1, c === IWALL ? CEIL : TOP);
        // 4 strany: [di,dj, a(x,z), b(x,z)] — a->b tak, aby normála mířila k sousedovi
        const sides = [[1, 0, [x1, z1], [x1, z0]], [-1, 0, [x0, z0], [x0, z1]], [0, 1, [x0, z1], [x1, z1]], [0, -1, [x1, z0], [x0, z0]]];
        for (const [di, dj, a, b] of sides) {
          const n = G(i + di, j + dj);
          if (isWall(n)) continue;
          const outside = n === OUT;
          if (outside) {
            // fasáda
            fq(a[0], a[1], b[0], b[1], 0, 0.5, LPL);
            if (c === OWIN) {
              fq(a[0], a[1], b[0], b[1], 0.5, 1.1, LP);
              fq(a[0], a[1], b[0], b[1], 1.1, 2.5, LWO, { uv: 'fit' });
              fq(a[0], a[1], b[0], b[1], 2.5, 4.1, LP);
              fq(a[0], a[1], b[0], b[1], 4.1, 5.5, LWO, { uv: 'fit' });
              fq(a[0], a[1], b[0], b[1], 5.5, 6.9, LP);
            } else fq(a[0], a[1], b[0], b[1], 0.5, 6.9, LP);
            fq(a[0], a[1], b[0], b[1], 6.9, TOP, LWH);
          } else {
            lo.wall(a[0], a[1], b[0], b[1], 0, 1.1, LL, { uv: 1 });
            if (c === OWIN) {
              lo.wall(a[0], a[1], b[0], b[1], 1.1, 2.5, LWI, { uv: 'fit', col: [1, 1, 1, 0.75] });
              lo.wall(a[0], a[1], b[0], b[1], 2.5, CEIL, LW);
            } else lo.wall(a[0], a[1], b[0], b[1], 1.1, CEIL, LW);
          }
        }
      } else if (c === DOOR || c === LOCKED || c === EDOOR) {
        // nadpraží (orientace podle sousedních zdí)
        const horiz = isWall(G(i - 1, j)) || G(i - 1, j) === c; // zeď vede ve směru X
        const ly = c === EDOOR ? 2.4 : 2.3, top = c === EDOOR ? TOP : CEIL;
        if (horiz) {
          const sideZ = [[z1, z0, 'pz'], [z0, z1, 'nz']];
          if (c === EDOOR) {
            // vnější strana je jih (j=19) – fasáda nad dveřmi
            const outZ = j === GH - 1 ? z1 : z0, inZ = j === GH - 1 ? z0 : z1;
            if (j === GH - 1) { fq(x0, outZ, x1, outZ, ly, 6.9, LP); fq(x0, outZ, x1, outZ, 6.9, TOP, LWH); lo.wall(x1, inZ, x0, inZ, ly, CEIL, LW); }
            else { fq(x1, outZ, x0, outZ, ly, 6.9, LP); fq(x1, outZ, x0, outZ, 6.9, TOP, LWH); lo.wall(x0, inZ, x1, inZ, ly, CEIL, LW); }
          } else {
            lo.wall(x0, z1, x1, z1, ly, CEIL, LW); lo.wall(x1, z0, x0, z0, ly, CEIL, LW);
          }
          lo.floor(x0, z0, x1, z1, ly, c === EDOOR ? LOR : LWD, { down: true });
          void sideZ;
        } else {
          if (c === EDOOR) {
            const outX = i === 0 ? x0 : x1, inX = i === 0 ? x1 : x0;
            if (i === 0) { fq(outX, z0, outX, z1, ly, 6.9, LP); fq(outX, z0, outX, z1, 6.9, TOP, LWH); lo.wall(inX, z1, inX, z0, ly, CEIL, LW); }
            else { fq(outX, z1, outX, z0, ly, 6.9, LP); fq(outX, z1, outX, z0, 6.9, TOP, LWH); lo.wall(inX, z0, inX, z1, ly, CEIL, LW); }
          }
          lo.floor(x0, z0, x1, z1, ly, c === EDOOR ? LOR : LWD, { down: true });
        }
        if (c === LOCKED) {
          lo.box(x0 + 0.02, 0, z0 + 0.45, x1 - 0.02, ly, z0 + 0.55, { tex: { pz: Tex.L('door_in'), nz: Tex.L('door_in'), side: Tex.L('wood') }, uv: 'fit' });
          Col.addBox(x0, z0, x1, z1, CEIL);
        }
        // podlaha ve dveřích
        lo.floor(x0, z0, x1, z1, 0, Tex.L(c === EDOOR ? 'floor_hall' : 'floor_lino'));
      }
    }
    // orámování dveří a cedule
    for (const k in ROOMS) {
      const r = ROOMS[k]; if (!r.door.length) continue;
      const dj = r.side === 'n' ? 8 : 12, zc = BZ0 + dj;
      const xa = BX0 + r.door[0], xb = BX0 + r.door[r.door.length - 1] + 1;
      for (const xx of [xa, xb]) lo.box(xx - 0.06, 0, zc - 0.04, xx + 0.06, 2.3, zc + 1.04, { tex: Tex.L('wood') });
      // cedule na straně chodby
      if (r.sign) {
        const zs = r.side === 'n' ? zc + 1.01 : zc - 0.01, mid = (xa + xb) / 2;
        if (r.side === 'n') lo.wall(mid - 0.9, zs, mid + 0.9, zs, 2.42, 2.92, Tex.L(r.sign), { uv: 'fit', uvr: [0, 0, 1, 0.3] });
        else lo.wall(mid + 0.9, zs, mid - 0.9, zs, 2.42, 2.92, Tex.L(r.sign), { uv: 'fit', uvr: [0, 0, 1, 0.3] });
      }
    }
    // podlahy místností
    for (const k in ROOMS) { const r = ROOMS[k]; lo.floor(r.x0, r.z0, r.x1, r.z1, 0, Tex.L(r.floor)); }
    // strop + světla
    hiM.floor(BX0, BZ0, BX1, BZ1, CEIL, Tex.L('ceiling'), { down: true });
    const LCL = Tex.L('ceil_light');
    for (let x = BX0 + 2; x < BX1; x += 4) for (let z = BZ0 + 2.5; z < BZ1; z += 4) {
      const g = G(Math.floor(x - BX0), Math.floor(z - BZ0));
      if (g === FLOOR) hiM.floor(x - 0.65, z - 0.15, x + 0.65, z + 0.15, CEIL - 0.01, LCL, { down: true, uv: 'fit', col: [1, 1, 1, 1] });
    }
    // střecha (valbová)
    const R = Tex.L('roof'), ox = 0.6, ey = TOP - 0.1, ry = 11.2, rx = 20;
    const x0 = BX0 - ox, x1 = BX1 + ox, z0 = BZ0 - ox, z1 = BZ1 + ox, sl = Math.hypot(z1, ry - ey);
    hiM.quad([x0, ey, z1], [x1, ey, z1], [rx, ry, 0], [-rx, ry, 0], R, [x0, sl, x1, sl, rx, 0, -rx, 0]);
    hiM.quad([x1, ey, z0], [x0, ey, z0], [-rx, ry, 0], [rx, ry, 0], R, [-x1, sl, -x0, sl, rx, 0, -rx, 0]);
    const hl = Math.hypot(x1 - rx, ry - ey);
    hiM.tri([x1, ey, z1], [x1, ey, z0], [rx, ry, 0], R, null, [-z1, hl, -z0, hl, 0, 0]);
    hiM.tri([x0, ey, z0], [x0, ey, z1], [-rx, ry, 0], R, null, [z0, hl, z1, hl, 0, 0]);
    hiM.floor(x0, z0, x1, z1, ey, Tex.L('plaster_white'), { down: true });
    hiM.wall(x0, z1, x1, z1, ey - 0.25, ey, Tex.L('wood_dark')); hiM.wall(x1, z0, x0, z0, ey - 0.25, ey, Tex.L('wood_dark'));
    hiM.wall(x1, z1, x1, z0, ey - 0.25, ey, Tex.L('wood_dark')); hiM.wall(x0, z0, x0, z1, ey - 0.25, ey, Tex.L('wood_dark'));
    hiM.floor(x0, z0, x1, z1, ey - 0.25, Tex.L('plaster_white'), { down: true });
    // střešní okna (na jižní i severní straně)
    const SK = Tex.L('skylight');
    for (const sx of [-14, -11, 9, 12, 15]) for (const side of [1, -1]) {
      const t0 = 0.25, t1 = 0.42, P = (x, t) => [x, ey + (ry - ey) * t + 0.03, side * (z1 - z1 * t) + side * 0.03];
      if (side === 1) hiM.quad(P(sx, t0), P(sx + 1.6, t0), P(sx + 1.6, t1), P(sx, t1), SK, [0, 1, 1, 1, 1, 0, 0, 0]);
      else hiM.quad(P(sx + 1.6, t0), P(sx, t0), P(sx, t1), P(sx + 1.6, t1), SK, [0, 1, 1, 1, 1, 0, 0, 0]);
    }
    // antény
    for (const [ax, az] of [[-6, 2], [13, -1]]) {
      hiM.box(ax - 0.04, ry - 1.2, az - 0.04, ax + 0.04, ry + 1.6, az + 0.04, { tex: Tex.L('metal') });
      hiM.box(ax - 0.6, ry + 1.2, az - 0.03, ax + 0.6, ry + 1.26, az + 0.03, { tex: Tex.L('metal') });
      hiM.box(ax - 0.4, ry + 0.8, az - 0.03, ax + 0.4, ry + 0.86, az + 0.03, { tex: Tex.L('metal') });
    }
    buildEntrance();
  }

  function buildEntrance() {
    const LG = Tex.L('glass'), LWH = Tex.L('plaster_white'), LOR = Tex.L('orange'), LP = Tex.L('plaster_blue');
    // zádveří (prosklené)
    const ex0 = -2, ex1 = 3, ez0 = BZ1, ez1 = BZ1 + 2.2, dA = -0.6, dB = 1.6;
    lo.floor(ex0, ez0, ex1, ez1, 0.01, Tex.L('floor_hall'));
    fol.wall(ex0, ez1, ex0, ez0, 0, CEIL, LG, { uv: 'fit', double: true });
    fol.wall(ex1, ez0, ex1, ez1, 0, CEIL, LG, { uv: 'fit', double: true });
    fol.wall(ex0, ez1, dA, ez1, 0, 2.3, LG, { uv: 'fit', double: true });
    fol.wall(dB, ez1, ex1, ez1, 0, 2.3, LG, { uv: 'fit', double: true });
    lo.box(ex0, 2.3, ez1 - 0.1, ex1, CEIL, ez1 + 0.05, { tex: LOR });
    for (const xx of [ex0, dA, dB, ex1]) lo.box(xx - 0.07, 0, ez1 - 0.07, xx + 0.07, 2.3, ez1 + 0.07, { tex: LOR });
    lo.box(ex0 - 0.07, 0, ez0, ex0 + 0.07, CEIL, ez0 + 0.1, { tex: LOR }); lo.box(ex1 - 0.07, 0, ez0, ex1 + 0.07, CEIL, ez0 + 0.1, { tex: LOR });
    lo.floor(ex0, ez0, ex1, ez1, CEIL, Tex.L('plaster_white'), { down: true });
    // otevřená křídla dveří
    lo.box(dA - 0.95, 0, ez1 + 0.06, dA, 2.25, ez1 + 0.12, { tex: { pz: Tex.L('door_out'), nz: Tex.L('door_out'), side: LOR }, uv: 'fit', uvr: [0, 0, 0.5, 1] });
    lo.box(dB, 0, ez1 + 0.06, dB + 0.95, 2.25, ez1 + 0.12, { tex: { pz: Tex.L('door_out'), nz: Tex.L('door_out'), side: LOR }, uv: 'fit', uvr: [0.5, 0, 1, 1] });
    // cedule školy na skle
    lo.wall(ex0 + 0.12, ez1 + 0.14, dA - 0.12, ez1 + 0.14, 1.05, 2.15, Tex.L('sign_infis'), { uv: 'fit' });
    Col.addBox(ex0 - 0.1, ez0, ex0 + 0.1, ez1, 3); Col.addBox(ex1 - 0.1, ez0, ex1 + 0.1, ez1, 3);
    Col.addBox(ex0, ez1 - 0.1, dA, ez1 + 0.15, 3); Col.addBox(dB, ez1 - 0.1, ex1, ez1 + 0.15, 3);
    // věžička nad vchodem
    hiM.box(ex0, CEIL, ez0, ex1, 8.6, ez0 + 1.6, { tex: LWH, skip: 'ny' });
    hiM.wall(ex0 + 1.8, ez0 + 1.61, ex0 + 3.2, ez0 + 1.61, 4.2, 5.6, Tex.L('win_out'), { uv: 'fit' });
    hiM.wall(ex0 + 1.9, ez0 + 1.61, ex0 + 3.1, ez0 + 1.61, 6.3, 7.5, Tex.L('logo_infis'), { uv: 'fit' });
    const gy = 8.6, gt = 9.6, R = Tex.L('roof');
    hiM.quad([ex0 - 0.2, gy, ez0 - 0.6], [ex0 - 0.2, gy, ez0 + 1.8], [(ex0 + ex1) / 2, gt, ez0 + 1.8], [(ex0 + ex1) / 2, gt, ez0 - 0.6], R, [0, 3, 2.4, 3, 2.4, 0, 0, 0]);
    hiM.quad([ex1 + 0.2, gy, ez0 + 1.8], [ex1 + 0.2, gy, ez0 - 0.6], [(ex0 + ex1) / 2, gt, ez0 - 0.6], [(ex0 + ex1) / 2, gt, ez0 + 1.8], R, [0, 3, 2.4, 3, 2.4, 0, 0, 0]);
    hiM.tri([ex0, gy, ez0 + 1.6], [ex1, gy, ez0 + 1.6], [(ex0 + ex1) / 2, gt, ez0 + 1.6], LWH);
    // stříška (půlelipsa) na modrých sloupech
    const cx = 0.5, cz = BZ1, rx = 7.6, rz = 6.2, n = 28, y0 = 3.25, y1 = 3.6;
    const pts = []; for (let k = 0; k <= n; k++) { const a = k / n * Math.PI; pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]); }
    for (let k = 0; k < n; k++) {
      const p = pts[k], q = pts[k + 1];
      lo.tri([cx, y1, cz], [q[0], y1, q[1]], [p[0], y1, p[1]], LWH);
      lo.tri([cx, y0, cz], [p[0], y0, p[1]], [q[0], y0, q[1]], LWH);
      lo.quad([q[0], y0, q[1]], [p[0], y0, p[1]], [p[0], y1, p[1]], [q[0], y1, q[1]], Tex.L('blue'), [0, 1, 1, 1, 1, 0, 0, 0]);
    }
    for (const a of [150, 115, 65, 30]) {
      const r = a * Math.PI / 180, px = cx + Math.cos(r) * rx * 0.84, pz = cz + Math.sin(r) * rz * 0.84;
      lo.cyl(px, pz, 0.32, 0, y0, Tex.L('blue'), { n: 10 });
      Col.addBox(px - 0.3, pz - 0.3, px + 0.3, pz + 0.3, 3.3);
    }
    // rampa s oranžovým zábradlím (západně od vchodu)
    const rx0 = -16, rx1 = -2.4, rz0 = BZ1, rz1 = BZ1 + 1.8, rmid = -7;
    const LC = Tex.L('plinth');
    lo.quad([rx0, 0, rz1], [rmid, 0.75, rz1], [rmid, 0.75, rz0], [rx0, 0, rz0], LC, [0, 1, 1, 1, 1, 0, 0, 0]);
    lo.floor(rmid, rz0, rx1, rz1, 0.75, LC);
    lo.tri([rx0, 0, rz1], [rmid, 0, rz1], [rmid, 0.75, rz1], LC);
    lo.wall(rmid, rz1, rx1, rz1, 0, 0.75, LC);
    lo.wall(rx1, rz1, rx1, rz0, 0, 0.75, LC);
    for (let x = rx0 + 0.5; x <= rx1; x += 1.5) {
      const yb = x < rmid ? (x - rx0) / (rmid - rx0) * 0.75 : 0.75;
      lo.box(x - 0.04, yb, rz1 - 0.12, x + 0.04, yb + 1.0, rz1 - 0.04, { tex: LOR });
    }
    // madlo (šikmé + rovné)
    const rail = (xa, ya, xb, yb) => { lo.quad([xa, ya, rz1 - 0.04], [xb, yb, rz1 - 0.04], [xb, yb + 0.07, rz1 - 0.04], [xa, ya + 0.07, rz1 - 0.04], LOR, [0, 1, 1, 1, 1, 0, 0, 0]); lo.quad([xb, yb + 0.07, rz1 - 0.12], [xa, ya + 0.07, rz1 - 0.12], [xa, ya + 0.07, rz1 - 0.04], [xb, yb + 0.07, rz1 - 0.04], LOR, [0, 1, 1, 1, 1, 0, 0, 0]); };
    rail(rx0, 1.0, rmid, 1.75); rail(rmid, 1.75, rx1, 1.75);
    rail(rx0, 0.55, rmid, 1.3); rail(rmid, 1.3, rx1, 1.3);
    Col.addBox(rx0 + 2, rz0, rx1, rz1, 1.0);
    // sklepní dveře pod rampou
    lo.wall(-5.2, BZ1 + 0.01, -3.6, BZ1 + 0.01, 0, 0.7, Tex.L('door_in'), { uv: 'fit' });
  }

  // ---------------------------------------------------------
  //  nábytek a vybavení místností
  // ---------------------------------------------------------
  function desk(x, z, w = 1.4, d = 0.65, o = {}) {
    lo.box(x - w / 2, 0.7, z - d / 2, x + w / 2, 0.76, z + d / 2, { tex: { top: Tex.L('desk'), side: Tex.L('wood_dark'), bottom: Tex.L('wood_dark') } });
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lo.box(x + lx * (w / 2 - 0.05) - 0.03, 0, z + lz * (d / 2 - 0.05) - 0.03, x + lx * (w / 2 - 0.05) + 0.03, 0.7, z + lz * (d / 2 - 0.05) + 0.03, { tex: Tex.L('metal') });
    if (o.panel) lo.box(x - w / 2 + 0.05, 0.3, z + (o.panel > 0 ? d / 2 - 0.04 : -d / 2), x + w / 2 - 0.05, 0.7, z + (o.panel > 0 ? d / 2 : -d / 2 + 0.04), { tex: Tex.L('wood_dark') });
    Col.addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0.76);
  }
  function chair(x, z, face) { // face: +1 = opěradlo na jihu
    lo.box(x - 0.22, 0.42, z - 0.22, x + 0.22, 0.47, z + 0.22, { tex: Tex.L('chair') });
    lo.box(x - 0.22, 0.47, z + face * 0.18, x + 0.22, 0.95, z + face * 0.22, { tex: Tex.L('chair') });
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lo.box(x + lx * 0.18 - 0.02, 0, z + lz * 0.18 - 0.02, x + lx * 0.18 + 0.02, 0.42, z + lz * 0.18 + 0.02, { tex: Tex.L('metal') });
  }
  function monitor(x, z, face, screen) { // face: směr obrazovky (+1 = jih)
    const zf = z + face * 0.03;
    lo.box(x - 0.28, 0.86, z - 0.03, x + 0.28, 1.2, z + 0.03, { tex: Tex.L('plastic') });
    if (face > 0) lo.wall(x - 0.25, zf + 0.002, x + 0.25, zf + 0.002, 0.89, 1.17, Tex.L(screen), { uv: 'fit', col: [1, 1, 1, 0.9] });
    else lo.wall(x + 0.25, zf - 0.002, x - 0.25, zf - 0.002, 0.89, 1.17, Tex.L(screen), { uv: 'fit', col: [1, 1, 1, 0.9] });
    lo.box(x - 0.04, 0.76, z - 0.04, x + 0.04, 0.86, z + 0.04, { tex: Tex.L('plastic') });
    lo.box(x - 0.22, 0.76, z + face * 0.22 - 0.07, x + 0.22, 0.79, z + face * 0.22 + 0.07, { tex: Tex.L('keyboard') });
  }
  // tabule na stěně: side 'n' = na severní stěně (lícem k jihu)
  function board(r, tex, w = 3.2) {
    const x0 = r.cx - w / 2, x1 = r.cx + w / 2;
    if (r.side === 'n') { const z = r.z0 + 0.02; lo.wall(x0, z, x1, z, 0.95, 2.35, Tex.L(tex), { uv: 'fit' }); lo.box(x0, 0.9, z - 0.02, x1, 0.95, z + 0.1, { tex: Tex.L('metal') }); }
    else { const z = r.z1 - 0.02; lo.wall(x1, z, x0, z, 0.95, 2.35, Tex.L(tex), { uv: 'fit' }); lo.box(x0, 0.9, z - 0.1, x1, 0.95, z + 0.02, { tex: Tex.L('metal') }); }
  }
  function posterOn(x, z, dir, tex, w = 0.8, h = 0.8, y = 1.5) {
    // dir: směr, kam plakát kouká: 'n','s','e','w'
    const hw = w / 2;
    if (dir === 's') lo.wall(x - hw, z + 0.02, x + hw, z + 0.02, y - h / 2, y + h / 2, Tex.L(tex), { uv: 'fit' });
    if (dir === 'n') lo.wall(x + hw, z - 0.02, x - hw, z - 0.02, y - h / 2, y + h / 2, Tex.L(tex), { uv: 'fit' });
    if (dir === 'e') lo.wall(x + 0.02, z + hw, x + 0.02, z - hw, y - h / 2, y + h / 2, Tex.L(tex), { uv: 'fit' });
    if (dir === 'w') lo.wall(x - 0.02, z - hw, x - 0.02, z + hw, y - h / 2, y + h / 2, Tex.L(tex), { uv: 'fit' });
  }
  function plant(x, z, big = 1) {
    lo.box(x - 0.2, 0, z - 0.2, x + 0.2, 0.4, z + 0.2, { tex: Tex.L('pot') });
    const s = 0.45 * big;
    fol.wall(x - s, z, x + s, z, 0.35, 0.35 + 1.1 * big, Tex.L('plant'), { uv: 'fit', double: true });
    fol.wall(x, z - s, x, z + s, 0.35, 0.35 + 1.1 * big, Tex.L('plant'), { uv: 'fit', double: true });
    Col.addBox(x - 0.25, z - 0.25, x + 0.25, z + 0.25, 1);
  }
  function shelf(x0, z0, x1, z1, h = 2.1) {
    lo.box(x0, 0, z0, x1, h, z1, { tex: { side: Tex.L('books'), top: Tex.L('wood_dark'), bottom: Tex.L('wood_dark') }, uv: 1 });
    Col.addBox(x0, z0, x1, z1, h);
  }

  function furnish() {
    const R = ROOMS;
    // ---- UČEBNA C# ----
    {
      const r = R.cs; board(r, 'board_cs');
      desk(r.cx, r.z0 + 1.3, 1.6, 0.7); monitor(r.cx, r.z0 + 1.2, -1, 'screen_code'); chair(r.cx, r.z0 + 0.7, -1);
      for (const z of [r.z0 + 3.0, r.z0 + 4.5, r.z0 + 6.0]) for (const x of [r.x0 + 2.2, r.x1 - 2.2]) {
        desk(x, z, 2.4, 0.7, { panel: -1 }); monitor(x - 0.6, z - 0.1, 1, 'screen_code'); monitor(x + 0.6, z - 0.1, 1, U.chance(0.5) ? 'screen_code' : 'screen_off');
        chair(x - 0.6, z + 0.65, 1); chair(x + 0.6, z + 0.65, 1);
      }
      posterOn(r.x1, r.cz - 1, 'w', 'poster_csharp'); posterOn(r.x0, r.cz, 'e', 'poster_semicolon');
      I('whiteboard_cs', r.cx, r.z0 + 0.6, 'Prohlédnout tabuli');
    }
    // ---- HW LAB ----
    {
      const r = R.hw; board(r, 'board_hw', 2.6);
      lo.box(r.x1 - 1.0, 0, r.z0 + 0.2, r.x1 - 0.3, 2.0, r.z0 + 1.0, { tex: { pz: Tex.L('rack'), side: Tex.L('plastic'), top: Tex.L('plastic') }, uv: 'fit', col: [1, 1, 1, 0.35] });
      Col.addBox(r.x1 - 1.0, r.z0 + 0.2, r.x1 - 0.3, r.z0 + 1.0, 2);
      I('rack', r.x1 - 0.65, r.z0 + 1.1, 'Server');
      for (const z of [r.z0 + 3.2, r.z0 + 5.4]) {
        desk(r.cx, z, 4.2, 0.9);
        for (const dx of [-1.4, 0, 1.4]) {
          lo.box(r.cx + dx - 0.2, 0.76, z - 0.25, r.cx + dx + 0.2, 1.2, z + 0.25, { tex: { pz: Tex.L('pc_case'), side: Tex.L('plastic'), top: Tex.L('metal') }, uv: 'fit' });
          lo.box(r.cx + dx + 0.3, 0.76, z - 0.05, r.cx + dx + 0.55, 0.79, z + 0.25, { tex: Tex.L('excel_cell') });
        }
        chair(r.cx - 1, z + 0.75, 1); chair(r.cx + 1, z + 0.75, 1);
      }
      posterOn(r.x0, r.cz, 'e', 'poster_ram'); plant(r.x0 + 0.5, r.z1 - 0.5);
    }
    // ---- JAZYKOVKA ----
    {
      const r = R.lang; board(r, 'board_lang');
      desk(r.cx, r.z0 + 1.3, 1.6, 0.7); chair(r.cx, r.z0 + 0.7, -1);
      for (const z of [r.z0 + 3.0, r.z0 + 4.6, r.z0 + 6.1]) for (const x of [r.x0 + 2.3, r.cx + 0.1, r.x1 - 2.3]) { desk(x, z, 1.6, 0.6); chair(x - 0.4, z + 0.55, 1); chair(x + 0.4, z + 0.55, 1); }
      posterOn(r.x0, r.cz, 'e', 'poster_map', 1.4, 0.9);
      // vlajky na tyčích
      [['flag_cz', r.x1 - 0.6], ['flag_uk', r.x1 - 1.3], ['flag_de', r.x1 - 2.0]].forEach(([f, x]) => {
        lo.box(x - 0.03, 0, r.z0 + 0.5, x + 0.03, 2.4, r.z0 + 0.56, { tex: Tex.L('metal') });
        fol.wall(x, r.z0 + 0.53, x + 0.6, r.z0 + 0.53, 1.8, 2.3, Tex.L(f), { uv: 'fit', double: true });
      });
      I('flags', r.x1 - 1.3, r.z0 + 1.0, 'Vlajky');
      lo.cyl(r.x0 + 1, r.z0 + 1, 0.05, 0.76, 1.0, Tex.L('metal'));
    }
    // ---- KNIHOVNA ----
    {
      const r = R.lib;
      shelf(r.x0 + 0.1, r.z0 + 0.1, r.x1 - 0.1, r.z0 + 0.6);
      shelf(r.x0 + 0.1, r.z0 + 0.6, r.x0 + 0.6, r.z1 - 1.5);
      shelf(r.x1 - 0.6, r.z0 + 0.6, r.x1 - 0.1, r.z1 - 1.5);
      for (const x of [r.x0 + 2.2, r.x0 + 4.4]) shelf(x, r.z0 + 2.0, x + 0.6, r.z0 + 4.6, 1.8);
      desk(r.x1 - 2.8, r.z0 + 3.4, 1.8, 1.0); chair(r.x1 - 3.3, r.z0 + 4.1, 1); chair(r.x1 - 2.3, r.z0 + 4.1, 1);
      lo.box(r.x1 - 3.0, 0.76, r.z0 + 3.2, r.x1 - 2.6, 0.84, r.z0 + 3.5, { tex: Tex.L('spines') });
      posterOn(r.x0 + 0.6, r.z1 - 0.7, 'e', 'poster_janda', 0.7, 0.7);
      lo.box(r.x0 + 1.2, 0, r.z1 - 1.2, r.x0 + 2.0, 0.45, r.z1 - 0.4, { tex: Tex.L('fabric') }); lo.box(r.x0 + 1.2, 0.45, r.z1 - 0.5, r.x0 + 2.0, 1.0, r.z1 - 0.35, { tex: Tex.L('fabric') });
      Col.addBox(r.x0 + 1.2, r.z1 - 1.2, r.x0 + 2.0, r.z1 - 0.35, 1);
      I('books', r.x0 + 2.5, r.z0 + 3.3, 'Knihy'); I('books', r.cx, r.z0 + 1.2, 'Knihy');
    }
    // ---- EXCEL LAB ----
    {
      const r = R.excel; board(r, 'screen_excel', 4.2);
      for (const z of [r.z0 + 2.4, r.z0 + 4.0, r.z0 + 5.6]) for (const x of [r.x0 + 2.4, r.cx, r.x1 - 2.4]) {
        desk(x, z, 2.6, 0.7, { panel: -1 }); monitor(x - 0.65, z - 0.1, 1, 'screen_excel'); monitor(x + 0.65, z - 0.1, 1, 'screen_excel');
        chair(x - 0.65, z + 0.6, 1); chair(x + 0.65, z + 0.6, 1);
      }
      posterOn(r.x0, r.cz, 'e', 'poster_chart'); posterOn(r.x1, r.cz, 'w', 'poster_excel');
      I('excelscreen', r.cx, r.z0 + 0.8, 'Projekce');
    }
    // ---- EKONOMIKA ----
    {
      const r = R.eco; board(r, 'board_eco');
      desk(r.cx, r.z1 - 1.3, 1.6, 0.7); chair(r.cx, r.z1 - 0.7, 1);
      for (const z of [r.z0 + 1.2, r.z0 + 2.7]) for (const x of [r.x0 + 2.2, r.x1 - 2.2]) { desk(x, z, 2.4, 0.6); chair(x - 0.6, z - 0.55, -1); chair(x + 0.6, z - 0.55, -1); }
      lo.box(r.x0 + 0.2, 0, r.z1 - 1.0, r.x0 + 0.9, 0.9, r.z1 - 0.2, { tex: Tex.L('metal') });
      lo.box(r.x0 + 0.88, 0.3, r.z1 - 0.75, r.x0 + 0.92, 0.6, r.z1 - 0.45, { tex: Tex.L('plastic') });
      Col.addBox(r.x0 + 0.2, r.z1 - 1.0, r.x0 + 0.9, r.z1 - 0.2, 1);
      I('safe', r.x0 + 1.2, r.z1 - 0.6, 'Trezor');
      posterOn(r.x1, r.cz, 'w', 'poster_tax');
    }
    // ---- UČEBNA 404 ----
    {
      const r = R.r404; board(r, 'board_math', 3.4);
      for (const z of [r.z0 + 1.6, r.z0 + 3.2]) for (const x of [r.x0 + 1.8, r.x1 - 1.8]) { desk(x, z, 1.4, 0.6); chair(x, z - 0.55, -1); }
      I('olddesk', r.x0 + 1.8, r.z0 + 1.6, 'Starý stůl');
    }
    // ---- WC ----
    {
      const r = R.wc;
      lo.box(r.x0 + 0.2, 0, r.z1 - 0.7, r.x0 + 0.8, 0.45, r.z1 - 0.1, { tex: Tex.L('plaster_white') });
      lo.box(r.x0 + 0.2, 0.45, r.z1 - 0.25, r.x0 + 0.8, 1.0, r.z1 - 0.1, { tex: Tex.L('plaster_white') });
      lo.box(r.x1 - 0.6, 0.8, r.z1 - 0.5, r.x1 - 0.1, 0.95, r.z1 - 0.1, { tex: Tex.L('plaster_white') });
      lo.wall(r.x1 - 0.02, r.z1 - 0.1, r.x1 - 0.02, r.z1 - 0.6, 1.2, 1.8, Tex.L('win_in'), { uv: 'fit' });
      Col.addBox(r.x0 + 0.2, r.z1 - 0.7, r.x0 + 0.8, r.z1 - 0.1, 1);
      I('wc', r.cx, r.z0 + 2.4, 'Záchod');
    }
    // ---- VESTIBUL ----
    {
      const r = R.hall;
      // automaty u západní zdi
      for (const [z, t, id] of [[r.z0 + 2.4, 'vending', 'vending'], [r.z0 + 3.6, 'vending', 'vending2']]) {
        lo.box(r.x0 + 0.1, 0, z - 0.5, r.x0 + 0.9, 1.9, z + 0.5, { tex: { px: Tex.L(t), side: Tex.L('plastic'), top: Tex.L('plastic') }, uv: 'fit', col: [1, 1, 1, 0.25] });
        Col.addBox(r.x0 + 0.1, z - 0.5, r.x0 + 0.9, z + 0.5, 2);
        I(id, r.x0 + 1.3, z, 'Automat');
      }
      // bufet u východní zdi
      lo.box(r.x1 - 1.0, 0, r.z0 + 1.6, r.x1 - 0.1, 1.05, r.z0 + 4.4, { tex: { nx: Tex.L('bufet'), side: Tex.L('wood'), top: Tex.L('desk') }, uv: 'fit' });
      Col.addBox(r.x1 - 1.0, r.z0 + 1.6, r.x1 - 0.1, r.z0 + 4.4, 1.1);
      lo.wall(r.x1 - 0.02, r.z0 + 1.6, r.x1 - 0.02, r.z0 + 4.4, 1.3, 2.6, Tex.L('poster_welcome'), { uv: 'fit' });
      I('bufet', r.x1 - 1.6, r.z0 + 3.0, 'Bufet');
      // vitrína s poháry
      lo.box(r.x0 + 3.0, 0, r.z1 - 0.6, r.x0 + 5.0, 2.0, r.z1 - 0.1, { tex: { nz: Tex.L('trophy'), side: Tex.L('wood_dark') }, uv: 'fit' });
      Col.addBox(r.x0 + 3.0, r.z1 - 0.6, r.x0 + 5.0, r.z1 - 0.1, 2);
      I('trophy', r.x0 + 4.0, r.z1 - 1.0, 'Vitrína');
      // EduPage kiosek
      lo.box(r.x0 + 1.0, 0, r.z1 - 0.5, r.x0 + 1.7, 1.1, r.z1 - 0.2, { tex: Tex.L('plastic') });
      lo.wall(r.x0 + 1.6, r.z1 - 0.52, r.x0 + 1.1, r.z1 - 0.52, 1.1, 1.6, Tex.L('screen_edupage'), { uv: 'fit', col: [1, 1, 1, 0.9] });
      lo.box(r.x0 + 1.05, 1.05, r.z1 - 0.5, r.x0 + 1.65, 1.65, r.z1 - 0.45, { tex: Tex.L('plastic'), skip: 'nz' });
      Col.addBox(r.x0 + 1.0, r.z1 - 0.5, r.x0 + 1.7, r.z1 - 0.2, 1.6);
      I('kiosk', r.x0 + 1.35, r.z1 - 1.0, 'EduPage kiosek');
      // lavičky a kytky
      for (const x of [-2.8, 3.6]) { lo.box(x - 0.9, 0.4, 6.6, x + 0.9, 0.48, 7.0, { tex: Tex.L('wood') }); lo.box(x - 0.8, 0, 6.7, x - 0.7, 0.4, 6.9, { tex: Tex.L('metal') }); lo.box(x + 0.7, 0, 6.7, x + 0.8, 0.4, 6.9, { tex: Tex.L('metal') }); Col.addBox(x - 0.9, 6.6, x + 0.9, 7.0, 0.5); }
      I('bench', -2.8, 6.0, 'Lavička');
      plant(r.x0 + 0.6, r.z1 - 0.6, 1.2); plant(r.x1 - 0.6, r.z1 - 0.6, 1.2); plant(r.x0 + 2.2, r.z1 - 0.5);
      // logo na zdi
      lo.wall(r.x0 + 0.02, r.z0 + 5.6, r.x0 + 0.02, r.z0 + 4.4, 1.2, 2.4, Tex.L('logo_infis'), { uv: 'fit' });
      // hodiny nad halou
      fol.wall(r.cx - 0.35, r.z1 - 0.03, r.cx + 0.35, r.z1 - 0.03, 2.35, 3.05, Tex.L('clock'), { uv: 'fit', double: true });
    }
    // ---- SBOROVNA (zamčená) ----
    { const r = R.staff; desk(r.cx, r.cz, 3, 1.2); I('staffdoor', r.dx, r.dz - 1.2, 'Sborovna'); }
    // ---- MATURITNÍ SÁL ----
    {
      const r = R.exam;
      const tz = r.z1 - 1.6;
      lo.box(r.cx - 2.6, 0, tz - 0.5, r.cx + 2.6, 0.78, tz + 0.5, { tex: { top: Tex.L('green_cloth'), side: Tex.L('green_cloth') } });
      Col.addBox(r.cx - 2.6, tz - 0.5, r.cx + 2.6, tz + 0.5, 0.8);
      for (const dx of [-1.6, 0, 1.6]) chair(r.cx + dx, tz + 0.85, 1);
      desk(r.cx, r.z0 + 2.2, 1.0, 0.6); chair(r.cx, r.z0 + 1.6, -1);
      lo.cyl(r.cx + 2.2, tz, 0.08, 0.78, 1.0, Tex.L('glass'), { n: 6 });
      fol.wall(r.cx + 2.0, tz, r.cx + 2.4, tz, 1.0, 1.45, Tex.L('plant'), { uv: 'fit', double: true });
      lo.box(r.x1 - 0.8, 0, r.z1 - 0.5, r.x1 - 0.74, 2.5, r.z1 - 0.44, { tex: Tex.L('metal') });
      fol.wall(r.x1 - 0.77, r.z1 - 0.47, r.x1 - 1.6, r.z1 - 0.47, 1.9, 2.4, Tex.L('flag_cz'), { uv: 'fit', double: true });
      I('committee', r.cx, tz - 1.0, 'Stůl komise');
    }
    // ---- CHODBA ----
    {
      const z = BZ0 + 9; // jižní líc severní stěny chodby = z -1
      for (let x = BX0 + 1; x < BX1 - 1; x += 0.5) {
        const i = Math.floor(x - BX0);
        if (G(i, 8) !== IWALL || G(Math.floor(x + 0.49 - BX0), 8) !== IWALL) continue;
        if ((i % 7) > 4) continue;
        if (Math.abs(x + 0.25 + 19.5) < 1.6 || Math.abs(x + 0.25 - 15.5) < 1.6) continue;
        lo.box(x, 0, z, x + 0.5, 1.9, z + 0.45, { tex: { pz: Tex.L((i % 3) ? 'locker' : 'locker_orange'), side: Tex.L('metal'), top: Tex.L('metal') }, uv: 'fit' });
        Col.addBox(x, z, x + 0.5, z + 0.45, 1.9);
      }
      const zs = BZ0 + 12; // severní líc jižní stěny = z 2
      [[-26.5, 'poster_run'], [-12.5, 'poster_semicolon'], [13.5, 'poster_maturita'], [26, 'poster_welcome']].forEach(([x, t]) => { posterOn(x, zs, 'n', t); I(t, x, zs - 0.8, 'Plakát'); });
      // nástěnky jako na skutečné chodbě INFISu
      posterOn(-17.4, zs, 'n', 'cork_board', 1.5, 1.3, 1.6); I('cork', -17.4, zs - 0.8, 'Nástěnka');
      posterOn(19.2, zs, 'n', 'board_firmy', 1.6, 1.3, 1.6); I('firmy', 19.2, zs - 0.8, 'Nástěnka');
      posterOn(-21.5, zs, 'n', 'cork_board', 1.2, 1.0, 1.75);
      // popínavé kytky na zdi
      for (const px of [-22.6, -11.4, 9.4, 24.2]) fol.wall(px - 0.35, zs - 0.04, px + 0.35, zs - 0.04, 1.6, 2.45, Tex.L('plant'), { uv: 'fit', double: true });
      // hasicí přístroje
      for (const px of [8.4, -27.6]) { lo.cyl(px, zs - 0.14, 0.1, 0.45, 1.05, Tex.L('white'), { n: 8, col: [0.85, 0.08, 0.08, 0], cap: true }); lo.box(px - 0.03, 1.05, zs - 0.2, px + 0.03, 1.15, zs - 0.08, { tex: Tex.L('plastic') }); }
      // protipožární prosklené dveře přes chodbu (otevřené)
      for (const fx of [-19.5, 15.5]) {
        const zA = BZ0 + 9, zB = BZ0 + 12;
        lo.box(fx - 0.06, 0, zA, fx + 0.06, CEIL, zA + 0.1, { tex: Tex.L('wood') });
        lo.box(fx - 0.06, 0, zB - 0.1, fx + 0.06, CEIL, zB, { tex: Tex.L('wood') });
        lo.box(fx - 0.06, 2.3, zA, fx + 0.06, 2.38, zB, { tex: Tex.L('wood') });
        fol.wall(fx, zA + 0.1, fx, zB - 0.1, 2.38, CEIL, Tex.L('glass'), { uv: 'fit', double: true });
        lo.box(fx + 0.06, 0, zA + 0.1, fx + 1.0, 2.28, zA + 0.16, { tex: { pz: Tex.L('door_glass'), nz: Tex.L('door_glass'), side: Tex.L('wood') }, uv: 'fit' });
        lo.box(fx + 0.06, 0, zB - 0.16, fx + 1.0, 2.28, zB - 0.1, { tex: { pz: Tex.L('door_glass'), nz: Tex.L('door_glass'), side: Tex.L('wood') }, uv: 'fit' });
        Col.addBox(fx - 0.06, zA, fx + 1.0, zA + 0.18, 2.3); Col.addBox(fx - 0.06, zB - 0.18, fx + 1.0, zB, 2.3);
      }
      for (const x of [-28.3, -10.4, 14.8]) plant(x, zs - 0.35);
      for (const x of [-21, 2.2]) { lo.box(x - 0.9, 0.4, zs - 0.42, x + 0.9, 0.48, zs - 0.05, { tex: Tex.L('wood') }); lo.box(x - 0.85, 0, zs - 0.35, x - 0.75, 0.4, zs - 0.1, { tex: Tex.L('metal') }); lo.box(x + 0.75, 0, zs - 0.35, x + 0.85, 0.4, zs - 0.1, { tex: Tex.L('metal') }); Col.addBox(x - 0.9, zs - 0.42, x + 0.9, zs - 0.05, 0.5); }
      // hasicí přístroj
      lo.cyl(-13.2, zs - 0.15, 0.1, 0.5, 1.1, Tex.L('flag_de'), { n: 6, col: [1.3, 0.1, 0.1, 0] });
      fol.wall(-19.9, zs - 0.03, -19.3, zs - 0.03, 2.3, 2.9, Tex.L('clock'), { uv: 'fit', double: true });
      I('clock', -19.6, zs - 0.8, 'Hodiny');
      // okna na koncích chodby jsou v obvodové zdi; u východu cedule
    }
  }

  // ---------------------------------------------------------
  //  OKOLÍ
  // ---------------------------------------------------------
  const ROADS = [
    { x0: -95, z0: 25, x1: 60, z1: 33, dir: 'x' },       // jižní ulice
    { x0: -95, z0: -45, x1: 60, z1: -37, dir: 'x' },     // Kaplířova
    { x0: -95, z0: -45, x1: -87, z1: 33, dir: 'z' },     // západní
    { x0: 60, z0: -110, x1: 66, z1: 110, dir: 'z' },     // Klatovská (západní pruh)
    { x0: 74, z0: -110, x1: 80, z1: 110, dir: 'z' },     // Klatovská (východní pruh)
  ];
  function onRoad(x, z, m = 0) { for (const r of ROADS) if (x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m) return true; return x > 66 - m && x < 74 + m; }

  function tree(x, z, kind, s = 1) {
    const B = Tex.L('bark');
    if (kind === 'pine') {
      lo.box(x - 0.18 * s, 0, z - 0.18 * s, x + 0.18 * s, 1.4 * s, z + 0.18 * s, { tex: B });
      const P = Tex.L('pine');
      for (let k = 0; k < 4; k++) { const w = (1.9 - k * 0.42) * s, y = (1.1 + k * 1.15) * s; fol.box(x - w, y, z - w, x + w, y + 1.3 * s, z + w, { tex: P, uv: 0.5 }); }
    } else {
      lo.box(x - 0.2 * s, 0, z - 0.2 * s, x + 0.2 * s, 2.6 * s, z + 0.2 * s, { tex: B });
      lo.box(x - 0.08 * s, 1.8 * s, z - 0.6 * s, x + 0.08 * s, 1.95 * s, z + 0.1, { tex: B });
      const L = Tex.L('leaves');
      fol.box(x - 1.7 * s, 2.2 * s, z - 1.7 * s, x + 1.7 * s, 4.2 * s, z + 1.7 * s, { tex: L, uv: 0.5 });
      fol.box(x - 1.1 * s, 4.2 * s, z - 1.1 * s, x + 1.1 * s, 5.3 * s, z + 1.1 * s, { tex: L, uv: 0.5 });
      fol.box(x - 0.6 * s + 0.6, 3.0 * s, z - 2.2 * s, x + 0.8 * s, 4.0 * s, z - 1.4 * s, { tex: L, uv: 0.5 });
    }
    Col.addBox(x - 0.3 * s, z - 0.3 * s, x + 0.3 * s, z + 0.3 * s, 2.2);
    treePos.push([x, z]);
  }
  function lamp(x, z) {
    lo.cyl(x, z, 0.09, 0, 5.2, Tex.L('metal'), { n: 6 });
    lo.box(x - 0.08, 5.1, z - 0.08, x + 0.08, 5.2, z + 0.9, { tex: Tex.L('metal') });
    lo.box(x - 0.2, 4.95, z + 0.6, x + 0.2, 5.1, z + 1.1, { tex: { ny: Tex.L('lamp'), side: Tex.L('plastic'), top: Tex.L('plastic') }, col: [1, 1, 1, 1] });
    Col.addBox(x - 0.15, z - 0.15, x + 0.15, z + 0.15, 5);
    lamps.push({ x, z: z + 0.85 });
  }
  // obecná budova (kvádr s texturou fasády + plochá/sedlová střecha)
  function building(x0, z0, x1, z1, h, tex, o = {}) {
    lo.box(x0, 0, z0, x1, h, z1, { tex: { side: Tex.L(tex), top: Tex.L(o.roofTex || 'gravel') }, uv: o.uvs || 1 / 3, col: o.col, skip: o.roof ? 'pyny' : 'ny' });
    if (o.roof) {
      const R = Tex.L('roof'), rh = o.roof, cz = (z0 + z1) / 2;
      lo.quad([x0 - 0.4, h, z1 + 0.4], [x1 + 0.4, h, z1 + 0.4], [x1 + 0.4, h + rh, cz], [x0 - 0.4, h + rh, cz], R, [x0, 6, x1, 6, x1, 0, x0, 0]);
      lo.quad([x1 + 0.4, h, z0 - 0.4], [x0 - 0.4, h, z0 - 0.4], [x0 - 0.4, h + rh, cz], [x1 + 0.4, h + rh, cz], R, [x0, 6, x1, 6, x1, 0, x0, 0]);
      lo.tri([x1, h, z1], [x1, h, z0], [x1, h + rh, cz], Tex.L(tex), o.col, [0, 0, 1, 0, 0.5, -0.5]);
      lo.tri([x0, h, z0], [x0, h, z1], [x0, h + rh, cz], Tex.L(tex), o.col, [0, 0, 1, 0, 0.5, -0.5]);
    }
    Col.addBox(x0, z0, x1, z1, h + (o.roof || 0));
  }
  function car(x, z, rot, hex, o = {}) {
    // stojící auto (statické), rot 0 = podél X
    const m = new MeshBuilder();
    carMesh(m, hex, o);
    const T = M4.create(); M4.translate(T, T, x, 0, z); M4.rotY(T, T, rot);
    // vložíme transformované vrcholy do lo
    appendTransformed(lo, m, T);
    const c = Math.abs(Math.cos(rot)) > 0.5;
    Col.addBox(x - (c ? 2.1 : 0.95), z - (c ? 0.95 : 2.1), x + (c ? 2.1 : 0.95), z + (c ? 0.95 : 2.1), 1.5);
  }
  function appendTransformed(dst, src, T) {
    const v = src.v, base = dst.n;
    for (let k = 0; k < v.length; k += 13) {
      const x = v[k], y = v[k + 1], z = v[k + 2], nx = v[k + 3], ny = v[k + 4], nz = v[k + 5];
      dst.v.push(T[0] * x + T[4] * y + T[8] * z + T[12], T[1] * x + T[5] * y + T[9] * z + T[13], T[2] * x + T[6] * y + T[10] * z + T[14],
        T[0] * nx + T[4] * ny + T[8] * nz, T[1] * nx + T[5] * ny + T[9] * nz, T[2] * nx + T[6] * ny + T[10] * nz,
        v[k + 6], v[k + 7], v[k + 8], v[k + 9], v[k + 10], v[k + 11], v[k + 12]);
    }
    for (const i of src.i) dst.i.push(i + base);
    dst.n += src.n;
  }
  // model auta (lokálně: délka podél X, střed v 0)
  function carMesh(m, hex, o = {}) {
    const col = C(hex), W1 = Tex.L('white'), G1 = Tex.L('car_glass');
    const L = o.long ? 2.8 : 2.05, Wd = 0.9;
    m.box(-L, 0.3, -Wd, L, 0.95, Wd, { tex: W1, col });
    if (o.van) {
      m.box(-L + 0.1, 0.95, -Wd + 0.02, L - 1.0, 2.2, Wd - 0.02, { tex: { side: Tex.L(o.sideTex || 'white'), top: W1 }, uv: 'fit', col: o.sideTex ? [1, 1, 1, 0] : col });
      m.box(L - 1.0, 0.95, -Wd + 0.05, L - 0.2, 1.75, Wd - 0.05, { tex: { px: G1, side: G1, top: W1 }, col: [1, 1, 1, 0] });
      m.box(-L + 0.4, 2.2, -0.35, -L + 1.0, 2.35, 0.35, { tex: Tex.L('lamp'), col: [0.3, 0.5, 1.4, 1] });
    } else {
      m.box(-L + 0.55, 0.95, -Wd + 0.08, L - 0.9, 1.55, Wd - 0.08, { tex: { side: G1, top: W1 }, col: [1, 1, 1, 0] });
      m.box(-L + 0.6, 1.5, -Wd + 0.1, L - 0.95, 1.58, Wd - 0.1, { tex: W1, col });
    }
    m.box(L - 0.02, 0.6, -Wd + 0.1, L + 0.02, 0.8, -Wd + 0.4, { tex: Tex.L('headlight'), col: [1, 1, 1, 1] });
    m.box(L - 0.02, 0.6, Wd - 0.4, L + 0.02, 0.8, Wd - 0.1, { tex: Tex.L('headlight'), col: [1, 1, 1, 1] });
    m.box(-L - 0.02, 0.62, -Wd + 0.1, -L + 0.02, 0.8, -Wd + 0.35, { tex: Tex.L('taillight'), col: [1, 1, 1, 0.6] });
    m.box(-L - 0.02, 0.62, Wd - 0.35, -L + 0.02, 0.8, Wd - 0.1, { tex: Tex.L('taillight'), col: [1, 1, 1, 0.6] });
    m.box(L - 0.04, 0.38, -0.32, L + 0.03, 0.52, 0.32, { tex: Tex.L('plate'), uv: 'fit', uvr: [0, 0, 1, 0.235] });
    m.box(-L - 0.03, 0.38, -0.32, -L + 0.04, 0.52, 0.32, { tex: Tex.L('plate'), uv: 'fit', uvr: [0, 0, 1, 0.235] });
    for (const wx of [L - 0.65, -L + 0.65]) for (const wz of [-Wd, Wd]) m.box(wx - 0.34, 0, wz - 0.13, wx + 0.34, 0.68, wz + 0.13, { tex: { side: Tex.L('black'), pz: Tex.L('tire'), nz: Tex.L('tire') }, uv: 'fit' });
  }

  function buildOutdoor() {
    const GR = Tex.L('grass'), AS = Tex.L('asphalt'), SW = Tex.L('sidewalk'), WH = Tex.L('white');
    lo.floor(-110, -110, 160, 110, -0.06, GR);
    // silnice + čáry
    for (const r of ROADS) lo.floor(r.x0, r.z0, r.x1, r.z1, 0.02, AS);
    const dash = (x0, z0, x1, z1, along) => {
      if (along === 'x') for (let x = x0; x < x1; x += 4) lo.floor(x, z0, Math.min(x + 2, x1), z1, 0.035, WH, { col: [0.95, 0.95, 0.9, 0] });
      else for (let z = z0; z < z1; z += 4) lo.floor(x0, z, x1, Math.min(z + 2, z1), 0.035, WH, { col: [0.95, 0.95, 0.9, 0] });
    };
    dash(-87, 28.9, 60, 29.1, 'x'); dash(-87, -41.1, 60, -40.9, 'x'); dash(-91.1, -37, -90.9, 25, 'z');
    dash(62.9, -110, 63.1, 110, 'z'); dash(76.9, -110, 77.1, 110, 'z');
    // přechody
    const zebra = (x0, z0, x1, z1, along) => { if (along === 'x') for (let x = x0; x < x1; x += 1) lo.floor(x, z0, x + 0.5, z1, 0.036, WH); else for (let z = z0; z < z1; z += 1) lo.floor(x0, z, x1, z + 0.5, 0.036, WH); };
    zebra(60, -3, 80, 1, 'z');
    zebra(-1, 25, 3, 33, 'x');
    // chodníky
    const SWs = [[-95, 23, 58, 25], [-95, 33, 60, 35], [-95, -47, 60, -45], [-87, -37, 58, -35], [-87, -35, -85, 23], [-97, -47, -95, 35], [58, -110, 60, 110], [80, -110, 82, 110]];
    for (const s of SWs) lo.floor(s[0], s[1], s[2], s[3], 0.04, SW);
    // cesta ke vchodu + kolem budovy
    lo.floor(-1, BZ1 + 2.2, 2.6, 23, 0.04, SW);
    lo.floor(BX0 - 1.5, BZ0 - 1.5, BX1 + 1.5, BZ0, 0.03, Tex.L('gravel'));
    lo.floor(BX1, BZ0 - 1.5, BX1 + 1.5, BZ1 + 1.5, 0.03, Tex.L('gravel'));
    lo.floor(BX0 - 1.5, BZ0 - 1.5, BX0, BZ1 + 1.5, 0.03, Tex.L('gravel'));
    lo.floor(BX1 + 1.5, -0.5, 58, 1.5, 0.04, SW);   // od bočního vchodu ke Klatovské
    lo.floor(-34, -0.5, BX0 - 1.5, 1.5, 0.04, SW);  // k parkovišti
    // tramvajová trať (zatravněná) se dvěma kolejemi
    lo.floor(66, -110, 74, 110, 0.015, GR, { col: [0.85, 1, 0.85, 0] });
    for (const tx of [68.3, 71.7]) {
      for (let z = -110; z < 110; z += 0.9) lo.box(tx - 1.1, 0, z, tx + 1.1, 0.06, z + 0.3, { tex: Tex.L('sleeper'), skip: 'ny' });
      for (const rx of [-0.72, 0.72]) lo.box(tx + rx - 0.05, 0, -110, tx + rx + 0.05, 0.14, 110, { tex: Tex.L('rail'), skip: 'ny' });
    }
    // trakční stožáry
    for (let z = -105; z < 110; z += 30) { lo.cyl(70, z, 0.12, 0, 6.6, Tex.L('metal'), { n: 6 }); lo.box(67.5, 6.4, z - 0.05, 72.5, 6.5, z + 0.05, { tex: Tex.L('metal') }); Col.addBox(69.8, z - 0.2, 70.2, z + 0.2, 6); }
    for (const tx of [68.3, 71.7]) lo.box(tx - 0.015, 6.2, -110, tx + 0.015, 6.23, 110, { tex: Tex.L('black'), skip: 'ny' });
    // zastávka Borský park
    for (const [px0, px1, sx] of [[66.1, 67.05, 66.3], [72.95, 73.9, 73.7]]) {
      lo.box(px0, 0, -14, px1, 0.25, 10, { tex: { top: SW, side: Tex.L('curb') } });
      lo.box(sx - 0.15, 0.25, -6, sx + 0.15, 2.6, -2, { tex: Tex.L('plastic'), skip: 'ny' });
      fol.wall(sx, -6, sx, -2, 0.25, 2.5, Tex.L('glass'), { uv: 'fit', double: true });
      lo.box(sx - 0.6, 2.6, -6.2, sx + 0.6, 2.7, -1.8, { tex: Tex.L('plastic') });
      Col.addBox(sx - 0.2, -6, sx + 0.2, -2, 2.6);
    }
    lo.box(66.4, 0.25, 4.0, 66.5, 2.4, 4.1, { tex: Tex.L('metal') });
    lo.box(66.15, 1.6, 3.6, 66.45, 2.5, 4.5, { tex: { side: Tex.L('sign_stop'), top: Tex.L('metal') }, uv: 'fit' });
    I('tramstop', 65.6, 4, 'Zastávka');

    // --- Parkoviště (západně od školy)
    lo.floor(-52, -8, -34, 20, 0.02, AS);
    for (let z = -6; z <= 18; z += 2.6) { lo.floor(-52, z - 0.05, -47, z + 0.05, 0.035, WH); lo.floor(-39, z - 0.05, -34, z + 0.05, 0.035, WH); }
    car(-49.5, -4.7, 0, '#c4222b'); car(-49.5, 0.5, 0, '#2a6bd1'); car(-36.5, 3.1, Math.PI, '#e5e5e5'); car(-49.5, 13.5, 0, '#ffcf3f'); car(-36.5, 10.9, Math.PI, '#3d3d3d');
    lo.floor(-52, 20, -48, 25, 0.02, AS);
    // --- Záchranka (ZZS)
    building(-80, -30, -58, -12, 8, 'zzs_wall', { uvs: 1 / 4 });
    for (let k = 0; k < 3; k++) lo.wall(-77 + k * 6, -11.98, -73 + k * 6, -11.98, 0, 3.6, Tex.L('garage'), { uv: 'fit' });
    lo.wall(-78, -11.97, -60, -11.97, 5.6, 7.4, Tex.L('sign_zzs'), { uv: 'fit', uvr: [0, 0, 1, 0.34] });
    lo.floor(-80, -12, -58, -2, 0.02, AS);
    { const m = new MeshBuilder(); carMesh(m, '#f6f6f0', { van: true, long: true, sideTex: 'ambulance' }); const T = M4.create(); M4.translate(T, T, -67, 0, -5); M4.rotY(T, T, 0.15); appendTransformed(lo, m, T); Col.addBox(-70, -6.3, -64, -3.7, 2.4); }
    I('ambulance', -67, -2.6, 'Záchranka');
    // --- Hřiště za školou
    lo.floor(-22, -32, 2, -16, 0.03, Tex.L('court'));
    const line = (x0, z0, x1, z1) => lo.floor(x0, z0, x1, z1, 0.04, WH);
    line(-22, -32, 2, -31.9); line(-22, -16.1, 2, -16); line(-22, -32, -21.9, -16); line(1.9, -32, 2, -16); line(-10.05, -32, -9.95, -16);
    for (const hx of [-21, 1]) { lo.box(hx - 0.08, 0, -24.1, hx + 0.08, 3.0, -23.9, { tex: Tex.L('metal') }); lo.box(hx - 0.05, 2.6, -24.6, hx + 0.05, 3.5, -23.4, { tex: Tex.L('white') }); Col.addBox(hx - 0.15, -24.2, hx + 0.15, -23.8, 3); }
    // --- Úřad práce (přes Kaplířovu)
    building(-5, -80, 35, -55, 10.5, 'office', { uvs: 1 / 3.5 });
    lo.wall(5, -54.98, 25, -54.98, 7.8, 9.8, Tex.L('sign_urad'), { uv: 'fit', uvr: [0, 0, 1, 0.34] });
    lo.wall(13, -54.97, 17, -54.97, 0, 2.6, Tex.L('door_out'), { uv: 'fit' });
    lo.floor(10, -55, 20, -47, 0.04, SW);
    I('urad', 15, -54, 'Úřad práce', 2.2);
    // balíkobox
    lo.box(28, 0, -54, 31, 2.1, -53.2, { tex: { pz: Tex.L('parcelbox'), side: Tex.L('plastic') }, uv: 'fit' });
    Col.addBox(28, -54, 31, -53.2, 2.1); I('parcelbox', 29.5, -52.4, 'Balíkobox');
    // --- paneláky a domy
    building(-92, -105, -52, -62, 15, 'panel', { uvs: 1 / 3 }); building(-45, -100, -15, -82, 12, 'panel', { uvs: 1 / 3, col: [1, 0.92, 0.85, 0] });
    building(40, -100, 56, -60, 12, 'panel_red', { uvs: 1 / 3 });
    building(-60, 40, -22, 62, 10, 'office', { uvs: 1 / 3.3, col: [1, 0.85, 1, 0] });
    lo.wall(-32, 39.98, -50, 39.98, 7.2, 9.2, Tex.L('sign_hotel'), { uv: 'fit', uvr: [0, 0, 1, 0.34] });
    for (let k = 0; k < 4; k++) for (let m = 0; m < 2; m++) building(-10 + k * 16, 42 + m * 18, -10 + k * 16 + 11, 42 + m * 18 + 9, 6, 'panel_red', { uvs: 1 / 3, roof: 3.2, col: [1, 1 - m * 0.05, 0.95, 0] });
    building(-92, 42, -70, 100, 15, 'panel', { uvs: 1 / 3 });
    building(-20, 75, 55, 100, 15, 'panel', { uvs: 1 / 3, col: [0.95, 0.95, 1.05, 0] });
    // --- Borský park
    lo.floor(84, -108, 158, 108, 0.012, GR, { col: [0.92, 1.05, 0.9, 0] });
    lo.floor(82, -2, 158, 2, 0.03, Tex.L('dirt'));
    lo.floor(110, -108, 114, 108, 0.03, Tex.L('dirt'));
    lo.floor(82, 70, 158, 73, 0.03, Tex.L('dirt'));
    lo.wall(84.5, -6, 84.5, -9, 1.0, 2.0, Tex.L('sign_park'), { uv: 'fit', uvr: [0, 0, 1, 0.34], double: true });
    lo.box(84.45, 0, -7.6, 84.55, 1.0, -7.4, { tex: Tex.L('wood_dark') });
    // tenisové kurty
    for (let k = 0; k < 2; k++) {
      const x0 = 120 + k * 20, z0 = 30, x1 = x0 + 16, z1 = z0 + 34;
      lo.floor(x0, z0, x1, z1, 0.03, Tex.L('clay'));
      line(x0 + 2, z0 + 3, x1 - 2, z0 + 3.1); line(x0 + 2, z1 - 3.1, x1 - 2, z1 - 3); line(x0 + 2, z0 + 3, x0 + 2.1, z1 - 3); line(x1 - 2.1, z0 + 3, x1 - 2, z1 - 3); line(x0 + 7.95, z0 + 9, x0 + 8.05, z1 - 9);
      line(x0 + 2, z0 + 9, x1 - 2, z0 + 9.1); line(x0 + 2, z1 - 9.1, x1 - 2, z1 - 9);
      fol.wall(x0 + 1, (z0 + z1) / 2, x1 - 1, (z0 + z1) / 2, 0, 1.0, Tex.L('net'), { uv: 1, double: true });
      fol.wall(x0, z0, x0, z1, 0, 3, Tex.L('fence'), { uv: 1, double: true }); fol.wall(x1, z1, x1, z0, 0, 3, Tex.L('fence'), { uv: 1, double: true });
      fol.wall(x1, z0, x0, z0, 0, 3, Tex.L('fence'), { uv: 1, double: true }); fol.wall(x0, z1, x1, z1, 0, 3, Tex.L('fence'), { uv: 1, double: true });
      Col.addBox(x0 - 0.1, z0, x0 + 0.1, z1, 3); Col.addBox(x1 - 0.1, z0, x1 + 0.1, z1, 3); Col.addBox(x0, z0 - 0.1, x1, z0 + 0.1, 3); Col.addBox(x0, z1 - 0.1, x1 - 4, z1 + 0.1, 3);
    }
    lo.wall(121, 29.9, 133, 29.9, 2.0, 3.0, Tex.L('sign_tennis'), { uv: 'fit', uvr: [0, 0, 1, 0.34], double: true });
    // lavičky v parku
    for (const [bx, bz] of [[90, 6], [100, -6], [118, 6], [118, -6], [95, 75]]) { lo.box(bx - 1, 0.42, bz - 0.25, bx + 1, 0.5, bz + 0.25, { tex: Tex.L('wood') }); lo.box(bx - 1, 0.5, bz + 0.2, bx + 1, 0.95, bz + 0.27, { tex: Tex.L('wood') }); Col.addBox(bx - 1, bz - 0.25, bx + 1, bz + 0.27, 0.6); }
    I('parkbench', 90, 5, 'Lavička v parku');

    // --- školní pozemek: živý plot, lavičky, cedule
    for (const [a, b] of [[-90, -3], [4, 56]]) { lo.box(a, 0, 21.4, b, 1.1, 22.4, { tex: Tex.L('hedge'), uv: 0.5 }); Col.addBox(a, 21.4, b, 22.4, 1.1); }
    lo.box(-7, 0, 19, -3.5, 1.0, 19.8, { tex: { side: Tex.L('plinth'), top: Tex.L('plinth') } });
    lo.wall(-7, 19.81, -3.5, 19.81, 0.15, 0.95, Tex.L('logo_infis'), { uv: 'fit', uvr: [0, 0.15, 1, 0.75] });
    Col.addBox(-7, 19, -3.5, 19.8, 1); I('sign', -5.2, 20.5, 'Cedule INFIS');
    for (const bx of [8, 13]) { lo.box(bx - 0.9, 0.42, 16, bx + 0.9, 0.5, 16.45, { tex: Tex.L('wood') }); lo.box(bx - 0.9, 0.5, 16.4, bx + 0.9, 0.95, 16.48, { tex: Tex.L('wood') }); Col.addBox(bx - 0.9, 16, bx + 0.9, 16.48, 0.6); }
    // stojan na kola
    for (let k = 0; k < 6; k++) lo.box(18 + k * 0.6, 0, 13, 18.05 + k * 0.6, 0.8, 13.9, { tex: Tex.L('metal') });
    Col.addBox(18, 13, 21.5, 13.9, 0.8); I('bikes', 19.7, 14.6, 'Stojan na kola');
    // koše
    for (const [tx, tz] of [[-2, 18], [4, 22.8], [57, 2.5]]) { lo.cyl(tx, tz, 0.3, 0, 0.9, Tex.L('plastic'), { n: 8, cap: true }); Col.addBox(tx - 0.3, tz - 0.3, tx + 0.3, tz + 0.3, 0.9); }
    I('trash', -2, 18.8, 'Koš');

    // --- stromy (deterministicky rozházené)
    const rnd = U.rng(424242);
    const fixed = [[-20, 15, 'tree', 1.2], [-12, 16.5, 'pine', 1.1], [14, 17.5, 'pine', 1.2], [24, 15, 'tree', 1.1], [36, 14, 'tree', 1.0], [-38, 22.5, 'tree', 1],
      [-28, -20, 'tree', 1.2], [10, -24, 'tree', 1.1], [24, -22, 'pine', 1.2], [40, -18, 'tree', 1], [-40, -24, 'pine', 1.1], [45, 5, 'tree', 1.1], [50, -10, 'pine', 1.1]];
    for (const [x, z, k, s] of fixed) tree(x, z, k, s);
    const freeSpot = (x, z, m) => !onRoad(x, z, m) && Col.heightAt(x, z) === 0 && Col.heightAt(x + 2, z) === 0 && Col.heightAt(x - 2, z) === 0 && Col.heightAt(x, z + 2) === 0 && Col.heightAt(x, z - 2) === 0 && !(x > BX0 - 4 && x < BX1 + 4 && z > BZ0 - 4 && z < BZ1 + 14);
    let placed = 0;
    for (let k = 0; k < 900 && placed < 140; k++) {
      const x = -105 + rnd() * 260, z = -105 + rnd() * 210;
      const inPark = x > 84;
      if (!inPark && rnd() < 0.55) continue;
      if (inPark && ((x > 108 && x < 116) || (z > -4 && z < 4) || (x > 116 && x < 160 && z > 26 && z < 68) || (z > 68 && z < 75))) continue;
      if (x > -54 && x < -32 && z > -10 && z < 22) continue;
      if (!freeSpot(x, z, 3)) continue;
      tree(x, z, rnd() < 0.3 ? 'pine' : 'tree', 0.85 + rnd() * 0.5); placed++;
    }
    // lampy
    for (let x = -80; x <= 50; x += 22) { lamp(x, 23.6); lamp(x + 11, -46.5); }
    for (let z = -100; z <= 100; z += 24) lamp(58.6, z);
    for (let z = -96; z <= 96; z += 24) lamp(81.4, z);
    lamp(-6, 14); lamp(8, 14.5);
    // hranice světa
    Col.addBox(-110, -110, -104, 110, 20); Col.addBox(154, -110, 160, 110, 20); Col.addBox(-110, -110, 160, -104, 20); Col.addBox(-110, 104, 160, 110, 20);
  }

  // ---------------------------------------------------------
  //  výzdoba podle ročníku (samostatný mesh, mění se)
  // ---------------------------------------------------------
  function buildYear(y, examOpen) {
    const m = new MeshBuilder(), f = new MeshBuilder();
    const R = ROOMS;
    // dveře maturitního sálu: zavřené do 4. ročníku
    Col.removeExtra('examdoor');
    if (y < 4 || !examOpen) {
      const xa = BX0 + R.exam.door[0], xb = BX0 + R.exam.door[1] + 1, zc = BZ0 + 12;
      m.box(xa + 0.02, 0, zc + 0.45, (xa + xb) / 2, 2.3, zc + 0.55, { tex: { pz: Tex.L('door_in'), nz: Tex.L('door_in'), side: Tex.L('wood') }, uv: 'fit' });
      m.box((xa + xb) / 2, 0, zc + 0.45, xb - 0.02, 2.3, zc + 0.55, { tex: { pz: Tex.L('door_in'), nz: Tex.L('door_in'), side: Tex.L('wood') }, uv: 'fit' });
      Col.addExtra({ id: 'examdoor', x0: xa, z0: zc, x1: xb, z1: zc + 1, h: 3 });
    }
    const corrBanner = (x, tex, w = 1.6) => { // visící banner přes chodbu
      f.wall(x - w / 2, 0.5, x + w / 2, 0.5, 2.3, 2.95, Tex.L(tex), { uv: 'fit', double: true });
    };
    if (y === 1) {
      corrBanner(-15, 'poster_welcome', 1.2); corrBanner(15, 'poster_welcome', 1.2);
      // balónky v hale
      for (const [bx, bz, c] of [[-4, 3.5, '#ff4d4d'], [-3.6, 3.7, '#ffcf3f'], [5.5, 3.4, '#2a6bd1']]) { m.box(bx - 0.2, 2.2, bz - 0.2, bx + 0.2, 2.65, bz + 0.2, { tex: Tex.L('white'), col: C(c) }); m.box(bx - 0.01, 1.2, bz - 0.01, bx + 0.01, 2.2, bz + 0.01, { tex: Tex.L('white') }); }
    }
    if (y === 2) {
      // vánoční stromek v hale + vlajky na chodbě
      const tx = 5.4, tz = 7.5;
      m.box(tx - 0.4, 0, tz - 0.4, tx + 0.4, 0.4, tz + 0.4, { tex: Tex.L('fabric') });
      for (let k = 0; k < 4; k++) { const w = 1.0 - k * 0.22, yy = 0.4 + k * 0.55; f.box(tx - w, yy, tz - w, tx + w, yy + 0.7, tz + w, { tex: Tex.L('pine'), uv: 0.5 }); }
      for (let k = 0; k < 14; k++) { const a = k * 2.4, rr = 0.9 - (k / 14) * 0.7, yy = 0.6 + k * 0.15; m.box(tx + Math.cos(a) * rr - 0.06, yy, tz + Math.sin(a) * rr - 0.06, tx + Math.cos(a) * rr + 0.06, yy + 0.12, tz + Math.sin(a) * rr + 0.06, { tex: Tex.L('white'), col: C(['#ff4d4d', '#ffcf3f', '#4da6ff'][k % 3], 1) }); }
      m.box(tx - 0.12, 2.6, tz - 0.12, tx + 0.12, 2.85, tz + 0.12, { tex: Tex.L('white'), col: C('#ffcf3f', 1) });
      Col.addExtra({ id: 'xmas', x0: tx - 1, z0: tz - 1, x1: tx + 1, z1: tz + 1, h: 2.5 });
      for (let x = -26; x < 28; x += 3.5) f.wall(x, 0.5, x + 0.5, 0.5, 2.45, 2.85, Tex.L(['flag_uk', 'flag_de', 'flag_cz'][Math.abs(Math.round(x)) % 3]), { uv: 'fit', double: true });
      corrBanner(-8, 'board_lang', 1.0);
    } else Col.removeExtra('xmas');
    if (y === 3) {
      // Excel všude: zelené buňky na podlaze chodby, plakáty
      const rnd = U.rng(77);
      for (let k = 0; k < 60; k++) { const x = -29 + rnd() * 57, z = -0.9 + rnd() * 2.7; m.floor(x, z, x + 0.5, z + 0.25, 0.012, Tex.L('excel_cell'), { uv: 'fit' }); }
      corrBanner(-20, 'poster_excel', 1.2); corrBanner(0, 'poster_chart', 1.2); corrBanner(20, 'poster_excel', 1.2);
      // dýně
      for (const [px, pz] of [[-3, 7.8], [4.6, 8.0]]) m.box(px - 0.25, 0, pz - 0.25, px + 0.25, 0.4, pz + 0.25, { tex: Tex.L('white'), col: C('#e67e22') });
    }
    if (y === 4) {
      corrBanner(-22, 'poster_maturita', 1.2); corrBanner(-5, 'poster_maturita', 1.2); corrBanner(12, 'poster_maturita', 1.2);
      // výstražná světla
      for (let x = -26; x < 28; x += 8) m.box(x - 0.15, 3.0, 0.3, x + 0.15, 3.19, 0.7, { tex: Tex.L('white'), col: C('#ff2a2a', 1) });
      // papíry na podlaze
      const rnd = U.rng(99);
      for (let k = 0; k < 70; k++) { const x = -29 + rnd() * 57, z = -0.9 + rnd() * 2.7, a = rnd() * 3; const c = Math.cos(a) * 0.2, s = Math.sin(a) * 0.2; m.quad([x - c, 0.012, z - s], [x + s, 0.012, z - c], [x + c, 0.012, z + s], [x - s, 0.012, z + c], Tex.L('page'), [0, 1, 1, 1, 1, 0, 0, 0]); }
      // červený koberec do maturitního sálu
      m.floor(BX0 + R.exam.door[0], -0.8, BX0 + R.exam.door[1] + 1, 3, 0.011, Tex.L('white'), { col: C('#a31616') });
    }
    if (meshes.year) GFX.deleteMesh(meshes.year);
    if (meshes.yearF) GFX.deleteMesh(meshes.yearF);
    meshes.year = m.n ? m.build() : null;
    meshes.yearF = f.n ? f.build() : null;
  }

  // ---------------------------------------------------------
  function build() {
    buildGrid();
    lo = new MeshBuilder(); hiM = new MeshBuilder(); fol = new MeshBuilder();
    buildBuilding();
    furnish();
    buildOutdoor();
    meshes.lo = lo.build(); meshes.hi = hiM.build(); meshes.fol = fol.build();
    console.log('World tris:', (lo.indexCount + hiM.indexCount + fol.indexCount) / 3);
  }
  function draw(opts) {
    GFX.submit(meshes.lo, null);
    if (!opts.dollhouse) GFX.submit(meshes.hi, null);
    else GFX.submit(meshes.hi, null, 0, -1, { shadow: true, cull: true, tint: null, hideMain: true });
    GFX.submit(meshes.fol, null, 0, -1, { cull: false });
    if (meshes.year) GFX.submit(meshes.year, null);
    if (meshes.yearF) GFX.submit(meshes.yearF, null, 0, -1, { cull: false });
  }

  return {
    build, buildYear, draw, roomAt, inside, ROOMS, interact, lamps, treePos, carMesh, appendTransformed, onRoad,
    BX0, BX1, BZ0, BZ1, CEIL, TOP, meshes,
  };
})();
