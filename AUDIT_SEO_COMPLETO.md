# AUDIT SEO COMPLETO - FB Total Security
## www.fbtotalsecurity.com

**Data audit:** 12 Febbraio 2026
**Auditor:** Senior SEO Strategist and Technical SEO Auditor
**Sito:** https://www.fbtotalsecurity.com
**Settore:** Sistemi di Sicurezza (B2B/B2C)
**Area:** Milano / Tutta Italia

---

## INDICE
1. FASE 1 - Analisi Tecnica (Technical SEO)
2. FASE 2 - On-Page SEO e Contenuti
3. FASE 3 - Off-Page SEO e Autorita
4. FASE 4 - Local SEO
5. FASE 5 - AI Search Readiness (SGE/AIO)
6. FASE 6 - Piano d Azione Prioritizzato
7. FASE 7 - Consigli Strategici Personalizzati
8. SEO Score Complessivo

---

# FASE 1 - ANALISI TECNICA (Technical SEO)

## 1.1 Crawlability e Indexing - Score: 6/10

### robots.txt - STATO: OK

| Aspetto | Stato | Note |
|---------|-------|------|
| File presente | OK | robots.txt presente e ben strutturato |
| Allow: / | OK | Crawling consentito a tutti i bot |
| Sitemap dichiarata | OK | Sitemap: https://www.fbtotalsecurity.com/sitemap.xml |
| Bot spam bloccati | OK | AhrefsBot, MJ12bot, DotBot bloccati |
| Risorse critiche bloccate | OK | Nessuna risorsa critica bloccata |

ATTENZIONE: Il blocco di AhrefsBot impedisce l analisi del profilo backlink tramite Ahrefs. Valutare se mantenerlo.

### sitemap.xml - STATO: PROBLEMA

| Aspetto | Stato | Note |
|---------|-------|------|
| File presente | OK | XML valido con namespace corretto |
| Aggiornata | OK | lastmod: 2026-02-12 su tutte le pagine |
| URL canonici | PROBLEMA | Vedi sotto |
| Hreflang in sitemap | OK | Dichiarati per it/en/x-default |

PROBLEMA CRITICO - Conflitto noindex/sitemap:
termini-condizioni.html ha meta robots noindex follow ma e inclusa nella sitemap. Google segnalera incoerenza.
SOLUZIONE: Rimuovere termini-condizioni.html dalla sitemap OPPURE rimuovere il noindex.

Pagine in sitemap (8 inclusa termini):

| URL | Priority | Stato |
|-----|----------|-------|
| / (homepage) | 1.0 | OK |
| /nebbiogeni.html | 0.8 | OK |
| /serramenti.html | 0.8 | OK |
| /sorveglianza.html | 0.8 | OK |
| /allarmi.html | 0.8 | OK |
| /lavora-con-noi.html | 0.5 | OK |
| /chi-siamo.html | 0.7 | OK |
| /termini-condizioni.html | 0.3 | CONFLITTO noindex |

### Tag Canonical - STATO: OK

Tutte le 8 pagine hanno tag canonical corretto e coerente con gli URL in sitemap.

### Pagine Orfane

