import { boot, whenEngaged } from '../core/app.js';
import { gsap, ScrollTrigger, splitLines, splitWords, reduced, initReveals, idle, scrollLine, lenis } from '../core/motion.js';
import { $, $$, cld, cldVideo, srcset, esc } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { productCard, reviewCarousel, bindProductOpeners, skeletonCards, stars } from '../core/components.js';
import { initReviewForm } from '../core/review.js';
import { THICKNESS_GUIDE, SPACES, img } from '../core/defaults.js';

let DATA;
const isDesktop = () => matchMedia('(min-width: 981px)').matches;

function renderCategories(cats) {
  const track = $('[data-hscroll-track]');
  $$('.cat-card', track).forEach(n => n.remove());
  track.insertAdjacentHTML('beforeend', cats.map((c, i) => `
    <a class="cat-card" href="/products.html#${esc(c.id)}" draggable="false">
      <img src="${cld(c.image, 'w_900,c_limit')}" srcset="${srcset(c.image, [480, 900, 1300])}" sizes="(max-width: 980px) 74vw, 26vw" alt="${esc(c.name)}" loading="lazy" draggable="false" />
      <div class="cc-top"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(c.meta || '')}</span></div>
      <div class="cc-body">
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.short || '')}</p>
        <div class="cc-row"><span class="cc-meta">Explore</span><span class="cc-go">${icons.arrowUpRight}</span></div>
      </div>
    </a>`).join(''));
  (range ||= initRange()).refresh();
}

function renderFeatured(products, cats) {
  const list = products.filter(p => p.featured).slice(0, 6);
  $('[data-featured]').innerHTML = (list.length ? list : products.slice(0, 6)).map(p => productCard(p, cats)).join('');
}

function renderBento() {
  $('[data-bento]').innerHTML = SPACES.map(s => `
    <a class="bento-item img-reveal" href="${esc(s.href || '/products.html')}">
      <div class="bi-img" data-parallax="10"><img src="${cld(s.image, 'w_1200,c_limit')}" srcset="${srcset(s.image, [600, 1000, 1500])}" sizes="(max-width: 980px) 100vw, 50vw" alt="${esc(s.title)}" loading="lazy" /></div>
      <span class="bi-go" aria-hidden="true">${icons.arrowUpRight}</span>
      <div class="bi-label"><div><small>${esc(s.tag)}</small><h3>${esc(s.title)}</h3></div><span class="bi-uses">${esc(s.uses)}</span></div>
    </a>`).join('');
}

let tPending = false;
function renderTestimonials(list, { skeleton = false } = {}) {
  const box = $('[data-testimonials-preview]');
  tPending = skeleton;
  if (skeleton) { box.innerHTML = skeletonCards(3); return; }
  if (list.length) {
    const avg = list.reduce((s, t) => s + (t.rating || 5), 0) / list.length;
    const n = list.length;
    box.innerHTML = `
      <div class="t-summary reveal" aria-label="Average rating ${avg.toFixed(1)} out of 5 from ${n} review${n > 1 ? 's' : ''}">
        <b>${avg.toFixed(1)}</b>
        <div>${stars(Math.round(avg))}<span class="t-sum-count">${n} verified review${n > 1 ? 's' : ''}</span></div>
      </div>
      <div class="reveal" data-t-carousel></div>`;
    reviewCarousel($('[data-t-carousel]', box), list.slice(0, 8));
  } else {
    box.innerHTML = `
      <div class="t-empty reveal">
        <span class="te-icon">${icons.quote}</span>
        <div><h3 class="h3">Your experience builds our name.</h3><p>We are collecting reviews from our customers. Bought from Liveteck? Tell others how our materials and service worked for you.</p></div>
        <button class="btn" type="button" data-review-open>Write a review ${icons.arrow}</button>
      </div>`;
  }
}

