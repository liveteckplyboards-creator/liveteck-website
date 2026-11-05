import { boot } from '../core/app.js';
import { gsap, reduced, stopScroll, startScroll } from '../core/motion.js';
import { $, $$, esc, cld } from '../core/utils.js';
import { initialGallery, loadGallery } from '../core/data.js';

/**
 * Gallery: photos the owner switches on in admin → Gallery. Album chips filter the grid;
 * tapping a photo opens a full-screen viewer (swipe on phones, arrow keys on desktop).
 */
let ALL = [];
let album = '';
const shown = () => (album ? ALL.filter(g => g.album === album) : ALL);
const sig = (list) => list.map(g => `${g.id}|${g.url}|${g.caption}|${g.album}`).join('§');

function paint(list) {
  if (sig(list) === sig(ALL) && $('[data-gal-grid] .gal-item')) return;
  ALL = list;
  const albums = [...new Set(list.map(g => g.album).filter(Boolean))];
  if (album && !albums.includes(album)) album = '';
  $('[data-gal-tools]').innerHTML = albums.length > 1 ? `
    <div class="t-chips" role="toolbar" aria-label="Filter photos by album">
      <button class="filter-btn" type="button" data-album="" aria-pressed="${!album}">All <i>${list.length}</i></button>
      ${albums.map(a => `<button class="filter-btn" type="button" data-album="${esc(a)}" aria-pressed="${album === a}">${esc(a)} <i>${list.filter(g => g.album === a).length}</i></button>`).join('')}
    </div>` : '';
  drawGrid();
}

function drawGrid() {
  const list = shown();
  const grid = $('[data-gal-grid]');
  grid.innerHTML = list.length ? list.map((g, i) => `
    <button type="button" class="gal-item ${i % 7 === 0 ? 'is-wide' : ''}" data-i="${i}" aria-label="View photo${g.caption ? `: ${esc(g.caption)}` : ''}">
      <img src="${esc(cld(g.url, 'w_900,c_limit'))}" srcset="${esc(cld(g.url, 'w_480,c_limit'))} 480w, ${esc(cld(g.url, 'w_900,c_limit'))} 900w, ${esc(cld(g.url, 'w_1400,c_limit'))} 1400w" sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw" alt="${esc(g.caption || '')}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" />
      ${g.caption || g.album ? `<span class="gal-cap">${g.album ? `<small>${esc(g.album)}</small>` : ''}${g.caption ? `<b>${esc(g.caption)}</b>` : ''}</span>` : ''}
    </button>`).join('') : '<p class="t-none">No photos in this album yet.</p>';
  grid.classList.remove('is-loading');
  fillLastRow();
  $$('[data-album]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.album === album)));
  if (!reduced) gsap.fromTo($$('.gal-item', grid), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, stagger: .04, ease: 'power3.out', clearProps: 'opacity,transform' });
}

/** The last photo stretches across whatever is left of the bottom row, so the grid never ends on a gap. */
function fillLastRow() {
  const grid = $('[data-gal-grid]');
  const items = $$('.gal-item', grid);
  if (!items.length) return;
  const last = items.at(-1);
  last.style.gridColumn = '';
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
  const cells = items.reduce((n, el) => n + (el.classList.contains('is-wide') ? 4 : 1), 0);
  const used = cells % cols;
  if (used && !last.classList.contains('is-wide')) last.style.gridColumn = `span ${cols - used + 1}`;
}
let fillTimer;
addEventListener('resize', () => { clearTimeout(fillTimer); fillTimer = setTimeout(fillLastRow, 150); });

/* ---------- full-screen viewer ---------- */
const lb = () => $('[data-gal-lb]');
let lastFocus = null, index = 0;
function openViewer(i) {
  const list = shown(), box = lb(), track = $('[data-lb-track]', box);
  lastFocus = document.activeElement;
  track.innerHTML = list.map((g, k) => `
    <figure class="gal-lb-slide" data-k="${k}">
      <img src="${esc(cld(g.url, 'w_1600,c_limit'))}" srcset="${esc(cld(g.url, 'w_900,c_limit'))} 900w, ${esc(cld(g.url, 'w_1600,c_limit'))} 1600w, ${esc(cld(g.url, 'w_2400,c_limit'))} 2400w" sizes="100vw" alt="${esc(g.caption || '')}" loading="${Math.abs(k - i) < 2 ? 'eager' : 'lazy'}" decoding="async" />
      ${g.caption || g.album ? `<figcaption>${g.album ? `<small>${esc(g.album)}</small>` : ''}${esc(g.caption || '')}</figcaption>` : ''}
    </figure>`).join('');
  box.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  stopScroll();
  requestAnimationFrame(() => { go(i, false); box.classList.add('is-open'); $('[data-lb-close]', box).focus(); });
}
function closeViewer() {
  const box = lb();
  box.classList.remove('is-open');
  box.hidden = true;
  document.documentElement.style.overflow = '';
  startScroll();
  lastFocus?.focus?.();
}
function go(i, smooth = true) {
  const list = shown(), track = $('[data-lb-track]', lb());
  index = Math.max(0, Math.min(list.length - 1, i));
  track.scrollTo({ left: index * track.clientWidth, behavior: smooth && !reduced ? 'smooth' : 'auto' });
  counter();
}
function counter() {
  const n = shown().length;
  $('[data-lb-count]', lb()).textContent = `${index + 1} / ${n}`;
  $('[data-lb-step="-1"]', lb()).disabled = index === 0;
  $('[data-lb-step="1"]', lb()).disabled = index >= n - 1;
}

function bind() {
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-album]');
    if (a) { album = a.dataset.album; drawGrid(); return; }
    const item = e.target.closest('.gal-item');
    if (item) { openViewer(+item.dataset.i); return; }
    if (e.target.closest('[data-lb-close]')) { closeViewer(); return; }
    const step = e.target.closest('[data-lb-step]');
    if (step) { go(index + +step.dataset.lbStep); return; }
    // tap on the dark area around the photo closes the viewer
    if (!lb().hidden && e.target.closest('.gal-lb-slide') && !e.target.closest('img, figcaption')) closeViewer();
  });
  document.addEventListener('keydown', e => {
    if (lb().hidden) return;
    if (e.key === 'Escape') closeViewer();
    else if (e.key === 'ArrowRight') go(index + 1);
    else if (e.key === 'ArrowLeft') go(index - 1);
    else if (e.key === 'Tab') { // keep focus inside the viewer
      const f = $$('button:not([disabled])', lb());
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });
  const track = $('[data-lb-track]', lb());
  let t;
  track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => { index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); counter(); }, 80); }, { passive: true });
  addEventListener('resize', () => { if (!lb().hidden) go(index, false); });
}

boot('gallery', {
  render(data, first) {
    if (!first) return;
    bind();
    const start = initialGallery();
    // cached photos paint at once; first visit keeps the placeholders until the live list answers
    if (start.fromCache) paint(start.list);
    loadGallery().then(paint).catch(err => {
      if (import.meta.env.DEV) console.warn('[liveteck] gallery unavailable', err);
      if (!ALL.length) paint(start.list);
    });
  },
  intro() {
    if (!reduced) gsap.fromTo('.page-hero .ph-media', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
  },
});
