import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase-config';

// Inicializa a instância do Firestore a partir do app Firebase já configurado
export const db = getFirestore(app);

/**
 * Garante que o perfil do usuário exista no banco de dados. 
 * Necessário antes de inserir subcoleções devido às regras de segurança do Firestore.
 */
export const ensureUserProfile = async (uid: string, email: string, displayName?: string | null) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Cria o documento do usuário
    const userData: any = {
      uid,
      email,
      currentPlan: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    if (displayName) {
      userData.displayName = displayName;
    }
    
    await setDoc(userRef, userData);
  } else {
    // Se já existir, atualiza apenas a data de modificação e nome, se aplicável
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    if (displayName) {
      updateData.displayName = displayName;
    }
    
    await updateDoc(userRef, updateData);
  }
};

/**
 * Salva os metadados de uma planilha enviada/selecionada.
 */
export const saveFileMetadata = async (
  userId: string, 
  fileId: string, 
  filename: string, 
  storageUrl: string, 
  sizeBytes?: number
) => {
  const fileRef = doc(db, 'users', userId, 'files', fileId);
  
  const fileData: any = {
    userId,
    filename,
    storageUrl,
    processingStatus: 'completed', // 'pending' | 'processing' | 'completed' | 'failed'
    uploadedAt: serverTimestamp()
  };
  
  if (sizeBytes !== undefined) {
    fileData.sizeBytes = sizeBytes;
  }
  
  await setDoc(fileRef, fileData);
};

/**
 * Salva ou atualiza uma configuração de dashboard de um usuário.
 */
export const saveDashboardConfig = async (
  userId: string,
  dashboardId: string,
  name: string,
  layoutConfig: string // Deve ser uma string JSON com a configuração do layout/gráficos
) => {
  const dashboardRef = doc(db, 'users', userId, 'dashboards', dashboardId);
  const dashboardSnap = await getDoc(dashboardRef);
  
  if (!dashboardSnap.exists()) {
    await setDoc(dashboardRef, {
      userId,
      name,
      layoutConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(dashboardRef, {
      name,
      layoutConfig,
      updatedAt: serverTimestamp()
    });
  }
};
