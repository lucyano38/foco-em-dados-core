import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

try {
  if (!getApps().length) {
    initializeApp();
  }
} catch (error) {
  console.log("Firebase Admin initialization skipped or failed in config:", error);
}

export const db = getFirestore();
