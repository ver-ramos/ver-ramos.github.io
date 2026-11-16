document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* Theme switch: dark by default, light on request (remembered per visitor) */
const themeBtn = $('#theme-toggle');
const metaTheme = document.querySelector('meta[name="theme-color"]');
const applyTheme = (t) => {
  const light = t === 'light';
  if (light) document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  const label = light ? 'Switch to dark mode' : 'Switch to light mode';
  themeBtn.setAttribute('aria-label', label); themeBtn.title = label;
  metaTheme.setAttribute('content', light ? '#f7f4ee' : '#16181b');
};
applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.classList.add('theme-anim');
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch (e) {}
  setTimeout(() => document.documentElement.classList.remove('theme-anim'), 400);
});

/* Mobile menu */
const toggle = $('.nav-toggle');
const nav = $('#nav');
const closeMenu = () => { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); nav.classList.remove('open'); };
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  if (open) return closeMenu();
  toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close menu'); nav.classList.add('open');
});
nav.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });

/* Photo fallback (shows initials until assets/profile.jpg exists) */
['#portrait', '#portrait2'].forEach((sel) => {
  const box = $(sel); const img = $('img', box);
  const fail = () => box.classList.add('no-photo');
  img.addEventListener('error', fail);
  if (img.complete && img.naturalWidth === 0) fail();
});

/* Typed roles */
const roles = ['CPA board passer', 'project & change leader', 'process improver', 'dashboard builder', 'logician (INTP)'];
const typedEl = $('#typed');
if (!reduceMotion) {
  let r = 0, i = roles[0].length, deleting = true;
  const tick = () => {
    const word = roles[r];
    typedEl.textContent = word.slice(0, i);
    let delay = deleting ? 45 : 85;
    if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 300; }
    else if (!deleting && i === roles[r].length) { deleting = true; delay = 1800; }
    i += deleting ? -1 : 1;
    setTimeout(tick, delay);
  };
  setTimeout(tick, 2200);
}

/* Scroll: progress bar, header, back-to-top, active nav */
const bar = $('#progress');
const header = $('#header');
const toTop = $('#to-top');
const sections = $$('main section[id]');
const links = $$('.nav a[href^="#"]:not(.nav-cta)');
const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  header.classList.toggle('scrolled', y > 10);
  toTop.classList.toggle('show', y > 600);
  let current = 'top';
  sections.forEach((s) => { if (s.offsetTop - 120 <= y) current = s.id; });
  if (current === 'contact' || innerHeight + y >= document.documentElement.scrollHeight - 4) current = 'contact';
  links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Journey rail: fill the line and light the dot for the section in view */
const railLinks = $$('#rail a');
const railFill = $('#rail-fill');
const railSecs = railLinks.map((a) => document.getElementById(a.dataset.sec));
let railActive = -1, railFlashT;
const updateRail = () => {
  if (!railLinks.length || getComputedStyle($('#rail')).display === 'none') return;
  const mid = scrollY + innerHeight * 0.4;
  let i = 0;
  railSecs.forEach((s, k) => { if (s && s.offsetTop <= mid) i = k; });
  const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  if (atBottom) i = railSecs.length - 1;
  // how far through the current section we are (0..1), to move the fill smoothly between dots
  const cur = railSecs[i], next = railSecs[i + 1];
  const frac = atBottom || !next ? 0 : Math.min(Math.max((mid - cur.offsetTop) / (next.offsetTop - cur.offsetTop), 0), 1);
  const centre = (a) => a.offsetTop + a.offsetHeight / 2;
  const y0 = centre(railLinks[0]);
  const yi = centre(railLinks[i]);
  const yn = railLinks[i + 1] ? centre(railLinks[i + 1]) : yi;
  railFill.style.height = Math.max(0, yi + (yn - yi) * frac - y0) + 'px';
  railLinks.forEach((a, k) => { a.classList.toggle('active', k === i); a.classList.toggle('passed', k < i); });
  if (i !== railActive) {
    railActive = i;
    if (i > 0) {   // briefly show the section name when you arrive
      const label = $('span', railLinks[i]);
      $$('#rail a span').forEach((s) => s.classList.remove('flash'));
      label.classList.add('flash');
      clearTimeout(railFlashT);
      railFlashT = setTimeout(() => label.classList.remove('flash'), 1400);
    }
  }
};
addEventListener('scroll', () => requestAnimationFrame(updateRail), { passive: true });
addEventListener('resize', updateRail);
updateRail();

