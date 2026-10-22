import { $, $$, waLink, telLink, esc, toast } from './utils.js';
import { icons } from './icons.js';
import { submitEnquiry } from './data.js';
import { stopScroll, startScroll, lenis, glideTo } from './motion.js';

let SETTINGS = {};

/** Bind settings into any [data-s], [data-href], [data-show] element. */
export function applySettings(s) {
  SETTINGS = s;
  $$('[data-s]').forEach(el => { const v = s[el.dataset.s]; if (v) el.textContent = v; });
  $$('[data-href]').forEach(el => {
    const t = el.dataset.href;
    if (t === 'tel' && s.phone) el.href = telLink(s.phone);
    if (t === 'wa' && s.whatsapp && !el.dataset.waText) el.href = waLink(s.whatsapp, 'Hi Liveteck Ply & Boards, I would like to know more about your products.');
    if (t === 'wa' && s.whatsapp && el.dataset.waText) el.href = waLink(s.whatsapp, el.dataset.waText);
    if (t === 'mail' && s.email) el.href = `mailto:${s.email}`;
    if (t === 'map' && s.mapLink) el.href = s.mapLink;
  });
  $$('[data-show]').forEach(el => { el.hidden = !s[el.dataset.show]; });
  $$('iframe[data-map]').forEach(f => { if (s.mapEmbed && f.dataset.loaded !== s.mapEmbed) { f.src = s.mapEmbed; f.dataset.loaded = s.mapEmbed; } });
  const soc = $('[data-socials]');
  if (soc) {
    const links = Object.entries(s.social || {}).filter(([, url]) => url);
    if (s.googleReviewUrl) links.push(['google', s.googleReviewUrl]);
    soc.innerHTML = links.map(([k, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${esc(k)}">${icons[k] || icons.arrowUpRight}</a>`).join('');
  }
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
}
export const getSettings = () => SETTINGS;

export function initHeader(page) {
  const header = $('.site-header');
  $$(`[data-nav="${page}"]`).forEach(a => a.setAttribute('aria-current', 'page'));
  $$('.mobile-menu nav a').forEach(a => { if (new URL(a.href).pathname === location.pathname) a.setAttribute('aria-current', 'page'); });

  let last = 0, ticking = false;
  const toTop = $('[data-to-top]');
  const ring = $('.tt-bar', toTop || document);
  const touch = matchMedia('(hover: none)').matches;
  toTop?.addEventListener('click', (e) => {
    // keyboard users (click with no pointer: detail 0) land back at the top, not on a button that's about to hide
    const viaKeys = e.detail === 0;
    glideTo(0, { onComplete: () => viaKeys && $('.site-header .brand')?.focus({ preventScroll: true }) });
  });
  // page height is cached (reading it on every scroll event forces a layout) and refreshed on resize
  let docH = document.documentElement.scrollHeight;
  new ResizeObserver(() => { docH = document.documentElement.scrollHeight; }).observe(document.body);
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 40);
    const hide = y > 400 && y > last && !document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', hide);
    document.body.classList.toggle('header-hidden', hide);
    // phones: only offer it when the visitor scrolls back up (or reaches the end), so it never sits on what they're reading
    const max = Math.max(1, docH - innerHeight);
    const wantsTop = !touch || y < last || y > max - 160;
    toTop?.classList.toggle('on', y > innerHeight * 1.1 && wantsTop);
    ring?.style.setProperty('--p', Math.min(1, y / max).toFixed(4));
    last = y;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  update();

  const toggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    open ? stopScroll() : startScroll();
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  toggle?.addEventListener('click', () => { setFab(false); setMenu(!document.body.classList.contains('menu-open')); });

  // floating contact button: one tap opens WhatsApp / Call / Enquiry
  const fab = $('[data-fab]');
  const fabBtn = $('.fab-main', fab || document);
  function setFab(open) {
    if (!fab) return;
    fab.classList.toggle('is-open', open);
    document.body.classList.toggle('fab-open', open);
    fabBtn.setAttribute('aria-expanded', String(open));
    fabBtn.setAttribute('aria-label', open ? 'Close contact options' : 'Contact options: WhatsApp, call or enquiry');
  }
  fabBtn?.addEventListener('click', () => setFab(!fab.classList.contains('is-open')));
  fab?.addEventListener('click', e => { if (e.target.closest('.fab-item')) setTimeout(() => setFab(false), 50); });
  document.addEventListener('click', e => { if (fab?.classList.contains('is-open') && !fab.contains(e.target)) setFab(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && fab?.classList.contains('is-open')) { setFab(false); fabBtn.focus(); } });
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });
}

