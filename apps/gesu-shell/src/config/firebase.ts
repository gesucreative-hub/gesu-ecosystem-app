// Firebase Configuration
// Instructions:
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Add a web app
// 4. Copy the config values here

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence for Firestore (fail silently if not supported)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('[Firebase] Offline persistence unavailable - multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('[Firebase] Offline persistence not supported in this browser');
    }
});

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Force account selection every time (allows switching between different Google accounts)
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