/* ---------- thickness guide ----------
 * Plays through the boards on its own (6 → 9 → … → 25 mm, then round again) while it is on screen:
 * the edge grows ply by ply and the number counts up. The visitor takes over with the tabs, the arrows
 * inside the visual, a swipe across it (phones) or ←/→; hovering or focusing it pauses the tour, and
 * the pause button stops it. On phones the visual sits right above the tabs, so the change is in view. */
const TG_MS = 3400;
const MAX_PLIES = Math.max(...THICKNESS_GUIDE.map(t => t.plies));
function initThickness() {
  const box = $('.tg');
  const tabs = $('[data-tg-tabs]');
  const visual = $('[data-tg-visual]');
  const info = $('[data-tg-info]');
  const edge = $('[data-tg-edge]');
  const num = $('[data-tg-num]');
  const playBtn = $('[data-tg-play]');
  tabs.innerHTML = THICKNESS_GUIDE.map(t => `<button class="tg-tab" role="tab" aria-selected="false" data-tg="${t.id}">${t.label}<small>${t.unit}</small><i class="tg-timer" aria-hidden="true"></i></button>`).join('');
  // a fixed set of plies (faces at both ends): thinner boards fold the inner plies away, so the change is a smooth grow/shrink
  $('.plies', edge).innerHTML = Array.from({ length: MAX_PLIES }, (_, i) => `<i class="${i === 0 || i === MAX_PLIES - 1 ? 'face' : ''}"></i>`).join('');
  const plies = $$('.plies i', edge);
  const maxH = Math.max(...THICKNESS_GUIDE.map(t => t.h));
  let cur = -1, shown = 0, countRaf = 0;
  // the edge is drawn to scale: the thickest board fills most of the visual's height
  const scale = () => Math.min(isDesktop() ? 1.9 : 1.5, (visual.clientHeight - 90) / maxH);
  const countTo = (to) => {
    cancelAnimationFrame(countRaf);
    const from = shown, t0 = performance.now(), dur = reduced ? 0 : 700;
    const tick = (now) => {
      const p = dur ? Math.min(1, (now - t0) / dur) : 1;
      shown = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      num.innerHTML = `${shown}<small>mm</small>`;
      if (p < 1) countRaf = requestAnimationFrame(tick);
    };
    countRaf = requestAnimationFrame(tick);
  };
  const draw = () => {
    const t = THICKNESS_GUIDE[cur];
    const h = `${Math.max(14, t.h * scale())}px`;
    edge.style.setProperty('--h', h);
    $('[data-tg-bar]').style.setProperty('--h', h);
    edge.classList.toggle('blockboard', !!t.blockboard);
    const inner = t.blockboard ? 0 : t.plies - 2;
    plies.forEach((p, k) => p.classList.toggle('off', k > 0 && k < MAX_PLIES - 1 && k > inner));
  };

  /* the tour */
  const holds = new Set();
  let playing = !reduced, timer = null, inView = false;
  const sync = () => {
    clearTimeout(timer);
    const run = playing && inView && !holds.size && !document.hidden;
    box.classList.toggle('is-touring', run);
    if (run) timer = setTimeout(() => select((cur + 1) % THICKNESS_GUIDE.length, { tour: true }), TG_MS);
  };
  const hold = (k, on) => { on ? holds.add(k) : holds.delete(k); sync(); };
  let resume;
  const handOver = () => { hold('picked', true); clearTimeout(resume); resume = setTimeout(() => hold('picked', false), 9000); };

  const select = (i, { animate = true, tour = false } = {}) => {
    i = Math.max(0, Math.min(THICKNESS_GUIDE.length - 1, i));
    if (i === cur) return;
    cur = i;
    const t = THICKNESS_GUIDE[i];
    $$('.tg-tab', tabs).forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    info.innerHTML = `
      <h3>${esc(t.title)}</h3><p>${esc(t.text)}</p>
      <ul class="tg-uses">${t.uses.map(u => `<li>${esc(u)}</li>`).join('')}</ul>
      <div style="margin-top:26px"><button class="link-arrow" data-open-product="${t.product}">View product ${icons.arrow}</button></div>`;
    $$('[data-tg-step]', visual).forEach(b => { b.disabled = +b.dataset.tgStep < 0 ? i === 0 : i === THICKNESS_GUIDE.length - 1; });
    draw();
    countTo(+t.label);
    if (animate && !reduced) {
      [info, visual].forEach(el => { el.classList.remove(el === info ? 'is-swap' : 'is-bump'); void el.offsetWidth; el.classList.add(el === info ? 'is-swap' : 'is-bump'); });
    }
    if (!tour) handOver();
    // restart the active tab's timer bar
    box.classList.remove('is-touring'); void box.offsetWidth;
    sync();
  };
  const step = (d) => select(cur + d);
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-tg]'); if (b) select(THICKNESS_GUIDE.findIndex(t => t.id === b.dataset.tg)); });
  tabs.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    step(e.key === 'ArrowRight' ? 1 : -1);
    $$('.tg-tab', tabs)[cur].focus();
  });
  visual.addEventListener('click', e => { const b = e.target.closest('[data-tg-step]'); if (b) step(+b.dataset.tgStep); });
  // swipe across the visual: left = thicker, right = thinner (vertical page scroll is left alone)
  let sx = null, sy = 0;
  visual.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  visual.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  box.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hold('hover', true); });
  box.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hold('hover', false); });
  box.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) hold('focus', true); });
  box.addEventListener('focusout', () => hold('focus', false));
  document.addEventListener('visibilitychange', sync);
  playBtn.hidden = reduced;
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.innerHTML = playing ? icons.pause : icons.play;
    playBtn.setAttribute('aria-label', playing ? 'Pause the thickness tour' : 'Play the thickness tour');
    if (playing) { holds.delete('picked'); select((cur + 1) % THICKNESS_GUIDE.length, { tour: true }); } else sync();
  });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(visual);
  // links that jump here for one board ("25 mm" in the stats) open on that board
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-tg-go]');
    if (a) select(THICKNESS_GUIDE.findIndex(t => t.id === a.dataset.tgGo));
  });
  new ResizeObserver(() => cur >= 0 && draw()).observe(visual);
  select(0, { animate: false, tour: true });
}

