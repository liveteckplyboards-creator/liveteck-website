import { CLOUDINARY } from '../core/firebase.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

const s = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ic = {
  home: s('<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>'),
  inbox: s('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>'),
  box: s('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
  grid: s('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  quote: s('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  image: s('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
  cog: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  edit: s('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  trash: s('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  phone: s('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 0 1 2.2 12C2.2 6.6 6.6 2.2 12 2.2a9.8 9.8 0 0 1 9.8 9.8c0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2A11.8 11.8 0 0 0 12 .2C5.5.2.2 5.5.2 12c0 2.1.5 4.1 1.6 5.9L.1 24l6.3-1.6a11.8 11.8 0 0 0 5.6 1.4h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.4z"/></svg>',
  eye: s('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
  check: s('<path d="M20 6 9 17l-5-5"/>'),
  x: s('<path d="M18 6 6 18M6 6l12 12"/>'),
  left: s('<path d="m15 18-6-6 6-6"/>'),
  right: s('<path d="m9 18 6-6-6-6"/>'),
  copy: s('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  download: s('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  upload: s('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  search: s('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  star: s('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'),
};

export function toast(msg, type = '') {
  const t = h(`<div class="toast ${type}">${esc(msg)}</div>`);
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3800);
}

/** Opens a modal; returns { el, close }. footer: array of {label, cls, onClick} */
export function modal({ title, body, footer = [], size = '' }) {
  const el = h(`
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-card ${size}">
        <div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-x aria-label="Close">${ic.x}</button></div>
        <div class="modal-body"></div>
        ${footer.length ? '<div class="modal-foot"></div>' : ''}
      </div>
    </div>`);
  const bodyEl = $('.modal-body', el);
  typeof body === 'string' ? (bodyEl.innerHTML = body) : bodyEl.appendChild(body);
  const close = () => { el.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  el.addEventListener('mousedown', e => { if (e.target === el) close(); });
  $('[data-x]', el).addEventListener('click', close);
  const foot = $('.modal-foot', el);
  footer.forEach(f => {
    const b = h(`<button class="btn ${f.cls || ''}" type="button">${esc(f.label)}</button>`);
    b.addEventListener('click', () => f.onClick?.({ el, close, btn: b }));
    foot.appendChild(b);
  });
  document.body.appendChild(el);
  setTimeout(() => $('input, textarea, select', bodyEl)?.focus(), 50);
  return { el, close };
}

/** Promise-based confirm in a styled modal (no native dialogs). */
export function confirmBox(message, { ok = 'Delete', danger = true } = {}) {
  return new Promise(res => {
    const m = modal({
      title: 'Please confirm', size: 'sm', body: `<p>${esc(message)}</p>`,
      footer: [
        { label: 'Cancel', cls: 'btn--ghost', onClick: ({ close }) => { close(); res(false); } },
        { label: ok, cls: danger ? 'btn--danger' : '', onClick: ({ close }) => { close(); res(true); } },
      ],
    });
    $('[data-x]', m.el).addEventListener('click', () => res(false));
  });
}

/** Unsigned Cloudinary upload with progress. Returns the upload response. */
export function uploadToCloudinary(file, { folder = 'liveteck/uploads', onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY.preset);
    fd.append('folder', folder);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloud}/auto/upload`);
    xhr.upload.onprogress = e => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText);
        xhr.status < 300 ? resolve(r) : reject(new Error(r.error?.message || `Upload failed (${xhr.status})`));
      } catch (e) { reject(e); }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(fd);
  });
}

export const thumb = (url, t = 'w_300,h_240,c_fill') =>
  url && url.includes('/upload/') ? url.replace('/upload/', `/upload/f_auto,q_auto,${t}/`).replace(/\/video\/upload\/(.*?)(\.\w+)?$/, (m, p) => `/video/upload/${p}.jpg`) : url || '';

export const fmtDate = (ts) => {
  const d = ts?.toDate ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : ts ? new Date(ts) : null;
  return d ? d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
};

export const slugify = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[–—]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export const waLink = (phone, text = '') => {
  let n = String(phone).replace(/\D/g, '');
  if (n.length === 10) n = '91' + n;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export function downloadFile(name, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
