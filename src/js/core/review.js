import { $, $$, toast } from './utils.js';
import { submitTestimonial } from './data.js';
import { openModal } from './layout.js';
const CLOUDINARY = { cloud: 'duswrz4u', preset: 'liveteck' }; // same as firebase.js (kept here so Firebase stays out of the first load)

const MAX_PHOTO = 8 * 1024 * 1024;

/** Unsigned upload of the reviewer's photo to Cloudinary (same preset as the admin). */
function uploadPhoto(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY.preset);
  fd.append('folder', 'liveteck/testimonials/web');
  return fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloud}/image/upload`, { method: 'POST', body: fd })
    .then(r => r.json().then(j => { if (!r.ok) throw new Error(j.error?.message || 'Upload failed'); return j.secure_url; }));
}

/** Optional profile picture: preview, size/type check, remove. Returns a getter for the chosen file. */
function initPhotoPick(form) {
  const box = $('[data-photo-pick]', form);
  if (!box) return () => null;
  const input = $('[data-pp-input]', box);
  const preview = $('[data-pp-preview]', box);
  const hint = $('[data-pp-hint]', box);
  const remove = $('[data-pp-remove]', box);
  const label = $('.pp-btn', box);
  const blank = preview.innerHTML;
  const hintText = hint.textContent;
  let file = null, url = null;
  const reset = () => {
    file = null; input.value = '';
    if (url) URL.revokeObjectURL(url);
    url = null;
    preview.innerHTML = blank; preview.classList.remove('has-img');
    remove.hidden = true; label.textContent = 'Upload a photo';
    hint.textContent = hintText; box.classList.remove('invalid');
  };
  input.addEventListener('change', () => {
    const f = input.files[0];
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > MAX_PHOTO) {
      reset(); box.classList.add('invalid');
      hint.textContent = f.size > MAX_PHOTO ? 'That photo is larger than 8 MB — please choose a smaller one.' : 'Please choose a JPG, PNG or WebP image.';
      return;
    }
    file = f;
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(f);
    preview.innerHTML = `<img src="${url}" alt="" />`;
    preview.classList.add('has-img');
    remove.hidden = false; label.textContent = 'Change photo';
    hint.textContent = f.name;
    box.classList.remove('invalid');
  });
  remove.addEventListener('click', reset);
  form.addEventListener('reset', () => setTimeout(reset));
  return () => file;
}

/** "Write a review" buttons open the review modal; the form saves a pending review for admin approval. */
export function initReviewForm() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-review-open]')) { e.preventDefault(); openModal('review-modal'); }
  });
  const form = $('[data-review-form]');
  if (!form) return;
  const status = $('.form-status', form);
  const btn = $('button[type=submit]', form);
  const getPhoto = initPhotoPick(form);
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
    btn.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      const file = getPhoto();
      if (file) {
        btn.textContent = 'Uploading photo…';
        try { data.photo = await uploadPhoto(file); }
        catch (err) {
          if (import.meta.env.DEV) console.warn(err);
          status.className = 'form-status bad';
          status.textContent = 'Your photo could not be uploaded. Please try again, or remove the photo to send the review without it.';
          return;
        }
      }
      btn.textContent = 'Submitting…';
      try { await submitTestimonial(data); }
      catch (err) {
        // database rules without photo support yet: still take the review, just without the picture
        if (!data.photo || err?.code !== 'permission-denied') throw err;
        delete data.photo;
        await submitTestimonial(data);
      }
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