/* ---------- hero ---------- */
const POSTER_W = [640, 960, 1280, 1920];
function setHeroPoster(s) {
  const im = $('.hero-poster');
  if (!im || !s.heroPoster || im.dataset.src === s.heroPoster || /liveteck\/brand\/hero-poster$/.test(s.heroPoster)) return;
  im.dataset.src = s.heroPoster;
  im.srcset = POSTER_W.map(w => `${cld(s.heroPoster, `w_${w},c_limit`)} ${w}w`).join(', ');
  im.src = cld(s.heroPoster, 'w_1280,c_limit');
}

/** The hero film loads only after the intro + page load, so it never competes with first paint. */
function startHeroVideo(s) {
  const v = $('[data-hero-video]');
  const conn = navigator.connection;
  if (!v || !s.heroVideo || reduced || conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) return;
  const src = cldVideo(s.heroVideo, innerWidth < 760 ? 'w_960' : 'w_1920');
  if (v.dataset.src === src) return;
  v.dataset.src = src;
  v.addEventListener('playing', () => v.classList.add('is-playing'), { once: true });
  v.addEventListener('error', () => { v.removeAttribute('src'); v.load(); }, { once: true });
  v.preload = 'auto';
  v.autoplay = true;
  v.src = src;
  v.play?.().catch(() => {});
}

