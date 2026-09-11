import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const env = (import.meta as any).env || {};

// Firebase web configuration (uses env vars if present, falls back to live project config)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAmwpiGm4bnyPaSRhnB84FvLr6ytQ3W77s",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gotham-sih.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "gotham-sih",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gotham-sih.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "460136536018",
  appId: env.VITE_FIREBASE_APP_ID || "1:460136536018:web:6ae53de138622c08d09a0b"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Auth service
export const auth = getAuth(app);
export default app;
