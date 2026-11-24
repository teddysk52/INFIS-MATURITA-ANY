# INFIS: MATURITA ANY%

> „4 roky. 10 minut. 1 maturita.“

2D pixel-art komediální hra pro prohlížeč. Hráč má **10 minut** na to, aby přežil čtyři ročníky na INFISu a odmaturoval. Celou dobu ho zdržuje sarkastická (a trochu neschopná) AI **MATURITRON 3000**.

Čisté **HTML5 + CSS3 + vanilla JavaScript + Canvas**. Žádné frameworky, žádné knihovny, žádný povinný backend. Grafika, hudba i efekty se generují kódem; jediné soubory navíc jsou pixelový font a namluvený hlas MATURITRONA. Všechno je uložené lokálně, takže hra běží **i bez internetu**.

### Novinky ve verzi 2.0
- **Font Pixelify Sans** s plnou podporou češtiny (ě š č ř ž ý á í é ů ú ť ď ň). Velikosti se zaokrouhlují na pixelovou mřížku fontu a text s háčky nikdy není menší než 30 px, takže háčky jsou vždy ostré.
- **Vykreslování ve Full HD** (1920×1080), na menších obrazovkách se plynule zmenší.
- **Světlo a atmosféra:** každý ročník má vlastní denní dobu (ráno → poledne → zářivky → západ slunce), paprsky z oken s poletujícím prachem, lampy, měkké stíny u zdí a pod nábytkem. Světlo je předpočítané, takže hra drží 60 FPS i na slabém počítači.
- **Minimalistické UI** ve stylu her ze Steamu: titulní obrazovka, HUD, dialogy, karty menu, plynulá kamera a přechody.
- **Namluvený MATURITRON 3000:** 82 replik (ElevenLabs, model eleven_multilingual_v2, česky) s robotickým filtrem. Během řeči se ztiší hudba. Vypnout jde v Nastavení → „Hlas MATURITRONA“.

---

## Jak hru spustit

**Nejjednodušší způsob:** dvakrát klikni na `index.html`. Hra se otevře v prohlížeči a hned funguje.

**Doporučený způsob** (lokální server, nejspolehlivější načtení fontů):

```bash
cd infis-maturita
python -m http.server 8000
# pak otevři http://localhost:8000
```

Pro prezentaci před třídou: zmáčkni **F11** (celá obrazovka). Hra se sama přizpůsobí velikosti okna.

### Ovládání
| Klávesa | Akce |
|---|---|
| `WASD` / šipky | pohyb |
| `SHIFT` | sprint |
| `E` / mezerník | mluvit, zkoumat, přeskočit text |
| `1` `2` `3` / šipky | volby v dialogu |
| `ESC` | pauza |

Na mobilu a tabletu se automaticky zobrazí dotykové ovládání.

**Tip pro prezentaci:** v *Nastavení* zapni **„Čas stojí při dialozích“**. Třída si pak v klidu přečte vtipy a časovač neutíká.

---

## Obsah hry

