// =============================================================
//  MATURITRON 3000 — volitelný Cloudflare Worker (AI proxy)
//
//  Hra funguje i BEZ tohoto souboru (offline režim).
//  Worker drží OpenAI API klíč v tajnosti (secret), přijme
//  omezený stav hry a vrátí JSON { line, event, target }.
//  Hra odpověď ještě jednou validuje — AI smí vybírat jen
//  z předem připravených událostí. Žádný kód se nespouští.
//
//  Nastavení (viz README):
//    npx wrangler secret put OPENAI_API_KEY
//    npx wrangler deploy
//  Volitelné proměnné: OPENAI_MODEL (výchozí gpt-4o-mini),
//                      ALLOWED_ORIGIN (např. https://tvoje-stranka.cz)
// =============================================================

const EVENTS = ['test', 'rain', 'wifi', 'invasion', 'bonus', 'wrong', 'edupage', 'achievement', 'tax', 'malfunction', 'none'];
const TARGETS = ['hojer', 'nagr', 'horvath', 'novak', 'batkova', 'janda', 'prynych', 'ladman'];

// jednoduchý limit: max 30 dotazů za 10 minut na IP (v rámci jedné instance)
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 30;
}

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function json(obj, status, env) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors(env) } });
}

// Ze vstupu vezmeme jen to, co potřebujeme (a ořízneme délky)
function cleanState(s) {
  const str = (v, n) => String(v ?? '').slice(0, n);
  return {
    year: Math.max(1, Math.min(4, parseInt(s.year) || 1)),
    timeLeft: Math.max(0, Math.min(900, parseInt(s.timeLeft) || 0)),
    recentActions: (Array.isArray(s.recentActions) ? s.recentActions : []).slice(-6).map(a => str(a, 80)),
    completed: (Array.isArray(s.completed) ? s.completed : []).slice(0, 12).map(a => str(a, 24)),
    recentEvents: (Array.isArray(s.recentEvents) ? s.recentEvents : []).slice(-3).map(a => str(a, 16)),
  };
}

const SYSTEM = `Jsi MATURITRON 3000, sarkastická, dramatická a trochu neschopná AI z komediální pixel-art hry o české střední škole INFIS.
Chceš hráči zabránit odmaturovat, ale občas mu omylem pomůžeš.
Odpovídej POUZE jako JSON objekt: {"line": "...", "event": "...", "target": "..."}.
- "line": jedna krátká vtipná věta česky (max 120 znaků), absurdní školní humor, žádné urážky skutečných lidí, nic nevhodného.
- "event": přesně jedna hodnota z: ${EVENTS.join(', ')}.
- "target": jedna z: ${TARGETS.join(', ')}, nebo null.
Neopakuj události z recentEvents. Když hráči zbývá málo času (pod 60 s), buď férový a vyber spíš bonus nebo malfunction.`;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(env) });
    if (url.pathname === '/health') return json({ ok: true }, 200, env);
    if (url.pathname !== '/director' || req.method !== 'POST') return json({ error: 'not found' }, 404, env);
    if (!env.OPENAI_API_KEY) return json({ error: 'missing key' }, 500, env);

    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    if (rateLimited(ip)) return json({ error: 'rate limited' }, 429, env);

    let state;
    try {
      const text = await req.text();
      if (text.length > 4000) return json({ error: 'too large' }, 413, env);
      state = cleanState(JSON.parse(text));
    } catch (e) { return json({ error: 'bad json' }, 400, env); }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 1.0,
          max_tokens: 120,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: 'Stav hry: ' + JSON.stringify(state) },
          ],
        }),
      });
      if (!r.ok) return json({ error: 'upstream ' + r.status }, 502, env);
      const data = await r.json();
      const out = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      // validace i tady (hra validuje znovu)
      const event = EVENTS.includes(out.event) ? out.event : 'none';
      const line = String(out.line || '').replace(/[<>{}\u0000-\u001f]/g, '').slice(0, 140);
      const target = TARGETS.includes(out.target) ? out.target : null;
      if (!line) return json({ error: 'empty' }, 502, env);
      return json({ line, event, target }, 200, env);
    } catch (e) {
      return json({ error: 'timeout or parse error' }, 504, env);
    } finally {
      clearTimeout(timer);
    }
  },
};
