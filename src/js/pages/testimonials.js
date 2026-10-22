import { boot } from '../core/app.js';
import { gsap, reduced, initReveals, glideTo } from '../core/motion.js';
import { $, $$, esc } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { testimonialCard, stars } from '../core/components.js';
import { initReviewForm } from '../core/review.js';

let pending = false;
let ALL = [];
// view state: rating filter, role filter, sort order, how many are shown
const view = { rating: 0, role: '', sort: 'featured', shown: 0 };
const batch = () => (matchMedia('(max-width: 640px)').matches ? 4 : 6);

/** Empty state — same box as the static loading placeholder in testimonials.html, so nothing jumps. */
const emptyState = () => `
  <div class="t-empty reveal">
    <span class="te-icon">${icons.quote}</span>
    <div><h2 class="h3">Reviews are on their way.</h2><p>We are collecting genuine feedback from our customers. Be one of the first to share your experience with Liveteck.</p></div>
    <a class="btn" href="#share">Write a review ${icons.arrow}</a>
  </div>`;

const filtered = () => {
  let list = ALL.filter(t => (!view.rating || (t.rating || 5) === view.rating) && (!view.role || t.role === view.role));
  if (view.sort === 'high') list = [...list].sort((a, b) => (b.rating || 5) - (a.rating || 5));
  if (view.sort === 'low') list = [...list].sort((a, b) => (a.rating || 5) - (b.rating || 5));
  return list;
};

/**
 * The reviews hub. However many reviews arrive, the page stays short: a rating breakdown you can
 * tap to filter, role chips and a sort (once there are enough reviews to need them), and the list
 * shown a few at a time with "Show more".
 */
function renderList(list) {
  pending = false;
  ALL = list;
  const box = $('[data-t-list]');
  if (!list.length) { box.innerHTML = emptyState(); return; }
  const n = list.length;
  const avg = list.reduce((s, t) => s + (t.rating || 5), 0) / n;
  const per = [5, 4, 3, 2, 1].map(r => ({ r, c: list.filter(t => (t.rating || 5) === r).length }));
  const roles = [...new Set(list.map(t => t.role).filter(Boolean))];
  const tools = n > 3;
  box.innerHTML = `
    <div class="t-hub reveal">
      <div class="t-overview" aria-label="Average rating ${avg.toFixed(1)} out of 5 from ${n} review${n > 1 ? 's' : ''}">
        <div class="t-score"><b>${avg.toFixed(1)}</b>${stars(Math.round(avg))}<span class="t-sum-count">${n} verified review${n > 1 ? 's' : ''}</span></div>
        <div class="t-dist">${per.map(({ r, c }) => `
          <button type="button" class="t-dist-row" data-rate="${r}" aria-pressed="false" ${c ? '' : 'disabled'} aria-label="${r} star reviews: ${c}">
            <span>${r} ${icons.star}</span><i><b style="width:${(c / n) * 100}%"></b></i><em>${c}</em>
          </button>`).join('')}</div>
        <div class="t-ov-cta"><p>Bought from Liveteck? Your review helps others choose with confidence.</p><a class="btn btn--sm" href="#share">Write a review ${icons.arrow}</a></div>
      </div>
      ${tools ? `
      <div class="t-tools">
        <div class="t-chips" role="toolbar" aria-label="Filter reviews">
          <button class="filter-btn" type="button" data-role="" aria-pressed="true">All <i>${n}</i></button>
          ${roles.map(r => `<button class="filter-btn" type="button" data-role="${esc(r)}" aria-pressed="false">${esc(r)} <i>${list.filter(t => t.role === r).length}</i></button>`).join('')}
        </div>
        <label class="t-sort"><span class="sr-only">Sort reviews</span>
          <select data-sort><option value="featured">Featured first</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select>
        </label>
      </div>` : ''}
    </div>
    <div class="t-grid" data-t-grid aria-live="polite"></div>
    <div class="t-more-wrap" data-t-more-wrap></div>`;
  view.rating = 0; view.role = ''; view.sort = 'featured';
  paint(true);
}

function paint(reset = false) {
  const list = filtered();
  if (reset) view.shown = Math.min(list.length, batch());
  const grid = $('[data-t-grid]');
  const from = reset ? 0 : grid.children.length;
  const html = list.slice(from, view.shown).map((t, i) => testimonialCard(t, { feature: (from + i) % 5 === 0 && !view.rating && !view.role })).join('');
  if (reset) grid.innerHTML = html || `<p class="t-none">No reviews match this filter yet.</p>`;
  else grid.insertAdjacentHTML('beforeend', html);
  const left = list.length - view.shown;
  $('[data-t-more-wrap]').innerHTML = list.length > batch() || left > 0 ? `
    <div class="t-progress"><span>Showing ${view.shown} of ${list.length}</span><i><b style="width:${(view.shown / Math.max(1, list.length)) * 100}%"></b></i></div>
    ${left > 0 ? `<button class="btn btn--ghost t-load" type="button" data-t-load>Show ${Math.min(left, batch())} more review${Math.min(left, batch()) > 1 ? 's' : ''}</button>` : ''}` : '';
  $$('[data-rate]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.rate === view.rating)));
  $$('[data-role]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === view.role)));
  initReveals(grid);
}

function bindHub() {
  const box = $('[data-t-list]');
  box.addEventListener('click', e => {
    const rate = e.target.closest('[data-rate]'), role = e.target.closest('[data-role]'), more = e.target.closest('[data-t-load]');
    if (rate) { view.rating = view.rating === +rate.dataset.rate ? 0 : +rate.dataset.rate; paint(true); }
    if (role) { view.role = role.dataset.role; paint(true); }
    if (more) {
      const first = $('[data-t-grid]').children.length;
      view.shown = Math.min(filtered().length, view.shown + batch());
      paint();
      // keep the reader's place: focus the first newly shown review
      const card = $('[data-t-grid]').children[first];
      if (card) { card.tabIndex = -1; card.focus({ preventScroll: true }); }
    }
    if (rate || role) {
      const top = $('.t-hub').getBoundingClientRect().top + scrollY - 90;
      if (top < scrollY) glideTo(top);
    }
  });
  box.addEventListener('change', e => { if (e.target.matches('[data-sort]')) { view.sort = e.target.value; paint(true); } });
}

// dev only (dropped from production builds): preview the hub with a long list of reviews
if (import.meta.env.DEV) window.__renderReviews = (list) => { renderList(list); initReveals($('[data-t-list]')); };

boot('testimonials', {
  render(data, first) {
    // First visit (nothing cached): show skeletons until Firestore answers, instead of a premature empty state.
    if (first) bindHub();
    if (first && !data.fromCache) pending = true; // keep the static loading placeholder until Firestore answers
    else renderList(data.testimonials);
    const g = $('[data-google-review]');
    if (g && data.settings.googleReviewUrl) g.href = data.settings.googleReviewUrl;
    if (first) initReviewForm();
  },
  loaded(data) {
    if (pending) { renderList(data.testimonials); initReveals($('[data-t-list]')); }
  },
  intro() {
    if (!reduced) gsap.fromTo('.page-hero .ph-media', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
  },
});
