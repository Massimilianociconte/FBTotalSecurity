
// DOM Query Cache per ridurre forced reflow
const domCache = new Map();
const cacheTimeout = 16; // ~60fps

function getCachedDOMProperty(element, property, getter) {
    const key = `${element.tagName}-${element.className}-${property}`;
    const cached = domCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        return cached.value;
    }
    
    const value = getter();
    domCache.set(key, { value, timestamp: Date.now() });
    return value;
}

// Batch DOM reads and writes
const domOperations = {
    reads: [],
    writes: [],
    
    read(fn) {
        this.reads.push(fn);
        this.schedule();
    },
    
    write(fn) {
        this.writes.push(fn);
        this.schedule();
    },
    
    schedule() {
        if (this.scheduled) return;
        this.scheduled = true;
        
        requestAnimationFrame(() => {
            // Execute all reads first
            this.reads.forEach(fn => fn());
            this.reads = [];
            
            // Then execute all writes
            this.writes.forEach(fn => fn());
            this.writes = [];
            
            this.scheduled = false;
        });
    },
    
    scheduled: false
};
// Utility functions to prevent forced reflows
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 1. Oggetto per memorizzare gli elementi del DOM (cache centralizzata)
const DOM = {};

// Funzione per popolare la cache del DOM (solo lettura)
function cacheDOMElements() {
    DOM.hamburger = document.querySelector('.hamburger');
    DOM.navMenu = document.querySelector('.nav-menu');
    DOM.navLinks = document.querySelectorAll('.nav-link');
    DOM.smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    DOM.header = document.querySelector('.header');
    DOM.sections = document.querySelectorAll('section[id]');
    DOM.contactForms = document.querySelectorAll('.contact-form form, #candidature-form');
    DOM.serviceCards = document.querySelectorAll('.service-card');
    DOM.animateElements = document.querySelectorAll('.service-card, .feature, .contact-item, .service-text, .service-image');
    DOM.langButtons = document.querySelectorAll('.lang-btn');
    DOM.body = document.body;
    DOM.navLinksWithHash = document.querySelectorAll('.nav-link[href^="#"]');
}

// DOM Content Loaded - Ottimizzato per eliminare forced reflow
// FASE 1 - DOMContentLoaded (Critica): Solo funzioni che non leggono la geometria del layout
document.addEventListener('DOMContentLoaded', function() {
    // Snapshot testi italiani PRIMA di qualsiasi traduzione (per il ritorno EN->IT)
    captureOriginalItalian();

    // Popola la cache una sola volta
    cacheDOMElements();

    // Inizializza solo le funzioni critiche che non causano forced reflows
    initMobileMenu();
    initSmoothScrolling_Phase1();
    initContactForm();
    initLanguageSelector();
});

// FASE 2 - window.load (Post-Rendering): Funzioni che leggono layout dopo il rendering completo
window.addEventListener('load', function() {
    // Ritardo strategico per eliminare forced reflows durante il percorso critico
    setTimeout(() => {
        initSmoothScrolling_Phase2();
        initScrollAnimations();
        initHeaderScroll();
        initServiceCards();
    }, 100); // Piccolo ritardo per garantire stabilità del layout
});

// Mobile Menu Functionality - Usa cache DOM per eliminare forced reflow
function initMobileMenu() {
    if (DOM.hamburger && DOM.navMenu) {
        const header = DOM.header || document.querySelector('.header');
        
        // Accessibilità ARIA per lettori di schermo
        DOM.hamburger.setAttribute('aria-label', 'Apri menu di navigazione');
        DOM.hamburger.setAttribute('aria-expanded', 'false');
        DOM.hamburger.setAttribute('aria-controls', 'nav-menu');
        if (!DOM.navMenu.id) {
            DOM.navMenu.id = 'nav-menu';
        }
        
        const setMenuState = (isOpen) => {
            const active = isOpen !== undefined ? isOpen : !DOM.hamburger.classList.contains('active');
            DOM.hamburger.classList.toggle('active', active);
            DOM.navMenu.classList.toggle('active', active);
            DOM.body.classList.toggle('menu-open', active);
            DOM.hamburger.setAttribute('aria-expanded', active ? 'true' : 'false');
            DOM.hamburger.setAttribute('aria-label', active ? 'Chiudi menu di navigazione' : 'Apri menu di navigazione');
            
            // Blocco scroll background su mobile per eliminare layout shift durante la navigazione
            if (window.innerWidth <= 768) {
                DOM.body.style.overflow = active ? 'hidden' : '';
            } else {
                DOM.body.style.overflow = '';
            }
            
            if (header) {
                header.classList.toggle('menu-open', active);
                if (active) {
                    header.style.transform = 'translateY(0)';
                }
            }

            // Focus management: primo link all'apertura, ritorno all'hamburger alla chiusura
            if (active) {
                const firstLink = DOM.navMenu.querySelector('a');
                if (firstLink) setTimeout(() => firstLink.focus(), 60);
            } else if (document.activeElement && DOM.navMenu.contains(document.activeElement)) {
                DOM.hamburger.focus();
            }
        };

        // Focus trap: il Tab cicla dentro header+menu finché il menu è aperto
        document.addEventListener('keydown', function(e) {
            if (e.key !== 'Tab' || !DOM.hamburger.classList.contains('active')) return;
            const focusables = [DOM.hamburger].concat(
                Array.prototype.slice.call(DOM.navMenu.querySelectorAll('a, button'))
            ).filter(el => el.offsetParent !== null || el === DOM.hamburger);
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        });
        
        DOM.hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            setMenuState();
        });
        
        // Close menu when clicking on a link
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', function() {
                setMenuState(false);
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (DOM.hamburger.classList.contains('active') && 
                !DOM.hamburger.contains(e.target) && 
                !DOM.navMenu.contains(e.target)) {
                setMenuState(false);
            }
        });

        // Close menu on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && DOM.hamburger.classList.contains('active')) {
                setMenuState(false);
            }
        });
    }
}

// Smooth Scrolling for Navigation Links
// Smooth Scrolling for Navigation Links - Optimized to reduce layout thrashing
/**
 * VERSIONE MIGLIORATA: initSmoothScrolling
 * Usa window.scrollTo che è il metodo standard e più pulito.
 * La lettura di getBoundingClientRect() qui è sicura perché avviene solo
 * su un'azione dell'utente (click), non in un loop o in un evento di scroll.
 */
// FASE 1: Configurazione base dello smooth scrolling senza letture di layout
function initSmoothScrolling_Phase1() {
    // Inizializza con un valore di default per evitare letture di layout
    window.cachedHeaderHeight = 72;

    // Configura gli event listener per i link senza leggere la geometria
    DOM.smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Usa il sistema di batching DOM per evitare forced reflow
                domOperations.read(() => {
                    // Cache the position calculation to avoid repeated getBoundingClientRect calls
                    const cacheKey = `scrollPosition_${targetId}`;
                    const cachedPosition = getCachedDOMProperty(
                        targetSection,
                        cacheKey,
                        () => {
                            // Use double requestAnimationFrame to ensure layout is completely stable
                            return new Promise(resolve => {
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        // Batch read operations to minimize forced reflow
                                        const rect = targetSection.getBoundingClientRect();
                                        const scrollY = window.pageYOffset;
                                        const headerHeight = window.cachedHeaderHeight || 80;
                                        const position = rect.top + scrollY - headerHeight - 20;
                                        resolve(position);
                                    });
                                });
                            });
                        }
                    );
                    
                    // Handle both cached values and promises
                    Promise.resolve(cachedPosition).then(targetPosition => {
                        // Use requestAnimationFrame for smooth write operation
                        requestAnimationFrame(() => {
                            domOperations.write(() => {
                                window.scrollTo({
                                    top: targetPosition,
                                    behavior: 'smooth'
                                });
                                
                                updateActiveNavLink(targetId);
                            });
                        });
                    });
                });
            }
        });
    });
}

// FASE 2: Inizializzazione del ResizeObserver dopo il rendering completo
function initSmoothScrolling_Phase2() {
    // Ora è sicuro inizializzare il ResizeObserver senza penalizzare PageSpeed
    if (DOM.header && window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                window.cachedHeaderHeight = entry.contentRect.height;
            }
        });
        resizeObserver.observe(DOM.header);
    }
}

// Update Active Navigation Link - Usa cache DOM centralizzata
function updateActiveNavLink(targetId) {
    DOM.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });
}

// Header Scroll Effect - Usa cache DOM per eliminare forced reflow
function initHeaderScroll() {
    if (!DOM.header) return;
    
    // Simplified scroll handling with throttled scroll listener
    let ticking = false;
    let lastScrollY = 0;
    
    const handleScroll = () => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        // Usa il sistema di batching DOM per evitare forced reflow
        domOperations.write(() => {
            // Solo stato visivo: nessun spostamento/ridimensionamento della navbar
            DOM.header.classList.toggle('scrolled', scrollY > 50);
        });

        lastScrollY = scrollY;
        ticking = false;
    };
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });
    
    // Simplified IntersectionObserver for active section detection - usa cache DOM
     if (DOM.sections.length > 0 && DOM.navLinksWithHash.length > 0) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('id');
                    
                    // Update active nav links - usa cache DOM
                    DOM.navLinksWithHash.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px' // Simplified options - removed complex threshold array
        });
        
        // Observe all sections - usa cache DOM
        DOM.sections.forEach(section => {
            sectionObserver.observe(section);
        });
    }
}

// Function removed - replaced with optimized version in initHeaderScroll

// script.js

// Scroll Animations - Ottimizzato per eliminare forced reflow e migliorare performance
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Micro-ottimizzazione: smetti di osservare l'elemento una volta animato
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation - usa cache DOM
    DOM.animateElements.forEach(el => {
        observer.observe(el);
    });
}

// Service Cards Hover Effects - Usa cache DOM
function initServiceCards() {
    DOM.serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Contact Form Handling - Usa cache DOM
// Configurazione invio form.
// Imposta FORM_ENDPOINT con il tuo endpoint (es. https://formspree.io/f/xxxxxx).
// Finché è vuoto viene usato il fallback mailto ESPLICITO (nessun falso successo).
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = 'fb.totalsicurezza@gmail.com';
const CONTACT_PHONE = '+393802647367';

function getFormStatus(form) {
    let status = form.querySelector('.form-status');
    if (!status) {
        status = document.createElement('div');
        status.className = 'form-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        (form.querySelector('.form-actions') || form).appendChild(status);
    }
    return status;
}

function showFormStatus(form, type, message, extraHtml) {
    const status = getFormStatus(form);
    status.className = 'form-status is-' + type;
    status.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = message;
    status.appendChild(p);
    if (extraHtml) status.insertAdjacentHTML('beforeend', extraHtml);
}

function clearFormStatus(form) {
    const status = form.querySelector('.form-status');
    if (status) { status.className = 'form-status'; status.innerHTML = ''; }
}

function setFormLoading(form, loading) {
    form.classList.toggle('is-loading', loading);
    const btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Invio in corso…';
        btn.setAttribute('aria-busy', 'true');
    } else {
        btn.textContent = btn.dataset.originalText || 'Invia';
        btn.removeAttribute('aria-busy');
    }
    form.querySelectorAll('input, select, textarea, button').forEach(el => {
        el.disabled = loading ? true : false;
        if (el.name === '_gotcha') el.disabled = true;
    });
}

function buildMailtoBody(data) {
    let body = `Nome: ${data.nome || 'Non specificato'}\n`;
    body += `Email: ${data.email || 'Non specificato'}\n`;
    body += `Telefono: ${data.telefono || 'Non specificato'}\n`;
    if (data.servizio) body += `Servizio: ${data.servizio}\n`;
    if (data.messaggio) body += `Messaggio: ${data.messaggio}\n`;
    return body;
}

function trackLead() {
    try {
        if (window.fbsConsent && window.fbsConsent.isGranted() &&
            typeof window.gtag === 'function' && window.dataLayer) {
            window.gtag('event', 'generate_lead', { form_type: arguments[0] || 'contact' });
        }
    } catch (e) { /* tracking non blocca l'utente */ }
}

async function submitContactForm(form) {
    clearFormStatus(form);

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });

    // Honeypot: i bot che lo compilano vengono scartati in silenzio
    if (data._gotcha) {
        form.reset();
        showFormStatus(form, 'success', 'Richiesta inviata. Ti risponderemo al più presto.');
        return;
    }

    if (!validateForm(data)) return;

    setFormLoading(form, true);

    if (FORM_ENDPOINT) {
        try {
            const res = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.reset();
            setFormLoading(form, false);
            showFormStatus(form, 'success',
                'Richiesta inviata correttamente. Ti ricontatteremo entro 24 ore lavorative.');
            trackLead(form.dataset.formType || 'contact');
            return;
        } catch (err) {
            setFormLoading(form, false);
            showFormStatus(form, 'error',
                'Invio non riuscito (problema di rete o del server). Puoi contattarci direttamente:',
                `<div class="form-fallback">
                    <a class="btn btn-primary" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Richiesta dal sito - FB Total Security')}">Apri l'app email</a>
                    <a class="btn btn-secondary" href="tel:${CONTACT_PHONE}">Chiama ${CONTACT_PHONE}</a>
                </div>`);
            return;
        }
    }

    // Fallback senza endpoint: mailto esplicito, mai un falso "inviato"
    setFormLoading(form, false);
    const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Richiesta dal sito - FB Total Security')}&body=${encodeURIComponent(buildMailtoBody(data))}`;
    showFormStatus(form, 'info',
        'Per completare la richiesta usa uno dei pulsanti qui sotto: apri l\u2019app email con il messaggio già compilato oppure chiamaci direttamente.',
        `<div class="form-fallback">
            <a class="btn btn-primary" href="${mailtoHref}">Apri l'app email</a>
            <a class="btn btn-secondary" href="tel:${CONTACT_PHONE}">Chiama ora</a>
        </div>`);
}

function initContactForm() {
    document.querySelectorAll('.contact-form form, #candidature-form').forEach(contactForm => {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitContactForm(this);
        });

        // Real-time validation
        const inputs = contactForm.querySelectorAll('input:not([name="_gotcha"]), select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });

            input.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
    });
}

// Form Validation
function validateForm(formData) {
    let isValid = true;
    const errors = [];
    
    // Required fields validation - check only fields that exist in the form
    const basicRequiredFields = ['nome', 'email'];
    basicRequiredFields.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
            errors.push(`Il campo ${field} è obbligatorio`);
            isValid = false;
        }
    });
    
    // Check if servizio field exists and is required
    const servicioField = document.querySelector('#servizio');
    if (servicioField && servicioField.hasAttribute('required')) {
        if (!formData.servizio || formData.servizio.trim() === '') {
            errors.push('Il campo servizio è obbligatorio');
            isValid = false;
        }
    }
    
    // Check if telefono field exists and is required
    const telefonoField = document.querySelector('#telefono');
    if (telefonoField && telefonoField.hasAttribute('required')) {
        if (!formData.telefono || formData.telefono.trim() === '') {
            errors.push('Il campo telefono è obbligatorio');
            isValid = false;
        }
    }
    
    // Email validation
    if (formData.email && !isValidEmail(formData.email)) {
        errors.push('Inserisci un indirizzo email valido');
        isValid = false;
    }
    
    // Phone validation (only if phone is provided)
    if (formData.telefono && formData.telefono.trim() !== '' && !isValidPhone(formData.telefono)) {
        errors.push('Inserisci un numero di telefono valido');
        isValid = false;
    }
    
    // Privacy checkbox validation (only if privacy checkbox exists)
    const privacyField = document.querySelector('#privacy');
    if (privacyField && !formData.privacy) {
        errors.push('Devi accettare il trattamento dei dati personali');
        isValid = false;
    }
    
    if (!isValid) {
        showNotification(errors.join('<br>'), 'error');
    }
    
    return isValid;
}