let heroShown = false;
function heroIntro() {
  const lines = splitLines($('[data-hero-title]'));
  heroShown = true;
  if (reduced) return;
  // Start states are painted by CSS from the first frame (html:not(.reduced) .hero …), so nothing
  // flashes before this runs. GSAP reads a CSS transform back as px `y`, so tweens reset y explicitly.
  // The subtitle stays still: it's the LCP text, and Chrome only counts an element once its entrance
  // animation has finished.
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo('[data-hero-media] > *', { scale: 1.22 }, { scale: 1.08, duration: 2.4, ease: 'power3.out' }, 0)
    .fromTo(lines, { y: 0, yPercent: 115 }, { y: 0, yPercent: 0, duration: 1.4, stagger: 0.12 }, 0.15)
    .fromTo('[data-hero-fade]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, 0.45)
    .from('.hero-scroll', { opacity: 0, duration: 1 }, 1);
}

function heroScroll() {
  if (reduced) return;
  gsap.to('[data-hero-media]', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-content', { yPercent: -14, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true } });
}

/* ---------- statement: words light up as you scroll ---------- */
function statement() {
  const el = $('[data-words]');
  const words = [...splitWords(el)];
  if (reduced) { words.forEach(w => w.classList.add('on')); return; }
  let lit = -1;
  ScrollTrigger.create({
    trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: true,
    onUpdate: (self) => {
      const n = Math.round(self.progress * words.length);
      if (n === lit) return;
      lit = n;
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    },
  });
}

/* ---------- anatomy: exploding plywood ---------- */
function anatomy() {
  const section = $('[data-anatomy]');
  const stack = $('[data-ply-stack]');
  const layers = $$('.ply-layer', stack);
  const steps = $$('.anatomy-step', section);
  const bars = $$('.anatomy-progress i', section);
  const n = layers.length;
  const textureUrl = cld(img('brand/veneer-texture'), 'w_900,c_limit');
  layers.forEach((l, i) => gsap.set(l, { z: (n - 1 - i) * 13 }));
  // real veneer texture on the face layers when available
  const loadTexture = () => {
    const probe = new Image();
    probe.onload = () => layers.filter(l => l.classList.contains('face')).forEach(l => { l.style.setProperty('--img', `url(${textureUrl})`); l.classList.add('has-img'); });
    probe.src = textureUrl;
  };
  const tio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { tio.disconnect(); loadTexture(); } }, { rootMargin: '600px' });
  tio.observe(section);

  let current = 0;
  const setStep = (i) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    bars.forEach((b, k) => b.classList.toggle('on', k <= i));
  };
  if (reduced) return;

  const gap = isDesktop() ? 64 : 38;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section, start: 'top top', end: () => `+=${innerHeight * (isDesktop() ? 3 : 2.2)}`, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: self => setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999))),
    },
  });
  tl.to(stack, { rotateZ: -26, rotateX: 54, duration: 1 }, 0)
    .to(layers, { z: (i) => (n - 1 - i) * gap - ((n - 1) * gap) / 2 + 40, duration: 0.6, ease: 'power2.inOut', stagger: 0.02 }, 0.05)
    .to($$('.ply-label', stack), { opacity: 1, duration: 0.2, stagger: 0.03 }, 0.45)
    .to(layers, { z: (i) => (n - 1 - i) * 13, duration: 0.3, ease: 'power2.inOut' }, 0.8)
    .to($$('.ply-label', stack), { opacity: 0, duration: 0.1 }, 0.8);
}

/* ---------- the range: category cards that glide on their own (desktop and phones) ----------
 * An endless row (the cards are repeated after the originals): it drifts left at a calm pace while
 * on screen, eases to a stop under the mouse, a finger or keyboard focus, and picks up again after.
 * Drag or swipe it, or step card by card with the arrows; the pause button stops it for good.
 * Reduced motion: no drift, a plain swipe row. */
