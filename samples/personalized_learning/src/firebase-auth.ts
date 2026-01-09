/**
 * Firebase Authentication for Personalized Learning Demo
 *
 * By default, restricts access to @google.com email addresses.
 * To customize access:
 *   - Change ALLOWED_DOMAIN to your organization's domain
 *   - Add specific emails to ALLOWED_EMAILS whitelist
 *   - Or set ALLOWED_DOMAIN to "" and use only the whitelist
 *
 * LOCAL DEV MODE: If VITE_FIREBASE_API_KEY is not set, auth is bypassed
 * and the app runs without requiring sign-in.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  Auth,
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

// Check if Firebase is configured (API key present)
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase only if configured
let app: ReturnType<typeof initializeApp> | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  console.log("[Auth] Firebase not configured - running in local dev mode (no auth required)");
}

// Google provider with domain restriction hint
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  hd: "google.com", // Hint to show only google.com accounts (change if using different domain)
});

// ============================================================================
// ACCESS CONTROL CONFIGURATION
// ============================================================================

// Allowed email domain (e.g., "google.com", "yourcompany.com")
// Set to empty string "" to disable domain-based access and use only the whitelist
const ALLOWED_DOMAIN = "google.com";

// Whitelist of specific email addresses that are always allowed,
// regardless of domain. Add emails here to grant access to external collaborators.
// Example: ["alice@example.com", "bob@partner.org", "charlie@university.edu"]
const ALLOWED_EMAILS: string[] = [
  // "collaborator@example.com",
  // "reviewer@partner.org",
];

// ============================================================================

/**
 * Check if user's email is allowed (by domain or whitelist)
 */
function isAllowedEmail(email: string | null): boolean {
  if (!email) return false;

  // Check whitelist first
  if (ALLOWED_EMAILS.includes(email.toLowerCase())) {
    return true;
  }

  // Check domain if configured
  if (ALLOWED_DOMAIN && email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return true;
  }

  return false;
}

/**
 * Get current user if authenticated and from allowed domain
 * In local dev mode (no Firebase), returns null
 */
export function getCurrentUser(): User | null {
  if (!auth) return null;
  const user = auth.currentUser;
  if (user && isAllowedEmail(user.email)) {
    return user;
  }
  return null;
}

/**
 * Get ID token for API requests
 * In local dev mode, returns null (API server should allow unauthenticated requests locally)
 */
export async function getIdToken(): Promise<string | null> {
  if (!auth) return null;
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
 * In local dev mode, this should not be called (UI bypasses auth)
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    console.warn("[Auth] signInWithGoogle called but Firebase not configured");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!isAllowedEmail(user.email)) {
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
  if (!auth) return;
  await signOut(auth);
  console.log("[Auth] Signed out");
}

/**
 * Subscribe to auth state changes
 * Callback receives user if authenticated and from allowed domain, null otherwise
 * In local dev mode, immediately calls back with a mock "authenticated" state
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  // Local dev mode: no Firebase, skip auth entirely
  if (!auth) {
    // Immediately trigger callback as "authenticated" in local dev mode
    // We pass null but main.ts will check isFirebaseConfigured to bypass auth
    setTimeout(() => callback(null), 0);
    return () => {}; // No-op unsubscribe
  }

  return onAuthStateChanged(auth, (user) => {
    if (user && isAllowedEmail(user.email)) {
      callback(user);
    } else {
      callback(null);
    }
  });
}

/**
 * Check if user is authenticated
 * In local dev mode, returns false (but app bypasses auth check)
 */
export function isAuthenticated(): boolean {
  if (!auth) return false;
  return getCurrentUser() !== null;
}