// Validate Individual Field
function validateField(field) {
    const value = (field.type === 'checkbox') ? (field.checked ? 'on' : '') : field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Remove existing error state
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Check if required field is empty
    if (field.hasAttribute('required') && value === '') {
        isValid = false;
        errorMessage = 'Questo campo è obbligatorio';
    }

    // Select: verifica che non sia rimasta l'opzione vuota
    if (field.tagName === 'SELECT' && field.hasAttribute('required') && value === '') {
        isValid = false;
        errorMessage = 'Seleziona una voce';
    }

    // Email validation
    if (field.type === 'email' && value !== '' && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Inserisci un indirizzo email valido';
    }

    // Phone validation
    if (field.type === 'tel' && value !== '' && !isValidPhone(value)) {
        isValid = false;
        errorMessage = 'Inserisci un numero di telefono valido';
    }

    if (!isValid) {
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.id = field.id ? field.id + '-error' : '';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.textContent = errorMessage;
        field.setAttribute('aria-describedby', errorDiv.id);
        field.parentNode.appendChild(errorDiv);
    }
    
    return isValid;
}

// Email Validation Helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone Validation Helper
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    
    // Styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    // Type-specific styles
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #2196f3, #1976d2)';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    // Click to dismiss
    notification.addEventListener('click', function() {
        this.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        }, 300);
    });
}

// Utility Functions - Removed duplicate functions (already defined at top of file)

// Lazy Loading for Images (if needed in future)
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    }, { rootMargin: '0px 0px 50px 0px' });
    
    images.forEach(img => imageObserver.observe(img));
}

// Performance Monitoring
// Performance monitoring removed to eliminate deprecated API warnings

