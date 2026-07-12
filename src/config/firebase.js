import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * CONFIGURAÇÃO DO FIREBASE CLIENT
 * 
 * Este arquivo lê as credenciais do Firebase utilizando variáveis VITE_ (Vite).
 * Garante uma inicialização segura e única para os serviços de autenticação e banco de dados Firestore.
 */
const env =
  (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) || {};
const firebaseConfig = {
  apiKey: env.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: env.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.appId || import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Inicializa o Firebase somente se ainda não houver nenhuma app ativa
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exporta as instâncias ativas para uso em toda a aplicação
export const db = getFirestore(app);
export const auth = getAuth(app);
