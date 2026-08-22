# SECURITY HEADERS — ISTRUZIONI DI APPLICAZIONE

## Il problema
Il sito è pubblicato su **GitHub Pages** (con Cloudflare davanti): i file `.htaccess`
NON vengono mai letti, quindi tutti gli header di sicurezza definiti lì sono morti.

GitHub Pages non permette header personalizzati. Le uniche due strade valide:

---

## OPZIONE A — Cloudflare (consigliata, zero migrazione)
Dashboard Cloudflare → dominio fbtotalsecurity.com → **Rules → Transform Rules → Modify Response Header**

Creare una regola "All incoming responses" con questi header (Set static):

| Header | Valore |
| --- | --- |
| Strict-Transport-Security | max-age=63072000; includeSubDomains |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | SAMEORIGIN |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | geolocation=(), microphone=(), camera=() |

NOTA HSTS: NON attivare il flag `preload` finché tutti i sottodomini non sono HTTPS-certificati.

### Content-Security-Policy (fase 2 — dopo test)
Attivare prima in modalità Report-Only per 2 settimane:
```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.google-analytics.com https://www.facebook.com; connect-src 'self' https://*.google-analytics.com https://analytics.google.com https://www.facebook.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```
Se il report non mostra violazioni reali → promuovere a `Content-Security-Policy`.

### Caching long-term (stesso pannello → Cache Rules)
- Rule: URI Path matches `\.(css|js|png|jpg|jpeg|webp|svg|woff2)$` → Edge TTL: 1 month,
  Browser TTL: 1 year. Così i file `?v=YYYYMMDD` sfruttano davvero la cache.

## OPZIONE B — Migrazione a Cloudflare Pages
1. Repo su GitHub → Cloudflare Pages → connetti il repo (build: nessuno, output: `/`)
2. Aggiungere il file `_headers` già pronto nella root di questo progetto
3. Puntare il dominio custom su Pages; GitHub Pages resta come fallback

Il file `_headers` incluso contiene gli stessi header pronti per questa opzione.