| Ročník | Učitelé a mise |
|---|---|
| **1. ROČNÍK: Ještě máš naději** | Hojer (chyť utíkající středník → BUILD SUCCESSFUL), Horváth (RAM moduly + rohlík DDR5), Nágr (oprav bugy v realitě přímo na chodbě) |
| **2. ROČNÍK: Teď už je pozdě odejít** | Novák (útěk z anglické konverzace), Baťková (padající jazykové bubliny + načítající se dveře), Janda (metafora promění školu v hrad → útěk z knihy, bludiště je pokaždé jiné) |
| **3. ROČNÍK: Excel tě vidí** | Prynych (boss **EXCEL.EXE**), Láďman (mince vs. faktury, Finanční úřad tě najde), tajná učebna 404: **legendární Olga Břízová** (bonus +20 s) |
| **4. ROČNÍK: Maturita se blíží** | tři podpisy na přihlášku (Hojer, Baťková: timing ve 3 jazycích, Láďman), učitelé s „Máš chvilku?“ se tě snaží odchytit |
| **MATURITA** | finální boss **MATURITA.EXE**: 5 fází útoků (Excel buňky, matematika, daně, C# chyby, jazyky), sbíráš vysvědčení |

**MATURITRON 3000** zhruba každých 45–70 s spustí náhodnou událost: náhodný test, Excel rain, Wi-Fi error, invaze učitelů, bonusový čas, prohozené dveře, EduPage error, náhodný achievement, daňový útok nebo poruchu vlastní AI.

Hra obsahuje **32 achievementů** (včetně tajných, třeba 5× do zdi, 20 s bez hnutí, Ctrl+C, Konami kód, krmení automatu…).

**Férovost:** zásah nikdy nezabije, jen ubere 2–3 sekundy. Prohrát se dá jen tak, že vyprší čas. Každá mini-hra je hratelná bez jakýchkoli znalostí z předmětu.

---

## Struktura projektu

```
index.html            — stránka + HTML menu (hlavní menu, pauza, nastavení, konec)
style.css             — minimalistický UI styl
fonts/                — Pixelify Sans (SIL OFL licence)
voice/                — 82 namluvených replik MATURITRONA (mp3) + voices.js (text → soubor)
js/lighting.js        — světlo, stíny a atmosféra pro každý ročník
js/config.js          — NASTAVENÍ (délka hry, volitelná AI, jméno autora)
js/utils.js           — pomocné funkce (text, náhoda, panely)
js/input.js           — klávesnice
js/audio.js           — zvukové efekty + chiptune hudba (Web Audio API)
js/sprites.js         — pixel-art postavy a předměty kreslené kódem
js/world.js           — mapa školy (1 mapa, mění se podle ročníku) + kolize
js/dialogue.js        — dialogy ve stylu Undertale (psací stroj, volby)
js/achievements.js    — achievementy a jejich animace
js/minigames.js       — aréna a všech 9 mini-her včetně finálního bosse
js/director.js        — MATURITRON 3000 (offline pravidla + volitelná AI)
js/story.js           — ročníky, učitelé, mise, hlášky
js/game.js            — hlavní smyčka, hráč, HUD, efekty, menu
worker/               — volitelný Cloudflare Worker pro skutečnou AI
```

Jméno v titulcích změníš v `js/config.js` (`CREDITS_AUTHOR`). Pro testování můžeš otevřít `index.html?debug=1`: v herním světě pak `N` splní úkoly aktuálního ročníku, `T` ubere minutu a `B` skočí rovnou na finálního bosse.

---

## Volitelné: skutečná AI (MATURITRON přes OpenAI)

Hra je **100% hratelná bez toho**. Pokud chceš, aby MATURITRON vymýšlel hlášky živě:

1. Nainstaluj Node.js a přihlas se do Cloudflare: `npx wrangler login`
2. ```bash
   cd worker
   npx wrangler secret put OPENAI_API_KEY   # klíč se uloží jako tajný, NE do kódu
   npx wrangler deploy
   ```
3. Zkopíruj URL Workeru (např. `https://maturitron.tvuj-ucet.workers.dev`) do `js/config.js` → `AI_ENDPOINT`, nebo hru otevři jako `index.html?ai=https://maturitron.tvuj-ucet.workers.dev`.
4. V hlavním menu uvidíš **„MATURITRON: SKUTEČNÁ AI PŘIPOJENA“**.

**Bezpečnost:**
- API klíč je jen ve Workeru jako *secret*, nikdy v prohlížeči.
- Hra posílá jen omezený stav: ročník, zbývající čas, posledních pár akcí, splněné úkoly, poslední události.
- AI vrací JSON `{ line, event, target }`. Hra ho **validuje**: `event` musí být z pevného seznamu 10 předpřipravených událostí, `target` ze seznamu učitelů, text se ořízne a vyčistí. AI nikdy nespouští žádný kód a nemůže vytvořit nemožnou misi.
- Timeout 6 s, max. 14 dotazů za hru, min. 35 s mezi dotazy, rate-limit i ve Workeru. Po 3 chybách se hra sama přepne do offline režimu a pokračuje dál.

---

## Poznámka

Všechny dialogy jsou smyšlené. Učitelé jsou přehnané, ale laskavé herní postavy. Při tvorbě nebyl zraněn žádný učitel. Jen Excel.
