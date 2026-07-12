// src/routes/auth.ts
import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore();

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, uid } = req.body;

  try {
    // Regra de Ouro: Define seu acesso como Master automaticamente
    let userRole = 'Gratuito';
    if (email === 'lucyano.pci@gmail.com') {
      userRole = 'Master';
    }

    // Salva o usuário de forma simples no banco de dados
    await db.collection('users').doc(uid).set({
      name,
      email,
      role: userRole,
      createdAt: new Date(),
      stripeCustomerId: null // Será preenchido quando ele assinar
    });

    return res.status(201).json({ 
      success: true, 
      message: "Usuário registrado com sucesso!", 
      role: userRole 
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: "Erro ao salvar no banco." });
  }
});

export default router;
