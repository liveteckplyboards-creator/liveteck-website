import { initialData, loadData, watchData } from './data.js';
import { applySettings, initHeader, initEnquiryForms, initImageFallback, fillProductSelects } from './layout.js';
import { initSmoothScroll, initReveals, initParallax, runIntro, initPageTransitions, magnetic, initSectionMotion, ScrollTrigger, loadScrollTrigger, reduced, idle, glideTo } from './motion.js';
import { cldVideo, $ } from './utils.js';
import { initFaq } from './faq.js';
import { vid } from './defaults.js';

const loaded = new Promise(res => (document.readyState === 'complete' ? res() : addEventListener('load', res, { once: true })));
/** Resolves once the page has loaded and the main thread has had a quiet moment. */
export const afterLoad = (delay = 600) => loaded.then(() => new Promise(r => setTimeout(r, delay))).then(() => idle(null, 2000));
/** Resolves on the visitor's first interaction — decorative films wait for it so they never compete with first paint/LCP. */
export const engaged = new Promise(res => {
  const evs = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown'];
  const go = () => { evs.forEach(e => removeEventListener(e, go, true)); res(); };
  evs.forEach(e => addEventListener(e, go, { capture: true, passive: true }));
});
export const whenEngaged = () => Promise.all([afterLoad(200), engaged]);

/**
 * Page bootstrap.
 * page.render(data, first) paints data-driven parts (cached/default data first, then live data if it changed).
 * page.intro() runs entrance animations once the opening intro (Home) reveals the page.
 * page.motion() sets up scroll-driven scenes — scheduled in idle time so it never blocks first paint.
 * page.ready() (optional) resolves once content the scenes measure has been rendered.
 */
export async function boot(name, page = {}) {
  window.__ltBooted = true;
  lockZoom();
  initImageFallback();
  initFocusTrap();
  initSmoothScroll();
  initHeader(name);
  initPageTransitions();

  let data = initialData();
  applySettings(data.settings);
  fillProductSelects(data.products);
  page.render?.(data, true);
  initEnquiryForms();
  initFaq();
  initReveals();

  const fresh = loadData().catch(err => { console.warn('[liveteck] live data unavailable', err); return null; });

  await runIntro();
  page.intro?.();
  // Scroll-driven scenes only matter once the visitor interacts (pointer, touch, wheel, scroll or key):
  // set them up then, in idle time — never in the loading window.
  let motionReady = null, motionLive = false;
  // one shared promise: a second caller (the #section landing below) waits for the scenes to be finished
  const setupMotion = () => (motionReady ||= (async () => {
    await Promise.all([page.ready?.(), loadScrollTrigger()]);
    await idle(() => page.motion?.(data));
    await idle(() => { initSectionMotion(); initParallax(); magnetic(); ScrollTrigger.refresh(); motionLive = true; });
  })());
  engaged.then(setupMotion);

  const update = (next) => {
    if (!next || sig(next) === sig(data)) return;
    data = next;
    applySettings(data.settings);
    fillProductSelects(data.products);
    page.render?.(data, false);
    initReveals();
    if (motionLive) { initParallax(); ScrollTrigger.refresh(); }
  };
  update(await fresh);
  page.loaded?.(data);
  // arriving through a link to a section (/about.html#story, /#thickness): build the scroll scenes first
  // (pinned sections change the page height), then glide there and settle once more
  if (!page.ownHash && location.hash.length > 1) {
    let el = null;
    try { el = $(decodeURIComponent(location.hash)); } catch { /* not a selector */ }
    if (el) {
      await setupMotion();
      setTimeout(() => glideTo(el, { offset: -80, onComplete: () => glideTo(el, { offset: -80 }) }), 150);
    }
  }
  loaded.then(() => { if (motionLive) ScrollTrigger.refresh(); });
  whenEngaged().then(initBgVideos);
  // admin edits appear on open pages without a reload
  whenEngaged().then(() => watchData(update)).catch(() => {});
}

/** Stable signature of the visible data (sorted keys, no timestamps/flags) — re-render only on real changes. */
const sig = ({ settings, categories, products, testimonials }) => {
  const norm = (v) => {
    if (Array.isArray(v)) return v.map(norm);
    if (v && typeof v === 'object') return Object.keys(v).filter(k => !['updatedAt', 'createdAt'].includes(k)).sort().reduce((o, k) => ((o[k] = norm(v[k])), o), {});
    return v;
  };
  return JSON.stringify(norm({ settings, categories, products, testimonials }));
};

/** Keep Tab focus inside an open modal/drawer. */
function initFocusTrap() {
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const box = document.querySelector('.modal.is-open .modal-card') || document.querySelector('.drawer.is-open .drawer-panel');
    if (!box) return;
    const f = [...box.querySelectorAll('a[href], button:not([disabled]), input:not([type=hidden]):not(.hp), select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

/** Ambient background films: <div data-bg-video="video/veneer-film"> gets a muted loop once loaded & visible. */
function initBgVideos() {
  const conn = navigator.connection;
  if (reduced || conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) return;
  document.querySelectorAll('[data-bg-video]').forEach(box => {
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'none' });
    v.className = 'bg-video';
    v.setAttribute('aria-hidden', 'true');
    v.tabIndex = -1;
    v.addEventListener('playing', () => v.classList.add('on'), { once: true });
    v.addEventListener('canplay', () => v.play().catch(() => {}), { once: true });
    v.addEventListener('error', () => v.remove(), { once: true });
    box.appendChild(v);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) { v.pause(); return; }
      if (!v.src) { v.preload = 'auto'; v.src = cldVideo(vid(box.dataset.bgVideo), innerWidth < 760 ? 'w_960' : 'w_1600'); }
      else v.play().catch(() => {});
    }, { rootMargin: '200px' });
    io.observe(box);
  });
}

/**
 * The site keeps one fixed scale (client request): no pinch or double-tap zoom on phones, no
 * Ctrl/⌘ + wheel, trackpad pinch or Ctrl/⌘ +/− on desktop. Scrolling and swiping are untouched.
 * Phones: the viewport meta (Android) and touch-action (CSS) cover it; iOS Safari ignores both for
 * pinch, so its gesture events are cancelled here too. Product photos keep their own zoom.
 */
function lockZoom() {
  const stop = (e) => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, stop, { passive: false }));
  // iOS only (Android obeys the viewport meta): a blocking touch listener elsewhere would only slow scrolling
  const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false, capture: true });
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && ['=', '+', '-', '_', '0'].includes(e.key)) e.preventDefault();
  }, { capture: true });
}
