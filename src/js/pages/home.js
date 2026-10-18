import { boot } from '../core/app.js';
import { gsap, ScrollTrigger, splitLines, splitWords, reduced } from '../core/motion.js';
import { $, $$, cld, cldVideo, srcset, esc } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { productCard, testimonialCard, bindProductOpeners } from '../core/components.js';
import { THICKNESS_GUIDE, SPACES, img } from '../core/defaults.js';

let DATA;
const isDesktop = () => matchMedia('(min-width: 981px)').matches;

function renderCategories(cats) {
  const track = $('[data-hscroll-track]');
  $$('.cat-card', track).forEach(n => n.remove());
  track.insertAdjacentHTML('beforeend', cats.map((c, i) => `
    <a class="cat-card" href="/products.html#${esc(c.id)}">
      <img src="${cld(c.image, 'w_900,c_limit')}" srcset="${srcset(c.image, [480, 900, 1300])}" sizes="(max-width: 640px) 80vw, 32vw" alt="${esc(c.name)}" loading="lazy" />
      <div class="cc-top"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(c.meta || '')}</span></div>
      <div class="cc-body">
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.short || '')}</p>
        <div class="cc-row"><span class="cc-meta">Explore</span><span class="cc-go">${icons.arrowUpRight}</span></div>
      </div>
    </a>`).join(''));
}

function renderFeatured(products, cats) {
  const list = products.filter(p => p.featured).slice(0, 6);
  $('[data-featured]').innerHTML = (list.length ? list : products.slice(0, 6)).map(p => productCard(p, cats)).join('');
}

function renderBento() {
  $('[data-bento]').innerHTML = SPACES.map(s => `
    <article class="bento-item img-reveal">
      <div class="bi-img" data-parallax="10"><img src="${cld(s.image, 'w_1200,c_limit')}" srcset="${srcset(s.image, [600, 1000, 1500])}" sizes="(max-width: 980px) 100vw, 50vw" alt="${esc(s.title)}" loading="lazy" /></div>
      <div class="bi-label"><div><small>${esc(s.tag)}</small><h3>${esc(s.title)}</h3></div><span class="bi-uses">${esc(s.uses)}</span></div>
    </article>`).join('');
}

function renderTestimonials(list) {
  const box = $('[data-testimonials-preview]');
  if (list.length) {
    box.innerHTML = `<div class="t-slider" data-lenis-prevent-horizontal>${list.slice(0, 8).map((t, i) => testimonialCard(t, { feature: i === 0 })).join('')}</div>`;
  } else {
    box.innerHTML = `
      <div class="t-empty reveal">
        <span class="te-icon">${icons.quote}</span>
        <div><h3>Your experience builds our name.</h3><p>We are collecting reviews from our customers. Bought from Liveteck? Tell others how our materials and service worked for you.</p></div>
        <a class="btn" href="/testimonials.html#share">Share your experience ${icons.arrow}</a>
      </div>`;
  }
}

/* ---------- thickness guide ---------- */
function initThickness() {
  const tabs = $('[data-tg-tabs]');
  tabs.innerHTML = THICKNESS_GUIDE.map(t => `<button class="tg-tab" role="tab" aria-selected="false" data-tg="${t.id}">${t.label}<small>${t.unit}</small></button>`).join('');
  const select = (id) => {
    const t = THICKNESS_GUIDE.find(x => x.id === id);
    $$('.tg-tab', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tg === id)));
    $('[data-tg-info]').innerHTML = `
      <h3>${esc(t.title)}</h3><p>${esc(t.text)}</p>
      <ul class="tg-uses">${t.uses.map(u => `<li>${esc(u)}</li>`).join('')}</ul>
      <div style="margin-top:26px"><button class="link-arrow" data-open-product="${t.product}">View product ${icons.arrow}</button></div>`;
    const edge = $('[data-tg-edge]');
    const scale = isDesktop() ? 1.9 : 1.35;
    edge.style.setProperty('--h', `${t.h * scale}px`);
    $('[data-tg-bar]').style.setProperty('--h', `${t.h * scale}px`);
    edge.classList.toggle('blockboard', !!t.blockboard);
    $('.plies', edge).innerHTML = t.blockboard ? '<i></i>' : Array.from({ length: t.plies }, (_, i) => `<i class="${i === 0 || i === t.plies - 1 ? 'face' : ''}"></i>`).join('');
    $('[data-tg-num]').innerHTML = `${t.label}<small>${t.unit}</small>`;
  };
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-tg]'); if (b) select(b.dataset.tg); });
  tabs.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const all = $$('.tg-tab', tabs); const i = all.indexOf(document.activeElement);
    const n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]; n.focus(); n.click();
  });
  select('19');
}

