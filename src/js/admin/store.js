import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, writeBatch, serverTimestamp } from 'firebase/firestore/lite';
import { db } from '../core/firebase.js';
import { SETTINGS, CATEGORIES, PRODUCTS } from '../core/defaults.js';

export const ts = serverTimestamp;

export async function list(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export const get = async (name, id) => { const s = await getDoc(doc(db, name, id)); return s.exists() ? { id: s.id, ...s.data() } : null; };
export const set = (name, id, data, merge = true) => setDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() }, { merge });
export const update = (name, id, data) => updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() });
export const remove = (name, id) => deleteDoc(doc(db, name, id));
export const add = (name, data) => addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() });

export async function getSettings() {
  const s = await get('settings', 'site');
  return { ...SETTINGS, ...(s || {}) };
}
export const saveSettings = (data) => set('settings', 'site', data);

/** Import the default catalogue. mode: 'missing' keeps existing docs, 'overwrite' replaces them. */
export async function seedCatalogue(mode = 'missing') {
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
};

export async function runMigrations() {
  const settings = await get('settings', 'site');
  const done = new Set(settings?.migrations || []);
  const todo = Object.keys(MIGRATIONS).filter(k => !done.has(k));
  if (!todo.length) return [];
  const [cats, prods] = await Promise.all([list('categories'), list('products')]);
  const batch = writeBatch(db);
  for (const k of todo) await MIGRATIONS[k](batch, { cats, prods });
  batch.set(doc(db, 'settings', 'site'), { migrations: [...done, ...todo] }, { merge: true });
  await batch.commit();
  return todo;
}

export async function exportAll() {
  const names = ['settings', 'categories', 'products', 'testimonials', 'enquiries', 'media'];
  const out = {};
  for (const n of names) out[n] = await list(n).catch(() => []);
  return out;
}
