import { auth, isFirebaseConfigured, googleProvider } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

export async function signInWithEmail(email: string, password: string) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase not configured');
  }
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase not configured');
  }
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error('Firebase not configured or Google provider not available');
  }
  return await signInWithPopup(auth, googleProvider);
}

export function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || error?.response?.status === 401;
}
