import { boot } from '../core/app.js';
import { gsap, reduced, initReveals } from '../core/motion.js';
import { $ } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { testimonialCard, stars } from '../core/components.js';
import { initReviewForm } from '../core/review.js';

let pending = false;

/** Empty state — same box as the static loading placeholder in testimonials.html, so nothing jumps. */
const emptyState = () => `
  <div class="t-empty reveal">
    <span class="te-icon">${icons.quote}</span>
    <div><h2 class="h3">Reviews are on their way.</h2><p>We are collecting genuine feedback from our customers. Be one of the first to share your experience with Liveteck.</p></div>
    <a class="btn" href="#share">Write a review ${icons.arrow}</a>
  </div>`;

function renderList(list) {
  pending = false;
  const box = $('[data-t-list]');
  if (!list.length) { box.innerHTML = emptyState(); return; }
  const avg = list.reduce((s, t) => s + (t.rating || 5), 0) / list.length;
  box.innerHTML = `
    <div class="t-summary reveal" aria-label="Average rating ${avg.toFixed(1)} out of 5 from ${list.length} review${list.length > 1 ? 's' : ''}">
      <b>${avg.toFixed(1)}</b>
      <div>${stars(Math.round(avg))}<span>${list.length} verified review${list.length > 1 ? 's' : ''}</span></div>
    </div>
    <div class="t-grid">${list.map((t, i) => testimonialCard(t, { feature: i % 5 === 0 })).join('')}</div>`;
}

boot('testimonials', {
  render(data, first) {
    // First visit (nothing cached): show skeletons until Firestore answers, instead of a premature empty state.
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
