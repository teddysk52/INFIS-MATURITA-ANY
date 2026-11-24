'use strict';
// =============================================================
//  utils.js — malé pomocné funkce, které používá celá hra
// =============================================================
// Měřítko vykreslování (1 logický pixel = RS.s skutečných pixelů)
const RS = { s: 4 };

const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  lerp: (a, b, t) => a + (b - a) * t,
  shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Zesvětlení / ztmavení barvy (#rrggbb), amt -1..1
  shade(hex, amt) {
    const c = parseInt(hex.slice(1), 16);
    let r = c >> 16, g = (c >> 8) & 255, b = c & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return '#' + [r, g, b].map(v => Math.round(U.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  },

  // Jediný font hry: Pixelify Sans (plná čeština).
  // Velikost se zaokrouhluje na pixelovou mřížku fontu (10 skutečných px),
  // takže háčky a čárky jsou vždy ostré. Tučné = váha 600 (700 kazí háčky).
  fontPx(size, fam) {
    const bold = fam === 'Silkscreen' || fam === 'bold';
    const unit = 10 / RS.s;
    return Math.max(unit * 2, Math.round((bold ? size * 0.92 : size * 0.8) / unit) * unit);
  },
  font(size, fam, minPx) {
    const bold = fam === 'Silkscreen' || fam === 'bold';
    const px = Math.max(U.fontPx(size, fam), minPx || 0);
    return `${bold ? 600 : 500} ${px}px "Pixelify Sans", sans-serif`;
  },
  // háčky a kroužky potřebují aspoň 30 skutečných px
  needsBig: (s) => /[ČčŘřĚěŠšŽžĎďŤťŇňŮů]/.test(s),

  // Text s pixelovým obrysem
  text(ctx, str, x, y, o = {}) {
    const size = o.size || 10;
    ctx.font = U.font(size, o.font, U.needsBig(str) ? 30 / RS.s : 0);
    x = Math.round(x * RS.s) / RS.s; y = Math.round(y * RS.s) / RS.s;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'top';
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    const ls = o.ls && 'letterSpacing' in ctx;
    if (ls) ctx.letterSpacing = o.ls + 'px';
    if (o.outline !== false) {
      ctx.fillStyle = o.outline || 'rgba(8,5,14,0.85)';
      const w = o.ow || 0.5;
      if (o.ow >= 1) { // velké titulky: plný obrys + stín
        ctx.fillText(str, x + w, y + w * 2);
        ctx.fillText(str, x - w, y); ctx.fillText(str, x + w, y); ctx.fillText(str, x, y - w); ctx.fillText(str, x, y + w);
      } else { ctx.fillText(str, x + w, y + w); ctx.fillText(str, x, y + w * 1.5); }
    }
    ctx.fillStyle = o.color || '#ffffff';
    ctx.fillText(str, x, y);
    if (ls) ctx.letterSpacing = '0px';
    if (o.alpha !== undefined) ctx.globalAlpha = 1;
  },

  // Zalomení textu do řádků podle šířky
  wrap(ctx, text, maxW, size, fam) {
    ctx.font = U.font(size, fam, U.needsBig(String(text)) ? 30 / RS.s : 0);
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
        else line = test;
      }
      out.push(line);
    }
    return out;
  },

  // Minimalistický panel: tmavé sklo, zaoblené pixelové rohy, tenký světlý rámeček
  panel(ctx, x, y, w, h, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const bg = o.bg || 'rgba(14,11,24,0.86)';
    const border = o.border || 'rgba(255,255,255,0.16)';
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x + 1, y + 2, w - 1, h); ctx.fillRect(x, y + 3, w + 1, h - 2);
    ctx.fillStyle = bg;
    ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
    ctx.fillStyle = border;
    const t = 0.5;
    ctx.fillRect(x + 1, y, w - 2, t); ctx.fillRect(x + 1, y + h - t, w - 2, t);
    ctx.fillRect(x, y + 1, t, h - 2); ctx.fillRect(x + w - t, y + 1, t, h - 2);
    if (o.accent) { ctx.fillStyle = o.accent; ctx.fillRect(x + 1, y, w - 2, 1); }
  },
  // pilulka (malý štítek)
  pill(ctx, x, y, w, h, bg) {
    ctx.fillStyle = bg || 'rgba(14,11,24,0.78)';
    ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.fillRect(x, y + 2, w, h - 4);
  },

  // Náhodný výběr bez opakování posledních N položek
  _recent: {},
  pickFresh(key, arr, memory = 3) {
    const rec = U._recent[key] || (U._recent[key] = []);
    const pool = arr.filter(x => !rec.includes(x));
    const v = U.pick(pool.length ? pool : arr);
    rec.push(v);
    while (rec.length > Math.min(memory, arr.length - 1)) rec.shift();
    return v;
  },

  fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  },
};

// Bezpečná práce s localStorage (v anonymním okně může vyhodit chybu)
const Store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nevadí */ } },
};