// Language Translation System
const translations = {
    it: {
        // Navigation
        'nav-home': 'Home',
        'nav-services': 'Servizi',
        'nav-about': 'Chi Siamo',
        'nav-contact': 'Contatti',
        'nav-quote': 'Preventivo Gratuito',
        'tagline': 'Creatori di Sicurezza',
        'nav-nebbiogeni': 'Nebbiogeni',
        'nav-serramenti': 'Grate e Inferriate',
        'nav-sorveglianza': 'Sorveglianza',
        'nav-allarmi': 'Allarmi',
        'nav-chi-siamo': 'Chi siamo',
        'nav-lavora-con-noi': 'Lavora con noi',
        'nav-contatti': 'Contatti',
        
        // Lavora con noi section
        'lavora-con-noi-title': 'Lavora con Noi',
        'lavora-con-noi-subtitle': 'Unisciti al nostro team di esperti della sicurezza',
        'lavora-con-noi-hero-title': 'Costruisci il Tuo Futuro nella Sicurezza',
        'lavora-con-noi-hero-subtitle': 'Unisciti a FB Total Security e diventa parte di una realtà innovativa nel settore della sicurezza',
        'lavora-con-noi-hero-cta': 'Scopri le Posizioni',
        'posizioni-aperte-title': 'Posizioni Aperte',
        'lavora-con-noi-call-now': 'Chiama Ora',
        'lavora-con-noi-contact-us': 'Contattaci',
        'posizioni-aperte-subtitle': 'Opportunità di carriera nel settore della sicurezza',
        'posizione-agenti-title': 'Agenti di vendita e procacciatori di affari',
        'posizione-agenti-description': '<p>Costruisci il tuo successo in una startup innovativa della sicurezza.</p><p>Sei un agente plurimandatario che non ha paura delle sfide e cerca un\'opportunità per crescere? Unisciti a FB Security Solutions, una realtà emergente nel settore della sicurezza, creata per ridefinire il concetto di consulenza.</p><p>A differenza delle strutture tradizionali, ti offriamo l\'opportunità unica di essere uno dei primi membri del nostro team. Ciò significa non solo lavorare con un portfolio esclusivo di quattro aziende leader del settore, ma anche avere concrete possibilità di carriera e di crescita all\'interno della nostra struttura in espansione.</p><p>Sarai la chiave per offrire ai clienti un servizio su misura, dalla vigilanza armata ai sistemi antifurto e nebbiogeni, dalle grate di sicurezza alle più innovative soluzioni tecnologiche. In cambio, ti offriamo un piano provvigionale molto competitivo e la possibilità di crescere con noi.</p><p>Se sei pronto a mettere la tua esperienza al servizio di un progetto ambizioso, invia la tua candidatura. I primi a credere in noi avranno le opportunità migliori.</p>',
        'posizione-telemarketing-title': 'Personale per attività di telemarketing in smartworking',
        'posizione-telemarketing-description': '<p>Costruisci il tuo successo in una startup innovativa della sicurezza.</p><p>Sei un professionista del telemarketing che non ha paura delle sfide e cerca un\'opportunità per crescere? Unisciti a FB Security Solutions, una realtà emergente nel settore della sicurezza, creata per ridefinire il concetto di consulenza.</p><p>A differenza delle strutture tradizionali, ti offriamo l\'opportunità unica di essere uno dei primi membri del nostro team. Ciò significa non solo lavorare con un portfolio esclusivo di quattro aziende leader del settore, ma anche avere concrete possibilità di carriera e di crescita all\'interno della nostra struttura in espansione.</p><p>Sarai la chiave per offrire ai clienti un servizio su misura, dalla vigilanza armata ai sistemi antifurto e nebbiogeni, dalle grate di sicurezza alle più innovative soluzioni tecnologiche. In cambio, ti offriamo un piano provvigionale molto competitivo e la possibilità di crescere con noi.</p><p>Se sei pronto a mettere la tua esperienza al servizio di un progetto ambizioso, invia la tua candidatura. I primi a credere in noi avranno le opportunità migliori.</p>',
        'posizione-description': 'Costruisci il tuo successo in una startup innovativa della sicurezza. Sei un agente plurimandatario che non ha paura delle sfide e cerca un\'opportunità per crescere? Unisciti a FB Security Solutions, una realtà emergente nel settore della sicurezza, creata per ridefinire il concetto di consulenza. A differenza delle strutture tradizionali, ti offriamo l\'opportunità unica di essere uno dei primi membri del nostro team. Ciò significa non solo lavorare con un portfolio esclusivo di quattro aziende leader del settore, ma anche avere concrete possibilità di carriera e di crescita all\'interno della nostra struttura in espansione. Sarai la chiave per offrire ai clienti un servizio su misura, dalla vigilanza armata ai sistemi antifurto e nebbiogeni, dalle grate di sicurezza alle più innovative soluzioni tecnologiche. In cambio, ti offriamo un piano provvigionale molto competitivo e la possibilità di crescere con noi. Se sei pronto a mettere la tua esperienza al servizio di un progetto ambizioso, invia la tua candidatura. I primi a credere in noi avranno le opportunità migliori.',
        'perche-scegliere-title': 'Perché Scegliere FB Total Security',
        'perche-scegliere-subtitle': 'I vantaggi di lavorare con noi',
        'vantaggio-1-title': 'Startup Innovativa',
        'vantaggio-1-desc': 'Fai parte di una realtà emergente con grandi opportunità di crescita',
        'vantaggio-2-title': 'Portfolio Esclusivo',
        'vantaggio-2-desc': 'Lavora con quattro aziende leader del settore sicurezza',
        'vantaggio-3-title': 'Piano Provvigionale Competitivo',
        'vantaggio-3-desc': 'Guadagni proporzionali ai tuoi risultati con condizioni vantaggiose',
        'vantaggio-4-title': 'Crescita Professionale',
        'vantaggio-4-desc': 'Concrete possibilità di carriera in una struttura in espansione',
        'candidatura-title': 'Invia la Tua Candidatura',
        'candidatura-subtitle': 'Compila il form per candidarti alle nostre posizioni aperte',
        'form-nome': 'Nome e Cognome',
        'form-email': 'Email',
        'form-telefono': 'Telefono',
        'form-posizione': 'Posizione di Interesse',
        'form-messaggio': 'Messaggio (opzionale)',
        'form-cv': 'Carica il tuo CV',
        'form-invia': 'Invia Candidatura',
        'form-privacy': 'Accetto il trattamento dei dati personali secondo la Privacy Policy',
        
        // Hero section
        'hero-tagline': 'La tua sicurezza è la nostra priorità',
        'hero-title': 'Soluzioni di Sicurezza Avanzate per la Tua Protezione',
        'hero-subtitle': 'Sistemi nebbiogeni, grate e inferriate blindate, videosorveglianza e allarmi intelligenti. Proteggi ciò che conta di più con tecnologie all\'avanguardia.',
        'hero-cta': 'Scopri i Nostri Servizi',
        'hero-cta-primary': 'Scopri i Nostri Servizi',
        'hero-cta-secondary': 'Richiedi Preventivo',
        
        // Mission Section
        'mission-title': 'La tua sicurezza, la nostra missione',
        'mission-description': 'In un mondo in continua evoluzione, la protezione dei tuoi beni e dei tuoi cari è una priorità. FB Security nasce con l\'obiettivo di offrirti una tranquillità totale, grazie a un servizio di sicurezza multisettoriale che si adatta a ogni tua esigenza. Dalla vigilanza armata ai sistemi di videosorveglianza più avanzati, dalla protezione fisica di inferriate e grate ai moderni nebbiogeni, ti offriamo una Protezione a 360°. Siamo il tuo partner di fiducia per un\'esistenza sicura, giorno e notte.',
        
        // Services Overview
        'services-title': 'I Nostri Servizi di Sicurezza',
        'services-subtitle': 'Soluzioni complete per ogni esigenza di protezione',
        'service-nebbiogeni-title': 'Sistemi Nebbiogeni',
        'service-nebbiogeni-desc': 'Protezione istantanea con nebbia densa che neutralizza qualsiasi intrusione',
        'service-serramenti-title': 'Grate e Inferriate Blindate',
        'service-serramenti-desc': 'Grate e inferriate ad alta sicurezza certificate per la massima protezione',
        'service-sorveglianza-title': 'Videosorveglianza',
        'service-sorveglianza-desc': 'Sistemi di monitoraggio avanzati con intelligenza artificiale',
        'service-allarmi-title': 'Sistemi di Allarme',
        'service-allarmi-desc': 'Allarmi intelligenti connessi per una protezione 24/7',
        'services-cta': 'Richiedi Consulenza Gratuita',
        'service-nebbiogeni-link': 'Sistemi Nebbiogeni Milano',
        'service-serramenti-link': 'Grate e Inferriate Blindate Milano',
        'service-sorveglianza-link': 'Videosorveglianza Milano',
        'service-allarmi-link': 'Sistemi Allarme Milano',
        
        // Partnership
        'partnership-title': 'I Nostri Partner Tecnologici',
        'partnership-subtitle': 'Collaboriamo con i leader mondiali della sicurezza per offrirti le migliori soluzioni',
        'partnerships-title': 'I Nostri Partner Tecnologici',
        'partnerships-subtitle': 'Collaboriamo con i leader mondiali della sicurezza per offrirti le migliori soluzioni',
        
        // Nebbiogeni Section
        'nebbiogeni-title': 'Sistemi Nebbiogeni Avanzati',
        'nebbiogeni-subtitle': 'Protezione istantanea e invisibile',
        'nebbiogeni-desc': 'I nostri sistemi nebbiogeni rappresentano l\'evoluzione della sicurezza passiva. In caso di intrusione, il sistema rilascia istantaneamente una nebbia densa e sicura che riduce la visibilità a zero, costringendo gli intrusi alla fuga immediata.',
        'nebbiogeni-feature-1': 'Attivazione in 2-3 secondi',
        'nebbiogeni-feature-2': 'Nebbia sicura e atossica',
        'nebbiogeni-feature-3': 'Copertura fino a 500m²',
        'nebbiogeni-feature-4': 'Integrazione con sistemi esistenti',
        'nebbiogeni-cta': 'Scopri i Sistemi Nebbiogeni',
        
        // Grate e Inferriate Section
        'serramenti-title': 'Grate e Inferriate Blindate di Sicurezza',
        'serramenti-subtitle': 'Protezione fisica massima',
        'serramenti-desc': 'Grate e inferriate blindate certificate secondo le normative europee più severe. Ogni prodotto è progettato su misura per garantire il massimo livello di protezione senza compromettere l\'estetica della tua abitazione.',
        'serramenti-feature-1': 'Antieffrazione fino a Classe 6 (UNI EN 1627-1630)',
        'serramenti-feature-2': 'Produzione interna (ciclo chiuso)',
        'serramenti-feature-3': 'Personalizzabile (su misura, varie classi e modelli)',
        'serramenti-feature-4': 'Installazione senza opere murarie',
        'serramenti-feature-5': 'Certificazione ISO 9001:2015',
        'serramenti-feature-6': 'Design moderno (finiture, colori, forme speciali)',
        'serramenti-feature-7': 'Serrature a cilindro europeo o doppia mappa',
        'serramenti-feature-8': 'Sistemi brevettati',
        'serramenti-feature-9': 'Struttura blindata (acciaio, tubolari rinforzati, piatti antitaglio)',
        'serramenti-feature-10': 'Anti-corrosione (verniciatura a forno e primer)',
        'serramenti-feature-11': 'Sopralluogo e consulenza dedicata',
        'serramenti-feature-12': 'Assistenza tecnica',
        'serramenti-feature-13': 'Supporto post-vendita',
        'serramenti-cta': 'Configura le Tue Grate e Inferriate',
        
        // Sorveglianza Section
        'sorveglianza-title': 'Sistemi di Videosorveglianza Avanzati',
        'sorveglianza-subtitle': 'Occhi intelligenti che non dormono mai',
        'sorveglianza-desc': 'Telecamere di ultima generazione con intelligenza artificiale integrata per il riconoscimento automatico di situazioni anomale. Monitoraggio remoto 24/7 con notifiche istantanee su smartphone.',
        'sorveglianza-feature-1': 'Videosorveglianza e videoanalisi intelligente',
        'sorveglianza-feature-2': 'Controllo remoto da app e centrale operativa',
        'sorveglianza-feature-3': 'Gestione eventi con blockchain',
        'sorveglianza-feature-4': 'Intervento rapido e pattuglie armate',
        'sorveglianza-feature-5': 'Servizio 24h/365',
        'sorveglianza-feature-6': 'Antimanomissione',
        'sorveglianza-feature-7': 'Antirapina/antipanico',
        'sorveglianza-feature-8': 'Collegabile al 112 (ops. pubbliche)',
        'sorveglianza-feature-9': 'Telesoccorso',
        'sorveglianza-feature-10': 'Sistemi antijammer',
        'sorveglianza-feature-11': 'Modulare su richiesta cliente',
        'sorveglianza-feature-12': 'Supporto e assistenza h24',
        'sorveglianza-feature-13': 'Consulenza sicurezza personalizzata',
        'sorveglianza-cta': 'Progetta il Tuo Sistema',
        
        // Allarmi Section
        'allarmi-title': 'Sistemi di Allarme Intelligenti',
        'allarmi-subtitle': 'Protezione smart e connessa',
        'allarmi-desc': 'Centrali di allarme di nuova generazione con sensori wireless e connettività IoT. Controllo completo tramite app mobile con notifiche push istantanee e integrazione con servizi di vigilanza.',
        'allarmi-feature-1': 'Protezione volumetrica e perimetrale avanzata',
        'allarmi-feature-2': 'Controllo ingressi con sensore predinamico',
        'allarmi-feature-3': 'Sistema antiaggressione e antipanico integrato',
        'allarmi-feature-4': 'Modem GSM con APP dedicata e sintesi vocale',
        'allarmi-feature-5': 'Collegamento diretto al 112 e telesoccorso',
        'allarmi-feature-6': 'Sistema antijammer e antimanomissione',
        'allarmi-feature-7': 'Modulabile e trasferibile secondo necessità',
        'allarmi-cta': 'Personalizza il Tuo Allarme',
        
        // Nebbiogeni Page Translations
        'nebbiogeni-hero-subtitle': 'Protezione istantanea con nebulizzazione di sicurezza. Blocca i ladri in pochi secondi con la tecnologia più avanzata.',
        'nebbiogeni-hero-cta1': 'Scopri di Più',
        'nebbiogeni-hero-cta2': 'Richiedi Preventivo',
        'nebbiogeni-tech-title': 'Tecnologia Nebbiogeni Avanzata',
        'nebbiogeni-tech-description': 'I nostri sistemi nebbiogeni rappresentano la frontiera più avanzata nella protezione antifurto. In caso di intrusione, il sistema rilascia istantaneamente una densa nebbia che riduce la visibilità a zero, costringendo i malintenzionati ad abbandonare immediatamente i locali.',
        'nebbiogeni-feature-1': 'Nebbiogeno antintrusione certificato EN 50131-8:2019',
        'nebbiogeni-feature-2': 'Avvio rapido (erogazione nebbia in pochi secondi)',
        'nebbiogeni-feature-3': 'Protezione volumetrica',
        'nebbiogeni-feature-4': 'Fluido atossico e innocuo (certificato e senza residui)',
        'nebbiogeni-feature-5': 'Sistemi antimanomissione',
        'nebbiogeni-feature-6': 'Manutenzione programmata inclusa',
        'nebbiogeni-feature-7': 'Certificazioni CE e conformità normative',
        'nebbiogeni-feature-8': 'Garanzia estesa fino a 2 anni',
        'nebbiogeni-feature-9': 'Modulabile per piccoli/grandi ambienti',
        'nebbiogeni-feature-10': 'Ugelli orientabili',
        'nebbiogeni-feature-11': 'Installazione semplificata',
        'nebbiogeni-feature-12': 'Tecnologia brevettata (caldaia layer, pompa FOG STORM)',
        'nebbiogeni-feature-13': 'Supporto pre e post-vendita',
        'nebbiogeni-cta-vantaggi': 'Vantaggi',
        'nebbiogeni-cta-preventivo': 'Preventivo Gratuito',
        'nebbiogeni-why-title': 'Perché Scegliere i Nebbiogeni',
        'nebbiogeni-why-subtitle': 'La soluzione più efficace per proteggere la tua attività',
        'nebbiogeni-advantage-1-title': 'Attivazione Istantanea',
        'nebbiogeni-advantage-1-desc': 'Il sistema si attiva in meno di 10 secondi, creando immediatamente una barriera impenetrabile di nebbia densa.',
        'nebbiogeni-advantage-2-title': 'Protezione Totale',
        'nebbiogeni-advantage-2-desc': 'Riduce la visibilità a zero rendendo impossibile per i ladri orientarsi e portare a termine il furto.',
        'nebbiogeni-advantage-3-title': 'Completamente Sicuro',
        'nebbiogeni-advantage-3-desc': 'La nebbia è atossica, non danneggia persone, animali o oggetti. Certificata per uso in ambienti chiusi.',
        'nebbiogeni-advantage-4-title': 'Controllo Remoto',
        'nebbiogeni-advantage-4-desc': 'Gestisci il sistema da remoto tramite app dedicata. Ricevi notifiche in tempo reale.',
        'nebbiogeni-advantage-5-title': 'Manutenzione Inclusa',
        'nebbiogeni-advantage-5-desc': 'Servizio di manutenzione programmata e assistenza tecnica 24/7 per garantire sempre il massimo funzionamento.',
        'nebbiogeni-advantage-6-title': 'Risparmio Assicurativo',
        'nebbiogeni-advantage-6-desc': 'Molte compagnie assicurative riconoscono sconti significativi per immobili protetti da sistemi nebbiogeni.',
        'urfog-official-docs-title': 'Documentazione Ufficiale UR FOG',
        'urfog-official-docs-desc': 'Accedi alla documentazione tecnica completa e alle specifiche dei sistemi UR FOG',
        'urfog-cert-btn-title': 'Certificazioni UR FOG',
        'urfog-cert-btn-desc': 'Visualizza tutte le certificazioni e conformità normative dei prodotti UR FOG',
        'urfog-warranty-btn-title': 'Garanzie UR FOG',
        'urfog-warranty-btn-desc': 'Informazioni complete sulla garanzia e assistenza post-vendita UR FOG',
        'xecur-official-docs-title': 'Documentazione Ufficiale XECUR',
        'xecur-official-docs-desc': 'Accedi alla documentazione tecnica completa e alle specifiche dei sistemi XECUR',
        'xecur-cert-btn-title': 'Certificazioni XECUR',
        'xecur-cert-btn-desc': 'Visualizza tutte le certificazioni e la conformità normativa dei prodotti XECUR',
        'xecur-quality-btn-title': 'Qualità XECUR',
        'xecur-quality-btn-desc': 'Informazioni complete sui standard di qualità e l\'eccellenza XECUR',
        'civis-official-docs-title': 'Documentazione Ufficiale CIVIS',
        'civis-official-docs-desc': 'Accedi alla documentazione tecnica completa e alle specifiche dei sistemi CIVIS',
        'civis-cert-btn-title': 'Certificazioni CIVIS',
        'civis-cert-btn-desc': 'Visualizza tutte le certificazioni e la conformità normativa dei prodotti CIVIS',
        'nebbiogeni-applications-title': 'Applicazioni Ideali',
        'nebbiogeni-applications-description': 'I sistemi nebbiogeni sono la soluzione perfetta per una vasta gamma di ambienti commerciali e residenziali che richiedono il massimo livello di protezione.',
        'nebbiogeni-app-1': 'Negozi e centri commerciali',
        'nebbiogeni-app-2': 'Gioiellerie e oreficerie',
        'nebbiogeni-app-3': 'Banche e istituti di credito',
        'nebbiogeni-app-4': 'Farmacie e parafarmacie',
        'nebbiogeni-app-5': 'Uffici e studi professionali',
        'nebbiogeni-app-6': 'Magazzini e depositi',
        'nebbiogeni-app-7': 'Abitazioni di pregio',
        'nebbiogeni-app-8': 'Musei e gallerie d\'arte',
        'nebbiogeni-cta-consulenza': 'Richiedi Consulenza',
        'nebbiogeni-cta-servizi': 'Altri Servizi',
        'nebbiogeni-partner-title': 'Il Nostro Partner: UR Fog',
        'nebbiogeni-partner-info-title': 'Informazioni Generali',
        'nebbiogeni-partner-info-desc': 'UR Fog è un\'azienda leader mondiale nel mercato dei sistemi di sicurezza nebbiogeni. I loro sistemi bloccano i ladri in pochi secondi, proteggendo da furti in negozi, aziende, case e banche.',
        'nebbiogeni-partner-services-title': 'Servizi e Innovazione',
        'nebbiogeni-contact-title': 'Richiedi Informazioni',
        'nebbiogeni-contact-description': 'Contattaci per una consulenza completamente gratuita sui sistemi nebbiogeni. I nostri esperti valuteranno le tue esigenze e ti proporranno la soluzione più adatta. Verrai ricontattato telefonicamente da uno dei nostri operatori il più presto possibile.',
        
        // Grate e Inferriate BlindatePage
        'serramenti-hero-title': 'Grate e Inferriate Blindate',
        'serramenti-hero-subtitle': 'Grate e inferriate blindate di ultima generazione per porte e finestre. Protezione fisica massima con fissaggio senza opere murarie per la tua casa e il tuo ufficio.',
        'serramenti-hero-cta1': 'Scopri di Più',
        'serramenti-hero-cta2': 'Richiedi Preventivo',
        'serramenti-products-title': 'Prodotti Principali',
        'serramenti-products-description': 'La nostra gamma completa di grate e inferriate blindate combina sicurezza massima e design raffinato, con soluzioni personalizzate per ogni esigenza abitativa e commerciale.',
        'serramenti-product-1-title': 'Grate e Inferriate Residenziali',
        'serramenti-product-1-desc': 'Grate e Inferriate certificate classe 3 e 4 con design personalizzabile per abitazioni private.',
        'serramenti-product-2-title': 'Finestre Antieffrazione',
        'serramenti-product-2-desc': 'Finestre con vetri stratificati e telai rinforzati per protezione totale.',
        'serramenti-product-3-title': 'Grate e Inferriate Blindate Commerciali',
        'serramenti-product-3-desc': 'Soluzioni professionali per negozi, uffici e attività commerciali.',
        'serramenti-tech-title': 'Caratteristiche Tecniche',
        'serramenti-tech-description': 'Ogni serramento è progettato secondo i più alti standard di sicurezza europei, utilizzando materiali di prima qualità e tecnologie all\'avanguardia.',
        'serramenti-tech-1': 'Certificazione antieffrazione classe 4',
        'serramenti-tech-2': 'Serrature europee multipoint',
        'serramenti-tech-3': 'Vetri antisfondamento stratificati',
        'serramenti-tech-4': 'Telai in acciaio rinforzato',
        'serramenti-tech-5': 'Guarnizioni termoacustiche',
        'serramenti-tech-6': 'Cerniere antisollevamento',
        'serramenti-tech-7': 'Defender e rostri di sicurezza',
        'serramenti-tech-8': 'Pannelli coibentati',
        'serramenti-types-title': 'Tipologie di Grate e Inferriate',
        'serramenti-types-description': 'Offriamo una gamma completa di grate e inferriate blindate per soddisfare ogni esigenza di protezione, dal residenziale al commerciale, senza opere murarie.',
        'serramenti-type-1': 'Grate per porte di abitazioni',
        'serramenti-type-2': 'Grate per porte di uffici',
        'serramenti-type-3': 'Inferriate per finestre',
        'serramenti-type-4': 'Grate scorrevoli',
        'serramenti-type-5': 'Grate di sicurezza Alice VI',
        'serramenti-type-6': 'Grate avvolgibili rinforzate',
        'serramenti-type-7': 'Grate per porte tagliafuoco',
        'serramenti-type-8': 'Grate per controllo accessi',
        'serramenti-installation-title': 'Processo di Installazione',
        'serramenti-installation-description': 'Il nostro processo di installazione garantisce precisione millimetrica e rispetto dei tempi, con un servizio completo dalla progettazione al collaudo finale.',
        'serramenti-install-1': 'Sopralluogo e progettazione personalizzata',
        'serramenti-install-2': 'Produzione su misura in fabbrica',
        'serramenti-install-3': 'Installazione professionale certificata',
        'serramenti-install-4': 'Collaudo finale e garanzia',
        'serramenti-cta-consulenza': 'Richiedi Consulenza',
        'serramenti-cta-catalogo': 'Scarica Catalogo',
        'serramenti-partner-title': 'Il Nostro Partner: Xecur Srl',
        'serramenti-partner-info-title': 'Informazioni Generali',
        'serramenti-partner-info-desc': 'Xecur Srl è un\'azienda leader nella produzione di grate e inferriate blindate e sistemi di sicurezza passiva. Con oltre 30 anni di esperienza, garantisce prodotti di altissima qualità certificati secondo le normative europee più severe.',
        'serramenti-partner-services-title': 'Servizi e Innovazioni',
        'serramenti-partner-service-1': 'Progettazione e produzione su misura',
        'serramenti-partner-service-2': 'Certificazioni antieffrazione classe 1-6',
        'serramenti-partner-service-3': 'Ricerca e sviluppo continuo',
        'serramenti-partner-service-4': 'Assistenza tecnica specializzata',
        'serramenti-partner-service-5': 'Garanzia estesa su tutti i prodotti',
        'serramenti-contact-title': 'Richiedi Informazioni',
        'serramenti-contact-description': 'Contattaci per una consulenza completamente gratuita sui grate e inferriate blindate. I nostri esperti valuteranno le tue esigenze e ti proporranno la soluzione più adatta. Verrai ricontattato telefonicamente da uno dei nostri operatori il più presto possibile.',
        'serramenti-form-name': 'Nome e Cognome',
        'serramenti-form-email': 'Email',
        'serramenti-form-phone': 'Telefono',
        'serramenti-form-message': 'Messaggio',
        'serramenti-form-privacy': 'Accetto il trattamento dei dati personali secondo i',
        'serramenti-form-submit': 'Invia Richiesta',
        
        // Sorveglianza Page
        'sorveglianza-hero-title': 'Sistemi di Videosorveglianza Avanzati',
        'sorveglianza-hero-subtitle': 'Protezione intelligente 24/7 con tecnologie di ultima generazione. Monitora e proteggi i tuoi spazi con sistemi di videosorveglianza all\'avanguardia.',
        'sorveglianza-hero-cta1': 'Scopri di Più',
        'sorveglianza-hero-cta2': 'Richiedi Preventivo',
        'sorveglianza-tech-title': 'Tecnologie Avanzate di Sorveglianza',
        'sorveglianza-tech-description': 'I nostri sistemi di videosorveglianza integrano le più moderne tecnologie di intelligenza artificiale e visione computerizzata per offrire una protezione completa e intelligente dei tuoi spazi.',
        'sorveglianza-tech-feature-1': 'Telecamere 4K Ultra HD con zoom ottico',
        'sorveglianza-tech-feature-2': 'Visione notturna avanzata fino a 50 metri',
        'sorveglianza-tech-feature-3': 'Riconoscimento facciale e targhe automatico',
        'sorveglianza-tech-feature-4': 'Analisi comportamentale con AI integrata',
        'sorveglianza-tech-feature-5': 'Storage cloud sicuro e backup automatico',
        'sorveglianza-tech-feature-6': 'Accesso remoto da smartphone e tablet',
        'sorveglianza-tech-cta1': 'Vantaggi',
        'sorveglianza-tech-cta2': 'Preventivo Gratuito',
        'sorveglianza-features-title': 'Caratteristiche Avanzate',
        'sorveglianza-features-subtitle': 'Tecnologie all\'avanguardia per la massima sicurezza',
        'sorveglianza-feature-1-title': 'Risoluzione 4K',
        'sorveglianza-feature-1-desc': 'Immagini cristalline in alta definizione per ogni dettaglio',
        'sorveglianza-feature-2-title': 'Visione Notturna',
        'sorveglianza-feature-2-desc': 'Monitoraggio efficace anche in condizioni di scarsa illuminazione',
        'sorveglianza-feature-3-title': 'Intelligenza Artificiale',
        'sorveglianza-feature-3-desc': 'Riconoscimento automatico di persone, veicoli e comportamenti anomali',
        'sorveglianza-feature-4-title': 'Cloud Storage',
        'sorveglianza-feature-4-desc': 'Archiviazione sicura nel cloud con accesso da qualsiasi dispositivo',
        'sorveglianza-systems-title': 'Tipologie di Sistemi',
        'sorveglianza-systems-description': 'Offriamo diverse soluzioni di videosorveglianza per adattarsi a ogni esigenza specifica, dalla protezione residenziale ai complessi sistemi industriali.',
        'sorveglianza-systems-feature-1': 'Sistemi IP di ultima generazione',
        'sorveglianza-systems-feature-2': 'Telecamere dome e bullet professionali',
        'sorveglianza-systems-feature-3': 'Integrazione con sistemi di allarme esistenti',
        'sorveglianza-systems-feature-4': 'Controllo accessi integrato',
        'sorveglianza-systems-feature-5': 'Monitoraggio perimetrale avanzato',
        'sorveglianza-systems-cta1': 'Scopri le Tipologie',
        'sorveglianza-systems-cta2': 'Richiedi Consulenza',
        'sorveglianza-advantages-title': 'Vantaggi della Videosorveglianza',
        'sorveglianza-advantages-subtitle': 'Protezione completa per la tua tranquillità',
        'sorveglianza-advantage-1-title': 'Deterrente Visivo',
        'sorveglianza-advantage-1-desc': 'La presenza visibile delle telecamere scoraggia i malintenzionati',
        'sorveglianza-advantage-2-title': 'Monitoraggio Remoto',
        'sorveglianza-advantage-2-desc': 'Controlla i tuoi spazi da qualsiasi luogo tramite smartphone',
        'sorveglianza-advantage-3-title': 'Prove Legali',
        'sorveglianza-advantage-3-desc': 'Registrazioni ad alta qualità utilizzabili come prove legali',
        'sorveglianza-advantage-4-title': 'Notifiche Istantanee',
        'sorveglianza-advantage-4-desc': 'Avvisi in tempo reale per eventi sospetti o allarmi',
        'sorveglianza-installation-title': 'Installazione Professionale',
        'sorveglianza-installation-description': 'Il nostro team di tecnici specializzati garantisce un\'installazione professionale e una configurazione ottimale del sistema di videosorveglianza.',
        'sorveglianza-installation-feature-1': 'Sopralluogo gratuito e progettazione personalizzata',
        'sorveglianza-installation-feature-2': 'Installazione certificata da tecnici qualificati',
        'sorveglianza-installation-feature-3': 'Configurazione e test completi del sistema',
        'sorveglianza-installation-feature-4': 'Formazione sull\'utilizzo e manutenzione',
        'sorveglianza-installation-cta1': 'Prenota Sopralluogo',
        'sorveglianza-partner-title': 'I Nostri Partner Tecnologici',
        'sorveglianza-partner-description': 'Collaboriamo con leader nel settore della videosorveglianza professionale, per garantire prodotti di altissima qualità e tecnologie all\'avanguardia.',
        'sorveglianza-partner-service-1': 'Sistemi di videosorveglianza IP avanzati',
        'sorveglianza-partner-service-2': 'Telecamere con intelligenza artificiale integrata',
        'sorveglianza-partner-service-3': 'Software di gestione professionale',
        'sorveglianza-partner-service-4': 'Supporto tecnico specializzato 24/7',
        'sorveglianza-partner-service-5': 'Garanzia estesa su tutti i prodotti',
        'sorveglianza-contact-title': 'Richiedi Informazioni',
        'sorveglianza-contact-description': 'Contattaci per una consulenza completamente gratuita sui sistemi di videosorveglianza. I nostri esperti valuteranno le tue esigenze e ti proporranno la soluzione più adatta. Verrai ricontattato telefonicamente da uno dei nostri operatori il più presto possibile.',
        'sorveglianza-form-name': 'Nome e Cognome',
        'sorveglianza-form-email': 'Email',
        'sorveglianza-form-phone': 'Telefono',
        'sorveglianza-form-message': 'Messaggio',
        'sorveglianza-form-privacy': 'Accetto il trattamento dei dati personali secondo la',
        'sorveglianza-form-submit': 'Invia Richiesta',
        
        // Why Choose Section
        'why-choose-title': 'Perché Scegliere FB Total Security',
        'why-choose-subtitle': 'La tua sicurezza è la nostra priorità assoluta',
        'why-choose-feature-1': 'Esperienza ventennale nel settore della sicurezza',
        'why-choose-feature-2': 'Tecnologie certificate e all\'avanguardia',
        'why-choose-feature-3': 'Assistenza tecnica specializzata 24/7',
        'why-choose-feature-4': 'Garanzia totale su tutti i prodotti installati',
        'feature-experience-title': 'Anni di Esperienza Multisettoriale',
        'feature-experience-desc': 'Oltre 20 anni nel settore sicurezza con migliaia di installazioni completate',
        'feature-certifications-title': 'Certificazioni Professionali',
        'feature-certifications-desc': 'Tecnici certificati e aggiornati sulle ultime tecnologie di sicurezza',
        'feature-support-title': 'Assistenza 24/7',
        'feature-support-desc': 'Supporto tecnico continuo e interventi rapidi per garantire sempre la tua protezione',
        
        // Client Solutions Section
        'client-solutions-title': 'Soluzioni su Misura per Ogni Esigenza',
        'client-solutions-subtitle': 'Dalla residenza privata all\'azienda, progettiamo la sicurezza perfetta per te',
        'client-residential': 'Clienti Residenziali',
        'client-residential-desc': 'Proteggi la tua famiglia e la tua casa con sistemi di sicurezza discreti ed efficaci',
        'client-residential-feature-1': 'Sistemi integrati invisibili',
        'client-residential-feature-2': 'Controllo da smartphone',
        'client-residential-feature-3': 'Installazione non invasiva',
        'client-commercial': 'Clienti Commerciali',
        'client-commercial-desc': 'Soluzioni professionali per uffici, negozi e attività commerciali',
        'client-commercial-feature-1': 'Monitoraggio multi-sede',
        'client-commercial-feature-2': 'Reportistica avanzata',
        'client-commercial-feature-3': 'Integrazione gestionale',
        'client-industrial': 'Clienti Industriali',
        'client-industrial-desc': 'Protezione perimetrale e controllo accessi per impianti e magazzini',
        'client-industrial-feature-1': 'Protezione perimetrale',
        'client-industrial-feature-2': 'Controllo accessi biometrico',
        'client-industrial-feature-3': 'Sistemi anti-intrusione',
        'client-solutions-cta': 'Richiedi Consulenza Personalizzata',
        
        // Contact Section
        'contact-title': 'Contatta FB Total Security',
        'contact-subtitle': 'Richiedi una consulenza completamente gratuita per valutare le tue esigenze di sicurezza. Sopralluogo e preventivo senza impegno. Verrai ricontattato telefonicamente da uno dei nostri operatori il più presto possibile.',
        'form-contact-description': 'Richiedi una consulenza completamente gratuita per valutare le tue esigenze di sicurezza. Sopralluogo e preventivo senza impegno. Verrai ricontattato telefonicamente da uno dei nostri operatori il più presto possibile.',
        'contact-phone-label': 'Telefono',
        'contact-email-label': 'Email',
        'contact-area-label': 'Zona di Servizio',
        'contact-area-text': 'Tutta Italia',
        'contact-name': 'Nome e Cognome',
        'contact-email': 'Email',

        'contact-service': 'Servizio di Interesse',
        'contact-service-option-1': 'Sistema Nebbiogeni',
        'contact-service-option-2': 'Grate e Inferriate Blindate',
        'contact-service-option-3': 'Videosorveglianza',
        'contact-service-option-4': 'Sistemi di Allarme',
        'contact-service-option-5': 'Consulenza Generale',
        'contact-message': 'Messaggio',
        'contact-privacy': 'Accetto il trattamento dei dati personali secondo la',
        'contact-privacy-link': 'Privacy Policy',
        'contact-submit': 'Invia Richiesta',
        
        // Contact Form
        'form-title': 'Richiedi Informazioni',
        'form-name-label': 'Nome e Cognome',
        'form-email-label': 'Email',
        'form-phone-label': 'Telefono',
        'form-message-label': 'Messaggio',
        'form-name-placeholder': 'Nome e Cognome',
        'form-email-placeholder': 'Email',

        'form-service-label': 'Servizio di interesse',
        'form-service-default': 'Seleziona il servizio di interesse',
        'form-service-nebbiogeni': 'Sistemi Nebbiogeni',
        'form-service-serramenti': 'Grate e Inferriate di Sicurezza',
        'form-service-sorveglianza': 'Videosorveglianza',
        'form-service-allarmi': 'Sistemi di Allarme',
        'form-service-consulenza': 'Consulenza Generale',
        'form-message-placeholder': 'Descrivi le tue esigenze di sicurezza',
        'form-privacy-label': 'Accetto il trattamento dei dati personali secondo i <a href="termini-condizioni.html" target="_blank" style="color: #4caf50; text-decoration: underline;">Termini e Condizioni</a>',
        'form-submit-btn': 'Invia Richiesta',
        
        // Footer
        'footer-description': 'Creatori di sicurezza specializzati in sistemi di protezione avanzati. La tua sicurezza è la nostra priorità.',
        'footer-services-title': 'Servizi',
        'footer-service-nebbiogeni': 'Sistemi Nebbiogeni',
        'footer-service-serramenti': 'Grate e Inferriate Blindate',
        'footer-service-sorveglianza': 'Videosorveglianza',
        'footer-service-allarmi': 'Sistemi di Allarme',
        'footer-contacts-title': 'Contatti',
        'footer-info-title': 'Informazioni',
        'footer-social-title': 'Seguici su',
        'footer-copyright': '© 2025 FB Total Security. Tutti i diritti riservati. | P.IVA: 12345678901',
        'footer-created-by': 'Creato e curato da WebNovis',
        'footer-webnovis-contact': 'Per una soluzione cucita su misura per te',
        'footer-webnovis-btn': 'contatta WebNovis',
        'footer-company': 'FB Total Security',
        'footer-company-desc': 'Creatori di sicurezza dal 2003. Specializzati in sistemi di protezione avanzati per aziende e privati.',
        'footer-services': 'Servizi',
        'footer-company-info': 'Azienda',
        'footer-contact': 'Contatti',
        
        // Allarmi page
        'allarmi-hero-title': 'Sistemi di Allarme Intelligenti',
        'allarmi-hero-subtitle': 'Protezione smart e connessa con tecnologie di ultima generazione. Controlla e monitora i tuoi spazi con sistemi di allarme avanzati.',
        'allarmi-hero-cta1': 'Scopri di Più',
        'allarmi-hero-cta2': 'Richiedi Preventivo',
        'allarmi-components-title': 'Componenti del Sistema',
        'allarmi-components-description': 'I nostri sistemi di allarme integrano i componenti più avanzati per offrire una protezione completa e affidabile dei tuoi spazi.',
        'allarmi-components-feature-1': 'Sensori wireless con tecnologia long-range',
        'allarmi-components-feature-2': 'Centrali di controllo con display touch',
        'allarmi-components-feature-3': 'Rilevatori di movimento con immunità animali',
        'allarmi-components-feature-4': 'Contatti magnetici per porte e finestre',
        'allarmi-components-feature-5': 'Rilevatori rottura vetro con doppia tecnologia',
        'allarmi-components-feature-6': 'Sirene esterne con anti-manomissione',
        'allarmi-components-cta1': 'Componenti',
        'allarmi-components-cta2': 'Preventivo Gratuito',
        'allarmi-tech-title': 'Tecnologie Avanzate',
        'allarmi-tech-subtitle': 'L\'innovazione al servizio della tua sicurezza',
        'allarmi-tech-feature-1-title': 'Tecnologia Wireless',
        'allarmi-tech-feature-1-desc': 'Sensori wireless con comunicazione criptata e lunga durata della batteria',
        'allarmi-tech-feature-2-title': 'App Mobile',
        'allarmi-tech-feature-2-desc': 'Controllo completo tramite smartphone con notifiche in tempo reale',
        'allarmi-tech-feature-3-title': 'Intelligenza Artificiale',
        'allarmi-tech-feature-3-desc': 'Algoritmi intelligenti per ridurre i falsi allarmi e migliorare la rilevazione',
        'allarmi-tech-feature-4-title': 'Integrazione Cloud',
        'allarmi-tech-feature-4-desc': 'Archiviazione cloud sicura e accesso remoto da qualsiasi dispositivo',
        'allarmi-systems-title': 'Tipologie di Sistemi',
        'allarmi-systems-description': 'Offriamo diverse soluzioni di allarme per adattarci ad ogni esigenza specifica, dalla protezione residenziale ai sistemi commerciali complessi.',
        'allarmi-systems-feature-1': 'Sistemi wireless con comunicazione criptata',
        'allarmi-systems-feature-2': 'Sistemi ibridi con sensori cablati e wireless',
        'allarmi-systems-feature-3': 'Integrazione con sistemi di videosorveglianza',
        'allarmi-systems-feature-4': 'Collegamento a centrali di monitoraggio 24/7',
        'allarmi-systems-feature-5': 'Integrazione domotica',
        'allarmi-systems-cta1': 'Scopri Tipologie',
        'allarmi-systems-cta2': 'Richiedi Consulenza',
        'allarmi-advantages-title': 'Vantaggi dei Nostri Sistemi',
        'allarmi-advantages-subtitle': 'Protezione completa per la tua tranquillità',
        'allarmi-advantage-1-title': 'Rilevazione Istantanea',
        'allarmi-advantage-1-desc': 'Rilevazione immediata delle intrusioni con notifiche istantanee',
        'allarmi-advantage-2-title': 'Controllo Remoto',
        'allarmi-advantage-2-desc': 'Attiva e disattiva il sistema da qualsiasi luogo tramite smartphone',
        'allarmi-advantage-3-title': 'Notifiche Intelligenti',
        'allarmi-advantage-3-desc': 'Avvisi in tempo reale con foto e video degli eventi rilevati',
        'allarmi-advantage-4-title': 'Monitoraggio H24',
        'allarmi-advantage-4-desc': 'Collegamento a centrali di monitoraggio professionali per intervento immediato',
        'allarmi-installation-title': 'Processo di Installazione',
        'allarmi-installation-description': 'Il nostro team di tecnici specializzati garantisce un\'installazione professionale e una configurazione ottimale del sistema di allarme.',
        'allarmi-installation-feature-1': 'Sopralluogo gratuito e analisi della sicurezza',
        'allarmi-installation-feature-2': 'Installazione certificata da tecnici qualificati',
        'allarmi-installation-feature-3': 'Configurazione completa e test del sistema',
        'allarmi-installation-feature-4': 'Formazione sull\'uso e app mobile',
        'allarmi-installation-cta1': 'Prenota Sopralluogo',
        'allarmi-partner-title': 'Partner Gruppo ITL',
        'allarmi-partner-description': 'Collaboriamo con Gruppo ITL, leader nel settore della sicurezza professionale, per garantire prodotti di altissima qualità e tecnologie all\'avanguardia.',
        'allarmi-partner-service-1': 'Sistemi di allarme wireless avanzati',
        'allarmi-partner-service-2': 'Centrali di monitoraggio professionali',
        'allarmi-partner-service-3': 'Applicazioni mobile e piattaforme cloud',
        'allarmi-partner-service-4': 'Assistenza tecnica specializzata 24/7',
        'allarmi-partner-service-5': 'Garanzia estesa su tutti i prodotti',
        'allarmi-contact-title': 'Richiedi Informazioni',
        'allarmi-contact-description': 'Contattaci per una consulenza completamente gratuita sui sistemi di allarme. I nostri esperti valuteranno le tue esigenze e ti proporranno la soluzione più adatta. Verrai ricontattato telefonicamente da uno dei nostri operatori il più presto possibile.',
        'allarmi-partner-feature-5': 'Soluzioni Personalizzate',
        'allarmi-partnership-title': 'Partnership Premium',
        'allarmi-partnership-desc': 'Collaboriamo con i leader del settore per offrirti le migliori soluzioni di sicurezza',
        'allarmi-partner-name': 'ITL Group',
        'allarmi-partner-desc': 'Sistemi di allarme Blue Lock con controllo wireless e installazione senza opere murarie. Sensori predinamici esclusivi con protezione fino a 500mq su più livelli. App di gestione per smartphone, connettività diretta a Forze dell\'Ordine, tecnologia di discriminazione automatica tra falsi allarmi e minacce reali. Servizio di videosorveglianza Overlook integrato. <strong>Garanzia standard 24 mesi</strong>, estendibile a vita con manutenzione annuale "Protetti & Sicuri".',
        'allarmi-partner-feature-1': 'Controllo Wireless',
        'allarmi-partner-feature-2': 'Sensori Predinamici',
        'allarmi-partner-feature-3': 'Protezione 500mq',
        'allarmi-partner-feature-4': 'App Smartphone',
        'allarmi-partner-feature-5': 'Overlook Integrato',
        'allarmi-partner-feature-6': 'Garanzia Estendibile a Vita',
        'allarmi-certifications-title': 'Certificazioni e Garanzie',
        'allarmi-cert-1-title': 'Conformità Normative',
        'allarmi-cert-1-desc': 'Italia ed Europa',
        'allarmi-cert-2-title': 'Sensore Predinamico',
        'allarmi-cert-2-desc': 'Brevettato Integrato',
        'allarmi-cert-3-title': 'Garanzia 24 Mesi',
        'allarmi-cert-3-desc': 'Estendibile a Vita',
        'allarmi-cert-4-title': 'Protetti & Sicuri',
        'allarmi-cert-4-desc': 'Approccio Completo',
        
        // Tecnologie allarmi
        'allarmi-tech-1-title': 'Wireless Avanzato',
        'allarmi-tech-1-desc': 'Comunicazione wireless bidirezionale con crittografia avanzata per massima sicurezza e affidabilità.',
        'allarmi-tech-2-title': 'Batterie Long-Life',
        'allarmi-tech-2-desc': 'Batterie al litio con durata fino a 5 anni e notifiche automatiche per sostituzione.',
        'allarmi-tech-3-title': 'Controllo Internet',
        'allarmi-tech-3-desc': 'Gestione completa via internet con notifiche push e controllo da qualsiasi parte del mondo.',
        'allarmi-tech-4-title': 'Anti-Sabotaggio',
        'allarmi-tech-4-desc': 'Protezione anti-manomissione su tutti i componenti con segnalazione immediata di tentativi.',
        'allarmi-tech-5-title': 'Backup Energetico',
        'allarmi-tech-5-desc': 'Batterie di backup integrate per funzionamento continuo anche in caso di blackout 24 ore su 24',
        'allarmi-tech-6-title': 'Rilevamento Preciso',
        'allarmi-tech-6-desc': 'Sensori con tecnologia pet-immune per evitare falsi allarmi causati da animali domestici.',
        'allarmi-types-title': 'Tipologie di Sistemi',
        'allarmi-types-description': 'Soluzioni personalizzate per ogni esigenza di sicurezza, dalla protezione residenziale ai sistemi commerciali avanzati.',
        'allarmi-type-1': 'Sistema volumetrico con rilevamento movimento',
        'allarmi-type-2': 'Protezione perimetrale avanzata',
        'allarmi-type-3': 'Controllo ingressi con tecnologia predinamica',
        'allarmi-type-4': 'Protezione personale e antiaggressione',
        'allarmi-type-5': 'Sistema antipanico con collegamento 112',
        'allarmi-type-6': 'Comunicazione GSM con APP e sintesi vocale',
        'allarmi-type-7': 'Protezione antijammer e antimanomissione',
        'allarmi-type-8': 'Sistema modulabile e trasferibile',
        'allarmi-types-cta1': 'Scopri i Vantaggi',
        'allarmi-types-cta2': 'Altri Servizi',
        'allarmi-advantage-5-title': 'Risparmio Assicurativo',
        'allarmi-advantage-5-desc': 'Riduzioni significative sui premi assicurativi grazie alla certificazione del sistema.',
        'allarmi-advantage-6-title': 'Manutenzione Minima',
        'allarmi-advantage-6-desc': 'Sistemi wireless con autodiagnostica e manutenzione ridotta al minimo.',
        'allarmi-installation-1': 'Sopralluogo tecnico gratuito',
        'allarmi-installation-2': 'Progettazione personalizzata',
        'allarmi-installation-3': 'Installazione certificata',
        'allarmi-installation-4': 'Configurazione e test completi',
        'allarmi-installation-5': 'Formazione all\'utilizzo',
        'allarmi-installation-6': 'Certificazione di conformità',
        'allarmi-installation-7': 'Assistenza post-vendita',
        'allarmi-installation-8': 'Manutenzione programmata',
        'contact-description': 'Contattaci per una consulenza completamente gratuita sui sistemi di allarme. I nostri esperti valuteranno le tue esigenze e ti proporranno la soluzione antifurto più adatta. Verrai ricontattato telefonicamente da uno dei nostri operatori il più presto possibile.',

        'contact-email-title': 'Email',
        'contact-address-title': 'Indirizzo',


        'form-name': 'Nome e Cognome',
        'form-email': 'Email',

        'form-message': 'Messaggio',
        'form-privacy': 'Accetto il trattamento dei dati personali secondo i <a href="termini-condizioni.html" target="_blank" style="color: #4caf50; text-decoration: underline;">Termini e Condizioni</a>',
        'form-submit': 'Invia Richiesta',
        'footer-name': 'FB Total Security',

        'footer-email': '📧 fb.totalsicurezza@gmail.com',
        'footer-address': '📍 Corso Sempione, Milano (MI)',

        'footer-service-area-title': 'Area di Servizio',
        'footer-service-area-location': 'Tutta Italia',
        'footer-service-installation': 'Installazione',
        'footer-service-maintenance': 'Manutenzione',
        'footer-service-support': 'Assistenza 24/7',
        'footer-info-about': 'Chi Siamo',
        'footer-info-terms': 'Termini e Condizioni',
        'footer-info-privacy': 'Privacy Policy',
        'footer-info-cookies': 'Cookie Policy',
        'footer-info-service': 'Termini di Servizio',
        'footer-info-certifications': 'Certificazioni',
        'footer-info-business': 'Inserisci la tua azienda gratis',
        
        // Video descriptions and transcriptions
        'video-transcription-title': 'Trascrizione Video',
        'nebbiogeni-video-description': 'Guarda in azione il nostro sistema nebbiogeno professionale che garantisce protezione immediata contro le intrusioni. La tecnologia avanzata crea una barriera di nebbia impenetrabile in pochi secondi, impedendo ai malintenzionati di orientarsi e proteggendo efficacemente i tuoi beni. <a href="#contatti" class="text-link">Contattaci per una dimostrazione</a>.',
        'nebbiogeni-video-transcription': 'Il video mostra l\'efficacia dei sistemi nebbiogeni di sicurezza in azione. In pochi secondi dall\'attivazione, il dispositivo rilascia una densa nebbia che riempie completamente l\'ambiente, riducendo la visibilità a zero e rendendo impossibile per gli intrusi orientarsi o individuare oggetti di valore. La nebbia è completamente sicura per persone, animali e oggetti, non lascia residui e si dissipa naturalmente dopo un periodo prestabilito.',
        'serramenti-video-description': 'Scopri la qualità e l\'innovazione delle grate e inferriate blindate Xecur. Le nostre grate antieffrazione offrono una protezione dal livello IV al livello VI, incluso lo standard di sicurezza più alto a livello europeo (RC6) con la grata Alice VI. Grate per porte, inferriate per finestre e soluzioni su misura per proteggere la tua casa con stile e design moderno, senza opere murarie. <a href="#contatti" class="text-link">Contattaci per una consulenza</a>.',
        'serramenti-video-transcription': 'Il video presenta la gamma completa di grate e inferriate blindate Xecur, mostrando grate di classe superiore con protezione dal livello IV al livello VI (standard RC6), inferriate antieffrazione con sistema Alice VI e sistemi di fissaggio avanzati senza opere murarie. Ogni prodotto combina massima sicurezza con design elegante, utilizzando materiali certificati e tecnologie all\'avanguardia per garantire protezione duratura nel tempo.',
        
        // Sorveglianza page
        'sorveglianza-meta-title': 'Videosorveglianza - Controllo e Monitoraggio | Milano',
        'sorveglianza-meta-description': 'Sistemi di videosorveglianza professionali, telecamere IP, controllo remoto. Monitoraggio 24/7 per casa e ufficio. Installazione a Milano.',
        'sorveglianza-og-title': 'Videosorveglianza - Sistemi di Controllo e Monitoraggio',
        'sorveglianza-og-description': 'Sistemi di videosorveglianza professionali con telecamere IP e controllo remoto 24/7.',
        'sorveglianza-partnership-title': 'Partnership Premium',
        'sorveglianza-partnership-desc': 'Collaboriamo con i leader del settore per offrirti le migliori soluzioni di sicurezza',
        'sorveglianza-civis-title': 'CIVIS',
        'sorveglianza-civis-desc': 'Leader italiano nella vigilanza privata e videosorveglianza professionale H24 con tecnologie AI NOD (Neural Object Detection) per il riconoscimento intelligente di oggetti e persone. Sistemi integrati con certificazioni Blockchain per la tracciabilità e autenticità dei dati di sorveglianza, garantendo massima sicurezza e conformità normativa.',
        'sorveglianza-civis-ai-nod': 'Tecnologia AI NOD',
        'sorveglianza-civis-blockchain': 'Certificazioni Blockchain',
        'sorveglianza-civis-neural': 'Riconoscimento Neurale',
        'sorveglianza-civis-traceability': 'Tracciabilità Dati',
        'sorveglianza-civis-compliance': 'Conformità Normativa',
        'sorveglianza-certifications-title': 'Certificazioni e Garanzie',
        'sorveglianza-cert-ai-nod': 'AI NOD Certified',
        'sorveglianza-cert-neural': 'Riconoscimento Neurale',
        'sorveglianza-cert-blockchain': 'Blockchain Security',
        'sorveglianza-cert-traceability': 'Tracciabilità Garantita',
        'sorveglianza-cert-data-integrity': 'Integrità Dati',
        'sorveglianza-cert-authenticity': 'Autenticità Certificata',
        'sorveglianza-cert-compliance': 'Conformità GDPR',
        'sorveglianza-cert-privacy': 'Privacy Protetta',
        'sorveglianza-tech-1': 'Telecamere IP ad alta risoluzione',
        'sorveglianza-tech-2': 'Visione notturna avanzata',
        'sorveglianza-tech-3': 'Riconoscimento facciale AI',
        'sorveglianza-tech-4': 'Analisi comportamentale intelligente',
        'sorveglianza-tech-5': 'Storage cloud sicuro e crittografato',
        'sorveglianza-tech-6': 'Controllo remoto via smartphone',
        'sorveglianza-tech-7': 'Notifiche push istantanee',
        'sorveglianza-tech-8': 'Integrazione con sistemi esistenti',
        'sorveglianza-cta-caratteristiche': 'Caratteristiche',
        'sorveglianza-cta-preventivo': 'Preventivo Gratuito',
        'sorveglianza-feature-5-title': 'Archiviazione Cloud',
        'sorveglianza-feature-5-desc': 'Registrazioni sicure nel cloud con backup automatico e accesso da qualsiasi dispositivo.',
        'sorveglianza-feature-6-title': 'Notifiche Istantanee',
        'sorveglianza-feature-6-desc': 'Avvisi push immediati su smartphone per ogni evento rilevato dal sistema.',
        'sorveglianza-types-title': 'Tipologie di Sistemi',
        'sorveglianza-types-description': 'Soluzioni personalizzate per ogni esigenza di sicurezza, dalla protezione residenziale ai sistemi commerciali avanzati.',
        'sorveglianza-type-1': 'Sistemi per abitazioni private',
        'sorveglianza-type-2': 'Videosorveglianza commerciale',
        'sorveglianza-type-3': 'Monitoraggio industriale',
        'sorveglianza-type-4': 'Controllo perimetrale',
        'sorveglianza-type-5': 'Sorveglianza cantieri',
        'sorveglianza-type-6': 'Sistemi anti-vandalismo',
        'sorveglianza-type-7': 'Controllo accessi integrato',
        'sorveglianza-type-8': 'Monitoraggio remoto H24',
        'sorveglianza-cta-consulenza': 'Richiedi Consulenza',
        'sorveglianza-cta-servizi': 'Altri Servizi',
        'sorveglianza-advantage-5-title': 'Riduzione Costi',
        'sorveglianza-advantage-5-desc': 'Diminuisci i costi di sicurezza fisica e ottieni sconti sulle polizze assicurative.',
        'sorveglianza-advantage-6-title': 'Analisi Comportamentale',
        'sorveglianza-advantage-6-desc': 'Studia i flussi di persone e ottimizza la gestione degli spazi commerciali.',
        'sorveglianza-installation-1': 'Sopralluogo e progettazione gratuiti',
        'sorveglianza-installation-2': 'Installazione certificata',
        'sorveglianza-installation-3': 'Configurazione rete e accessi',
        'sorveglianza-installation-4': 'Test completo del sistema',
        'sorveglianza-installation-5': 'Formazione all\'utilizzo',
        'sorveglianza-installation-6': 'Assistenza post-vendita',
        'sorveglianza-installation-7': 'Manutenzione programmata',
        'sorveglianza-installation-8': 'Aggiornamenti software inclusi',
        'sorveglianza-cta-sopralluogo': 'Prenota Sopralluogo',
        'sorveglianza-cta-assistenza': 'Assistenza Tecnica',
        'sorveglianza-partner-general-title': 'Informazioni Generali',
        'sorveglianza-partner-general-desc': 'Collaboriamo con istituti di vigilanza privata leader con oltre 50 anni di esperienza nel settore della vigilanza e sorveglianza. Offriamo soluzioni di sicurezza personalizzate per privati e aziende in tutta Italia.',
        'sorveglianza-partner-services-title': 'Servizi e Innovazione',
        'sorveglianza-partner-service-6': '<strong>Analisi del rischio:</strong> i nostri consulenti di sicurezza propongono soluzioni dopo un\'attenta analisi del rischio.',
        'sorveglianza-partner-service-7': '<strong>Tecnologia avanzata e esperienza solida:</strong> combinazione di tecnologia all\'avanguardia e professionisti esperti.',
        'sorveglianza-partner-service-8': '<strong>Adattamento sistemi esistenti:</strong> possibilità di collegare sistemi di allarme già esistenti alla nostra Centrale Operativa.',

        'sorveglianza-contact-email': 'Email',
        
        // Chi Siamo page
        'chi-siamo-meta-title': 'Chi Siamo - FB Total Security | Milano',
        'chi-siamo-meta-description': 'Scopri FB Total Security: agenzia autorizzata e certificata nella sicurezza professionale. Specialisti in nebbiogeni, grate e inferriate blindate, videosorveglianza e allarmi con partnership dirette dai leader del settore.',
        'chi-siamo-og-title': 'Chi Siamo - FB Total Security | Creatori di Sicurezza',
        'chi-siamo-og-description': 'Scopri FB Total Security, agenzia autorizzata e certificata nella sicurezza professionale in tutta Italia con partnership dirette dai leader del settore.',
        'chi-siamo-hero-title': 'Chi Siamo',
        'chi-siamo-hero-subtitle': 'FB Total Security: agenzia autorizzata e certificata con partnership dirette dai leader del settore. Scopri i nostri valori e le certificazioni che ci rendono il partner ideale per la tua sicurezza.',
        'chi-siamo-hero-cta1': 'La Nostra Storia',
        'chi-siamo-hero-cta2': 'Contattaci',
        'chi-siamo-storia-title': 'La Nostra Storia',
        'chi-siamo-storia-desc1': 'FB Total Security nasce dalla passione e dall\'esperienza di professionisti del settore sicurezza con oltre 20 anni di attività. La nostra missione è proteggere persone, beni e attività attraverso soluzioni tecnologiche all\'avanguardia e un servizio di eccellenza.',
        'chi-siamo-storia-desc2': 'La nostra forza risiede nelle certificazioni professionali, nelle autorizzazioni ufficiali e nei rapporti diretti con i migliori brand internazionali. Offriamo soluzioni integrate multisettoriali con una sola agenzia. Questo ci permette di offrire soluzioni all\'avanguardia e garantire la massima qualità in ogni intervento, costruendo la nostra reputazione sulla competenza tecnica certificata del nostro team.',
        
        // Valori section
        'chi-siamo-valori-title': 'I Nostri Valori',
        'chi-siamo-valori-subtitle': 'Principi che guidano ogni nostro intervento',
        'chi-siamo-valore1-title': 'Agenzia Autorizzata',
        'chi-siamo-valore1-desc': 'Siamo un\'agenzia ufficialmente autorizzata con tutte le certificazioni necessarie per operare nel settore della sicurezza. Le nostre competenze spaziano dai sistemi residenziali a quelli commerciali e industriali, sempre nel rispetto delle normative vigenti.',
        'chi-siamo-valore2-title': 'Partnership Esclusive',
        'chi-siamo-valore2-desc': 'Manteniamo rapporti diretti e partnership esclusive con i leader mondiali del settore sicurezza. Questi mandati diretti ci permettono di accedere alle tecnologie più avanzate e di offrire prodotti certificati con garanzie estese e supporto tecnico specializzato.',
        'chi-siamo-valore3-title': 'Assistenza Continua',
        'chi-siamo-valore3-desc': 'Il nostro supporto non finisce con l\'installazione. Offriamo assistenza tecnica continua, interventi di emergenza 24/7 e manutenzione programmata per garantire sempre la massima efficienza dei tuoi sistemi.',
        
        // Specializzazioni section
        'chi-siamo-specializzazioni-title': 'Le Nostre Specializzazioni',
        'chi-siamo-specializzazioni-subtitle': 'Quattro aree di eccellenza per la tua sicurezza totale',
        'chi-siamo-spec1-title': 'Sistemi Nebbiogeni',
        'chi-siamo-spec1-desc': 'Tecnologia all\'avanguardia per la protezione immediata contro intrusioni. I nostri sistemi nebbiogeni creano una barriera di nebbia densa in pochi secondi, rendendo impossibile ai malintenzionati orientarsi e proseguire nell\'azione criminosa.',
        'chi-siamo-spec1-link': 'Sistemi Nebbiogeni Professionali',
        'chi-siamo-spec2-title': 'Grate e Inferriate Blindate',
        'chi-siamo-spec2-desc': 'Grate e inferriate blindate di ultima generazione. Progettiamo e installiamo soluzioni su misura che combinano massima sicurezza ed estetica raffinata per ogni tipo di ambiente.',
        'chi-siamo-spec2-link': 'Grate e Inferriate Blindate',
        'chi-siamo-spec3-title': 'Videosorveglianza',
        'chi-siamo-spec3-desc': 'Sistemi di videosorveglianza intelligenti con tecnologie AI integrate. Telecamere 4K, visione notturna, riconoscimento facciale e analisi comportamentale per un controllo completo e automatizzato della tua proprietà.',
        'chi-siamo-spec3-link': 'Videosorveglianza Intelligente',
        'chi-siamo-spec4-title': 'Sistemi di Allarme',
        'chi-siamo-spec4-desc': 'Allarmi wireless e filari di ultima generazione con sensori intelligenti, bottoni antipanico e controllo remoto. Sistemi modulari e scalabili che si adattano perfettamente alle tue esigenze specifiche di sicurezza.',
        'chi-siamo-spec4-link': 'Sistemi Allarme Intelligenti',
        
        // Perché sceglierci section
        'chi-siamo-perche-title': 'Perché Scegliere FB Total Security',
        'chi-siamo-perche-subtitle': 'La differenza che fa la differenza',
        'chi-siamo-approccio-title': 'Approccio Personalizzato',
        'chi-siamo-approccio-desc': 'Ogni cliente è unico, così come le sue esigenze di sicurezza. Iniziamo sempre con un sopralluogo gratuito per comprendere le tue necessità specifiche e progettare la soluzione più adatta. Non vendiamo prodotti standard, creiamo sistemi su misura.',
        'chi-siamo-approccio-feat1': 'Sopralluogo e consulenza gratuiti',
        'chi-siamo-approccio-feat2': 'Progettazione personalizzata',
        'chi-siamo-approccio-feat3': 'Preventivi dettagliati e trasparenti',
        'chi-siamo-approccio-feat4': 'Soluzioni modulari e scalabili',
        'chi-siamo-tecnologia-title': 'Tecnologia e Innovazione',
        'chi-siamo-tecnologia-desc': 'Investiamo costantemente in ricerca e sviluppo per offrirti sempre le tecnologie più avanzate. Dalle soluzioni AI per il riconoscimento facciale ai sistemi IoT per il controllo remoto, siamo sempre un passo avanti.',
        'chi-siamo-tecnologia-feat1': 'Tecnologie AI e machine learning',
        'chi-siamo-tecnologia-feat2': 'Sistemi IoT e controllo remoto',
        'chi-siamo-tecnologia-feat3': 'App mobile dedicate',
        'chi-siamo-tecnologia-feat4': 'Integrazione con smart home',
        'chi-siamo-tecnologia-feat5': 'Aggiornamenti software continui',
        'chi-siamo-cta-text': 'Vuoi saperne di più sulla nostra esperienza e sui nostri servizi? Contattaci per una consulenza gratuita.',
        'chi-siamo-cta-btn': 'Richiedi Consulenza Gratuita',
        
        // Contact section
        'chi-siamo-contact-title': 'Contatta FB Total Security',
        'chi-siamo-contact-desc': 'Richiedi una consulenza completamente gratuita per valutare le tue esigenze di sicurezza. Sopralluogo e preventivo senza impegno. Verrai ricontattato telefonicamente da uno dei nostri operatori il più presto possibile.',
        'chi-siamo-service-area-title': 'Zona di Servizio',
        'chi-siamo-service-area-text': 'Tutta Italia',
        
        // Footer additional
        'footer-company-name': 'FB Total Security',
        'footer-service-area': 'Tutta Italia',
        'allarmi-form-name': 'Nome e Cognome',
        'allarmi-form-email': 'Email',
        'allarmi-form-phone': 'Telefono',
        'allarmi-form-message': 'Messaggio',
        'allarmi-form-privacy': 'Accetto il trattamento dei dati personali secondo la',
        'allarmi-form-submit': 'Invia Richiesta',
        
        // Meta tags and components for allarmi.html - Italian
        'allarmi-meta-title': 'Sistemi Allarme - Antifurto e Sicurezza | Milano',
        'allarmi-meta-description': 'Sistemi di allarme antifurto professionali, sensori wireless, centrali di controllo. Protezione completa per casa e ufficio. Installazione in tutta Italia.',
        'allarmi-og-title': 'Sistemi di Allarme - Antifurto e Sicurezza Avanzata',
        'allarmi-og-description': 'Sistemi di allarme antifurto professionali con sensori wireless e controllo remoto.',
        'allarmi-component-1': 'Protezione volumetrica avanzata',
        'allarmi-component-2': 'Sistema perimetrale intelligente',
        'allarmi-component-3': 'Controllo ingressi con sensore predinamico',
        'allarmi-component-4': 'Protezione personale e antiaggressione',
        'allarmi-component-5': 'Sintesi vocale e comunicazione GSM',
        'allarmi-component-6': 'Sistema antipanico e telesoccorso',
        'allarmi-component-7': 'Protezione antijammer e antimanomissione',
        'allarmi-component-8': 'Sirene modulabili e sistema trasferibile',
        'itl-official-docs-title': 'Documentazione Ufficiale ITL GROUP',
        'itl-official-docs-desc': 'Accedi alle garanzie ufficiali del nostro partner tecnologico',
        'itl-warranty-btn-title': 'Garanzie ITL GROUP',
        'itl-warranty-btn-desc': 'Garanzia antifurto casa e assistenza completa',
        
        // Missing sorveglianza contact and form translations
        'sorveglianza-contact-address': 'Indirizzo',
        'sorveglianza-video-description': 'Scopri il nostro sistema di videosorveglianza professionale, la soluzione avanzata per la sicurezza totale di privati e aziende in tutta Italia. Tecnologia avanzata con risoluzione 4K, visione notturna, rilevamento intelligente e controllo remoto per proteggere efficacemente la tua proprietà. <a href="#contatti" class="text-link">Richiedi una consulenza gratuita</a>.',
        'sorveglianza-video-transcript': '<p>Il nostro sistema rappresenta l\'eccellenza nella videosorveglianza professionale per privati e aziende. Con telecamere 4K ad alta risoluzione, garantisce immagini cristalline sia di giorno che di notte grazie alla tecnologia di visione notturna avanzata.</p><p>Il sistema include rilevamento intelligente di movimento, notifiche push istantanee e controllo remoto completo tramite app dedicata. Perfetto per abitazioni, uffici e attività commerciali.</p>',


        'contact-form-name': 'Nome e Cognome',
        'contact-form-email': 'Email',

        'contact-form-message': 'Messaggio',
        'contact-form-privacy': 'Accetto il trattamento dei dati personali secondo i <a href="termini-condizioni.html" target="_blank" style="color: #4caf50; text-decoration: underline;">Termini e Condizioni</a>',
        'contact-form-submit': 'Invia Richiesta',
        
        // Missing Grate e Inferriate Blindatetranslations
        'serramenti-meta-title': 'Grate e Inferriate Blindate - Sicurezza Porte e Finestre | Milano',
        'serramenti-meta-description': 'Grate e inferriate blindate per porte e finestre. Massima protezione antieffrazione con fissaggio senza opere murarie. Installazione professionale a Milano.',
        'serramenti-og-title': 'Grate e Inferriate Blindate - Protezione Porte e Finestre',
        'serramenti-og-description': 'Grate e inferriate blindate per porte e finestre. Massima protezione antieffrazione con fissaggio senza opere murarie.',
        'serramenti-product-title': 'Grate e Inferriate Blindate di Alta Sicurezza',
        'serramenti-product-desc': 'Le nostre grate e inferriate blindate rappresentano l\'eccellenza nella sicurezza passiva. Ogni prodotto è progettato e realizzato secondo le normative europee più severe, offrendo la massima protezione senza compromettere l\'estetica della tua abitazione.',
        'serramenti-feature-5': 'Isolamento termico e acustico',
        'serramenti-feature-6': 'Finiture personalizzabili',
        'serramenti-feature-7': 'Certificazioni CE e conformità normative',
        'serramenti-feature-8': 'Garanzia fino a 10 anni',
        
        // Additional Grate e Inferriate Blindatetranslations
        'serramenti-product-cta1': 'Caratteristiche',
        'serramenti-product-cta2': 'Preventivo Gratuito',
        'serramenti-partnership-title': 'Partnership Premium',
        'serramenti-partnership-desc': 'Collaboriamo con i leader del settore per offrirti le migliori soluzioni di sicurezza',
        'serramenti-partner-name': 'XECUR',
        'serramenti-partner-desc': 'Grate e inferriate blindate con fissaggio senza opere murarie, processi di produzione interni 100% made in Italy. Innovativi sistemi di apertura senza snodi ed ingombro minimo. Verniciatura a polvere termoindurente per resistenza superiore, tunnel automatizzato di sabbiatura. <strong>Certificazioni UNI EN 1627-1630:2011</strong> (grate certificate anche in Classe IV, V e VI; Classe V record nazionale). Prima grata in Classe V (2013) e prodotto ALICE VI (2018) — unici a livello nazionale.',
        'serramenti-partner-tag-1': '100% Made in Italy',
        'serramenti-partner-tag-2': 'Senza opere murarie',
        'serramenti-partner-tag-3': 'UNI EN 1627-1630:2011',
        'serramenti-partner-tag-4': 'Classe V Record Nazionale',
        'serramenti-partner-tag-5': 'Garanzia fino a 10 anni',
        'serramenti-partner-tag-6': 'ISO 9001:2015',
        
        // Grate e Inferriate Blindatecertifications translations
        'serramenti-certifications-title': 'Certificazioni e Garanzie',
        'serramenti-cert-1-title': 'UNI EN 1627-1630:2011',
        'serramenti-cert-1-desc': 'Classi antieffrazione internazionali',
        'serramenti-cert-2-title': 'Classe V Record',
        'serramenti-cert-2-desc': 'Prima grata Classe V nazionale (2013)',
        'serramenti-cert-3-title': 'Certificazione Saldatura',
        'serramenti-cert-3-desc': 'Processi di saldatura certificati',
        'serramenti-cert-4-title': 'ISO 9001:2015',
        'serramenti-cert-4-desc': 'Sistema produttivo certificato',
        'serramenti-cert-5-title': 'Garanzia fino a 10 anni',
        'serramenti-cert-5-desc': 'Sul funzionamento e certificazione permanente',
        'serramenti-cert-6-title': '100% Made in Italy',
        'serramenti-cert-6-desc': 'Processi di produzione interni',
        
        // Grate e Inferriate Blindatecharacteristics translations
        'serramenti-characteristics-title': 'Caratteristiche Tecniche',
        'serramenti-characteristics-subtitle': 'Tecnologia avanzata per la massima sicurezza',
        'serramenti-char-1-title': 'Protezione Livello IV-VI (RC6)',
        'serramenti-char-1-desc': 'Le nostre grate e inferriate blindate offrono protezione dal livello IV al livello VI, incluso lo standard di sicurezza più alto a livello europeo (RC6) con grata Alice VI. Resistenza testata contro attacchi con utensili elettrici, senza opere murarie.',
        'serramenti-char-2-title': 'Sistemi di Fissaggio Avanzati',
        'serramenti-char-2-desc': 'Sistemi di fissaggio innovativi senza opere murarie, con installazione rapida e reversibile.',
        'serramenti-char-3-title': 'Apertura Senza Snodi',
        'serramenti-char-3-desc': 'Sistemi di apertura innovativi senza snodi ed ingombro minimo, per massima praticità d\'uso.',
        'serramenti-char-4-title': 'Verniciatura Termoindurente',
        'serramenti-char-4-desc': 'Verniciatura a polvere termoindurente per resistenza superiore agli agenti atmosferici.',
        
        // Additional Grate e Inferriate Blindatecharacteristics and types
        'serramenti-char-5-title': 'Design Personalizzabile',
        'serramenti-char-5-desc': 'Ampia gamma di finiture, colori e stili per adattarsi perfettamente al tuo arredamento.',
        'serramenti-char-6-title': 'Certificazioni UNI EN',
        'serramenti-char-6-desc': 'Tutti i prodotti sono certificati UNI EN 1627-1630:2011 e conformi alle normative europee di sicurezza.',
        'serramenti-types-desc': 'Offriamo una gamma completa di grate e inferriate blindate per soddisfare ogni esigenza di protezione, dal residenziale al commerciale, senza opere murarie.',
        'serramenti-type-7': 'Porte tagliafuoco certificate',
        'serramenti-type-8': 'Sistemi di controllo accessi',
        'serramenti-types-cta1': 'Richiedi Consulenza',
        'serramenti-types-cta2': 'Altri Servizi',
        'serramenti-installation-subtitle': 'Servizio completo dalla progettazione alla manutenzione',
        'serramenti-install-1-title': '1. Sopralluogo Gratuito',
        'serramenti-install-1-desc': 'Analisi dettagliata delle tue esigenze e misurazione precisa per la progettazione su misura.',
        'serramenti-install-2-title': '2. Progettazione',
        'serramenti-install-2-desc': 'Sviluppo della soluzione ottimale considerando sicurezza, estetica e budget disponibile.',
        'serramenti-install-3-title': '3. Produzione',
        'serramenti-install-3-desc': 'Realizzazione su misura nei nostri laboratori con materiali certificati e controlli qualità.',
        'serramenti-install-4-title': '4. Installazione',
        'serramenti-install-4-desc': 'Montaggio professionale da parte di tecnici specializzati con minimo disturbo per te.',
        'serramenti-install-5-title': '5. Collaudo',
        'serramenti-install-5-desc': 'Test completo di funzionamento e consegna della documentazione tecnica e garanzie.',
        'serramenti-install-6-title': '6. Assistenza',
        'serramenti-install-6-desc': 'Servizio di manutenzione programmata e assistenza tecnica per tutta la durata della garanzia.',
        'serramenti-contact-desc': 'Contattaci per una consulenza gratuita sulle grate e inferriate blindate. I nostri esperti valuteranno le tue esigenze e ti proporranno la soluzione più adatta.',
        'footer-installation': 'Installazione',
        'footer-maintenance': 'Manutenzione',
        'footer-support': 'Assistenza 24/7',
        'page-title': 'Sistemi di Sicurezza e Antifurto | FB Total Security Milano',
        'page-description': 'FB Total Security offre sistemi di sicurezza avanzati: allarmi, videosorveglianza, nebbiogeni e grate e inferriate blindate. Protezione completa per casa e azienda a Milano.',
        'nebbiogeni-page-title': 'Sistemi Nebbiogeni Professionali - Protezione Antifurto Istantanea | FB Total Security Milano',
        'nebbiogeni-page-description': 'Scopri i sistemi nebbiogeni UR Fog: tecnologia avanzata di nebulizzazione antifurto che riduce la visibilità a zero in 10 secondi. Protezione certificata per negozi, uffici e abitazioni a Milano. Consulenza gratuita.',
        'og-title': 'Sistemi di Sicurezza e Antifurto | FB Total Security Milano',
        'og-description': 'FB Total Security offre sistemi di sicurezza avanzati: allarmi, videosorveglianza, nebbiogeni e grate e inferriate blindate. Protezione completa per casa e azienda a Milano.',
        'nebbiogeni-og-title': 'Sistemi Nebbiogeni UR Fog - Protezione Antifurto Avanzata',
        'nebbiogeni-og-description': 'Tecnologia nebbiogeni che riduce la visibilità a zero in 10 secondi. Protezione certificata per la tua attività.',
        'btn-discover': 'Scopri di Più',
        'btn-quote': 'Richiedi Preventivo',
        'security-title': 'Sicurezza Attiva di Nuova Generazione',
        'technology-title': 'Tecnologia Nebbiogeni Avanzata',
        'security-description': 'I nostri sistemi nebbiogeni rappresentano la frontiera più avanzata nella protezione antifurto. In caso di intrusione, il sistema rilascia istantaneamente una densa nebbia che riduce la visibilità a zero, costringendo i malintenzionati ad abbandonare immediatamente i locali.',
        'feature-activation': 'Attivazione istantanea in 10 secondi',
        'feature-fog': 'Nebbia densa e persistente per 45 minuti',
        'feature-safe': 'Completamente sicura per persone e oggetti',
        'feature-integration': 'Integrazione con sistemi di allarme esistenti',
        'feature-remote': 'Controllo remoto via smartphone',
        'feature-maintenance': 'Manutenzione programmata inclusa',
        'feature-certifications': 'Certificazioni CE e conformità normative',
        'feature-warranty': 'Garanzia estesa fino a 2 anni',
        'btn-advantages': 'Vantaggi',
        'btn-free-quote': 'Preventivo Gratuito',
        'partner-urfog-title': 'URfog',
        'partner-urfog-description': 'Prima azienda italiana e mondiale ad aver certificato i sistemi nebbiogeni secondo la <strong>EN 50131-8:2019</strong>. Tecnologie brevettate: FOG STORM, caldaia "LAYER", doppia bombola brevettata, sistema a batteria con 2 brevetti internazionali, scambiatore Compact, ugello antimanomissione orientabile. Formula "White Out" Food Grade certificata per settore alimentare con <strong>zero residui</strong> e totale sicurezza (certificazione EUROFINS).',
        'tag-patented': 'Tecnologia Brevettata',
        'tag-ultrafast': 'Fino a 200 m³ in 15 sec',
        'tag-foodgrade': 'Food Grade',
        'tag-ecofriendly': 'Zero Residui',
        'tag-en50131': 'EN 50131-8:2019',
        'tag-warranty': 'Garanzia 2 anni + Assistenza a vita',
        'certifications-title': 'Certificazioni e Garanzie',
        'cert-en-title': 'EN 50131-8:2019',
        'cert-en-desc': 'Prima certificazione mondiale',
        'cert-emc-title': 'EMC, FCC, CE',
        'cert-emc-desc': 'Conformità Internazionale',
        'cert-food-title': 'Food Grade',
        'cert-food-desc': 'Certificato settore alimentare',
        'cert-eurofins-title': 'EUROFINS',
        'cert-eurofins-desc': 'Atossico per persone e animali',
        'cert-warranty-title': 'Garanzia 2 anni',
        'cert-warranty-desc': 'Assistenza telefonica a vita',
        'cert-iso16000-title': 'EN ISO 16000-1',
        'cert-iso16000-desc': 'Test fluidi certificati',
        'cert-eco-desc': 'Rispetto Ambientale',
        'advantage-instant-title': 'Attivazione Istantanea',
        'advantage-instant-desc': 'Il sistema si attiva in pochi secondi creando una barriera di nebbia impenetrabile',
        'advantage-protection-title': 'Protezione Totale',
        'advantage-protection-desc': 'Riduce la visibilità a zero rendendo impossibile per i ladri completare il furto',
        'advantage-safe-title': 'Completamente Sicuro',
        'advantage-safe-desc': 'La nebbia è atossica, non danneggia persone, animali o oggetti',
        'advantage-remote-title': 'Controllo Remoto',
        'advantage-remote-desc': 'Gestisci il sistema da remoto tramite app dedicata con notifiche in tempo reale',
        'advantage-maintenance-title': 'Manutenzione Inclusa',
        'advantage-maintenance-desc': 'Servizio di manutenzione programmata e assistenza tecnica 24/7',
        'advantage-savings-title': 'Risparmio Assicurativo',
        'advantage-savings-desc': 'Molte compagnie assicurative riconoscono sconti significativi',
        'slide1-title': 'Protezione Istantanea',
        'slide1-desc': 'Il sistema si attiva in pochi secondi creando una barriera impenetrabile',
        'slide2-title': 'Tecnologia Avanzata',
        'slide2-desc': 'Sistemi all\'avanguardia per la massima protezione',
        'btn-prev': 'Precedente',
        'btn-next': 'Successivo',

        'applications-title': 'Applicazioni Ideali',
        'applications-desc': 'I sistemi nebbiogeni sono perfetti per una vasta gamma di ambienti',
        'app-shops': 'Negozi e centri commerciali',
        'app-jewelry': 'Gioiellerie e oreficerie',
        'app-banks': 'Banche e istituti di credito',
        'app-pharmacies': 'Farmacie e parafarmacie',
        'app-offices': 'Uffici e studi professionali',
        'app-warehouses': 'Magazzini e depositi',
        'app-homes': 'Abitazioni di pregio',
        'app-museums': 'Musei e gallerie d\'arte',
        'btn-consultation': 'Richiedi Consulenza',
        'btn-other-services': 'Altri Servizi',
        'partner-urfog-main-title': 'Il Nostro Partner: UR Fog',
        'partner-general-info-title': 'Informazioni Generali',
        'partner-general-info-desc': 'UR Fog è un\'azienda leader mondiale nel mercato dei sistemi di sicurezza nebbiogeni. I loro sistemi bloccano i ladri in pochi secondi, proteggendo da furti in negozi, aziende, case e banche.',
        'partner-services-title': 'Servizi e Innovazione',
        'partner-feature-1': 'Tecnologia brevettata certificata',
        'partner-feature-2': 'Attivazione ultra-veloce in 10 secondi',
        'partner-feature-3': 'Nebbia densa e persistente per 45 minuti',
        'partner-feature-4': 'Completamente sicura per persone e oggetti',
        'partner-feature-5': 'Integrazione con sistemi di allarme esistenti',
        'partner-feature-6': 'Controllo remoto via smartphone',
        'partner-feature-7': 'Manutenzione programmata inclusa',
        'partner-feature-8': 'Certificazioni CE e conformità normative',
        'partner-feature-9': 'Garanzia estesa fino a 2 anni',
        'partner-feature-10': 'Supporto tecnico specializzato 24/7',
        'contact-info-title': 'Informazioni di Contatto',
        'contact-info-desc': 'Contattaci per una consulenza personalizzata sui nostri sistemi di sicurezza',
        'index-meta-title': 'FB Total Security - Sistemi Sicurezza | Milano',
        'index-meta-description': 'Sistemi di sicurezza professionali: nebbiogeni, grate e inferriate blindate, videosorveglianza e allarmi. Protezione completa per casa e azienda a Milano.',
        'index-og-title': 'FB Total Security - Sistemi di Sicurezza',
        'index-og-description': 'Soluzioni di sicurezza avanzate per la protezione di casa e azienda',
        'index-twitter-title': 'FB Total Security - Sistemi di Sicurezza',
        'index-twitter-description': 'Sistemi di sicurezza professionali a Milano',
        'nebbiogeni-section-title': 'Sistemi Nebbiogeni',
        'nebbiogeni-section-desc': 'Protezione istantanea con tecnologia nebbiogena avanzata',
        'serramenti-section-title': 'Grate e Inferriate di Sicurezza',
        'serramenti-section-desc': 'Grate e Inferriate Blindate per la massima sicurezza',
        'svg-serramenti-text': 'Serramenti',
        'sorveglianza-section-title': 'Videosorveglianza',
        'sorveglianza-section-desc': 'Sistemi di monitoraggio avanzati con AI',
        'sorveglianza-feature-5': 'Analisi comportamentale intelligente',
        'svg-sorveglianza-text': 'Sorveglianza',
        'allarmi-section-title': 'Sistemi di Allarme',
        'allarmi-section-desc': 'Allarmi intelligenti connessi 24/7',
        'allarmi-feature-5': 'Integrazione domotica completa',
        'svg-allarmi-text': 'Allarmi',
        'why-choose-feature-1-title': 'Esperienza Consolidata',
        'why-choose-feature-1-desc': 'Oltre 20 anni di esperienza nel settore della sicurezza',
        'why-choose-feature-2-title': 'Tecnologie Avanzate',
        'why-choose-feature-2-desc': 'Utilizziamo solo le tecnologie più innovative e certificate',
        'why-choose-feature-3-title': 'Assistenza 24/7',
        'why-choose-feature-3-desc': 'Supporto tecnico sempre disponibile per ogni necessità',
        'clients-title': 'I Nostri Clienti',
        'clients-subtitle': 'Aziende e privati che si affidano alla nostra esperienza',
        'clients-business-title': 'Settore Business',
        'clients-business-desc': 'Proteggiamo negozi, uffici, banche e strutture commerciali',
        'clients-business-feature-1': 'Sistemi nebbiogeni per negozi e centri commerciali',
        'clients-business-feature-2': 'Videosorveglianza avanzata per uffici e aziende',
        'clients-business-feature-3': 'Grate e inferriate blindate per banche e istituti di credito',
        'clients-business-feature-4': 'Allarmi intelligenti per farmacie e parafarmacie',
        'clients-business-feature-5': 'Soluzioni integrate per magazzini e depositi',
        'clients-residential-title': 'Settore Residenziale',
        'clients-residential-desc': 'Protezione completa per abitazioni private e ville di lusso',
        'clients-residential-feature-1': 'Grate e inferriate blindate per porte di sicurezza',
        'clients-residential-feature-2': 'Sistemi nebbiogeni per protezione immediata',
        'clients-residential-feature-3': 'Grate e inferriate blindate su misura per abitazioni',
        'clients-residential-feature-4': 'Sistemi nebbiogeni per ville e case di lusso',
        'clients-residential-feature-5': 'Controllo accessi intelligente per abitazioni',
        'clients-residential-feature-6': 'Monitoraggio 24/7 con centrale operativa',
        'clients-cta-text': 'Richiedi un preventivo gratuito per la tua sicurezza',
        'clients-cta-btn': 'Contattaci Ora',
        'terms-title': 'Termini e Condizioni',
        'terms-subtitle': 'Condizioni di utilizzo del sito web FB Total Security',
        'terms-section-1-title': '1. Informazioni Generali',
        'terms-section-1-content': 'Il presente sito web è di proprietà di FB Total Security, con sede legale in Milano. L\'utilizzo del sito è soggetto ai seguenti termini e condizioni.',
        'terms-section-2-title': '2. Utilizzo del Sito',
        'terms-section-2-content': 'L\'accesso e l\'utilizzo di questo sito web sono consentiti esclusivamente per scopi leciti. È vietato utilizzare il sito per:',
        'terms-section-2-item-1': 'Attività illegali o non autorizzate',
        'terms-section-2-item-2': 'Trasmissione di contenuti dannosi o virus',
        'terms-section-2-item-3': 'Violazione dei diritti di proprietà intellettuale',
        'terms-section-2-item-4': 'Interferenza con il normale funzionamento del sito',
        'terms-section-3-title': '3. Proprietà Intellettuale',
        'terms-section-3-content': 'Tutti i contenuti presenti sul sito, inclusi testi, immagini, loghi, grafica e software, sono di proprietà di FB Total Security o dei rispettivi proprietari e sono protetti dalle leggi sul diritto d\'autore.',
        'terms-section-4-title': '4. Privacy e Trattamento Dati',
        'terms-section-4-content': 'Il trattamento dei dati personali avviene in conformità al Regolamento UE 2016/679 (GDPR). I dati raccolti attraverso i moduli di contatto vengono utilizzati esclusivamente per:',
        'terms-section-4-item-1': 'Rispondere alle richieste di informazioni',
        'terms-section-4-item-2': 'Fornire preventivi personalizzati',
        'terms-section-4-item-3': 'Comunicazioni commerciali (solo con consenso esplicito)',
        'terms-section-5-title': '5. Limitazione di Responsabilità',
        'terms-section-5-content': 'FB Total Security non può essere ritenuta responsabile per:',
        'terms-section-5-item-1': 'Interruzioni temporanee del servizio',
        'terms-section-5-item-2': 'Errori o omissioni nei contenuti',
        'terms-section-5-item-3': 'Danni derivanti dall\'utilizzo del sito',
        'terms-section-5-item-4': 'Collegamenti a siti web di terze parti',
        'terms-section-6-title': '6. Modifiche ai Termini',
        'terms-section-6-content': 'FB Total Security si riserva il diritto di modificare questi termini e condizioni in qualsiasi momento. Le modifiche entreranno in vigore dalla data di pubblicazione sul sito.',
        'terms-section-7-title': '7. Legge Applicabile',
        'terms-section-7-content': 'I presenti termini e condizioni sono regolati dalla legge italiana. Per qualsiasi controversia sarà competente il Foro di Milano.',
        'terms-section-8-title': '8. Contatti',
        'terms-section-8-content': 'Per qualsiasi domanda relativa ai presenti termini e condizioni, è possibile contattare FB Total Security attraverso i canali indicati nella sezione contatti del sito.',
        'terms-last-update': 'Ultimo aggiornamento:',
        'terms-update-date': 'Settembre 2025',
        'footer-description': 'Creatori di sicurezza specializzati in sistemi di protezione avanzati. La tua sicurezza è la nostra priorità.',
        'footer-services-title': 'Servizi',
        'footer-service-1': 'Sistemi Nebbiogeni',
        'footer-service-2': 'Grate e Inferriate Blindate Certificate',
        'footer-service-3': 'Videosorveglianza',
        'footer-service-4': 'Sistemi di Allarme',
        'footer-company-title': 'Azienda',
        'footer-company-1': 'Chi Siamo',
        'footer-company-2': 'Contatti',
        'footer-company-3': 'Termini e Condizioni',
        'footer-contacts-title': 'Contatti',
        'footer-location': '📍 Tutta Italia',

        'footer-email': '✉️ fb.totalsicurezza@gmail.com',
        'footer-copyright': '© 2025 FB Total Security. Tutti i diritti riservati.',
        'footer-created-by': 'Creato e Curato da WebNovis'
    },
};

