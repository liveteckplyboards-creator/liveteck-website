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
      <div class="pc-tags">
        ${p.thickness ? `<span class="chip">${esc(p.thickness)}</span>` : '<span></span>'}
        ${p.badge ? `<span class="chip chip--gold">${esc(p.badge)}</span>` : ''}
      </div>
    </div>
    <div class="pc-body">
      <span class="pc-cat">${esc(catName(cats, p.category))}</span>
      <h3><button data-open-product="${esc(p.id)}">${esc(p.name)}</button></h3>
      <p>${esc(p.short)}</p>
      ${feats.length ? `<ul class="pc-feats">${feats.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      <div class="pc-actions">
        <button class="btn btn--sm" data-enquire="${esc(p.name)}">Enquire now ${icons.arrow}</button>
        <a class="icon-btn icon-btn--wa" href="${waLink(getSettings().whatsapp || '919912153030', waText(p))}" target="_blank" rel="noopener" aria-label="WhatsApp about ${esc(p.name)}">${icons.whatsapp}</a>
      </div>
    </div>
  </article>`;
}

export function stars(n = 5) {
  return `<div class="t-stars" aria-label="${n} out of 5 stars">${Array.from({ length: 5 }, (_, i) => `<span style="opacity:${i < n ? 1 : 0.22}">${icons.star}</span>`).join('')}</div>`;
}

export function testimonialCard(t, { feature = false, reveal = true } = {}) {
  const who = [t.role, t.company, t.city].filter(Boolean).join(' · ');
  return `
  <figure class="t-card${feature ? ' feature' : ''}${reveal ? ' reveal' : ''}">
    ${stars(t.rating || 5)}
    <blockquote>“${esc(t.message)}”</blockquote>
    <figcaption class="t-who">
      <span class="t-avatar">${t.photo ? `<img src="${cld(t.photo, 'w_120,h_120,c_fill,g_face')}" alt="" loading="lazy" />` : esc(initials(t.name))}</span>
      <span><b>${esc(t.name)}</b>${who ? `<span>${esc(who)}</span>` : ''}</span>
    </figcaption>
  </figure>`;
}

/* ---------- product detail drawer ---------- */
let drawer;
function ensureDrawer() {
  if (drawer) return drawer;
  drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-hidden', 'true');
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
        <div class="pd-main"><img src="${cld(imgs[0], 'w_1200,c_limit')}" alt="${esc(p.name)}" /></div>
        ${imgs.length > 1 ? `<div class="pd-thumbs">${imgs.map((u, i) => `<button data-thumb="${i}" aria-current="${i === 0}"><img src="${cld(u, 'w_160,h_160,c_fill')}" alt="" /></button>`).join('')}</div>` : ''}
      </div>
      <div class="pd-info">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="chip chip--line">${esc(catName(cats, p.category))}</span>
          ${p.thickness ? `<span class="chip chip--line">${esc(p.thickness)}</span>` : ''}
          ${p.badge ? `<span class="chip chip--gold">${esc(p.badge)}</span>` : ''}
        </div>
        <h2 id="pd-title">${esc(p.name)}</h2>
        <p class="pd-desc">${esc(p.description || p.short)}</p>
        ${p.features?.length ? `<div class="pd-section"><h4>Key features</h4><ul class="feat-list">${p.features.map(f => `<li>${icons.check}<span>${esc(f)}</span></li>`).join('')}</ul></div>` : ''}
        ${p.specs?.length ? `<div class="pd-section"><h4>Specifications</h4><table class="spec-table"><tbody>${p.specs.map(r => `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${p.applications?.length ? `<div class="pd-section"><h4>Ideal for</h4><ul class="tg-uses">${p.applications.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
        <div class="pd-actions">
          <button class="btn" data-enquire="${esc(p.name)}">Enquire now ${icons.arrow}</button>
          <a class="btn btn--wa" href="${waLink(s.whatsapp || '919912153030', waText(p))}" target="_blank" rel="noopener">${icons.whatsapp} WhatsApp</a>
        </div>
        <p class="pd-note">Sizes, grades and availability may vary — please confirm with our team before ordering.</p>
      </div>
    </div>`;
  d.setAttribute('aria-labelledby', 'pd-title');
  $$('[data-thumb]', d).forEach(b => b.addEventListener('click', () => {
    $('.pd-main img', d).src = cld(imgs[+b.dataset.thumb], 'w_1200,c_limit');
    $$('[data-thumb]', d).forEach(x => x.setAttribute('aria-current', String(x === b)));
  }));
  $('.drawer-panel', d).scrollTop = 0;
  d.classList.add('is-open');
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
