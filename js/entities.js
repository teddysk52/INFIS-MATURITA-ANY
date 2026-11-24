'use strict';
// =============================================================
//  entities.js — létající věci ve světě: překážky, sběratelné
//  předměty, částice, konfety. Sdílí je mini-hry i MATURITRON.
// =============================================================
const Ents = (() => {
  const list = [];
  const parts = [];

  // e: { x,y,z, vx,vy,vz, spr, w,h, kind:'hazard'|'pickup'|'deco', r, life, tag, upd(e,dt), onPick(e), dmg, gravity, bounce, warn, spin, rot, col, bob }
  function add(e) {
    const d = Object.assign({ x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, w: 0.8, h: 0.8, r: 0.5, kind: 'deco', life: Infinity, t: 0, rot: 0, spin: 0, col: [1, 1, 1, 1], shadow: true, dmg: 2, tag: '' }, e);
    if (typeof d.spr === 'string') d.sprName = d.spr, d.spr = Spr.get(d.spr);
    if (d.spr && !e.h && e.w) d.h = d.w / d.spr.aspect;
    list.push(d); return d;
  }
  function clear(tag) { for (let k = list.length - 1; k >= 0; k--) if (!tag || list[k].tag === tag) list.splice(k, 1); }
  function count(tag, kind) { let n = 0; for (const e of list) if ((!tag || e.tag === tag) && (!kind || e.kind === kind)) n++; return n; }

  function update(dt, P) {
    for (let k = list.length - 1; k >= 0; k--) {
      const e = list[k];
      if (!e) continue; // seznam se mohl zmenšit (vyčištění během callbacku)
      e.t += dt;
      if (e.upd) e.upd(e, dt);
      if (e.gravity) e.vy -= e.gravity * dt;
      e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt;
      e.rot += e.spin * dt;
      if (e.floor !== undefined && e.y - e.h / 2 < e.floor) {
        e.y = e.floor + e.h / 2;
        if (e.bounce) e.vy = -e.vy * e.bounce; else { e.vy = 0; if (e.onLand) e.onLand(e); }
      }
      if (e.t >= e.life || e.dead) { const i = list.indexOf(e); if (i >= 0) list.splice(i, 1); continue; }
      // kolize s hráčem
      if (!P || e.kind === 'deco' || e.t < (e.armT || 0)) continue;
      const dx = e.x - P.x, dz = e.z - P.z;
      const reach = e.r + 0.35;
      if (dx * dx + dz * dz < reach * reach && Math.abs(e.y - (P.y + 0.9)) < e.h / 2 + 0.95) {
        if (e.kind === 'pickup') { list.splice(k, 1); if (e.onPick) e.onPick(e); }
        else if (e.kind === 'hazard') { if (Game.hurt(e.dmg, e)) { if (e.onHit) e.onHit(e); if (e.dieOnHit !== false) { const i = list.indexOf(e); if (i >= 0) list.splice(i, 1); } else e.cool = 1.8; } }
      }
    }
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k];
      p.t += dt; if (p.t >= p.life) { parts.splice(k, 1); continue; }
      p.vy -= (p.g || 0) * dt;
      p.vx *= Math.exp(-(p.drag || 0) * dt); p.vz *= Math.exp(-(p.drag || 0) * dt);
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < (p.floor || 0.02)) { p.y = p.floor || 0.02; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
      p.rot += (p.spin || 0) * dt;
    }
  }

  function draw() {
    const sh = Spr.get('shadow'), wr = Spr.get('warn');
    for (const e of list) {
      if (!e.spr || e.hidden) continue;
      const bob = e.bob ? Math.sin(e.t * 3 + e.x) * e.bob : 0;
      const col = e.flashT && (e.t * 20 | 0) % 2 ? [1, 0.4, 0.4, 1] : e.col;
      const sz = e.spr.smooth ? Math.max(e.w, e.h) * 1.35 : 0;
      GFX.sprite(e.spr, e.x, e.y + bob, e.z, sz || e.w, sz || e.h, col, e.rot, !!e.blend || !!e.spr.smooth, !!e.upright);
      if (e.shadow) {
        const gy = e.floor !== undefined ? e.floor : 0;
        const hgt = Math.max(0, e.y - gy);
        const s = Math.max(0.3, e.w * (1 - Math.min(0.6, hgt / 12)));
        GFX.decal(e.warn && e.vy < 0 ? wr : sh, e.x, (e.gy !== undefined ? e.gy : gy) + 0.03, e.z, e.warn ? Math.max(1, e.w * 1.2) : s, e.warn ? Math.max(1, e.w * 1.2) : s * 0.8, [1, 1, 1, e.warn ? 0.9 : 0.6]);
      }
    }
    const px = Spr.get('px');
    for (const p of parts) {
      const a = 1 - p.t / p.life;
      GFX.sprite(p.spr ? Spr.get(p.spr) : px, p.x, p.y, p.z, p.s, p.s * (p.ar || 1), [p.c[0], p.c[1], p.c[2], p.fade ? a : 1], p.rot, !!p.fade);
    }
  }

  // ---- částice
  function burst(x, y, z, hex, n = 16, o = {}) {
    const c = U.hex(hex);
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, sp = (o.speed || 4) * (0.4 + Math.random() * 0.8);
      parts.push({ x, y, z, vx: Math.cos(a) * sp, vy: (o.up || 3) + Math.random() * 3, vz: Math.sin(a) * sp, g: o.g === undefined ? 12 : o.g, life: (o.life || 0.8) * (0.6 + Math.random() * 0.8), t: 0, s: o.size || 0.12, c, drag: 1, rot: 0, spin: 0, floor: o.floor });
    }
  }
  const CONF = ['#ff4d4d', '#ffcf3f', '#3cff7a', '#4da6ff', '#ff7a1c', '#e6b3ff', '#ffffff'];
  function confetti(x, y, z, n = 80, spread = 4) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, sp = Math.random() * spread;
      parts.push({ x, y, z, vx: Math.cos(a) * sp, vy: 4 + Math.random() * 6, vz: Math.sin(a) * sp, g: 6, drag: 1.6, life: 2.5 + Math.random() * 1.5, t: 0, s: 0.1 + Math.random() * 0.06, ar: 0.6, c: U.hex(U.pick(CONF)), rot: Math.random() * 6, spin: (Math.random() - 0.5) * 20, floor: y < 50 ? 0.02 : undefined });
    }
  }
  // počasí (sníh, déšť, listí) kolem kamery
  function weather(kind, cx, cz, dt, indoor) {
    if (!kind || indoor) return;
    const n = kind === 'snow' ? 12 : kind === 'rain' ? 30 : 3;
    for (let k = 0; k < n * dt * 10; k++) {
      const x = cx + (Math.random() - 0.5) * 40, z = cz + (Math.random() - 0.5) * 40;
      if (World.inside(x, z)) continue;
      if (kind === 'snow') parts.push({ x, y: 14, z, vx: (Math.random() - 0.5) * 0.6, vy: -1.6 - Math.random(), vz: 0.3, g: 0, life: 8, t: 0, s: 0.07, c: [1, 1, 1], drag: 0, rot: 0, spr: 'snow' });
      else if (kind === 'rain') parts.push({ x, y: 14, z, vx: 0.4, vy: -18, vz: 0, g: 0, life: 0.8, t: 0, s: 0.05, ar: 6, c: [0.75, 0.85, 1], drag: 0, rot: 0, spr: 'rain' });
      else parts.push({ x, y: 8, z, vx: 0.8, vy: -0.8, vz: 0.3, g: 0, life: 9, t: 0, s: 0.14, ar: 0.66, c: [1, 1, 1], drag: 0, rot: 0, spin: 2, spr: 'leaf' });
    }
  }
  function clearParts() { parts.length = 0; }
  return { add, clear, count, update, draw, burst, confetti, weather, clearParts, list, parts };
})();
