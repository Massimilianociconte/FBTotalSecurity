# AUDIT 360° + REDESIGN + SEO/GEO + PERFORMANCE — FB TOTAL SECURITY
**Data audit:** 22 agosto 2026 · **Perimetro:** intero sito (10 pagine root + 21 articoli blog) · **Metodo:** analisi codice sorgente completo + test live (headers, TTFB) + analisi schema/CSS/JS

---

# EXECUTIVE SUMMARY

## Stato attuale

Il sito è una statica ben intenzionata, con un sistema di design coerente (palette smeraldo su dark, token CSS ben definiti) e un blog sorprendentemente maturo per internal linking e struttura editoriale. Sotto il cofano però convive tecnologia fragile: un motore JavaScript che riscrive il DOM per scopi SEO, un form contatti che funziona solo via `mailto:`, configurazioni server (`​.htaccess`) che **non vengono mai applicate** perché il sito è pubblicato su GitHub Pages + Cloudflare, e tracciamento GA4/FB Pixel che parte **senza consenso cookie** (rischio GDPR concreto).

Overall Score: **61/100**

| Area | Score |
| --- | --: |
| UI/UX | 58/100 |
| Visual Design | 66/100 |
| Responsive | 55/100 |
| Layout Stability | 78/100 |
| Navigation | 60/100 |
| Conversion | 45/100 |
| Technical SEO | 70/100 |
| Local SEO | 55/100 |
| GEO / AI | 68/100 |
| Performance | 75/100 |
| Core Web Vitals (stimato) | 72/100 |
| Accessibility | 62/100 |
| Security | 40/100 |
| Content Quality | 68/100 |
| Technical Quality | 50/100 |
| **OVERALL** | **61/100** |

*Calcolo overall: media pesata (conversion e security pesano doppio per un sito lead-generation nel settore sicurezza).*

## Top 10 problemi

1. **Form contatti via `mailto:`** — il lead viene gestito dal client email dell'utente; su mobile senza app mail configurata il lead si perde in silenzio, e il sito mostra comunque "success". Nessun dato salvato, nessun tracciamento conversione affidabile. *(P0)*
2. **Header di sicurezza morti** — CSP, HSTS, X-Frame-Options ecc. sono in `.htaccess` ma il sito gira su GitHub Pages: nessun header arriva al browser. Verificato via curl sul dominio live. *(P0)*
3. **GA4 + FB Pixel caricati senza banner di consenso** — partono alla prima interazione (anche un semplice scroll). Violazione potenziale GDPR/ePrivacy. *(P0)*
4. **`sorveglianza.html`: meta description vuota nel codice sorgente** — è popolata solo via JS (`data-translate`); crawler senza JS vedono description assente sulla pagina servizio più competitiva. *(P0)*
5. **Chiave privata TLS (`server.key`) nel repository** insieme a file di test/debug (`test-navbar.html`, `debug-buttons.html`, `server.py`, credenziali pixel in `.md`) potenzialmente pubblicabili. *(P0 sicurezza igiene repo)*
6. **CTA "Contatti" morta su tutto il blog** — `href="#contatti"` ma `blog/index.html` non ha nessuna sezione con quell'id: click senza effetto. *(P0 conversione)*
7. **`ai-unified-engine.js` riscrive il DOM dopo il load** (inietta link "Servizi correlati", sostituisce testo nei `<p>`, aggiunge meta tag): causa CLS, consuma CPU su ogni paragrafo, ed espone a valutazioni spam lato motori. *(P1)*
8. **NAP incompleto e incoerente** — indirizzo "Corso Sempione" senza numero civico ovunque, email su Gmail invece che su dominio, coordinate geografiche diverse tra i tre blocchi JSON-LD della homepage, `sameAs` diversi tra Organization e LocalBusiness. *(P1)*
9. **Navbar 110px fissa + 9 voci di menu** — occupa ~15% dell'viewport su iPhone SE, gerarchia poco chiara (Blog e Lavora-con-noi prima di Chi siamo), hamburger non operativo da tastiera. *(P1)*
10. **Responsive a scatti**: solo breakpoint 768px e 480px realmente presidiati; fascia tablet 769–1024px priva di layout dedicato. *(P1)*

---

# 1. PROBLEMI CRITICI (dettaglio cosa/perché/gravity/fix/verifica)

