'use strict';
// =============================================================
//  util.js — malé pomocné funkce (náhoda, interpolace, úložiště)
// =============================================================
const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  chance: (p) => Math.random() < p,
  dist2: (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz),
  smooth: (cur, target, rate, dt) => target + (cur - target) * Math.exp(-rate * dt),
  angleLerp(a, b, t) {
    let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    return a + d * t;
  },
  angleDiff(a, b) { return ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; },
  // Deterministická náhoda (textury vypadají pokaždé stejně)
  rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  },
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  // Vybere hlášku, která se nedávno neopakovala
  _fresh: {},
  pickFresh(key, arr, memory = 2) {
    const used = this._fresh[key] || (this._fresh[key] = []);
    const pool = arr.filter(x => !used.includes(x));
    const v = (pool.length ? pool : arr)[Math.floor(Math.random() * (pool.length || arr.length))];
    used.push(v); while (used.length > Math.min(memory, arr.length - 1)) used.shift();
    return v;
  },
  fmtTime(t) {
    t = Math.max(0, Math.ceil(t));
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  },
  hex(c) { // '#rrggbb' -> [r,g,b] 0..1
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  },
  esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
};

// localStorage obalené do try/catch (v soukromém okně může selhat)
const Store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nic */ } },
};
