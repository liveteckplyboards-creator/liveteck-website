import { $, $$, esc, h, ic, toast, modal, confirmBox, uploadToCloudinary, thumb, fmtDate, slugify, waLink, downloadFile } from './ui.js';
import * as store from './store.js';

export const ADMIN_EMAIL = 'liveteckplyboards@gmail.com';
const STATUSES = ['new', 'contacted', 'quoted', 'closed'];
const ctx = { refreshBadges: () => {}, setActions: () => {} };
export const setContext = (c) => Object.assign(ctx, c);

const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.name).localeCompare(String(b.name));
const byNewest = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
const lines = (v) => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
// One handler per event type per container: views re-render themselves in place, so replace rather than stack.
const on = (el, type, fn) => {
  el._lt = el._lt || {};
  if (el._lt[type]) el.removeEventListener(type, el._lt[type]);
  el._lt[type] = fn;
  el.addEventListener(type, fn);
};
const loading = (el) => { el.innerHTML = '<div class="loading"><div class="spinner"></div></div>'; };
const fail = (el, err) => { console.error(err); el.innerHTML = `<div class="card empty"><h3>Could not load data</h3><p>${esc(err.message)}</p></div>`; };
const field = (name, label, value = '', { type = 'text', hint = '', attrs = '' } = {}) =>
  `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${attrs} />${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
const area = (name, label, value = '', { rows = 3, hint = '' } = {}) =>
  `<div class="field"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" rows="${rows}">${esc(value)}</textarea>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
const toggle = (name, label, on) => `<label class="check"><span class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''} /><span></span></label>${label}</label>`;

/* ======================================================================
   Media field (Cloudinary upload, reorder, remove, paste URL)
   ====================================================================== */
function mediaField({ label, urls = [], multiple = true, folder = 'liveteck/uploads', accept = 'image/*', hint = '' }) {
  let items = urls.filter(Boolean);
  const el = h(`
    <div class="field">
      <span class="label">${esc(label)}</span>
      <div class="img-list"></div>
      <div class="dropzone" tabindex="0" role="button"><input type="file" hidden accept="${accept}" ${multiple ? 'multiple' : ''} /><b>Click to upload</b> or drag &amp; drop<div class="small">${esc(hint || (accept.startsWith('video') ? 'MP4 / MOV video' : 'JPG, PNG or WebP · large, high-quality images work best'))}</div></div>
      <div class="up-status" style="display:grid;gap:6px"></div>
      <div class="row"><input class="input" style="flex:1" placeholder="…or paste a media URL" data-url /><button type="button" class="btn btn--ghost btn--sm" data-add-url>Add URL</button></div>
    </div>`);
  const listEl = $('.img-list', el);
  const isVid = (u) => /\/video\/upload\//.test(u) || /\.(mp4|mov|webm)$/i.test(u);
  const render = () => {
    listEl.innerHTML = items.map((u, i) => `
      <div class="img-item">
        ${isVid(u) ? `<video src="${esc(u)}" muted preload="metadata"></video>` : `<img src="${esc(thumb(u, 'w_240,h_190,c_fill'))}" alt="" />`}
        ${i === 0 && multiple ? '<span class="first">Cover</span>' : ''}
        <div class="img-tools">
          <span>${multiple ? `<button type="button" data-mv="${i}" data-d="-1" title="Move left">${ic.left}</button> <button type="button" data-mv="${i}" data-d="1" title="Move right">${ic.right}</button>` : ''}</span>
          <button type="button" data-rm="${i}" title="Remove">${ic.trash}</button>
        </div>
      </div>`).join('');
  };
  listEl.addEventListener('click', e => {
    const mv = e.target.closest('[data-mv]'); const rm = e.target.closest('[data-rm]');
    if (mv) { const i = +mv.dataset.mv, j = i + +mv.dataset.d; if (j >= 0 && j < items.length) { [items[i], items[j]] = [items[j], items[i]]; render(); } }
    if (rm) { items.splice(+rm.dataset.rm, 1); render(); }
  });
  const input = $('input[type=file]', el);
  const dz = $('.dropzone', el);
  const status = $('.up-status', el);
  const upload = async (files) => {
    for (const file of [...files].slice(0, multiple ? 12 : 1)) {
      const row = h(`<div><div class="small">${esc(file.name)}</div><div class="progress"><i></i></div></div>`);
      status.appendChild(row);
      try {
        const r = await uploadToCloudinary(file, { folder, onProgress: p => { $('i', row).style.width = `${Math.round(p * 100)}%`; } });
        multiple ? items.push(r.secure_url) : (items = [r.secure_url]);
        render();
        store.add('media', { url: r.secure_url, publicId: r.public_id, type: r.resource_type, format: r.format, width: r.width || null, height: r.height || null, bytes: r.bytes || 0, name: file.name, folder }).catch(() => {});
        row.remove();
      } catch (err) {
        row.innerHTML = `<span class="error-text">${esc(file.name)}: ${esc(err.message)}</span>`;
      }
    }
  };
  dz.addEventListener('click', () => input.click());
  dz.addEventListener('keydown', e => { if (e.key === 'Enter') input.click(); });
  input.addEventListener('change', () => { upload(input.files); input.value = ''; });
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); upload(e.dataTransfer.files); });
  $('[data-add-url]', el).addEventListener('click', () => {
    const u = $('[data-url]', el).value.trim();
    if (!/^https?:\/\//.test(u)) return toast('Please paste a full https:// URL', 'err');
    multiple ? items.push(u) : (items = [u]);
    $('[data-url]', el).value = '';
    render();
  });
  render();
  return { el, value: () => (multiple ? items : items[0] || '') };
}

/* ======================================================================
   OVERVIEW
   ====================================================================== */