// Language Management Functions
function initLanguageSelector() {
    console.log('🌐 Initializing language selector...');
    const currentLang = localStorage.getItem('selectedLanguage') || 'it';
    console.log('🏁 Current language:', currentLang);

    // Esegui la traduzione ottimizzata
    setLanguageOptimized(currentLang);
    updateActiveLanguageButton(currentLang);

    DOM.langButtons.forEach(button => {
        button.addEventListener('click', function() {
            const selectedLang = this.getAttribute('data-lang');
            console.log('🖱️ Language button clicked:', selectedLang);
            setLanguageOptimized(selectedLang);
            updateActiveLanguageButton(selectedLang);
            localStorage.setItem('selectedLanguage', selectedLang);
        });
    });
}

// NUOVA FUNZIONE OTTIMIZZATA: Sostituisce setLanguage e updateMetaTags
function translationBasePath() {
    const s = document.querySelector('script[src*="script.min.js"], script[src*="script.js"]');
    return s ? s.getAttribute('src').replace(/script(\.min)?\.js.*$/, '') : '';
}

function loadTranslations(lang, callback) {
    if (translations[lang] || lang !== 'en') { callback(); return; }
    if (document.querySelector('script[data-translations-en]')) {
        // Script già in caricamento: attendi e riprova
        setTimeout(() => loadTranslations(lang, callback), 80);
        return;
    }
    const s = document.createElement('script');
    s.src = translationBasePath() + 'js/translations-en.min.js?v=20260822';
    s.setAttribute('data-translations-en', 'true');
    s.onload = callback;
    s.onerror = callback;
    document.head.appendChild(s);
}

