/* ======================================================================
   LEADS: people who reach out from Meta ads (and walk-ins, calls, referrals).
   Typed in by hand. Statuses, requirements and sources are lists the owner
   can grow (crm/options): add once, reuse every day.
   ====================================================================== */
import { $, $$, esc, h, ic, toast, modal, confirmBox, slugify, waLink, downloadFile } from './ui.js';
import * as store from './store.js';

const COLORS = { gold: 'Gold', blue: 'Blue', green: 'Green', red: 'Red', purple: 'Purple', teal: 'Teal', orange: 'Orange', pink: 'Pink', grey: 'Grey' };
const GROUPS = { open: 'Still working on it', won: 'Bought / done', lost: 'Closed, no sale' };

export const DEFAULT_OPTIONS = {
  statuses: [
    { id: 'new', label: 'New', color: 'gold', group: 'open', hint: 'Just came in. Nobody has called yet.' },
    { id: 'contacted', label: 'Contacted', color: 'blue', group: 'open', hint: 'Spoke to them. Next step agreed.' },
    { id: 'not-answered', label: 'Not answered', color: 'orange', group: 'open', followUp: true, hint: 'Called, no answer. Set when to try again.' },
    { id: 'call-later', label: 'Call later', color: 'purple', group: 'open', followUp: true, hint: 'They asked us to call back at a set time.' },
    { id: 'quotation', label: 'Quotation sent', color: 'teal', group: 'open', followUp: true, hint: 'Prices shared. Follow up to close.' },
    { id: 'visited', label: 'Visited store', color: 'pink', group: 'open', hint: 'Came to the shop and saw the range.' },
    { id: 'purchased', label: 'Purchased', color: 'green', group: 'won', hint: 'Service taken: they bought from us.' },
    { id: 'not-required', label: 'Not required now', color: 'grey', group: 'lost', followUp: true, hint: 'Need is later. Set a date to check again.' },
    { id: 'not-interested', label: 'Not interested', color: 'red', group: 'lost', hint: 'Said no. No more calls.' },
  ],
  requirements: [
    { id: 'plywood', label: 'Plywood' }, { id: 'block-board', label: 'Block boards' }, { id: 'flexi-plywood', label: 'Flexi plywood' },
    { id: 'veneer', label: 'Veneers' }, { id: 'laminates', label: 'Laminates' }, { id: 'flush-doors', label: 'Flush doors' },
    { id: 'interior', label: 'Full interior work' }, { id: 'other', label: 'Other' },
  ],
  sources: [
    { id: 'meta-fb', label: 'Meta ad · Facebook' }, { id: 'meta-ig', label: 'Meta ad · Instagram' }, { id: 'walk-in', label: 'Walk-in' },
    { id: 'phone', label: 'Phone call' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'referral', label: 'Referral' }, { id: 'website', label: 'Website' },
  ],
  waTemplate: 'Hi {name}, this is Liveteck Ply & Boards, Kakinada. Thank you for your interest. How can we help you?',
};
const LISTS = { statuses: 'Statuses', requirements: 'Requirements', sources: 'Lead sources' };

