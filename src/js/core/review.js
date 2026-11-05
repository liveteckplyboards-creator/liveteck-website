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

/** Phone photos can be large: scale anything over ~1.5 MB (or not JPG/PNG/WebP) down to 1600 px JPEG. */
async function shrink(f) {
  if (f.size < 1.5 * 1024 * 1024 && /^image\/(jpeg|png|webp)$/.test(f.type)) return f;
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
    return blob ? new File([blob], (f.name || 'photo').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : f;
  } catch { return f; } // the browser cannot read it (e.g. HEIC on desktop): the type check explains
}

/**
 * "Take a photo". Phones and tablets open the camera app straight away (file input with capture);
 * laptops with a webcam get a live preview inside the form. Hidden where neither is possible.
 */
function initCamera(form, box, useFile) {
  const btn = $('[data-pp-camera]', box);
  const capture = $('[data-pp-capture]', box);
  const panel = $('[data-pp-cam-box]', form);
  if (!btn || !capture || !panel) return;
  const touch = matchMedia('(pointer: coarse)').matches;
  const webcam = !!navigator.mediaDevices?.getUserMedia && isSecureContext;
  if (!touch && !webcam) return;
  btn.hidden = false;
  capture.addEventListener('change', () => { useFile(capture.files[0]); capture.value = ''; });
  let stream = null;
  const stop = () => { stream?.getTracks().forEach(t => t.stop()); stream = null; panel.hidden = true; panel.innerHTML = ''; };
  const live = () => {
    panel.innerHTML = `<video playsinline autoplay muted aria-label="Camera preview"></video>
      <div class="pp-cam-actions"><button type="button" class="btn btn--ghost btn--sm" data-cam-cancel>Cancel</button><button type="button" class="btn btn--sm" data-cam-snap>Take photo</button></div>`;
    $('video', panel).srcObject = stream;
  };
  btn.addEventListener('click', async () => {
    if (touch) { capture.click(); return; }
    if (stream) return;
    panel.hidden = false;
    panel.innerHTML = '<p>Allow camera access in your browser to take a photo…</p>';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      live();
      $('[data-cam-snap]', panel).focus();
    } catch (err) {
      stream = null;
      panel.innerHTML = `<p>${err?.name === 'NotAllowedError' ? 'Camera access was blocked. You can allow it from the camera icon in the address bar, or upload a photo instead.' : 'No camera was found on this device. Please upload a photo instead.'}</p>
        <div class="pp-cam-actions"><button type="button" class="btn btn--ghost btn--sm" data-cam-cancel>Close</button></div>`;
    }
  });
  panel.addEventListener('click', e => {
    if (e.target.closest('[data-cam-cancel]')) { stop(); btn.focus(); return; }
    if (e.target.closest('[data-cam-retake]')) { live(); return; }
    if (e.target.closest('[data-cam-snap]')) {
      const v = $('video', panel);
      const side = Math.min(v.videoWidth, v.videoHeight);
      if (!side) return;
      const c = document.createElement('canvas');
      c.width = c.height = Math.min(1200, side);
      const ctx = c.getContext('2d');
      ctx.translate(c.width, 0); ctx.scale(-1, 1); // save it the way the person saw it (mirror)
      ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, c.width, c.height);
      c.toBlob(blob => {
        if (!blob) return;
        const f = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        stop(); useFile(f); btn.focus();
      }, 'image/jpeg', 0.88);
    }
  });
  form.addEventListener('reset', stop);
  // the review popup closes, or the tab is hidden: switch the camera off
  const modal = form.closest('.modal');
  if (modal) new MutationObserver(() => { if (!modal.classList.contains('is-open')) stop(); }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
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
  const useFile = async (raw) => {
    if (!raw) return;
    const f = await shrink(raw);
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
  };
  input.addEventListener('change', () => useFile(input.files[0]));
  initCamera(form, box, useFile);
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
