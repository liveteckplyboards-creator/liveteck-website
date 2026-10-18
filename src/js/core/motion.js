import gsap from 'gsap';
import Lenis from 'lenis';

// ScrollTrigger is loaded on demand (first interaction): once registered it keeps a perpetual
// requestAnimationFrame loop, which an untouched, still-loading page doesn't need.
export let ScrollTrigger = null;
let stPromise = null;
export const loadScrollTrigger = () => (stPromise ||= import('gsap/ScrollTrigger').then(({ ScrollTrigger: ST }) => {
  gsap.registerPlugin(ST);
  // mobile address-bar show/hide fires resize constantly — don't recalc every trigger on it.
  // No automatic refresh on DOMContentLoaded/load: scroll scenes refresh themselves when created.
  ST.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,resize' });
  lenis?.on('scroll', ST.update);
  ScrollTrigger = ST;
  return ST;
}));
// sections with content-visibility:auto get their real size when first rendered → re-measure triggers
let cvTimer;
document.addEventListener('contentvisibilityautostatechange', (e) => {
  if (e.skipped || !ScrollTrigger?.getAll().length) return;
  clearTimeout(cvTimer); cvTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
}, true);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export let lenis = null;
export { gsap };

/** Run work when the main thread is idle (keeps long tasks out of the critical path). */
export const idle = (fn, timeout = 1200) =>
  new Promise(res => {
    const run = () => { try { fn?.(); } finally { res(); } };
    'requestIdleCallback' in window ? requestIdleCallback(run, { timeout }) : setTimeout(run, 60);
  });

export function initSmoothScroll() {
  if (reduced) return null;
  lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  ScrollTrigger && lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);
  // Drive Lenis only while it's needed: a per-frame loop on an idle page keeps the main thread
  // (and the battery) busy for nothing. Input wakes it; ~1 s without smooth scrolling puts it to sleep.
  let awake = false, still = 0;
  const tick = (time) => {
    lenis.raf(time * 1000);
    if (lenis.isScrolling) still = 0;
    else if (++still > 60) { gsap.ticker.remove(tick); awake = false; }
  };
  const wake = () => { still = 0; if (!awake) { awake = true; gsap.ticker.add(tick); } };
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(ev => addEventListener(ev, wake, { capture: true, passive: true }));
  const scrollTo = lenis.scrollTo.bind(lenis);
  lenis.scrollTo = (...args) => { wake(); return scrollTo(...args); };
  // in-page anchors
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    let el = null;
    try { el = document.querySelector(a.getAttribute('href')); } catch { /* invalid selector */ }
    if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -80 }); }
  });
  return lenis;
}

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();

/** Split element text into masked lines (split on <br>) for reveal animations. */
export function splitLines(el) {
  if (el.dataset.split === '1') return el.querySelectorAll('.split-line > span');
  el.dataset.split = '1';
  const chunks = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = chunks.map((c, i) => `<span class="split-line" style="--li:${i}"><span>${c.trim()}</span></span>`).join('');
  return el.querySelectorAll('.split-line > span');
}

/** Wrap each word in .w (for scroll-scrubbed highlight). */
export function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  return el.querySelectorAll('.w');
}

