// Progressive enhancement only: every link and image works without this file.
// All motion is skipped when the visitor prefers reduced motion.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile menu toggle.
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Header hides while scrolling down and returns on scroll up (not while the menu is open).
  var header = document.querySelector('.header');
  if (header) {
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      var menuOpen = nav && nav.classList.contains('is-open');
      header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 160);
      lastY = y;
    }, { passive: true });
  }

  // Headings: wrap each word so it can slide up from under a mask.
  document.querySelectorAll('.split').forEach(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.textContent = '';
    words.forEach(function (w, i) {
      var outer = document.createElement('span'); outer.className = 'w'; outer.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('i'); inner.textContent = w; inner.style.setProperty('--i', i);
      outer.appendChild(inner); h.appendChild(outer);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
  });

  // Tiles in a row get their position for the staggered entrance.
  document.querySelectorAll('.cards').forEach(function (row) {
    Array.prototype.forEach.call(row.children, function (c, i) { c.style.setProperty('--i', i); });
  });

  // Curtain reveal for gallery photos and tile images. After the reveal the class is
  // removed, so normal hover styles take over again.
  document.querySelectorAll('.gallery a, .card__img').forEach(function (el) {
    el.classList.add('curtain');
    el.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'clip-path') el.classList.remove('curtain', 'is-in');
    });
  });

  function countUp(el) {
    var to = +el.getAttribute('data-to'), suf = el.getAttribute('data-suffix') || '';
    if (still) { el.textContent = to + suf; return; }
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + (k === 1 ? suf : '');
      if (k < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  // One observer for every entrance effect. Without IntersectionObserver, show everything.
  var targets = document.querySelectorAll('.reveal, .split, .curtain, .count');
  function enter(el) {
    if (el.classList.contains('count')) countUp(el);
    if (el.classList.contains('curtain') && still) { el.classList.remove('curtain'); return; }
    el.classList.add('is-in');
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { enter(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(enter);
  }

  // Home carousel: crossfade; progress bars show time to the next frame. Pauses on
  // hover/focus and in a hidden tab; no autoplay with reduced motion.
  var hero = document.querySelector('.hero');
  var slides = hero ? hero.querySelectorAll('.slide') : [];
  if (slides.length > 1) {
    var bars = hero.querySelectorAll('.bar');
    var cur = 0;
    var go = function (i) {
      slides[cur].classList.remove('is-active');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('is-active');
      bars.forEach(function (b, k) {
        b.classList.toggle('done', k < cur);
        b.classList.remove('on');
        b.removeAttribute('aria-current');
      });
      void bars[cur].offsetWidth; // restart the fill animation
      bars[cur].classList.add('on');
      bars[cur].setAttribute('aria-current', 'true');
    };
    if (still) hero.classList.add('still');
    hero.addEventListener('animationend', function (e) { if (e.animationName === 'barfill') go(cur + 1); });
    bars.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    hero.querySelector('.hero__prev').addEventListener('click', function () { go(cur - 1); });
    hero.querySelector('.hero__next').addEventListener('click', function () { go(cur + 1); });
    hero.addEventListener('mouseenter', function () { hero.classList.add('paused'); });
    hero.addEventListener('mouseleave', function () { hero.classList.remove('paused'); });
    hero.addEventListener('focusin', function () { hero.classList.add('paused'); });
    hero.addEventListener('focusout', function () { hero.classList.remove('paused'); });
    document.addEventListener('visibilitychange', function () { hero.classList.toggle('paused', document.hidden); });
    var hx = null;
    hero.addEventListener('touchstart', function (e) { hx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (hx === null) return;
      var dx = e.changedTouches[0].clientX - hx;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
      hx = null;
    });
    go(0);
  }

  // Lightbox on <dialog>: the photo grows out of its thumbnail; arrows, Esc (native), swipe.
  var links = Array.prototype.slice.call(document.querySelectorAll('.gallery a'));
  var lb = document.querySelector('.lb');
  if (!links.length || !lb || typeof lb.showModal !== 'function') return;
  var img = lb.querySelector('.lb__img img');
  var count = lb.querySelector('.lb__count');
  var current = 0;

  function show(i) {
    current = (i + links.length) % links.length;
    var a = links[current];
    img.src = a.getAttribute('href');
    img.alt = a.querySelector('img').alt;
    count.textContent = (current + 1) + ' / ' + links.length;
  }
  function grow(thumb) {
    if (still || !img.animate) return;
    // Start from the thumbnail's preview so the grow has pixels to show immediately.
    var big = img.src;
    img.src = thumb.currentSrc || thumb.src;
    (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
      var a = thumb.getBoundingClientRect(), z = img.getBoundingClientRect();
      if (!z.width || !z.height) { img.src = big; return; }
      var anim = img.animate([
        { transform: 'translate(' + (a.left - z.left) + 'px,' + (a.top - z.top) + 'px) scale(' + (a.width / z.width) + ',' + (a.height / z.height) + ')', transformOrigin: '0 0' },
        { transform: 'none', transformOrigin: '0 0' }
      ], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
      anim.onfinish = function () { img.src = big; };
    });
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault(); show(i); lb.showModal(); grow(a.querySelector('img'));
    });
  });
  lb.querySelector('.lb__close').addEventListener('click', function () { lb.close(); });
  lb.querySelector('.lb__prev').addEventListener('click', function () { show(current - 1); });
  lb.querySelector('.lb__next').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowLeft') show(current - 1);
    if (ev.key === 'ArrowRight') show(current + 1);
  });
  lb.addEventListener('click', function (ev) { if (ev.target === lb) lb.close(); });
  var x0 = null;
  lb.addEventListener('touchstart', function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (ev) {
    if (x0 === null) return;
    var dx = ev.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
