import { cld, srcset, esc, waLink, initials, $, $$ } from './utils.js';
import { icons } from './icons.js';
import { getSettings } from './layout.js';
import { stopScroll, startScroll } from './motion.js';

export const catName = (cats, id) => cats.find(c => c.id === id)?.name || id;

const waText = p => `Hi Liveteck Ply & Boards, I'm interested in ${p.name}. Please share price and availability.`;

export function productCard(p, cats, { reveal = true } = {}) {
  const image = p.images?.[0] || '';
  const feats = (p.features || []).slice(0, 3);
  return `
  <article class="product-card${reveal ? ' reveal' : ''}" data-product="${esc(p.id)}">
    <div class="pc-media" data-open-product="${esc(p.id)}" role="button" tabindex="0" aria-label="View ${esc(p.name)} details">
      <img src="${cld(image, 'w_800,c_limit')}" srcset="${srcset(image, [480, 800, 1200])}" sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw" alt="${esc(p.name)}" loading="lazy" decoding="async" />
      ${p.badge ? `<span class="chip chip--gold pc-badge">${esc(p.badge)}</span>` : ''}
      <span class="pc-view" aria-hidden="true">View details ${icons.arrowUpRight}</span>
    </div>
    <div class="pc-body">
      <div class="pc-meta"><span class="pc-cat">${esc(catName(cats, p.category))}</span>${p.thickness ? `<span class="pc-thick">${esc(p.thickness)}</span>` : ''}</div>
      <h3><button data-open-product="${esc(p.id)}">${esc(p.name)}</button></h3>
      <p class="pc-desc">${esc(p.short)}</p>
      ${feats.length ? `<ul class="pc-feats">${feats.map(f => `<li>${icons.check}<span>${esc(f)}</span></li>`).join('')}</ul>` : ''}
    </div>
    <div class="pc-actions">
      <button class="pc-enq" data-enquire="${esc(p.name)}">Enquire now ${icons.arrow}</button>
      <a class="pc-wa" href="${waLink(getSettings().whatsapp || '919912153030', waText(p))}" target="_blank" rel="noopener" aria-label="WhatsApp about ${esc(p.name)}">${icons.whatsapp}<span>WhatsApp</span></a>
    </div>
  </article>`;
}

/** Placeholder cards shown while live data loads on a first visit. */
export function skeletonCards(n = 3) {
  return `<div class="sk-row" role="status" aria-label="Loading reviews">${Array.from({ length: n }, () => `
    <div class="sk-card" aria-hidden="true"><i class="sk sk-line" style="width:38%"></i><i class="sk sk-block"></i><i class="sk sk-line"></i><i class="sk sk-line" style="width:70%"></i>
      <div class="sk-who"><i class="sk sk-circle"></i><i class="sk sk-line" style="width:46%"></i></div></div>`).join('')}</div>`;
}

export function stars(n = 5) {
  return `<div class="t-stars" aria-label="${n} out of 5 stars">${Array.from({ length: 5 }, (_, i) => `<span style="opacity:${i < n ? 1 : 0.22}">${icons.star}</span>`).join('')}</div>`;
}

export function testimonialCard(t, { feature = false, reveal = true } = {}) {
  const who = [t.role, t.company, t.city].filter(Boolean).join(' · ');
  const msg = String(t.message || '');
  const long = msg.length > 240 || msg.split(/\s+/).some(w => w.length > 40);
  return `
  <figure class="t-card${feature ? ' feature' : ''}${reveal ? ' reveal' : ''}">
    ${stars(t.rating || 5)}
    <blockquote class="t-quote${long ? ' is-clamped' : ''}">“${esc(msg)}”</blockquote>
    ${long ? '<button class="t-more" type="button" aria-expanded="false" data-t-more>Read more</button>' : ''}
    <figcaption class="t-who">
      <span class="t-avatar">${t.photo ? `<img src="${cld(t.photo, 'w_120,h_120,c_fill,g_face')}" alt="" loading="lazy" />` : esc(initials(t.name))}</span>
      <span class="t-id"><b>${esc(t.name)}</b>${who ? `<span>${esc(who)}</span>` : ''}</span>
    </figcaption>
  </figure>`;
}

/** "Read more" on long reviews (delegated, works for every list). */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-t-more]');
  if (!b) return;
  const q = b.previousElementSibling;
  const open = q.classList.toggle('is-open');
  b.setAttribute('aria-expanded', String(open));
  b.textContent = open ? 'Show less' : 'Read more';
});

