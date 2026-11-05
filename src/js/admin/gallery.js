/* ======================================================================
   GALLERY: the photos on the public /gallery page. The owner picks each one
   (upload new, or choose from the Media library), so private or product-only
   images never show up there by accident.
   ====================================================================== */
import { $, $$, esc, h, ic, toast, modal, confirmBox, uploadToCloudinary, thumb } from './ui.js';
import * as store from './store.js';

const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
const on = (el, type, fn) => { el._lt = el._lt || {}; if (el._lt[type]) el.removeEventListener(type, el._lt[type]); el._lt[type] = fn; el.addEventListener(type, fn); };

export async function gallery(view) {
  view.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  $('#view-actions').innerHTML = `<button class="btn btn--ghost" type="button" data-pick>${ic.image}<span class="hide-sm">From media library</span></button><button class="btn btn--gold" type="button" data-upload>${ic.upload}<span>Upload photos</span></button>`;
  let items = [];
  try { items = (await store.list('gallery')).sort(byOrder); }
  catch (err) {
    console.error(err);
    view.innerHTML = `<div class="card empty"><h3>Could not load the gallery</h3><p>${/permission/i.test(err.message) ? 'The database rules for the Gallery are not published yet. They need to be published once (ask your developer).' : esc(err.message)}</p></div>`;
    return;
  }
  const reload = () => gallery(view);
  const albums = () => [...new Set(items.map(g => g.album).filter(Boolean))].sort();
  const nextOrder = () => (items.reduce((m, g) => Math.max(m, g.order ?? 0), 0) || 0) + 10;
  const input = h('<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden />');
  view.appendChild(input);

  const draw = () => {
    const live = items.filter(g => g.published !== false).length;
    view.innerHTML = '';
    view.appendChild(input);
    view.insertAdjacentHTML('beforeend', `
      <div class="card card-body small" style="background:#fff8e8;border-color:#f0dfb4">Photos here appear on the website’s <b>Gallery</b> page, in this order. Use real photos of work done with Liveteck boards (with the customer’s OK). Hidden photos stay here but are not shown on the site.</div>
      <div class="up-status" data-status style="display:grid;gap:6px"></div>
      <div class="card">
        <div class="card-head"><h2>Gallery photos</h2><span class="muted small">${live} shown on the website · ${items.length - live} hidden</span><span class="spacer"></span><a class="btn btn--ghost btn--sm" href="/gallery.html" target="_blank" rel="noopener">${ic.eye} View page</a></div>
        <div class="card-body">${items.length ? `<div class="g-grid">${items.map((g, i) => `
          <article class="card g-card ${g.published === false ? 'is-off' : ''}" data-id="${esc(g.id)}">
            <div class="g-img"><img src="${esc(thumb(g.url, 'w_480,h_360,c_fill'))}" alt="" loading="lazy" />${g.published === false ? '<span class="pill hidden">hidden</span>' : ''}</div>
            <div class="g-body"><span class="g-cap">${esc(g.caption || 'No caption')}</span><span class="cell-sub">${esc(g.album || 'No album')}</span></div>
            <div class="g-foot">
              <button type="button" class="icon-btn" data-mv="-1" aria-label="Move earlier" ${i ? '' : 'disabled'}>${ic.left}</button>
              <button type="button" class="icon-btn" data-mv="1" aria-label="Move later" ${i < items.length - 1 ? '' : 'disabled'}>${ic.right}</button>
              <span class="spacer"></span>
              <label class="check small" title="Show on website"><span class="switch"><input type="checkbox" data-pub ${g.published !== false ? 'checked' : ''} aria-label="Show on website" /><span></span></span></label>
              <button type="button" class="icon-btn" data-edit aria-label="Edit caption">${ic.edit}</button>
              <button type="button" class="icon-btn danger" data-del aria-label="Remove from gallery">${ic.trash}</button>
            </div>
          </article>`).join('')}</div>` : `<div class="empty"><h3>No gallery photos yet</h3><p>Upload photos of finished kitchens, wardrobes and interiors, or pick some from the Media library.</p>
            <div class="row" style="justify-content:center;margin-top:16px"><button class="btn btn--gold" type="button" data-upload>${ic.upload} Upload photos</button><button class="btn btn--ghost" type="button" data-pick>${ic.image} From media library</button></div></div>`}</div>
      </div>`);
  };

  const addPhotos = async (urls, extra = {}) => {
    let order = nextOrder();
    for (const url of urls) {
      const data = { url, caption: extra.caption || '', album: extra.album || '', published: true, order };
      const ref = await store.add('gallery', data);
      items.push({ id: ref.id, ...data, createdAt: { seconds: Date.now() / 1000 } });
      order += 10;
    }
  };

  const upload = async (files) => {
    const list = [...files].filter(f => /^image\//.test(f.type)).slice(0, 20);
    if (!list.length) return;
    const status = $('[data-status]', view);
    const urls = [];
    for (const file of list) {
      const row = h(`<div class="card card-body"><div class="small">${esc(file.name)}</div><div class="progress"><i></i></div></div>`);
      status.appendChild(row);
      try {
        const r = await uploadToCloudinary(file, { folder: 'liveteck/gallery', onProgress: p => { $('i', row).style.width = `${Math.round(p * 100)}%`; } });
        urls.push(r.secure_url);
        store.add('media', { url: r.secure_url, publicId: r.public_id, type: r.resource_type, format: r.format, width: r.width || null, height: r.height || null, bytes: r.bytes || 0, name: file.name, folder: 'liveteck/gallery' }).catch(() => {});
        row.remove();
      } catch (err) { row.innerHTML = `<span class="error-text">${esc(file.name)}: ${esc(err.message)}</span>`; }
    }
    if (!urls.length) return;
    try { await addPhotos(urls); toast(`${urls.length} photo${urls.length > 1 ? 's' : ''} added to the gallery`); draw(); askDetails(items.slice(-urls.length)); }
    catch (err) { toast(err.message, 'err'); }
  };

  /** After adding: one caption/album form for the whole batch (optional). */
  const askDetails = (added) => {
    if (!added.length) return;
    editForm(added, `Add a caption for ${added.length > 1 ? `these ${added.length} photos` : 'this photo'}`);
  };

  const editForm = (list, title) => {
    const one = list.length === 1 ? list[0] : null;
    const body = h(`<form class="form" novalidate>
      ${one ? `<img src="${esc(thumb(one.url, 'w_720,h_480,c_fill'))}" alt="" style="border-radius:12px;aspect-ratio:3/2;object-fit:cover;width:100%" />` : ''}
      <div class="field"><label for="g-cap">Caption</label><input id="g-cap" name="caption" value="${esc(one?.caption || '')}" placeholder="e.g. Modular kitchen in BWP plywood, Kakinada" maxlength="120" /><span class="hint">Shown under the photo. Also helps Google understand the image.</span></div>
      <div class="field"><label for="g-album">Album</label><input id="g-album" name="album" list="g-albums" value="${esc(one?.album || '')}" placeholder="e.g. Kitchen, Bedroom, Showroom" maxlength="40" /><datalist id="g-albums">${albums().map(a => `<option value="${esc(a)}"></option>`).join('')}</datalist><span class="hint">Visitors can filter the gallery by album. Pick one you used before or type a new one.</span></div>
    </form>`);
    modal({
      title, body, size: 'sm',
      footer: [
        { label: one ? 'Cancel' : 'Skip', cls: 'btn--ghost', onClick: ({ close }) => close() },
        { label: 'Save', cls: 'btn--gold', onClick: async ({ close, btn }) => {
          const caption = body.caption.value.trim(), album = body.album.value.trim();
          btn.disabled = true;
          try {
            for (const g of list) {
              const patch = one ? { caption, album } : { ...(caption ? { caption } : {}), ...(album ? { album } : {}) };
              if (!Object.keys(patch).length) continue;
              await store.update('gallery', g.id, patch); Object.assign(g, patch);
            }
            close(); draw(); toast('Saved');
          } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
        } },
      ],
    });
  };

  const pickFromLibrary = async () => {
    let media = [];
    try { media = (await store.list('media')).filter(m => m.type !== 'video' && m.url).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); }
    catch (err) { return toast(err.message, 'err'); }
    const used = new Set(items.map(g => g.url));
    const chosen = new Set();
    const body = h(`<div class="form">
      <p class="muted small">Tap the photos to add. Faded ones are already in the gallery.</p>
      ${media.length ? `<div class="pick-grid">${media.map((m, i) => `<button type="button" class="pick-item ${used.has(m.url) ? 'is-used' : ''}" data-i="${i}" aria-pressed="false" aria-label="${esc(m.name || 'Photo')}"><img src="${esc(thumb(m.url, 'w_240,h_180,c_fill'))}" alt="" loading="lazy" /></button>`).join('')}</div>` : '<div class="empty"><h3>The library is empty</h3><p>Upload photos instead.</p></div>'}
    </div>`);
    let btnEl;
    body.addEventListener('click', e => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      const m = media[+b.dataset.i];
      chosen.has(m.url) ? chosen.delete(m.url) : chosen.add(m.url);
      b.setAttribute('aria-pressed', String(chosen.has(m.url)));
      if (btnEl) btnEl.textContent = chosen.size ? `Add ${chosen.size} photo${chosen.size > 1 ? 's' : ''}` : 'Add photos';
    });
    const m = modal({
      title: 'Choose from the media library', body,
      footer: [
        { label: 'Cancel', cls: 'btn--ghost', onClick: ({ close }) => close() },
        { label: 'Add photos', cls: 'btn--gold', onClick: async ({ close, btn }) => {
          if (!chosen.size) return toast('Tap at least one photo', 'err');
          btn.disabled = true;
          try { const n = chosen.size; await addPhotos([...chosen]); close(); draw(); toast(`${n} photo${n > 1 ? 's' : ''} added`); askDetails(items.slice(-n)); }
          catch (err) { toast(err.message, 'err'); btn.disabled = false; }
        } },
      ],
    });
    btnEl = $('.modal-foot .btn--gold', m.el);
  };

  draw();
  input.addEventListener('change', () => { upload(input.files); input.value = ''; });
  $('[data-upload]', $('#view-actions')).onclick = () => input.click();
  $('[data-pick]', $('#view-actions')).onclick = pickFromLibrary;
  // drag photos anywhere on the page
  on(view, 'dragover', e => { if ([...(e.dataTransfer?.items || [])].some(i => i.kind === 'file')) e.preventDefault(); });
  on(view, 'drop', e => { if (e.dataTransfer?.files?.length) { e.preventDefault(); upload(e.dataTransfer.files); } });
  on(view, 'click', async e => {
    if (e.target.closest('[data-upload]')) return input.click();
    if (e.target.closest('[data-pick]')) return pickFromLibrary();
    const card = e.target.closest('[data-id]'); if (!card) return;
    const g = items.find(x => x.id === card.dataset.id);
    const mv = e.target.closest('[data-mv]');
    if (mv) {
      const i = items.indexOf(g), j = i + +mv.dataset.mv;
      if (j < 0 || j >= items.length) return;
      [items[i], items[j]] = [items[j], items[i]];
      items.forEach((x, k) => { x._o = (k + 1) * 10; });
      draw();
      try { await Promise.all(items.filter(x => x.order !== x._o).map(x => store.update('gallery', x.id, { order: x._o }).then(() => { x.order = x._o; }))); }
      catch (err) { toast(err.message, 'err'); reload(); }
      return;
    }
    if (e.target.closest('[data-edit]')) return editForm([g], 'Edit photo');
    if (e.target.closest('[data-del]')) {
      if (!(await confirmBox('Remove this photo from the gallery? It stays in the Media library.', { ok: 'Remove' }))) return;
      try { await store.remove('gallery', g.id); items = items.filter(x => x !== g); draw(); toast('Removed from gallery'); } catch (err) { toast(err.message, 'err'); }
    }
  });
  on(view, 'change', async e => {
    const pub = e.target.closest('[data-pub]'); if (!pub) return;
    const g = items.find(x => x.id === pub.closest('[data-id]').dataset.id);
    try { await store.update('gallery', g.id, { published: pub.checked }); g.published = pub.checked; draw(); toast(pub.checked ? 'Shown on the website' : 'Hidden from the website'); }
    catch (err) { toast(err.message, 'err'); pub.checked = !pub.checked; }
  });
}
