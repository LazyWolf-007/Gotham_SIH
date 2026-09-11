import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const env = (import.meta as any).env || {};

// Firebase web configuration (uses env vars if present, falls back to safe demo placeholders)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyGothamSIH26189Placeholder",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gotham-demo.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "gotham-demo",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gotham-demo.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: env.VITE_FIREBASE_APP_ID || "1:000000000000:web:demo000000000000"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Auth service
export const auth = getAuth(app);
export default app;
