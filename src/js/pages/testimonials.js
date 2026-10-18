import { boot } from '../core/app.js';
import { gsap, reduced, initReveals } from '../core/motion.js';
import { $, $$, toast } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { testimonialCard, stars } from '../core/components.js';
import { submitTestimonial } from '../core/data.js';

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

function initForm() {
  const form = $('[data-review-form]');
  const status = $('.form-status', form);
  const btn = $('button[type=submit]', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (btn.disabled) return; // double-submit guard
    if (form.website.value) return; // honeypot
    $$('.field', form).forEach(f => f.classList.remove('invalid'));
    status.className = 'form-status';
    let ok = true;
    if (!form.name.value.trim()) { form.name.closest('.field').classList.add('invalid'); ok = false; }
    if (form.message.value.trim().length < 20) { form.message.closest('.field').classList.add('invalid'); ok = false; }
    if (!ok) { $('.invalid input, .invalid textarea', form)?.focus(); return; }
    if (!form.consent.checked) { status.className = 'form-status bad'; status.textContent = 'Please tick the consent box so we can publish your review.'; form.consent.focus(); return; }
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await submitTestimonial(Object.fromEntries(new FormData(form)));
      status.className = 'form-status ok';
      status.textContent = 'Thank you! Your review has been received and will appear after a quick check by our team.';
      form.reset();
      toast('Review submitted — thank you!');
    } catch (err) {
      if (import.meta.env.DEV) console.warn(err);
      status.className = 'form-status bad';
      status.textContent = 'Sorry, we could not submit your review right now. Please check your connection and try again.';
    } finally {
      btn.disabled = false; btn.textContent = 'Submit review';
    }
  });
}

boot('testimonials', {
  render(data, first) {
    // First visit (nothing cached): show skeletons until Firestore answers, instead of a premature empty state.
    if (first && !data.fromCache) pending = true; // keep the static loading placeholder until Firestore answers
    else renderList(data.testimonials);
    const g = $('[data-google-review]');
    if (g && data.settings.googleReviewUrl) g.href = data.settings.googleReviewUrl;
    if (first) initForm();
  },
  loaded(data) {
    if (pending) { renderList(data.testimonials); initReveals($('[data-t-list]')); }
  },
  intro() {
    if (!reduced) gsap.fromTo('.page-hero .ph-media', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
  },
});
