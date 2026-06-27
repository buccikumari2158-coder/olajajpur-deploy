import { getApps, getApp, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env["EXPO_PUBLIC_FIREBASE_API_KEY"] ?? "",
  authDomain: process.env["EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"] ?? "",
  projectId: process.env["EXPO_PUBLIC_FIREBASE_PROJECT_ID"] ?? "",
  storageBucket: process.env["EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"] ?? "",
  messagingSenderId: process.env["EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"] ?? "",
  appId: process.env["EXPO_PUBLIC_FIREBASE_APP_ID"] ?? "",
};

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let _app: ReturnType<typeof initializeApp> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    console.log("[Firebase] App initialized with projectId:", firebaseConfig.projectId);
  }
  return _app;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_auth) {
    _auth = getAuth(app);
    console.log("[Firebase] Auth instance created");
    // NOTE: Do NOT set appVerificationDisabledForTesting here.
    // That flag prevents real SMS delivery and should only ever be
    // enabled explicitly in the Firebase Console for specific test phone numbers.
  }
  return _auth;
}

export const firebaseApp = getFirebaseApp();
export const firebaseAuth = getFirebaseAuth();
