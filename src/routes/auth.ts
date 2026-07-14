import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, uid } = req.body;

  try {
    const db = getFirestore();

    let userRole = 'Gratuito';
    if (email === 'lucyano.pci@gmail.com') {
      userRole = 'Master';
    }

    await db.collection('users').doc(uid).set({
      name,
      email,
      role: userRole,
      createdAt: new Date(),
      stripeCustomerId: null
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
