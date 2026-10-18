import { boot } from '../core/app.js';
import { gsap, reduced } from '../core/motion.js';
import { $, $$, esc, toast } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { testimonialCard, stars } from '../core/components.js';
import { submitTestimonial } from '../core/data.js';

function renderList(list) {
  const box = $('[data-t-list]');
  if (!list.length) {
    box.innerHTML = `
      <div class="t-empty reveal">
        <span class="te-icon">${icons.quote}</span>
        <div><h3>Reviews are on their way.</h3><p>We are collecting genuine feedback from our customers. Be one of the first to share your experience with Liveteck.</p></div>
        <a class="btn" href="#share">Write a review ${icons.arrow}</a>
      </div>`;
    return;
  }
  box.innerHTML = `<div class="t-grid">${list.map((t, i) => testimonialCard(t, { feature: i % 5 === 0 })).join('')}</div>`;
}

function renderSummary(list) {
  const box = $('[data-rating-summary]');
  if (!list.length || box.dataset.done) return;
  const avg = list.reduce((s, t) => s + (t.rating || 5), 0) / list.length;
  box.dataset.done = '1';
  box.insertAdjacentHTML('beforeend', `
    <div style="display:flex;align-items:center;gap:18px;margin-top:26px">
      <b style="font-family:var(--font-display);font-weight:340;font-size:64px;line-height:1;color:var(--gold-300)">${avg.toFixed(1)}</b>
      <div>${stars(Math.round(avg))}<span style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.7">${list.length} review${list.length > 1 ? 's' : ''}</span></div>
    </div>`);
}

function initForm() {
  const form = $('[data-review-form]');
  const status = $('.form-status', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.website.value) return;
    $$('.field', form).forEach(f => f.classList.remove('invalid'));
    let ok = true;
    if (!form.name.value.trim()) { form.name.closest('.field').classList.add('invalid'); ok = false; }
    if (form.message.value.trim().length < 20) { form.message.closest('.field').classList.add('invalid'); ok = false; }
    if (!form.consent.checked) { status.className = 'form-status bad'; status.textContent = 'Please tick the consent box so we can publish your review.'; ok = false; }
    if (!ok) return;
    const btn = $('button[type=submit]', form);
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await submitTestimonial(Object.fromEntries(new FormData(form)));
      status.className = 'form-status ok';
      status.textContent = 'Thank you! Your review has been received and will appear after a quick check by our team.';
      form.reset();
      toast('Review submitted — thank you!');
    } catch (err) {
      console.error(err);
      status.className = 'form-status bad';
      status.textContent = 'Sorry, we could not submit your review right now. Please try again in a moment.';
    } finally {
      btn.disabled = false; btn.textContent = 'Submit review';
    }
  });
}

boot('testimonials', {
  render(data, first) {
    renderList(data.testimonials);
    renderSummary(data.testimonials);
    const g = $('[data-google-review]');
    if (g && data.settings.googleReviewUrl) g.href = data.settings.googleReviewUrl;
    if (first) initForm();
  },
  intro() {
    if (!reduced) gsap.from('.page-hero .ph-media img', { scale: 1.2, duration: 2.2, ease: 'power3.out' });
  },
});
