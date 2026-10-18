// Firestore (lite) for the public site — loaded on demand so it never delays first paint.
export { collection, doc, getDoc, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore/lite';
export { db } from './firebase.js';
