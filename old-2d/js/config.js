'use strict';
// =============================================================
//  config.js — nastavení hry. Tohle je jediný soubor, který
//  běžně potřebuješ upravit.
// =============================================================
window.INFIS_CONFIG = {
  // Délka hry v sekundách (10 minut).
  START_TIME: 600,

  // --- VOLITELNÝ REŽIM SKUTEČNÉ AI ---
  // Hra je 100% hratelná bez toho. Pokud nasadíš Cloudflare Worker
  // ze složky /worker, vlož sem jeho URL, např.:
  //   AI_ENDPOINT: 'https://maturitron.tvuj-ucet.workers.dev'
  // NIKDY sem nedávej API klíč! Klíč patří jen do Workeru (secret).
  AI_ENDPOINT: '',
  AI_TIMEOUT_MS: 6000,        // po této době se použije offline režim
  AI_MIN_INTERVAL_MS: 35000,  // minimálně 35 s mezi dotazy
  AI_MAX_REQUESTS: 14,        // max. dotazů za jednu hru

  // Kdo hru vytvořil (zobrazí se v titulcích).
  CREDITS_AUTHOR: 'Ivan',
};

// Umožní zadat endpoint i přes URL: index.html?ai=https://...
(function () {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('ai')) window.INFIS_CONFIG.AI_ENDPOINT = q.get('ai');
    window.INFIS_CONFIG.DEBUG = q.get('debug') === '1';
  } catch (e) { /* nic */ }
})();
