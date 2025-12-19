/**
 * Firebase Authentication for Personalized Learning Demo
 * Restricts access to @google.com email addresses
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

// Firebase configuration - reads from environment variables set in .env
// These are populated by the Quickstart notebook or can be set manually
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google provider with domain restriction hint
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  hd: "google.com", // Hint to show only google.com accounts
});

// Allowed email domain
const ALLOWED_DOMAIN = "google.com";

/**
 * Check if user's email is from allowed domain
 */
function isAllowedDomain(email: string | null): boolean {
  if (!email) return false;
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}

/**
 * Get current user if authenticated and from allowed domain
 */
export function getCurrentUser(): User | null {
  const user = auth.currentUser;
  if (user && isAllowedDomain(user.email)) {
    return user;
  }
  return null;
}

/**
 * Get ID token for API requests
 */
export async function getIdToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("[Auth] Failed to get ID token:", error);
    return null;
  }
}

/**
 * Sign in with Google
 * Returns user if successful and from allowed domain, null otherwise
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!isAllowedDomain(user.email)) {
      console.warn(`[Auth] User ${user.email} not from ${ALLOWED_DOMAIN}`);
      await signOut(auth);
      throw new Error(`Access restricted to @${ALLOWED_DOMAIN} accounts`);
    }

    console.log(`[Auth] Signed in: ${user.email}`);
    return user;
  } catch (error: any) {
    if (error.code === "auth/popup-closed-by-user") {
      console.log("[Auth] Sign-in cancelled by user");
      return null;
    }
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
  console.log("[Auth] Signed out");
}

/**
 * Subscribe to auth state changes
 * Callback receives user if authenticated and from allowed domain, null otherwise
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (user && isAllowedDomain(user.email)) {
      callback(user);
    } else {
      callback(null);
    }
  });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
