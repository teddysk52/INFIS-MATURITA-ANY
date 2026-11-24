'use strict';
// =============================================================
//  arenas.js — systém mini-her ("arény") + zvláštní světy:
//  kniha (Janda), Excel dimenze (Prynych), kyber-sál (finále).
// =============================================================
const Arena = (() => {
  let A = null;

  // ---------------- zvláštní světy ----------------
  const WORLDS = {
    book: { ox: 300, oz: 0, x0: 284, x1: 316, z0: -10, z1: 10, env: 'book' },
    excel: { ox: 400, oz: 0, x0: 382, x1: 418, z0: -13, z1: 13, env: 'excel' },
    boss: { ox: 500, oz: 0, x0: 484, x1: 516, z0: -16, z1: 16, env: 'boss' },
  };
  const meshes = {};
  let cellBox = null, excelBoss = null;

  function buildStatic() {
    // --- Excel dimenze
    {
      const w = WORLDS.excel, m = new MeshBuilder();
      m.floor(w.x0, w.z0, w.x1, w.z1, 0, Tex.L('excel_floor'), { uv: 1 / 8 });
      // záhlaví sloupců a řádků
      m.box(w.x0 - 2, 0, w.z0 - 2, w.x1, 0.4, w.z0, { tex: Tex.L('white'), col: [0.85, 0.9, 0.86, 0] });
      m.box(w.x0 - 2, 0, w.z0, w.x0, 0.4, w.z1, { tex: Tex.L('white'), col: [0.85, 0.9, 0.86, 0] });
      m.box(w.x0 - 2, 0, w.z1, w.x1 + 2, 1.5, w.z1 + 2, { tex: Tex.L('white'), col: [0.95, 0.98, 0.96, 0] });
      m.box(w.x1, 0, w.z0 - 2, w.x1 + 2, 6, w.z1 + 2, { tex: Tex.L('white'), col: [0.95, 0.98, 0.96, 0] });
      m.box(w.x0 - 4, 0, w.z0 - 4, w.x1 + 2, 6, w.z0 - 2, { tex: Tex.L('white'), col: [0.95, 0.98, 0.96, 0] });
      m.box(w.x0 - 4, 0, w.z0 - 2, w.x0 - 2, 6, w.z1 + 2, { tex: Tex.L('white'), col: [0.95, 0.98, 0.96, 0] });
      // zelený pruh nahoře (ribbon)
      m.wall(w.x0 - 2, w.z0 - 1.99, w.x1, w.z0 - 1.99, 4, 6, Tex.L('white'), { col: [0.13, 0.64, 0.4, 0.2] });
      meshes.excel = m.build();
      for (let i = 0; i < 18; i++) Spr.label('col_' + i, String.fromCharCode(65 + i), { size: 40, color: '#333', pad: 4 });
      for (let j = 1; j <= 26; j++) Spr.label('row_' + j, String(j), { size: 34, color: '#333', pad: 4 });
      const b = new MeshBuilder();
      b.box(-1, 0, -0.5, 1, 1.1, 0.5, { tex: Tex.L('excel_cell'), uv: 'fit' });
      cellBox = b.build();
      const e = new MeshBuilder();
      e.box(-2, -2, -2, 2, 2, 2, { tex: { pz: Tex.L('excel_logo'), side: Tex.L('excel_cell'), top: Tex.L('excel_cell') }, uv: 'fit', col: [1, 1, 1, 0.35] });
      excelBoss = e.build();
    }
    // --- kyber sál
    {
      const w = WORLDS.boss, m = new MeshBuilder();
      m.floor(w.x0, w.z0, w.x1, w.z1, 0, Tex.L('cyber_floor'), { uv: 1 / 4, col: [1, 1, 1, 0.6] });
      const H = 3;
      m.wall(w.x0, w.z1, w.x0, w.z0, 0, H, Tex.L('cyber_wall'), { uv: 1 / 3, col: [1, 1, 1, 0.8] });
      m.wall(w.x1, w.z0, w.x1, w.z1, 0, H, Tex.L('cyber_wall'), { uv: 1 / 3, col: [1, 1, 1, 0.8] });
      m.wall(w.x0, w.z0, w.x1, w.z0, 0, H, Tex.L('cyber_wall'), { uv: 1 / 3, col: [1, 1, 1, 0.8] });
      m.wall(w.x1, w.z1, w.x0, w.z1, 0, H, Tex.L('cyber_wall'), { uv: 1 / 3, col: [1, 1, 1, 0.8] });
      // kabely k bossovi
      for (let k = -3; k <= 3; k++) m.box(w.ox + k * 1.4 - 0.12, 6, w.z0 + 1.2, w.ox + k * 1.4 + 0.12, 30, w.z0 + 1.5, { tex: Tex.L('plastic') });
      // sloupy s daty
      for (const [px, pz] of [[-13, -13], [13, -13], [-13, 13], [13, 13]]) m.box(w.ox + px - 0.6, 0, pz - 0.6, w.ox + px + 0.6, 8, pz + 0.6, { tex: Tex.L('rack'), uv: 0.5, col: [1, 1, 1, 0.6] });
      meshes.boss = m.build();
    }
  }

  // --- kniha: bludiště se generuje pokaždé jinak
  function buildBook() {
    const w = WORLDS.book, m = new MeshBuilder();
    m.floor(w.x0 - 3, w.z0 - 3, w.x1 + 3, w.z1 + 3, 0, Tex.L('page'), { uv: 1 / 4 });
    m.floor(w.ox - 0.4, w.z0 - 3, w.ox + 0.4, w.z1 + 3, 0.01, Tex.L('white'), { col: [0.75, 0.68, 0.55, 0] });
    Col.removeExtra('book');
    const CW = 4, NX = 8, NZ = 5;
    const vis = [], wallsE = [], wallsS = [];
    for (let i = 0; i < NX; i++) { vis[i] = []; wallsE[i] = []; wallsS[i] = []; for (let j = 0; j < NZ; j++) { vis[i][j] = false; wallsE[i][j] = true; wallsS[i][j] = true; } }
    const stack = [[0, 2]]; vis[0][2] = true;
    while (stack.length) {
      const [i, j] = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b, a, b]).filter(([a, b]) => a >= 0 && b >= 0 && a < NX && b < NZ && !vis[a][b]);
      if (!nb.length) { stack.pop(); continue; }
      const [a, b, da, db] = U.pick(nb);
      if (da === 1) wallsE[i][j] = false; if (da === -1) wallsE[a][b] = false;
      if (db === 1) wallsS[i][j] = false; if (db === -1) wallsS[a][b] = false;
      vis[a][b] = true; stack.push([a, b]);
    }
    // pár zdí navíc odstraníme (víc cest = méně frustrace)
    for (let k = 0; k < 7; k++) { const i = U.randi(0, NX - 2), j = U.randi(0, NZ - 1); wallsE[i][j] = false; }
    const S = Tex.L('spines'), T = 0.35, H = 2.2;
    const wall = (x0, z0, x1, z1) => { m.box(x0, 0, z0, x1, H, z1, { tex: { side: S, top: Tex.L('wood_dark') }, uv: 0.5 }); Col.addExtra({ id: 'book', x0, z0, x1, z1, h: H }); };
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const x = w.x0 + i * CW, z = w.z0 + j * CW;
      if (wallsE[i][j] && i < NX - 1) wall(x + CW - T, z - T, x + CW + T, z + CW + T);
      if (wallsS[i][j] && j < NZ - 1) wall(x - T, z + CW - T, x + CW + T, z + CW + T);
    }
    // obvod (vchod vlevo uprostřed, východ vpravo)
    wall(w.x0 - 1, w.z0 - 1, w.x1 + 1, w.z0); wall(w.x0 - 1, w.z1, w.x1 + 1, w.z1 + 1);
    wall(w.x0 - 1, w.z0, w.x0, w.z1); wall(w.x1, w.z0, w.x1 + 1, w.z1);
    if (meshes.book) GFX.deleteMesh(meshes.book);
    meshes.book = m.build();
  }

  // ---------------- systém arén ----------------
  function start(def, onDone) {
    const P = Game.player;
    A = { def, t: 0, prog: 0, data: {}, onDone, done: false, winT: 0, title: def.title, hint: def.hint };
    if (def.world) {
      const w = WORLDS[def.world];
      A.world = w; A.back = { x: P.x, z: P.z, yaw: P.yaw };
      if (def.world === 'book') buildBook();
      A.bounds = { x0: w.x0, x1: w.x1, z0: w.z0, z1: w.z1 };
      Game.special = def.world;
    } else if (def.room) {
      const r = World.ROOMS[def.room];
      A.room = r; A.bounds = { x0: r.x0 + 0.2, x1: r.x1 - 0.2, z0: r.z0 + 0.2, z1: r.z1 - 0.2 };
    } else A.bounds = def.bounds || null;
    if (def.init) def.init(A);
    Sound.playMusic(def.music || 'arena');
    UI.arenaHud(true, A.title, A.hint, 0);
    Game.logAction('Mini-hra: ' + def.title);
  }
  function win(text, color = '#3cff7a', sub = '') {
    if (A.winT) return;
    A.winT = 1.8; A.won = true;
    UI.big(text, 1.8, color, sub);
    Sound.sfx.win();
    const P = Game.player; Ents.confetti(P.x, 2.5, P.z, 120, 5);
    Ents.clear('arena');
  }
  function update(dt) {
    if (!A) return;
    A.t += dt;
    if (A.winT) { A.winT -= dt; if (A.winT <= 0) finish(); return; }
    A.def.update(A, dt);
    UI.arenaHud(true, A.title, A.hint, A.prog);
  }
  function finish() {
    const a = A; A = null;
    Ents.clear('arena');
    Col.removeExtra('arena');
    UI.arenaHud(false);
    if (a.def.cleanup) a.def.cleanup(a);
    if (a.world) {
      Col.removeExtra('book');
      Game.special = null;
      Game.teleport(a.back.x, a.back.z, a.back.yaw);
    }
    Sound.playMusic(Game.musicFor());
    if (a.onDone) a.onDone(a);
  }
  function abort() { if (A) { const a = A; A = null; Ents.clear('arena'); Col.removeExtra('arena'); Col.removeExtra('book'); UI.arenaHud(false); if (a.world) Game.special = null; if (a.def.cleanup) a.def.cleanup(a); } }
  function draw() {
    if (Game.special === 'excel') GFX.submit(meshes.excel, null);
    if (Game.special === 'boss') GFX.submit(meshes.boss, null);
    if (Game.special === 'book' && meshes.book) GFX.submit(meshes.book, null);
    if (A && A.def.draw) A.def.draw(A);
  }
  function drawCell(x, z, sx = 1, sy = 1, rot = 0) {
    const m = GFX.mat(); M4.translate(m, m, x, 0, z); if (rot) M4.rotY(m, m, rot); M4.scale(m, m, sx, sy, 1);
    GFX.submit(cellBox, m);
  }
  function drawExcelBoss(x, y, z, t, hitT) {
    const m = GFX.mat(); M4.translate(m, m, x, y, z); M4.rotY(m, m, Math.sin(t * 0.7) * 0.3); M4.rotX(m, m, Math.sin(t * 1.3) * 0.08);
    GFX.submit(excelBoss, m, 0, -1, hitT > 0 ? { tint: [1, 1, 1, 0.6] } : null);
  }
  return { start, update, finish, abort, draw, win, buildStatic, WORLDS, drawCell, drawExcelBoss, get active() { return A; } };
})();
