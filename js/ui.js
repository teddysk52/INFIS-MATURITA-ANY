'use strict';
// =============================================================
//  ui.js — HUD, minimapa, jmenovky nad postavami, toasty,
//  velké nápisy, EduPage okna, obrazovky menu.
// =============================================================
const UI = (() => {
  const $ = (id) => document.getElementById(id);
  let els = {};
  function init() {
    els = {
      hud: $('hud'), timer: $('timer'), timerBox: $('hud-timer'), yearNum: $('year-num'), yearSub: $('year-sub'), room: $('room-name'),
      obj: $('objectives'), prompt: $('prompt'), mt: $('mt-panel'), mtText: $('mt-text'), mtFace: $('mt-face'), mtStatus: $('mt-status'),
      arena: $('arena-hud'), arenaTitle: $('arena-title'), arenaBar: document.querySelector('#arena-bar i'), arenaHint: $('arena-hint'),
      car: $('car-hud'), speedo: $('speedo'), toasts: $('toasts'), big: $('bigtitle'), popups: $('popups'), qte: $('qte'),
      world: $('world-ui'), minimap: $('minimap'), hit: $('hit-vignette'), fade: $('fade'), yearcard: $('yearcard'),
    };
    els.mm = els.minimap.getContext('2d');
  }

  // ---------------- obrazovky ----------------
  const SCREENS = ['menu', 'howto', 'settings', 'achievements', 'pause', 'gameover', 'victory', 'credits'];
  let screenStack = [];
  function show(name) {
    for (const s of SCREENS) $(s).classList.toggle('hidden', s !== name);
    screenStack.push(name);
    if (name === 'achievements') renderAch();
    if (name === 'settings') Settings.sync();
    const b = $(name) && $(name).querySelector('button.primary'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 30);
  }
  function hideScreens() { for (const s of SCREENS) $(s).classList.add('hidden'); screenStack = []; }
  function back() { screenStack.pop(); const prev = screenStack.pop(); if (prev) show(prev); else hideScreens(); }
  function renderAch() {
    const L = Achievements.LIST, got = Achievements.allTime;
    $('ach-count').textContent = `${[...got].filter(k => L[k]).length} / ${Object.keys(L).length}`;
    $('ach-list').innerHTML = Object.keys(L).map(k => `<div class="ach ${got.has(k) ? '' : 'locked'}"><div class="ic">${Icons.html(Icons.FOR_ACH[k] || 'trophy', '<span class="star">★</span>')}</div><div><b>${got.has(k) ? U.esc(L[k][1]) : '???'}</b><span>${got.has(k) ? U.esc(L[k][2]) : ''}</span></div></div>`).join('');
  }

  // ---------------- HUD ----------------
  let lastTimer = '';
  function setTimer(t, state) {
    const s = U.fmtTime(t);
    if (s !== lastTimer) { els.timer.textContent = s; lastTimer = s; }
    els.timerBox.classList.toggle('warn', t <= 120 && t > 60);
    els.timerBox.classList.toggle('crit', t <= 60);
    els.timerBox.classList.toggle('bonus', state === 'bonus');
  }
  function setYear(title) { els.yearNum.textContent = title; }
  let roomT = 0, lastRoom = '';
  function setRoom(name) {
    if (name === lastRoom) return; lastRoom = name;
    if (!name) { els.room.classList.remove('show'); return; }
    els.room.textContent = name; els.room.classList.add('show'); roomT = 3.5;
  }
  let objKey = '';
  function setObjectives(list, title) {
    const key = JSON.stringify(list.map(o => [o.text, o.done, o.subText]));
    if (key === objKey) return; objKey = key;
    void title;
    els.obj.innerHTML = list.map(o => `<div class="obj ${o.done ? 'done' : ''} ${o.optional ? 'opt' : ''} ${o.flash ? 'flash' : ''}"><span>${U.esc(o.text)}${o.subText ? `<span class="sub">${U.esc(o.subText)}</span>` : ''}</span><span class="ic">${Icons.html(Icons.FOR_OBJECTIVE[o.id], '<i class="dot"></i>')}</span></div>`).join('');
  }
  function prompt(html) {
    if (!html) { els.prompt.classList.add('hidden'); return; }
    if (els.prompt.innerHTML !== html) els.prompt.innerHTML = html;
    els.prompt.classList.remove('hidden');
  }
  function arenaHud(on, title, hint, prog) {
    els.arena.classList.toggle('hidden', !on);
    if (!on) return;
    if (title !== undefined && els.arenaTitle.textContent !== title) els.arenaTitle.textContent = title;
    if (hint !== undefined && els.arenaHint.textContent !== hint) els.arenaHint.textContent = hint;
    if (prog !== undefined) els.arenaBar.style.width = (U.clamp(prog, 0, 1) * 100).toFixed(1) + '%';
  }
  function carHud(on, kmh) { els.car.classList.toggle('hidden', !on); if (on) els.speedo.textContent = Math.round(Math.abs(kmh)); }

  // ---------------- MATURITRON panel ----------------
  function mtShow(text, mood) {
    els.mt.classList.remove('hidden'); els.mt.classList.toggle('angry', mood === 'angry');
    els.mtText.textContent = text;
    // restart animace
    els.mt.style.animation = 'none'; void els.mt.offsetWidth; els.mt.style.animation = '';
  }
  function mtType(text) { els.mtText.textContent = text; }
  function mtHide() { els.mt.classList.add('hidden'); }
  function mtStatus(s) { if (els.mtStatus) els.mtStatus.textContent = s; }
  function mtFace(mood, t) { if (!els.mtFace) return; const x = els.mtFace.getContext('2d'); Chars.drawMTFace(x, 64, mood, t, false); }

  // ---------------- toasty (achievementy) ----------------
  function toast(icon, name, desc, key) {
    void desc;
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = `<div class="ic">${Icons.html(key || 'trophy', '<span class="star">★</span>')}</div><div><div class="tt">ÚSPĚCH</div><div class="tn">${U.esc(name)}</div></div>`;
    els.toasts.appendChild(d);
    while (els.toasts.children.length > 3) els.toasts.firstChild.remove();
    setTimeout(() => d.classList.add('out'), 4200);
    setTimeout(() => d.remove(), 4700);
  }

  // ---------------- velký nápis ----------------
  let bigT = 0;
  function big(text, dur = 2.2, color = '#fff', sub = '') {
    void sub; els.big.textContent = text;
    els.big.style.color = color; els.big.classList.add('show'); bigT = dur;
  }

  // ---------------- EduPage okna ----------------
  function popup(text, x, y) {
    const d = document.createElement('div');
    d.className = 'popup';
    d.style.left = x + 'px'; d.style.top = y + 'px';
    d.innerHTML = `<div class="ph"><span>🔔 EduPage</span><span>✕</span></div><div class="pb">${U.esc(text)}<div class="pk">[E] zavřít</div></div>`;
    els.popups.appendChild(d);
    return d;
  }
  function closePopup() { const p = els.popups.lastElementChild; if (p) { p.remove(); return true; } return false; }
  function popupCount() { return els.popups.children.length; }
  function clearPopups() { els.popups.innerHTML = ''; }

  function hit() { els.hit.classList.add('on'); setTimeout(() => els.hit.classList.remove('on'), 180); }
  function fade(on) { els.fade.classList.toggle('on', on); }
  function yearCard(num, sub, note, dur, done) {
    const c = els.yearcard;
    c.querySelector('.yc-num').textContent = num; c.querySelector('.yc-sub').textContent = sub; c.querySelector('.yc-note').textContent = note || '';
    c.classList.remove('hidden');
    setTimeout(() => { c.classList.add('hidden'); if (done) done(); }, dur * 1000);
  }

  // ---------------- texty ve světě ----------------
  const labels = []; // {el, x,y,z, t, life, vy, kind}
  const pool = {};
  function makeEl(kind) {
    const el = document.createElement('div'); el.className = 'wl ' + kind; els.world.appendChild(el); return el;
  }
  function floatText(x, y, z, text, color = '#fff', life = 1.3) {
    const el = makeEl('float'); el.textContent = text; el.style.color = color;
    labels.push({ el, x, y, z, t: 0, life, vy: 1.2 });
  }
  function bubble(key, x, y, z, text, life = 2) {
    let b = labels.find(l => l.key === key);
    if (!b) { b = { el: makeEl('bubble'), key, t: 0, vy: 0 }; labels.push(b); }
    b.el.textContent = text; b.x = x; b.y = y; b.z = z; b.t = 0; b.life = life;
    return b;
  }
  // jmenovky: volá se každý snímek se seznamem {key,x,y,z,name,title}
  const tags = {};
  function nameTags(list, vp, W, H) {
    const seen = {};
    for (const n of list) {
      seen[n.key] = 1;
      let el = tags[n.key];
      if (!el) { el = tags[n.key] = makeEl('name'); el.innerHTML = `${U.esc(n.name)}<small>${U.esc(n.title)}</small>`; }
      const p = M4.project(vp, n.x, n.y, n.z);
      if (p[2] <= 0.1) { el.style.display = 'none'; continue; }
      el.style.display = '';
      el.style.left = ((p[0] / p[2] * 0.5 + 0.5) * W).toFixed(0) + 'px';
      el.style.top = ((1 - (p[1] / p[2] * 0.5 + 0.5)) * H).toFixed(0) + 'px';
      el.style.opacity = n.alpha === undefined ? 1 : n.alpha;
    }
    for (const k in tags) if (!seen[k]) { tags[k].remove(); delete tags[k]; }
  }
  function updateLabels(dt, vp, W, H) {
    for (let k = labels.length - 1; k >= 0; k--) {
      const l = labels[k];
      l.t += dt; l.y += (l.vy || 0) * dt;
      if (l.t >= l.life) { l.el.remove(); labels.splice(k, 1); continue; }
      const p = M4.project(vp, l.x, l.y, l.z);
      if (p[2] <= 0.1) { l.el.style.display = 'none'; continue; }
      l.el.style.display = '';
      l.el.style.left = ((p[0] / p[2] * 0.5 + 0.5) * W).toFixed(0) + 'px';
      l.el.style.top = ((1 - (p[1] / p[2] * 0.5 + 0.5)) * H).toFixed(0) + 'px';
      l.el.style.opacity = l.kind === 'bubble' ? 1 : Math.min(1, (l.life - l.t) * 2.5);
    }
    if (bigT > 0) { bigT -= dt; if (bigT <= 0) els.big.classList.remove('show'); }
    if (roomT > 0) { roomT -= dt; if (roomT <= 0) els.room.classList.remove('show'); }
  }
  function clearWorld() { for (const l of labels) l.el.remove(); labels.length = 0; for (const k in tags) { tags[k].remove(); delete tags[k]; } }

  // ---------------- minimapa ----------------
  let mapCv = null; const MX0 = -110, MZ0 = -110, MS = 2; // 2 px / m
  function buildMinimap() {
    const W = 270 * MS, H = 220 * MS;
    mapCv = document.createElement('canvas'); mapCv.width = W; mapCv.height = H;
    const x = mapCv.getContext('2d');
    const img = x.createImageData(W, H), d = img.data;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const wx = MX0 + (i + 0.5) / MS, wz = MZ0 + (j + 0.5) / MS;
      let c;
      const h = Col.heightAt(wx, wz);
      const room = World.roomAt(wx, wz);
      if (room && h === 0) c = room === 'corr' ? [205, 210, 214] : room === 'hall' ? [225, 215, 190] : [196, 182, 150];
      else if (h > 2.5) c = World.inside(wx, wz) ? [40, 50, 70] : [95, 100, 112];
      else if (h > 0.2) c = World.inside(wx, wz) ? [150, 140, 120] : [60, 110, 55];
      else if (World.onRoad(wx, wz)) c = (wx > 66 && wx < 74) ? [80, 130, 70] : [70, 74, 80];
      else c = wx > 84 ? [78, 140, 64] : [88, 150, 70];
      const o = (j * W + i) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    // obrys budovy
    x.strokeStyle = '#2a6bd1'; x.lineWidth = 2; x.strokeRect((World.BX0 - MX0) * MS, (World.BZ0 - MZ0) * MS, 60 * MS, 20 * MS);
  }
  function minimap(px, pz, yaw, inside, markers, camYaw) {
    const c = els.mm, W = 220, H = 220;
    const zoom = inside ? 7 : 2.6; // px na metr
    c.save();
    c.clearRect(0, 0, W, H);
    c.beginPath(); c.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#183018'; c.fillRect(0, 0, W, H);
    c.translate(W / 2, H / 2);
    c.rotate(camYaw);
    c.imageSmoothingEnabled = false;
    const s = zoom / MS;
    c.drawImage(mapCv, -(px - MX0) * MS * s, -(pz - MZ0) * MS * s, mapCv.width * s, mapCv.height * s);
    // značky
    for (const m of markers) {
      let dx = (m.x - px) * zoom, dz = (m.z - pz) * zoom;
      // rotace do prostoru kamery kvůli ořezu na okraj
      const cs = Math.cos(camYaw), sn = Math.sin(camYaw);
      const rx = dx * cs - dz * sn, rz = dx * sn + dz * cs;
      const dd = Math.hypot(rx, rz), lim = W / 2 - 12;
      if (dd > lim) { dx *= lim / dd; dz *= lim / dd; }
      c.fillStyle = m.col || '#ffcf3f'; c.strokeStyle = '#000'; c.lineWidth = 2;
      c.beginPath(); c.arc(dx, dz, m.big ? 7 : 5, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    // hráč
    c.rotate(-yaw + Math.PI);
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(0, 3); c.lineTo(-6, 7); c.closePath(); c.fill(); c.stroke();
    c.restore();
    // sever
    c.save(); c.translate(W / 2, H / 2); c.rotate(camYaw); c.fillStyle = '#ff4d5e'; c.font = '500 16px "Pixelify Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('S', 0, -W / 2 + 12); c.restore();
  }

  return {
    init, show, hideScreens, back, setTimer, setYear, setRoom, setObjectives, prompt, arenaHud, carHud,
    mtShow, mtType, mtHide, mtStatus, mtFace, toast, big, popup, closePopup, popupCount, clearPopups, hit, fade, yearCard,
    floatText, bubble, nameTags, updateLabels, clearWorld, buildMinimap, minimap, els: () => els,
    get screen() { return screenStack[screenStack.length - 1]; },
  };
})();

// =============================================================
//  Nastavení (uloženo v prohlížeči)
// =============================================================
const Settings = (() => {
  const def = { sfx: true, music: true, voice: true, pauseDialog: true, pixel: false, shadows: true, invertY: false, sens: 1 };
  const s = Object.assign({}, def, Store.get('infis3d_settings', {}));
  function apply() {
    Sound.setSfx(s.sfx); Sound.setMusic(s.music); Voice.enabled = s.voice;
    Store.set('infis3d_settings', s);
  }
  function sync() {
    document.querySelectorAll('[data-set]').forEach(el => {
      const k = el.dataset.set;
      if (el.type === 'checkbox') el.checked = !!s[k]; else el.value = s[k];
    });
  }
  function bind() {
    document.querySelectorAll('[data-set]').forEach(el => {
      el.addEventListener('input', () => { const k = el.dataset.set; s[k] = el.type === 'checkbox' ? el.checked : parseFloat(el.value); apply(); Sound.sfx.move(); });
    });
  }
  return { s, apply, sync, bind };
})();
