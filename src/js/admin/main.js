import '../../styles/admin.css';
import { getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app, USE_EMULATORS } from '../core/firebase.js';
import { $, $$, ic, toast } from './ui.js';
import * as store from './store.js';
import * as V from './views.js';

const auth = getAuth(app);
if (USE_EMULATORS) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
setPersistence(auth, browserLocalPersistence).catch(() => {});

const ROUTES = {
  overview: { title: 'Overview', icon: ic.home, view: V.overview },
  enquiries: { title: 'Enquiries', icon: ic.inbox, view: V.enquiries, badge: 'enq' },
  products: { title: 'Products', icon: ic.box, view: V.products },
  categories: { title: 'Categories', icon: ic.grid, view: V.categories },
  testimonials: { title: 'Testimonials', icon: ic.quote, view: V.testimonials, badge: 'tst' },
  media: { title: 'Media library', icon: ic.image, view: V.media },
  settings: { title: 'Settings', icon: ic.cog, view: V.settings },
};

// logo
const logo = $('#tpl-logo').innerHTML;
$$('[data-logo]').forEach(el => { el.innerHTML = logo; });

$('#nav').innerHTML = Object.entries(ROUTES).map(([k, r]) =>
  `<a class="nav-btn" href="#/${k}" data-route="${k}">${r.icon}<span>${r.title}</span>${r.badge ? `<span class="badge" data-badge="${r.badge}" hidden></span>` : ''}</a>`).join('');

async function refreshBadges() {
  try {
    const [enq, tst] = await Promise.all([store.list('enquiries'), store.list('testimonials')]);
    const set = (k, n) => { const b = $(`[data-badge="${k}"]`); if (b) { b.hidden = !n; b.textContent = n; } };
    set('enq', enq.filter(e => e.status === 'new').length);
    set('tst', tst.filter(t => t.status === 'pending').length);
  } catch { /* ignore */ }
}

V.setContext({
  refreshBadges,
  setActions: (html) => { $('#view-actions').innerHTML = html; },
});

function route() {
  const [path, qs] = (location.hash.replace(/^#\/?/, '') || 'overview').split('?');
  const key = ROUTES[path] ? path : 'overview';
  const r = ROUTES[key];
  $$('[data-route]').forEach(a => { if (a.dataset.route === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#view-title').textContent = r.title;
  document.title = `${r.title} · Liveteck Admin`;
  $('#view-actions').innerHTML = '';
  // fresh container per view so listeners never stack up
  const old = $('#view');
  const fresh = old.cloneNode(false);
  old.replaceWith(fresh);
  $('#sidebar').classList.remove('open');
  window.scrollTo(0, 0);
  r.view(fresh, new URLSearchParams(qs || ''));
  refreshBadges();
}

/* ---------- auth ---------- */
const show = (which) => {
  $('#boot').hidden = true;
  $('#login').hidden = which !== 'login';
  $('#app').hidden = which !== 'app';
};

onAuthStateChanged(auth, async (user) => {
  if (!user) { show('login'); return; }
  if ((user.email || '').toLowerCase() !== V.ADMIN_EMAIL) {
    await signOut(auth);
    const err = $('#login-error'); err.hidden = false; err.textContent = 'This account does not have admin access.';
    show('login');
    return;
  }
  $('#who').textContent = user.email;
  show('app');
  route();
  store.runMigrations()
    .then(done => { if (done.length) { toast('Catalogue updated: new key features applied'); route(); } })
    .catch(err => console.warn('[admin] catalogue update failed', err));
});

addEventListener('hashchange', () => { if (auth.currentUser) route(); });

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target; const err = $('#login-error'); const btn = $('button[type=submit]', f);
  err.hidden = true; err.style.color = '';
  if (!f.email.value.trim() || !f.password.value) { err.hidden = false; err.textContent = 'Please enter your email and password.'; return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    await signInWithEmailAndPassword(auth, f.email.value.trim(), f.password.value);
    f.password.value = '';
  } catch (ex) {
    err.hidden = false;
    err.textContent = /invalid-credential|wrong-password|user-not-found|invalid-email/.test(ex.code) ? 'Incorrect email or password.' : /too-many-requests/.test(ex.code) ? 'Too many attempts — please wait a few minutes and try again.' : ex.message;
  } finally { btn.disabled = false; btn.textContent = 'Sign in'; }
});

$('#forgot').addEventListener('click', async () => {
  const email = $('#lg-email').value.trim();
  const err = $('#login-error');
  if (!email) { err.hidden = false; err.textContent = 'Enter your email above, then click “Forgot password?”.'; return; }
  try { await sendPasswordResetEmail(auth, email); err.hidden = false; err.style.color = 'var(--ok)'; err.textContent = 'Password reset email sent — check your inbox.'; }
  catch (ex) { err.hidden = false; err.textContent = ex.message; }
});

$('#logout').addEventListener('click', () => signOut(auth).then(() => { location.hash = ''; toast('Signed out'); }));
$('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
document.addEventListener('click', (e) => { if (window.innerWidth < 900 && !e.target.closest('#sidebar, #menu-btn')) $('#sidebar').classList.remove('open'); });
