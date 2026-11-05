import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, writeBatch, serverTimestamp } from 'firebase/firestore/lite';
import { db } from '../core/firebase.js';
import { SETTINGS, CATEGORIES, PRODUCTS, SPACES } from '../core/defaults.js';

export const ts = serverTimestamp;

// Local preview only (`npm run dev`, then /admin/?demo): sample data in memory, no sign-in, nothing saved.
// import.meta.env.DEV is false in production builds, so this branch and the demo file are dropped there.
export const DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
const demo = () => import('./demo-store.js');

export async function list(name) {
  if (DEMO) return (await demo()).list(name);
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export const get = async (name, id) => {
  if (DEMO) return (await demo()).get(name, id);
  const s = await getDoc(doc(db, name, id)); return s.exists() ? { id: s.id, ...s.data() } : null;
};
export const set = async (name, id, data, merge = true) => (DEMO ? (await demo()).set(name, id, data, merge) : setDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() }, { merge }));
export const update = async (name, id, data) => (DEMO ? (await demo()).update(name, id, data) : updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() }));
export const remove = async (name, id) => (DEMO ? (await demo()).remove(name, id) : deleteDoc(doc(db, name, id)));
export const add = async (name, data) => (DEMO ? (await demo()).add(name, data) : addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() }));

export async function getSettings() {
  const s = await get('settings', 'site');
  return { ...SETTINGS, ...(s || {}) };
}
export const saveSettings = (data) => set('settings', 'site', data);

/** Import the default catalogue. mode: 'missing' keeps existing docs, 'overwrite' replaces them. */
export async function seedCatalogue(mode = 'missing') {
  if (DEMO) return 0;
  const [cats, prods, settings] = await Promise.all([list('categories'), list('products'), get('settings', 'site')]);
  const haveC = new Set(cats.map(c => c.id));
  const haveP = new Set(prods.map(p => p.id));
  const batch = writeBatch(db);
  let n = 0;
  CATEGORIES.forEach(({ id, ...c }) => { if (mode === 'overwrite' || !haveC.has(id)) { batch.set(doc(db, 'categories', id), { ...c, updatedAt: serverTimestamp() }); n++; } });
  PRODUCTS.forEach(({ id, ...p }) => { if (mode === 'overwrite' || !haveP.has(id)) { batch.set(doc(db, 'products', id), { ...p, updatedAt: serverTimestamp() }); n++; } });
  if (!settings) { batch.set(doc(db, 'settings', 'site'), { ...SETTINGS, updatedAt: serverTimestamp() }); n++; }
  await batch.commit();
  return n;
}

/**
 * One-time catalogue updates, applied the first time the owner signs in after a release.
 * Each runs once (recorded in settings/site.migrations) and only touches the fields it names.
 */
const MIGRATIONS = {
  // Oct 2026, client request: shared key features per category (lifetime warranty, 100% Gurjan face veneer),
  // all plywood with the same list, block boards with their own.
  'features-2026-10': async (batch, { cats, prods }) => {
    const defC = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
    const defP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
    cats.forEach(c => { if (defC[c.id] && !Array.isArray(c.features)) batch.update(doc(db, 'categories', c.id), { features: defC[c.id].features, updatedAt: serverTimestamp() }); });
    prods.forEach(p => {
      if (defP[p.id] && ['plywood', 'block-board'].includes(p.category)) batch.update(doc(db, 'products', p.id), { features: defP[p.id].features, updatedAt: serverTimestamp() });
    });
  },
  // Nov 2026: the new public Gallery page starts with the interior photos the site already uses.
  'gallery-2026-11': async (batch) => {
    const have = await list('gallery').catch(() => null);
    if (!have) return false; // database rules for the gallery not published yet: try again next sign-in
    if (have.length) return;
    SPACES.forEach((sp, i) => batch.set(doc(collection(db, 'gallery')), {
      url: sp.image, caption: sp.title, album: sp.tag, published: true, order: (i + 1) * 10, createdAt: serverTimestamp(),
    }));
  },
  // Nov 2026, client request: full owner name (shown with "Rajendra Glass & Plywood" on the About page).
  'owner-name-2026-11': async (batch, { settings }) => {
    if (!settings?.owner || settings.owner === 'Amith Jain') batch.set(doc(db, 'settings', 'site'), { owner: SETTINGS.owner, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export async function runMigrations() {
  if (DEMO) return [];
  const settings = await get('settings', 'site');
  const done = new Set(settings?.migrations || []);
  const todo = Object.keys(MIGRATIONS).filter(k => !done.has(k));
  if (!todo.length) return [];
  const [cats, prods] = await Promise.all([list('categories'), list('products')]);
  const batch = writeBatch(db);
  const ran = [];
  for (const k of todo) if ((await MIGRATIONS[k](batch, { cats, prods, settings })) !== false) ran.push(k);
  if (!ran.length) return [];
  batch.set(doc(db, 'settings', 'site'), { migrations: [...done, ...ran] }, { merge: true });
  await batch.commit();
  return ran;
}

export async function exportAll() {
  const names = ['settings', 'categories', 'products', 'testimonials', 'enquiries', 'media', 'gallery', 'leads', 'crm'];
  const out = {};
  for (const n of names) out[n] = await list(n).catch(() => []);
  return out;
}