const RANGE_SPEED = 42; // px per second
let range = null;
function initRange() {
  const section = $('[data-range]');
  const vp = $('[data-range-viewport]', section);
  const track = $('[data-hscroll-track]', section);
  const bar = $('[data-hs-progress]', section);
  const curEl = $('[data-hs-cur]', section);
  const playBtn = $('[data-range-play]', section);
  let cards = [], setW = 1, step = 1, pos = 0, speed = 0, vel = 0, glide = null;
  let inView = false, hover = false, focus = false, touchUntil = 0, paused = reduced, raf = 0, last = 0;
  let drag = null;

  const measure = () => {
    if (!cards.length) return;
    const first = track.querySelector('.cat-card[data-clone]');
    setW = first ? first.offsetLeft - cards[0].offsetLeft : track.scrollWidth;
    step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : setW;
  };
  const wrap = (x) => ((x % setW) + setW) % setW;
  const paint = () => {
    track.style.transform = `translate3d(${-pos}px,0,0)`;
    bar.style.transform = `scaleX(${(pos / setW) || 0})`;
    const n = String((Math.round(pos / step) % cards.length) + 1).padStart(2, '0');
    if (curEl.textContent !== n) curEl.textContent = n;
  };
  const held = () => paused || hover || focus || drag || performance.now() < touchUntil || document.hidden;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (glide) {
      const p = Math.min(1, (now - glide.t0) / glide.dur);
      pos = glide.from + (glide.to - glide.from) * (1 - Math.pow(1 - p, 3));
      if (p >= 1) { pos = wrap(pos); glide = null; }
    } else if (!drag) {
      // free coast after a flick, then the drift eases back in (or out while held)
      if (Math.abs(vel) > 2) { pos += vel * dt; vel *= Math.pow(0.04, dt); }
      speed += ((held() ? 0 : RANGE_SPEED) - speed) * Math.min(1, dt * 3);
      pos += speed * dt;
    }
    if (!glide) pos = wrap(pos);
    paint();
    raf = inView ? requestAnimationFrame(frame) : 0;
  };
  const run = () => { if (!raf && inView && !reduced) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const go = (dir) => {
    const target = (Math.round(pos / step) + dir) * step;
    glide = { from: pos, to: target, t0: performance.now(), dur: 650 };
    touchUntil = performance.now() + 4000; // let the visitor look at the card they chose
    run();
  };
  const setPaused = (on) => {
    paused = on;
    playBtn.setAttribute('aria-label', on ? 'Play moving cards' : 'Pause moving cards');
    playBtn.innerHTML = on ? icons.play : icons.pause;
  };

  if (!reduced) {
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; run(); }, { rootMargin: '100px' }).observe(vp);
    vp.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    vp.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = false; });
    vp.addEventListener('focusin', e => {
      focus = true;
      const c = e.target.closest('.cat-card');
      if (c) { glide = { from: pos, to: c.offsetLeft - cards[0].offsetLeft, t0: performance.now(), dur: 500 }; run(); }
    });
    vp.addEventListener('focusout', () => { focus = false; });
    // drag (mouse) and swipe (touch): the row follows the pointer; vertical swipes still scroll the page
    vp.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      glide = null; vel = 0;
      drag = { x: e.clientX, pos, moved: false, lastX: e.clientX, lastT: performance.now(), id: e.pointerId };
    });
    vp.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; vp.classList.add('is-dragging'); vp.setPointerCapture?.(e.pointerId); }
      if (!drag.moved) return;
      const now = performance.now();
      vel = -((e.clientX - drag.lastX) / Math.max(1, now - drag.lastT)) * 1000;
      drag.lastX = e.clientX; drag.lastT = now;
      pos = wrap(drag.pos - dx); paint();
    });
    const end = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const moved = drag.moved;
      drag = null;
      vp.classList.remove('is-dragging');
      if (moved) { speed = 0; touchUntil = performance.now() + 1800; } else vel = 0;
      if (e?.pointerType !== 'mouse') touchUntil = Math.max(touchUntil, performance.now() + 2500);
      run();
    };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
    // a drag must never open the card it ended on
    vp.addEventListener('click', e => { if (vp.classList.contains('is-dragging')) e.preventDefault(); }, true);
    document.addEventListener('visibilitychange', run);
    new ResizeObserver(() => { measure(); pos = wrap(pos); paint(); }).observe(vp);
  }
  section.addEventListener('click', e => {
    const s = e.target.closest('[data-range-step]');
    if (s) { reduced ? vp.scrollBy({ left: +s.dataset.rangeStep * step }) : go(+s.dataset.rangeStep); }
    if (e.target.closest('[data-range-play]')) { setPaused(!paused); run(); }
  });

  return {
    /** After the cards were (re)rendered: repeat them so the loop never shows a gap, then re-measure. */
    refresh() {
      $$('.cat-card[data-clone]', track).forEach(n => n.remove());
      cards = $$('.cat-card', track);
      $('[data-hs-total]', section).textContent = String(cards.length).padStart(2, '0');
      if (!cards.length) return;
      if (!reduced) {
        const copies = Math.max(1, Math.ceil((vp.clientWidth + 400) / Math.max(1, track.scrollWidth)));
        for (let k = 0; k < copies; k++) cards.forEach(c => {
          const cl = c.cloneNode(true);
          cl.dataset.clone = '1'; cl.setAttribute('aria-hidden', 'true'); cl.tabIndex = -1;
          track.appendChild(cl);
        });
      }
      measure(); pos = wrap(pos); paint(); run();
    },
  };
}

