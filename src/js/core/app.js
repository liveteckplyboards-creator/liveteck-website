import '../../styles/main.css';
import { initialData, loadData } from './data.js';
import { applySettings, initHeader, initEnquiryForms, initImageFallback, fillProductSelects } from './layout.js';
import { initSmoothScroll, initReveals, runIntro, initPageTransitions, magnetic, ScrollTrigger, reduced } from './motion.js';
import { cldVideo } from './utils.js';
import { vid } from './defaults.js';

/**
 * Page bootstrap.
 * page.render(data, first) paints data-driven parts (called with cached data, then live data if it changed).
 * page.intro() runs entrance animations once the loader is done.
 * page.motion() sets up scroll-driven scenes (after first render).
 */
export async function boot(name, page = {}) {
  window.__ltBooted = true;
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
  initBgVideos();

  const fresh = loadData().catch(err => { console.warn('[liveteck] live data unavailable', err); return null; });

  await runIntro();
  page.intro?.();
  page.motion?.(data);
  initReveals();
  magnetic();
  requestAnimationFrame(() => ScrollTrigger.refresh());

  const live = await fresh;
  if (live && JSON.stringify(strip(live)) !== JSON.stringify(strip(data))) {
    data = live;
    applySettings(data.settings);
    fillProductSelects(data.products);
    page.render?.(data, false);
    initReveals();
    ScrollTrigger.refresh();
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

const strip = d => ({ ...d, testimonials: (d.testimonials || []).map(({ createdAt, ...t }) => t) });

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

/** Ambient background films: <div data-bg-video="video/veneer-film"> gets a muted loop if the file exists. */
function initBgVideos() {
  const saveData = navigator.connection?.saveData;
  if (reduced || saveData) return;
  document.querySelectorAll('[data-bg-video]').forEach(box => {
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'none' });
    v.className = 'bg-video';
    v.setAttribute('aria-hidden', 'true');
    v.addEventListener('canplay', () => { v.classList.add('on'); v.play().catch(() => {}); }, { once: true });
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