/* ---------- hero ---------- */
function setHeroVideo(s) {
  const v = $('[data-hero-video]');
  if (!v || !s.heroVideo) return;
  const w = innerWidth < 760 ? 'w_960' : 'w_1920';
  const src = cldVideo(s.heroVideo, w);
  if (v.dataset.src === src) return;
  v.dataset.src = src;
  if (s.heroPoster) v.poster = cld(s.heroPoster, `${w},c_limit`);
  v.src = src;
  v.addEventListener('error', () => v.removeAttribute('src'), { once: true });
  v.play?.().catch(() => {});
}

function heroIntro() {
  const title = $('[data-hero-title]');
  const lines = splitLines(title);
  if (reduced) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('[data-hero-media] video', { scale: 1.25, duration: 2.4, ease: 'power3.out' }, 0)
    .from(lines, { yPercent: 115, duration: 1.4, stagger: 0.12 }, 0.15)
    .from('[data-hero-fade]', { y: 30, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.45)
    .from('.hero-scroll', { opacity: 0, duration: 1 }, 1);
}

function heroScroll() {
  if (reduced) return;
  gsap.to('[data-hero-media]', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-content', { yPercent: -14, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true } });
}

/* ---------- statement ---------- */
function statement() {
  const el = $('[data-words]');
  const words = splitWords(el);
  if (reduced) { gsap.set(words, { opacity: 1 }); return; }
  gsap.to(words, { opacity: 1, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: 0.6 } });
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
  const probe = new Image();
  probe.onload = () => layers.filter(l => l.classList.contains('face')).forEach(l => { l.style.setProperty('--img', `url(${textureUrl})`); l.classList.add('has-img'); });
  probe.src = textureUrl;

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

/* ---------- horizontal categories ---------- */
function hscroll() {
  const section = $('[data-hscroll]');
  const track = $('[data-hscroll-track]');
  const bar = $('[data-hs-progress]');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 981px)', () => {
    if (reduced) return;
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => gsap.set(bar, { scaleX: self.progress }),
      },
    });
    gsap.from($$('.cat-card', track), { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: section, start: 'top 70%' } });
  });
}

function stepsLine() {
  const line = $('[data-step-line]');
  const steps = $$('.step');
  ScrollTrigger.create({
    trigger: '[data-steps]', start: 'top 75%', end: 'bottom 55%', scrub: true,
    onUpdate: self => {
      gsap.set(line, { scaleX: self.progress });
      steps.forEach((s, i) => s.classList.toggle('is-on', self.progress >= i / steps.length));
    },
  });
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

boot('home', {
  render(data, first) {
    DATA = data;
    renderCategories(data.categories);
    renderFeatured(data.products, data.categories);
    renderTestimonials(data.testimonials);
    if (first) { renderBento(); initThickness(); bindProductOpeners(() => DATA); }
    if (!first && data.settings.heroTitle) {
      const h = $('[data-hero-title]');
      const html = data.settings.heroTitle.replace(/\.\s*<em>/i, '.<br><em>');
      if (h.dataset.html !== html) { h.dataset.html = html; h.removeAttribute('data-split'); h.innerHTML = html; splitLines(h); }
    }
    setHeroVideo(data.settings);
  },
  intro: heroIntro,
  motion() {
    heroScroll();
    statement();
    anatomy();
    hscroll();
    stepsLine();
    audienceHover();
  },
});