function stepsLine() {
  scrollLine($('[data-steps]'), { vertical: () => !isDesktop(), start: 'top 75%', end: 'bottom 60%' });
}

function audienceHover() {
  const float = $('.aud-float');
  const im = $('img', float);
  if (!float || matchMedia('(hover: none)').matches) return;
  const xTo = gsap.quickTo(float, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(float, 'y', { duration: 0.6, ease: 'power3' });
  $$('.aud-row').forEach(row => {
    row.addEventListener('mouseenter', () => { im.src = cld(img(row.dataset.img), 'w_600,c_limit'); float.classList.add('on'); });
    row.addEventListener('mouseleave', () => float.classList.remove('on'));
  });
  addEventListener('mousemove', e => { xTo(e.clientX + 30); yTo(e.clientY - 180); });
}

// First paint only needs the hero: the sections below it are built in short idle slices
// (one long task would block input while the page is loading).
let rendered = Promise.resolve();
const inSlices = (jobs) => jobs.reduce((p, job) => p.then(() => idle(() => { job(); initReveals(); }, 800)), Promise.resolve());

boot('home', {
  render(data, first) {
    DATA = data;
    const jobs = [
      () => renderCategories(data.categories),
      () => renderFeatured(data.products, data.categories),
      () => renderTestimonials(data.testimonials, { skeleton: first && !data.fromCache }),
    ];
    if (first) { bindProductOpeners(() => DATA); initReviewForm(); jobs.push(renderBento, initThickness); }
    if (!first && data.settings.heroTitle) {
      const h = $('[data-hero-title]');
      const html = data.settings.heroTitle.replace(/\.\s*<em>/i, '.<br><em>');
      const norm = (x) => x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (norm(html) !== norm(h.innerHTML)) {
        h.removeAttribute('data-split'); h.innerHTML = html;
        const lines = splitLines(h);
        if (heroShown && !reduced) gsap.fromTo(lines, { y: 0, yPercent: 115 }, { y: 0, yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' });
      }
    }
    setHeroPoster(data.settings);
    rendered = first ? inSlices(jobs) : rendered.then(() => { jobs.forEach(j => j()); initReveals(); });
  },
  intro: heroIntro,
  loaded(data) {
    rendered.then(() => {
      if (tPending) { renderTestimonials(data.testimonials); initReveals(); }
    });
    whenEngaged().then(() => startHeroVideo(data.settings));
  },
  // scroll scenes measure the sections, so they wait for them to be built
  ready: () => rendered,
  motion() {
    heroScroll();
    statement();
    anatomy();
    stepsLine();
    audienceHover();
  },
});