/* Parallax: each section gets --p (-1 … 1) = how far its centre is from the viewport centre */
const depthEls = $$('.hero, .section');
let ticking = false;
const updateDepth = () => {
  const vh = innerHeight;
  depthEls.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const p = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
    el.style.setProperty('--p', p.toFixed(3));
  });
  ticking = false;
};
if (!reduceMotion) {
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateDepth); } }, { passive: true });
  addEventListener('resize', updateDepth);
  updateDepth();
}
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

/* Reveal + count-up */
const countUp = (el) => {
  const to = +el.dataset.to; const sep = el.dataset.sep;
  const fmt = (n) => sep ? n.toLocaleString('en-US') : String(n);
  if (reduceMotion) { el.textContent = fmt(to); return; }
  const start = performance.now(); const dur = 1400;
  const step = (t) => {
    const p = Math.min((t - start) / dur, 1);
    el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
  io.observe($('.tagline'));

  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$('.count').forEach((el) => cio.observe(el));
} else {
  $$('.reveal').forEach((el) => el.classList.add('in'));
  $('.tagline').classList.add('in');
  $$('.count').forEach((el) => { el.textContent = (+el.dataset.to).toLocaleString('en-US'); });
}

/* Project filters */
const cards = $$('.card');
const applyFilter = (f) => {
  $$('.filter').forEach((b) => b.classList.toggle('active', b.dataset.filter === f));
  cards.forEach((c) => {
    const show = f === 'all' || c.dataset.cat.split(' ').includes(f);
    c.classList.toggle('hide', !show);
    if (show) c.classList.add('in');
  });
};
$$('.filter').forEach((btn) => btn.addEventListener('click', () => {
  applyFilter(btn.dataset.filter);
  cardsEl.scrollTo({ left: 0, behavior: 'instant' });
  updateCardNav();
}));

/* Sideways project row: arrows, drag-to-scroll, edge fade */
const cardsEl = $('#cards');
const cardsWrap = $('#cards-wrap');
const prevBtn = $('#cards-prev');
const nextBtn = $('#cards-next');
const stepSize = () => { const c = cardsEl.querySelector('.card:not(.hide)'); return c ? c.offsetWidth + 20 : 360; };
const updateCardNav = () => {
  const max = cardsEl.scrollWidth - cardsEl.clientWidth - 2;
  prevBtn.disabled = cardsEl.scrollLeft <= 2;
  nextBtn.disabled = cardsEl.scrollLeft >= max;
  cardsWrap.classList.toggle('at-end', cardsEl.scrollLeft >= max);
};
prevBtn.addEventListener('click', () => cardsEl.scrollBy({ left: -stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' }));
nextBtn.addEventListener('click', () => cardsEl.scrollBy({ left: stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' }));
cardsEl.addEventListener('scroll', updateCardNav, { passive: true });
addEventListener('resize', updateCardNav);
// mouse drag (touch already scrolls natively)
let drag = null, dragMoved = false;
cardsEl.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  drag = { x: e.clientX, left: cardsEl.scrollLeft }; dragMoved = false;
});
addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (!dragMoved && Math.abs(dx) > 6) { dragMoved = true; cardsEl.classList.add('dragging'); }
  if (dragMoved) cardsEl.scrollLeft = drag.left - dx;
});
addEventListener('pointerup', () => {
  if (!drag) return;
  drag = null;
  if (dragMoved) {
    cardsEl.classList.remove('dragging');
    // snap to the nearest card after a drag
    const s = stepSize();
    cardsEl.scrollTo({ left: Math.round(cardsEl.scrollLeft / s) * s, behavior: 'smooth' });
  }
});
cardsEl.addEventListener('click', (e) => { if (dragMoved) { e.preventDefault(); e.stopPropagation(); dragMoved = false; } }, true);
updateCardNav();

/* Strength tabs */
const fitTabs = $$('.fit-tabs [role="tab"]');
const showFit = (tab) => fitTabs.forEach((t) => {
  const on = t === tab;
  t.setAttribute('aria-selected', on);
  t.tabIndex = on ? 0 : -1;
  $('#' + t.getAttribute('aria-controls')).hidden = !on;
});
fitTabs.forEach((t, i) => {
  t.addEventListener('click', () => showFit(t));
  t.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const n = fitTabs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : fitTabs.length - 1)) % fitTabs.length];
    showFit(n); n.focus();
  });
});

