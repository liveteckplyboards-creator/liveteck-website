import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore/lite';

// Web config is public by design — access is enforced by firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyDxVxV9wyfgHuUib0CeatChEJBMC_XvwWg',
  authDomain: 'liveteck-3fd57.firebaseapp.com',
  projectId: 'liveteck-3fd57',
  storageBucket: 'liveteck-3fd57.firebasestorage.app',
  messagingSenderId: '436699201972',
  appId: '1:436699201972:web:ba5706f54ef5ddfa8ef2e1',
  measurementId: 'G-527SJBJ7N4',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Local testing against the Firebase emulators: `VITE_EMULATORS=1 npm run dev`
export const USE_EMULATORS = import.meta.env.VITE_EMULATORS === '1';
if (USE_EMULATORS) connectFirestoreEmulator(db, '127.0.0.1', 8080);

export const CLOUDINARY = { cloud: 'duswrz4u', preset: 'liveteck' };
