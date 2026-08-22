/**
 * Third-Party Scripts Loader — v2 GDPR
 * GA4 e Facebook Pixel vengono caricati SOLO dopo consenso esplicito
 * rilasciato tramite il banner (js/cookie-consent.js).
 * Evento atteso: 'fbs-consent-change' { detail: { granted: boolean } }
 */
(function () {
    'use strict';

    var loaded = { gtag: false, fbPixel: false };

    function loadGoogleAnalytics() {
        if (loaded.gtag) return;
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-K3KTWNJ5CQ';
        script.onload = function () {
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'G-K3KTWNJ5CQ', {
                send_page_view: false,
                transport_type: 'beacon',
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                anonymize_ip: true,
                cookie_flags: 'Secure'
            });
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href
            });
            loaded.gtag = true;
        };
        document.head.appendChild(script);
    }

    function loadFacebookPixel() {
        if (loaded.fbPixel) return;
        var script = document.createElement('script');
        script.async = true;
        script.src = 'js/facebook-pixel-optimized.js';
        script.onload = function () { loaded.fbPixel = true; };
        document.head.appendChild(script);
    }

    function loadAll() {
        loadGoogleAnalytics();
        loadFacebookPixel();
    }

    function onConsentChange(e) {
        if (e.detail && e.detail.granted) loadAll();
    }

    function init() {
        if (window.fbsConsent && window.fbsConsent.isGranted()) {
            loadAll();
        }
        document.addEventListener('fbs-consent-change', onConsentChange);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
