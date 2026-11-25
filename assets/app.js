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
