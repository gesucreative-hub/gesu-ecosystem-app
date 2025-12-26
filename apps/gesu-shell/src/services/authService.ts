// Authentication Service
// Handles Google Sign-In, Sign-Out, and user state

import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export interface GesuUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

/**
 * Convert Firebase User to GesuUser
 */
function toGesuUser(user: User): GesuUser {
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
    };
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<GesuUser> {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('[Auth] Google sign-in successful:', result.user.email);
        return toGesuUser(result.user);
    } catch (error: any) {
        console.error('[Auth] Google sign-in failed:', error);
        throw new Error(error.message || 'Failed to sign in with Google');
    }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
    try {
        await firebaseSignOut(auth);
        console.log('[Auth] Sign-out successful');
    } catch (error: any) {
        console.error('[Auth] Sign-out failed:', error);
        throw new Error(error.message || 'Failed to sign out');
    }
}

/**
 * Get current user
 */
export function getCurrentUser(): GesuUser | null {
    const user = auth.currentUser;
    return user ? toGesuUser(user) : null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: GesuUser | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
        const gesuUser = firebaseUser ? toGesuUser(firebaseUser) : null;
        callback(gesuUser);
    });
}