### C1 — Funnel lead rotto (form `mailto:`)
- **Cosa succede:** submit del form → `window.open('mailto:fb.totalsicurezza@gmail.com?…')` (script.js:387-443).
- **Perché è grave:** su iOS/Android senza mail app configurata non succede nulla di visibile; l'utente vede comunque "Client di posta aperto!" (falso successo). Zero dati persistiti, zero conversion tracking, zero protezione spam.
- **Fix:** endpoint lato server (Cloudflare Pages Functions, Formspree, Web3Forms o Netlify Forms) + fetch POST + stati loading/success/error + honeypot + rate-limit + redirect a pagina di ringraziamento tracciata.
- **Verifica:** invio test da mobile senza mail app → ricezione email + evento GA `generate_lead`.
- **Impatto:** è il singolo intervento a più alto ROI del progetto.

### C2 — Security headers mai serviti
- **Cosa:** `.htaccess` definisce CSP con hash, HSTS preload, COOP/COEP/CORP, Permissions-Policy. Live (curl): nessuno di questi header presente; solo `cache-control: max-age=600` di GitHub Pages.
- **Gravità:** alta (settore sicurezza = aspettativa massima). Anche il caching long-term (immutable 1 anno) dichiarato in `.htaccess` non è attivo.
- **Fix:** spostare gli header dove il runtime li applica: Cloudflare Transform Rules / Response Headers (consigliato: HSTS, XCTO, XFO, Referrer-Policy, Permissions-Policy) oppure migrare hosting su Cloudflare Pages dove `_headers` funziona nativamente.
- **Nota CSP:** la CSP attuale richiede Trusted Types e hash su script inline: va rigenerata DOPO aver rimosso gli script inline superflui (zaraz bootstrap, engine), altrimenti rompe il sito.
- **Verifica:** `curl -sI https://www.fbtotalsecurity.com/ | grep -i strict-transport` + securityheaders.com grade.

### C3 — Tracciamento senza consenso (GDPR)
- **Cosa:** `js/third-party-loader.js` carica GA4 (`G-K3KTWNJ5CQ`) e FB Pixel alla prima interazione (scroll incluso). Nessun banner, nessuna preferenza memorizzata. In più il `<noscript>` con pixel img carica FB anche senza JS.
- **Gravità:** alta (sanzionabile, oltre che incoerente con privacy-policy.html che dichiara consenso).
- **Fix:** banner CMP leggero (Finsweet/Klaro/Iubenda) → caricare GA/Pixel SOLO dopo consenso; rimuovere pixel noscript; aggiornare cookie-policy.
- **Verifica:** prima del consenso: nessuna richiesta a googletagmanager/connect.facebook.net (DevTools network).

### C4 — Meta description assente su sorveglianza.html
- **Cosa:** `<meta name="description" data-translate="sorveglianza-meta-description">` senza attributo `content`. Stessa cosa per og:description.
- **Fix:** scrivere content statico IT (~150 caratteri) e tenere la traduzione EN come enhancement.
- **Verifica:** view-source + SERP snippet.

### C5 — Igiene repository / segreti
- `server.key` (chiave privata) + `server.crt` nella root del repo. Se il repo è pubblico → compromissione (ruotare/rigenerare immediatamente).
- File esposti se deployati così: `debug-buttons.html`, `debug-script.html`, `test-*.html`, `server.py`, `https_server.py`, `script_backup.js`, `facebook-pixel-setup.md` (contiene ID pixel e istruzioni), `info-aziende.txt`.
- **Fix:** rimuovere dal deploy (git rm + `.gitignore`), ruotare la chiave, aggiungere block su Cloudflare WAF per path `/test-*`, `/debug-*`.

---

# 2. UI/UX

