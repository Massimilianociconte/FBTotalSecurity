# Report SEO Strutturato - FB Total Security
## www.fbtotalsecurity.com
### Data analisi: 12 Febbraio 2026

---

## EXECUTIVE SUMMARY

Il sito **FB Total Security** (sito statico HTML, hosting GitHub Pages con CNAME custom) presenta una buona base SEO con structured data ricchi, ottimizzazioni performance avanzate e una strategia di contenuti coerente. Tuttavia, emergono **gap critici** che limitano il potenziale di ranking: incoerenze hreflang, pagine mancanti nella sitemap, duplicazione di structured data, problemi di heading hierarchy, e date `lastmod` obsolete. Il sito è ben posizionato per l'ottimizzazione AI grazie ai numerosi file JSON semantici, ma questi non sono collegati correttamente alle pagine HTML.

**Punteggio complessivo stimato: 62/100**

---

## 1. ARCHITETTURA TECNICA E INDICIZZABILITA'

### 1.1 Struttura URL
**Stato: BUONO con riserve**

- **Positivo**: URL puliti e descrittivi (`nebbiogeni.html`, `sorveglianza.html`, `allarmi.html`, `serramenti.html`)
- **Positivo**: Struttura piatta (flat architecture) adatta a un sito di dimensioni ridotte

**PROBLEMA CRITICO - Naming inconsistente**:
- `serramenti.html` descrive "Grate e Inferriate Blindate", non serramenti. L'URL non corrisponde al contenuto. Google valuta la coerenza URL-contenuto.
- Il redirect 301 da `/grate-inferriate` a `serramenti.html` in `.htaccess` aiuta ma non risolve il mismatch semantico.

