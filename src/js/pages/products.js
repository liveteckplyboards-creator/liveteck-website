import { boot } from '../core/app.js';
import { gsap, ScrollTrigger, initReveals, reduced, glideTo } from '../core/motion.js';
import { $, $$, esc } from '../core/utils.js';
import { productCard, bindProductOpeners, openProduct, closeDrawer, featuresOf } from '../core/components.js';

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
  const match = p => !q || [p.name, p.short, p.thickness, ...featuresOf(p, cats), ...(p.applications || [])].join(' ').toLowerCase().includes(q);
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
  if (ScrollTrigger?.getAll().length) ScrollTrigger.refresh();
}

function setFilter(id, scroll = true) {
  active = id;
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === id)));
  renderCatalogue();
  if (scroll) {
    const top = $('#after-hero').getBoundingClientRect().top + scrollY - 72; // section top: the sticky bar's own rect moves
    glideTo(top);
  }
}

function handleHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return;
  // category links (footer, home range) win when a product happens to share the id
  const p = DATA.products.find(x => x.id === h);
  if (p && !DATA.categories.some(c => c.id === h)) { openProduct(p, DATA.categories, { products: DATA.products }); return; }
  if (DATA.categories.some(c => c.id === h)) {
    if (document.querySelector('.drawer.is-open')) closeDrawer();
    setFilter('all', false);
    setTimeout(() => {
      const el = document.getElementById(h);
      if (el) glideTo(el, { offset: -160 });
    }, 400);
  }
}

boot('products', {
  ownHash: true, // #category / #product links are handled by handleHash
  render(data, first) {
    DATA = data;
    renderFilters(data.categories, data.products);
    renderCatalogue();
    if (first) {
      bindProductOpeners(() => DATA);
      $('[data-filters]').addEventListener('click', e => { const b = e.target.closest('[data-filter]'); if (b) setFilter(b.dataset.filter); });
      let t;
      $('[data-search]').addEventListener('input', e => {
        clearTimeout(t);
        t = setTimeout(() => {
          term = e.target.value;
          // a search looks across the whole range, not just the selected chip
          if (term.trim() && active !== 'all') setFilter('all', false); else renderCatalogue();
        }, 160);
      });
      addEventListener('hashchange', handleHash);
    }
  },
  intro() {
    if (!reduced) gsap.fromTo('.page-hero .ph-media', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
    handleHash();
  },
});
