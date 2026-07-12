import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import config from '../firebase-applet-config.json';

import { getFirestore } from 'firebase/firestore';

const app = !getApps().length ? initializeApp(config) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/chat.spaces');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages.create');

let cachedAccessToken: string | null = null;

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const getCachedAccessToken = () => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logOut = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export { app, auth, googleProvider, db };
