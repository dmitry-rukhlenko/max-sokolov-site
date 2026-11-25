// Progressive enhancement only: every link and image works without this file.
(function () {
  document.documentElement.classList.add('js');

  // Mobile menu toggle.
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Reveal blocks as they enter the viewport. Without IntersectionObserver, show everything.
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Home carousel: crossfade every 5.5 s; pauses on hover/focus and in a hidden tab;
  // no autoplay when the user prefers reduced motion. Arrows, dots and swipe work always.
  var hero = document.querySelector('.hero');
  var slides = hero ? hero.querySelectorAll('.slide') : [];
  if (slides.length > 1) {
    var dots = hero.querySelectorAll('.dot');
    var cur = 0, timer = null;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var go = function (i) {
      slides[cur].classList.remove('is-active');
      dots[cur].removeAttribute('aria-current');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('is-active');
      dots[cur].setAttribute('aria-current', 'true');
    };
    var play = function () { if (!still && !timer) timer = setInterval(function () { go(cur + 1); }, 5500); };
    var stop = function () { clearInterval(timer); timer = null; };
    dots[0].setAttribute('aria-current', 'true');
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); stop(); play(); }); });
    hero.querySelector('.hero__prev').addEventListener('click', function () { go(cur - 1); stop(); play(); });
    hero.querySelector('.hero__next').addEventListener('click', function () { go(cur + 1); stop(); play(); });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', play);
    hero.addEventListener('focusin', stop);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
    var hx = null;
    hero.addEventListener('touchstart', function (e) { hx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (hx === null) return;
      var dx = e.changedTouches[0].clientX - hx;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); stop(); play(); }
      hx = null;
    });
    play();
  }

  // Lightbox on <dialog>: arrows, Esc (native), swipe. Falls back to opening the file.
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
  links.forEach(function (a, i) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault(); show(i); lb.showModal();
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