/* ---------- product detail drawer ---------- */
let drawer;
function ensureDrawer() {
  if (drawer) return drawer;
  drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.inert = true;
  drawer.innerHTML = '<div class="drawer-backdrop" data-drawer-close></div><div class="drawer-panel" data-lenis-prevent><button class="drawer-close" data-drawer-close aria-label="Close">' + icons.close + '</button><div class="drawer-body"></div></div>';
  document.body.appendChild(drawer);
  drawer.addEventListener('click', e => { if (e.target.closest('[data-drawer-close]')) closeDrawer(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer(); });
  return drawer;
}

export function openProduct(p, cats) {
  const d = ensureDrawer();
  const imgs = (p.images || []).filter(Boolean);
  const s = getSettings();
  $('.drawer-body', d).innerHTML = `
    <div class="pd">
      <div class="pd-gallery">
        <div class="pd-main">
          <img class="pd-bg" src="${cld(imgs[0], 'w_200,c_limit')}" alt="" aria-hidden="true" />
          <img class="pd-img" src="${cld(imgs[0], 'w_1400,c_limit')}" alt="${esc(p.name)}" />
          ${imgs.length > 1 ? `
          <button class="pd-nav pd-prev" data-pd-step="-1" aria-label="Previous image">${icons.arrow}</button>
          <button class="pd-nav pd-next" data-pd-step="1" aria-label="Next image">${icons.arrow}</button>
          <span class="pd-count" aria-live="polite"><b>1</b> / ${imgs.length}</span>` : ''}
        </div>
        ${imgs.length > 1 ? `<div class="pd-thumbs">${imgs.map((u, i) => `<button data-thumb="${i}" aria-label="Image ${i + 1}" aria-current="${i === 0}"><img src="${cld(u, 'w_200,h_200,c_fill')}" alt="" /></button>`).join('')}</div>` : ''}
      </div>
      <div class="pd-info">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="chip chip--line">${esc(catName(cats, p.category))}</span>
          ${p.thickness ? `<span class="chip chip--line">${esc(p.thickness)}</span>` : ''}
          ${p.badge ? `<span class="chip chip--gold">${esc(p.badge)}</span>` : ''}
        </div>
        <h2 id="pd-title">${esc(p.name)}</h2>
        <p class="pd-desc">${esc(p.description || p.short)}</p>
        ${p.features?.length ? `<div class="pd-section"><h3>Key features</h3><ul class="feat-list">${p.features.map(f => `<li>${icons.check}<span>${esc(f)}</span></li>`).join('')}</ul></div>` : ''}
        ${p.specs?.length ? `<div class="pd-section"><h3>Specifications</h3><table class="spec-table"><tbody>${p.specs.map(r => `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${p.applications?.length ? `<div class="pd-section"><h3>Ideal for</h3><ul class="tg-uses">${p.applications.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
        <div class="pd-actions">
          <button class="btn" data-enquire="${esc(p.name)}">Enquire now ${icons.arrow}</button>
          <a class="btn btn--wa" href="${waLink(s.whatsapp || '919912153030', waText(p))}" target="_blank" rel="noopener">${icons.whatsapp} WhatsApp</a>
        </div>
        <p class="pd-note">Sizes, grades and availability may vary — please confirm with our team before ordering.</p>
      </div>
    </div>`;
  d.setAttribute('aria-labelledby', 'pd-title');
  let cur = 0;
  const show = (i) => {
    cur = (i + imgs.length) % imgs.length;
    const main = $('.pd-img', d);
    main.classList.add('is-swap');
    const next = new Image();
    next.onload = next.onerror = () => { main.src = next.src; $('.pd-bg', d).src = cld(imgs[cur], 'w_200,c_limit'); main.classList.remove('is-swap'); };
    next.src = cld(imgs[cur], 'w_1400,c_limit');
    $$('[data-thumb]', d).forEach(x => x.setAttribute('aria-current', String(+x.dataset.thumb === cur)));
    const c = $('.pd-count b', d); if (c) c.textContent = cur + 1;
  };
  imgs.slice(1).forEach(u => { new Image().src = cld(u, 'w_1400,c_limit'); }); // warm the cache so switching is instant
  $$('[data-thumb]', d).forEach(b => b.addEventListener('click', () => show(+b.dataset.thumb)));
  $$('[data-pd-step]', d).forEach(b => b.addEventListener('click', () => show(cur + +b.dataset.pdStep)));
  // swipe between images on touch screens
  const mainBox = $('.pd-main', d);
  let sx = null;
  mainBox.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  mainBox.addEventListener('touchend', e => {
    if (sx === null || imgs.length < 2) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
  d.inert = false;
  d.classList.add('is-open');
  $('.drawer-panel', d).scrollTop = 0; // after is-open: a closed drawer's content isn't rendered (content-visibility)
  d.setAttribute('aria-hidden', 'false');
  stopScroll();
  document.documentElement.style.overflow = 'hidden';
  setTimeout(() => $('.drawer-close', d).focus(), 300);
  if (history.replaceState) history.replaceState(null, '', `#${p.id}`);
}

export function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.inert = true;
  startScroll();
  document.documentElement.style.overflow = '';
  if (history.replaceState && location.hash) history.replaceState(null, '', location.pathname + location.search);
}

/** Enquire buttons inside the drawer open the modal on top. */
export function bindProductOpeners(getData) {
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open-product]');
    if (!t) return;
    const { products, categories } = getData();
    const p = products.find(x => x.id === t.dataset.openProduct);
    if (p) openProduct(p, categories);
  });
  document.addEventListener('keydown', e => {
    const t = e.target.closest?.('[data-open-product][role=button]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); t.click(); }
  });
}