/* Personality: tap a letter or colour to read what it means */
$$('.trait').forEach((b) => b.addEventListener('click', () => {
  const group = b.closest('.traits');
  $$('.trait', group).forEach((x) => x.setAttribute('aria-pressed', x === b));
  const out = $('.trait-out', group.parentElement);
  out.innerHTML = `<strong>${b.dataset.name}</strong> ${b.dataset.desc}`;
}));

/* Project modal */
const modal = $('#modal');
cards.forEach((card) => $('.card-more', card).addEventListener('click', () => {
  const cardImg = $('.card-media img', card);
  $('#modal-img').src = cardImg ? cardImg.src : '';
  $('#modal-img').alt = cardImg ? cardImg.alt : '';
  $('#modal-co').innerHTML = $('.card-co', card).innerHTML;
  $('#modal-num').textContent = $('.card-num', card).textContent;
  $('#modal-title').textContent = $('h3', card).textContent;
  $('#modal-body').innerHTML = $('.detail', card).innerHTML;
  modal.showModal();
}));
$('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

/* Experience tabs (with arrow-key support) */
const tabs = $$('.exp-tabs [role="tab"]');
const selectTab = (tab) => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    $('#' + t.getAttribute('aria-controls')).hidden = !on;
  });
};
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    const k = e.key;
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(k)) return;
    e.preventDefault();
    const n = tabs[(i + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(n); n.focus();
  });
});

/* Copy email + toast */
const toast = $('#toast');
let toastTimer;
const showToast = (msg) => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200); };
$$('.copy').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); showToast('Email copied'); }
  catch { location.href = 'mailto:' + b.dataset.copy; }
}));

/* Contact form opens a pre-filled email */
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  const body = `${d.get('message')}\n\n${d.get('name')}`;
  location.href = `mailto:markjunverramos@gmail.com?subject=${encodeURIComponent(d.get('subject'))}&body=${encodeURIComponent(body)}`;
  showToast('Opening your email app…');
});

/* Testimonial carousel: arrows, dots, swipe, auto-advance (pauses on hover/focus) */
const qTrack = $('#q-track');
const qSlides = $$('.q-slide', qTrack);
const qDots = $('#q-dots');
let qIndex = 0;
qSlides.forEach((_, i) => {
  const d = document.createElement('button');
  d.setAttribute('aria-label', `Quote ${i + 1}`);
  d.addEventListener('click', () => goQuote(i));
  qDots.appendChild(d);
});
const markDot = () => $$('button', qDots).forEach((d, i) => d.setAttribute('aria-current', i === qIndex));
const goQuote = (i) => {
  qIndex = (i + qSlides.length) % qSlides.length;
  qTrack.scrollTo({ left: qTrack.clientWidth * qIndex, behavior: reduceMotion ? 'auto' : 'smooth' });
  markDot();
};
$('#q-prev').addEventListener('click', () => goQuote(qIndex - 1));
$('#q-next').addEventListener('click', () => goQuote(qIndex + 1));
let qScrollT;
qTrack.addEventListener('scroll', () => {
  clearTimeout(qScrollT);
  qScrollT = setTimeout(() => { qIndex = Math.round(qTrack.scrollLeft / qTrack.clientWidth); markDot(); }, 80);
}, { passive: true });
markDot();
const qShell = $('.q-shell');
let qPaused = false;
['mouseenter', 'focusin', 'touchstart'].forEach((ev) => qShell.addEventListener(ev, () => { qPaused = true; }, { passive: true }));
['mouseleave', 'focusout'].forEach((ev) => qShell.addEventListener(ev, () => { qPaused = false; }));
if (!reduceMotion) setInterval(() => { if (!qPaused && !document.hidden) goQuote(qIndex + 1); }, 7000);