/* ---------- helpers ---------- */
const DAY = 864e5;
const startOfDay = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const createdMs = (l) => (l.createdAt?.seconds ? l.createdAt.seconds * 1000 : 0);
export const phoneKey = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.length > 10 && d.startsWith('91')) d = d.slice(-10); if (d.length === 11 && d.startsWith('0')) d = d.slice(1); return d; };
const fmtPhone = (p) => { const k = phoneKey(p); return k.length === 10 ? `+91 ${k.slice(0, 5)} ${k.slice(5)}` : String(p || ''); };
const telHref = (p) => { const k = phoneKey(p); return k.length === 10 ? `tel:+91${k}` : `tel:${String(p).replace(/[^\d+]/g, '')}`; };
const fmtWhen = (ms) => new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const fmtDay = (ms) => new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const rel = (ms) => {
  if (!ms) return '';
  const diff = Date.now() - ms, m = Math.round(diff / 6e4);
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`;
  const hr = Math.round(m / 60); if (hr < 24) return `${hr} h ago`;
  const d = Math.round(hr / 24); return d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : fmtDay(ms);
};
const toLocalInput = (ms) => { const d = new Date(ms); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
// A call-back date is only kept while there is a reason to call (closed leads have it cleared on save),
// so "has a date" = "needs a call".
const followState = (l) => (!l.followUp ? 'none' : l.followUp < Date.now() ? 'overdue' : l.followUp < startOfDay() + DAY ? 'today' : 'later');
/** Calls due today or overdue (badge in the menu). */
export const dueCount = (leads) => leads.filter(l => l.followUp && l.followUp < startOfDay() + DAY).length;

const on = (el, type, fn) => { el._lt = el._lt || {}; if (el._lt[type]) el.removeEventListener(type, el._lt[type]); el._lt[type] = fn; el.addEventListener(type, fn); };
const VIEW_KEY = 'lt-admin-leads-view';
const defaultView = () => ({ tab: 'open', q: '', req: [], src: [], added: 'any', from: '', to: '', follow: 'any', sort: 'smart' });
const loadView = () => { try { return { ...defaultView(), ...JSON.parse(localStorage.getItem(VIEW_KEY)), q: '' }; } catch { return defaultView(); } };
const saveView = (v) => { try { localStorage.setItem(VIEW_KEY, JSON.stringify(v)); } catch { /* storage off */ } };

async function loadOptions() {
  const saved = await store.get('crm', 'options').catch(() => null);
  const o = { ...DEFAULT_OPTIONS, ...(saved || {}) };
  ['statuses', 'requirements', 'sources'].forEach(k => { if (!Array.isArray(o[k]) || !o[k].length) o[k] = DEFAULT_OPTIONS[k]; });
  return o;
}
const saveOptions = (o) => store.set('crm', 'options', { statuses: o.statuses, requirements: o.requirements, sources: o.sources, waTemplate: o.waTemplate || '' }, false);
const uniqueId = (label, list) => { const base = slugify(label) || 'option'; let id = base, i = 2; while (list.some(x => x.id === id)) id = `${base}-${i++}`; return id; };

/* ======================================================================
   LIST VIEW
   ====================================================================== */
export async function leads(viewEl, params) {
  viewEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const ctxActions = $('#view-actions');
  ctxActions.innerHTML = `<button class="btn btn--ghost" data-options type="button">${ic.cog}<span class="hide-sm">Options</span></button><button class="btn btn--gold" data-new type="button">${ic.plus}<span>Add lead</span></button>`;
  let items = [], opts;
  try { [items, opts] = await Promise.all([store.list('leads'), loadOptions()]); }
  catch (err) {
    console.error(err);
    viewEl.innerHTML = `<div class="card empty"><h3>Could not load leads</h3><p>${/permission/i.test(err.message) ? 'The database rules for Leads are not published yet. They need to be published once (ask your developer).' : esc(err.message)}</p></div>`;
    return;
  }
  const v = loadView();
  const statusOf = (id) => opts.statuses.find(s => s.id === id) || { id, label: id || 'Unknown', color: 'grey', group: 'open' };
  const reqOf = (id) => opts.requirements.find(s => s.id === id)?.label || id || '';
  const srcOf = (id) => opts.sources.find(s => s.id === id)?.label || id || '';
  const isOpen = (l) => statusOf(l.status).group === 'open';

  viewEl.innerHTML = `
    <div class="ld-summary" data-summary></div>
    <div class="seg ld-tabs" data-tabs role="toolbar" aria-label="Filter by status"></div>
    <div class="ld-bar">
      <label class="search">${ic.search}<input type="search" placeholder="Search name, phone, area, notes…" data-q aria-label="Search leads" /></label>
      <button class="btn btn--ghost" type="button" data-toggle-filters aria-expanded="false">${ic.filter}<span>Filters</span><span class="badge" data-fcount hidden></span></button>
      <label class="ld-sort"><span class="sr-only">Sort</span><select class="input" data-sort>
        <option value="smart">Calls due first</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option>
        <option value="updated">Recently updated</option><option value="name">Name A–Z</option></select></label>
    </div>
    <div class="card ld-filters" data-filters hidden></div>
    <div class="ld-active" data-active></div>
    <div class="ld-list" data-list aria-live="polite"></div>`;
  const list = $('[data-list]', viewEl);

  const inAdded = (l) => {
    const t = createdMs(l), today = startOfDay();
    if (v.added === 'today') return t >= today;
    if (v.added === '7') return t >= today - 6 * DAY;
    if (v.added === '30') return t >= today - 29 * DAY;
    if (v.added === 'custom') return (!v.from || t >= new Date(v.from).setHours(0, 0, 0, 0)) && (!v.to || t < new Date(v.to).setHours(0, 0, 0, 0) + DAY);
    return true;
  };
  const inFollow = (l) => {
    const st = followState(l);
    if (v.follow === 'overdue') return st === 'overdue';
    if (v.follow === 'today') return st === 'today' || st === 'overdue';
    if (v.follow === 'week') return l.followUp && l.followUp < startOfDay() + 7 * DAY;
    if (v.follow === 'none') return !l.followUp && isOpen(l);
    return true;
  };
  const matchQ = (l) => {
    const q = v.q.trim().toLowerCase(); if (!q) return true;
    const qd = q.replace(/\D/g, '');
    return [l.name, l.address, l.notes, reqOf(l.requirement), srcOf(l.source)].join(' ').toLowerCase().includes(q) || (qd.length >= 3 && phoneKey(l.phone).includes(qd));
  };
  const base = () => items.filter(l => matchQ(l) && (!v.req.length || v.req.includes(l.requirement)) && (!v.src.length || v.src.includes(l.source)) && inAdded(l) && inFollow(l));
  const inTab = (l) => v.tab === 'all' || (v.tab === 'open' ? isOpen(l) : l.status === v.tab);
  const sorters = {
    smart: (a, b) => {
      const rank = (l) => (l.followUp && l.followUp < startOfDay() + DAY ? 0 : l.status === 'new' ? 1 : l.followUp ? 2 : isOpen(l) ? 3 : 4);
      const ra = rank(a), rb = rank(b);
      return ra - rb || (ra === 0 || ra === 2 ? a.followUp - b.followUp : createdMs(b) - createdMs(a));
    },
    newest: (a, b) => createdMs(b) - createdMs(a),
    oldest: (a, b) => createdMs(a) - createdMs(b),
    updated: (a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0),
    name: (a, b) => String(a.name).localeCompare(String(b.name)),
  };
  const filterCount = () => (v.req.length ? 1 : 0) + (v.src.length ? 1 : 0) + (v.added !== 'any' ? 1 : 0) + (v.follow !== 'any' ? 1 : 0);

  const drawFilters = () => {
    const chip = (key, o) => `<button type="button" class="chip" data-chip="${key}" data-val="${esc(o.id)}" aria-pressed="${v[key].includes(o.id)}">${esc(o.label)}</button>`;
    const seg = (key, pairs) => `<div class="seg">${pairs.map(([k, l]) => `<button type="button" data-set="${key}" data-val="${k}" aria-pressed="${v[key] === k}">${l}</button>`).join('')}</div>`;
    $('[data-filters]', viewEl).innerHTML = `
      <div class="card-body ld-fgrid">
        <div class="ld-fgroup"><span class="label">Requirement</span><div class="chips">${opts.requirements.filter(o => !o.hidden || v.req.includes(o.id)).map(o => chip('req', o)).join('')}</div></div>
        <div class="ld-fgroup"><span class="label">Lead source</span><div class="chips">${opts.sources.filter(o => !o.hidden || v.src.includes(o.id)).map(o => chip('src', o)).join('')}</div></div>
        <div class="ld-fgroup"><span class="label">Added</span>${seg('added', [['any', 'Any time'], ['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['custom', 'Pick dates']])}
          <div class="row ld-dates" ${v.added === 'custom' ? '' : 'hidden'}><label class="field"><span class="label">From</span><input class="input" type="date" data-date="from" value="${esc(v.from)}" /></label><label class="field"><span class="label">To</span><input class="input" type="date" data-date="to" value="${esc(v.to)}" /></label></div></div>
        <div class="ld-fgroup"><span class="label">Call-back</span>${seg('follow', [['any', 'Any'], ['overdue', 'Overdue'], ['today', 'Due today'], ['week', 'Next 7 days'], ['none', 'No date set']])}</div>
      </div>`;
  };

  const draw = () => {
    saveView(v);
    const pool = base();
    const counts = Object.fromEntries(opts.statuses.map(s => [s.id, pool.filter(l => l.status === s.id).length]));
    const tabs = [['open', 'Open', pool.filter(isOpen).length, ''], ['all', 'All', pool.length, ''],
      ...opts.statuses.filter(s => !s.hidden || counts[s.id]).map(s => [s.id, s.label, counts[s.id], s.color])];
    if (!tabs.some(t => t[0] === v.tab)) v.tab = 'open';
    $('[data-tabs]', viewEl).innerHTML = tabs.map(([k, l, c, col]) => `<button type="button" data-tab="${esc(k)}" aria-pressed="${v.tab === k}">${col ? `<i class="dot c-${col}"></i>` : ''}${esc(l)} <span class="n">${c}</span></button>`).join('');

    // summary: what needs doing today
    const today = startOfDay();
    const overdue = items.filter(l => followState(l) === 'overdue').length;
    const dueToday = items.filter(l => followState(l) === 'today').length;
    const fresh = items.filter(l => l.status === 'new').length;
    const week = items.filter(l => createdMs(l) >= today - 6 * DAY).length;
    const won = items.filter(l => statusOf(l.status).group === 'won').length;
    $('[data-summary]', viewEl).innerHTML = `
      <button type="button" class="card ld-stat ${overdue ? 'is-alert' : ''}" data-quick="overdue"><span class="k">Overdue calls</span><span class="v">${overdue}</span></button>
      <button type="button" class="card ld-stat" data-quick="today"><span class="k">Call today</span><span class="v">${dueToday}</span></button>
      <button type="button" class="card ld-stat" data-quick="new"><span class="k">New, not called</span><span class="v">${fresh}</span></button>
      <button type="button" class="card ld-stat" data-quick="week"><span class="k">Added this week</span><span class="v">${week}</span></button>
      <div class="card ld-stat is-static"><span class="k">Purchased</span><span class="v">${won}</span><span class="s">${items.length ? Math.round((won / items.length) * 100) : 0}% of ${items.length} leads</span></div>`;

    const fc = filterCount();
    const fb = $('[data-fcount]', viewEl); fb.hidden = !fc; fb.textContent = fc;
    $('[data-sort]', viewEl).value = v.sort;
    const act = [];
    v.req.forEach(id => act.push(['req', id, reqOf(id)]));
    v.src.forEach(id => act.push(['src', id, srcOf(id)]));
    if (v.added !== 'any') act.push(['added', '', { today: 'Added today', 7: 'Added in last 7 days', 30: 'Added in last 30 days', custom: `Added ${v.from ? fmtDay(new Date(v.from)) : '…'} – ${v.to ? fmtDay(new Date(v.to)) : '…'}` }[v.added]]);
    if (v.follow !== 'any') act.push(['follow', '', { overdue: 'Call-back overdue', today: 'Call-back due today', week: 'Call-back in next 7 days', none: 'No call-back date' }[v.follow]]);
    const rows = pool.filter(inTab).sort(sorters[v.sort] || sorters.smart);
    $('[data-active]', viewEl).innerHTML = `
      <span class="muted small">Showing <b>${rows.length}</b> of ${items.length}</span>
      ${act.map(([k, id, l]) => `<button type="button" class="chip is-on" data-clear="${k}" data-val="${esc(id)}">${esc(l)} ${ic.x}</button>`).join('')}
      ${act.length || v.q ? '<button type="button" class="btn btn--ghost btn--sm" data-clear-all>Clear all</button>' : ''}
      <span class="spacer"></span>
      ${rows.length ? `<button type="button" class="btn btn--ghost btn--sm" data-export>${ic.download} Export CSV</button>` : ''}`;
    if (!$('[data-filters]', viewEl).hidden) drawFilters();

    list.innerHTML = rows.length ? rows.map(l => leadRow(l)).join('') : items.length
      ? '<div class="card empty"><h3>No leads match</h3><p>Try another status tab, or clear the filters.</p></div>'
      : `<div class="card empty"><h3>No leads yet</h3><p>When someone messages or calls from a Meta ad, add them here with their phone number and what they need. Then call or WhatsApp them in one tap.</p><div class="row" style="justify-content:center;margin-top:16px"><button class="btn btn--gold" type="button" data-new>${ic.plus} Add your first lead</button></div></div>`;
  };

  const leadRow = (l) => {
    const st = statusOf(l.status), fs = followState(l);
    const choices = opts.statuses.filter(s => !s.hidden || s.id === l.status);
    return `
    <article class="card lead c-${esc(st.color)}" data-id="${esc(l.id)}">
      <button type="button" class="ld-main" data-open aria-label="Open ${esc(l.name)}">
        <span class="ld-name">${esc(l.name)}</span>
        <span class="ld-sub"><span class="ld-phone">${esc(fmtPhone(l.phone))}</span>${l.address ? ` · ${esc(l.address)}` : ''}</span>
        ${l.notes ? `<span class="ld-note">${esc(l.notes)}</span>` : ''}
      </button>
      <div class="ld-meta">
        ${l.requirement ? `<span class="tagchip">${esc(reqOf(l.requirement))}</span>` : ''}
        ${l.source ? `<span class="cell-sub">${esc(srcOf(l.source))}</span>` : ''}
      </div>
      <div class="ld-status">
        <label class="st-select c-${esc(st.color)}"><span class="sr-only">Status of ${esc(l.name)}</span><select data-status>${choices.map(s => `<option value="${esc(s.id)}" ${s.id === l.status ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select>${ic.down}</label>
        ${l.followUp ? `<span class="ld-follow f-${fs}">${ic.clock}${fs === 'overdue' ? 'Overdue · ' : fs === 'today' ? 'Today · ' : ''}${esc(fs === 'today' ? new Date(l.followUp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : fmtWhen(l.followUp))}</span>` : ''}
      </div>
      <div class="ld-when cell-sub"><span>Added ${esc(rel(createdMs(l)))}</span>${l.lastContactAt ? `<span>Last contact ${esc(rel(l.lastContactAt))}</span>` : ''}</div>
      <div class="ld-actions">
        <a class="btn btn--sm" href="${esc(telHref(l.phone))}" data-contact="call">${ic.phone}<span>Call</span></a>
        <a class="btn btn--sm btn--wa" href="${esc(waLink(phoneKey(l.phone) || l.phone, (opts.waTemplate || '').replace(/\{name\}/g, String(l.name).split(' ')[0])))}" target="_blank" rel="noopener" data-contact="wa">${ic.wa}<span>WhatsApp</span></a>
      </div>
    </article>`;
  };

  const save = async (l, patch, historyItem) => {
    const history = historyItem ? [...(l.history || []), historyItem].slice(-100) : l.history;
    const data = { ...patch, ...(historyItem ? { history } : {}) };
    await store.update('leads', l.id, data);
    Object.assign(l, data, { updatedAt: { seconds: Date.now() / 1000 } });
  };

  const changeStatus = async (l, to, sel) => {
    const st = statusOf(to);
    const done = async (followUp, note) => {
      try {
        const patch = { status: to, followUp: st.followUp ? followUp : st.group === 'open' ? (l.followUp || null) : null };
        if (note) patch.notes = l.notes ? `${l.notes}\n${note}` : note;
        await save(l, patch, { at: Date.now(), status: to, ...(note ? { note } : {}), ...(patch.followUp ? { followUp: patch.followUp } : {}) });
        toast(`${l.name}: ${st.label}${patch.followUp ? ` · call back ${fmtWhen(patch.followUp)}` : ''}`);
        draw(); refresh();
      } catch (err) { toast(err.message, 'err'); draw(); }
    };
    if (st.followUp) askFollowUp(l, st, done, () => { if (sel) sel.value = l.status; });
    else done(null, '');
  };

  on(viewEl, 'click', async e => {
    const t = e.target;
    if (t.closest('[data-tab]')) { v.tab = t.closest('[data-tab]').dataset.tab; draw(); return; }
    if (t.closest('[data-toggle-filters]')) {
      const b = t.closest('[data-toggle-filters]'), f = $('[data-filters]', viewEl);
      f.hidden = !f.hidden; b.setAttribute('aria-expanded', String(!f.hidden)); if (!f.hidden) drawFilters(); return;
    }
    const chip = t.closest('[data-chip]');
    if (chip) { const k = chip.dataset.chip, val = chip.dataset.val; v[k] = v[k].includes(val) ? v[k].filter(x => x !== val) : [...v[k], val]; draw(); return; }
    const setb = t.closest('[data-set]');
    if (setb) { v[setb.dataset.set] = setb.dataset.val; draw(); return; }
    const clr = t.closest('[data-clear]');
    if (clr) { const k = clr.dataset.clear; if (Array.isArray(v[k])) v[k] = v[k].filter(x => x !== clr.dataset.val); else v[k] = 'any'; draw(); return; }
    if (t.closest('[data-clear-all]')) { Object.assign(v, defaultView(), { tab: v.tab, sort: v.sort }); $('[data-q]', viewEl).value = ''; draw(); return; }
    const quick = t.closest('[data-quick]');
    if (quick) {
      const q = quick.dataset.quick;
      Object.assign(v, defaultView(), { sort: 'smart' });
      if (q === 'new') v.tab = 'new'; else if (q === 'week') { v.tab = 'all'; v.added = '7'; v.sort = 'newest'; } else v.follow = q;
      $('[data-q]', viewEl).value = ''; draw(); return;
    }
    if (t.closest('[data-export]')) { exportCsv(base().filter(inTab)); return; }
    if (t.closest('[data-new]')) { openLead(null); return; }
    const card = t.closest('[data-id]'); if (!card) return;
    const l = items.find(x => x.id === card.dataset.id);
    const contact = t.closest('[data-contact]');
    if (contact) { // remember when we last reached out (does not block the call / WhatsApp)
      save(l, { lastContactAt: Date.now(), contactCount: (l.contactCount || 0) + 1 }, { at: Date.now(), note: contact.dataset.contact === 'call' ? 'Called' : 'WhatsApp message' })
        .then(() => setTimeout(draw, 400)).catch(() => {});
      return;
    }
    if (t.closest('[data-open]')) openLead(l);
  });
  on(viewEl, 'change', e => {
    const sel = e.target.closest('[data-status]');
    if (sel) { const l = items.find(x => x.id === sel.closest('[data-id]').dataset.id); changeStatus(l, sel.value, sel); return; }
    if (e.target.matches('[data-sort]')) { v.sort = e.target.value; draw(); return; }
    const d = e.target.closest('[data-date]'); if (d) { v[d.dataset.date] = d.value; draw(); }
  });
  let qt; on(viewEl, 'input', e => { if (e.target.matches('[data-q]')) { clearTimeout(qt); qt = setTimeout(() => { v.q = e.target.value; draw(); }, 120); } });
  $('[data-new]', ctxActions).onclick = () => openLead(null);
  $('[data-options]', ctxActions).onclick = () => manageOptions(opts, async (next) => { opts = next; draw(); });

  const refresh = () => { document.dispatchEvent(new CustomEvent('lt:badges')); };

  /* ---------- call-back picker ---------- */
  function askFollowUp(l, st, done, cancel) {
    const at = (days, hour) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d.getTime(); };
    const evening = new Date().getHours() < 17 ? at(0, 18) : at(1, 18);
    const picks = [['In 1 hour', Date.now() + 36e5], ['This evening, 6 PM', evening], ['Tomorrow, 11 AM', at(1, 11)], ['In 3 days', at(3, 11)], ['Next week', at(7, 11)], ['In 1 month', at(30, 11)]];
    let chosen = l.followUp && l.followUp > Date.now() ? l.followUp : at(1, 11);
    let ok = false;
    const m = modal({
      title: `${st.label}: when to call back?`, size: 'sm',
      body: `<div class="form">
        <p class="muted small">${esc(l.name)} · ${esc(fmtPhone(l.phone))}</p>
        <div class="chips" data-picks>${picks.map(([lbl, t], i) => `<button type="button" class="chip" data-pick="${i}">${lbl}</button>`).join('')}</div>
        <div class="field"><label for="fu-at">Date and time</label><input id="fu-at" type="datetime-local" value="${toLocalInput(chosen)}" /></div>
        <div class="field"><label for="fu-note">Note (optional)</label><input id="fu-note" placeholder="e.g. Asked to call after salary day" /></div>
      </div>`,
      footer: [
        { label: 'Cancel', cls: 'btn--ghost', onClick: ({ close }) => close() },
        { label: 'Save', cls: 'btn--gold', onClick: ({ el, close }) => {
          const val = $('#fu-at', el).value; const t = val ? new Date(val).getTime() : null;
          ok = true; close(); done(t, $('#fu-note', el).value.trim());
        } },
      ],
    });
    $('[data-picks]', m.el).addEventListener('click', e => {
      const b = e.target.closest('[data-pick]'); if (!b) return;
      chosen = picks[+b.dataset.pick][1]; $('#fu-at', m.el).value = toLocalInput(chosen);
      $$('[data-pick]', m.el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
    new MutationObserver((_, obs) => { if (!m.el.isConnected) { obs.disconnect(); if (!ok) cancel(); } }).observe(document.body, { childList: true });
  }

  /* ---------- add / edit ---------- */
  function openLead(l) {
    const isNew = !l;
    l = l || { status: 'new', source: opts.sources.find(s => !s.hidden)?.id || '', requirement: '' };
    const optList = (key, cur, placeholder) => `${placeholder ? `<option value="">${placeholder}</option>` : ''}${opts[key].filter(o => !o.hidden || o.id === cur).map(o => `<option value="${esc(o.id)}" ${o.id === cur ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}<option value="__new">+ Add new…</option>`;
    const addNew = (key, name) => `<div class="row ld-addnew" data-addnew="${key}" hidden><input class="input" style="flex:1" placeholder="New ${name} name" aria-label="New ${name} name" /><button type="button" class="btn btn--sm" data-addnew-save>Add</button><button type="button" class="btn btn--ghost btn--sm" data-addnew-cancel>Cancel</button></div>`;
    const hist = (l.history || []).slice().reverse();
    const form = h(`<form class="form" novalidate>
      <div class="grid-2">
        <div class="field"><label for="ld-name">Name *</label><input id="ld-name" name="name" value="${esc(l.name || '')}" autocomplete="off" required /></div>
        <div class="field"><label for="ld-phone">Phone number *</label><input id="ld-phone" name="phone" type="tel" inputmode="tel" value="${esc(l.phone || '')}" placeholder="10-digit mobile number" autocomplete="off" required /><span class="hint" data-dup></span></div>
      </div>
      <div class="field"><label for="ld-address">Address / area</label><input id="ld-address" name="address" value="${esc(l.address || '')}" placeholder="e.g. Sarpavaram, Kakinada" /></div>
      <div class="grid-2">
        <div class="field"><label for="ld-req">Requirement</label><select id="ld-req" name="requirement" data-pick-list="requirements">${optList('requirements', l.requirement, 'Choose…')}</select>${addNew('requirements', 'requirement')}</div>
        <div class="field"><label for="ld-src">Came from</label><select id="ld-src" name="source" data-pick-list="sources">${optList('sources', l.source, 'Choose…')}</select>${addNew('sources', 'source')}</div>
      </div>
      <div class="grid-2">
        <div class="field"><label for="ld-status">Status</label><select id="ld-status" name="status" data-pick-list="statuses">${optList('statuses', l.status)}</select>${addNew('statuses', 'status')}<span class="hint" data-st-hint></span></div>
        <div class="field"><label for="ld-follow">Call back on</label><input id="ld-follow" name="followUp" type="datetime-local" value="${l.followUp ? toLocalInput(l.followUp) : ''}" /><span class="hint">Leave empty if no call-back is planned</span></div>
      </div>
      <div class="field"><label for="ld-notes">Requirement details and notes</label><textarea id="ld-notes" name="notes" rows="4" placeholder="Sizes, quantity, budget, when work starts, what they said on the call…">${esc(l.notes || '')}</textarea></div>
      ${isNew ? '' : `<div class="field"><span class="label">History</span><ol class="ld-history">${hist.map(x => `<li><span class="cell-sub">${esc(fmtWhen(x.at))}</span> ${x.status ? `<b>${esc(statusOf(x.status).label)}</b>` : ''}${x.note ? ` ${esc(x.note)}` : ''}${x.followUp ? ` <span class="cell-sub">(call back ${esc(fmtWhen(x.followUp))})</span>` : ''}</li>`).join('') || '<li class="cell-sub">No history yet</li>'}</ol></div>`}
    </form>`);
    const stHint = () => { $('[data-st-hint]', form).textContent = statusOf(form.status.value)?.hint || ''; };
    stHint();
    const dupEl = $('[data-dup]', form);
    const checkDup = () => {
      const k = phoneKey(form.phone.value);
      const other = k.length >= 10 && items.find(x => x.id !== l.id && phoneKey(x.phone) === k);
      dupEl.innerHTML = other ? `<span class="warn-text">This number is already saved for <b>${esc(other.name)}</b> (${esc(statusOf(other.status).label)}). <button type="button" class="linklike" data-open-dup="${esc(other.id)}">Open that lead</button></span>` : '';
    };
    form.phone.addEventListener('input', checkDup); checkDup();
    form.addEventListener('click', e => {
      const od = e.target.closest('[data-open-dup]');
      if (od) { m.close(); openLead(items.find(x => x.id === od.dataset.openDup)); }
    });
    // "+ Add new…" in a dropdown: type the name once, it is saved to the list for every future lead
    const prev = {};
    $$('[data-pick-list]', form).forEach(sel => {
      prev[sel.name] = sel.value;
      sel.addEventListener('change', () => {
        const box = $(`[data-addnew="${sel.dataset.pickList}"]`, form);
        if (sel.value === '__new') { box.hidden = false; $('input', box).focus(); sel.value = prev[sel.name]; return; }
        prev[sel.name] = sel.value;
        if (sel.name === 'status') {
          stHint();
          const st = statusOf(sel.value);
          if (st.followUp && !form.followUp.value) form.followUp.value = toLocalInput(new Date().setHours(24 + 11, 0, 0, 0));
          if (st.group !== 'open' && !st.followUp) form.followUp.value = '';
        }
      });
    });
    form.addEventListener('click', async e => {
      const box = e.target.closest('[data-addnew]'); if (!box) return;
      if (e.target.closest('[data-addnew-cancel]')) { box.hidden = true; $('input', box).value = ''; return; }
      if (!e.target.closest('[data-addnew-save]')) return;
      const key = box.dataset.addnew, label = $('input', box).value.trim();
      if (!label) return $('input', box).focus();
      const existing = opts[key].find(o => o.label.toLowerCase() === label.toLowerCase());
      let item = existing;
      if (!existing) {
        item = { id: uniqueId(label, opts[key]), label, ...(key === 'statuses' ? { color: 'blue', group: 'open' } : {}) };
        const next = { ...opts, [key]: [...opts[key], item] };
        try { await saveOptions(next); opts = next; toast(`“${label}” added. It will be in the list from now on.`); }
        catch (err) { return toast(err.message, 'err'); }
      } else if (existing.hidden) { existing.hidden = false; await saveOptions(opts).catch(() => {}); }
      const sel = $(`[data-pick-list="${key}"]`, form);
      if (!$(`option[value="${CSS.escape(item.id)}"]`, sel)) $('option[value="__new"]', sel).insertAdjacentHTML('beforebegin', `<option value="${esc(item.id)}">${esc(item.label)}</option>`);
      sel.value = item.id; prev[sel.name] = item.id; box.hidden = true; $('input', box).value = '';
      if (key === 'statuses') stHint();
    });
    form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('[data-addnew]')) { e.preventDefault(); $('[data-addnew-save]', e.target.closest('[data-addnew]')).click(); } });

    const submit = async ({ close, btn }) => {
      const f = form;
      const name = f.name.value.trim(), phone = f.phone.value.trim();
      $$('.field', f).forEach(x => x.classList.remove('invalid'));
      if (!name) { f.name.focus(); return toast('Please enter the name', 'err'); }
      if (phoneKey(phone).length < 10) { f.phone.focus(); return toast('Please enter a 10-digit phone number', 'err'); }
      const followUp = f.followUp.value ? new Date(f.followUp.value).getTime() : null;
      const st = statusOf(f.status.value);
      const data = { name, phone, phoneKey: phoneKey(phone), address: f.address.value.trim(), requirement: f.requirement.value === '__new' ? '' : f.requirement.value, source: f.source.value === '__new' ? '' : f.source.value, status: f.status.value, notes: f.notes.value.trim(), followUp: st.group === 'open' || st.followUp ? followUp : null };
      btn.disabled = true;
      try {
        if (isNew) {
          const history = [{ at: Date.now(), status: data.status, note: 'Lead added', ...(data.followUp ? { followUp: data.followUp } : {}) }];
          const ref = await store.add('leads', { ...data, history });
          items.push({ id: ref.id, ...data, history, createdAt: { seconds: Date.now() / 1000 } });
          toast(`${name} added`);
        } else {
          const changed = data.status !== l.status || data.followUp !== (l.followUp || null);
          await save(l, data, changed ? { at: Date.now(), status: data.status, ...(data.followUp ? { followUp: data.followUp } : {}) } : null);
          toast('Saved');
        }
        close(); draw(); refresh();
      } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
    };
    const m = modal({
      title: isNew ? 'Add lead' : l.name, body: form,
      footer: [
        ...(isNew ? [] : [{ label: 'Delete', cls: 'btn--danger', onClick: async ({ close }) => {
          if (!(await confirmBox(`Delete ${l.name}? Their notes and history are removed too. This cannot be undone.`))) return;
          try { await store.remove('leads', l.id); items = items.filter(x => x !== l); close(); draw(); refresh(); toast('Lead deleted'); } catch (err) { toast(err.message, 'err'); }
        } }]),
        { label: 'Cancel', cls: 'btn--ghost', onClick: ({ close }) => close() },
        { label: isNew ? 'Add lead' : 'Save', cls: 'btn--gold', onClick: submit },
      ],
    });
    form.addEventListener('submit', e => { e.preventDefault(); submit({ close: m.close, btn: $('.modal-foot .btn--gold', m.el) }); });
    if (!isNew) setTimeout(() => document.activeElement?.blur?.(), 60); // editing: don't pop the phone keyboard
  }

  function exportCsv(rows) {
    const cell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const head = ['Name', 'Phone', 'Address', 'Requirement', 'Came from', 'Status', 'Call back', 'Notes', 'Added', 'Last contact'];
    const body = rows.map(l => [l.name, fmtPhone(l.phone), l.address, reqOf(l.requirement), srcOf(l.source), statusOf(l.status).label,
      l.followUp ? fmtWhen(l.followUp) : '', l.notes, createdMs(l) ? fmtDay(createdMs(l)) : '', l.lastContactAt ? fmtWhen(l.lastContactAt) : ''].map(cell).join(','));
    downloadFile(`liveteck-leads-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + [head.map(cell).join(','), ...body].join('\n'), 'text/csv');
  }

  if (params?.get('new')) openLead(null);
  draw();
}

/* ======================================================================
   OPTIONS: grow and tidy the status / requirement / source lists
   ====================================================================== */
function manageOptions(current, onSaved) {
  const o = structuredClone(current);
  let tab = 'statuses';
  const body = h('<div class="form"></div>');
  const draw = () => {
    const listHtml = o[tab].map((x, i) => `
      <li class="opt-row ${tab === 'statuses' ? '' : 'is-plain'} ${x.hidden ? 'is-hidden' : ''}" data-i="${i}">
        ${tab === 'statuses' ? `<select class="input opt-color c-${esc(x.color || 'grey')}" data-f="color" aria-label="Colour">${Object.entries(COLORS).map(([k, l]) => `<option value="${k}" ${k === x.color ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}
        <input class="input" data-f="label" value="${esc(x.label)}" aria-label="Name" />
        ${tab === 'statuses' ? `<select class="input" data-f="group" aria-label="Counts as">${Object.entries(GROUPS).map(([k, l]) => `<option value="${k}" ${k === (x.group || 'open') ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <label class="check small"><input type="checkbox" data-f="followUp" ${x.followUp ? 'checked' : ''} /> Ask call-back date</label>
          <input class="input opt-hint" data-f="hint" value="${esc(x.hint || '')}" placeholder="When to use it (shown as a tip)" aria-label="When to use it" />` : ''}
        <div class="row opt-tools">
          <button type="button" class="icon-btn" data-mv="-1" aria-label="Move up" ${i ? '' : 'disabled'}>${ic.up}</button>
          <button type="button" class="icon-btn" data-mv="1" aria-label="Move down" ${i < o[tab].length - 1 ? '' : 'disabled'}>${ic.down}</button>
          <button type="button" class="btn btn--ghost btn--sm" data-hide>${x.hidden ? 'Show' : 'Hide'}</button>
        </div>
      </li>`).join('');
    body.innerHTML = `
      <div class="seg">${Object.entries(LISTS).map(([k, l]) => `<button type="button" data-tab="${k}" aria-pressed="${k === tab}">${l}</button>`).concat(`<button type="button" data-tab="wa" aria-pressed="${tab === 'wa'}">WhatsApp message</button>`).join('')}</div>
      ${tab === 'wa' ? `<div class="field"><label for="opt-wa">First WhatsApp message</label><textarea id="opt-wa" rows="4" data-wa>${esc(o.waTemplate || '')}</textarea><span class="hint">{name} becomes the customer’s first name. You can still edit the message in WhatsApp before sending.</span></div>` : `
      <p class="muted small">${tab === 'statuses' ? 'Hidden statuses stay on old leads but are not offered for new ones. The colour shows on each lead card.' : 'Hidden items stay on old leads but are not offered for new ones.'}</p>
      <ol class="opt-list">${listHtml}</ol>
      <div class="row"><input class="input" style="flex:1" placeholder="Add a new ${tab === 'statuses' ? 'status' : tab === 'sources' ? 'source' : 'requirement'}…" data-new-label aria-label="New item name" /><button type="button" class="btn btn--sm" data-add>${ic.plus} Add</button></div>`}`;
  };
  draw();
  body.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-tab]')) { tab = t.closest('[data-tab]').dataset.tab; draw(); return; }
    const row = t.closest('[data-i]'); const i = row ? +row.dataset.i : -1;
    if (t.closest('[data-mv]')) { const j = i + +t.closest('[data-mv]').dataset.mv; [o[tab][i], o[tab][j]] = [o[tab][j], o[tab][i]]; draw(); return; }
    if (t.closest('[data-hide]')) { o[tab][i].hidden = !o[tab][i].hidden; draw(); return; }
    if (t.closest('[data-add]')) {
      const inp = $('[data-new-label]', body), label = inp.value.trim();
      if (!label) return inp.focus();
      if (o[tab].some(x => x.label.toLowerCase() === label.toLowerCase())) return toast('That name is already in the list', 'err');
      o[tab].push({ id: uniqueId(label, o[tab]), label, ...(tab === 'statuses' ? { color: 'blue', group: 'open' } : {}) });
      draw(); $('[data-new-label]', body).focus();
    }
  });
  body.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-new-label]')) { e.preventDefault(); $('[data-add]', body).click(); } });
  body.addEventListener('input', e => {
    if (e.target.matches('[data-wa]')) { o.waTemplate = e.target.value; return; }
    const row = e.target.closest('[data-i]'); if (!row) return;
    const f = e.target.dataset.f, x = o[tab][+row.dataset.i];
    x[f] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (f === 'color') e.target.className = `input opt-color c-${e.target.value}`;
  });
  modal({
    title: 'Lead options', body,
    footer: [
      { label: 'Cancel', cls: 'btn--ghost', onClick: ({ close }) => close() },
      { label: 'Save options', cls: 'btn--gold', onClick: async ({ close, btn }) => {
        for (const k of Object.keys(LISTS)) {
          o[k] = o[k].map(x => ({ ...x, label: String(x.label).trim() })).filter(x => x.label);
          if (!o[k].some(x => !x.hidden)) return toast(`Keep at least one visible item in ${LISTS[k]}`, 'err');
        }
        btn.disabled = true;
        try { await saveOptions(o); toast('Options saved'); close(); onSaved(o); }
        catch (err) { toast(err.message, 'err'); btn.disabled = false; }
      } },
    ],
  });
}
