import { SETTINGS, CATEGORIES, PRODUCTS } from './defaults.js';

// Firestore is loaded lazily (separate chunk) — pages paint from cache/defaults first.
let fbPromise = null;
const fb = () => (fbPromise ||= import('./fs-public.js'));

const CACHE_KEY = 'lt-cache-v1';
const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; } };
const writeCache = (patch) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), ...patch })); } catch { /* storage unavailable */ } };
export const hasCache = () => !!readCache().settings;

const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.name).localeCompare(String(b.name));
const withTimeout = (p, ms = 10000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const idleStart = () => new Promise(r => ('requestIdleCallback' in window ? requestIdleCallback(r, { timeout: 800 }) : setTimeout(r, 50)));

/** Instant data (cache → defaults) so pages paint immediately. */
export function initialData() {
  const c = readCache();
  return {
    settings: { ...SETTINGS, ...(c.settings || {}) },
    categories: c.categories?.length ? c.categories : CATEGORIES,
    products: c.products?.length ? c.products : PRODUCTS,
    testimonials: c.testimonials || [],
    fromCache: !!c.settings,
  };
}

/** Live data from Firestore. Empty collections fall back to defaults. */
export async function loadData() {
  await idleStart();
  const { db, collection, doc, getDoc, getDocs, query, where } = await fb();
  const plain = (d) => { const { updatedAt, ...rest } = d.data(); return { id: d.id, ...rest }; };
  const list = async (name) => (await withTimeout(getDocs(collection(db, name)))).docs.map(plain);
  const base = initialData();
  const [settingsSnap, categories, products, testimonials] = await Promise.allSettled([
    withTimeout(getDoc(doc(db, 'settings', 'site'))),
    list('categories'),
    list('products'),
    withTimeout(getDocs(query(collection(db, 'testimonials'), where('status', '==', 'approved')))).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))),
  ]);
  const out = { ...base, fromCache: false, live: true };
  if (settingsSnap.status === 'fulfilled' && settingsSnap.value.exists()) { const { updatedAt, ...st } = settingsSnap.value.data(); out.settings = { ...SETTINGS, ...st }; }
  if (categories.status === 'fulfilled' && categories.value.length) out.categories = categories.value.sort(byOrder);
  if (products.status === 'fulfilled' && products.value.length) out.products = products.value.filter(p => p.published !== false).sort(byOrder);
  if (testimonials.status === 'fulfilled') {
    out.testimonials = testimonials.value.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }
  if ([settingsSnap, categories, products, testimonials].every(r => r.status === 'rejected')) throw new Error('Firestore unreachable');
  writeCache({ settings: out.settings, categories: out.categories, products: out.products, testimonials: out.testimonials.map(({ createdAt, ...t }) => t) });
  return out;
}

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

export async function submitEnquiry(f) {
  const { db, collection, addDoc, serverTimestamp } = await fb();
  return withTimeout(addDoc(collection(db, 'enquiries'), {
    name: clean(f.name, 100),
    phone: clean(f.phone, 20),
    email: clean(f.email, 120),
    city: clean(f.city, 80),
    product: clean(f.product, 120),
    message: clean(f.message, 2000),
    page: clean(location.pathname, 60),
    status: 'new',
    createdAt: serverTimestamp(),
  }), 15000);
}

export async function submitTestimonial(f) {
  const { db, collection, addDoc, serverTimestamp } = await fb();
  return withTimeout(addDoc(collection(db, 'testimonials'), {
    name: clean(f.name, 80),
    company: clean(f.company, 100),
    role: clean(f.role, 80),
    city: clean(f.city, 80),
    message: clean(f.message, 1200),
    rating: Math.min(5, Math.max(1, parseInt(f.rating, 10) || 5)),
    status: 'pending',
    source: 'website',
    createdAt: serverTimestamp(),
  }), 15000);
}
