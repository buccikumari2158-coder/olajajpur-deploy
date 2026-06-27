import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let firebaseAdmin: Auth;

try {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  firebaseAdmin = getAuth();
} catch (e) {
  console.error(
    "Firebase Admin initialization failed — check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
    e,
  );
  firebaseAdmin = {
    verifyIdToken: async () => {
      throw new Error("Firebase Admin not configured");
    },
  } as unknown as Auth;
}

export { firebaseAdmin };
