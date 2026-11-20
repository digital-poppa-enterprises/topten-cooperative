/**
 * TOPTEN Cooperative: home page carousels (the only JavaScript the site needs).
 *
 * Everything else (navigation, dropdowns, mobile menu, FAQ, footer dropdowns, form
 * behaviour) is plain HTML + CSS. This file drives two things on index.html:
 *   1. The four-slide hero carousel (prev/next arrows, dots, autoplay).
 *   2. The photo-only showcase slideshow (timed cross-fade, no controls).
 * Each initialiser exits quietly if its markup is not on the page.
 */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
   * 1. Hero carousel
   * Autoplay runs ONLY while none of these are true: mouse hovering the
   * hero, keyboard focus inside it, a finger/pen pressed on it, the tab
   * hidden, or reduced motion requested. Any manual change restarts the
   * timer from zero, so a slide is never cut short right after a click.
   * ------------------------------------------------------------------ */
  function initHero() {
    const hero = document.getElementById('hero-slider-container');
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll('.hero-slide'));
    const dots = Array.from(hero.querySelectorAll('.hero-dot'));
    if (slides.length < 2) return;

    const AUTOPLAY_MS = 7000;
    let current = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));
    let timerId = null;
    const hold = { hover: false, focus: false, touch: false };

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.inert = !active;                 // hidden slides must not be reachable by Tab
      });
      dots.forEach((dot, i) => {
        const active = i === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', String(active));
      });
    }

    const shouldPlay = () =>
      !reducedMotion.matches && !document.hidden && !hold.hover && !hold.focus && !hold.touch;

    function stop() {
      window.clearInterval(timerId);
      timerId = null;
    }
    /** (Re)start the timer from zero if autoplay is currently allowed; otherwise make sure it is stopped. */
    function sync() {
      stop();
      if (shouldPlay()) timerId = window.setInterval(() => show(current + 1), AUTOPLAY_MS);
    }
    const go = (index) => { show(index); sync(); };

    document.getElementById('hero-next')?.addEventListener('click', () => go(current + 1));
    document.getElementById('hero-prev')?.addEventListener('click', () => go(current - 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));

    // Mouse hover.
    hero.addEventListener('mouseenter', () => { hold.hover = true; sync(); });
    hero.addEventListener('mouseleave', () => { hold.hover = false; sync(); });

    // Keyboard focus only (:focus-visible), so a mouse click on a button does not pause autoplay forever.
    const updateFocus = () => {
      hold.focus = hero.querySelector(':focus-visible') !== null;
      sync();
    };
    hero.addEventListener('focusin', updateFocus);
    hero.addEventListener('focusout', () => window.setTimeout(updateFocus, 0));

    // Touch / pen: pause while pressed, resume with a fresh interval afterwards.
    hero.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { hold.touch = true; sync(); } });
    ['pointerup', 'pointercancel'].forEach((type) =>
      hero.addEventListener(type, () => { hold.touch = false; sync(); }));

    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);

    show(current);
    sync();
  }

  /* ------------------------------------------------------------------
   * 2. Photo showcase
   * Two stacked <img> layers cross-fade. The next photo is preloaded before
   * it is swapped in. Slide list: <script id="home-showcase-slides"> in index.html.
   * Failed loads are retried on later ticks, and a photo that keeps failing
   * is skipped so one broken file can never freeze the slideshow.
   * ------------------------------------------------------------------ */
  function initShowcase() {
    const stage = document.querySelector('[data-home-showcase]');
    const dataEl = document.getElementById('home-showcase-slides');
    if (!stage || !dataEl) return;

    const layers = Array.from(stage.querySelectorAll('[data-home-showcase-layer]'));
    if (layers.length !== 2) return;

    let slides;
    try { slides = JSON.parse(dataEl.textContent); } catch (error) {
      console.error('Showcase: slide list is not valid JSON.', error);
      return;
    }
    if (!Array.isArray(slides) || slides.length < 2) return;

    const INTERVAL_MS = 5000;
    const MAX_ATTEMPTS = 3;                    // consecutive failures before a photo is skipped
    const loaded = new Map();                  // index -> decoded Image (successes only)
    const pending = new Map();                 // index -> in-flight promise (removed when settled)
    const failures = new Map();                // index -> consecutive failure count
    let currentIndex = 0;
    let activeLayer = 0;
    let timerId = null;
    let isAdvancing = false;

    // Photos alternate a slight tilt; the green card behind tilts the opposite way.
    function setTilt(image, index) {
      const tilt = index % 2 === 0 ? -1.1 : 1.1;
      image.style.setProperty('--album-tilt', `${tilt}deg`);
      stage.style.setProperty('--backing-tilt', `${-tilt}deg`);
    }

    /** Load one photo. Rejections are never cached, so a later call genuinely retries. */
    function preload(index) {
      if (loaded.has(index)) return Promise.resolve(loaded.get(index));
      if (pending.has(index)) return pending.get(index);
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => { loaded.set(index, image); resolve(image); };
        image.onerror = () => reject(new Error(`Could not load ${slides[index].src}`));
        image.src = slides[index].src;
      }).finally(() => pending.delete(index));
      pending.set(index, promise);
      return promise;
    }

    const isSkipped = (index) => (failures.get(index) || 0) >= MAX_ATTEMPTS;

    /** Next index after `from` that has not been given up on, or -1 if none is left. */
    function nextIndex(from) {
      for (let step = 1; step < slides.length; step += 1) {
        const candidate = (from + step) % slides.length;
        if (!isSkipped(candidate)) return candidate;
      }
      return -1;
    }

    async function advance() {
      if (isAdvancing || reducedMotion.matches || document.hidden) return;
      const target = nextIndex(currentIndex);
      if (target === -1) { stop(); return; }
      isAdvancing = true;
      try {
        const image = await preload(target);
        failures.delete(target);
        const outgoing = layers[activeLayer];
        const incoming = layers[1 - activeLayer];

        incoming.src = image.src;
        incoming.alt = slides[target].alt;
        setTilt(incoming, target);
        incoming.removeAttribute('aria-hidden');
        outgoing.alt = '';
        outgoing.setAttribute('aria-hidden', 'true');
        window.requestAnimationFrame(() => {
          incoming.classList.add('is-active');
          outgoing.classList.remove('is-active');
        });

        currentIndex = target;
        activeLayer = 1 - activeLayer;
        const upcoming = nextIndex(target);
        if (upcoming !== -1) preload(upcoming).catch(() => {});
      } catch (error) {
        // Keep the current photo on screen; the next tick tries again, then skips after MAX_ATTEMPTS.
        failures.set(target, (failures.get(target) || 0) + 1);
        console.warn(error.message);
      } finally {
        isAdvancing = false;
      }
    }

    function start() {
      if (timerId !== null || reducedMotion.matches || document.hidden) return;
      timerId = window.setInterval(advance, INTERVAL_MS);
    }
    function stop() {
      window.clearInterval(timerId);
      timerId = null;
    }
    const sync = () => { stop(); start(); };

    // The first photo is already in the markup (works without JS and with reduced motion).
    setTilt(layers[0], 0);
    layers[1].alt = '';
    layers[1].setAttribute('aria-hidden', 'true');
    preload(1).catch(() => {});

    reducedMotion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    start();
  }

  initHero();
  initShowcase();
})();
