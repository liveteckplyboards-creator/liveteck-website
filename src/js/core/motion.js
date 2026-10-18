import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export let lenis = null;
export { gsap, ScrollTrigger };

export function initSmoothScroll() {
  if (reduced) return null;
  lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // in-page anchors
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const el = document.querySelector(a.getAttribute('href'));
    if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -80 }); }
  });
  return lenis;
}

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();

/** Split element text into masked lines of words for reveal animations. */
export function splitLines(el) {
  if (el.dataset.split) return el.querySelectorAll('.split-line > span');
  el.dataset.split = '1';
  // preserve <em>/<br> by splitting on <br>
  const chunks = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = chunks.map(c => `<span class="split-line"><span>${c.trim()}</span></span>`).join('');
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

export function initReveals(root = document) {
  if (reduced) {
    root.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    root.querySelectorAll('.img-reveal').forEach(el => { el.style.clipPath = 'none'; });
    return;
  }
  // fade-up blocks, batched for stagger
  ScrollTrigger.batch(root.querySelectorAll('.reveal:not([data-revealed])'), {
    start: 'top 88%',
    onEnter: batch => {
      batch.forEach(el => el.setAttribute('data-revealed', ''));
      gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true });
    },
  });
  // headline line reveals
  root.querySelectorAll('[data-split]:not([data-split="1"])').forEach(el => {
    const lines = splitLines(el);
    gsap.set(lines, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(lines, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.1 }),
    });
  });
  // image wipe reveals
  root.querySelectorAll('.img-reveal').forEach(el => {
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
  // parallax media
  root.querySelectorAll('[data-parallax]').forEach(el => {
    const amt = parseFloat(el.dataset.parallax) || 12;
    gsap.fromTo(el, { yPercent: -amt / 2 }, {
      yPercent: amt / 2, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  // counters
  root.querySelectorAll('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count);
    const obj = { v: parseFloat(el.dataset.from || 0) };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.firstChild.nodeValue = Math.round(obj.v); } }),
    });
  });
}

/**
 * Opening intro: plywood plies stack up → are pressed into a gold line → the logo builds
 * (K ply by ply, wordmark wipe, rules, sub-line, sprout grows) → the screen splits into
 * ply strips that slide away. Resolves when the reveal starts so the hero animates in underneath.
 */
export function runIntro() {
  const root = document.documentElement;
  const intro = document.querySelector('.intro');
  try { sessionStorage.setItem('lt-visited', '1'); } catch { /* ignore */ }
  const done = () => { root.classList.remove('intro-active'); intro?.remove(); lenis?.start(); };
  if (!intro || root.classList.contains('no-loader') || reduced) { done(); return Promise.resolve(); }
  lenis?.stop();

  const $ = (s) => intro.querySelectorAll(s);
  const plies = $('.intro-plies span');
  const kParts = [...$('.il-k')].reverse(); // stem first, then arm, then the thin plies
  const count = intro.querySelector('.intro-count b');
  const counter = { v: 0 };
  const isMobile = innerWidth < 760;

  gsap.set($('.intro-logo'), { autoAlpha: 0 });
  gsap.set(plies, { yPercent: -260, autoAlpha: 0, scaleX: 0.92 });
  gsap.set(kParts, { xPercent: 40, autoAlpha: 0 });
  gsap.set($('.il-word'), { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set($('.il-sub'), { clipPath: 'inset(0% 50% 0% 50%)' });
  gsap.set($('.il-rule'), { scaleX: 0, transformOrigin: '50% 50%' });
  gsap.set($('.il-leaf'), { scale: 0, rotate: -14, transformOrigin: '50% 100%' });
  gsap.set($('.intro-tag > *'), { autoAlpha: 0, y: 12 });
  gsap.set($('.intro-meta > *'), { autoAlpha: 0 });

  let resolveReveal;
  const revealed = new Promise(r => { resolveReveal = r; });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: done });
  tl.to($('.intro-meta > *'), { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, 0)
    .to(counter, { v: 100, duration: 2.5, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0)
    // 1. plies drop in and stack
    .to(plies, { yPercent: 0, autoAlpha: 1, scaleX: 1, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.085 }, 0.1)
    // 2. pressed into a single gold line
    .to(plies, { scaleY: 0.18, duration: 0.42, ease: 'power3.in' }, 1.0)
    .to($('.intro-plies'), { gap: 0, duration: 0.42, ease: 'power3.in' }, 1.0)
    .add(() => intro.querySelector('.intro-plies').classList.add('is-pressed'), 1.22)
    .to($('.intro-plies'), { scaleX: 1.35, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 1.38)
    // 3. the logo builds
    .to($('.intro-logo'), { autoAlpha: 1, duration: 0.01 }, 1.5)
    .to(kParts, { xPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.09 }, 1.5)
    .to($('.il-word'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'expo.inOut' }, 1.55)
    .to($('.il-rule'), { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, 1.85)
    .to($('.il-sub'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut' }, 1.95)
    .to($('.il-leaf'), { scale: 1, rotate: 0, duration: 0.9, ease: 'back.out(2)' }, 2.15)
    .to($('.intro-tag > *'), { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 2.3)
    .to($('.intro-glow'), { scale: 1.25, opacity: 0.7, duration: 1.4, ease: 'sine.inOut' }, 1.5)
    // 4. exit: logo lifts, ply strips slide away alternately
    .addLabel('exit', 2.95)
    .to($('.intro-stage'), { scale: 0.94, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, 'exit')
    .to($('.intro-meta, .intro-skip, .intro-glow'), { autoAlpha: 0, duration: 0.4 }, 'exit')
    .add(() => { intro.style.pointerEvents = 'none'; resolveReveal(); }, 'exit+=0.35')
    .to($('.intro-bands i'), {
      xPercent: (i) => (i % 2 ? 101 : -101), duration: isMobile ? 0.85 : 1.05, ease: 'expo.inOut',
      stagger: { each: 0.055, from: 'center' },
    }, 'exit+=0.3');

  // Skip: click, key, wheel or touch jumps straight to the reveal
  let skipped = false;
  const skip = () => {
    if (skipped || tl.time() >= tl.labels.exit) return;
    skipped = true;
    tl.timeScale(1).seek('exit');
  };
  intro.addEventListener('click', skip);
  ['keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, skip, { once: true, passive: true }));

  // never hold the page hostage
  setTimeout(() => { if (!skipped && tl.time() < tl.labels.exit) skip(); }, 6000);
  return revealed;
}

/** Curtain wipe between internal pages. */
export function initPageTransitions() {
  const curtain = document.querySelector('.curtain');
  if (!curtain || reduced) return;
  // reveal on arrival when coming from an internal link
  try {
    if (sessionStorage.getItem('lt-transition')) {
      sessionStorage.removeItem('lt-transition');
      gsap.fromTo(curtain, { scaleY: 1, transformOrigin: 'top' }, { scaleY: 0, duration: 0.9, ease: 'expo.inOut', delay: 0.05 });
    }
  } catch { /* ignore */ }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
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
