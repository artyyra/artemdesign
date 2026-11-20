/* artemdesign.ru — небольшой скрипт без библиотек.
   Всё работает и без него: он только добавляет движение и удобства. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* Год в подвале */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* Живые часы Владивостока в шапке */
  var clock = document.getElementById('clock');
  if (clock && window.Intl) {
    try {
      var fmt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Vladivostok', hour: '2-digit', minute: '2-digit' });
      var tick = function () { clock.textContent = fmt.format(new Date()); };
      tick();
      setInterval(tick, 20000);
    } catch (e) { /* старый браузер — оставим как есть */ }
  }

  /* Появление блоков при прокрутке */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reduce || !hasIO) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Цены: на телефоне подсвечивается строка в центре экрана */
  if (hasIO && window.matchMedia('(hover: none)').matches) {
    var rows = document.querySelectorAll('.price');
    var rowIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-active', en.isIntersecting); });
    }, { rootMargin: '-49% 0px -49% 0px' });
    rows.forEach(function (r) { rowIO.observe(r); });
  }

  /* Печатающийся текст на первом экране:
     «для бизнеса» → стирается → «для гостиниц» → … и по кругу */
  var tw = document.getElementById('type-word');
  if (tw && !reduce) {
    var list = (tw.getAttribute('data-type') || '').split('|').filter(Boolean);
    if (list.length > 1) {
      var caret = document.createElement('span');
      caret.className = 'caret';
      tw.insertAdjacentElement('afterend', caret);
      var idx = 0, txt = list[0];
      var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
      var visible = function () {
        return document.hidden ? new Promise(function (r) {
          document.addEventListener('visibilitychange', function h() { if (!document.hidden) { document.removeEventListener('visibilitychange', h); r(); } });
        }) : Promise.resolve();
      };
      var loop = async function () {
        await wait(3200);                       // даём прочитать первое слово
        for (;;) {
          await visible();
          while (txt.length) { txt = txt.slice(0, -1); tw.textContent = txt; await wait(45); }   // стираем
          await wait(350);
          idx = (idx + 1) % list.length;
          var next = list[idx];
          for (var i = 1; i <= next.length; i++) { txt = next.slice(0, i); tw.textContent = txt; await wait(85 + Math.random() * 50); } // печатаем
          await wait(2400);
        }
      };
      loop();
    }
  }

  /* Фраза о процессе: слова «проявляются» по мере прокрутки */
  var phrase = document.querySelector('[data-words]');
  if (phrase && !reduce) {
    var words = phrase.textContent.trim().split(/\s+/);
    var full = phrase.textContent.trim();
    phrase.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = full; phrase.appendChild(sr);
    words.forEach(function (w, i) {
      var s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = w;
      phrase.appendChild(s); if (i < words.length - 1) phrase.appendChild(document.createTextNode(' '));
    });
    var spans = phrase.querySelectorAll('.w');
    var ticking = false;
    var paint = function () {
      ticking = false;
      var r = phrase.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 — фраза только показалась снизу, 1 — дошла до середины экрана
      var p = (vh - r.top) / (vh * 0.5 + r.height * 0.5);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * spans.length);
      for (var i = 0; i < spans.length; i++) spans[i].style.opacity = i < lit ? '1' : '0.22';
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    paint();
  }

  /* Нижняя панель связи (телефон): видна, когда кнопки первого экрана
     ушли вверх, и прячется у блока «Контакты» */
  var dock = document.getElementById('dock');
  var heroCta = document.getElementById('hero-cta');
  var contacts = document.getElementById('contacts');
  if (dock && heroCta && contacts && hasIO) {
    var heroGone = false, atContacts = false;
    var update = function () {
      var show = heroGone && !atContacts;
      dock.classList.toggle('is-shown', show);
      dock.setAttribute('aria-hidden', show ? 'false' : 'true');
      dock.querySelectorAll('a').forEach(function (a) { a.tabIndex = show ? 0 : -1; });
    };
    new IntersectionObserver(function (e) {
      heroGone = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; update();
    }).observe(heroCta);
    new IntersectionObserver(function (e) {
      atContacts = e[0].isIntersecting; update();
    }, { rootMargin: '0px 0px -30% 0px' }).observe(contacts);
    update();
  }
})();