export async function overview(view) {
  loading(view);
  ctx.setActions('<a class="btn btn--gold" href="#/products?new=1">' + ic.plus + ' Add product</a>');
  try {
    const [enq, prods, tst, settings] = await Promise.all([store.list('enquiries'), store.list('products'), store.list('testimonials'), store.getSettings()]);
    enq.sort(byNewest);
    const newCount = enq.filter(e => e.status === 'new').length;
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    const thisMonth = enq.filter(e => (e.createdAt?.seconds || 0) * 1000 >= month.getTime()).length;
    const pending = tst.filter(t => t.status === 'pending').length;
    const todo = [
      ['Business email', !!settings.email],
      ['Business hours', !!settings.hours],
      ['GST number', !!settings.gst],
      ['Social media links', Object.values(settings.social || {}).some(Boolean)],
      ['Google review link', !!settings.googleReviewUrl],
      ['Verified Google Maps location', !!settings.mapEmbed && !/Rajendra/i.test(settings.mapEmbed)],
      ['Product catalogue in database', prods.length > 0],
    ];
    view.innerHTML = `
      <div class="stats">
        <div class="card stat accent"><span class="k">New enquiries</span><span class="v">${newCount}</span><span class="s">Waiting for a reply</span></div>
        <div class="card stat"><span class="k">This month</span><span class="v">${thisMonth}</span><span class="s">${enq.length} enquiries in total</span></div>
        <div class="card stat"><span class="k">Products live</span><span class="v">${prods.filter(p => p.published !== false).length}</span><span class="s">${prods.length} in catalogue</span></div>
        <div class="card stat"><span class="k">Reviews to approve</span><span class="v">${pending}</span><span class="s">${tst.filter(t => t.status === 'approved').length} published</span></div>
      </div>
      <div class="grid-2" style="grid-template-columns:1.6fr 1fr;align-items:start">
        <div class="card">
          <div class="card-head"><h2>Latest enquiries</h2><span class="spacer"></span><a class="btn btn--ghost btn--sm" href="#/enquiries">View all</a></div>
          ${enq.length ? `<div class="table-wrap"><table class="t"><tbody>${enq.slice(0, 6).map(e => `
            <tr class="${e.status === 'new' ? 'is-new' : ''}">
              <td><div class="cell-main">${esc(e.name)}</div><div class="cell-sub">${fmtDate(e.createdAt)}</div></td>
              <td><div>${esc(e.product || 'General enquiry')}</div><div class="cell-sub clamp">${esc(e.message || '')}</div></td>
              <td><span class="pill ${esc(e.status)}">${esc(e.status)}</span></td>
              <td><div class="row" style="flex-wrap:nowrap"><a class="icon-btn" href="tel:${esc(e.phone)}" title="Call">${ic.phone}</a><a class="icon-btn" style="color:#1f9d55" href="${waLink(e.phone, `Hi ${e.name}, thank you for contacting Liveteck Ply & Boards.`)}" target="_blank" rel="noopener" title="WhatsApp">${ic.wa}</a></div></td>
            </tr>`).join('')}</tbody></table></div>` : '<div class="empty"><h3>No enquiries yet</h3><p>Enquiries from the website forms will appear here.</p></div>'}
        </div>
        <div class="card">
          <div class="card-head"><h2>Business details checklist</h2></div>
          <div class="card-body checklist"><ul>${todo.map(([t, ok]) => `<li><span class="dot ${ok ? 'ok' : 'todo'}">${ok ? '✓' : '!'}</span>${esc(t)}</li>`).join('')}</ul>
          <div class="row" style="margin-top:18px">
            <a class="btn btn--sm" href="#/settings">Update settings</a>
            ${prods.length ? '' : '<button class="btn btn--gold btn--sm" data-seed>Import catalogue</button>'}
          </div></div>
        </div>
      </div>`;
    $('[data-seed]', view)?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      const n = await store.seedCatalogue('missing').catch(err => { toast(err.message, 'err'); return 0; });
      toast(`Imported ${n} items`); overview(view);
    });
  } catch (err) { fail(view, err); }
}

/* ======================================================================
   ENQUIRIES
   ====================================================================== */
