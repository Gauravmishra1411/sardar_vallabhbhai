// Firebase Configuration Helper for Next.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM1CTp6FVGQYSVtlpalRURUiCpLawGGlI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sardar-vallabhbhai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sardar-vallabhbhai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sardar-vallabhbhai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1066044087657",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1066044087657:web:d26535c6d10e1a48a531f8",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-RZ68JYHZ0J",
};

export const mobileAppInfo = {
  bundleId: process.env.NEXT_PUBLIC_APP_BUNDLE_ID || "sardarvallabhbhai.com",
  iosAppId: process.env.NEXT_PUBLIC_FIREBASE_IOS_APP_ID || "1:1066044087657:ios:6a485389631c9c76a531f8",
  androidAppId: process.env.NEXT_PUBLIC_FIREBASE_ANDROID_APP_ID || "1:1066044087657:android:de10024e1a828cbca531f8",
};

// Initialize Firebase App client-side safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

import { getStorage } from "firebase/storage";
const storage = getStorage(app);

export { app, auth, db, storage };

// Server-Side Firebase Admin SDK Config (For Next.js API Routes & Server Components)
export const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sardar-vallabhbhai",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@sardar-vallabhbhai.iam.gserviceaccount.com",
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || "d06bfebe8555294212a78d6bb62401ec0fa9df5d",
  clientId: process.env.FIREBASE_CLIENT_ID || "116073540877353655217",
};
