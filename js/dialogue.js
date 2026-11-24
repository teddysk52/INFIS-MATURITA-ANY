'use strict';
// =============================================================
//  dialogue.js — dialogy ve stylu Undertale: psací stroj,
//  portrét, volby (1/2/3), krátké pauzy s efekty.
//  Položky: L(kdo, text, {choices}) | {wait, fx} | function
// =============================================================
function L(who, text, o = {}) { return Object.assign({ who, text }, o); }

const Dialogue = (() => {
  const $ = (id) => document.getElementById(id);
  let box, nameEl, textEl, choicesEl, portraitCv, portraitWrap, hintEl;
  let queue = [], cur = null, shown = 0, done = null, active = false, waitT = 0, sel = 0, speaker = null, typeT = 0;

  function init() {
    box = $('dialogue'); nameEl = $('dl-name'); textEl = $('dl-text'); choicesEl = $('dl-choices');
    portraitCv = $('portrait'); portraitWrap = document.querySelector('.dl-portrait'); hintEl = $('dl-hint');
  }
  function start(lines, onDone) {
    if (active) { queue = queue.concat(lines); const prev = done; done = () => { if (prev) prev(); if (onDone) onDone(); }; return; }
    queue = lines.slice(); done = onDone || null; active = true;
    next();
  }
  function who(id) {
    if (id === 'player') return { name: 'TY', title: '', portrait: 'player' };
    if (id === 'maturitron') return { name: 'MATURITRON 3000', title: 'AI', portrait: 'mt' };
    if (id === 'narrator') return { name: '', title: '', portrait: null };
    const s = Chars.SPECS[id];
    return s ? { name: s.name, title: s.title, portrait: id } : { name: id, title: '', portrait: null };
  }
  function next() {
    if (!queue.length) { finish(); return; }
    const it = queue.shift();
    if (typeof it === 'function') { it(); next(); return; }
    if (it.wait !== undefined) {
      cur = { wait: true }; waitT = it.wait; box.classList.add('hidden');
      if (it.fx) it.fx();
      return;
    }
    cur = it; shown = 0; typeT = 0; sel = 0;
    const w = who(it.who);
    speaker = it.who;
    box.classList.remove('hidden');
    nameEl.innerHTML = w.name ? `${U.esc(w.name)}${w.title ? `<small>${U.esc(w.title)}</small>` : ''}` : '';
    textEl.classList.toggle('narr', it.who === 'narrator');
    textEl.textContent = '';
    choicesEl.innerHTML = '';
    hintEl.style.visibility = 'hidden';
    portraitWrap.classList.toggle('none', !w.portrait);
    portraitWrap.classList.toggle('mt', w.portrait === 'mt');
    if (w.portrait) {
      const x = portraitCv.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 40, 40);
      if (w.portrait === 'mt') Chars.drawMTFace(x, 40, it.mood || 'talk', 0, false);
      else x.drawImage(Chars.portrait(w.portrait, it.mood || 'talk'), 0, 0);
    }
    if (it.who === 'maturitron' && Settings.s.voice) Voice.play(it.text);
    if (it.fx) it.fx();
    Game.onSpeak && Game.onSpeak(it.who);
  }
  function finish() {
    active = false; cur = null; box.classList.add('hidden'); speaker = null;
    const d = done; done = null;
    if (d) d();
  }
  function showChoices() {
    choicesEl.innerHTML = cur.choices.map((c, i) => `<div class="choice ${i === sel ? 'sel' : ''}" data-i="${i}"><b>${i + 1}</b>${U.esc(c.t)}</div>`).join('');
    choicesEl.querySelectorAll('.choice').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); choose(+el.dataset.i); }));
  }
  function choose(i) {
    if (!cur || !cur.choices || shown < cur.text.length) return;
    const c = cur.choices[i]; if (!c) return;
    Sound.sfx.select();
    Game.logAction && Game.logAction('Volba: ' + c.t);
    if (c.fn) c.fn();
    if (c.then) queue = c.then.concat(queue);
    next();
  }
  function update(dt) {
    if (!active || !cur) return;
    if (cur.wait) { waitT -= dt; if (waitT <= 0) next(); return; }
    if (shown < cur.text.length) {
      typeT += dt * 60;
      const before = shown;
      shown = Math.min(cur.text.length, Math.floor(typeT));
      if (shown !== before) {
        textEl.textContent = cur.text.slice(0, shown);
        const ch = cur.text[shown - 1];
        if (ch && ch !== ' ' && shown % 2 === 0) {
          const s = Chars.SPECS[cur.who];
          if (cur.who === 'maturitron') { if (!Voice.speaking) Sound.sfx.blip(0.6); }
          else Sound.sfx.blip(s ? s.pitch : cur.who === 'player' ? 1.2 : 0.9);
        }
        if (shown === cur.text.length) { if (cur.choices) showChoices(); else hintEl.style.visibility = 'visible'; }
      }
    }
    // Hlasová replika: počkej, než MATURITRON domluví
  }
  // E / mezerník
  function advance() {
    if (!active || !cur || cur.wait) return;
    if (shown < cur.text.length) { shown = cur.text.length; typeT = shown; textEl.textContent = cur.text; if (cur.choices) showChoices(); else hintEl.style.visibility = 'visible'; return; }
    if (cur.choices) { choose(sel); return; }
    if (cur.who === 'maturitron') Voice.stop();
    Sound.sfx.move();
    next();
  }
  function move(d) {
    if (!cur || !cur.choices || shown < cur.text.length) return;
    sel = (sel + d + cur.choices.length) % cur.choices.length; Sound.sfx.move(); showChoices();
  }
  function abort() { queue = []; done = null; active = false; cur = null; if (box) box.classList.add('hidden'); }
  return { init, start, update, advance, choose, move, abort, get active() { return active; }, get speaker() { return speaker; }, get waiting() { return cur && cur.wait; } };
})();
