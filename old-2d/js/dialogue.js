'use strict';
// =============================================================
//  dialogue.js — dialogy ve stylu Undertale: jméno, portrét,
//  psací stroj, volby. E/mezerník přeskočí / pokračuje.
//
//  Řádek dialogu:
//    { who: 'hojer', text: '...' }
//    { who: 'player', text: '...', choices: [{ t: 'Ano', then: [...], fn(){} }] }
//    { wait: 1.5, fx(){} }      — pauza bez okna (např. efekt)
//    function () { ... }        — zavolá se a pokračuje
// =============================================================
const Dialogue = (() => {
  let queue = [], cur = null, shown = 0, onDone = null, choice = 0, active = false, t = 0;
  const CPS = 52; // znaků za sekundu

  function L(who, text, extra) { return Object.assign({ who, text }, extra || {}); }

  function start(lines, done) {
    queue = lines.slice(); onDone = done || null; active = true;
    next();
  }
  function next() {
    while (true) {
      if (!queue.length) {
        active = false; cur = null; Voice.stop();
        const d = onDone; onDone = null;
        if (d) d();
        return;
      }
      cur = queue.shift();
      if (typeof cur === 'function') {
        const r = cur();
        if (Array.isArray(r)) queue.unshift(...r);
        continue;
      }
      shown = 0; choice = 0; t = 0;
      Voice.stop();
      cur.voiced = cur.who === 'maturitron' && cur.text ? Voice.play(cur.text) > 0 : false;
      if (cur.fx) cur.fx();
      return;
    }
  }

  function speakerInfo(who) {
    if (who === 'player') return { name: 'TY', col: '#7fb2ff', portrait: 'player' };
    if (who === 'maturitron') return { name: 'MATURITRON 3000', col: '#ff5a5a', portrait: null };
    if (who === 'narrator' || !who) return { name: '', col: '#ffffff', portrait: null };
    const c = Sprites.CHARS[who];
    return { name: c ? c.name.toUpperCase() : who.toUpperCase(), col: '#ffe14d', portrait: c ? who : null, title: c && c.title };
  }

  function update(dt) {
    if (!active || !cur) return;
    t += dt;
    if (cur.wait !== undefined) {
      cur.wait -= dt;
      if (cur.wait <= 0) next();
      return;
    }
    const len = cur.text.length;
    if (shown < len) {
      const before = Math.floor(shown);
      shown = Math.min(len, shown + dt * CPS);
      if (Math.floor(shown) !== before && before % 2 === 0 && cur.text[before] !== ' ') {
        const c = Sprites.CHARS[cur.who];
        const p = cur.who === 'maturitron' ? 0.6 : cur.who === 'player' ? 1.1 : (c && c.voice) || 1;
        if (!cur.voiced) Sound.sfx.blip(p);
      }
    }
    const done = shown >= len;
    if (done && cur.choices) {
      const n = cur.choices.length;
      if (Input.hit('arrowup', 'w')) { choice = (choice + n - 1) % n; Sound.sfx.move(); }
      if (Input.hit('arrowdown', 's')) { choice = (choice + 1) % n; Sound.sfx.move(); }
      for (let i = 0; i < n; i++) if (Input.hit(String(i + 1))) { choice = i; pick(); return; }
    }
    if (Input.confirm()) {
      Input.consume('e', ' ', 'enter');
      if (!done) { shown = len; return; }
      if (cur.choices) { pick(); return; }
      next();
    }
  }
  function pick() {
    const c = cur.choices[choice];
    Sound.sfx.select();
    Input.consume('e', ' ', 'enter');
    if (c.fn) c.fn();
    if (c.then) queue.unshift(...c.then);
    next();
  }

  function draw(ctx, gt) {
    if (!active || !cur || cur.wait !== undefined) return;
    const info = speakerInfo(cur.who);
    const x = 36, w = 408, h = 66, y = 270 - h - 8;
    // jemné ztmavení spodku obrazovky
    const gr = ctx.createLinearGradient(0, 170, 0, 270);
    gr.addColorStop(0, 'rgba(6,4,12,0)'); gr.addColorStop(1, 'rgba(6,4,12,0.6)');
    ctx.fillStyle = gr; ctx.fillRect(0, 170, 480, 100);
    U.panel(ctx, x, y, w, h, { bg: 'rgba(12,9,22,0.93)', border: 'rgba(255,255,255,0.2)' });
    let tx = x + 12;
    const hasPortrait = info.portrait || cur.who === 'maturitron';
    if (hasPortrait) {
      const px = x + 8, py = y + 8, ps = 50;
      ctx.fillStyle = cur.who === 'maturitron' ? '#1c0d16' : '#221a36'; ctx.fillRect(px, py, ps, ps);
      const pg = ctx.createLinearGradient(0, py, 0, py + ps);
      pg.addColorStop(0, 'rgba(255,255,255,0.06)'); pg.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = pg; ctx.fillRect(px, py, ps, ps);
      const talking = shown < cur.text.length || (cur.voiced && Voice.speaking);
      if (cur.who === 'maturitron') Sprites.maturitron(ctx, px + 1, py + 10, 2, gt, cur.mood || 'normal', talking);
      else Sprites.portrait(ctx, info.portrait, px + 2, py + 1, 46, talking, gt);
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(px, py + ps - 0.5, ps, 0.5);
      tx = x + 68;
    }
    // jméno + titul
    if (info.name) {
      U.text(ctx, info.name, tx, y + 7, { size: 9, font: 'bold', color: info.col, outline: false, ls: 0.6 });
      if (info.title) {
        ctx.font = U.font(9, 'bold');
        const nw = ctx.measureText(info.name).width + (('letterSpacing' in ctx) ? info.name.length * 0.6 : 0);
        U.text(ctx, info.title, tx + nw + 6, y + 8, { size: 7, color: '#8d84a8', outline: false, ls: 0.8 });
      }
    }
    const vis = cur.text.slice(0, Math.floor(shown));
    const ty = info.name ? y + 21 : y + 12;
    const lines = U.wrap(ctx, vis, w - (tx - x) - 14, 11.5);
    lines.slice(0, 3).forEach((ln, i) => U.text(ctx, ln, tx, ty + i * 12.5, { size: 11.5, color: info.name ? '#f4f0ff' : '#d8d0ee', outline: false }));

    const done = shown >= cur.text.length;
    if (done && cur.choices) {
      const n = cur.choices.length;
      ctx.font = U.font(10.5);
      let cw = 0; for (const c of cur.choices) cw = Math.max(cw, ctx.measureText(c.t).width);
      const pw = Math.min(330, cw + 40), ph = n * 15 + 10;
      const px = x + w - pw, py = y - 8 - ph;
      U.panel(ctx, px, py, pw, ph, { bg: 'rgba(12,9,22,0.94)', border: 'rgba(255,211,77,0.45)' });
      cur.choices.forEach((c, i) => {
        const sel = i === choice, ry = py + 5 + i * 15;
        if (sel) { ctx.fillStyle = 'rgba(255,211,77,0.12)'; ctx.fillRect(px + 3, ry, pw - 6, 14); ctx.fillStyle = '#ffd34d'; ctx.fillRect(px + 3, ry, 1.5, 14); }
        U.text(ctx, String(i + 1), px + 10, ry + 2.5, { size: 8, color: sel ? '#ffd34d' : '#5a5270', outline: false });
        U.text(ctx, c.t, px + 22, ry + 1.5, { size: 10.5, color: sel ? '#ffffff' : '#a89fc2', outline: false });
      });
    } else if (done) {
      const b = Math.round(Math.sin(gt * 6) * 1);
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath(); ctx.moveTo(x + w - 14, y + h - 11 + b); ctx.lineTo(x + w - 8, y + h - 11 + b); ctx.lineTo(x + w - 11, y + h - 7 + b); ctx.closePath(); ctx.fill();
    }
  }

  function reset() { queue = []; cur = null; active = false; onDone = null; Voice.stop(); }

  return { start, update, draw, reset, L, get active() { return active; }, get current() { return cur; } };
})();
const L = Dialogue.L;