export async function enquiries(view) {
  loading(view);
  let filter = 'all', q = '', items = [];
  ctx.setActions(`<button class="btn btn--ghost" data-export>${ic.download}<span class="hide-sm"> Export CSV</span></button>`);
  try { items = (await store.list('enquiries')).sort(byNewest); } catch (err) { return fail(view, err); }

  view.innerHTML = `
    <div class="toolbar">
      <div class="seg" data-seg></div>
      <label class="search">${ic.search}<input placeholder="Search name, phone, product…" data-q /></label>
    </div>
    <div class="card"><div class="table-wrap" data-table></div></div>`;
  const draw = () => {
    const counts = Object.fromEntries(STATUSES.map(s => [s, items.filter(e => e.status === s).length]));
    $('[data-seg]', view).innerHTML = [['all', `All (${items.length})`], ...STATUSES.map(s => [s, `${s[0].toUpperCase() + s.slice(1)} (${counts[s]})`])]
      .map(([k, l]) => `<button aria-pressed="${filter === k}" data-f="${k}">${l}</button>`).join('');
    const ql = q.toLowerCase();
    const rows = items.filter(e => (filter === 'all' || e.status === filter) && (!ql || [e.name, e.phone, e.email, e.product, e.city, e.message].join(' ').toLowerCase().includes(ql)));
    $('[data-table]', view).innerHTML = rows.length ? `
      <table class="t"><thead><tr><th>Received</th><th>Customer</th><th>Contact</th><th>Product</th><th>Message</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map(e => `<tr class="${e.status === 'new' ? 'is-new' : ''}" data-id="${e.id}">
        <td class="cell-sub" style="white-space:nowrap">${fmtDate(e.createdAt)}</td>
        <td><div class="cell-main">${esc(e.name)}</div><div class="cell-sub">${esc(e.city || '')}</div></td>
        <td><div style="white-space:nowrap">${esc(e.phone)}</div>${e.email ? `<div class="cell-sub">${esc(e.email)}</div>` : ''}
          <div class="row" style="margin-top:6px;flex-wrap:nowrap"><a class="icon-btn" href="tel:${esc(e.phone)}" title="Call">${ic.phone}</a><a class="icon-btn" style="color:#1f9d55" target="_blank" rel="noopener" href="${waLink(e.phone, `Hi ${e.name}, thank you for your enquiry with Liveteck Ply & Boards${e.product ? ` about ${e.product}` : ''}.`)}" title="WhatsApp">${ic.wa}</a></div></td>
        <td>${esc(e.product || 'General')}</td>
        <td><div class="clamp">${esc(e.message || '—')}</div>${e.notes ? `<div class="cell-sub" style="margin-top:4px">📝 ${esc(e.notes)}</div>` : ''}</td>
        <td><select class="input" style="height:34px;width:auto" data-status>${STATUSES.map(s => `<option ${s === e.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
        <td><div class="row" style="flex-wrap:nowrap"><button class="icon-btn" data-open title="Details">${ic.eye}</button><button class="icon-btn danger" data-del title="Delete">${ic.trash}</button></div></td>
      </tr>`).join('')}</tbody></table>` : '<div class="empty"><h3>No enquiries here</h3><p>Try a different filter.</p></div>';
  };
  draw();
  on(view, 'click', async e => {
    const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; draw(); return; }
    const row = e.target.closest('tr[data-id]'); if (!row) return;
    const item = items.find(x => x.id === row.dataset.id);
    if (e.target.closest('[data-del]')) {
      if (!(await confirmBox(`Delete the enquiry from ${item.name}? This cannot be undone.`))) return;
      await store.remove('enquiries', item.id); items = items.filter(x => x !== item); draw(); ctx.refreshBadges(); toast('Enquiry deleted');
    }
    if (e.target.closest('[data-open]')) openEnquiry(item, () => { draw(); ctx.refreshBadges(); });
  });
  on(view, 'change', async e => {
    const sel = e.target.closest('[data-status]'); if (!sel) return;
    const item = items.find(x => x.id === sel.closest('tr').dataset.id);
    try { await store.update('enquiries', item.id, { status: sel.value }); item.status = sel.value; draw(); ctx.refreshBadges(); toast(`Marked as ${sel.value}`); }
    catch (err) { toast(err.message, 'err'); }
  });
  $('[data-q]', view).addEventListener('input', e => { q = e.target.value; draw(); });
  $('[data-export]').onclick = () => {
    const cols = ['createdAt', 'name', 'phone', 'email', 'city', 'product', 'message', 'status', 'notes', 'page'];
    const csv = [cols.join(','), ...items.map(e => cols.map(c => `"${String(c === 'createdAt' ? fmtDate(e.createdAt) : e[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadFile(`liveteck-enquiries-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + csv, 'text/csv');
  };
}

