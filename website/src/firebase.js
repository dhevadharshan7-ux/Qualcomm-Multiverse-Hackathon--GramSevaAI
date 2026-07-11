// Firebase bridge, per react_firebase_integration.md — the teammate's
// spec'd integration. Config comes from Vite env vars (VITE_FIREBASE_*),
// left unset by default so the app runs without a real Firebase project.
// When unset, `db` is null and firebaseBridge.js degrades gracefully
// instead of crashing the page.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let db = null;
if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  console.warn(
    '[firebase] VITE_FIREBASE_* env vars not set — live-sync features (My Grievances ' +
      'auto-refresh, cross-device status) are disabled. Voice/grievance/ID-request core ' +
      'flows still work via the Python orchestrator directly.'
  );
}

export { db };
