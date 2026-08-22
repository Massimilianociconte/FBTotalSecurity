/**
 * Cookie Consent — FB Total Security
 * Banner leggero GDPR: nessun tracciamento prima del consenso esplicito.
 * Scelta persistita in localStorage ('fbs-cookie-consent': 'granted'|'denied').
 * Emette l'evento 'fbs-consent-change' consumato da third-party-loader.js
 */
(function () {
    'use strict';

    var CONSENT_KEY = 'fbs-cookie-consent';
    var EVENT_NAME = 'fbs-consent-change';

    function getConsent() {
        try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
    }

    function setConsent(value) {
        try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* storage non disponibile */ }
        document.dispatchEvent(new CustomEvent(EVENT_NAME, {
            detail: { granted: value === 'granted' }
        }));
        hideBanner();
    }

    window.fbsConsent = {
        isGranted: function () { return getConsent() === 'granted'; },
        revoke: function () {
            try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
            showBanner();
        }
    };

    function buildBanner() {
        var root = document.createElement('div');
        root.className = 'cookie-banner';
        root.id = 'cookie-banner';
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Informativa cookie');
        root.setAttribute('aria-hidden', 'true');

        var text = document.createElement('p');
        text.className = 'cookie-banner-text';
        text.innerHTML = 'Usiamo cookie tecnici e, previo tuo consenso, cookie analitici e di marketing per misurare le performance del sito. ' +
            '<a href="' + bannerPath() + 'cookie-policy.html">Cookie Policy</a>';

        var actions = document.createElement('div');
        actions.className = 'cookie-banner-actions';

        var reject = document.createElement('button');
        reject.type = 'button';
        reject.className = 'btn btn-ghost btn-sm cookie-reject';
        reject.textContent = 'Rifiuta';
        reject.addEventListener('click', function () { setConsent('denied'); });

        var accept = document.createElement('button');
        accept.type = 'button';
        accept.className = 'btn btn-primary btn-sm cookie-accept';
        accept.textContent = 'Accetta';
        accept.addEventListener('click', function () { setConsent('granted'); });

        actions.appendChild(reject);
        actions.appendChild(accept);
        root.appendChild(text);
        root.appendChild(actions);
        document.body.appendChild(root);
        return root;
    }

    function bannerPath() {
        return /\/blog\//.test(window.location.pathname) ? '../' : '';
    }

    var bannerEl = null;

    function showBanner() {
        if (!bannerEl) bannerEl = buildBanner();
        requestAnimationFrame(function () {
            bannerEl.classList.add('visible');
            bannerEl.setAttribute('aria-hidden', 'false');
        });
    }

    function hideBanner() {
        if (!bannerEl) return;
        bannerEl.classList.remove('visible');
        bannerEl.setAttribute('aria-hidden', 'true');
    }

    function init() {
        if (!getConsent()) showBanner();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
