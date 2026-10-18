import { boot } from '../core/app.js';
import { gsap, ScrollTrigger, initReveals, lenis, reduced } from '../core/motion.js';
import { $, $$, esc } from '../core/utils.js';
import { productCard, bindProductOpeners, openProduct } from '../core/components.js';

let DATA;
let active = 'all';
let term = '';

function renderFilters(cats, products) {
  const count = id => products.filter(p => p.category === id).length;
  $('[data-filters]').innerHTML =
    `<button class="filter-btn" data-filter="all" aria-pressed="${active === 'all'}">All <i>${products.length}</i></button>` +
    cats.filter(c => count(c.id)).map(c => `<button class="filter-btn" data-filter="${esc(c.id)}" aria-pressed="${active === c.id}">${esc(c.name)} <i>${count(c.id)}</i></button>`).join('');
}

function renderCatalogue() {
  const { categories: cats, products } = DATA;
  const q = term.trim().toLowerCase();
  const match = p => !q || [p.name, p.short, p.thickness, ...(p.features || []), ...(p.applications || [])].join(' ').toLowerCase().includes(q);
  const blocks = cats
    .filter(c => active === 'all' || c.id === active)
    .map(c => ({ c, items: products.filter(p => p.category === c.id && match(p)) }))
    .filter(b => b.items.length);
  // products whose category is missing from the category list
  const known = new Set(cats.map(c => c.id));
  const orphans = products.filter(p => !known.has(p.category) && match(p) && active === 'all');
  if (orphans.length) blocks.push({ c: { id: 'other', name: 'More products', short: '' }, items: orphans });

  $('[data-catalogue]').innerHTML = blocks.length ? blocks.map(({ c, items }) => `
    <div class="cat-block" id="${esc(c.id)}">
      <div class="cat-block-head reveal">
        <h2>${esc(c.name)}</h2>
        <p>${esc(c.description || c.short || '')}</p>
      </div>
      <div class="product-grid ${items.length === 1 ? 'product-grid--single' : items.length === 2 ? 'product-grid--2' : 'product-grid--3'}">${items.map(p => productCard(p, cats)).join('')}</div>
    </div>`).join('') : `<div class="empty-state"><h3 class="h3">No products match “${esc(term)}”.</h3><p style="margin-top:12px">Try another search, or <button class="link-arrow" data-enquire>ask our team</button>.</p></div>`;
  initReveals($('[data-catalogue]'));
  ScrollTrigger.refresh();
}

function setFilter(id, scroll = true) {
  active = id;
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === id)));
  renderCatalogue();
  if (scroll) {
    const top = $('.filter-bar').getBoundingClientRect().top + scrollY - 72;
    lenis ? lenis.scrollTo(top, { duration: 1 }) : scrollTo({ top, behavior: 'smooth' });
  }
}

function handleHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return;
  const p = DATA.products.find(x => x.id === h);
  if (p) { openProduct(p, DATA.categories); return; }
  if (DATA.categories.some(c => c.id === h)) {
    setFilter('all', false);
    setTimeout(() => {
      const el = document.getElementById(h);
      if (el) lenis ? lenis.scrollTo(el, { offset: -160, duration: 1.2 }) : el.scrollIntoView();
    }, 400);
  }
}

boot('products', {
  render(data, first) {
    DATA = data;
    renderFilters(data.categories, data.products);
    renderCatalogue();
    if (first) {
      bindProductOpeners(() => DATA);
      $('[data-filters]').addEventListener('click', e => { const b = e.target.closest('[data-filter]'); if (b) setFilter(b.dataset.filter); });
      let t;
      $('[data-search]').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { term = e.target.value; renderCatalogue(); }, 160); });
      addEventListener('hashchange', handleHash);
    }
  },
  intro() {
    if (!reduced) gsap.from('.page-hero .ph-media img', { scale: 1.2, duration: 2.2, ease: 'power3.out' });
    handleHash();
  },
});
