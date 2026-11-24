'use strict';
// =============================================================
//  input.js — klávesnice. "down" = drženo, "pressed" = stisknuto
//  v tomto snímku (jen jednou).
// =============================================================
const Input = {
  down: new Set(),
  pressed: new Set(),
  GAME_KEYS: ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'e'],
  listeners: [],

  norm(e) { return (e.key || '').toLowerCase(); },

  init() {
    window.addEventListener('keydown', (e) => {
      const k = this.norm(e);
      const overlayOpen = document.querySelector('.overlay:not(.hidden)');
      if (!overlayOpen && this.GAME_KEYS.includes(k)) e.preventDefault();
      if (!this.down.has(k)) this.pressed.add(k);
      this.down.add(k);
      for (const fn of this.listeners) fn(e, k);
    });
    window.addEventListener('keyup', (e) => { this.down.delete(this.norm(e)); });
    window.addEventListener('blur', () => { this.down.clear(); this.pressed.clear(); });
  },
  onKey(fn) { this.listeners.push(fn); },
  isDown(...ks) { return ks.some(k => this.down.has(k)); },
  hit(...ks) { return ks.some(k => this.pressed.has(k)); },
  // potvrzovací klávesy: E / mezerník / Enter
  confirm() { return this.hit('e', ' ', 'enter'); },
  consume(...ks) { if (!ks.length) this.pressed.clear(); else ks.forEach(k => this.pressed.delete(k)); },
  endFrame() { this.pressed.clear(); },
};