> **Rif. Google**: [URL structure best practices](https://developers.google.com/search/docs/crawling-indexing/url-structure)

### 1.2 Sitemap XML
**Stato: PROBLEMATICO**

**Problemi identificati:**

| Problema | Severita' | Dettaglio |
|----------|----------|-----------|
| Pagine mancanti | CRITICO | `lavora-con-noi.html` non e' nella sitemap ma e' indicizzabile (`index, follow`) |
| URL fragment nella sitemap | CRITICO | `/#contatti` non e' una pagina autonoma, i fragment `#` vengono ignorati da Googlebot |
| Hreflang con fragment malformati | ALTO | `/#contatti?lang=it` - il `?` dopo `#` non e' valido |
| Date `lastmod` obsolete | ALTO | La maggior parte delle pagine ha `lastmod: 2025-01-17` (oltre 1 anno fa). Solo `serramenti.html` ha `2025-09-18` |
| Nessuna `lastmod` aggiornata | MEDIO | Le date non riflettono le modifiche reali, riducendo la fiducia di Googlebot nel segnale lastmod |

> **Rif. Google**: [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

### 1.3 Robots.txt
**Stato: BUONO**

- Correttamente configurato con `Allow: /` e blocco parametri di ricerca
- Blocco appropriato di bot spam (AhrefsBot, MJ12bot, DotBot)
- Sitemap dichiarata correttamente

**Nota**: Il blocco di AhrefsBot impedisce l'analisi del profilo backlink su Ahrefs. Valutare se e' intenzionale.

### 1.4 Canonical Tags
**Stato: BUONO**

- Canonical correttamente implementati su tutte le pagine
- Canonical puntano alla versione senza parametri `?lang=`
- Coerenti con la sitemap

### 1.5 Hreflang
**Stato: PROBLEMATICO**

**Problemi identificati:**

1. **Duplicazione hreflang nell'index.html**: I tag hreflang sono dichiarati DUE VOLTE (righe 132-134 e poi 160-162). Questo genera confusione per i crawler.
2. **Hreflang IT e default puntano allo stesso URL** (`https://www.fbtotalsecurity.com/`) - tecnicamente corretto ma ridondante.
3. **Mancanza di pagine in inglese reali**: I tag hreflang puntano a `?lang=en` ma non esistono pagine EN separate. La traduzione avviene via JavaScript client-side, **invisibile a Googlebot**.
4. **robots.txt blocca `?lang=*`**: Ma gli hreflang puntano proprio a `?lang=it` e `?lang=en`. **Conflitto diretto**: si dice a Google "indicizza queste versioni linguistiche" e contemporaneamente "non crawlare URL con `?lang=`".

> **Rif. Google**: [Tell Google about localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)

### 1.6 Performance e Core Web Vitals
**Stato: OTTIMIZZATO (con eccessi)**

**Ottimizzazioni presenti:**
- Critical CSS inline esteso per LCP e CLS
- Font preload con `fetchpriority="high"`
- Font fallback con metriche precise (Inter Fallback)
- `font-display: optional` per eliminare FOIT/FOUT
- CSS principale caricato async via `media="print"` pattern
- Compressione Gzip in `.htaccess`
- Cache headers aggressivi (1 anno, immutable)
- Immagini WebP con `width`/`height` espliciti
- `loading="lazy"` su immagini below-the-fold
- Lite YouTube Embed per video (no iframe eager)
- Third-party scripts caricati con `defer`

**Problemi identificati:**

| Problema | Severita' | Dettaglio |
|----------|----------|-----------|
| CSS critico inline ENORME | ALTO | Ogni pagina ha 100-200 righe di CSS inline nel `<head>`, aumentando il TTFB e il peso HTML. Molti stili sono duplicati tra pagine |
| Incoerenza `font-display` | MEDIO | `index.html` e `allarmi.html` usano `font-display: optional`, `nebbiogeni.html` e `serramenti.html` usano `font-display: swap`. Comportamento visivo incoerente |
| Versioni font diverse | MEDIO | Alcune pagine caricano Inter v13, altre Inter v20. URL diversi = download doppi se l'utente naviga tra pagine |
| `.htaccess` su GitHub Pages | ALTO | GitHub Pages **non supporta** `.htaccess`. Tutte le regole (HSTS, CSP, cache, redirect) non vengono applicate. Il file e' inerte |
| `Expires: Dec 2025` hardcoded | BASSO | La data di scadenza cache e' gia' passata (Feb 2026 attuale) |
| CSS file ~81KB non minificato | MEDIO | `styles.css` (81KB) vs `styles.min.css` (49KB) - la versione min e' usata ma 49KB resta significativo |
| JS file ~220KB | ALTO | `script.js` (220KB) e' molto pesante per un sito statico. `script.min.js` (175KB) migliora ma resta elevato |

### 1.7 Mobile-Friendliness
**Stato: BUONO**

- Viewport meta tag presente su tutte le pagine
- Menu hamburger implementato per mobile
- Layout responsive con media queries
- Font sizing con `clamp()` per scalabilita'
- Touch targets (bottoni) con dimensioni adeguate (`min-width: 180px`, `height: 48px`)

---

## 2. OTTIMIZZAZIONE ON-PAGE

### 2.1 Title Tag
**Stato: BUONO con margini di miglioramento**

| Pagina | Title | Lunghezza | Valutazione |
|--------|-------|-----------|-------------|
| index.html | "Sistemi di Sicurezza e Antifurto \| FB Total Security Milano" | 61 car. | OK - keyword primaria + brand + localita' |
| nebbiogeni.html | "Sistemi Nebbiogeni Professionali - Protezione Antifurto Istantanea \| FB Total Security Italia" | 93 car. | TROPPO LUNGO - troncato in SERP (max ~60 car.) |
| serramenti.html | "Grate e Inferriate Blindate - Sicurezza Porte e Finestre \| Italia" | 67 car. | LEGGERMENTE LUNGO - manca brand name |
| sorveglianza.html | "Videosorveglianza - Controllo e Monitoraggio \| Italia" | 52 car. | OK lunghezza - manca brand name, keyword debole |
| allarmi.html | "Sistemi Allarme - Antifurto e Sicurezza \| Italia" | 49 car. | OK lunghezza - manca brand name |
| chi-siamo.html | "Chi Siamo - FB Total Security \| Italia" | 40 car. | OK |
| lavora-con-noi.html | "Lavora con Noi - FB Total Security \| Opportunita' di Carriera" | 62 car. | OK |
| termini-condizioni.html | "Termini e Condizioni - FB Total Security" | 42 car. | OK |

**Problemi:**
- **Brand name mancante** nei title di 3 pagine servizio (serramenti, sorveglianza, allarmi)
- **Title troppo lungo** su nebbiogeni.html (verra' troncato)
- **Keyword "Milano"** presente solo nell'homepage, assente nelle pagine servizio dove sarebbe piu' rilevante

### 2.2 Meta Description
**Stato: BUONO**

- Tutte le pagine hanno meta description
- Lunghezze generalmente entro i 155-160 caratteri
- Contengono call-to-action ("Consulenza gratuita")
- Keyword primarie incluse

**Problema**: La meta description di nebbiogeni.html e' troppo lunga (~250 car.), verra' troncata.

### 2.3 Heading Hierarchy
**Stato: PROBLEMATICO**

**index.html:**
- H1: "Soluzioni di Sicurezza Avanzate per la Tua Protezione" - OK, unico
- H2: "La tua sicurezza, la nostra missione" - OK
- H2: "I Nostri Servizi di Sicurezza" - OK
- H2: "Le Nostre Partnership" - OK
- **H3 usati per servizi** (Nebbiogeni, Grate, Sorveglianza, Allarmi) - OK
- H2: "Perche' scegliere FB Total Security" - OK
- **PROBLEMA**: Le sezioni servizio dettagliate (nebbiogeni, serramenti, sorveglianza, allarmi nell'homepage) usano H3 ma dovrebbero avere un H2 genitore semantico per la sezione

**Pagine servizio (nebbiogeni, sorveglianza, allarmi, serramenti):**
- Ogni pagina ha un singolo H1 nell'hero - OK
- Struttura H2 > H3 > H4 generalmente corretta
- Le pagine hanno una buona profondita' di heading

**Problema globale**: **Nessun `<article>` o `<section>` con heading semantici** per i contenuti FAQ nelle pagine servizio - le FAQ sono solo in structured data JSON, non nel DOM HTML visibile.

### 2.4 Schema.org / Structured Data
**Stato: ESTESO ma PROBLEMATICO**

**Implementazioni presenti:**
- Organization (con dettagli completi)
- WebSite con SearchAction
- WebPage con BreadcrumbList
- Service (4 servizi)
- Person (Franco Benedetto/Di Benedetto)
- FAQPage
- VideoObject (3 video)
- OfferCatalog

**PROBLEMI CRITICI:**

1. **DUPLICAZIONE MASSIVA di structured data nell'index.html**: Lo stesso schema Organization appare in TRE blocchi `ld+json` diversi con dati leggermente diversi (es. telefono presente in uno, assente in un altro; nomi diversi per il fondatore)
2. **Nome fondatore incoerente**: In un blocco e' "Franco Di Benedetto", in un altro "FB Total Security" come nome persona. Google potrebbe non collegare le entita'.
3. **SearchAction invalida**: Punta a `?s={search_term_string}` ma il sito NON ha una funzione di ricerca interna. Google potrebbe mostrare un sitelinks searchbox che porta a una 404.
4. **Logo URL inesistente**: `logo.png` referenziato in structured data ma non presente nella root del progetto. Solo `logo_sito_franco.webp` e `logo_sito_franco_small.webp` esistono in `/icons/`.
5. **File JSON non collegati**: `ai-knowledge-base.json`, `ai-person-eeat.json`, `ai-seo-enhanced.json`, `ai-services-schema.json`, `ai-authoritative-sources.json` esistono come file standalone ma **non sono linkati da nessuna pagina HTML** tramite `<script type="application/ld+json">` o `<link>`. Sono invisibili ai crawler.
6. **URL `francosicurezza.it` nei file JSON**: `ai-context-sitemap.json` e `ai-knowledge-base.json` referenziano `francosicurezza.it` invece di `fbtotalsecurity.com`. Dominio diverso = entita' non collegata.
7. **FAQPage solo in JSON, non nel DOM**: Le FAQ nello structured data non hanno corrispondenza visibile nella pagina. Google richiede che il contenuto strutturato sia visibile all'utente.

> **Rif. Google**: [Structured data general guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
> **Rif. Google**: [FAQ structured data](https://developers.google.com/search/docs/appearance/structured-data/faqpage)

---

## 3. CONTENUTO E RILEVANZA

### 3.1 Qualita' dei Testi
**Stato: BUONO**

- Testi professionali e informativi
- Buon uso di liste puntate per feature dei servizi
- Descrizioni video con trascrizioni (ottimo per accessibilita' e SEO)
- Contenuto "above the fold" con CTA chiare

**Aree di miglioramento:**
- **Mancanza di un blog/sezione news**: Nessun contenuto editoriale per catturare query informazionali
- **Contenuto thin su "Chi Siamo"**: Pagina aziendale che potrebbe approfondire l'esperienza, i casi studio, le certificazioni
- **Nessuna pagina per area geografica**: Il sito serve "tutta Italia" ma non ha landing page localizzate (es. "sicurezza Milano", "nebbiogeni Roma", ecc.)

### 3.2 Keyword Strategy
**Stato: PARZIALE**

**Keyword primarie coperte:**
- "sistemi sicurezza" / "sistemi di sicurezza"
- "nebbiogeni" / "sistemi nebbiogeni"
- "grate e inferriate blindate"
- "videosorveglianza"
- "sistemi allarme" / "antifurto"
- "sicurezza casa" / "sicurezza azienda"

**Gap keyword significativi:**
- **Query locali**: Nessuna ottimizzazione per "sistemi sicurezza Milano", "installazione allarme Milano", ecc.
- **Query informazionali**: Nessun contenuto per "come scegliere un sistema di allarme", "costo nebbiogeni", "differenza tra grate e inferriate"
- **Query long-tail**: Assenti keyword come "nebbiogeni per negozi", "videosorveglianza condominio", "inferriate senza opere murarie prezzi"
- **Query comparative**: Nessun contenuto "nebbiogeni vs allarme tradizionale", "migliori sistemi antifurto 2026"

### 3.3 Intent Matching
**Stato: PARZIALE**

Il sito copre bene l'intent **transazionale** (richiesta preventivo, consulenza) ma e' debole su:
- **Intent informazionale**: Nessun blog, guide, FAQ visibili
- **Intent navigazionale**: OK per brand queries
- **Intent commerciale investigativo**: Mancano comparazioni, prezzi indicativi, casi studio

### 3.4 Profondita' Tematica
**Stato: MEDIO**

Ogni pagina servizio ha un buon livello di dettaglio tecnico (feature, certificazioni, partner) ma manca:
- **Case study / Progetti realizzati**: Nessun esempio concreto di installazioni
- **Testimonianze / Recensioni**: Nessun Review schema, nessuna sezione testimonial
- **Guide / Approfondimenti**: Nessun contenuto evergreen di supporto

---

## 4. AUTOREVOLEZZA E SEGNALI DI RANKING

### 4.1 Internal Linking
**Stato: PARZIALE**

**Positivo:**
- Navigazione principale con link a tutte le pagine servizio
- Homepage linka a tutte le pagine servizio tramite service cards
- CTA "Richiedi Preventivo" su ogni sezione

**Problemi:**
- **Nessun cross-linking tra pagine servizio**: `nebbiogeni.html` non linka a `allarmi.html` o `sorveglianza.html` e viceversa. Manca la rete di link semantici interni.
- **Nessun breadcrumb visibile**: Lo schema BreadcrumbList e' presente ma non c'e' un breadcrumb visivo navigabile
- **Link "Contatti" punta a un anchor** (`#contatti`) nell'homepage - se l'utente e' su un'altra pagina, deve tornare all'homepage
- **Footer**: Non analizzato in dettaglio, ma dovrebbe contenere link strutturati a tutte le pagine + dati NAP

### 4.2 E-E-A-T Signals (Experience, Expertise, Authoritativeness, Trustworthiness)
**Stato: MEDIO**

**Positivo:**
- **Experience**: Menzione di "oltre 20 anni di esperienza"
- **Expertise**: Partnership con brand riconosciuti (UR Fog, CIVIS, Xecur, ITL Group)
- **Authoritativeness**: Certificazioni menzionate (EN 50131-8, ISO 9001, EN 1627-1630)
- **Trust**: HTTPS, privacy policy, dati aziendali

**Problemi:**
- **Nessuna pagina "Autore"**: Franco Benedetto/Di Benedetto e' referenziato nello structured data ma non ha una pagina dedicata (`/franco-benedetto` referenziato nei JSON non esiste)
- **Nessuna foto del team/fondatore**: L'immagine referenziata nello schema (`franco-benedetto.jpg`) non esiste
- **Nessuna recensione Google/Trustpilot**: Assenza totale di social proof verificabile
- **Email Gmail**: `fb.totalsicurezza@gmail.com` non e' un indirizzo professionale (@fbtotalsecurity.com sarebbe preferibile)
- **Nessun numero di telefono visibile nelle pagine** (solo nello structured data)
- **Social media limitati**: Solo Facebook e LinkedIn (Instagram e X/Twitter referenziati nello schema ma verificare se attivi)

### 4.3 Backlink Profile
**Nota**: Non analizzabile dal codice sorgente. Il blocco di AhrefsBot nel robots.txt impedisce anche l'analisi esterna su Ahrefs.

---

## 5. UX E COMPORTAMENTO UTENTE

### 5.1 Fattori di Bounce Rate
**Stato: MEDIO**

**Positivo:**
- Design moderno e professionale (dark theme, gradient accents)
- CTA prominenti above-the-fold
- Video embedding lazy per engagement
- Carosello partnership per social proof

**Rischi:**
- **Pagine molto lunghe**: `index.html` e' 1846 righe, `script.js` 220KB. Il caricamento completo potrebbe essere lento su connessioni mobili
- **Nessun "sticky CTA"** mobile per contatto rapido
- **Form contatti solo in homepage**: L'utente su una pagina servizio deve navigare via per contattare

### 5.2 Dwell Time Signals
**Positivo:**
- Video embedded per aumentare il tempo sulla pagina
- Contenuto dettagliato con feature list espanse
- Trascrizioni video per contenuto aggiuntivo

**Negativo:**
- Nessun contenuto interattivo (configuratore, calcolatore di preventivo, quiz)
- Nessun chatbot o form di contatto rapido inline

### 5.3 Engagement Metrics
- Facebook Pixel implementato (tracking conversioni)
- Google Analytics configurato (via third-party-loader.js)
- UTM tracking presente (`utm-tracking.js`)
- **Manca**: Google Search Console verification tag (non trovato nel codice)

---

## 6. POSIZIONAMENTO NEL CONTESTO AI

### 6.1 Ottimizzazione per Knowledge Graphs
**Stato: AVANZATO ma con errori**

Il sito ha un approccio molto avanzato all'AI SEO con numerosi file JSON:
- `ai-knowledge-base.json` - Base di conoscenza semantica
- `ai-person-eeat.json` - Profilo E-E-A-T della persona
- `ai-seo-enhanced.json` - Schema ottimizzato per AI
- `ai-services-schema.json` - Schema servizi dettagliato
- `ai-authoritative-sources.json` - Fonti autorevoli
- `ai-context-sitemap.json` - Mappa semantica contestuale
- `ai-unified-engine.js` - Engine JS per ottimizzazione AI

**PROBLEMA FONDAMENTALE**: Tutti questi file JSON sono **standalone** e non vengono inclusi come `<script type="application/ld+json">` nelle pagine HTML. I crawler (Google, Bing, ChatGPT, Perplexity) **non li leggono** a meno che non siano linkati o inline nel HTML. Sono essenzialmente file "morti" dal punto di vista SEO.

### 6.2 Featured Snippets
**Stato: DEBOLE**

- **Nessuna FAQ visibile** nelle pagine (solo in structured data JSON)
- **Nessuna tabella comparativa** per snippet tabulari
- **Nessuna definizione formattata** per snippet di tipo "definizione"
- **Nessuna lista ordinata** per snippet "how-to"

### 6.3 Direct Answer Optimization
**Stato: DEBOLE**

- Le FAQ nello structured data sono ben scritte ma non visibili nel DOM
- Mancano risposte dirette a domande comuni nel body HTML
- Nessun contenuto strutturato tipo "Quanto costa un sistema nebbiogeno?" con risposta diretta

---

## 7. PROBLEMI CRITICI - PRIORITA' MASSIMA

### P0 - Bloccanti / Impatto immediato

1. **`.htaccess` inoperante su GitHub Pages**
   - Impatto: TUTTE le regole di sicurezza (HSTS, CSP, X-Frame-Options), cache, redirect 301 e compressione NON sono attive
   - Soluzione: Migrare a Cloudflare Pages/Netlify che supportano headers custom, oppure configurare tramite `_headers` file se si usa Cloudflare CDN

2. **Conflitto hreflang / robots.txt**
   - Impatto: Google riceve segnali contraddittori sulle versioni linguistiche
   - Soluzione: Rimuovere `Disallow: /*?lang=*` dal robots.txt OPPURE rimuovere gli hreflang con `?lang=` e implementare vere pagine separate per lingua

3. **FAQPage structured data senza contenuto visibile**
   - Impatto: Rischio di penalizzazione per structured data spam (Google richiede corrispondenza DOM)
   - Soluzione: Aggiungere sezioni FAQ visibili in ogni pagina servizio

4. **`/#contatti` nella sitemap**
   - Impatto: URL non indicizzabile, spreco crawl budget
   - Soluzione: Rimuovere dalla sitemap o creare una pagina contatti dedicata `/contatti.html`

### P1 - Alto impatto

5. **File JSON AI non collegati alle pagine HTML**
   - Soluzione: Integrare i contenuti rilevanti come `<script type="application/ld+json">` nelle rispettive pagine

6. **Logo.png inesistente** referenziato in tutti gli structured data
   - Soluzione: Creare `logo.png` o aggiornare tutti i riferimenti a `icons/logo_sito_franco.webp`

7. **Dominio `francosicurezza.it` nei file JSON** invece di `fbtotalsecurity.com`
   - Soluzione: Aggiornare tutti i riferimenti al dominio corretto

8. **Duplicazione structured data nell'index.html**
   - Soluzione: Consolidare in un unico blocco `@graph` coerente

9. **Date `lastmod` nella sitemap obsolete**
   - Soluzione: Aggiornare a date reali di ultima modifica

10. **Title tag nebbiogeni.html troppo lungo** (93 car.)
    - Soluzione: Abbreviare a ~60 car., es: "Sistemi Nebbiogeni Professionali | FB Total Security"

### P2 - Medio impatto

11. **Brand name mancante nei title** delle pagine servizio
12. **Cross-linking assente** tra pagine servizio
13. **Nessuna sezione FAQ visibile** nel DOM HTML
14. **Nessun breadcrumb visibile** (solo schema)
15. **SearchAction invalida** (nessuna ricerca interna)
16. **Incoerenza font-display** tra pagine
17. **Versioni diverse del font Inter** tra pagine
18. **Email non professionale** (Gmail)
19. **Pagina `lavora-con-noi.html` mancante** dalla sitemap

### P3 - Basso impatto / Miglioramenti strategici

20. **Creare un blog** per contenuti informazionali
21. **Creare landing page localizzate** (Milano, Roma, ecc.)
22. **Aggiungere pagina autore** per Franco Di Benedetto
23. **Implementare recensioni** (Google Reviews, schema Review)
24. **Aggiungere numero telefono** visibile nelle pagine
25. **Creare pagina contatti dedicata** (`contatti.html`)
26. **Aggiungere contenuti comparativi** e guide
27. **Implementare breadcrumb visivi**
28. **Ridurre peso JavaScript** (220KB script.js)
29. **Verificare profili social** referenziati nello schema (Instagram, X)

---

## 8. ROADMAP DI IMPLEMENTAZIONE SUGGERITA

### Sprint 1 - Fix critici (1-2 giorni)
- [ ] Risolvere conflitto hreflang/robots.txt
- [ ] Rimuovere `/#contatti` dalla sitemap
- [ ] Aggiungere `lavora-con-noi.html` alla sitemap
- [ ] Aggiornare date `lastmod` nella sitemap
- [ ] Creare `logo.png` o aggiornare riferimenti
- [ ] Rimuovere SearchAction (nessuna ricerca interna)
- [ ] Correggere URL `francosicurezza.it` -> `fbtotalsecurity.com` nei JSON
- [ ] Rimuovere hreflang duplicati da index.html

### Sprint 2 - Structured data e on-page (2-3 giorni)
- [ ] Consolidare structured data in un unico `@graph` per pagina
- [ ] Aggiungere sezioni FAQ visibili in tutte le pagine servizio
- [ ] Integrare JSON AI rilevanti come `ld+json` inline
- [ ] Abbreviare title tag nebbiogeni.html
- [ ] Aggiungere brand name nei title delle pagine servizio
- [ ] Uniformare font-display e versione font Inter

### Sprint 3 - Linking e UX (2-3 giorni)
- [ ] Implementare cross-linking tra pagine servizio
- [ ] Aggiungere breadcrumb visivi
- [ ] Creare pagina contatti dedicata
- [ ] Aggiungere numero telefono visibile
- [ ] Aggiungere CTA sticky mobile

### Sprint 4 - Contenuti e autorevolezza (1-2 settimane)
- [ ] Creare pagina autore Franco Di Benedetto
- [ ] Aggiungere sezione testimonianze/recensioni
- [ ] Valutare migrazione hosting per supporto .htaccess
- [ ] Pianificare strategia blog/contenuti informativi
- [ ] Creare almeno 1-2 landing page localizzate

---

## 9. RIFERIMENTI DOCUMENTAZIONE GOOGLE

| Argomento | URL |
|-----------|-----|
| URL structure | https://developers.google.com/search/docs/crawling-indexing/url-structure |
| Sitemaps | https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap |
| Hreflang | https://developers.google.com/search/docs/specialty/international/localized-versions |
| Structured Data Policy | https://developers.google.com/search/docs/appearance/structured-data/sd-policies |
| FAQ Structured Data | https://developers.google.com/search/docs/appearance/structured-data/faqpage |
| E-E-A-T | https://developers.google.com/search/docs/fundamentals/creating-helpful-content |
| Core Web Vitals | https://web.dev/articles/vitals |
| Page Experience | https://developers.google.com/search/docs/appearance/page-experience |
| Rich Results Test | https://search.google.com/test/rich-results |
| Breadcrumb | https://developers.google.com/search/docs/appearance/structured-data/breadcrumb |
| Video Structured Data | https://developers.google.com/search/docs/appearance/structured-data/video |

---

*Report generato tramite analisi statica del codice sorgente. Si consiglia di integrare con dati da Google Search Console, PageSpeed Insights live, e tool di crawling (Screaming Frog, Sitebulb) per una validazione completa.*
