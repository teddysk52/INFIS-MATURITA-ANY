# INFIS: MATURITA ANY% (3D)

> „4 roky. 10 minut. 1 maturita.“

3D komediální hra pro prohlížeč. Chodíš po **INFISu v Plzni** (Klatovská tř., Bory), plníš úkoly učitelů a máš **10 minut** na čtyři ročníky a maturitu. Celou dobu tě zdržuje sarkastická (a trochu neschopná) AI **MATURITRON 3000**.

Napsáno v čistém **HTML + CSS + JavaScriptu**. **3D engine je napsaný od nuly nad WebGL2**: žádné Three.js, žádný Unity, žádné knihovny. Textury, postavy, budovy, hudba i zvuky se generují kódem. Jediné soubory navíc jsou pixelový font a namluvené repliky MATURITRONA (`voice/`).

---

## Spuštění

Je potřeba lokální server, protože prohlížeč nedovolí načítat soubory přímo z disku:

```bash
cd infis-maturita
python3 -m http.server 8000
```

Pak otevři **http://localhost:8000**. Pro prezentaci zmáčkni F11 a v Nastavení nech zapnuté „Čas stojí při dialozích“, ať si třída stihne přečíst vtipy.

Funguje v Chrome, Edge, Firefoxu i Safari (potřebuje WebGL2). Bez internetu.

## Ovládání

| Klávesa | Akce |
|---|---|
| `W A S D` / šipky | pohyb |
| myš (klikni do hry) | rozhlížení |
| `SHIFT` | sprint (v autě turbo) |
| `E` | mluvit / použít / zavřít EduPage okno |
| `MEZERNÍK` | skok, další text (v autě ruční brzda) |
| `F` | nastoupit / vystoupit z auta |
| `H` | troubit |
| `V` | pohled z první osoby |
| `1 2 3` | volby v dialogu |
| `ESC` | pauza |

---

## Co ve hře je

**Mapa:** budova INFISu podle skutečnosti: modrá fasáda, červená valbová střecha, bílá půlkruhová stříška na modrých sloupech, oranžové dveře a rampa. Přízemí se dá celé projít: chodba (bílé zdi, dlaždice, dřevěné dveře, nástěnky, protipožární prosklené dveře), učebny, vestibul s bufetem a automaty, učebna 404 a maturitní sál.
Okolí: Klatovská třída s tramvají č. 4 a zastávkou Borský park, Borský park s tenisovými kurty, Úřad práce, záchranka, parkoviště, hotelová škola a paneláky. Na parkovišti stojí oranžové auto, se kterým se dá jezdit.

**Ročníky** (každý má jiné roční období a denní dobu):

| Ročník | Učitelé a mise |
|---|---|
| **1. Ještě máš naději** (září, ráno) | Hojer: chyť uprchlý středník → BUILD SUCCESSFUL · Horváth: RAM moduly + rohlík DDR5 · Nágr: oprav bugy v realitě |
| **2. Teď už je pozdě odejít** (zima, sníh, vánoční stromek) | Novák: útěk z anglické konverzace · Baťková: padající jazykové bubliny · Janda: škola se změní v hrad, pak útěk z knihy (bludiště je pokaždé jiné) |
| **3. Excel tě vidí** (podzim, západ slunce) | Prynych: boss EXCEL.EXE v Excel dimenzi · Láďman: mince vs. faktury, Finanční úřad tě najde · tajně: legendární Olga Břízová v učebně 404 (+20 s) |
| **4. Maturita se blíží** (noc, výstražná světla) | 3 podpisy (Hojer, Baťková = rychlé mačkání kláves ve 3 jazycích, Láďman venku na parkovišti), učitelé s „Máš chvilku?“ |
| **MATURITA** | komise → MATURITRON přeruší zkoušku → finální boss **MATURITA.EXE** (5 útoků, sbíráš 5 vysvědčení) |

**MATURITRON 3000** zhruba každých 45–70 s spustí jednu z 10 událostí: náhodný test, Excel rain, Wi-Fi error, invaze učitelů, bonusový čas, prohozené dveře (portály), EduPage okna, náhodný achievement, daňový útok, porucha AI. Když mluví, objeví se vedle tebe jako létající CRT monitor.