function openEnquiry(item, done) {
  const body = h(`<div class="form">
    <div class="grid-2">
      <div><div class="label">Name</div><div class="cell-main">${esc(item.name)}</div></div>
      <div><div class="label">Received</div><div>${fmtDate(item.createdAt)}</div></div>
      <div><div class="label">Phone</div><div>${esc(item.phone)}</div></div>
      <div><div class="label">Email</div><div>${esc(item.email || '—')}</div></div>
      <div><div class="label">City</div><div>${esc(item.city || '—')}</div></div>
      <div><div class="label">Product</div><div>${esc(item.product || 'General enquiry')}</div></div>
    </div>
    <div><div class="label">Message</div><p style="white-space:pre-wrap;margin-top:4px">${esc(item.message || '—')}</p></div>
    <div class="field"><label>Status</label><select name="status">${STATUSES.map(s => `<option ${s === item.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    ${area('notes', 'Internal notes', item.notes || '', { rows: 3, hint: 'Only visible to admins' })}
    <div class="row"><a class="btn btn--ghost btn--sm" href="tel:${esc(item.phone)}">${ic.phone} Call</a><a class="btn btn--wa btn--sm" target="_blank" rel="noopener" href="${waLink(item.phone, `Hi ${item.name}, thank you for your enquiry with Liveteck Ply & Boards.`)}">${ic.wa} WhatsApp</a>${item.email ? `<a class="btn btn--ghost btn--sm" href="mailto:${esc(item.email)}">Email</a>` : ''}</div>
  </div>`);
  modal({
    title: 'Enquiry details', body,
    footer: [{ label: 'Close', cls: 'btn--ghost', onClick: ({ close }) => close() }, {
      label: 'Save', onClick: async ({ close, btn }) => {
        btn.disabled = true;
        const data = { status: $('[name=status]', body).value, notes: $('[name=notes]', body).value.trim() };
        try { await store.update('enquiries', item.id, data); Object.assign(item, data); toast('Saved'); close(); done(); } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
      },
    }],
  });
}

/* ======================================================================
   PRODUCTS
   ====================================================================== */
export async function products(view, params) {
  loading(view);
  let cats = [], items = [], cat = 'all', q = '';
  ctx.setActions(`<button class="btn btn--gold" data-new>${ic.plus} Add product</button>`);
  try { [cats, items] = await Promise.all([store.list('categories'), store.list('products')]); } catch (err) { return fail(view, err); }
  cats.sort(byOrder); items.sort(byOrder);
  const catName = id => cats.find(c => c.id === id)?.name || id || '—';

  if (!items.length) {
    view.innerHTML = `<div class="card empty"><h3>Your catalogue is empty</h3><p>Import the 11 Liveteck products and 6 categories to get started — you can edit everything afterwards.</p><div class="row" style="justify-content:center;margin-top:18px"><button class="btn btn--gold" data-seed>Import default catalogue</button><button class="btn btn--ghost" data-new2>Add a product manually</button></div></div>`;
    $('[data-seed]', view).onclick = async (e) => { e.target.disabled = true; try { const n = await store.seedCatalogue('missing'); toast(`Imported ${n} items`); products(view, {}); } catch (err) { toast(err.message, 'err'); e.target.disabled = false; } };
    $('[data-new2]', view).onclick = () => productForm(null, cats, () => products(view, {}));
    $('[data-new]').onclick = () => productForm(null, cats, () => products(view, {}));
    return;
  }

  view.innerHTML = `
    <div class="toolbar"><div class="seg" data-seg></div><label class="search">${ic.search}<input placeholder="Search products…" data-q /></label></div>
    <div class="p-grid" data-grid></div>`;
  const draw = () => {
    $('[data-seg]', view).innerHTML = [['all', 'All'], ...cats.map(c => [c.id, c.name])].map(([k, l]) => `<button aria-pressed="${cat === k}" data-f="${esc(k)}">${esc(l)}</button>`).join('');
    const ql = q.toLowerCase();
    const rows = items.filter(p => (cat === 'all' || p.category === cat) && (!ql || [p.name, p.thickness, p.short].join(' ').toLowerCase().includes(ql)));
    $('[data-grid]', view).innerHTML = rows.map(p => `
      <article class="card p-card" data-id="${esc(p.id)}">
        <div class="p-img">${p.images?.[0] ? `<img src="${esc(thumb(p.images[0], 'w_520,h_390,c_fill'))}" alt="" loading="lazy" />` : ''}<span class="pill ${p.published === false ? 'hidden' : 'approved'}">${p.published === false ? 'Hidden' : 'Live'}</span></div>
        <div class="p-body">
          <h3>${esc(p.name)}</h3>
          <div class="cell-sub">${esc(catName(p.category))}${p.thickness ? ` · ${esc(p.thickness)}` : ''} · order ${p.order ?? '—'}</div>
          <div class="small muted clamp">${esc(p.short || '')}</div>
        </div>
        <div class="p-foot">
          <label class="check small" title="Show on website">${`<span class="switch"><input type="checkbox" data-pub ${p.published !== false ? 'checked' : ''} /><span></span></span>`} Live</label>
          <label class="check small" title="Show in Featured on home page"><span class="switch"><input type="checkbox" data-feat ${p.featured ? 'checked' : ''} /><span></span></span> Featured</label>
          <span class="spacer"></span>
          <button class="icon-btn" data-edit title="Edit">${ic.edit}</button>
          <button class="icon-btn danger" data-del title="Delete">${ic.trash}</button>
        </div>
      </article>`).join('') || '<div class="card empty" style="grid-column:1/-1"><h3>No products match</h3></div>';
  };
  draw();
  const reload = () => products(view, {});
  $('[data-new]').onclick = () => productForm(null, cats, reload);
  $('[data-q]', view).addEventListener('input', e => { q = e.target.value; draw(); });
  on(view, 'click', async e => {
    const f = e.target.closest('[data-f]'); if (f) { cat = f.dataset.f; draw(); return; }
    const card = e.target.closest('[data-id]'); if (!card) return;
    const p = items.find(x => x.id === card.dataset.id);
    if (e.target.closest('[data-edit]')) productForm(p, cats, reload);
    if (e.target.closest('[data-del]')) {
      if (!(await confirmBox(`Delete “${p.name}” from the catalogue?`))) return;
      await store.remove('products', p.id); toast('Product deleted'); reload();
    }
  });
  on(view, 'change', async e => {
    const card = e.target.closest('[data-id]'); if (!card) return;
    const p = items.find(x => x.id === card.dataset.id);
    const key = e.target.matches('[data-pub]') ? 'published' : e.target.matches('[data-feat]') ? 'featured' : null;
    if (!key) return;
    try { await store.update('products', p.id, { [key]: e.target.checked }); p[key] = e.target.checked; draw(); toast('Updated'); } catch (err) { toast(err.message, 'err'); }
  });
  if (params.get?.('new')) productForm(null, cats, reload);
}

function productForm(p, cats, done) {
  const isNew = !p;
  p = p || { name: '', category: cats[0]?.id || 'plywood', thickness: '', badge: '', short: '', description: '', features: [], specs: [], applications: [], images: [], featured: false, published: true, order: 50 };
  const body = h(`<form class="form" novalidate>
    <div class="grid-2">
      ${field('name', 'Product name *', p.name, { attrs: 'required maxlength="100"' })}
      ${field('id', 'URL id', p.id || '', { hint: isNew ? 'Auto-filled from the name. Used in links (products.html#id).' : 'Cannot be changed after creation.', attrs: isNew ? '' : 'readonly' })}
    </div>
    <div class="grid-3">
      <div class="field"><label>Category</label><select name="category">${cats.map(c => `<option value="${esc(c.id)}" ${c.id === p.category ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      ${field('thickness', 'Thickness', p.thickness, { hint: 'e.g. 19 mm' })}
      ${field('badge', 'Badge', p.badge, { hint: 'Optional, e.g. Heavy duty' })}
    </div>
    ${area('short', 'Short description (cards)', p.short, { rows: 2 })}
    ${area('description', 'Full description (detail view)', p.description, { rows: 4 })}
    <div class="grid-2">
      ${area('features', 'Extra key features — one per line', (p.features || []).join('\n'), { rows: 6, hint: 'Shown after the category’s shared key features (edit those under Categories). Leave empty to show only the shared list.' })}
      ${area('specs', 'Specifications — “Label: Value” per line', (p.specs || []).map(s => `${s.label}: ${s.value}`).join('\n'), { rows: 6 })}
    </div>
    ${area('applications', 'Ideal for — one per line', (p.applications || []).join('\n'), { rows: 3 })}
    <div data-media></div>
    <div class="row" style="gap:22px">${toggle('published', 'Show on website', p.published !== false)}${toggle('featured', 'Featured on home page', !!p.featured)}
      <div class="field" style="width:120px"><label>Sort order</label><input type="number" name="order" value="${esc(p.order ?? 50)}" /></div></div>
    <p class="error-text" data-err hidden></p>
  </form>`);
  const media = mediaField({ label: 'Product images (first = cover)', urls: p.images || [], folder: 'liveteck/products' });
  $('[data-media]', body).replaceWith(media.el);
  const nameI = $('[name=name]', body), idI = $('[name=id]', body);
  if (isNew) nameI.addEventListener('input', () => { if (!idI.dataset.touched) idI.value = slugify(nameI.value); });
  idI.addEventListener('input', () => { idI.dataset.touched = '1'; });

  modal({
    title: isNew ? 'Add product' : `Edit · ${p.name}`, body,
    footer: [{ label: 'Cancel', cls: 'btn--ghost', onClick: ({ close }) => close() }, {
      label: isNew ? 'Create product' : 'Save changes', onClick: async ({ close, btn }) => {
        const fd = Object.fromEntries(new FormData(body));
        const err = $('[data-err]', body);
        const id = isNew ? slugify(fd.id || fd.name) : p.id;
        if (!fd.name.trim() || !id) { err.hidden = false; err.textContent = 'Please enter a product name.'; return; }
        const data = {
          name: fd.name.trim(), category: fd.category, thickness: fd.thickness.trim(), badge: fd.badge.trim(),
          short: fd.short.trim(), description: fd.description.trim(),
          features: lines(fd.features), applications: lines(fd.applications),
          specs: lines(fd.specs).map(l => { const i = l.indexOf(':'); return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { label: l, value: '' }; }),
          images: media.value(), published: !!fd.published, featured: !!fd.featured, order: Number(fd.order) || 0,
        };
        btn.disabled = true;
        try {
          if (isNew && (await store.get('products', id))) throw new Error(`A product with id “${id}” already exists.`);
          await store.set('products', id, data, !isNew);
          toast(isNew ? 'Product created' : 'Product saved'); close(); done();
        } catch (e) { err.hidden = false; err.textContent = e.message; btn.disabled = false; }
      },
    }],
  });
}

/* ======================================================================
   CATEGORIES
   ====================================================================== */
export async function categories(view) {
  loading(view);
  ctx.setActions(`<button class="btn btn--gold" data-new>${ic.plus} Add category</button>`);
  let cats, prods;
  try { [cats, prods] = await Promise.all([store.list('categories'), store.list('products')]); } catch (err) { return fail(view, err); }
  cats.sort(byOrder);
  const reload = () => categories(view);
  view.innerHTML = `<div class="card"><div class="table-wrap">${cats.length ? `<table class="t"><thead><tr><th></th><th>Name</th><th>Label</th><th>Products</th><th>Order</th><th></th></tr></thead><tbody>
    ${cats.map(c => `<tr data-id="${esc(c.id)}"><td><img class="thumb" src="${esc(thumb(c.image, 'w_120,h_96,c_fill'))}" alt="" /></td>
      <td><div class="cell-main">${esc(c.name)}</div><div class="cell-sub">#${esc(c.id)}</div></td><td>${esc(c.meta || '')}</td>
      <td>${prods.filter(p => p.category === c.id).length}</td><td>${c.order ?? '—'}</td>
      <td><div class="row" style="flex-wrap:nowrap"><button class="icon-btn" data-edit>${ic.edit}</button><button class="icon-btn danger" data-del>${ic.trash}</button></div></td></tr>`).join('')}
    </tbody></table>` : '<div class="empty"><h3>No categories yet</h3><p>Use “Import default catalogue” in Settings, or add one.</p></div>'}</div></div>`;
  $('[data-new]').onclick = () => categoryForm(null, reload);
  on(view, 'click', async e => {
    const row = e.target.closest('tr[data-id]'); if (!row) return;
    const c = cats.find(x => x.id === row.dataset.id);
    if (e.target.closest('[data-edit]')) categoryForm(c, reload);
    if (e.target.closest('[data-del]')) {
      const n = prods.filter(p => p.category === c.id).length;
      if (!(await confirmBox(`Delete category “${c.name}”?${n ? ` ${n} product(s) use it and will show under “More products”.` : ''}`))) return;
      await store.remove('categories', c.id); toast('Category deleted'); reload();
    }
  });
}

function categoryForm(c, done) {
  const isNew = !c;
  c = c || { name: '', meta: '', short: '', description: '', image: '', order: 10 };
  const body = h(`<form class="form">
    <div class="grid-2">${field('name', 'Name *', c.name)}${field('id', 'URL id', c.id || '', { attrs: isNew ? '' : 'readonly', hint: isNew ? 'Auto-filled from the name' : '' })}</div>
    <div class="grid-2">${field('meta', 'Small label', c.meta, { hint: 'e.g. 19 · 25 mm' })}<div class="field"><label>Sort order</label><input type="number" name="order" value="${esc(c.order ?? 10)}" /></div></div>
    ${area('short', 'Short description', c.short, { rows: 2 })}
    ${area('description', 'Description (products page)', c.description, { rows: 3 })}
    ${area('features', 'Shared key features — one per line', (c.features || []).join('\n'), { rows: 5, hint: 'Shown first on every product in this category (e.g. the same list for all plywood). Each product’s own key features follow after these.' })}
    <div data-media></div><p class="error-text" data-err hidden></p></form>`);
  const media = mediaField({ label: 'Category image', urls: [c.image], multiple: false, folder: 'liveteck/categories' });
  $('[data-media]', body).replaceWith(media.el);
  const nameI = $('[name=name]', body), idI = $('[name=id]', body);
  if (isNew) nameI.addEventListener('input', () => { idI.value = slugify(nameI.value); });
  modal({
    title: isNew ? 'Add category' : `Edit · ${c.name}`, body,
    footer: [{ label: 'Cancel', cls: 'btn--ghost', onClick: ({ close }) => close() }, {
      label: 'Save', onClick: async ({ close, btn }) => {
        const fd = Object.fromEntries(new FormData(body));
        const id = isNew ? slugify(fd.id || fd.name) : c.id;
        if (!fd.name.trim() || !id) { const e = $('[data-err]', body); e.hidden = false; e.textContent = 'Please enter a name.'; return; }
        btn.disabled = true;
        try {
          await store.set('categories', id, { name: fd.name.trim(), meta: fd.meta.trim(), short: fd.short.trim(), description: fd.description.trim(), features: lines(fd.features), image: media.value(), order: Number(fd.order) || 0 });
          toast('Category saved'); close(); done();
        } catch (e) { toast(e.message, 'err'); btn.disabled = false; }
      },
    }],
  });
}

/* ======================================================================
   TESTIMONIALS
   ====================================================================== */
export async function testimonials(view) {
  loading(view);
  let items = [], filter = 'pending';
  ctx.setActions(`<button class="btn btn--gold" data-new>${ic.plus} Add testimonial</button>`);
  try { items = (await store.list('testimonials')).sort(byNewest); } catch (err) { return fail(view, err); }
  if (!items.some(t => t.status === 'pending')) filter = 'approved';
  const reload = () => testimonials(view);
  view.innerHTML = `
    <div class="card card-body small" style="background:#fff8e8;border-color:#f0dfb4">Only publish genuine reviews from real customers. Reviews submitted on the website arrive here as <b>pending</b> — approve them to show them on the site.</div>
    <div class="toolbar"><div class="seg" data-seg></div></div><div class="t-list" data-list></div>`;
  const draw = () => {
    const c = s => items.filter(t => t.status === s).length;
    $('[data-seg]', view).innerHTML = [['pending', `Pending (${c('pending')})`], ['approved', `Published (${c('approved')})`], ['hidden', `Hidden (${c('hidden')})`], ['all', `All (${items.length})`]]
      .map(([k, l]) => `<button aria-pressed="${filter === k}" data-f="${k}">${l}</button>`).join('');
    const rows = items.filter(t => filter === 'all' || t.status === filter);
    $('[data-list]', view).innerHTML = rows.map(t => `
      <article class="card t-item" data-id="${t.id}">
        <div class="t-head">${t.photo ? `<img class="t-photo" src="${esc(thumb(t.photo, 'w_96,h_96,c_fill,g_face'))}" alt="" />` : ''}<div><span class="stars">${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}</span>
          <div class="cell-main" style="margin-top:6px">${esc(t.name)} <span class="cell-sub">${esc([t.role, t.company, t.city].filter(Boolean).join(' · '))}</span></div>
          <div class="cell-sub">${fmtDate(t.createdAt)} · ${t.source === 'website' ? 'Submitted on website' : 'Added by admin'}${t.photo ? ' · with photo' : ''}</div></div></div>
        <div class="row" style="align-self:start"><span class="pill ${esc(t.status)}">${t.status === 'approved' ? 'published' : esc(t.status)}</span>
          ${t.status !== 'approved' ? `<button class="btn btn--sm" data-approve>${ic.check} Approve</button>` : `<button class="btn btn--ghost btn--sm" data-hide>Hide</button>`}
          <button class="icon-btn" data-edit>${ic.edit}</button><button class="icon-btn danger" data-del>${ic.trash}</button></div>
        <blockquote>“${esc(t.message)}”</blockquote>
      </article>`).join('') || `<div class="card empty"><h3>Nothing here</h3><p>${filter === 'pending' ? 'No reviews are waiting for approval.' : 'No testimonials in this list yet.'}</p></div>`;
  };
  draw();
  $('[data-new]').onclick = () => testimonialForm(null, reload);
  on(view, 'click', async e => {
    const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; draw(); return; }
    const card = e.target.closest('[data-id]'); if (!card) return;
    const t = items.find(x => x.id === card.dataset.id);
    const setStatus = async (status) => { await store.update('testimonials', t.id, { status }); t.status = status; draw(); ctx.refreshBadges(); toast(status === 'approved' ? 'Published on website' : 'Hidden from website'); };
    if (e.target.closest('[data-approve]')) setStatus('approved');
    if (e.target.closest('[data-hide]')) setStatus('hidden');
    if (e.target.closest('[data-edit]')) testimonialForm(t, reload);
    if (e.target.closest('[data-del]')) {
      if (!(await confirmBox(`Delete the testimonial from ${t.name}?`))) return;
      await store.remove('testimonials', t.id); toast('Deleted'); reload(); ctx.refreshBadges();
    }
  });
}

function testimonialForm(t, done) {
  const isNew = !t;
  t = t || { name: '', role: '', company: '', city: '', message: '', rating: 5, photo: '', status: 'approved', order: 10 };
  const body = h(`<form class="form">
    <div class="grid-2">${field('name', 'Customer name *', t.name)}${field('city', 'City', t.city)}</div>
    <div class="grid-2">${field('role', 'Role', t.role, { hint: 'e.g. Interior Designer, Homeowner' })}${field('company', 'Company / business', t.company)}</div>
    ${area('message', 'Review *', t.message, { rows: 5 })}
    <div class="grid-3">
      <div class="field"><label>Rating</label><select name="rating">${[5, 4, 3, 2, 1].map(n => `<option value="${n}" ${n === (t.rating || 5) ? 'selected' : ''}>${'★'.repeat(n)} (${n})</option>`).join('')}</select></div>
      <div class="field"><label>Status</label><select name="status">${[['approved', 'Published'], ['pending', 'Pending'], ['hidden', 'Hidden']].map(([v, l]) => `<option value="${v}" ${v === t.status ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Sort order</label><input type="number" name="order" value="${esc(t.order ?? 10)}" /></div>
    </div>
    <div data-media></div><p class="error-text" data-err hidden></p></form>`);
  const media = mediaField({ label: 'Customer photo (optional)', urls: [t.photo], multiple: false, folder: 'liveteck/testimonials' });
  $('[data-media]', body).replaceWith(media.el);
  modal({
    title: isNew ? 'Add testimonial' : 'Edit testimonial', body,
    footer: [{ label: 'Cancel', cls: 'btn--ghost', onClick: ({ close }) => close() }, {
      label: 'Save', onClick: async ({ close, btn }) => {
        const fd = Object.fromEntries(new FormData(body));
        if (!fd.name.trim() || fd.message.trim().length < 5) { const e = $('[data-err]', body); e.hidden = false; e.textContent = 'Please enter the customer name and review.'; return; }
        const data = { name: fd.name.trim(), city: fd.city.trim(), role: fd.role.trim(), company: fd.company.trim(), message: fd.message.trim(), rating: Number(fd.rating), status: fd.status, order: Number(fd.order) || 0, photo: media.value() };
        btn.disabled = true;
        try { isNew ? await store.add('testimonials', { ...data, source: 'admin' }) : await store.update('testimonials', t.id, data); toast('Saved'); close(); done(); ctx.refreshBadges(); }
        catch (e) { toast(e.message, 'err'); btn.disabled = false; }
      },
    }],
  });
}

/* ======================================================================
   MEDIA LIBRARY
   ====================================================================== */
export async function media(view) {
  loading(view);
  ctx.setActions('');
  let items = [];
  try { items = (await store.list('media')).sort(byNewest); } catch (err) { return fail(view, err); }
  const reload = () => media(view);
  view.innerHTML = `<div class="card card-body" data-up></div>
    <div class="card"><div class="card-head"><h2>Library</h2><span class="muted small">${items.length} files · stored on Cloudinary</span></div>
    <div class="card-body">${items.length ? `<div class="m-grid">${items.map(m => `
      <div class="card m-card" data-id="${m.id}">
        <div class="m-media">${m.type === 'video' ? `<video src="${esc(m.url)}" muted preload="metadata"></video>` : `<img src="${esc(thumb(m.url))}" alt="" loading="lazy" />`}</div>
        <div class="m-body"><div class="m-name" title="${esc(m.name)}">${esc(m.name || m.publicId)}</div>
          <div class="cell-sub">${m.width ? `${m.width}×${m.height} · ` : ''}${m.bytes ? `${(m.bytes / 1048576).toFixed(1)} MB` : ''}</div>
          <div class="row"><button class="btn btn--ghost btn--sm" data-copy>${ic.copy} Copy URL</button><a class="icon-btn" href="${esc(m.url)}" target="_blank" rel="noopener">${ic.eye}</a><button class="icon-btn danger" data-del>${ic.trash}</button></div></div>
      </div>`).join('')}</div>` : '<div class="empty"><h3>No uploads yet</h3><p>Images and videos you upload anywhere in the dashboard appear here.</p></div>'}</div></div>`;
  const up = mediaField({ label: 'Upload images or videos', urls: [], multiple: true, folder: 'liveteck/media', accept: 'image/*,video/*', hint: 'Images or MP4 videos · uploaded files are added to the library below' });
  $('[data-up]', view).appendChild(up.el);
  let timer; new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(() => { if (up.value().length) reload(); }, 1200); }).observe($('.img-list', up.el), { childList: true });
  on(view, 'click', async e => {
    const card = e.target.closest('[data-id]'); if (!card) return;
    const m = items.find(x => x.id === card.dataset.id);
    if (e.target.closest('[data-copy]')) { await navigator.clipboard.writeText(m.url).catch(() => {}); toast('URL copied'); }
    if (e.target.closest('[data-del]')) {
      if (!(await confirmBox('Remove this file from the library? (The file stays on Cloudinary; pages already using it keep working.)', { ok: 'Remove' }))) return;
      await store.remove('media', m.id); toast('Removed'); reload();
    }
  });
}

/* ======================================================================
   SETTINGS
   ====================================================================== */
export async function settings(view) {
  loading(view);
  ctx.setActions('<button class="btn btn--gold" data-save>Save settings</button>');
  let s;
  try { s = await store.getSettings(); } catch (err) { return fail(view, err); }
  const soc = s.social || {};
  view.innerHTML = `<form class="form" data-form style="max-width:980px">
    <div class="form-section"><h3>Business</h3>
      <div class="grid-2">${field('businessName', 'Business name', s.businessName)}${field('tagline', 'Tagline', s.tagline)}</div>
      <div class="grid-2">${field('owner', 'Owner', s.owner)}${field('established', 'Established', s.established)}</div>
      <div class="grid-2"><div data-founder-photo></div><p class="small muted" style="align-self:center">Shown with the founder’s name on the About page. A portrait (4:5, face centred) looks best. Remove it to show the logo card instead.</p></div>
    </div>
    <div class="form-section"><h3>Contact</h3>
      <div class="grid-2">${field('phone', 'Phone (display)', s.phone, { hint: 'e.g. +91 99121 53030' })}${field('whatsapp', 'WhatsApp number', s.whatsapp, { hint: 'Digits with country code, e.g. 919912153030' })}</div>
      <div class="grid-2">${field('email', 'Email', s.email, { type: 'email' })}${field('hours', 'Business hours', s.hours, { hint: 'e.g. Mon–Sat 9:30 AM – 8:30 PM · Sunday closed' })}</div>
      <div class="grid-2">${field('addressLine1', 'Address line 1', s.addressLine1)}${field('addressLine2', 'Address line 2', s.addressLine2)}</div>
      ${field('gst', 'GSTIN', s.gst, { hint: 'Shown in the footer when filled' })}
    </div>
    <div class="form-section"><h3>Google Maps</h3>
      ${area('mapEmbed', 'Map embed', s.mapEmbed, { rows: 3, hint: 'Paste the full &lt;iframe&gt; code from Google Maps → Share → Embed a map, or just its src URL.' })}
      ${/Rajendra/i.test(s.mapEmbed || '') ? '<p class="error-text">⚠ The current map embed points to “Rajendra Glass &amp; Plywoods”. Please replace it with the verified Liveteck location.</p>' : ''}
      ${field('mapLink', 'Directions link', s.mapLink, { hint: 'Google Maps link used for “Get directions” buttons' })}
    </div>
    <div class="form-section"><h3>Social &amp; reviews</h3>
      <div class="grid-2">${field('social.facebook', 'Facebook URL', soc.facebook)}${field('social.instagram', 'Instagram URL', soc.instagram)}</div>
      <div class="grid-2">${field('social.youtube', 'YouTube URL', soc.youtube)}${field('social.google', 'Google Business Profile URL', soc.google)}</div>
      ${field('googleReviewUrl', 'Google “write a review” link', s.googleReviewUrl)}
    </div>
    <div class="form-section"><h3>Home page hero</h3>
      ${field('heroTitle', 'Headline', s.heroTitle, { hint: 'Wrap words in &lt;em&gt;…&lt;/em&gt; for the gold italic accent' })}
      ${area('heroSubtitle', 'Sub-headline', s.heroSubtitle, { rows: 2 })}
      <div class="grid-2"><div data-hero-video></div><div data-hero-poster></div></div>
    </div>
  </form>
  <div class="card" style="max-width:980px"><div class="card-head"><h2>Data tools</h2></div><div class="card-body" style="display:grid;gap:12px">
    <div class="row"><button class="btn btn--ghost" data-seed>Import missing default products &amp; categories</button><span class="small muted">Adds any of the 11 default products / 6 categories that are not in the database yet.</span></div>
    <div class="row"><button class="btn btn--danger" data-reset>Reset catalogue to defaults</button><span class="small muted">Overwrites the default products &amp; categories with the original content.</span></div>
    <div class="row"><button class="btn btn--ghost" data-backup>${ic.download} Download backup (JSON)</button></div>
  </div></div>`;
  const vid = mediaField({ label: 'Hero background video', urls: [s.heroVideo], multiple: false, folder: 'liveteck/video', accept: 'video/*' });
  const poster = mediaField({ label: 'Hero poster image (shown while video loads)', urls: [s.heroPoster], multiple: false, folder: 'liveteck/brand' });
  const founder = mediaField({ label: 'Founder photo', urls: [s.founderPhoto], multiple: false, folder: 'liveteck/brand' });
  $('[data-founder-photo]', view).replaceWith(founder.el);
  $('[data-hero-video]', view).replaceWith(vid.el);
  $('[data-hero-poster]', view).replaceWith(poster.el);

  $('[data-save]').onclick = async (e) => {
    const fd = Object.fromEntries(new FormData($('[data-form]', view)));
    const data = { social: {} };
    Object.entries(fd).forEach(([k, v]) => { v = String(v).trim(); k.startsWith('social.') ? (data.social[k.slice(7)] = v) : (data[k] = v); });
    const m = data.mapEmbed.match(/src="([^"]+)"/); if (m) data.mapEmbed = m[1];
    data.whatsapp = data.whatsapp.replace(/\D/g, '');
    data.heroVideo = vid.value(); data.heroPoster = poster.value(); data.founderPhoto = founder.value();
    e.target.disabled = true;
    try { await store.saveSettings(data); toast('Settings saved — the website updates instantly'); settings(view); }
    catch (err) { toast(err.message, 'err'); e.target.disabled = false; }
  };
  $('[data-seed]', view).onclick = async (e) => { e.target.disabled = true; try { toast(`Imported ${await store.seedCatalogue('missing')} items`); } catch (err) { toast(err.message, 'err'); } e.target.disabled = false; };
  $('[data-reset]', view).onclick = async (e) => {
    if (!(await confirmBox('Overwrite the default products and categories with the original content? Your edits to those items will be lost.', { ok: 'Reset' }))) return;
    e.target.disabled = true; try { toast(`Reset ${await store.seedCatalogue('overwrite')} items`); } catch (err) { toast(err.message, 'err'); } e.target.disabled = false;
  };
  $('[data-backup]', view).onclick = async () => {
    const data = await store.exportAll();
    downloadFile(`liveteck-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, (k, v) => (v && typeof v === 'object' && 'seconds' in v && 'nanoseconds' in v ? new Date(v.seconds * 1000).toISOString() : v), 2), 'application/json');
  };
}
