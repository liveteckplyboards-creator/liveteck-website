import { cld, srcset, esc, waLink, initials, $, $$ } from './utils.js';
import { icons } from './icons.js';
import { getSettings } from './layout.js';
import { stopScroll, startScroll, reduced } from './motion.js';

export const catName = (cats, id) => cats.find(c => c.id === id)?.name || id;

const waText = p => `Hi Liveteck Ply & Boards, I'm interested in ${p.name}. Please share price and availability.`;

export function productCard(p, cats, { reveal = true } = {}) {
  const imgs = (p.images || []).filter(Boolean);
  const many = imgs.length > 1;
  const feats = (p.features || []).slice(0, 3);
  const pic = (u, i) => `<img src="${cld(u, 'w_800,c_limit')}" srcset="${srcset(u, [480, 800, 1200])}" sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw" alt="${i ? '' : esc(p.name)}" loading="lazy" decoding="async" draggable="false" />`;
  return `
  <article class="product-card${reveal ? ' reveal' : ''}" data-product="${esc(p.id)}">
    <div class="pc-media${many ? ' has-many' : ''}" data-open-product="${esc(p.id)}" role="button" tabindex="0" aria-label="View ${esc(p.name)} details${many ? ` (${imgs.length} photos)` : ''}">
      ${many
        ? `<div class="pc-track" data-pc-track data-lenis-prevent-horizontal>${imgs.map(pic).join('')}</div>
      <span class="pc-count" aria-hidden="true">${icons.images}${imgs.length}</span>
      <span class="pc-dots" aria-hidden="true">${imgs.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</span>
      <button class="pc-arrow pc-arrow--prev" type="button" data-pc-step="-1" tabindex="-1" aria-label="Previous photo" disabled>${icons.chevron}</button>
      <button class="pc-arrow pc-arrow--next" type="button" data-pc-step="1" tabindex="-1" aria-label="Next photo">${icons.chevron}</button>`
        : pic(imgs[0] || '', 0)}
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

/* Card photo carousels: swipe (phones), arrows (hover), dots follow the scroll. Delegated, so every list gets it. */
const trackIndex = (tr) => Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth));
document.addEventListener('scroll', e => {
  const tr = e.target;
  if (!(tr instanceof Element) || !tr.matches('[data-pc-track]')) return;
  const i = trackIndex(tr), n = tr.children.length, media = tr.parentElement;
  $$('.pc-dots i', media).forEach((d, k) => d.classList.toggle('on', k === i));
  const prev = $('.pc-arrow--prev', media), next = $('.pc-arrow--next', media);
  if (prev) prev.disabled = i <= 0;
  if (next) next.disabled = i >= n - 1;
}, true);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pc-step]');
  if (!b) return;
  e.stopPropagation(); e.preventDefault();
  const tr = $('[data-pc-track]', b.parentElement);
  tr.scrollTo({ left: (trackIndex(tr) + +b.dataset.pcStep) * tr.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
}, true);

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

/**
 * Review carousel: native scroll-snap (swipe on phones, trackpad on laptops), mouse-drag on desktop,
 * arrows + one dot per review right under the cards, and the position always visible.
 */
export function reviewCarousel(box, list) {
  box.innerHTML = `
    <div class="t-carousel">
      <div class="t-slider" data-t-slider data-lenis-prevent-horizontal tabindex="0" role="region" aria-roledescription="carousel" aria-label="Customer reviews">${list.map((t, i) => testimonialCard(t, { feature: i === 0, reveal: false })).join('')}</div>
      <div class="t-controls" hidden>
        <div class="t-dots">${list.map((t, i) => `<button type="button" data-t-dot="${i}" aria-label="Review ${i + 1} of ${list.length}"></button>`).join('')}</div>
        <div class="t-nav">
          <button class="t-arrow" type="button" data-t-step="-1" aria-label="Previous review">${icons.arrow}</button>
          <button class="t-arrow" type="button" data-t-step="1" aria-label="Next review">${icons.arrow}</button>
        </div>
      </div>
    </div>`;
  const slider = $('[data-t-slider]', box);
  const controls = $('.t-controls', box);
  const cards = $$('.t-card', slider);
  const dots = $$('[data-t-dot]', box);
  const pos = (i) => cards[i].offsetLeft - cards[0].offsetLeft;
  const index = () => {
    const max = slider.scrollWidth - slider.clientWidth;
    if (slider.scrollLeft >= max - 4) return cards.length - 1;
    let best = 0; cards.forEach((c, i) => { if (Math.abs(pos(i) - slider.scrollLeft) < Math.abs(pos(best) - slider.scrollLeft)) best = i; });
    return best;
  };
  const go = (i) => slider.scrollTo({ left: pos(Math.max(0, Math.min(cards.length - 1, i))), behavior: reduced ? 'auto' : 'smooth' });
  const sync = () => {
    const max = slider.scrollWidth - slider.clientWidth;
    controls.hidden = max < 8;
    // dots for the reviews that can lead the row (the last few are all visible together at the end)
    const perView = Math.max(1, Math.round(slider.clientWidth / (cards[0]?.offsetWidth || 1)));
    const cur = index();
    dots.forEach((d, k) => {
      d.hidden = k > cards.length - perView;
      const on = k === Math.min(cur, cards.length - perView);
      d.classList.toggle('on', on);
      d.setAttribute('aria-current', String(on));
    });
    const [prev, next] = $$('[data-t-step]', box);
    prev.disabled = slider.scrollLeft < 8;
    next.disabled = slider.scrollLeft > max - 8;
  };
  controls.addEventListener('click', e => {
    const s = e.target.closest('[data-t-step]'), d = e.target.closest('[data-t-dot]');
    if (s) go(index() + +s.dataset.tStep);
    if (d) go(+d.dataset.tDot);
  });
  slider.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(slider);
  // desktop: grab and drag the row with the mouse
  let drag = null;
  slider.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, a')) return;
    drag = { x: e.clientX, left: slider.scrollLeft, moved: false };
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; slider.classList.add('is-dragging'); }
    if (drag.moved) slider.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    const moved = drag.moved; drag = null;
    if (!moved) return;
    slider.classList.remove('is-dragging');
    go(index());
  });
  sync();
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

const AUTOPLAY_MS = 4500;
let gallery = null; // the open drawer's slideshow (stopped when the drawer closes)

/**
 * Product detail drawer. The gallery is a native scroll-snap track (swipe with momentum on phones),
 * with arrows, thumbnails, left/right keys and a slideshow that advances on its own — paused while the
 * visitor hovers, touches or focuses it, when the tab is hidden, and off for reduced motion.
 */
export function openProduct(p, cats, { products = [], start = 0 } = {}) {
  const d = ensureDrawer();
  const imgs = (p.images || []).filter(Boolean);
  const many = imgs.length > 1;
  start = Math.min(Math.max(0, start), Math.max(0, imgs.length - 1));
  const s = getSettings();
  const related = products.filter(x => x.id !== p.id && x.category === p.category && x.published !== false).slice(0, 4);
  const others = related.length ? related : products.filter(x => x.id !== p.id && x.featured).slice(0, 4);
  $('.drawer-body', d).innerHTML = `
    <div class="pd">
      <div class="pd-gallery${many ? ' has-many' : ''}">
        <div class="pd-stage">
          <div class="pd-track" data-pd-track data-lenis-prevent tabindex="-1">
            ${(imgs.length ? imgs : ['']).map((u, i) => `
            <figure class="pd-slide${i === start ? ' is-active' : ''}"${many ? ` aria-roledescription="slide" aria-label="${i + 1} of ${imgs.length}"` : ''}>
              <img class="pd-bg" src="${cld(u, 'w_200,c_limit')}" alt="" aria-hidden="true" />
              <img class="pd-img" src="${cld(u, 'w_1400,c_limit')}" alt="${esc(p.name)}${many ? ` — photo ${i + 1}` : ''}" draggable="false" />
            </figure>`).join('')}
          </div>
          ${many ? `
          <div class="pd-bars" aria-hidden="true">${imgs.map(() => '<i><b></b></i>').join('')}</div>
          <button class="pd-nav pd-prev" data-pd-step="-1" aria-label="Previous image">${icons.arrow}</button>
          <button class="pd-nav pd-next" data-pd-step="1" aria-label="Next image">${icons.arrow}</button>
          <div class="pd-hud">
            <span class="pd-count" aria-live="polite"><b>${start + 1}</b> / ${imgs.length}</span>
            <button class="pd-play" type="button" data-pd-play aria-label="Pause slideshow">${icons.pause}</button>
          </div>` : ''}
        </div>
        ${many ? `<div class="pd-thumbs">${imgs.map((u, i) => `<button data-thumb="${i}" aria-label="Show image ${i + 1}" aria-current="${i === start}"><img src="${cld(u, 'w_200,h_200,c_fill')}" alt="" /><i></i></button>`).join('')}</div>` : ''}
      </div>
      <div class="pd-info">
        <div class="pd-chips">
          <span class="chip chip--line">${esc(catName(cats, p.category))}</span>
          ${p.thickness ? `<span class="chip chip--line">${esc(p.thickness)}</span>` : ''}
          ${p.badge ? `<span class="chip chip--gold">${esc(p.badge)}</span>` : ''}
        </div>
        <h2 id="pd-title">${esc(p.name)}</h2>
        <p class="pd-desc">${esc(p.description || p.short)}</p>
        ${p.features?.length ? `<div class="pd-section"><h3>Key features</h3><ul class="feat-list">${p.features.map(f => `<li>${icons.check}<span>${esc(f)}</span></li>`).join('')}</ul></div>` : ''}
        ${p.specs?.length ? `<div class="pd-section"><h3>Specifications</h3><table class="spec-table"><tbody>${p.specs.map(r => `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${p.applications?.length ? `<div class="pd-section"><h3>Ideal for</h3><ul class="tg-uses">${p.applications.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
        ${others.length ? `<div class="pd-section pd-related"><h3>${related.length ? `More in ${esc(catName(cats, p.category))}` : 'You may also like'}</h3>
          <div class="pd-rel-row">${others.map(x => `<button class="pd-rel" type="button" data-open-product="${esc(x.id)}"><span class="pd-rel-img"><img src="${cld(x.images?.[0] || '', 'w_360,c_limit')}" alt="" loading="lazy" /></span><span class="pd-rel-name">${esc(x.name)}</span>${x.thickness ? `<span class="pd-rel-meta">${esc(x.thickness)}</span>` : ''}</button>`).join('')}</div></div>` : ''}
        <p class="pd-note">Sizes, grades and availability may vary — please confirm with our team before ordering.</p>
        <div class="pd-actions">
          <button class="btn" data-enquire="${esc(p.name)}">Enquire now ${icons.arrow}</button>
          <a class="btn btn--wa" href="${waLink(s.whatsapp || '919912153030', waText(p))}" target="_blank" rel="noopener">${icons.whatsapp} WhatsApp</a>
        </div>
      </div>
    </div>`;
  d.setAttribute('aria-labelledby', 'pd-title');
  gallery?.stop();
  gallery = many ? slideshow(d, imgs.length) : null;
  imgs.forEach(u => { new Image().src = cld(u, 'w_1400,c_limit'); }); // warm the cache so every slide is instant
  const wasOpen = d.classList.contains('is-open');
  d.inert = false;
  d.classList.add('is-open');
  $('.drawer-panel', d).scrollTop = 0; // after is-open: a closed drawer's content isn't rendered (content-visibility)
  gallery?.jump(start);
  d.setAttribute('aria-hidden', 'false');
  if (!wasOpen) {
    stopScroll();
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => $('.drawer-close', d).focus(), 300);
  }
  if (history.replaceState) history.replaceState(null, '', `#${p.id}`);
}

function slideshow(d, n) {
  const track = $('[data-pd-track]', d);
  const stage = $('.pd-stage', d);
  const thumbsBox = $('.pd-thumbs', d);
  const bars = $$('.pd-bars i', d);
  const thumbs = $$('[data-thumb]', d);
  const playBtn = $('[data-pd-play]', d);
  const count = $('.pd-count b', d);
  const holds = new Set();
  let cur = -1, playing = !reduced, timer = null, t0 = 0, left = AUTOPLAY_MS;

  const running = () => playing && holds.size === 0;
  const clear = () => { clearTimeout(timer); timer = null; };
  // the active bar (and thumbnail) fills over AUTOPLAY_MS; a hold freezes it exactly where it is
  const sync = () => {
    const held = !running();
    stage.classList.toggle('is-held', held);
    thumbsBox?.classList.toggle('is-held', held);
    clear();
    if (held) return;
    t0 = performance.now();
    timer = setTimeout(() => go(cur + 1), left);
  };
  const restart = () => {
    left = AUTOPLAY_MS;
    [...bars, ...thumbs].forEach(x => x.classList.remove('run'));
    void stage.offsetWidth; // restart the CSS fill
    if (playing) { bars[cur]?.classList.add('run'); thumbs[cur]?.classList.add('run'); }
    sync();
  };
  const paint = (i) => {
    if (i === cur) return;
    cur = i;
    $$('.pd-slide', track).forEach((sl, k) => sl.classList.toggle('is-active', k === i));
    bars.forEach((b, k) => b.classList.toggle('done', k < i));
    thumbs.forEach((t, k) => t.setAttribute('aria-current', String(k === i)));
    if (count) count.textContent = i + 1;
    const t = thumbs[i];
    if (t && thumbsBox) thumbsBox.scrollTo({ left: t.offsetLeft - (thumbsBox.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    restart();
  };
  const go = (i, smooth = true) => {
    i = (i + n) % n;
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reduced ? 'smooth' : 'auto' });
    paint(i);
  };
  const hold = (k, on) => {
    if (on === holds.has(k)) return;
    if (on && timer) left = Math.max(400, left - (performance.now() - t0));
    on ? holds.add(k) : holds.delete(k);
    sync();
  };
  const setPlaying = (on) => {
    playing = on;
    if (playBtn) { playBtn.innerHTML = on ? icons.pause : icons.play; playBtn.setAttribute('aria-label', on ? 'Pause slideshow' : 'Play slideshow'); }
    stage.classList.toggle('is-stopped', !on);
    thumbsBox?.classList.toggle('is-stopped', !on);
    restart();
  };

  // swipes, trackpads and drags: follow the snap position once it settles
  let st;
  track.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => paint(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))), 70); }, { passive: true });
  $$('[data-pd-step]', d).forEach(b => b.addEventListener('click', () => go(cur + +b.dataset.pdStep)));
  thumbs.forEach(b => b.addEventListener('click', () => go(+b.dataset.thumb)));
  playBtn?.addEventListener('click', () => setPlaying(!playing));
  const gal = $('.pd-gallery', d);
  gal.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hold('hover', true); });
  gal.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hold('hover', false); });
  let tt;
  gal.addEventListener('touchstart', () => { clearTimeout(tt); hold('touch', true); }, { passive: true });
  gal.addEventListener('touchend', () => { tt = setTimeout(() => hold('touch', false), 1500); }, { passive: true });
  gal.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) hold('focus', true); });
  gal.addEventListener('focusout', () => hold('focus', false));
  const onVis = () => hold('hidden', document.hidden);
  document.addEventListener('visibilitychange', onVis);
  const onKey = (e) => {
    if (!d.classList.contains('is-open') || e.target.closest?.('input, textarea, select, .modal.is-open')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  };
  addEventListener('keydown', onKey);
  const ro = new ResizeObserver(() => track.scrollTo({ left: cur * track.clientWidth }));
  ro.observe(track);
  if (!playing) setPlaying(false);
  return {
    jump: (i) => { cur = -1; go(i, false); },
    stop: () => { clear(); clearTimeout(st); clearTimeout(tt); document.removeEventListener('visibilitychange', onVis); removeEventListener('keydown', onKey); ro.disconnect(); },
  };
}

export function closeDrawer() {
  if (!drawer) return;
  gallery?.stop(); gallery = null;
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
    if (!t || e.target.closest('[data-pc-step]')) return;
    const { products, categories } = getData();
    const p = products.find(x => x.id === t.dataset.openProduct);
    // open on the photo the card is showing; related products come from the whole catalogue
    const tr = t.querySelector?.('[data-pc-track]');
    if (p) openProduct(p, categories, { products, start: tr ? trackIndex(tr) : 0 });
  });
  document.addEventListener('keydown', e => {
    const t = e.target.closest?.('[data-open-product][role=button]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); t.click(); }
  });
}