**45 achievementů**, např. *SRAŽEN TRAMVAJÍ Č. 4*, *KARIÉRNÍ PLÁNOVÁNÍ* (návštěva Úřadu práce), *ŘIDIČÁK? NE.*, *ARCHITEKTURA ŠKOLY OVĚŘENA*, Konami kód…

**Férovost:** zásah nezabíjí, jen ubere 2–5 sekund. Prohrát se dá jen tím, že vyprší čas. Na znalosti z předmětů se nikdo neptá.

---

## Jak je to naprogramované

```
index.html          stránka, HUD, dialogy, menu
style.css           vzhled UI
js/config.js        nastavení (délka hry, jméno autora, volitelná AI)
js/util.js          pomocné funkce, ukládání do localStorage
js/math.js          matice 4×4 (perspektiva, lookAt, rotace)
js/gl.js            WebGL2 renderer: shadery, stínová mapa, obloha, sprity, post-processing
js/textures.js      všechny textury kreslené kódem (pixel-art) + atlas spritů
js/mesh.js          MeshBuilder: skládání geometrie z kvádrů a stěn
js/collision.js     kolizní mřížka 0,5 m, pohyb s klouzáním po zdech, paprsek kamery
js/world.js         mapa INFISu a okolí, nábytek, výzdoba podle ročníku
js/characters.js    kostičkové postavy, animace chůze, portréty, MATURITRON
js/vehicles.js      řiditelné auto, tramvaje, provoz
js/audio.js         zvuky a chiptune hudba (Web Audio API) + přehrávání hlasu
js/entities.js      létající věci, částice, konfety, počasí (sníh, listí)
js/achievements.js  achievementy
js/ui.js            HUD, minimapa, jmenovky, toasty, nastavení
js/dialogue.js      dialogy s psacím strojem a volbami
js/arenas.js        systém mini-her + zvláštní světy (kniha, Excel, kyber-sál)
js/minigames.js     všechny mini-hry a finální boss
js/director.js      MATURITRON (offline pravidla + volitelná skutečná AI)
js/story.js         ročníky, mise, hlášky učitelů
js/main.js          hlavní smyčka, hráč, kamera, průběh hry
tools/bot.js        testovací autopilot (jen s ?debug=1)
worker/             volitelný Cloudflare Worker pro skutečnou AI
old-2d/             původní 2D verze hry
```

**Renderer:** jeden velký buffer pro statickou geometrii (~34 000 trojúhelníků), stínová mapa 2048 px se snapováním na texely, osvětlení slunce + polokoule + až 8 bodových světel, ve škole „zářivkové“ světlo, mlha, procedurální obloha s pixelovými mraky a hvězdami, post-processing (vinětace, barevné ladění podle ročníku, glitch, záblesk, červené pulzování v poslední minutě). Kamera ve třetí osobě se nepropadá zdmi (paprsek po kolizní mřížce), v mini-hrách se přepne na pohled shora „jako domeček pro panenky“.

### Test celé hry

Otevři `http://localhost:8000/?debug=1`, spusť hru a do konzole napiš:

```js
await Bot.playAll()
```

Autopilot (hledání cesty BFS po kolizní mřížce) projde všechny úkoly a mini-hry až po maturitu. Další klávesy v debug režimu: `N` splní úkoly ročníku, `Y` další ročník, `T` −60 s, `G` náhodná událost MATURITRONA, `B` skok na finále.

---

## Volitelné: skutečná AI

Hra je 100% hratelná bez toho. Pokud chceš, aby MATURITRON vymýšlel hlášky živě přes OpenAI:

1. `cd worker && npx wrangler secret put OPENAI_API_KEY && npx wrangler deploy`
2. URL Workeru dej do `js/config.js` → `AI_ENDPOINT` (nebo otevři hru s `?ai=https://...`).

API klíč je jen ve Workeru, **nikdy v prohlížeči**. AI vrací JSON `{ line, event, target }` a hra ho přísně validuje: smí vybrat jen jednu z 10 předpřipravených událostí, nikdy nespouští žádný kód. Timeout 6 s, max. 14 dotazů za hru, po 3 chybách přepne zpět na offline režim.

---

Všechny postavy a dialogy jsou smyšlené. Vzhled učitelů ve hře je vymyšlený podle předmětu, ne podle skutečnosti. Při tvorbě nebyl zraněn žádný učitel. Jen Excel.
# INFIS-MATURITA-ANY