/* Travel flags: hover or tap to show the country */
const flagName = $('#flag-name');
$$('.flag[data-name]').forEach((f) => {
  const show = () => {
    $$('.flag').forEach((x) => x.classList.toggle('on', x === f));
    flagName.textContent = f.dataset.name;
    flagName.classList.add('on');
  };
  f.addEventListener('mouseenter', show);
  f.addEventListener('focus', show);
  f.addEventListener('click', show);
});

/* Games card: a tiny button-mash counter */
const pad = $('#pad');
const padMsg = $('#pad-msg');
const lines = ['Player 1 ready.', 'Combo x2!', 'Combo x3!', 'Critical hit!', 'Boss defeated. GG.', 'New high score!'];
let hits = 0;
pad.addEventListener('click', () => {
  hits++;
  padMsg.innerHTML = hits <= lines.length ? lines[hits - 1] : `Score: <b>${hits * 100}</b>. Okay, back to work?`;
  pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
  setTimeout(() => pad.classList.remove('hit'), 150);
});

$('#year').textContent = new Date().getFullYear();

/* ---------- Section-by-section scrolling (mouse wheel / trackpad, desktop) ----------
   One wheel gesture moves to the next or previous section. Sections taller than the
   screen scroll normally until their edge, then the next gesture jumps on. */
(() => {
  const fine = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');
  if (reduceMotion) return;
  const secs = [...document.querySelectorAll('main > section')];
  const HEAD = 76, EDGE = 6;
  let locked = false, quietTimer = 0, animating = false;
  const topOf = (el) => el.getBoundingClientRect().top + scrollY - (el.id === 'top' ? scrollY + el.getBoundingClientRect().top : HEAD);
  const current = () => {
    let idx = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top - HEAD <= EDGE) idx = i; });
    return idx;
  };
  const go = (y) => {
    animating = true; locked = true;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    setTimeout(() => { animating = false; }, 750);
  };
  window.addEventListener('wheel', (e) => {
    if (!fine.matches || e.ctrlKey || document.querySelector('dialog[open]')) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) return;
    if (e.target.closest && e.target.closest('.cards, .q-track') && Math.abs(e.deltaX) > 0) return;
    // keep the lock while a gesture (incl. trackpad inertia) is still streaming
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => { if (!animating) locked = false; else setTimeout(() => (locked = false), 200); }, 220);
    if (locked) { e.preventDefault(); return; }
    const dir = Math.sign(e.deltaY); if (!dir) return;
    const i = current(), cur = secs[i];
    const r = cur.getBoundingClientRect();
    if (dir > 0) {
      if (r.bottom > innerHeight + EDGE) return;             // more of this section below: scroll normally
      const next = secs[i + 1]; if (!next) return;           // last section: let the footer scroll in
      e.preventDefault(); go(topOf(next));
    } else {
      if (r.top < HEAD - EDGE) {                              // inside a section: go back to its start first if close, else scroll normally
        return;
      }
      const prev = secs[i - 1]; if (!prev) return;
      e.preventDefault();
      const pr = prev.getBoundingClientRect();
      const tall = prev.offsetHeight > innerHeight - HEAD;
      go(tall ? pr.bottom + scrollY - innerHeight : topOf(prev)); // tall section: land on its last screen
    }
  }, { passive: false });
})();

/* ---------- Hide "Download CV" links if the PDF isn't uploaded yet ---------- */
(() => {
  const links = [...document.querySelectorAll('a[href$="CV.pdf"]')];
  if (!links.length || location.protocol === 'file:') return;
  fetch(links[0].getAttribute('href'), { method: 'HEAD', cache: 'no-store' })
    .then((r) => { if (!r.ok) links.forEach((a) => (a.hidden = true)); })
    .catch(() => {});
})();
