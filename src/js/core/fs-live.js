// Real-time Firestore (full SDK) — loaded on demand after the visitor engages, so admin edits
// reach open pages within a second without a reload. Listeners only pay for documents that change.
import { getFirestore, connectFirestoreEmulator, collection, doc, query, where, onSnapshot } from 'firebase/firestore';
import { app, USE_EMULATORS } from './firebase.js';

const db = getFirestore(app);
if (USE_EMULATORS) connectFirestoreEmulator(db, '127.0.0.1', 8080);

/** Calls onPart(name, value) whenever one of the public collections changes. Returns an unsubscribe. */
export function subscribe(onPart, onError) {
  const plain = (d) => { const { updatedAt, ...rest } = d.data(); return { id: d.id, ...rest }; };
  const offs = [
    onSnapshot(doc(db, 'settings', 'site'), s => onPart('settings', s.exists() ? plain(s) : null), onError),
    onSnapshot(collection(db, 'categories'), s => onPart('categories', s.docs.map(plain)), onError),
    onSnapshot(collection(db, 'products'), s => onPart('products', s.docs.map(plain)), onError),
    onSnapshot(query(collection(db, 'testimonials'), where('status', '==', 'approved')), s => onPart('testimonials', s.docs.map(d => ({ id: d.id, ...d.data() }))), onError),
  ];
  return () => offs.forEach(off => off());
}
