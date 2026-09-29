/* Medición: Google Analytics 4 + Meta Pixel, con consentimiento previo.
   Nada se carga hasta que el visitante acepta en el banner de cookies.
   Si rechaza, no se descarga ni un byte de Google ni de Meta.

   ┌──────────────────────────────────────────────────────────────────┐
   │  PEGAR ACÁ LOS DOS IDS. Mientras estén vacíos no se carga nada.  │
   └──────────────────────────────────────────────────────────────────┘ */

var GA4_ID = '';        // Measurement ID de GA4, formato 'G-XXXXXXXXXX'
var META_PIXEL_ID = ''; // ID del Pixel de Meta, 15 o 16 dígitos

(function () {
  'use strict';

  var CLAVE = 'ja_consentimiento'; // 'si' | 'no'
  var cargado = false;

  /* --- Almacenamiento tolerante a fallos ---------------------------------- */
  // En navegación privada o con cookies bloqueadas, localStorage puede lanzar.
  function leer() {
    try { return window.localStorage.getItem(CLAVE); } catch (e) { return null; }
  }
  function guardar(valor) {
    try { window.localStorage.setItem(CLAVE, valor); } catch (e) { /* sin persistencia */ }
  }

  /* --- Carga de los scripts de medición ----------------------------------- */
  function cargarGA4() {
    if (!GA4_ID) return;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, { anonymize_ip: true });
  }

  function cargarMetaPixel() {
    if (!META_PIXEL_ID) return;

    /* Inicializador oficial de Meta, reescrito sin el minificado original
       para que se entienda qué hace: crea la cola fbq y carga fbevents.js. */
    if (!window.fbq) {
      var fbq = function () {
        fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
      };
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      window.fbq = window._fbq = fbq;

      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(s);
    }

    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function activarMedicion() {
    if (cargado) return;
    cargado = true;
    cargarGA4();
    cargarMetaPixel();
  }

  /* --- Evento: clic a WhatsApp (la conversión real del sitio) ------------- */
  // Se registra siempre que haya consentimiento; sin él, el clic no se mide
  // pero el enlace funciona igual.
  function medirWhatsApp(ubicacion) {
    if (!cargado) return;
    if (window.gtag) {
      window.gtag('event', 'click_whatsapp', {
        metodo: 'whatsapp',
        ubicacion: ubicacion
      });
    }
    if (window.fbq) {
      window.fbq('track', 'Contact', { content_name: ubicacion });
    }
  }

  document.addEventListener('click', function (evento) {
    var enlace = evento.target.closest('a[href*="wa.me"]');
    if (!enlace) return;
    medirWhatsApp(enlace.closest('.site-footer') ? 'pie' : 'seccion-contacto');
  });

  /* --- Banner de consentimiento ------------------------------------------- */
  var banner = document.getElementById('cookies');

  function mostrarBanner() {
    if (banner) banner.classList.add('is-visible');
  }
  function ocultarBanner() {
    if (banner) banner.classList.remove('is-visible');
  }

  function decidir(valor) {
    guardar(valor);
    ocultarBanner();
    if (valor === 'si') activarMedicion();
  }

  if (banner) {
    banner.addEventListener('click', function (evento) {
      var boton = evento.target.closest('[data-cookies]');
      if (boton) decidir(boton.getAttribute('data-cookies'));
    });
  }

  // Permite volver a decidir desde el enlace "Cookies" del pie.
  document.addEventListener('click', function (evento) {
    if (evento.target.closest('[data-cookies-abrir]')) {
      evento.preventDefault();
      mostrarBanner();
    }
  });

  /* --- Arranque ----------------------------------------------------------- */
  var decision = leer();

  if (decision === 'si') {
    activarMedicion();
  } else if (decision !== 'no') {
    // Sin decisión previa: se pregunta. Si no hay IDs cargados todavía,
    // no tiene sentido molestar al visitante con el banner.
    if (GA4_ID || META_PIXEL_ID) mostrarBanner();
  }
})();
