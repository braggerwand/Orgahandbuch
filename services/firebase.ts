import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as firebaseAuth from "firebase/auth"; 
import { getRemoteConfig } from "firebase/remote-config";

const firebaseConfig = {
  apiKey: "AIzaSyCh25gb9xmjcHuDGbm25AknHgdZ9utsLDo",
  authDomain: "kiefer-adfa3.firebaseapp.com",
  projectId: "kiefer-adfa3",
  storageBucket: "kiefer-adfa3.firebasestorage.app",
  messagingSenderId: "493881359952",
  appId: "1:493881359952:web:9db2e7ba8bcc66e31bdb55"
};

// App starten
const app = initializeApp(firebaseConfig);

// Extract Auth functions from namespace
const { getAuth, signInAnonymously, onAuthStateChanged } = firebaseAuth;

// Datenbank, Auth und RemoteConfig exportieren
export const db = getFirestore(app);
export const auth = getAuth(app);
export const remoteConfig = getRemoteConfig(app);

// Status Helper
export const isFirebaseReady = true;

// Re-export Auth functions for centralized access
export { signInAnonymously, onAuthStateChanged };

// Auth Helper
export const ensureAuth = async (): Promise<boolean> => {
  if (!auth) return false;
  if (auth.currentUser) return true;
  try {
    await signInAnonymously(auth);
    return true;
  } catch (e) {
    console.error("Auth failed", e);
    return false;
  }
};