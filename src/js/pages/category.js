// Category landing pages (/plywood-kakinada …): one page per category, for search.
// The page's own HTML holds the copy; the products, key features and interiors come from live data,
// so admin edits show here too. <body data-category="plywood"> names the category.
import { boot } from '../core/app.js';
import { gsap, reduced, glideTo } from '../core/motion.js';
import { $, esc } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { productCard, bindProductOpeners, openProduct, closeDrawer, bentoItem } from '../core/components.js';
import { SPACES, CATEGORY_SPACES, CATEGORIES } from '../core/defaults.js';

const CAT = document.body.dataset.category;
let DATA;

function render(data) {
  DATA = data;
  const cat = data.categories.find(c => c.id === CAT);
  const items = data.products.filter(p => p.category === CAT);
  const feats = $('[data-cat-features]');
  // live categories saved before the key-features migration have no `features` yet: use the built-in list
  const list = cat?.features ?? CATEGORIES.find(c => c.id === CAT)?.features ?? [];
  if (feats) feats.innerHTML = list.map(f => `<li class="reveal">${icons.check}<span>${esc(f)}</span></li>`).join('');
  $('[data-cat-products]').className = `product-grid ${items.length === 1 ? 'product-grid--single' : items.length === 2 ? 'product-grid--2' : 'product-grid--3'}`;
  $('[data-cat-products]').innerHTML = items.map(p => productCard(p, data.categories)).join('');
  const spaces = $('[data-cat-spaces]');
  if (spaces) spaces.innerHTML = (CATEGORY_SPACES[CAT] || []).map(t => SPACES.find(s => s.title === t)).filter(Boolean).map(bentoItem).join('');
}

// #plywood-19mm opens that product's details (thickness table, outside links); #faq etc. glide to the section
function handleHash() {
  const p = DATA.products.find(x => x.id === decodeURIComponent(location.hash.slice(1)));
  if (p) { openProduct(p, DATA.categories, { products: DATA.products }); return; }
  if (document.querySelector('.drawer.is-open')) closeDrawer();
  let el = null;
  try { el = location.hash.length > 1 && $(decodeURIComponent(location.hash)); } catch { /* not a selector */ }
  if (el) setTimeout(() => glideTo(el, { offset: -80 }), 300);
}

boot('products', {
  ownHash: true,
  render(data, first) {
    render(data);
    if (first) {
      bindProductOpeners(() => DATA);
      addEventListener('hashchange', handleHash);
    }
  },
  intro() {
    if (!reduced) gsap.fromTo('.page-hero .ph-media', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
    handleHash();
  },
});