// Snapshot dei testi italiani originali: permette di tornare a IT
// dopo lo switch EN senza dipendere dal dizionario (zero mismatch).
const ORIGINAL_IT = { text: new Map(), placeholder: new Map(), meta: [] };

function captureOriginalItalian() {
    document.querySelectorAll('[data-translate]').forEach(el => {
        if (!ORIGINAL_IT.text.has(el)) ORIGINAL_IT.text.set(el, el.innerHTML);
    });
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        if (!ORIGINAL_IT.placeholder.has(el)) ORIGINAL_IT.placeholder.set(el, el.getAttribute('placeholder'));
    });
    // Meta homepage (title/description/og/twitter) per il ripristino IT
    const metaSelectors = [
        ['meta[name="description"]', 'content'],
        ['meta[property="og:title"]', 'content'],
        ['meta[property="og:description"]', 'content'],
        ['meta[name="twitter:title"]', 'content'],
        ['meta[name="twitter:description"]', 'content']
    ];
    metaSelectors.forEach(([sel, attr]) => {
        const el = document.querySelector(sel);
        if (el) ORIGINAL_IT.meta.push({ el, attr, value: el.getAttribute(attr) });
    });
    ORIGINAL_IT.metaTitle = document.title;
}

function setLanguageOptimized(lang) {
    // Torna ai testi italiani originali catturati al load.
    // Necessario per invertire correttamente uno switch EN -> IT.
    if (lang === 'it') {
        if (ORIGINAL_IT.text.size === 0) captureOriginalItalian();
        ORIGINAL_IT.text.forEach((html, el) => {
            if (el.isConnected && el.innerHTML !== html) el.innerHTML = html;
        });
        ORIGINAL_IT.placeholder.forEach((ph, el) => {
            if (el.isConnected && el.getAttribute('placeholder') !== ph) el.setAttribute('placeholder', ph || '');
        });
        ORIGINAL_IT.meta.forEach(({ el, attr, value }) => {
            if (el.isConnected) el.setAttribute(attr, value);
        });
        document.title = ORIGINAL_IT.metaTitle || document.title;
        updatePageLanguageAttributes(lang);
        return;
    }
    // Dizionario non ancora disponibile: caricalo, poi riesegui
    if (!translations[lang]) {
        loadTranslations(lang, () => setLanguageOptimized(lang));
        return;
    }
    console.log(`🔄 Setting language to ${lang} (Optimized)`);
    const operations = []; // Array per memorizzare le operazioni sul DOM

    // --- FASE DI LETTURA (READ BATCH) ---
    // Leggiamo tutto ciò di cui abbiamo bisogno dal DOM senza modificarlo.
    
    // 1. Lettura per la traduzione dei contenuti
    const elementsToTranslate = document.querySelectorAll('[data-translate]');
    elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            operations.push({
                element: element,
                action: 'translate',
                content: translations[lang][key]
            });
        }
    });

    // 2. Lettura per i placeholder
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            operations.push({
                element: element,
                action: 'placeholder',
                content: translations[lang][key]
            });
        }
    });

    // 3. Lettura per i meta tag (solo su index.html)
    const currentPath = window.location.pathname;
    const isHomepage = currentPath === '/' || currentPath.endsWith('/index.html');
    if (isHomepage) {
        const metaMapping = {
            'meta[name="description"]': translations[lang]['index-meta-description'],
            'meta[property="og:title"]': translations[lang]['index-og-title'],
            'meta[property="og:description"]': translations[lang]['index-og-description'],
            'meta[name="twitter:title"]': translations[lang]['index-twitter-title'],
            'meta[name="twitter:description"]': translations[lang]['index-twitter-description'],
            'title': translations[lang]['page-title']
        };
        for (const selector in metaMapping) {
            const element = document.querySelector(selector);
            if (element && metaMapping[selector]) {
                operations.push({
                    element: element,
                    action: 'meta',
                    content: metaMapping[selector]
                });
            }
        }
    }

    // --- FASE DI SCRITTURA (WRITE BATCH) ---
    // Usiamo requestAnimationFrame per assicurarci che tutte le scritture avvengano
    // in un unico batch, ottimizzato dal browser.
    requestAnimationFrame(() => {
        console.log(`✍️ Executing ${operations.length} DOM write operations.`);
        
        // Ottimizzazione specifica per hero-subtitle (LCP critical element)
        let heroSubtitleOperation = null;
        const otherOperations = [];
        
        operations.forEach(op => {
            if (op.element.getAttribute && op.element.getAttribute('data-translate') === 'hero-subtitle') {
                heroSubtitleOperation = op;
            } else {
                otherOperations.push(op);
            }
        });
        
        // Processa prima hero-subtitle per migliorare LCP
        if (heroSubtitleOperation) {
            const element = heroSubtitleOperation.element;
            // Usa textContent invece di innerHTML per performance migliori
            element.textContent = heroSubtitleOperation.content;
            // SOLUZIONE CLS CRITICA: Rimossa lettura DOM forzata per eliminare forced reflow
            // La cache dell'altezza non è necessaria per il funzionamento corretto
        }
        
        // Processa gli altri elementi
        otherOperations.forEach(op => {
            switch (op.action) {
                case 'translate':
                    if (op.element.tagName === 'INPUT' || op.element.tagName === 'TEXTAREA') {
                        op.element.placeholder = op.content;
                    } else {
                        // Usa textContent per elementi di testo semplice per performance migliori
                        if (op.content.indexOf('<') === -1) {
                            op.element.textContent = op.content;
                        } else {
                            op.element.innerHTML = op.content;
                        }
                    }
                    break;
                case 'placeholder':
                    op.element.placeholder = op.content;
                    break;
                case 'meta':
                     if (op.element.tagName === 'TITLE') {
                        op.element.textContent = op.content;
                    } else {
                        op.element.setAttribute('content', op.content);
                    }
                    break;
            }
        });

        // Scritture finali sugli attributi globali
        document.documentElement.lang = lang;
        let ogLocale = document.querySelector('meta[property="og:locale"]');
        if (ogLocale) {
            ogLocale.setAttribute('content', lang === 'en' ? 'en_US' : 'it_IT');
        }
        
        console.log('✅ DOM updates completed.');
    });
}