/* ---------- reveals: one IntersectionObserver, CSS transitions (compositor-only) ---------- */
let revealIO = null;
const countUp = (el) => {
  const end = parseFloat(el.dataset.count);
  const from = parseFloat(el.dataset.from || 0);
  const node = el.firstChild;
  if (reduced) { node.nodeValue = end; return; }
  const t0 = performance.now(), dur = 2000;
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    node.nodeValue = Math.round(from + (end - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

export function initReveals(root = document) {
  const targets = root.querySelectorAll('.reveal:not(.is-in), .img-reveal:not(.is-in), [data-split]:not(.is-in), [data-count]:not([data-counted])');
  if (!targets.length) return;
  targets.forEach(el => {
    if (el.hasAttribute('data-split') && el.dataset.split !== '1') { splitLines(el); el.classList.add('split-reveal'); }
  });
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(el => { el.classList.add('is-in'); if (el.dataset.count) { el.dataset.counted = '1'; countUp(el); } });
    return;
  }
  revealIO ||= new IntersectionObserver((entries) => {
    let n = 0;
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      revealIO.unobserve(el);
      if (el.dataset.count) { el.dataset.counted = '1'; countUp(el); return; }
      if (el.classList.contains('reveal') || el.classList.contains('img-reveal')) el.style.setProperty('--rd', `${Math.min(n++, 6) * 0.09}s`);
      el.classList.add('is-in');
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
  targets.forEach(el => revealIO.observe(el));
}

/** Scroll-linked parallax for [data-parallax] media (transform only). */
export function initParallax(root = document) {
  if (reduced) return;
  root.querySelectorAll('[data-parallax]:not([data-px])').forEach(el => {
    el.dataset.px = '1';
    const amt = parseFloat(el.dataset.parallax) || 12;
    gsap.fromTo(el, { yPercent: -amt / 2 }, {
      yPercent: amt / 2, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/**
 * Opening intro (Home). The whole sequence is CSS (see .intro in main.css) and starts at
 * first paint; this only adds skip, scroll lock and cleanup, and resolves when the
 * ply strips start sliding so the hero can animate in underneath.
 */
export function runIntro() {
  const root = document.documentElement;
  const intro = document.querySelector('.intro');
  const done = () => { root.classList.remove('intro-active'); intro?.remove(); lenis?.start(); };
  if (!intro || root.classList.contains('no-loader') || reduced) { done(); return Promise.resolve(); }
  lenis?.stop();
  return new Promise(resolve => {
    let revealed = false, finished = false;
    const reveal = () => { if (revealed) return; revealed = true; intro.style.pointerEvents = 'none'; resolve(); };
    const finish = () => { if (finished) return; finished = true; reveal(); done(); };
    const band = intro.querySelector('.intro-bands i:nth-child(4)');
    band?.addEventListener('animationstart', (e) => { if (/^ip-band/.test(e.animationName)) reveal(); });
    intro.addEventListener('animationend', (e) => { if (e.target === intro && e.animationName === 'ip-gone') finish(); });
    // Skip: click, key, wheel or touch jumps straight to the reveal
    const skip = () => { if (!revealed) intro.classList.add('is-skip'); };
    intro.addEventListener('click', skip);
    ['keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, skip, { once: true, passive: true }));
    // never hold the page hostage, even if animation events don't fire
    setTimeout(reveal, 2900);
    setTimeout(finish, 4200);
  });
}

/** Curtain wipe between internal pages. */
export function initPageTransitions() {
  const curtain = document.querySelector('.curtain');
  if (!curtain || reduced) return;
  // reveal on arrival when coming from an internal link
  try {
    if (sessionStorage.getItem('lt-transition')) {
      sessionStorage.removeItem('lt-transition');
      gsap.fromTo(curtain, { scaleY: 1, transformOrigin: 'top' }, { scaleY: 0, duration: 0.9, ease: 'expo.inOut', delay: 0.05, onComplete: () => document.documentElement.classList.remove('curtain-in') });
    }
  } catch { /* ignore */ }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname.startsWith('/admin')) return;
    if (url.pathname === location.pathname) return; // same page (hash)
    e.preventDefault();
    try { sessionStorage.setItem('lt-transition', '1'); } catch { /* ignore */ }
    gsap.fromTo(curtain, { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: 0.65, ease: 'expo.inOut', onComplete: () => { location.href = url.href; } });
  });
  // bfcache restore: hide curtain
  addEventListener('pageshow', ev => { if (ev.persisted) gsap.set(curtain, { scaleY: 0 }); });
}

export function magnetic(root = document) {
  if (reduced || matchMedia('(hover: none)').matches) return;
  root.querySelectorAll('[data-magnetic]').forEach(el => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
}
