import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const env = (import.meta as any).env || {};

// Firebase web configuration (uses env vars if present, falls back to demo/local sandbox config)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyGothamSIH26189ForTestingOnly",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gotham-sih.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "gotham-sih",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gotham-sih.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo123456789012"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Auth service
export const auth = getAuth(app);
export default app;
