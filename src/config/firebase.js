import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * CONFIGURAÇÃO DO FIREBASE CLIENT
 * 
 * Este arquivo lê as credenciais do Firebase utilizando variáveis de ambiente (process.env).
 * Garante uma inicialização segura e única para os serviços de autenticação e banco de dados Firestore.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Inicializa o Firebase somente se ainda não houver nenhuma app ativa
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exporta as instâncias ativas para uso em toda a aplicação
export const db = getFirestore(app);
export const auth = getAuth(app);