// QUESTA FUNZIONE È STATA SOSTITUITA DA setLanguageOptimized
// function setLanguage(lang) { ... } // Rimossa per evitare conflitti

function updateActiveLanguageButton(lang) {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-lang') === lang) {
            button.classList.add('active');
        }
    });
}

function updatePageLanguageAttributes(lang) {
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update or create hreflang tags
    const existingHreflang = document.querySelectorAll('link[hreflang]');
    existingHreflang.forEach(link => link.remove());
    
    // Get current page without query parameters
    const currentPath = window.location.pathname;
    const baseUrl = window.location.origin;
    
    // Add hreflang for both languages
    const languages = ['it', 'en'];
    languages.forEach(language => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = language;
        link.href = `${baseUrl}${currentPath}`;
        document.head.appendChild(link);
    });
    
    // Add x-default hreflang (defaults to Italian)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${baseUrl}${currentPath}`;
    document.head.appendChild(defaultLink);
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = `${baseUrl}${currentPath}`;
    
    // Update og:locale
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
        ogLocale = document.createElement('meta');
        ogLocale.setAttribute('property', 'og:locale');
        document.head.appendChild(ogLocale);
    }
    ogLocale.content = lang === 'en' ? 'en_US' : 'it_IT';
    
    // Add alternate locales
    const existingAlternates = document.querySelectorAll('meta[property="og:locale:alternate"]');
    existingAlternates.forEach(meta => meta.remove());
    
    const alternateLocale = lang === 'en' ? 'it_IT' : 'en_US';
    const ogAlternate = document.createElement('meta');
    ogAlternate.setAttribute('property', 'og:locale:alternate');
    ogAlternate.content = alternateLocale;
    document.head.appendChild(ogAlternate);
    
    // Update og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
    }
    ogUrl.content = `${baseUrl}${currentPath}`;
}

