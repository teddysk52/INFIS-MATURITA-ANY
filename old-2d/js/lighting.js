'use strict';
// =============================================================
//  lighting.js — světlo a atmosféra. Pro každý ročník se jednou
//  předpočítají dvě vrstvy přes celou mapu:
//    shade  — násobení (ambientní barva + měkké stíny u zdí/nábytku)
//    light  — přičtení (paprsky z oken, lampy, záře)
//  Ročníky mají vlastní "denní dobu": ráno → poledne → zářivky → západ.
// =============================================================
const Lighting = (() => {
  const TS = 16;
  let shade = null, light = null, sc = null, lc = null, shafts = [], year = 1;

  const MOOD = {
    1: { amb: '#f1e7dc', out: '#ffffff', ao: 'rgba(52,36,78,0.42)', win: [255, 214, 150], lamp: [255, 236, 200], winA: 0.42, lampA: 0.14, slope: 0.45, len: 92, strength: 0.85, name: 'ráno' },
    2: { amb: '#eeeef4', out: '#ffffff', ao: 'rgba(40,36,80,0.38)', win: [255, 244, 210], lamp: [235, 240, 255], winA: 0.36, lampA: 0.12, slope: 0.15, len: 80, strength: 0.75, name: 'poledne' },
    3: { amb: '#dbe6e0', out: '#eef3f3', ao: 'rgba(30,50,48,0.42)', win: [210, 230, 235], lamp: [205, 255, 228], winA: 0.2, lampA: 0.26, slope: 0.2, len: 70, strength: 0.8, name: 'zářivky' },
    4: { amb: '#d9b6aa', out: '#ffd0b0', ao: 'rgba(70,24,40,0.5)', win: [255, 140, 70], lamp: [255, 190, 130], winA: 0.55, lampA: 0.16, slope: 0.9, len: 140, strength: 0.95, name: 'západ' },
  };

  function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

  function build(y) {
    year = y;
    const m = MOOD[y] || MOOD[1];
    const W = World.pxW, H = World.pxH;
    if (!shade) {
      shade = document.createElement('canvas'); light = document.createElement('canvas');
      shade.width = light.width = W; shade.height = light.height = H;
      sc = shade.getContext('2d'); lc = light.getContext('2d');
    }
    const T = World.T, tile = World.tileAt;
    const walk = (tx, ty) => { const t = tile(tx, ty); return t !== T.WALL && t !== T.FACE && t !== T.BRICK && t !== T.HEDGE; };

    // ---------- SHADE (multiply) ----------
    sc.globalCompositeOperation = 'source-over';
    sc.fillStyle = '#ffffff'; sc.fillRect(0, 0, W, H);
    for (let ty = 0; ty < World.H; ty++) for (let tx = 0; tx < World.W; tx++) {
      const t = tile(tx, ty);
      let c = m.amb;
      if (t === T.GRASS || t === T.PATH || t === T.HEDGE || ty >= 33) c = m.out;
      else if (t === T.COR || (ty >= 13 && ty <= 19)) c = U.shade(m.amb, 0.25);
      sc.fillStyle = c; sc.fillRect(tx * TS, ty * TS, TS, TS);
    }
    // tmavá učebna 404
    const r404 = World.room('r404');
    sc.fillStyle = 'rgba(40,30,70,0.55)';
    sc.fillRect(r404.x0 * TS, (r404.y0 - 1) * TS, (r404.x1 - r404.x0 + 1) * TS, (r404.y1 - r404.y0 + 2) * TS);
    // měkké stíny u zdí (ambient occlusion)
    for (let ty = 1; ty < World.H; ty++) for (let tx = 0; tx < World.W; tx++) {
      if (!walk(tx, ty)) continue;
      const x = tx * TS, yy = ty * TS;
      if (!walk(tx, ty - 1)) {
        const g = sc.createLinearGradient(0, yy, 0, yy + 10); g.addColorStop(0, m.ao); g.addColorStop(1, 'rgba(0,0,0,0)');
        sc.fillStyle = g; sc.fillRect(x, yy, TS, 10);
      }
      if (!walk(tx - 1, ty)) {
        const g = sc.createLinearGradient(x, 0, x + 6, 0); g.addColorStop(0, m.ao); g.addColorStop(1, 'rgba(0,0,0,0)');
        sc.fillStyle = g; sc.fillRect(x, yy, 6, TS);
      }
      if (!walk(tx + 1, ty)) {
        const g = sc.createLinearGradient(x + TS, 0, x + TS - 6, 0); g.addColorStop(0, m.ao); g.addColorStop(1, 'rgba(0,0,0,0)');
        sc.fillStyle = g; sc.fillRect(x + TS - 6, yy, 6, TS);
      }
    }
    // stín budovy na trávníku
    { const g = sc.createLinearGradient(0, 34 * TS, 0, 34 * TS + 14); g.addColorStop(0, m.ao); g.addColorStop(1, 'rgba(0,0,0,0)'); sc.fillStyle = g; sc.fillRect(TS, 34 * TS, World.pxW - 2 * TS, 14); }
    // kontaktní stíny pod nábytkem
    for (const f of World.furniture) {
      if (f.o.decor || f.o.walk) continue;
      const x = f.x * TS, yy = f.y * TS, w = f.w * TS, h = f.h * TS;
      const tall = ['vending', 'rack', 'tree', 'plant', 'trophy', 'shelf', 'kiosk', 'lamp', 'safe', 'infissign'].includes(f.type);
      sc.fillStyle = 'rgba(40,24,60,0.28)';
      sc.beginPath(); sc.ellipse(x + w / 2 + (tall ? 3 : 1), yy + h + 1, w / 2 + 1, tall ? 5 : 3.5, 0, 0, Math.PI * 2); sc.fill();
    }

    // ---------- LIGHT (screen) ----------
    lc.globalCompositeOperation = 'source-over';
    lc.fillStyle = '#000000'; lc.fillRect(0, 0, W, H);
    lc.globalCompositeOperation = 'lighter';
    shafts = [];
    // paprsky z oken
    for (const f of World.furniture) {
      if (f.type !== 'window') continue;
      const x0 = f.x * TS + 3, x1 = (f.x + f.w) * TS - 3, top = (f.y + 1) * TS;
      const len = m.len, dx = len * m.slope;
      const g = lc.createLinearGradient(0, top, 0, top + len);
      g.addColorStop(0, rgba(m.win, m.winA)); g.addColorStop(0.7, rgba(m.win, m.winA * 0.35)); g.addColorStop(1, rgba(m.win, 0));
      lc.fillStyle = g;
      lc.beginPath(); lc.moveTo(x0, top); lc.lineTo(x1, top); lc.lineTo(x1 + dx + 8, top + len); lc.lineTo(x0 + dx - 4, top + len); lc.closePath(); lc.fill();
      const spot = lc.createRadialGradient(x0 + dx * 0.7 + 12, top + len * 0.65, 2, x0 + dx * 0.7 + 12, top + len * 0.65, 34);
      spot.addColorStop(0, rgba(m.win, m.winA * 0.5)); spot.addColorStop(1, rgba(m.win, 0));
      lc.fillStyle = spot; lc.fillRect(x0 - 40, top, 140 + dx, len + 20);
      shafts.push({ x: x0, w: x1 - x0, top, len, dx });
    }
    // lampy
    const lamp = (cx, cy, r, a, col) => {
      const g = lc.createRadialGradient(cx, cy, 1, cx, cy, r);
      g.addColorStop(0, rgba(col || m.lamp, a)); g.addColorStop(1, rgba(col || m.lamp, 0));
      lc.fillStyle = g; lc.fillRect(cx - r, cy - r, r * 2, r * 2);
    };
    for (let tx = 4; tx < 62; tx += 8) lamp(tx * TS, 16.5 * TS, 46, m.lampA);
    for (const r of World.ROOMS) {
      const cx = (r.x0 + r.x1 + 1) / 2 * TS, cy = (r.y0 + r.y1 + 1) / 2 * TS;
      if (r.id === 'r404') { lamp(cx, cy, 30, 0.08, [180, 160, 255]); continue; }
      if (r.id === 'exam') { lamp(cx, 24.5 * TS, 70, m.lampA * 1.3, [255, 220, 160]); continue; }
      lamp(cx - 40, cy, 50, m.lampA * 0.8); lamp(cx + 40, cy, 50, m.lampA * 0.8);
    }
    // stolní lampy v knihovně, automat, serverovna
    lamp(50 * TS + 36, 9 * TS - 4, 26, 0.24, [255, 220, 140]); lamp(58 * TS + 36, 9 * TS - 4, 26, 0.24, [255, 220, 140]);
    lamp(13.5 * TS, 14 * TS, 28, 0.22, [255, 120, 110]);
    lamp(18 * TS, 2.5 * TS, 22, 0.18, [90, 200, 255]); lamp(29 * TS, 2.5 * TS, 22, 0.18, [90, 200, 255]);
    // pouliční lampy a vchod
    lamp(29.5 * TS, 34.5 * TS, 34, y === 4 ? 0.32 : 0.1, [255, 220, 150]); lamp(34.5 * TS, 34.5 * TS, 34, y === 4 ? 0.32 : 0.1, [255, 220, 150]);
    lamp(32 * TS, 32.5 * TS, 40, 0.16, [255, 230, 170]);
    lc.globalCompositeOperation = 'source-over';
  }

  // Jednou za ročník "zapéct" světlo přímo do canvasu mapy (žádná cena za snímek)
  function bake(ctx) {
    if (!shade) return;
    const m = MOOD[year] || MOOD[1];
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = m.strength;
    ctx.drawImage(shade, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 1;
    ctx.drawImage(light, 0, 0);
    ctx.restore();
  }

  // každý snímek už jen prach v paprscích světla
  function draw(ctx, cam, gt) {
    if (!shafts.length) return;
    const m = MOOD[year] || MOOD[1];
    ctx.save();
    ctx.fillStyle = rgba(m.win, 1);
    for (const s of shafts) {
      if (s.x + s.w + s.dx < cam.x || s.x > cam.x + 480 || s.top > cam.y + 270 || s.top + s.len < cam.y) continue;
      for (let i = 0; i < 14; i++) {
        const k = ((i * 0.618 + gt * 0.03 * (1 + (i % 3) * 0.3)) % 1);
        const px = s.x + (i * 37 % s.w) + s.dx * k + Math.sin(gt * 0.7 + i) * 3;
        const py = s.top + k * s.len * 0.9;
        ctx.globalAlpha = 0.45 * Math.sin(k * Math.PI);
        ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
      }
    }
    ctx.restore();
  }

  // jemná vinětace přes celou obrazovku
  const vigCache = {};
  function vignette(ctx, a = 0.32) {
    const key = a.toFixed(2);
    let c = vigCache[key];
    if (!c) {
      c = document.createElement('canvas'); c.width = 240; c.height = 135;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(120, 70, 75, 120, 70, 160);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(6,3,14,${a})`);
      g.fillStyle = gr; g.fillRect(0, 0, 240, 135);
      vigCache[key] = c;
    }
    const s = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(c, 0, 0, 480, 270);
    ctx.imageSmoothingEnabled = s;
  }

  return { build, bake, draw, vignette, MOOD };
})();
