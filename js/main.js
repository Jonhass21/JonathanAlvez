/* Interacciones de la landing: revelados al hacer scroll, barra de progreso,
   parallax suave, método activo, brillo que sigue al cursor y menú móvil.
   Sin dependencias. Se degrada bien: si falla o está desactivado el JS,
   el contenido igual se ve (ver el <noscript> del head). */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var REVEAL = '[data-reveal],[data-reveal-x],[data-reveal-line]';

  /* --- Revelados --------------------------------------------------------- */
  function reveal(el) { el.classList.add('is-in'); }

  var targets = Array.prototype.slice.call(document.querySelectorAll(REVEAL));

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(reveal);
  } else {
    var counts = new WeakMap();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var parent = el.parentElement;
        var n = counts.get(parent) || 0;
        counts.set(parent, n + 1);
        setTimeout(function () { reveal(el); }, Math.min(n, 5) * 110);
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    targets.forEach(function (el) { observer.observe(el); });

    // Red de seguridad: nada debe quedar invisible si el observer no dispara.
    window.setTimeout(function () {
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
      });
    }, 1500);
  }

  /* --- Scroll: progreso, parallax y paso activo del método ---------------- */
  var progress = document.querySelector('[data-progress]');
  var parallax = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var steps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  var methodBar = document.querySelector('[data-method-bar]');
  var methodCount = document.querySelector('[data-method-count]');
  var ticking = false;

  function onFrame() {
    ticking = false;
    var vh = window.innerHeight;

    if (progress) {
      var max = document.documentElement.scrollHeight - vh;
      var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }

    if (!reduced) {
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
    }

    if (steps.length) {
      var active = 0;
      steps.forEach(function (el, i) {
        if (el.getBoundingClientRect().top < vh * 0.55) active = i;
      });
      steps.forEach(function (el, i) {
        el.setAttribute('data-active', i === active ? '1' : '0');
      });
      if (methodBar) {
        methodBar.style.transform = 'scaleX(' + ((active + 1) / steps.length).toFixed(3) + ')';
      }
      if (methodCount) methodCount.textContent = '0' + (active + 1);
    }
  }

  function queueFrame() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onFrame);
  }

  window.addEventListener('scroll', queueFrame, { passive: true });
  window.addEventListener('resize', queueFrame, { passive: true });
  queueFrame();

  /* --- Brillo que sigue al puntero (solo mouse/trackpad) ------------------ */
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-pointer]').forEach(function (section) {
      var glow = section.querySelector('[data-glow]');
      if (!glow) return;
      section.addEventListener('pointermove', function (event) {
        var rect = section.getBoundingClientRect();
        var x = event.clientX - rect.left - glow.offsetWidth / 2;
        var y = event.clientY - rect.top - glow.offsetHeight / 2;
        glow.style.transform = 'translate3d(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px,0)';
      }, { passive: true });
    });
  }

  /* --- Año del pie -------------------------------------------------------- */
  var year = document.getElementById('anio');
  if (year) year.textContent = new Date().getFullYear();

  /* --- Menú móvil --------------------------------------------------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('nav-principal');

  if (toggle && nav) {
    var label = toggle.querySelector('[data-nav-label]');

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      if (label) label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Al volver a desktop el menú no debe quedar colgado en estado abierto.
    window.matchMedia('(min-width: 761px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }
})();