| Pagina | In Sitemap | Linkata internamente | Stato |
|--------|------------|---------------------|-------|
| ai-content-optimization.html | NO | NO | ORFANA |
| privacy-policy | NO | NO (href=#) | NON ESISTE |
| cookie-policy | NO | NO (href=#) | NON ESISTE |

ai-content-optimization.html esiste nel filesystem ma non e linkata ne in sitemap. Eliminare o integrare.

### Hreflang - PROBLEMA GRAVE

Stato attuale: Ogni pagina dichiara hreflang con parametro ?lang=it e ?lang=en.

```html
<link rel="alternate" hreflang="it" href="https://www.fbtotalsecurity.com/?lang=it">
<link rel="alternate" hreflang="en" href="https://www.fbtotalsecurity.com/?lang=en">
```

PROBLEMA: La traduzione e gestita via JavaScript client-side. Googlebot NON esegue la traduzione JS in modo affidabile. Gli URL ?lang=en servono la stessa pagina IT a Googlebot, causando:
- Contenuto duplicato (IT e EN hanno lo stesso HTML base)
- Hreflang non funzionante (Google vede contenuto identico)
- Zero posizionamento per keyword EN

SOLUZIONI (in ordine di efficacia):
1. Server-side rendering delle traduzioni (best practice)
2. Pre-rendering statico delle pagine EN (es. /en/index.html)
3. Se il traffico EN e trascurabile, rimuovere completamente hreflang e concentrarsi solo sull italiano

### Noindex accidentali
Nessun tag noindex accidentale trovato. Solo termini-condizioni.html ha noindex (intenzionale).

### Redirect
.htaccess configura redirect 301 per HTTP verso HTTPS e /grate-inferriate verso /serramenti.html. Nessun loop di redirect rilevato.

---

## 1.2 Core Web Vitals e Performance - Score: 7/10

### Font Optimization

| Aspetto | Stato | Note |
|---------|-------|------|
| Font preload | OK | Preload WOFF2 per Inter su tutte le pagine |
| Font fallback con metriche | OK | Inter Fallback con ascent/descent override |
| font-display | INCONSISTENZA | Vedi tabella sotto |
| Critical CSS inline | OK | CSS critico inline su tutte le pagine |

INCONSISTENZA font-display e versioni font:

| Pagina | Versione Inter | font-display |
|--------|---------------|-------------|
| index.html | v13 | optional |
| allarmi.html | v13 | optional |
| sorveglianza.html | v13 | optional |
| lavora-con-noi.html | v13 | optional |
| nebbiogeni.html | v20 | swap |
| serramenti.html | v20 | swap |
| chi-siamo.html | v20 | swap |

PROBLEMA: Mescolare versioni diverse (v13 vs v20) puo causare cache miss e download doppi. Inoltre, font-display: optional (index) vs swap (nebbiogeni) produce comportamento visivo diverso.

SOLUZIONE: Uniformare tutte le pagine alla stessa versione font (v20) e allo stesso font-display (consigliato: optional per LCP oppure swap per CLS - scegliere UNO).

### Immagini

| Aspetto | Stato | Note |
|---------|-------|------|
| Formato WebP | OK | Tutte le immagini in WebP |
| Lazy loading | OK | loading=lazy su immagini below-fold |
| Eager loading | OK | loading=eager solo su logo above-fold |
| Width/Height espliciti | OK | Tutti gli img hanno width e height |
| Alt text | OK | Tutti descrittivi, nessun alt vuoto |
| Preload hero image | PARZIALE | Solo index e lavora-con-noi preloadano immagine hero |

### CSS/JS

| Aspetto | Stato | Note |
|---------|-------|------|
| CSS minificato | OK | styles.min.css presente |
| JS minificato | OK | script.min.js presente |
| CSS deferred | PARZIALE | Solo index.html usa media=print onload trick |
| JS deferred | OK | defer su tutti gli script |
| Compressione Gzip | OK | Configurata in .htaccess |
| Brotli | MANCANTE | Solo Gzip configurato, Brotli non presente |

PROBLEMA - Script inline pesanti su index.html:
L index.html contiene circa 250 righe di JavaScript inline (Zaraz debug, YouTube embed, carousel). Questo blocca il parser e aumenta il TTFB effettivo.

SOLUZIONE: Spostare tutti gli script inline in file .js esterni con defer.

### Cache Headers

| Aspetto | Stato | Note |
|---------|-------|------|
| Cache CSS/JS | OK | max-age=31536000, immutable |
| Cache immagini | OK | max-age=31536000, immutable |
| Cache HTML | OK | max-age=3600 |
| Cache-busting | OK | Parametro ?v=20250917 su CSS/JS |

PROBLEMA CRITICO - Expires Header scaduto:
```apache
Header set Expires "Thu, 31 Dec 2025 23:59:59 GMT"
```
Questa data e GIA SCADUTA (siamo nel 2026). I browser potrebbero non utilizzare la cache.

SOLUZIONE:
```apache
Header set Expires "Thu, 31 Dec 2026 23:59:59 GMT"
```

### Preload/Prefetch

| Risorsa | Stato |
|---------|-------|
| Font WOFF2 (x2) | Preload OK |
| Logo above-fold | Preload OK (index) |
| CSS principale | Preload OK (index) |
| Google Tag Manager | Preconnect OK |
| Facebook | Preconnect + DNS-prefetch OK |

---

## 1.3 Mobile e Accessibilita - Score: 8/10

| Aspetto | Stato | Note |
|---------|-------|------|
| Viewport meta tag | OK | width=device-width, initial-scale=1.0 |
| Design responsive | OK | Hamburger menu, media queries presenti |
| Touch target >= 48px | OK | .btn height: 48px |
| Alt text descrittivi | OK | Tutti presenti e descrittivi |
| Un solo H1 per pagina | OK | Verificato su tutte le 8 pagine |
| Struttura heading gerarchica | OK | H1-H2-H3 corretta |
| sr-only per label | OK | Label del form con classe sr-only |
| ARIA labels | OK | Presenti su SVG, video, bottoni |

Contrasto colori:
- Testo #b0b0b0 su sfondo #000000 = ratio circa 7.5:1 - OK AA
- Link #4caf50 su sfondo #000000 = ratio circa 6.0:1 - OK AA
- Testo bianco su sfondo nero = OK AAA

---

## 1.4 Sicurezza e Protocollo - Score: 9/10

| Header | Stato | Valore |
|--------|-------|--------|
| HTTPS redirect | OK | 301 redirect in .htaccess |
| HSTS | OK | max-age=63072000; includeSubDomains; preload |
| X-Content-Type-Options | OK | nosniff |
| X-Frame-Options | OK | SAMEORIGIN |
| X-XSS-Protection | OK | 1; mode=block |
| CSP | OK | Policy completa con hash per script inline |
| Referrer-Policy | OK | strict-origin-when-cross-origin |
| Permissions-Policy | OK | geolocation=(), microphone=(), camera=() |
| COOP | OK | same-origin |
| COEP | RISCHIO | require-corp puo bloccare risorse third-party |

NOTA su COEP require-corp: Questo header puo bloccare il caricamento di risorse third-party (font Google, immagini esterne, Facebook Pixel) se non hanno header Cross-Origin-Resource-Policy appropriato.

SOLUZIONE se causa problemi:
```apache
Header always set Cross-Origin-Embedder-Policy "credentialless"
```

---

# FASE 2 - ON-PAGE SEO E CONTENUTI

## 2.1 Struttura HTML Semantica - Score: 7/10

### index.html (Homepage)

- **Title:** "Sistemi di Sicurezza e Antifurto | FB Total Security Milano" - 64 char OK - Keyword primaria: SI
- **Meta description:** "FB Total Security offre sistemi di sicurezza: allarmi, videosorveglianza..." - circa 160 char OK - CTA: NO (manca CTA esplicita)
- **H1:** "Soluzioni di Sicurezza Avanzate per la Tua Protezione" - Coerente: SI
- **Struttura Heading:** H1 > H2 (mission, servizi, partnership, why choose, clienti, contatti) > H3 (servizi dettaglio, agency, normative) - Gerarchia: buona, ma H3 usati per sezioni principali (agency, normative) dovrebbero essere H2
- **URL slug:** / - Pulito OK
- **Internal links:** 15+ link interni - buona densita
- **Schema:** Organization, WebSite, BreadcrumbList, VideoObject x3 - DUPLICATO: 2 blocchi Organization LD+JSON
- **Content quality:** Contenuto ricco, circa 1500 righe, descrizioni dettagliate

### nebbiogeni.html

- **Title:** "Sistemi Nebbiogeni Professionali | FB Total Security" - 53 char OK - Keyword: SI
- **Meta description:** "Sistemi nebbiogeni UR Fog: nebulizzazione antifurto..." - circa 155 char OK - CTA: SI
- **H1:** "Sistemi Nebbiogeni Professionali" - Coerente: SI
- **Schema:** BreadcrumbList, Service, FAQPage - OK
- **FAQ:** 5 domande con details e FAQPage LD+JSON - OK
- **Cross-linking:** Sezione "Scopri gli Altri Servizi" - OK

### sorveglianza.html

- **Title:** "Videosorveglianza Professionale | FB Total Security" - 50 char OK - Keyword: SI
- **Meta description:** "Sistemi di videosorveglianza professionali, telecamere IP..." - circa 160 char OK - CTA: NO
- **H1:** "Videosorveglianza" - TROPPO GENERICO, meglio "Videosorveglianza Professionale"
- **Schema:** BreadcrumbList, Service, FAQPage - OK
- **FAQ e Cross-linking:** presenti OK

### allarmi.html

- **Title:** "Sistemi di Allarme Antifurto | FB Total Security" - 48 char OK - Keyword: SI
- **Meta description:** "Sistemi di allarme antifurto professionali, sensori wireless..." - circa 170 char TROPPO LUNGO (target max 160)
- **H1:** "Sistemi di Allarme" - OK
- **Schema:** BreadcrumbList, Service, FAQPage - OK

### serramenti.html

- **Title:** "Grate e Inferriate Blindate | FB Total Security" - 48 char OK - Keyword: SI
- **Meta description:** "Grate e inferriate blindate per porte e finestre..." - circa 155 char OK
- **H1:** "Grate e Inferriate Blindate" - OK
- **Schema:** BreadcrumbList, Service, FAQPage - OK

### chi-siamo.html

- **Title:** "Chi Siamo - FB Total Security | Italia" - 39 char OK - Keyword: debole per SEO
- **Meta description:** "Scopri FB Total Security: agenzia autorizzata..." - circa 195 char TROPPO LUNGO (max 160)
- **H1:** "Chi Siamo" - generico
- **E-E-A-T:** Pagina fondatore e partnership - buona base

### lavora-con-noi.html

- **Title:** "Lavora con Noi - FB Total Security | Opportunita di Carriera" - 58 char OK
- **Meta description:** circa 195 char - TROPPO LUNGO
- **H1:** "Lavora con Noi" - OK
- **Schema:** MANCA JobPosting schema

### PROBLEMI CRITICI ON-PAGE

**1. Link rotti nel footer (TUTTE LE PAGINE):**

Questi link href=# sono presenti nel footer di OGNI pagina:
- Privacy Policy -> href=# (pagina NON ESISTE)
- Cookie Policy -> href=# (pagina NON ESISTE)
- Termini di Servizio -> href=# (pagina NON ESISTE)
- Certificazioni -> href=# (pagina NON ESISTE)

Danneggiano UX e crawling. Creare le pagine o rimuovere i link.

**2. P.IVA fittizia:**

```html
P.IVA: 12345678901
```

E palesemente un placeholder. Inserire la P.IVA reale o rimuovere. Danneggia credibilita E-E-A-T e potenzialmente viola obblighi legali italiani.

**3. Copyright anno 2025** - aggiornare a 2026.

**4. Duplicazione Organization schema su index.html:**
Due blocchi ld+json con type Organization: uno nel @graph (id: #organization) e uno separato (id: #organization-detail). Unificare in un singolo blocco.

**5. structured-data.json non caricato:**
Il file contiene schema Service, Person, FAQPage ma NON viene incluso in nessuna pagina HTML. Il contenuto e "morto" e invisibile a Google.

---

## 2.2 Keyword Strategy

### Keyword Primarie Target

| Keyword | Volume stimato | Difficolta | Intent | Pagina target | Status |
|---------|---------------|------------|--------|---------------|--------|
| sistemi sicurezza Milano | 500-1K/mese | Media | Transazionale | index.html | Presente |
| nebbiogeni antifurto | 200-500/mese | Bassa | Commerciale | nebbiogeni.html | Ottimizzata |
| nebbiogeni prezzo | 100-300/mese | Bassa | Commerciale | nebbiogeni.html | Mancante |
| grate inferriate blindate | 300-700/mese | Media | Commerciale | serramenti.html | Ottimizzata |
| inferriate sicurezza prezzi | 200-500/mese | Bassa | Commerciale | serramenti.html | Mancante |
| videosorveglianza professionale | 500-1K/mese | Alta | Commerciale | sorveglianza.html | Presente |
| sistemi allarme casa | 1K-2K/mese | Alta | Commerciale | allarmi.html | Parziale |
| allarme antifurto wireless | 500-1K/mese | Media | Commerciale | allarmi.html | Presente |
| sicurezza casa Milano | 200-500/mese | Media | Transazionale | index.html | Parziale |
| UR Fog nebbiogeni | 100-200/mese | Bassa | Navigazionale | nebbiogeni.html | Presente |
| Xecur grate blindate | 50-100/mese | Bassa | Navigazionale | serramenti.html | Presente |
| CIVIS vigilanza | 100-300/mese | Bassa | Navigazionale | sorveglianza.html | Presente |
| installazione allarme Milano | 100-300/mese | Bassa | Transazionale | Da creare | Mancante |
| preventivo sicurezza casa | 100-300/mese | Bassa | Transazionale | index.html/#contatti | Solo form |

### Keyword LSI da integrare

Per nebbiogeni.html:
- nebbiogeno come funziona, nebbiogeno UR Fog prezzo, sistema antifurto nebbia, nebbiogeno opinioni, nebbiogeno per negozio

Per serramenti.html:
- grate di sicurezza per finestre, inferriate blindate su misura, grate antieffrazione classe 6, inferriate senza opere murarie

Per sorveglianza.html:
- telecamere IP 4K, videosorveglianza remota smartphone, sistemi CCTV professionale, videosorveglianza condominio

Per allarmi.html:
- centralina allarme wireless, sensori perimetrali, allarme casa senza fili, allarme collegato al 112

---

## 2.3 Content Gap Analysis

### Pagine MANCANTI (da creare)

| Pagina | Priorita | Keyword target | Potenziale traffico |
|--------|----------|---------------|-------------------|
| contatti.html | CRITICA | contatti sicurezza Milano | +100-200/mese |
| privacy-policy.html | CRITICA (legale) | - | Compliance GDPR |
| cookie-policy.html | CRITICA (legale) | - | Compliance GDPR |
| Blog / Guide | ALTA | keyword informazionali | +2K-5K/mese |
| chi-e-franco.html | ALTA | E-E-A-T author page | Boost autorita |
| Pagine area (Milano, Roma...) | MEDIA | sistemi sicurezza [citta] | +500-1K per area |
| Case study / Portfolio | MEDIA | E-E-A-T trust signals | Boost conversioni |
| Pagina comparativa | MEDIA | nebbiogeni vs allarme | +100-300/mese |

### Contenuti Blog suggeriti (Topic Cluster)

Pillar Page: "Guida Completa alla Sicurezza Casa 2026"

Cluster Articles:
1. Come scegliere un sistema di allarme per casa: guida completa
2. Nebbiogeni antifurto: come funzionano e quanto costano
3. Grate blindate o inferriate: quale scegliere per le finestre
4. Videosorveglianza GDPR: regole per telecamere in condominio
5. Detrazione fiscale sistemi sicurezza 2026: come funziona
6. Classe antieffrazione RC1-RC6: cosa significa e quale scegliere
7. Sistemi allarme wireless vs filari: pro e contro
8. Come proteggere il negozio dai furti: guida pratica
9. UR Fog nebbiogeni: recensione e opinioni tecniche
10. Telecamere IP vs analogiche: quale scegliere nel 2026

### Thin Content
Tutte le pagine attuali hanno contenuto sufficiente (superiore a 500 parole). Nessun thin content rilevato.

### Cannibalizzazione Keyword

| Keyword | Pagine in competizione | Rischio |
|---------|----------------------|---------|
| sistemi di sicurezza | index.html, chi-siamo.html | Medio |
| protezione casa | index.html, allarmi.html | Basso |

Soluzione: Differenziare chiaramente l intent tra le pagine.

---

## 2.4 Schema Markup (Dati Strutturati) - Score: 7/10

### Schema Implementati

| Tipo | Pagina | Stato |
|------|--------|-------|
| Organization | index.html | OK ma DUPLICATO (2 blocchi) |
| WebSite | index.html | OK |
| BreadcrumbList | index.html + service pages | OK |
| VideoObject | index.html (x3) | OK |
| Service (x4) | structured-data.json | NON CARICATO in HTML |
| Person | structured-data.json | NON CARICATO in HTML |
| FAQPage | nebbiogeni, sorveglianza, allarmi, serramenti | OK |
| FAQPage | structured-data.json | NON CARICATO in HTML |

### Schema MANCANTI da implementare

**1. LocalBusiness (CRITICO per Local SEO)**

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.fbtotalsecurity.com/#localbusiness",
  "name": "FB Total Security",
  "image": "https://www.fbtotalsecurity.com/icons/logo_sito_franco.webp",
  "url": "https://www.fbtotalsecurity.com",
  "telephone": "+393802647367",
  "email": "fb.totalsicurezza@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Corso Sempione",
    "addressLocality": "Milano",
    "postalCode": "20154",
    "addressRegion": "Lombardia",
    "addressCountry": "IT"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.4642,
    "longitude": 9.1900
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "09:00",
    "closes": "18:00"
  },
  "priceRange": "$$",
  "areaServed": {
    "@type": "Country",
    "name": "Italia"
  }
}
```

**2. JobPosting per lavora-con-noi.html:**

```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Agente di Vendita Sistemi di Sicurezza",
  "description": "Cerchiamo agenti di vendita per sistemi di sicurezza in tutta Italia",
  "datePosted": "2026-02-12",
  "validThrough": "2026-12-31",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@id": "https://www.fbtotalsecurity.com/#organization"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Milano",
      "addressRegion": "Lombardia",
      "addressCountry": "IT"
    }
  }
}
```

**3. AggregateRating (quando disponibili recensioni):**
Attualmente non ci sono recensioni/testimonianze sul sito. Aggiungere sezione testimonianze e implementare schema Review/AggregateRating.

**4. HowTo per guide (quando blog attivo):**
Da implementare sui futuri articoli guida.

---

# FASE 3 - OFF-PAGE SEO E AUTORITA

## 3.1 Profilo Backlink - Score: 4/10

### Analisi qualitativa

Basandosi sui dati deducibili dal sito:

**Link in uscita rilevati:**
- facebook.com/profile.php?id=61581141350058 (Social)
- linkedin.com/in/francodibenedetto (Social)
- instagram.com/francosicurezza (Social)
- x.com/FBTotalSecurity (Social)
- professionisti-italia.it (Directory)

**Backlink probabili (basati su sameAs e directory):**
- Profilo Facebook business
- Profilo LinkedIn personale
- Directory professionisti-italia.it

**Valutazione:** Profilo backlink MOLTO DEBOLE. Quasi nessun backlink da siti autorevoli del settore.

### Opportunita di Link Building

| Strategia | Difficolta | Impatto | Azioni specifiche |
|-----------|-----------|---------|-------------------|
| Directory settore sicurezza | Bassa | Medio | Iscriversi a PagineGialle, TuttoCitta, Europages, Kompass |
| Directory locali Milano | Bassa | Medio | MilanoToday, Virgilio, Hotfrog |
| Partnership link (UR Fog, Xecur, CIVIS) | Media | Alto | Richiedere link dalla pagina partner/rivenditori |
| Guest posting settore sicurezza | Media | Alto | Scrivere per blog di sicurezza, domotica, edilizia |
| Digital PR locale | Media | Alto | Comunicati stampa su installazioni importanti |
| Associazioni di categoria | Bassa | Alto | ANIE Sicurezza, Confindustria, ANCISS |
| Broken link building | Media | Medio | Trovare link rotti su pagine di sicurezza e proporre contenuti |

---

## 3.2 Brand Authority e E-E-A-T - Score: 5/10

| Segnale E-E-A-T | Presente | Qualita |
|-----------------|---------|---------|
| Pagina Chi Siamo | SI | Buona base, manca foto team |
| Bio fondatore | SI | Nome presente, manca foto e bio dettagliata |
| Pagina autore dedicata | NO | Da creare chi-e-franco.html |
| Foto team | NO | Nessuna foto reale del team |
| Case study | NO | Nessun progetto documentato |
| Testimonianze clienti | NO | Nessuna recensione/testimonianza |
| Certificazioni verificabili | PARZIALE | Menzionate ma non documentate con immagini |
| Partnership documentate | SI | Loghi partner presenti (UR Fog, Xecur, CIVIS, ITL Group) |
| Social media attivi | PARZIALE | Profili esistono ma attivita non verificabile |
| Dati aziendali completi | NO | P.IVA fittizia, indirizzo generico |

**Problemi principali E-E-A-T:**
1. P.IVA fittizia 12345678901 - DISTRUGGE la credibilita
2. Nessuna foto reale di Franco Di Benedetto o del team
3. Nessun case study o portfolio lavori completati
4. Nessuna testimonianza cliente verificabile
5. Indirizzo generico "Corso Sempione, Milano" senza numero civico

---

# FASE 4 - LOCAL SEO

## 4.1 Google Business Profile - Score: 5/10

### Analisi (basata sui dati dal sito)

| Aspetto | Stato | Note |
|---------|-------|------|
| GBP creato | PRESUNTO | Dati NAP presenti sul sito ma non verificabile |
| Categorie complete | NON VERIFICABILE | Suggerite: Security System Installer, Alarm System Supplier |
| Foto aggiornate | IMPROBABILE | Nessuna foto reale sul sito |
| Post GBP regolari | NON VERIFICABILE | Suggerire pubblicazione settimanale |
| Gestione recensioni | IMPROBABILE | Nessuna recensione visibile |

**Azioni immediate:**
1. Verificare che GBP esista e sia verificato
2. Completare TUTTE le categorie (principale + secondarie)
3. Aggiungere foto reali dell ufficio, del team, delle installazioni
4. Iniziare a chiedere recensioni ai clienti
5. Pubblicare post GBP settimanali con offerte/novita

## 4.2 NAP Consistency - Score: 4/10

| Fonte | Nome | Indirizzo | Telefono | Stato |
|-------|------|----------|----------|-------|
| Sito web (contatti) | FB Total Security | Corso Sempione, Milano | +393802647367 | INCOMPLETO |
| Schema Organization | FB Total Security | Corso Sempione, 20154, MI | +393802647367 | INCOMPLETO (no civico) |
| Schema Organization-detail | FB Total Security | Corso Sempione, 20154, MI | +393802647367 | INCOMPLETO |
| Footer | FB Total Security | - | - | MANCANTE |

**PROBLEMI:**
1. Indirizzo INCOMPLETO: manca numero civico su Corso Sempione
2. Telefono NON VISIBILE nel footer (solo email)
3. P.IVA fittizia nel footer
4. NAP non presente in forma testuale nel footer di ogni pagina

**Markup LocalBusiness:** MANCANTE. Implementare come indicato nella sezione Schema.

## 4.3 Local Content Strategy - Score: 3/10

| Aspetto | Stato |
|---------|-------|
| Pagine dedicate per area | NO - nessuna pagina per citta |
| Contenuti localizzati | NO - solo menzione generica "Tutta Italia" |
| Case study locali | NO |
| Eventi/partnership locali | NO |

**Opportunita:**
Se il business serve principalmente Milano e Lombardia, creare pagine dedicate:
- /sistemi-sicurezza-milano.html
- /sistemi-sicurezza-monza.html
- /sistemi-sicurezza-bergamo.html
- etc.

Ogni pagina con contenuto unico, testimonianze locali, riferimenti a zone specifiche.

---

# FASE 5 - AI SEARCH READINESS (SGE / AI Overview)

## 5.1 Ottimizzazione per AI Overview - Score: 6/10

| Aspetto | Stato | Note |
|---------|-------|------|
| Risposte dirette e concise | PARZIALE | Le pagine servizio hanno buone descrizioni ma mancano definizioni esplicite in apertura |
| Definizioni esplicite | PARZIALE | "I nebbiogeni rappresentano la frontiera..." e un buon inizio ma non e strutturato come "Un nebbiogeno e..." |
| Struttura domanda-risposta | SI | FAQ presenti su 4 pagine servizio con details/summary |
| Dati strutturati per LLM | SI | FAQPage, Service, Organization schema presenti |
| Contenuto "chunkable" | SI | Sezioni ben definite con heading descrittivi |

**Miglioramenti suggeriti:**

1. Aggiungere definizioni esplicite in apertura di ogni pagina servizio:
```
Un sistema nebbiogeno e un dispositivo di sicurezza antifurto che rilascia 
una densa nebbia atossica per ridurre la visibilita a zero in meno di 10 secondi, 
impedendo ai ladri di orientarsi all interno dei locali protetti.
```

2. Aggiungere paragrafi "In breve" o "Cos e" come primo contenuto dopo l H1

3. Utilizzare tabelle comparative per dati tecnici (facilmente estraibili dagli LLM)

4. Aggiungere statistiche e dati proprietari (es. "Abbiamo installato oltre 500 sistemi nebbiogeni in Italia")

## 5.2 Citabilita - Score: 5/10

| Aspetto | Stato | Note |
|---------|-------|------|
| Contenuti originali | PARZIALE | Buone descrizioni ma nessun dato proprietario |
| Statistiche/dati | NO | Nessun dato numerico specifico |
| Opinioni esperte | PARZIALE | Menzioni di certificazioni ma senza approfondimenti tecnici |
| Struttura per chunking | SI | Heading descrittivi, sezioni ben definite |
| Authority signals | DEBOLE | Mancano citazioni, ricerche, white paper |

**Per migliorare la citabilita:**
1. Pubblicare guide tecniche approfondite (come funziona un nebbiogeno, step by step)
2. Creare contenuti con dati originali (es. "Report Sicurezza Milano 2026")
3. Documentare case study reali con numeri e risultati
4. Aggiungere opinioni tecniche firmate da Franco Di Benedetto

---

# FASE 6 - PIANO D AZIONE PRIORITIZZATO

## PRIORITA CRITICA (Settimana 1-2)

### 1. Creare privacy-policy.html e cookie-policy.html
- **Cosa:** Creare pagine legali GDPR obbligatorie
- **Come:** Generare con template legale, includere cookie banner
- **Impatto:** Compliance legale + eliminazione link rotti nel footer
- **Effort:** 2-4 ore

### 2. Correggere P.IVA fittizia
- **Cosa:** Sostituire 12345678901 con P.IVA reale in tutte le pagine
- **Come:** Search and replace in tutti i file HTML
- **Impatto:** Credibilita E-E-A-T + compliance legale
- **Effort:** 15 minuti

### 3. Aggiornare copyright a 2026
- **Cosa:** Cambiare "2025" a "2026" nel footer
- **Come:** Search and replace
- **Impatto:** Segnale di freschezza
- **Effort:** 5 minuti

### 4. Aggiornare Expires header in .htaccess
- **Cosa:** Cambiare data da 2025 a 2026
- **Come:** Modificare .htaccess
- **Impatto:** Cache browser funzionante
- **Effort:** 5 minuti

### 5. Rimuovere termini-condizioni.html dalla sitemap
- **Cosa:** Eliminare URL noindex dalla sitemap
- **Come:** Rimuovere blocco url da sitemap.xml
- **Impatto:** Eliminare segnale conflittuale a Google
- **Effort:** 5 minuti

### 6. Correggere link rotti nel footer
- **Cosa:** Sostituire href=# con link reali o rimuovere
- **Come:** Puntare a privacy-policy.html, cookie-policy.html, termini-condizioni.html
- **Impatto:** UX + crawling + trust
- **Effort:** 30 minuti

### 7. Implementare LocalBusiness schema
- **Cosa:** Aggiungere markup LocalBusiness su index.html
- **Come:** Aggiungere script ld+json (codice fornito in sezione 2.4)
- **Impatto:** Local SEO + Google Business integration
- **Effort:** 30 minuti

---

## PRIORITA ALTA (Settimana 3-6)

### 8. Uniformare font (versione e font-display)
- **Cosa:** Allineare tutte le pagine alla stessa versione Inter e font-display
- **Come:** Aggiornare inline CSS su tutte le pagine a v20 + font-display scelto
- **Impatto:** Performance + CLS migliorato
- **Effort:** 2 ore

### 9. Risolvere hreflang
- **Cosa:** Decidere strategia multilingua (server-side, statico, o rimuovere)
- **Come:** Se traffico EN trascurabile: rimuovere hreflang da tutte le pagine e sitemap
- **Impatto:** Eliminare confusione Googlebot + contenuto duplicato
- **Effort:** 1-3 ore (rimozione) / 1-2 settimane (implementazione statica EN)

### 10. Creare contatti.html dedicata
- **Cosa:** Pagina dedicata contatti (non solo anchor nella homepage)
- **Come:** HTML con form, mappa, dati NAP completi, schema ContactPage
- **Impatto:** Pagina indicizzabile per "contatti sicurezza Milano"
- **Effort:** 4-6 ore

### 11. Unificare Organization schema
- **Cosa:** Rimuovere blocco Organization duplicato da index.html
- **Come:** Mantenere solo il blocco nel @graph, rimuovere #organization-detail
- **Impatto:** Schema pulito, nessuna confusione Google
- **Effort:** 30 minuti

### 12. Spostare script inline in file esterni
- **Cosa:** Esternalizzare script YouTube embed, carousel, Zaraz debug
- **Come:** Creare js/youtube-embed.js, js/carousel.js; rimuovere Zaraz debug in produzione
- **Impatto:** Parser non bloccato, TTI migliorato
- **Effort:** 2-3 ore

### 13. Accorciare meta description troppo lunghe
- **Cosa:** chi-siamo.html e lavora-con-noi.html hanno meta desc > 160 char
- **Come:** Riscrivere sotto 160 caratteri con CTA
- **Impatto:** Snippet migliori in SERP
- **Effort:** 30 minuti

### 14. Migliorare H1 di sorveglianza.html
- **Cosa:** Cambiare da "Videosorveglianza" a "Videosorveglianza Professionale"
- **Come:** Modificare H1
- **Impatto:** Matching migliore con title tag e keyword target
- **Effort:** 5 minuti

### 15. Caricare structured-data.json nei template
- **Cosa:** I dati Service/Person/FAQ in structured-data.json non sono caricati
- **Come:** Includere inline nelle pagine o caricare via JS
- **Impatto:** Schema completo visibile a Google
- **Effort:** 1 ora

---

## PRIORITA MEDIA (Mese 2-3)

### 16. Creare pagina autore chi-e-franco.html
- **Cosa:** Pagina dedicata E-E-A-T per Franco Di Benedetto
- **Come:** Bio completa, foto, certificazioni, esperienza, link a profili social
- **Impatto:** Boost autorita E-E-A-T significativo
- **Effort:** 4-6 ore

### 17. Aggiungere sezione testimonianze
- **Cosa:** Raccogliere e pubblicare testimonianze clienti reali
- **Come:** Sezione su homepage + schema Review/AggregateRating
- **Impatto:** Trust + conversion rate + rich snippets
- **Effort:** 4-8 ore (inclusa raccolta testimonianze)

### 18. Avviare blog con primi 3 articoli
- **Cosa:** Creare sezione blog e pubblicare articoli del topic cluster
- **Come:** /blog/ con articoli da 1500+ parole, schema Article
- **Impatto:** Traffico informazionale +2K-5K/mese nel medio termine
- **Effort:** 3-5 giorni per i primi 3 articoli

### 19. Ottimizzare per Google Business Profile
- **Cosa:** Completare e ottimizzare il profilo GBP
- **Come:** Tutte le categorie, attributi, foto reali, post regolari
- **Impatto:** Visibilita nel local pack di Google Maps
- **Effort:** 2-4 ore setup + ongoing

### 20. Implementare Brotli compression
- **Cosa:** Aggiungere compressione Brotli oltre a Gzip
- **Come:** Configurazione server (se supportato da hosting)
- **Impatto:** 15-20% riduzione dimensione rispetto a Gzip
- **Effort:** 1 ora

### 21. Aggiungere CTA alle meta description mancanti
- **Cosa:** Aggiungere call-to-action nelle meta desc di index, sorveglianza, serramenti
- **Come:** Riscrivere con formula: [descrizione] + [CTA]
- **Impatto:** CTR migliorato in SERP
- **Effort:** 30 minuti

### 22. Implementare CSS deferred su tutte le pagine
- **Cosa:** Applicare media=print onload trick su tutte le pagine (non solo index)
- **Come:** Modificare tag link CSS su 7 pagine
- **Impatto:** LCP migliorato
- **Effort:** 1 ora

### 23. Aggiungere JobPosting schema a lavora-con-noi.html
- **Cosa:** Implementare schema JobPosting per le posizioni aperte
- **Come:** Aggiungere ld+json (codice fornito in sezione 2.4)
- **Impatto:** Rich snippets per offerte lavoro in Google
- **Effort:** 30 minuti

---

## PRIORITA CONTINUATIVA (Ongoing)

### 24. Pubblicare 2-4 articoli blog al mese
- Targeting keyword informazionali del topic cluster
- Ogni articolo: 1500+ parole, schema Article, internal linking

### 25. Pubblicare 1-2 post GBP alla settimana
- Offerte, novita, installazioni completate, consigli sicurezza

### 26. Raccogliere recensioni clienti
- Chiedere attivamente dopo ogni installazione
- Rispondere a TUTTE le recensioni (positive e negative)

### 27. Link building mensile
- 2-3 backlink di qualita al mese
- Directory, guest post, digital PR

### 28. Aggiornare contenuti esistenti
- Review trimestrale di tutti i contenuti
- Aggiornare dati, normative, prezzi

### 29. Monitorare Core Web Vitals
- Check mensile con PageSpeed Insights
- Intervenire su regressioni

### 30. Aggiornare sitemap e schema
- Aggiungere nuove pagine alla sitemap
- Aggiornare lastmod quando si modificano contenuti

---

# FASE 7 - CONSIGLI STRATEGICI PERSONALIZZATI

## 3 Quick Wins

### Quick Win 1: Correggere P.IVA + Copyright + Expires Header
- **Effort:** 15 minuti totali
- **Impatto:** Compliance legale, credibilita, cache funzionante
- **Come:** 3 find-and-replace rapidi

### Quick Win 2: Correggere link footer + creare pagine legali
- **Effort:** 2-4 ore
- **Impatto:** Eliminare 4 link rotti su 8 pagine (32 link rotti totali!), compliance GDPR
- **Come:** Creare privacy-policy.html e cookie-policy.html, aggiornare footer

### Quick Win 3: Implementare LocalBusiness schema + unificare Organization
- **Effort:** 1 ora
- **Impatto:** Visibilita Local SEO, rich snippets, knowledge panel
- **Come:** Aggiungere JSON-LD LocalBusiness, rimuovere Organization duplicato

## La piu grande opportunita persa

**BLOG / CONTENT MARKETING**

Il sito NON ha un blog. In un settore dove le persone cercano attivamente informazioni ("come proteggere casa dai ladri", "nebbiogeni come funzionano", "detrazione fiscale allarme"), l assenza di contenuti informativi lascia sul tavolo migliaia di visite mensili.

Un blog con 10-20 articoli ben ottimizzati potrebbe portare:
- +5.000-10.000 visite organiche/mese
- Lead qualificati da keyword informazionali (funnel top)
- Autorita tematica (topical authority) che boosterebbe anche le pagine commerciali
- Contenuti citabili dagli AI Overview di Google

## Vantaggio competitivo da amplificare

**PARTNERSHIP DIRETTE CON BRAND PREMIUM**

FB Total Security ha partnership dirette con UR Fog, Xecur, CIVIS S.p.A. e ITL Group. Questo e un differenziatore forte. Per amplificarlo:

1. Creare pagine dedicate per ogni partnership (es. /partnership-urfog.html)
2. Richiedere backlink dai siti partner (pagina rivenditori/agenti)
3. Creare contenuti co-branded (video, guide tecniche)
4. Documentare certificazioni e autorizzazioni con immagini dei certificati reali

## Previsione timeline

| Periodo | Azione | Risultato atteso |
|---------|--------|-----------------|
| Settimana 1-2 | Fix critici (legal, schema, cache) | Eliminazione penalizzazioni tecniche |
| Mese 1 | Ottimizzazioni on-page + Local SEO | +20-30% impressioni in Search Console |
| Mese 2-3 | Blog launch + GBP optimization | Primi posizionamenti keyword informazionali |
| Mese 3-6 | Content marketing + link building | +50-100% traffico organico |
| Mese 6-12 | Authority building + review strategy | Posizionamenti stabili top 5 per keyword locali |

**Timeline realistica per risultati misurabili:** 3-4 mesi per miglioramenti significativi nel ranking, 6-12 mesi per posizionamenti stabili sulle keyword principali.

## KPI da monitorare

| KPI | Frequenza | Tool |
|-----|-----------|------|
| Posizioni keyword target (top 20) | Settimanale | Google Search Console / Ubersuggest |
| Traffico organico totale | Settimanale | Google Analytics 4 |
| Impressioni e CTR in SERP | Settimanale | Google Search Console |
| Core Web Vitals (LCP, INP, CLS) | Mensile | PageSpeed Insights |
| Pagine indicizzate | Mensile | Google Search Console (Copertura) |
| Backlink nuovi | Mensile | Google Search Console / Ubersuggest |
| Posizione Local Pack | Settimanale | Ricerca manuale da Milano |
| Recensioni GBP | Settimanale | Google Business Profile |
| Conversioni (form contatti) | Settimanale | Google Analytics 4 |
| Bounce rate per pagina | Mensile | Google Analytics 4 |

## Tool consigliati

| Tool | Costo | Uso |
|------|-------|-----|
| Google Search Console | Gratuito | Monitoraggio indicizzazione, keyword, CTR |
| Google Analytics 4 | Gratuito | Traffico, conversioni, comportamento utenti |
| Google Business Profile | Gratuito | Local SEO, recensioni, post |
| PageSpeed Insights | Gratuito | Core Web Vitals, performance |
| Google Rich Results Test | Gratuito | Validazione schema markup |
| Ubersuggest | Freemium (29 euro/mese) | Keyword research, backlink analysis, competitor |
| Screaming Frog SEO Spider | Free fino 500 URL | Audit tecnico, link rotti, redirect |
| Schema.org Validator | Gratuito | Validazione dati strutturati |
| GTmetrix | Gratuito | Performance analysis approfondita |
| AnswerThePublic | Freemium | Idee contenuti da domande utenti |

---

# SEO SCORE COMPLESSIVO

## Score per Area

| Area | Score | Note |
|------|-------|------|
| 1.1 Crawlability e Indexing | 6/10 | Hreflang problematico, conflitto noindex/sitemap |
| 1.2 Core Web Vitals | 7/10 | Buona base, inconsistenze font, script inline pesanti |
| 1.3 Mobile e Accessibilita | 8/10 | Ottimo responsive, buoni alt text, heading corretti |
| 1.4 Sicurezza | 9/10 | Headers eccellenti, CSP completa, HSTS preload |
| 2.1 Struttura HTML | 7/10 | Title/H1 buoni, meta desc da accorciare, link rotti footer |
| 2.2 Keyword Strategy | 6/10 | Buona ottimizzazione base, mancano keyword commerciali/prezzo |
| 2.3 Content Gap | 4/10 | Nessun blog, nessun case study, pagine legali mancanti |
| 2.4 Schema Markup | 7/10 | Buona copertura, ma duplicati e file non caricato |
| 3.1 Profilo Backlink | 3/10 | Quasi inesistente, solo social e 1 directory |
| 3.2 E-E-A-T | 5/10 | P.IVA fittizia, no foto, no testimonianze |
| 4.0 Local SEO | 4/10 | NAP incompleto, no LocalBusiness schema, no GBP ottimizzato |
| 5.0 AI Readiness | 6/10 | FAQ presenti, struttura buona, mancano dati originali |

## SCORE COMPLESSIVO: 6.0 / 10

**Interpretazione:** Il sito ha una solida base tecnica (security headers, critical CSS, schema base) ma presenta lacune significative in:
- Compliance legale (P.IVA, GDPR)
- Content strategy (nessun blog)
- Link building (profilo quasi vuoto)
- Local SEO (schema e GBP da completare)
- E-E-A-T (mancano prove sociali e dati reali)

## TARGET REALISTICO POST-OTTIMIZZAZIONE

| Timeframe | Score atteso | Condizione |
|-----------|-------------|-----------|
| Dopo Sprint 1 (2 settimane) | 7.0/10 | Fix critici completati |
| Dopo Sprint 2 (6 settimane) | 7.5/10 | Ottimizzazioni on-page + Local SEO |
| Dopo 3 mesi | 8.0/10 | Blog avviato + GBP ottimizzato |
| Dopo 6 mesi | 8.5/10 | Content marketing + link building attivi |
| Dopo 12 mesi | 9.0/10 | Authority consolidata + recensioni + portfolio |

---

*Report generato il 12 Febbraio 2026 - Audit basato sull analisi statica del codice sorgente.*
*Per un audit completo dei Core Web Vitals in produzione, eseguire test con PageSpeed Insights e Chrome DevTools sul sito live.*
