'use strict';
// =============================================================
//  tools/bot.js — testovací "autopilot" (načte se jen s ?debug=1).
//  Umí projít dialogy a doběhnout k cíli (BFS po kolizní mřížce).
//  V konzoli: await Bot.playAll()  → projde celou hru.
// =============================================================
window.Bot = (() => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  function skip(choice = 'Digit1') { for (let i = 0; i < 60 && Dialogue.active; i++) { __step(30); __tap('KeyE'); __step(2); __tap(choice); __step(2); } }
  function path(tx, tz) {
    const R = 0.5, P = G.player, key = (i, j) => i + ',' + j;
    const si = Math.round(P.x / R), sj = Math.round(P.z / R), ti = Math.round(tx / R), tj = Math.round(tz / R);
    const q = [[si, sj]], prev = {}; prev[key(si, sj)] = null; let qi = 0;
    const B = Arena.active ? Arena.active.bounds : null; let found = null, n = 0;
    while (qi < q.length && n < 60000) {
      n++; const [i, j] = q[qi++];
      if (Math.abs(i - ti) <= 2 && Math.abs(j - tj) <= 2) { found = [i, j]; break; }
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = i + a, nj = j + b, k = key(ni, nj); if (k in prev) continue;
        const x = ni * R, z = nj * R;
        if (B && (x < B.x0 + 0.3 || x > B.x1 - 0.3 || z < B.z0 + 0.3 || z > B.z1 - 0.3)) continue;
        if (Col.hitCircle(x, z, 0.32)) continue;
        prev[k] = [i, j]; q.push([ni, nj]);
      }
    }
    if (!found) return null;
    const out = []; let c = found; while (c) { out.unshift({ x: c[0] * R, z: c[1] * R }); c = prev[key(c[0], c[1])]; }
    return out;
  }
  // pohyb: v aréně je kamera pevná (W = sever), jinak natočíme kameru na sever
  function goTo(getT, maxSteps = 900, tol = 0.6) {
    let s = 0, p = null, pi = 0, re = 0; const startArena = Arena.active;
    for (; s < maxSteps; s++) {
      if (Dialogue.active) skip();
      if (Arena.active !== startArena) break;
      const t = getT(); if (!t) break;
      window.__bot = true;
      if (!p || re <= 0) {
        p = path(t.x, t.z); re = 30;
        if (!p) { Bot.unreachable.push(`${t.id || '?'} @${t.x.toFixed(1)},${t.z.toFixed(1)} from ${G.player.x.toFixed(1)},${G.player.z.toFixed(1)}`); G.teleport(t.x + 0.9, t.z + 0.9); p = [t]; }
        p.push({ x: t.x, z: t.z }); // poslední krok přímo na cíl
        pi = Math.min(1, p.length - 1);
      }
      re--;
      let w = p[pi];
      while (pi < p.length - 1 && Math.hypot(w.x - G.player.x, w.z - G.player.z) < 0.4) { pi++; w = p[pi]; }
      const dx = w.x - G.player.x, dz = w.z - G.player.z;
      __key('KeyD', dx > 0.15); __key('KeyA', dx < -0.15); __key('KeyS', dz > 0.15); __key('KeyW', dz < -0.15); __key('ShiftLeft', true);
      __step(1);
      if (t.stop && Math.hypot(t.x - G.player.x, t.z - G.player.z) < tol) break;
    }
    ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft'].forEach(k => __key(k, false));
    return s;
  }
  const nearestPickup = () => { const A = Arena.active; if (!A || A.winT) return null; const e = Ents.list.filter(e => e.tag === 'arena' && e.kind === 'pickup').sort((a, b) => Math.hypot(a.x - G.player.x, a.z - G.player.z) - Math.hypot(b.x - G.player.x, b.z - G.player.z))[0]; return e || { x: G.player.x, z: G.player.z }; };
  function talkTo(id) {
    const n = G.npcs.find(n => n.id === id && !n.temp) || G.npcs.find(n => n.id === id);
    if (!n) return false;
    goTo(() => ({ x: n.x, z: n.z, id, stop: true }), 1500, 1.4);
    __step(2); __tap('KeyE'); __step(3);
    return Dialogue.active;
  }
  function finishArena(max = 9000) {
    const A = Arena.active; if (!A) return 0;
    let n = 0;
    while (Arena.active && n < max) {
      const a = Arena.active, d = a.data;
      let t;
      if (d.exit && (d.load === undefined || d.load >= 1)) t = d.exit;
      else if (a.def.title === 'JAZYKOVÝ CHAOS' || a.def.title.startsWith('MATEMATIKA')) t = { x: (a.bounds.x0 + a.bounds.x1) / 2 + Math.sin(n / 20) * 2, z: (a.bounds.z0 + a.bounds.z1) / 2 };
      else t = nearestPickup() || { x: G.player.x, z: G.player.z };
      goTo(() => t, 20);
      n += 20;
      if (Dialogue.active) skip();
    }
    __step(10);
    return n;
  }
  async function playAll() {
    window.__noRender = true;
    const log = [];
    const L = (m) => { log.push(`[${U.fmtTime(G.time)}] Y${G.year} ${m}`); };
    for (let guard = 0; guard < 40 && G.state === 'play'; guard++) {
      skip();
      const o = G.objectives.find(o => !o.done && (!o.optional || o.id === 'olga'));
      if (!o) { await wait(1500); __step(10); if (!document.getElementById('yearcard').classList.contains('hidden')) await wait(3200); __step(10); continue; }
      L('úkol ' + o.id); window.__botStatus = 'Y' + G.year + ' ' + o.id;
      if (o.id === 'nagr') {
        talkTo('nagr'); skip();
        for (const id of ['g_door', 'g_vend', 'g_kuba']) {
          const it = () => G.extraInteract.find(i => i.id === id);
          if (!it()) continue;
          goTo(() => { const i = it(); if (!i) return null; return { x: i.npcRef ? i.npcRef.x : i.x, z: i.npcRef ? i.npcRef.z : i.z, stop: true }; }, 1500, 1.0);
          __tap('KeyE'); __step(3); skip();
        }
        talkTo('nagr'); skip();
      } else if (o.id === 'olga') {
        const R = World.ROOMS.r404;
        goTo(() => ({ x: R.cx, z: R.cz, stop: true }), 1500, 0.8);
        await wait(200); for (let i = 0; i < 50 && !Arena.active; i++) { __step(10); skip(); }
        finishArena(); skip();
      } else if (o.id === 'maturita') {
        const R = World.ROOMS.exam;
        goTo(() => ({ x: R.cx, z: R.z0 + 1.5, stop: true }), 2500, 0.8);
        skip(); __step(20);
        L('finále: ' + (Arena.active ? Arena.active.def.title : 'nic'));
        finishArena(9000); skip(); __step(30); skip();
        break;
      } else {
        talkTo(o.npc); skip();
        if (MiniGames.QTE.active) { for (const k of ['KeyU', 'KeyS', 'KeyP']) { __tap(k); __step(3); } }
        if (Arena.active) { L('aréna ' + Arena.active.def.title); finishArena(); skip(); }
      }
      __step(5);
      await wait(30);
    }
    window.__noRender = false;
    L('KONEC: stav=' + G.state + ' zásahy=' + G.stats.hits);
    return log;
  }
  const unreachable = [];
  return { skip, path, goTo, talkTo, finishArena, playAll, unreachable };
})();