// QUESTA FUNZIONE È STATA SOSTITUITA E INTEGRATA IN setLanguageOptimized
// function updateMetaTags(lang) { ... } // Rimossa per evitare conflitti

// Add CSS for mobile menu and animations
const additionalStyles = `
<style>
/* Mobile Menu Styles */
@media (max-width: 768px) {
    .hamburger {
        z-index: 10001 !important;
    }
    
    .hamburger span {
        background: #ffffff !important;
    }
    
    .nav-menu {
        position: fixed;
        top: 80px;
        left: 0;
        right: 0;
        background: rgba(30, 30, 30, 0.98);
        backdrop-filter: blur(10px);
        flex-direction: column;
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        /* Rimuovi transform per prevenire CLS */
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s ease-out, visibility 0s 0.25s;
        z-index: 10000;
        /* Altezza fissa per prevenire CLS */
        height: 400px;
        min-height: 400px;
        max-height: calc(100vh - 80px);
        contain: layout style paint size;
        will-change: opacity;
    }
    
    .nav-menu.active {
        display: flex;
        opacity: 1;
        visibility: visible;
        transition: opacity 0.25s ease-out, visibility 0s;
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    body.menu-open {
        overflow: hidden;
    }
}

/* Animation Classes */
.animate-in {
    animation: fadeInUp 0.6s ease-out forwards;
}

.service-text,
.service-image {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease-out;
}

.service-text.animate-in,
.service-image.animate-in {
    opacity: 1;
    transform: translateY(0);
}

/* Header Scroll Effect */
.header {
    transition: transform 0.3s ease, background-color 0.3s ease;
}

.header.scrolled {
    background: linear-gradient(180deg, rgba(5, 10, 20, 0.97) 0%, rgba(10, 15, 30, 0.95) 100%);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 1px 0 rgba(16, 185, 129, 0.08);
}

/* Form Error States */
.form-group input.error,
.form-group select.error,
.form-group textarea.error {
    border-color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
}

/* Service Card Transitions */
.service-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth Scrolling Fallback */
html {
    scroll-behavior: smooth;
}

/* Focus Indicators */
.btn:focus-visible,
.nav-link:focus-visible,
.lang-btn:focus-visible,
summary:focus-visible,
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
    outline: 2px solid #10b981;
    outline-offset: 3px;
    border-radius: 8px;
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Email obfuscation function
function initEmailObfuscation() {
    // Find all email elements that need obfuscation
    const emailElements = document.querySelectorAll('[data-email]');
    
    emailElements.forEach(element => {
        const obfuscatedEmail = element.getAttribute('data-email');
        if (obfuscatedEmail) {
            // Convert [at] and [dot] back to @ and .
            const realEmail = obfuscatedEmail
                .replace(/\[at\]/g, '@')
                .replace(/\[dot\]/g, '.');
            
            // Update the element content
            if (element.tagName.toLowerCase() === 'a') {
                element.href = `mailto:${realEmail}`;
                element.textContent = realEmail;
            } else {
                element.textContent = realEmail;
            }
        }
    });
    
    // Also handle any email spans with obfuscated format
    const emailSpans = document.querySelectorAll('.email-obfuscated');
    emailSpans.forEach(span => {
        const text = span.textContent;
        if (text.includes('[at]') || text.includes('[dot]')) {
            const realEmail = text
                .replace(/\[at\]/g, '@')
                .replace(/\[dot\]/g, '.');
            span.textContent = realEmail;
        }
    });
}

// Export functions for potential external use
window.FrancoSite = {
    showNotification,
    updateActiveNavLink,
    validateForm,
    debounce,
    throttle,
    initEmailObfuscation
};

// Reveal Animations on Scroll
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    
    const revealElements = document.querySelectorAll('.service-card, .client-card, .feature, .faq-item');
    if (!revealElements.length) return;
    
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    revealElements.forEach(el => revealObserver.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
});

// Console welcome message
console.log('%c🔒 FB Total Security - Sistemi di Sicurezza', 'color: #10b981; font-size: 16px; font-weight: bold;');
console.log('%cSito web ottimizzato per performance e SEO', 'color: #666; font-size: 12px;');