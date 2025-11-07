import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, googleProvider, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type UserRole = "admin" | "agent" | "md";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  branch?: string;
  createdAt: Date;
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in");
  }
}

// Create new user account (calls backend API to set claims properly)
export async function createUserAccount(
  email: string,
  password: string,
  displayName: string
) {
  try {
    // Call backend API to create user with proper claims
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create account");
    }

    // Now sign in the user
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create account");
  }
}

// Sign in with Google
export function signInWithGoogle() {
  signInWithRedirect(auth, googleProvider);
}

// Handle redirect result after Google sign-in
export async function handleGoogleRedirect() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (!userDoc.exists()) {
        // New Google user - call backend to create with claims
        const idToken = await result.user.getIdToken();
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            email: result.user.email,
            displayName: result.user.displayName,
            password: null, // Google users don't need password
          }),
        });

        if (!response.ok) {
          console.error("Failed to create user profile for Google user");
        }
      }
      return result.user;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message || "Failed to handle redirect");
  }
}

// Sign out
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign out");
  }
}

// Get user profile with role from custom claims
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile;
      
      // Get role from custom claims (more secure)
      const user = auth.currentUser;
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        profile.role = (idTokenResult.claims.role as UserRole) || "agent";
      }
      
      return profile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Listen to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
