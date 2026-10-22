// Cloudinary delivery transforms: cld(url, 'w_800') → .../upload/f_auto,q_auto,w_800/...
export function cld(url, t = '') {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url || '';
  const isVideo = url.includes('/video/upload/');
  const base = isVideo ? 'q_auto' : 'f_auto,q_auto';
  return url.replace('/upload/', `/upload/${[base, t].filter(Boolean).join(',')}/`);
}
export const cldVideo = (url, t = '') => {
  const u = cld(url, ['vc_auto', t].filter(Boolean).join(','));
  return /\.(mp4|webm|mov)$/i.test(u) ? u : `${u}.mp4`;
};
export const cldPoster = (url) => cld(url, 'w_1920,c_limit');

export const srcset = (url, widths = [480, 800, 1200, 1600]) =>
  url?.includes('res.cloudinary.com') ? widths.map(w => `${cld(url, `w_${w},c_limit`)} ${w}w`).join(', ') : '';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export const waLink = (number, text = '') => `https://wa.me/${String(number).replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const telLink = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

export function toast(msg, ms = 3600) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('on'));
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('on'), ms);
}

// letters only: "Ramesh (Demo)" gives "RD", not "R("
export const initials = (name = '') => (name.match(/\p{L}+/gu) || []).slice(0, 2).map(w => w[0].toUpperCase()).join('');