/* ---------- enquiry modal ---------- */
let lastFocus = null;
export function openModal(id, { product = '' } = {}) {
  const m = document.getElementById(id);
  if (!m) return;
  lastFocus = document.activeElement;
  if (product) { const sel = $('[data-product-select]', m); if (sel) sel.value = product; }
  m.inert = false;
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  stopScroll();
  document.documentElement.style.overflow = 'hidden';
  setTimeout(() => $('input:not(.hp), select, textarea', m)?.focus(), 250);
}
export function closeModal(m) {
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
  m.inert = true;
  if (!$('.drawer.is-open')) { startScroll(); document.documentElement.style.overflow = ''; }
  lastFocus?.focus?.();
}

export function fillProductSelects(products) {
  $$('[data-product-select]').forEach(sel => {
    const cur = sel.value;
    sel.innerHTML = '<option value="">General enquiry</option>' + products.map(p => `<option>${esc(p.name)}</option>`).join('');
    sel.value = cur;
  });
}

const PHONE_RE = /^[+()\d\s-]{8,20}$/;

/** Validates + submits any [data-enquiry-form] to Firestore. */
export function initEnquiryForms() {
  document.addEventListener('click', e => {
    const trig = e.target.closest('[data-enquire]');
    if (trig) { e.preventDefault(); openModal('enquiry-modal', { product: trig.dataset.enquire || '' }); }
    const close = e.target.closest('[data-close]');
    if (close) closeModal(close.closest('.modal'));
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.is-open').forEach(closeModal); });

  $$('[data-enquiry-form]').forEach(form => {
    const status = $('.form-status', form);
    const waBtn = $('[data-wa-from-form]', form);
    const buildWa = () => {
      const d = Object.fromEntries(new FormData(form));
      const lines = ['Hi Liveteck Ply & Boards,'];
      if (d.product) lines.push(`I'm interested in: ${d.product}`);
      if (d.message) lines.push(d.message);
      if (d.name) lines.push(`— ${d.name}${d.city ? `, ${d.city}` : ''}`);
      return waLink(SETTINGS.whatsapp || '919912153030', lines.join('\n'));
    };
    waBtn?.addEventListener('click', () => { waBtn.href = buildWa(); });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.website?.value) return; // honeypot
      let ok = true;
      $$('.field', form).forEach(f => f.classList.remove('invalid'));
      const name = form.name; const phone = form.phone;
      if (!name.value.trim()) { name.closest('.field').classList.add('invalid'); ok = false; }
      if (!PHONE_RE.test(phone.value.trim())) { phone.closest('.field').classList.add('invalid'); ok = false; }
      if (form.email && form.email.value && !/^\S+@\S+\.\S+$/.test(form.email.value)) { form.email.closest('.field').classList.add('invalid'); ok = false; }
      if (!ok) { $('.invalid input, .invalid textarea', form)?.focus(); return; }
      const btn = $('button[type=submit]', form);
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending…';
      status.className = 'form-status';
      try {
        await submitEnquiry(Object.fromEntries(new FormData(form)));
        status.className = 'form-status ok';
        status.textContent = 'Thank you! Your enquiry has reached us — we will call you back shortly.';
        form.reset();
        toast('Enquiry sent — thank you!');
        const modal = form.closest('.modal');
        if (modal) setTimeout(() => { closeModal(modal); status.className = 'form-status'; }, 2600);
      } catch (err) {
        console.error(err);
        status.className = 'form-status bad';
        status.innerHTML = `Sorry, we couldn’t send that right now. Please call <a href="${telLink(SETTINGS.phone || '+919912153030')}"><b>${esc(SETTINGS.phone || '+91 99121 53030')}</b></a> or use WhatsApp.`;
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  });
}

/** Global <img> error fallback → show branded gradient behind. */
export function initImageFallback() {
  document.addEventListener('error', e => {
    const t = e.target;
    if (t.tagName === 'IMG') { t.classList.add('is-missing'); t.parentElement?.classList.add('media-fallback'); }
  }, true);
}

export { lenis };