**Linguaggio visuale attuale:** dark theme "Smeraldo Premium" (#050a14 → #111827), accent #10b981, glassmorphism, glow verdi, radius 12-16px, Inter. Coerenza cromatica buona (token ben organizzati), MA:

- **Gerarchia CTA debole:** primaria e secondaria differiscono poco; troppi `btn-primary` ripetuti nelle sezioni servizio diluiscono l'azione principale.
- **Sezioni dopo il contatto:** `agency-section` e `normative-section` stanno DOPO `#contatti`: contenuto utile sepolto sotto la fine del funnel.
- **Hero:** titolo con gradiente bianco→verde (leggibilità borderline su mobile piccoli), 3 badge sopra il titolo spingono l'H1 sotto la fold su iPhone SE; subtitle lungo (43 parole).
- **Mission-section:** muri di testo centrati, nessuno scafo visivo (icona, numeri, proof).
- **Carousel partner:** altezza riservata 160px per 4 loghi piccoli (26px alti) — spreco verticale enorme.
- **Icone:** mix SVG custom (buoni) e dimensioni incoerenti (service-icon 80px vs 100px nello stesso grid).
- **Footer:** contiene credit "Creato e Curato da WebNovis" con mailto hello@webnovis.com — elemento estraneo al brand che ruba attenzione (e link juice) nel punto peggiore.
- **Emoji bandiere 🇮🇹🇬🇧** come selettore lingua: rendering diverso per piattaforma, non professionale, doppio selettore (mobile + desktop) duplicato nel DOM.

**Design system da formalizzare:** typography scale fluida (clamp), spacing scale 4/8px, 2 soli tipi bottone (primary/ghost) + variante tel, card system unico, elevazione a 3 livelli (surface/elevated/raised già presenti nei token ma usate in modo arbitrario).

---

# 3. NAVBAR

**Stato attuale (audit):**
- Fissa 110px (`--header-height`), body padding-top 110px: coerenti, nessun salto. Buona base anti-CLS.
- `.scrolled` cambia solo background/shadow (nessun cambio altezza → stabile). ✔
- Mobile menu: overlay fixed sotto header, opacity+visibility transition, body scroll lock (`overflow:hidden`) ✔, chiusura su click fuori ✔, Escape ✔, chiusura su click link ✔.
- **Problemi trovati:**
  1. Altezza eccessiva su mobile (110px ≈ 15% viewport iPhone SE).
  2. 8 voci + lingua + logo: affollata; ordine non orientato alla decisione (Blog e Lavora con noi prima di Chi siamo; Contatti ultima).
  3. Hamburger = `div role="button"` SENZA handler keydown Enter/Space → inoperabile da tastiera; niente focus trap nel menu; focus non riportato sull'hamburger alla chiusura.
  4. CTA "Contatti" è un anchor `#contatti` che su blog/index non esiste (bug) e su tutte le pagine costringe a scroll lunghi invece di portare a una pagina contatti dedicata.
  5. `z-index` caos: 9999 header, 10000 menu, 10001 logo/hamburger, 100000 (elemento sconosciuto), 1001/1000 vari — mappa da consolidare in scale documentata.
  6. Selettore lingua duplicato (mobile-navbar-language + desktop-language-selector).

**Redesign proposto:**
- Altezza: 72px desktop / 60px mobile (variabile unica + `--header-height` riusata ovunque).
- Struktur: Logo | Nebbiogeni · Grate & Inferriate · Videosorveglianza · Allarmi · Chi siamo | [tel icon] [**Sopralluogo gratuito**] | lingua (icona globo + dropdown).
- Blog spostato nel footer + link nel menu "Consigli" (facoltativo); "Lavora con noi" solo footer.
- CTA primaria sempre visibile con numero telefono accanto su ≥1024px.
- Mobile: bottom sheet menu full-height con gruppi (Soluzioni / Azienda / Contatti), CTA tel fisso in fondo al menu; `<button>` semantico con gestione tastiera completa + focus trap + inert sul contenuto sottostante.
- Su scroll >8px: header compatta a 56px SOLO su desktop (transizione height animabile senza CLS perché fixed).

---

# 4. RESPONSIVE

- Breakpoint reali presenti: **768px (14 query), 480px (6), 769px (3), 1025px (1)**. Fascia 769–1024 quasi scoperta; 320–360px non testata esplicitamente.
- Griglie: services-grid passa da 4 colonne → impilato a 768: comportamento "a scatto"; serve `repeat(auto-fit,minmax(240px,1fr))` o breakpoint 1024 intermedio (2×2).
- Container 1200px fisso con padding 1rem/2rem: ok, ma tipografia non fluida fuori dall'hero (hero usa clamp, il resto scala a salti).
- Overflow orizzontale: nessun caso strutturale trovato nel codice (max-width+box-sizing globali ✔); da verificare a runtime a 320px carousel e tabelle blog.
- Touch targets: voci menu mobile ~ok; bottoni social footer e flag lingua < 44px raccomandati.
- **Azioni:** introdurre scale fluida (`clamp`) per h2-h4 e spacing; breakpoint 1024px dedicato; test matrice 320/360/375/390/414/768/1024/1280/1440/1920.

---

# 5. LAYOUT STABILITY

Punteggio migliore dell'area tecnica: molto lavoro è stato fatto bene.
✔ Immagini con width/height quasi ovunque (unica eccezione: 1 immagine in chi-siamo.html)
✔ Font fallback con metriche ascent/descent override + `font-display:optional`
✔ Lite YouTube embed con thumbnail dimensionata (380×214) — nessun iframe above-the-fold
✔ Carousel con min-height riservata; hero-title/subtitle con min-height calcolate

Residui da correggere:
1. **Conflitto hero-container:** inline critical CSS dichiara `min-height:80vh`; un secondo blocco `<style>` più sotto lo sovrascrive a `min-height:60vh`. Il valore finale (60vh) rende inutile la prenotazione pensata per l'above-the-fold.
2. **Matematica hero errata:** `body{padding-top:110px}` + `.hero{min-height:calc(100vh - 82px)}` = hero che termina 28px oltre la fold (82≠110: refuso). Su ogni pagina.
3. **ai-unified-engine.js appende nodi dopo il load** (link correlati) = CLS post-render reale sulle pagine dove attiva.
4. Notifiche form (`showNotification`) create dinamicamente in overlay — ok (position:fixed) ma verificare che non sia absolute.
5. Traduzione IT/EN via JS sostituisce testi di lunghezza diversa → shift dentro sezioni quando si switcha lingua (accettabile se avviene su azione utente, ma da mitigare con min-height sui contenitori critici).

---

# 6. PERFORMANCE

**Misurazioni live (curl, da Milano/Cloudflare):** DNS 2ms · TLS 28ms · **TTFB 55ms** (eccellente) · HTML 120KB (~22KB gzip stimato).

**Budget attuale per vista homepage (stimato):**
| Risorsa | Peso grezzo | Note |
| --- | --: | --- |
| index.html | 120 KB | non minificato, commenti e schema inline abbondante |
| styles.min.css | 65 KB (~12KB gz) | caricato async via media=print trick + critical inline ✔ |
| script.min.js | 177 KB (~45KB gz) | monolite: ~2.170 righe sono dizionario traduzioni EN |
| ai-unified-engine.js | 20 KB | da rimuovere (vedi §7) |
| Fonts | 2×woff2 Inter | preload + optional ✔ |
| Logo | webp piccolo | preload ✔ |

**Punti forti:** preconnect GA/FB, defer ovunque, lazy-loading immagini (16 su index), fetchpriority alto su logo, Zaraz per terze parti, TTFB ottimo.

**Problemi:**
1. **script.min.js gonfio:** il dizionario EN (≈150KB grezzo del file) viene scaricato da tutti gli utenti italiani. Fix: separare `translations.en.js` caricato solo on-demand al click EN → −60/70% peso JS.
2. **HTML non minificato** (commenti, indentazione): −30/40KB grezzi possibili con build step.
3. Schema JSON-LD duplicato/triplicato in ogni head: pulizia = pochi KB ma soprattutto chiarezza semantica.
4. Cache long-term NON attiva (GitHub Pages max-age=600): le risorse `?v=` non sfruttano immutable → fix via Cloudflare (Edge Cache TTL su css/js/img).
5. `lavora-con-noi.html` carica `gtag/js?id=G-XXXXXXXXXX` — **ID placeholder rotto**: richiesta di rete inutile + Analytics non traccia quella pagina.
6. Immagini giganti presenti nel repo (placeholder1-svg-chisiamo.png 2.5MB, CIVIS-copertina.png 2.2MB) — NON referenziate dalle pagine (verificato): eliminarle dal deploy per igiene.
7. INP: engine che scandisce `querySelectorAll('p,li,div')` e fa replace innerHTML → main-thread work post-load; rimozione = beneficio diretto.

---

# 7. TECHNICAL SEO

**Ok:** canonical su tutte le pagine ✔ · sitemap.xml completa e coerente coi file reali (31 URL, tutti esistenti) ✔ · robots.txt pulito con sitemap e policy AI esplicite ✔ · 1 H1 per pagina ✔ · redirect 301 legacy (grate-inferriate) previsti (ma su GitHub Pages i Redirect 301 dell'.htaccess NON funzionano — verificare su Cloudflare!) · breadcrumb schema presente · blog con date, author, canonical.

**Problemi:**
1. sorveglianza.html: description/og:description vuote (C4).
2. Doppio `<meta name="keywords">` su index (uno stuffed "AI-oriented") — i keywords meta sono ignorati dai motori: rimuoverli entrambi.
3. Meta tag inutili/deprecati: revisit-after, distribution, rating, classification, subject, topic, summary, cache-control come meta (ignorati).
4. `data-translate` su `<title>`: oggi innocuo (nessuna scrittura del title trovata in JS), ma è una bomba a orologeria SEO: rimuovere l'attributo dal tag title.
5. ai-unified-engine.js inietta meta tag e riscrive paragrafi client-side: Google può vederlo, ma è pattern ad alto rischio classificazione "hidden/cloaked text". Da sostituire con contenuti statici reali.
6. URL: estensione .html visibile — accettabile, ma da mantenere coerente nei link interni (già così ✔).
7. 404: non esiste una pagina 404 personalizzata (GitHub Pages ne serve una di default inglese) → creare 404.html.
8. Open Graph: image = logo 300×100 (non 1200×630) → anteprime social deboli. Creare OG images dedicate per home e 4 servizi.
9. Orphan check: tutte le pagine root sono collegate da navbar/footer ✔; termini-condizioni collegata solo dal form privacy — ok ma aggiungerla al footer legale.
10. Hreflang: correttamente assente (traduzione client-side non indicizzabile). Se l'EN diventa strategico → versioni statiche /en/ con hreflang.

---

# 8. LOCAL SEO

**Dichiarato:** Milano (Corso Sempione 20154), operatività Lombardia + Italia.

**Incoerenze trovate (entity consistency):**
| Dato | Valori trovati | Problema |
| --- | --- | --- |
| Indirizzo | "Corso Sempione" (senza civico) ×21 | NAP incompleto: Google non può validare |
| Email | fb.totalsicurezza@gmail.com ×55; franco.benedetto@fbtotalsecurity.com ×1 | Gmail come contatto primario indebolisce brand/entity |
| Coordinate | 45.4642/9.19 vs 45.4773/9.1715 | Due geo diversi nei 3 JSON-LD della stessa homepage |
| sameAs | Organization: FB+LinkedIn; LocalBusiness: FB+Instagram+X+LinkedIn | Set diversi nello stesso documento |
| Nome | "FB Total Security" vs "FB Total Security - Sistemi di Sicurezza Avanzati" | alternateName ok, ma name principale deve essere UNO |
| Telefono | +393802647367 ovunque ✔ (fake "+39 333 123 4567" solo in doc interne) | ok |

**Mancanze:**
- Tipo LocalBusiness generico: meglio **`SecuritySystemInstallationService`** (o LocalBusiness con additionalType) — non Restaurant ovviamente; aggiungere `@id` comuni e un solo blocco entità.
- Nessun embed Google Maps, nessuna pagina "Aree servite".
- GBP: verificare che nome/indirizzo/telefono/categoria ("Sicurezza aziendale", "Installazione sistemi antifurto") combacino con il sito; aggiungere sameAs del profilo GBP nel JSON-LD quando disponibile.
- Recensioni: nessuna testimonianza reale sul sito → raccogliere recensioni GBP e riportarne 3 (reali, con consenso) in homepage.

---

# 9. GEO / AI SEARCH

**Già presente (sorprendentemente avanzato):** llms.txt ben scritto con servizi/pagine/contatti ✔ · robots.txt consente GPTBot/ClaudeBot/Google-Extended/Applebot/Amazonbot ✔ · ai-knowledge-base.json + ai-context-sitemap.json ✔ · FAQ con FAQPage schema ✔.

**Cosa blocca la comprensione AI:**
1. **Triplice entità Organization/Organization-detail/LocalBusiness** con descrizioni e dati divergenti → un LLM che legge il raw HTML riceve 3 identità diverse. Consolidare in UN solo `@graph` con `@id` stabili.
2. Descrizioni "di marketing" ("Creatori di sicurezza", "agenzia plurimandataria leader") senza fatti verificabili → preferire frasi fattuali: cosa installa, con quali marchi, dove, con quali certificazioni di prodotto.
3. Contenuti chiave solo via JS (descrizione sorveglianza, traduzioni) → molti crawler AI non eseguono JS.
4. Risposte dirette assenti: mancano mini-paragrafi tipo "FB Total Security installa sistemi nebbiogeni UR Fog a Milano e in tutta Italia…" in cima a ogni pagina servizio (pattern ideale per AI Overviews/Perplexity).

**Domande target da poter soddisfare factualmente:** "Chi installa nebbiogeni a Milano?", "Quanto costa un sistema nebbiogeno per un negozio?", "FB Total Security offre monitoraggio 24/7?" (oggi: risposta implicita e dispersa).

---

# 10. STRUCTURED DATA

Stato: 3+ blocchi JSON-LD in homepage (Organization ×2, WebSite, BreadcrumbList 1-item, LocalBusiness, VideoObject) + per-pagina.

**Interventi:**
1. **Unificare** in un solo `application/ld+json` `@graph`: Organization(@id:#organization) → LocalBusiness/ProfessionalService(@id:#business) → WebSite → WebPage → BreadcrumbList → Service ×4 → ContactPoint.
2. Eliminare: `award` usato per slogan non-premi; `hasCredential` generico senza nome di ente certificatore (se non dimostrabile → rimuovere); BreadcrumbList homepage mono-item.
3. VideoObject: `contentUrl` deve puntare al video (YouTube), non alla pagina; uploadDate inventata ("2023-06-15") → mettere la data reale YouTube o omettere.
4. Service schema su ciascuna pagina servizio con `areaServed`, `provider` (@id organization), `serviceType`, FAQ integrate.
5. Article/BlogPosting già presente negli articoli ✔ (dateModified aggiornate 2026-08-10 ✔) — aggiungere `publisher` @id e `image` reale per articolo.
6. Regola ferrea: markup solo di contenuti visibili nella pagina.

---

# 11. SECURITY

| Risorsa | Esito |
| --- | --- |
| HTTPS + HSTS | HTTPS ✔; HSTS dichiarato ma NON servito (C2) |
| CSP | Definita ma NON servita; inoltre troppo fragile (hash inline multipli + Trusted Types) |
| XSS | Nessun innerHTML con input utente trovato nei percorsi principali ✔; engine usa innerHTML.replace con costanti (basso rischio ma da eliminare comunque) |
| Form | mailto: nessuna superficie server = nessun CSRF, MA nessuna protezione spam e nessun rate-limit quando si passerà a backend (previstare honeypot+turnstile) |
| Cookie/storage | GA/Pixel senza consenso (C3); cookie_flags Secure/SameSite=None su GA (None richiesto solo se cross-site) |
| Secret nel repo | **server.key (privata!)** + ID GA/pixel in chiaro (bassa sensibilità) + credenziali assenti altrove ✔ |
| Dipendenze | Nessuna libreria JS esterna (vanilla) = superficie minima ✔ |
| Headers mancanti live | Tutti (C2) |

**Azioni immediate:** rimuovere/ruotare server.key; attivare header via Cloudflare; CMP consenso; WAF block su path di test; valuta Cloudflare Turnstile sul nuovo form.

---

# 12. ACCESSIBILITY

✔ skip-link presente · label+sronly sui campi form ✔ · aria-expanded/controls hamburger ✔ · Escape chiude menu ✔ · prefers-reduced-motion presente (1 regola) · contrasti generalmente buoni (dark theme, testo #f1f5f9/#94a3b8 su #050a14 ≈ 7+:1).

**Da correggere:**
1. Hamburger `<div role="button">`: non focusabile-operabile correttamente via Enter/Space → usare `<button>` reale.
2. Focus trap assente nel menu mobile; focus non restituito al trigger.
3. Bandiere emoji come unici identificatori lingua (screen reader leggono "flag Italy") + stato active solo visuale (colore) → aggiungere aria-pressed.
4. Icone SVG decorative senza `aria-hidden="true"` in alcuni casi; icone informative con aria-label ✔.
5. Link "Contatti" morto su blog = esperienza letta come link senza effetto.
6. `title` usato come tooltip informativo su link (non accessibile da touch) — ridondare con testo visibile dove importante.
7. Contrasto da verificare: btn-primary testo #0f172a su gradiente #10b981→#34d399 ≈ 4.6:1 bordo AA testo normale — ok ma da presidiare in caso di cambio palette.
8. Heading: gerarchia ok (H1 unici); verificare che le card servizio usino h3 dopo h2 di sezione ✔.

---

# 13. CONVERSION

**Funnel attuale:** Hero CTA "#contatti" → scroll lungo (mission, 4 card, partner, 4 sezioni servizio con video, why, clients, FAQ) → form mailto.

**Criticità:**
1. Form mailto (C1) — il buco nero dei lead.
2. Nessun WhatsApp Business (standard de facto per il settore a Milano): 0 occorrenze nel codice.
3. Telefono poco protagonista: presente in footer/schema ma non come CTA permanente; su mobile non c'è sticky call bar.
4. CTA "Richiedi Consulenza Gratuita" (hero) vs "Richiedi Preventivo" (sezioni) vs "Contatti" (nav): tre promesse diverse → unificare gerarchia: **Primaria = "Richiedi sopralluogo gratuito"; Secondaria = "Chiama ora"; Terziaria = "Scopri il servizio"**.
5. Prova sociale debole: sezione clients senza citazioni reali, numeri non quantificati ("anni di esperienza" senza cifra precisa in hero).
6. Form: 5 campi ok, checkbox privacy linka a *Termini e Condizioni* invece che a Privacy Policy (errore GDPR formale).
7. Nessuna pagina Contatti dedicata (il contatto vive solo in fondo alle pagine) → creare `/contatti.html` (utile anche per Local SEO e per ads future).
8. Sopralluogo: menzionato ma non reso processo (cosa succede dopo? tempi? gratis?) → micro-funnel "Come funziona" in 3 step aumenta la conversione nel settore.

---

# 14. CONTENT

**Punti di forza:** blog con 20 guide vere, cluster tematici riconoscibili (nebbiogeni, grate/RC, videosorveglianza/GDPR, allarmi, bonus fiscale, sicurezza negozi/ville/aziende), 8-14 link interni verso i servizi per articolo, date aggiornate. Servizi con struttura ricca (caratteristiche, certificazioni, FAQ).

**Gap e correzioni mirate (senza riscrivere tutto):**
1. **Cannibalizzazione da monitorare:** "nebbiogeni-per-negozi-protezione-furti" vs "come-proteggere-negozio-dai-furti" vs "nebbiogeni-ur-fog-come-funzionano" → differenziare intent: commerciale vs informativa vs prodotto; cross-link con anchor distinti.
2. Homepage mission: copy generico ("In un mondo in continua evoluzione…") → sostituire con proposta di valore concreta + 3 numeri (anni, interventi, marche).
3. Claim non supportati da prova visibile (vedi tabella sotto) → o dimostrarli o riformularli.
4. Manca una pagina "Aree servite"/"Milano" (Local SEO) e una FAQ globale.
5. EN translations incomplete (commenti nel codice: "Missing sorveglianza contact and form translations") → se EN resta, completare; altrimenti rimuovere il selettore (scelta consigliata finché non ci sono versioni statiche).

**Classificazione CLAIM (obbligatoria):**
| Claim | Stato | Azione |
| --- | --- | --- |
| "Leader italiano/in Italia" | ⚠️ POTENZIALMENTE PROBLEMATICO | Rimuovere o sostituire con dato dimostrabile |
| "Agenzia plurimandataria certificata" | ❓ DA VERIFICARE | Specificare mandati/ente; altrimenti riformulare |
| hasCredential "Certificazione Sistemi di Sicurezza" | ⚠️ PROBLEMATICO (generico) | Rimuovere dallo schema finché non nominabile |
| Fondato 2000 / "oltre 20 anni" | ❓ coerenti tra loro | Confermare anno reale |
| EN 50131-8:2019 (nebbiogeni) | ❓ DA VERIFICARE su schede UR Fog | Norma reale; legarla al modello specifico |
| RC2–RC6 / EN 1627-1630 (grate) | ✅ normativa reale | Specificare classe certificata del prodotto XECUR |
| "Visibilità a zero in 10 secondi" | ❓ DA VERIFICARE | Citare scheda tecnica UR Fog |
| "Tecnologia brevettata (caldaia layer, pompa Fog Storm)" | ✅ claim produttore | Attribuire a UR Fog, non all'azienda |
| Collegamento centrale operativa / 112 (CIVIS) | ❓ DA VERIFICARE | Documentare contratto CIVIS |
| "Assistenza H24 / 365" | ❓ DA VERIFICARE | Se SLA reale → mostralo; altrimenti "su appuntamento" |
| "GPG armate 24/7" | ❓ DA VERIFICARE | Richiede vigilanza armata abilitata |
| "Bonus Sicurezza 50%" | ❓ DA VERIFICARE (dipende da legge/anno) | Aggiornare con fonte e scadenze |
| "Partner esclusivo XECUR" (llms.txt) | ⚠️ "ESCLUSIVO"? | Verificare accordo prima di affermarlo |

---

# 15. REDESIGN PROPOSTO

**Direzione:** evoluzione, non rivoluzione. La palette smeraldo/dark è distintiva e lontana dai cliché blu-telecamere: si tiene. Si raffina verso "premium sobrio": meno glow, più spazio, tipografia protagonista, prove concrete.

**Design system:**
- **Tipografia:** Inter (tenuta) con scala fluida: h1 clamp(2rem,5vw,3.5rem), h2 clamp(1.6rem,3.2vw,2.25rem), body 1rem/1.65. Numeri/tabulari per stats.
- **Colori:** bg #050a14/#0a0f1e; accent #10b981 ridotto a *accento* (bordi 1px, icone, focus), NON gradienti su testi grandi; superfici #111827/#1a2332; testo #f1f5f9 / #94a3b8.
- **Spacing scale:** 4·8·12·16·24·32·48·64·96 · **Radius:** 8/12/16 · **Ombre:** soft single-layer (niente doppi glow).
- **Componenti:** Button(primary/ghost/tel), Card(unica, hover translateY(-2px)+border accent), Badge(contesto), Stat(number+label), SectionHeader(kicker+h2+lede), FAQ(details stilizzato).

**Homepage nuovo flusso:**
Hero (H1 problema/soluzione + 1 promessa + 2 CTA + micro-proof) → Barra numeri (anni/interventi/marchi) → Servizi (4 card) → Per chi (Casa/Negozio/Azienda/Industria — tab o card) → Come funziona (3 step: sopralluogo→progetto→installazione+assistenza) → Partner & certificazioni (loghi statici, niente carousel) → FAQ (5) → Contatti (form + tel + area servita) → Footer.

**Navbar:** vedi §3 (72px, 5 voci, tel + CTA sopralluogo, menu mobile bottom-sheet accessibile).

**Mobile UX:** sticky bottom bar (Chiama | Sopralluogo) su <768px; WhatsApp Business se attivato; tap-to-call su tutti i numeri; form con autocomplete e tastiera giusta (tel/email/inputmode numeric).

**Immagini/media:** hero resta tipografico (veloce); video demo in lite-embed sotto fold ✔ già corretto; OG image 1200×630 dedicate; sostituire emoji-flag con SVG.

**IA proposta (confronto con attuale — nessuna pagina nuova imposta):**
```
Home
├─ Servizi: nebbiogeni · serramenti · sorveglianza · allarmi   (esistenti)
├─ Contatti (NUOVA pagina dedicata)                            (gap attuale)
├─ Chi siamo (esistente, arricchita con prove/certificazioni)
├─ Blog (esistente, 20 articoli) 
└─ Legali: privacy · cookie · termini (footer)
"Lavora con noi" → footer (fuori dalla navbar)
```
La suddivisione per contesto (Casa/Negozio/Azienda) si implementa come sezione interna alla home + cluster blog già esistente: nessuna farm di pagine programmatiche.

---

# 16. PRIORITÀ DI IMPLEMENTAZIONE

**P0 — Critical (settimana 1)**
1. Backend form + stati success/error + honeypot (+ Turnstile) — sblocca tutti i lead
2. Consenso cookie (CMP) prima di GA/Pixel; rimozione pixel noscript
3. Rimuovere `server.key`/crt dal repo e ruotare; .gitignore per test/debug/server*.py/backup
4. Attivare security headers via Cloudflare (HSTS, XCTO, XFO, Referrer-Policy, Permissions-Policy) + caching long-term edge
5. meta description statica su sorveglianza.html (+ og:image dedicate)
6. Fix CTA Contatti su blog (link a nuova /contatti.html)

**P1 — High (settimane 2-3)**
7. Rimozione ai-unified-engine.js + sostituzione con contenuti/link statici
8. Split dizionario EN on-demand (−60% JS) o rimozione selettore lingua
9. Navbar redesign (altezza, 5 voci, button hamburger accessibile, focus trap)
10. Consolidamento JSON-LD in @graph unico + fix VideoObject/credential/geo
11. NAP: indirizzo con civico reale, email dominio, coordinate univoche; allineamento GBP
12. Pagina /contatti.html + sticky mobile call bar + WhatsApp (se attivo)

**P2 — Medium (settimane 3-5)**
13. Redesign homepage secondo nuovo flusso + barra numeri + "Come funziona"
14. Breakpoint 1024 + tipografia fluida globale + spacing scale
15. 404.html personalizzata; OG images; rimozione meta obsoleti/keywords
16. Reclam review: riscritture puntuali dei claim (tabella §14)
17. Testimonial/review reali in home

**P3 — Polish**
18. Micro-interazioni (focus-visible, hover card, scroll-reveal con IntersectionObserver già presente)
19. Minificazione HTML via build (o Cloudflare Auto-Minify altern.)
20. Versioni statiche EN + hreflang (se mercato estero rilevante)
21. Audit contrasto finale + screen reader pass

**KPI di verifica post-implementazione:** PSI mobile ≥90 · CLS <0.05 · JS ≤80KB gz · form completion rate misurabile (evento generate_lead) · securityheaders.com ≥A · 0 errori Rich Results · NAP identico su sito/GBP/social.

---
*Report generato da analisi statica del codice + test live. Nessuna modifica applicata al sito in questa fase: questo documento è la baseline concordata prima degli interventi.*
