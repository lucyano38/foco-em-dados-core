import express from "express";
import path from "path";
import multer from "multer";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
import Stripe from "stripe";
import QRCode from "qrcode";
import cors from "cors";
import authRouter from "./src/routes/auth";

// Initialize Firebase Admin 
// (Requires GOOGLE_APPLICATION_CREDENTIALS env var with service account path in production)
try {
  if (!getApps().length) {
    initializeApp();
  }
} catch (error) {
  console.log("Firebase Admin initialization skipped (needs credentials in production).");
}

const db = getApps().length ? getFirestore() : null;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function tryParseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return null;

  // Remove currency, spaces, percent sign and letters
  let cleaned = val.replace(/[\sR\$\€\£\%\a-zA-Z]/g, '').trim();
  if (cleaned === '') return null;

  // Replaces dot thousand-separator and comma decimal-separator if Brazilian-style
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastComma > lastDot) {
    // E.g. 1.500,50 -> 1500.50
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // E.g. 1,500.50 -> 1500.50
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastComma !== -1) {
    // Only commas, check if it's decimal (one comma) or thousand separator (multiple commas)
    const commaCount = (cleaned.match(/,/g) || []).length;
    if (commaCount === 1) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const parsed = Number(cleaned);
  return isNaN(parsed) ? null : parsed;
}

async function startServer() {
  const app = express();
  app.use(cors());
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

  // Lazy init Gemini
  const getAI = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("A chave GEMINI_API_KEY não foi configurada nas variáveis de ambiente. Por favor, adicione-a.");
    }
    return new GoogleGenAI({ apiKey: key });
  };

  // Helper to execute Gemini generation with retries and fallback
  const generateContentWithRetryAndFallback = async (params: {
    model?: string;
    fallbackModel?: string;
    contents: any;
    config?: any;
    maxRetries?: number;
  }) => {
    const primary = params.model || "gemini-3.5-flash";
    const second = "gemini-flash-latest";
    const third = params.fallbackModel || "gemini-3.1-flash-lite";
    
    // Build a unique chain of models to try in sequence
    const modelsToTry = [primary];
    if (!modelsToTry.includes(second)) modelsToTry.push(second);
    if (!modelsToTry.includes(third)) modelsToTry.push(third);

    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      let delay = 800;
      const maxAttemptsForModel = 2; // Try each model up to 2 times (initial + 1 retry if transient)
      
      for (let attempt = 0; attempt < maxAttemptsForModel; attempt++) {
        try {
          console.log(`[Gemini API] Tentando gerar conteúdo com o modelo: ${currentModel} (Tentativa ${attempt + 1}/${maxAttemptsForModel})`);
          const result = await getAI().models.generateContent({
            model: currentModel,
            contents: params.contents,
            config: params.config,
          });
          console.log(`[Gemini API] Sucesso com o modelo: ${currentModel}`);
          return result;
        } catch (error: any) {
          lastError = error;
          const status = error.status || error.code || (error.response && error.response.status);
          const isTransient = status === "UNAVAILABLE" || status === 503 || (error.message && error.message.includes("503")) || (error.message && error.message.includes("UNAVAILABLE"));
          
          console.warn(`[Gemini API] Erro no modelo ${currentModel} (Tentativa ${attempt + 1}/${maxAttemptsForModel}):`, error.message || error);
          
          if (attempt < maxAttemptsForModel - 1 && isTransient) {
            // Wait a bit before retrying the same model
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            // Break loop to go to next model in the chain
            break;
          }
        }
      }
    }
    
    // If all models in the chain failed, throw the last error
    throw lastError || new Error("Todos os modelos Gemini do fallback falharam.");
  };

  // Init Stripe
  let stripe: Stripe | null = null;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  let operacaoModo = "NÃO CONFIGURADO (Chave ausente)";

  if (stripeKey) {
    stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });
    if (stripeKey.startsWith("sk_live")) {
      operacaoModo = "LIVE";
    } else if (stripeKey.startsWith("sk_test")) {
      operacaoModo = "TEST";
    } else {
      operacaoModo = "CONFIGURAÇÃO INVÁLIDA";
    }
  }

  // Log de segurança de auditoria requerido
  console.log(`Modo de Operação: ${operacaoModo}`);

  // ==========================================
  // STRIPE WEBHOOK (Needs raw body)
  // ==========================================
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!stripe || !endpointSecret || !sig || typeof sig !== 'string') {
        return res.status(400).send("Stripe não configurado corretamente.");
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (!db) return res.status(200).send("Ignorado (sem DB)");

      const usersRef = db.collection('users');

      // Manipular eventos do Stripe
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const email = session.customer_details?.email || session.customer_email;
        if (email) {
          const snapshot = await usersRef.where('email', '==', email).limit(1).get();
          if (snapshot.empty) {
            await usersRef.add({
              email,
              plan: 'pro',
              quotaUsed: 0,
              createdAt: FieldValue.serverTimestamp()
            });
          } else {
            await snapshot.docs[0].ref.update({ plan: 'pro' });
          }
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        
        const customer = await stripe.customers.retrieve(customerId) as any;
        const email = customer.email;

        if (email) {
          const snapshot = await usersRef.where('email', '==', email).limit(1).get();
          if (!snapshot.empty) {
            await snapshot.docs[0].ref.update({ plan: 'free' });
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Stripe Webhook Error:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // Add JSON parsing for body
  app.use(express.json());

  // Mount Auth Router
  app.use("/api/auth", authRouter);

  // Endpoints do Stripe para validação amigável de chaves e prevenção de loops no front-end
  app.get("/api/stripe/config", (req, res) => {
    if (!stripe) {
      return res.status(400).json({
        success: false,
        error: "Stripe não configurado no servidor. Por favor, adicione a chave secreta (STRIPE_SECRET_KEY) nas configurações.",
        mode: "NÃO CONFIGURADO"
      });
    }
    return res.json({
      success: true,
      mode: stripeKey?.startsWith("sk_live") ? "LIVE" : "TEST"
    });
  });

  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({
          success: false,
          error: "O gateway de pagamento Stripe não está configurado. Por favor, adicione a sua chave secreta (STRIPE_SECRET_KEY) para ativar o checkout seguro."
        });
      }

      const { priceId, successUrl, cancelUrl } = req.body;
      if (!priceId) {
        return res.status(400).json({
          success: false,
          error: "ID de preço do Stripe (priceId) é obrigatório."
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${req.protocol}://${req.get('host')}/?success=true`,
        cancel_url: cancelUrl || `${req.protocol}://${req.get('host')}/?canceled=true`,
      });

      return res.json({
        success: true,
        sessionId: session.id,
        url: session.url
      });
    } catch (err: any) {
      console.error("[Stripe] Erro ao criar sessão de checkout:", err);
      return res.status(500).json({
        success: false,
        error: `Erro ao iniciar checkout: ${err.message || "Erro no gateway Stripe."}`
      });
    }
  });

  // ==========================================
  // WEBHOOKS (Kiwify & Hotmart)
  // ==========================================

  // KIWIFY WEBHOOK
  app.post("/api/webhooks/kiwify", async (req, res) => {
    try {
      const signature = req.headers['x-kiwify-signature'] as string;
      const kiwifyWebhookSecret = process.env.KIWIFY_WEBHOOK_SECRET || "SEU_TOKEN_AQUI";
      
      // Validação de Segurança (Assinatura)
      // A Kiwify envia uma assinatura HMAC SHA-1 do payload
      if (signature) {
        const payload = JSON.stringify(req.body);
        const hash = crypto.createHmac('sha1', kiwifyWebhookSecret).update(payload).digest('hex');
        if (hash !== signature) {
          return res.status(401).json({ error: "Assinatura inválida." });
        }
      }

      const { order_status, Customer } = req.body;
      const email = Customer?.email;

      if (!email || !db) return res.status(200).send("Ignorado (sem email ou sem DB)");

      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (order_status === "approved") {
        // Compra Aprovada: Liberar acesso PRO
        if (snapshot.empty) {
          // Criar usuário se não existir
          await usersRef.add({
            email,
            plan: 'pro',
            quotaUsed: 0,
            createdAt: FieldValue.serverTimestamp()
          });
        } else {
          // Atualizar plano para PRO
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({ plan: 'pro' });
        }
      } else if (order_status === "refunded" || order_status === "chargedback") {
        // Reembolso/Chargeback: Revogar acesso
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({ plan: 'free' });
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Kiwify Webhook Error:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // HOTMART WEBHOOK
  app.post("/api/webhooks/hotmart", async (req, res) => {
    try {
      const hottok = req.headers['x-hotmart-hottok'] as string;
      const hotmartWebhookSecret = process.env.HOTMART_HOTTOK || "SEU_HOTTOK_AQUI";

      // Validação de Segurança (Token)
      if (hottok !== hotmartWebhookSecret) {
        return res.status(401).json({ error: "Token Hottok inválido." });
      }

      const event = req.body.event; // Ex: PURCHASE_APPROVED, PURCHASE_REFUNDED
      const email = req.body.data?.buyer?.email;

      if (!email || !db) return res.status(200).send("Ignorado (sem email ou sem DB)");

      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (event === "PURCHASE_APPROVED") {
        // Compra Aprovada
        if (snapshot.empty) {
          await usersRef.add({
            email,
            plan: 'pro',
            quotaUsed: 0,
            createdAt: FieldValue.serverTimestamp()
          });
        } else {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({ plan: 'pro' });
        }
      } else if (event === "PURCHASE_REFUNDED" || event === "PURCHASE_CANCELED") {
        // Reembolso/Cancelamento
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({ plan: 'free' });
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Hotmart Webhook Error:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ==========================================
  // MIDLLEWARE DE AUTENTICAÇÃO E RBAC (Controle de Acesso)
  // ==========================================
  const requireRole = (allowedRoles: string[]) => {
    return async (req: any, res: any, next: any) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Token de autenticação não fornecido ou inválido." });
        }

        const idToken = authHeader.split("Bearer ")[1];
        
        // Se o Firebase Admin não estiver configurado corretamente (ambiente de teste local, etc.)
        if (!getApps().length) {
          console.warn("Firebase Admin não inicializado. Ignorando validação de token.");
          return res.status(503).json({ error: "Serviço de autenticação temporariamente indisponível." });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const email = decodedToken.email || "";
        const uid = decodedToken.uid;
        const isLucyano = email.toLowerCase() === "lucyano.pci@gmail.com";

        // Injetar dados básicos do usuário no request
        req.user = {
          uid,
          email,
          role: isLucyano ? "Master" : "User", // default
        };

        // Consultar a role no banco de dados Firestore
        if (db) {
          const userDoc = await db.collection("users").doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            req.user.role = isLucyano ? "Master" : (userData?.role || "User");
            
            if (isLucyano && (userData?.role !== "Master" || userData?.plan !== "pro")) {
              await db.collection("users").doc(uid).set({ role: "Master", plan: "pro" }, { merge: true });
            }
          } else if (isLucyano) {
            await db.collection("users").doc(uid).set({
              email,
              role: "Master",
              plan: "pro",
              quotaUsed: 0,
              createdAt: new Date().toISOString()
            });
          }
        }

        // Verificar se a role do usuário está entre as roles permitidas
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ 
            error: `Acesso negado. Esta rota requer privilégios de: [${allowedRoles.join(", ")}]. Sua role atual é: ${req.user.role}` 
          });
        }

        next();
      } catch (error: any) {
        console.error("Erro no middleware RBAC:", error);
        return res.status(401).json({ error: "Não autorizado ou token expirado." });
      }
    };
  };

  // Middleware para verificar se o usuário é Premium (pro) ou Master
  const requirePremiumOrMaster = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token de autenticação não fornecido ou inválido." });
      }

      const idToken = authHeader.split("Bearer ")[1];
      
      if (!getApps().length) {
        console.warn("Firebase Admin não inicializado. Ignorando validação.");
        return res.status(503).json({ error: "Serviço de autenticação temporariamente indisponível." });
      }

      const decodedToken = await getAuth().verifyIdToken(idToken);
      const email = decodedToken.email || "";
      const uid = decodedToken.uid;
      const isLucyano = email.toLowerCase() === "lucyano.pci@gmail.com";

      let role = isLucyano ? "Master" : "User";
      let plan = isLucyano ? "pro" : "free";

      if (db) {
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          role = isLucyano ? "Master" : (userData?.role || "User");
          plan = isLucyano ? "pro" : (userData?.plan || "free");

          if (isLucyano && (userData?.role !== "Master" || userData?.plan !== "pro")) {
            await db.collection("users").doc(uid).set({ role: "Master", plan: "pro" }, { merge: true });
          }
        } else if (isLucyano) {
          await db.collection("users").doc(uid).set({
            email,
            role: "Master",
            plan: "pro",
            quotaUsed: 0,
            createdAt: new Date().toISOString()
          });
        }
      }

      req.user = { uid, email, role, plan };

      // Se for Premium (pro) ou Master, prosseguir
      if (plan === "pro" || role === "Master") {
        return next();
      }

      return res.status(403).json({ 
        error: "Este recurso está disponível apenas no plano Premium. Descubra o que seus concorrentes estão fazendo na internet em tempo real e compare com seus dados de precificação. Faça o upgrade agora!" 
      });
    } catch (error: any) {
      console.error("Erro no middleware Premium Paywall:", error);
      return res.status(401).json({ error: "Não autorizado ou token expirado." });
    }
  };

  // Motor de Busca Comparativa (Exclusivo Premium)
  app.post("/api/premium/web-search-compare", requirePremiumOrMaster, async (req: any, res: any) => {
    try {
      const { productName, productPrice, additionalContext } = req.body;
      
      if (!productName) {
        return res.status(400).json({ error: "O nome do produto é obrigatório para realizar a busca comparativa." });
      }

      const prompt = `Você é um Analista de Mercado e Pricing de e-commerce Sênior. 
O cliente possui o seguinte produto em sua planilha:
- Nome do Produto: "${productName}"
- Preço Atual do Cliente: R$ ${productPrice || "Não especificado"}
${additionalContext ? `- Contexto Adicional da Planilha: ${additionalContext}` : ""}

Sua tarefa:
1. Busque na internet em tempo real pelos preços atuais deste produto nos principais varejistas brasileiros (como Google Shopping, Mercado Livre, Amazon, Magalu, etc.).
2. Faça uma comparação direta de preços. Calcule a média de mercado e determine se o preço do cliente está acima ou abaixo da média de mercado (especifique a porcentagem de diferença, ex: "Seu preço está 15% acima da média do Google Shopping" ou "Seu preço está 8% abaixo da média de mercado").
3. Forneça insights brutos, diretos e acionáveis sobre a estratégia de precificação recomendada (ex: se devem baixar o preço, se há margem para aumentar, etc.).
4. Indique de forma clara as fontes, concorrentes e preços encontrados.

Responda em português brasileiro de forma direta, altamente analítica e estruturada com marcadores.`;

      // Executando busca na web com a ferramenta de busca Google Search integrada nativamente e tratamento de erros/fallback
      const response = await generateContentWithRetryAndFallback({
        model: process.env.ID_BOT_PLANILHAS || "gemini-3.5-flash",
        fallbackModel: "gemini-3.1-flash-lite", // fallback if primary experiences transient issues
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "Não foi possível gerar uma comparação no momento.";
      
      // Extraindo fontes/links da busca em tempo real para exibir na interface de forma rica
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title || "Fonte externa",
        uri: chunk.web?.uri || "#"
      })).filter((src: any) => src.uri !== "#");

      res.json({
        productName,
        productPrice,
        insight: text,
        sources,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Erro no motor de busca comparativa:", err);
      res.status(500).json({ error: err.message || "Erro interno ao executar a busca comparativa." });
    }
  });

  // Exemplo de rota protegida que retorna métricas sensíveis apenas para "Master" ou "Admin"
  app.get("/api/admin/metrics", requireRole(["Master"]), async (req: any, res: any) => {
    try {
      if (!db) {
        return res.json({
          message: "Modo de simulação ativo (Sem banco de dados conectado)",
          totalUsers: 42,
          proUsersCount: 12,
          systemLoad: "Normal"
        });
      }

      const usersSnapshot = await db.collection("users").get();
      const totalUsers = usersSnapshot.size;
      
      let proUsersCount = 0;
      usersSnapshot.forEach(doc => {
        if (doc.data().plan === "pro") proUsersCount++;
      });

      res.json({
        message: "Dados de administração carregados com sucesso.",
        totalUsers,
        proUsersCount,
        currentUserEmail: req.user.email,
        currentUserRole: req.user.role,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Erro ao carregar métricas de admin:", err);
      res.status(500).json({ error: "Erro interno do servidor ao coletar métricas." });
    }
  });

  // API Routes
  // Proxy endpoints for Google Sheets and Drive to bypass ad-blockers and CORS in sandboxed iframe environment
  app.get("/api/proxy/sheets-meta", async (req, res) => {
    try {
      const { fileId } = req.query;
      const authHeader = req.headers.authorization;

      if (!fileId) {
        return res.status(400).json({ error: "Parâmetro fileId ausente." });
      }
      if (!authHeader) {
        return res.status(401).json({ error: "Token de autorização do Google ausente." });
      }

      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}`, {
        headers: { Authorization: authHeader }
      });

      if (!metaRes.ok) {
        const text = await metaRes.text();
        return res.status(metaRes.status).send(text);
      }

      const data = await metaRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("Erro no proxy de metadados do Google Sheets:", err);
      res.status(500).json({ error: err.message || "Erro interno no proxy." });
    }
  });

  app.get("/api/proxy/sheets-values", async (req, res) => {
    try {
      const { fileId, range } = req.query;
      const authHeader = req.headers.authorization;

      if (!fileId || !range) {
        return res.status(400).json({ error: "Parâmetros fileId ou range ausentes." });
      }
      if (!authHeader) {
        return res.status(401).json({ error: "Token de autorização do Google ausente." });
      }

      const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/${encodeURIComponent(range as string)}`, {
        headers: { Authorization: authHeader }
      });

      if (!valRes.ok) {
        const text = await valRes.text();
        return res.status(valRes.status).send(text);
      }

      const data = await valRes.json();
      res.json(data);
    } catch (err: any) {
      console.error("Erro no proxy de valores do Google Sheets:", err);
      res.status(500).json({ error: err.message || "Erro interno no proxy." });
    }
  });

  app.get("/api/proxy/drive-file-media", async (req, res) => {
    try {
      const { fileId } = req.query;
      const authHeader = req.headers.authorization;

      if (!fileId) {
        return res.status(400).json({ error: "Parâmetro fileId ausente." });
      }
      if (!authHeader) {
        return res.status(401).json({ error: "Token de autorização do Google ausente." });
      }

      const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: authHeader }
      });

      if (!fileRes.ok) {
        const text = await fileRes.text();
        return res.status(fileRes.status).send(text);
      }

      const text = await fileRes.text();
      res.send(text);
    } catch (err: any) {
      console.error("Erro no proxy de arquivo do Google Drive:", err);
      res.status(500).json({ error: err.message || "Erro interno no proxy." });
    }
  });

  app.post("/api/gemini/insights", async (req, res) => {
    try {
      const { dados, eixoX, eixoY } = req.body;
      
      if (!dados || !eixoX || !eixoY) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes para gerar insights." });
      }

      const prompt = `Você é um Analista de Dados sênior. 
Analise a relação entre o eixo X ("${eixoX}") e o eixo Y ("${eixoY}") com base nos dados agrupados fornecidos.
Forneça um JSON válido com o seguinte formato:
{
  "textoResumo": "Um resumo detalhado em português com destaques de performance, os maiores valores e pontos críticos. Você pode usar formatação markdown com negrito **texto**.",
  "novasRecomendacoes": ["Recomendação 1", "Recomendação 2", "Recomendação 3", "Recomendação 4"]
}

Dados: ${JSON.stringify(dados)}
Responda EXCLUSIVAMENTE com o JSON válido sem bloco de markdown \`\`\`json.`;

      const response = await generateContentWithRetryAndFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      res.json(JSON.parse(responseText));
    } catch (error) {
      console.error("Gemini Insights Error:", error);
      res.status(500).json({ error: "Falha ao gerar insights automáticos." });
    }
  });

  app.post("/api/analyze-trend", async (req, res) => {
    try {
      const { chartData, xKey, yKey } = req.body;
      
      if (!chartData || !xKey || !yKey) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes para previsão de tendência." });
      }

      const prompt = `Aja como um analista de dados. Com base nos seguintes dados históricos para '${xKey}' e '${yKey}', projete os próximos 3 pontos de dados com base na tendência.
Dados históricos: ${JSON.stringify(chartData)}
Retorne APENAS um array JSON válido contendo 3 objetos com as chaves "${xKey}" e "${yKey}". Certifique-se de que os valores de "${yKey}" sejam numéricos. Não inclua nenhuma formatação markdown como \`\`\`json.`;

      const response = await generateContentWithRetryAndFallback({
        model: process.env.ID_BOT_PLANILHAS || "gemini-3.5-flash",
        contents: prompt
      });

      let responseText = response.text || "[]";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const projectedData = JSON.parse(responseText);
      
      const projectedWithFlag = projectedData.map((item: any) => ({
        ...item,
        isProjection: true
      }));

      res.json({ projectedData: projectedWithFlag });
    } catch (error) {
      console.error("Trend Analysis Error:", error);
      res.status(500).json({ error: "Failed to generate trend analysis." });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { question, contextData } = req.body;
      
      if (!question || !contextData) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const systemPrompt = `Você é um Cientista de Dados Sênior e Engenheiro de Analytics especialista em visualização de dados.
Seu objetivo é analisar os dados fornecidos pelo usuário e responder à pergunta do chat de forma extremamente útil.

Se a pergunta do usuário solicitar uma comparação de subconjuntos, filtragem (ex: "vendas de SP e RJ"), ordenação/ranking (ex: "top 5 mais caros", "piores resultados", "maiores valores"), ou agregação de categorias específicas, você deve:
1. Realizar a filtragem, ordenação ou transformação adequada diretamente no conjunto de dados fornecido em 'contextData'.
2. Definir 'isFiltered' como true.
3. Retornar esse subconjunto ou dados transformados no campo 'filteredData' (que deve ser uma lista de objetos JSON representando as linhas selecionadas).
4. Indicar quais colunas devem ser usadas como eixos 'chartXKey' (geralmente textual/categoria) e 'chartYKey' (numérico/métrica) para plotar este novo subconjunto de forma perfeita no gráfico.

Se for uma pergunta genérica, teórica ou resumo geral que não requeira focar em uma fatia específica, defina 'isFiltered' como false e retorne o contextData original no 'filteredData'.

O retorno DEVE ser EXCLUSIVAMENTE um objeto JSON válido correspondente ao seguinte esquema TypeScript (não inclua tags de markdown como \`\`\`json ou texto adicional fora do JSON):
{
  "answer": string, // Resposta detalhada, amigável e profissional em português brasileiro (PT-BR) explicando o insight/resultado encontrado.
  "isFiltered": boolean, // true se houve filtragem/ranking/comparação específica e os dados devem atualizar o gráfico.
  "filteredData": Array<Record<string, any>>, // Lista de objetos contendo as linhas filtradas/transformadas resultantes da análise para atualização do gráfico.
  "chartXKey": string, // Nome da coluna sugerida para o Eixo X
  "chartYKey": string // Nome da coluna sugerida para o Eixo Y
}

DADOS DO CONJUNTO:
${JSON.stringify(contextData)}

PERGUNTA DO USUÁRIO:
${question}

Responda rigorosamente no formato JSON solicitado.`;

      const response = await generateContentWithRetryAndFallback({
        model: process.env.ID_BOT_PLANILHAS || "gemini-3.5-flash",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (err) {
        console.error("Erro ao analisar JSON retornado pelo Gemini:", responseText);
        parsedResponse = {
          answer: responseText.replace(/```json/g, "").replace(/```/g, "").trim(),
          isFiltered: false,
          filteredData: contextData,
          chartXKey: "",
          chartYKey: ""
        };
      }

      res.json(parsedResponse);
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Falha ao gerar resposta do chat." });
    }
  });

  app.post("/api/bi-assistant", async (req, res) => {
    try {
      const { question, columns, sampleRows } = req.body;
      
      if (!question || !columns) {
        return res.status(400).json({ error: "Missing required fields: question and columns" });
      }

      const systemPrompt = `Você é o assistente inteligente de inteligência artificial de um sistema de Business Intelligence avançado (similar ao Power BI e Qlik Sense).
Seu objetivo é analisar o comando ou pergunta do usuário em linguagem natural e traduzi-la em uma configuração estrita de gráfico com agrupamento para nosso frontend.

Você receberá:
- As colunas disponíveis na planilha atual: ${JSON.stringify(columns)}
- Uma pequena amostra de linhas dessa planilha (se houver): ${JSON.stringify(sampleRows || [])}

Sua tarefa é analisar a pergunta e retornar EXCLUSIVAMENTE um objeto JSON válido (sem caracteres extras ou marcações de bloco de código markdown) que represente as configurações ideais para plotar o gráfico.

Estrutura obrigatória do JSON de saída:
{
  "eixoX": "NomeExatoDaColunaX", // Deve ser uma das colunas disponíveis, idealmente categórica (texto, data, cidade, produto, vendedor, etc.)
  "eixoY": "NomeExatoDaColunaY", // Deve ser uma das colunas disponíveis, idealmente numérica (faturamento, quantidade, preço, lucro, etc.)
  "operacao": "Somar" ou "Média", // Operação matemática de agregação para aplicar nos valores da Coluna Y quando agrupados por Coluna X.
  "tipoGrafico": "Barras" ou "Linhas" ou "Área" ou "Pizza", // O tipo de gráfico visual mais adequado para esta representação.
  "filtro": { "coluna": "NomeDaColuna", "valor": "ValorASerFiltrado" } ou null, // Opcional. Se o usuário restringiu a análise (ex: "só em São Paulo" ou "do produto celular"), preencha com a coluna e o valor exatos correspondentes. Se não houver restrição, retorne null.
  "respostaTexto": "Uma mensagem curta, amigável e profissional em português brasileiro explicando o que você encontrou ou o gráfico que acabou de configurar para o usuário."
}

Exemplo de mapeamento inteligente:
- Se o usuário pedir "faturamento de São Paulo", eixoX deve ser a coluna que armazena cidades (ex: "Cidade"), eixoY deve ser "Faturamento", operacao deve ser "Somar", tipoGrafico "Barras", e filtro deve ser { "coluna": "Cidade", "valor": "São Paulo" }.
- Se o usuário pedir "média de quantidade de eletrônicos", eixoX deve ser "Produto" ou "Categoria", eixoY deve ser "Quantidade", operacao deve ser "Média", tipoGrafico "Barras", filtro { "coluna": "Categoria", "valor": "Eletrônicos" }.

Retorne APENAS o JSON bruto sem \`\`\`json ou texto ao redor.`;

      const response = await generateContentWithRetryAndFallback({
        model: process.env.ID_BOT_PLANILHAS || "gemini-3.5-flash",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (err) {
        console.error("Erro ao analisar JSON do assistente de BI:", responseText);
        parsedResponse = {
          eixoX: columns[0] || "",
          eixoY: columns[1] || "",
          operacao: "Somar",
          tipoGrafico: "Barras",
          filtro: null,
          respostaTexto: responseText.replace(/```json/g, "").replace(/```/g, "").trim()
        };
      }

      res.json(parsedResponse);
    } catch (error) {
      console.error("BI Assistant Error:", error);
      res.status(500).json({ error: "Falha ao processar comando de voz/texto da IA." });
    }
  });

  // Simulação de WhatsApp Bot via Gemini
  app.post("/api/simulate-bot", async (req, res) => {
    try {
      const { niche, channel, voice, goal } = req.body;

      if (!niche || !channel || !voice || !goal) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes para simulação de bot." });
      }

      const prompt = `Você é uma Inteligência Artificial configurada como um especialista de Atendimento e Vendas para WhatsApp e Instagram Direct.
Seu objetivo é gerar um roteiro de fluxo conversacional personalizado baseado nas escolhas do usuário.

Parâmetros recebidos:
- Nicho da Empresa: "${niche}"
- Canal de Entrada: "${channel}"
- Tom de Voz da IA: "${voice}"
- Objetivo Principal: "${goal}"

Sua tarefa é retornar obrigatoriamente um objeto JSON com o seguinte formato:
{
  "copyText": "Texto explicativo curto sobre a estratégia do Bot (com emojis e formatação profissional de WhatsApp em negrito). Use até 3 frases.",
  "flow": [
    { "step": "1. [Nome do Passo]", "desc": "[Texto simulando o que a IA diria neste passo]" },
    { "step": "2. [Nome do Passo]", "desc": "[Texto simulando o que a IA diria neste passo]" },
    { "step": "3. [Nome do Passo]", "desc": "[Texto simulando o que a IA diria neste passo]" },
    { "step": "4. [Nome do Passo]", "desc": "[Texto simulando o que a IA diria neste passo]" }
  ]
}

Responda em português brasileiro (PT-BR) exclusivamente com o JSON válido. Não inclua marcas de bloco de código como \`\`\`json ou explicações externas.`;

      const response = await generateContentWithRetryAndFallback({
        model: process.env.ID_BOT_WHATSAPP || "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
      } catch (err) {
        console.error("Erro ao analisar JSON do assistente de bot:", responseText);
        parsedResponse = {
          copyText: "💡 *Roteiro de Atendimento Inteligente* (Tom: " + voice + ")\n• Canal: " + channel + "\n• Foco: " + goal,
          flow: [
            { step: "1. Saudação", desc: "Olá! Seja muito bem-vindo. Como posso te ajudar hoje?" },
            { step: "2. Qualificação", desc: "Para te dar o atendimento perfeito, qual o seu principal objetivo?" },
            { step: "3. Solução", desc: "Perfeito! Recomendamos nosso plano Pro. Clique no link para assinar." },
            { step: "4. Fechamento", desc: "Perfeito, sua assinatura foi gerada! Qualquer dúvida, estamos aqui." }
          ]
        };
      }

      res.json(parsedResponse);
    } catch (error: any) {
      console.error("Simulate Bot Error:", error);
      res.status(500).json({ error: "Falha ao simular bot: " + (error.message || error) });
    }
  });

  // Simulação de Marketing Copy via Gemini
  app.post("/api/simulate-marketing", async (req, res) => {
    try {
      const { product, description, audience, hook } = req.body;

      if (!product || !description || !audience || !hook) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes para geração de copy de marketing." });
      }

      const prompt = `Você é uma Inteligência Artificial configurada como um Copywriter Sênior e Especialista em Marketing Digital.
Seu objetivo é gerar uma copy altamente persuasiva e uma ideia de criativo/design para anúncios de tráfego pago (Facebook/Google Ads).

Parâmetros recebidos:
- Nome do Produto: "${product}"
- O que o Produto faz (Descrição): "${description}"
- Público-Alvo: "${audience}"
- Fórmula / Gancho de Copywriting: "${hook}"

Sua tarefa é retornar obrigatoriamente um objeto JSON com o seguinte formato:
{
  "headline": "Uma headline matadora e chamativa para o anúncio",
  "primaryText": "O texto principal do anúncio estruturado seguindo rigorosamente a fórmula escolhida (${hook}). Use quebras de linha e emojis de forma profissional.",
  "description": "Uma descrição curta para o rodapé do anúncio",
  "cta": "O texto do botão de chamada para ação (ex: Saiba Mais, Quero Garantir)",
  "imageSuggestion": "Uma sugestão detalhada e criativa de imagem ou vídeo que o designer deve criar para acompanhar esta copy"
}

Responda em português brasileiro (PT-BR) exclusivamente com o JSON válido. Não inclua marcas de bloco de código como \`\`\`json ou explicações externas.`;

      const response = await generateContentWithRetryAndFallback({
        model: process.env.ID_BOT_MARKETING || "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
      } catch (err) {
        console.error("Erro ao analisar JSON do assistente de marketing:", responseText);
        parsedResponse = {
          headline: `🔥 Atenção: Transforme sua empresa com ${product}!`,
          primaryText: `Você quer resolver seus problemas hoje?\n\n[PROBLEMA] Ficar preso em processos manuais consome tempo e dinheiro.\n[AGITAÇÃO] Enquanto isso, seus concorrentes usam inteligência artificial.\n[SOLUÇÃO] Descubra o poder de ${product}: ${description}.`,
          description: `Garanta agora o seu acesso!`,
          cta: `Saiba Mais`,
          imageSuggestion: `Imagem minimalista e futurista contrastando tons escuros com neon ciano.`
        };
      }

      res.json(parsedResponse);
    } catch (error: any) {
      console.error("Simulate Marketing Error:", error);
      res.status(500).json({ error: "Falha ao gerar copy de marketing: " + (error.message || error) });
    }
  });

  app.post("/api/upload", (req, res, next) => {
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "O tamanho do arquivo excede o limite máximo permitido de 10MB." });
        }
        return res.status(400).json({ error: err.message || "Falha no upload do arquivo." });
      }
      next();
    });
  }, async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      // Autenticar token se fornecido no header Authorization
      const authHeader = req.headers.authorization;
      let uid = "";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.split("Bearer ")[1];
        if (getApps().length) {
          try {
            const decodedToken = await getAuth().verifyIdToken(idToken);
            uid = decodedToken.uid;
          } catch (tokenErr) {
            console.error("Erro ao verificar token no upload:", tokenErr);
          }
        }
      }

      // Validar quota no backend para usuários gratuitos antes de continuar processando o arquivo
      let newQuotaUsed = 0;
      if (uid && db) {
        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();
        let currentQuota = 0;
        let plan = "free";
        if (userDoc.exists) {
          const userData = userDoc.data();
          currentQuota = userData?.quotaUsed || 0;
          plan = userData?.plan || "free";
        }

        if (plan === "free" && currentQuota >= 5) { // 5 is FREE_QUOTA_LIMIT
          return res.status(403).json({ error: "Você atingiu o limite de 5 relatórios do plano gratuito. Faça upgrade para o PRO." });
        }

        newQuotaUsed = currentQuota + 1;
        await userRef.set({ quotaUsed: newQuotaUsed }, { merge: true });
      }

      const originalName = req.file.originalname || "";
      const isExcel = originalName.endsWith(".xlsx") || originalName.endsWith(".xls");

      let rawHeaders: string[] = [];
      let rawData: any[] = [];

      if (isExcel) {
        try {
          const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            return res.status(400).json({ error: "O arquivo Excel não possui planilhas." });
          }
          const worksheet = workbook.Sheets[sheetName];
          const sheetJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
          if (!sheetJson.length) {
            return res.status(400).json({ error: "A planilha selecionada está vazia." });
          }
          rawData = sheetJson;
          rawHeaders = Object.keys(sheetJson[0] || {});
        } catch (excelErr: any) {
          console.error("Excel parse error:", excelErr);
          return res.status(400).json({ error: "Falha ao processar o arquivo Excel: " + excelErr.message });
        }
      } else {
        const fileContent = req.file.buffer.toString("utf-8");
        const results = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true, // Automatically converts standard numbers/booleans
          skipEmptyLines: true,
        });

        if (results.errors.length && !results.data.length) {
          return res.status(400).json({ error: "Falha ao processar o arquivo CSV", details: results.errors });
        }

        rawData = results.data;
        if (!rawData.length) {
          return res.status(400).json({ error: "O arquivo CSV está vazio." });
        }
        rawHeaders = results.meta.fields || Object.keys(rawData[0] || {});
      }

      // Clean up headers and rows to remove whitespace/quotes from keys and values
      const headers = rawHeaders.map(h => h.trim().replace(/^["']|["']$/g, ""));

      let data = rawData.map(row => {
        const cleanedRow: Record<string, any> = {};
        Object.entries(row).forEach(([key, val]) => {
          const cleanedKey = key.trim().replace(/^["']|["']$/g, "");
          let cleanedVal = val;
          if (typeof val === 'string') {
            cleanedVal = val.trim().replace(/^["']|["']$/g, "");
          }
          cleanedRow[cleanedKey] = cleanedVal;
        });
        return cleanedRow;
      });

      // Pré-processamento: Identificação e conversão de tipos de dados
      const columnTypes: Record<string, string> = {};
      
      headers.forEach(header => {
        const sampleValues = data.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
        if (sampleValues.length === 0) {
          columnTypes[header] = 'unknown';
          return;
        }

        // Try to see if this column is predominantly numeric
        let numericCount = 0;
        sampleValues.forEach(val => {
          if (tryParseNumber(val) !== null) {
            numericCount++;
          }
        });

        // If more than 60% of non-empty values are numeric, convert the column
        const isNumericColumn = (numericCount / sampleValues.length) >= 0.6;

        if (isNumericColumn) {
          columnTypes[header] = 'number';
          // Convert values in the original data to actual numbers
          data.forEach(row => {
            const rawVal = row[header];
            if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
              const num = tryParseNumber(rawVal);
              row[header] = num !== null ? num : 0;
            } else {
              row[header] = null;
            }
          });
        } else {
          // Check if it is boolean
          let booleanCount = 0;
          sampleValues.forEach(val => {
            const s = String(val).toLowerCase().trim();
            if (typeof val === 'boolean' || s === 'true' || s === 'false' || s === 'sim' || s === 'não' || s === 'nao') {
              booleanCount++;
            }
          });

          if ((booleanCount / sampleValues.length) >= 0.6) {
            columnTypes[header] = 'boolean';
            // Convert values to booleans
            data.forEach(row => {
              const rawVal = row[header];
              if (rawVal === null || rawVal === undefined || rawVal === '') {
                row[header] = null;
              } else {
                const s = String(rawVal).toLowerCase().trim();
                row[header] = (s === 'true' || s === 'sim' || rawVal === true);
              }
            });
          } else {
            // Check if it is a date column
            let dateCount = 0;
            sampleValues.forEach(val => {
              const strVal = String(val).trim();
              const dateParse = Date.parse(strVal);
              const isDateRegex = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}|^\d{2}-\d{2}-\d{4}/.test(strVal);
              if (!isNaN(dateParse) && isDateRegex) {
                dateCount++;
              }
            });

            if ((dateCount / sampleValues.length) >= 0.5) {
              columnTypes[header] = 'date';
            } else {
              columnTypes[header] = 'string';
            }
          }
        }
      });

      // Validação: Garantir que existam colunas para gráficos (pelo menos 1 dimensão e 1 métrica)
      const hasMetric = Object.values(columnTypes).includes('number');
      const hasDimension = Object.values(columnTypes).includes('string') || Object.values(columnTypes).includes('date');
      
      if (!hasMetric || !hasDimension) {
         return res.status(400).json({ 
            error: "Validação falhou. O arquivo deve conter pelo menos uma coluna de texto/data (dimensão) e uma coluna numérica (métrica) para gerarmos gráficos." 
         });
      }

      // Generate a quick AI insight based on headers and first few rows
      let insight = "Os insights aparecerão aqui.";
      try {
        const dataSample = data.slice(0, 3);
        const prompt = `Aja como um analista de dados sênior. Você recebeu um conjunto de dados com as seguintes colunas e tipos: ${JSON.stringify(columnTypes)}. 
Aqui estão as primeiras 3 linhas: ${JSON.stringify(dataSample)}. 
Escreva um resumo curto e engajador de exatamente 2 frases (em português brasileiro, PT-BR) sobre o que esses dados parecem tratar e que tipo de insights podem ser extraídos. Seja profissional.`;
        
        const response = await generateContentWithRetryAndFallback({
          model: process.env.ID_BOT_PLANILHAS || "gemini-3.5-flash",
          contents: prompt
        });
        insight = response.text || insight;
      } catch (aiError) {
        console.error("AI Insight Error:", aiError);
        insight = "Não foi possível gerar os insights da IA no momento devido a um erro.";
      }

      // We return top 50 rows for performance in UI for this MVP
      return res.json({
        headers,
        columnTypes,
        totalRows: data.length,
        sampleData: data.slice(0, 50),
        insight,
        quotaUsed: newQuotaUsed > 0 ? newQuotaUsed : undefined,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor ao processar a planilha." });
    }
  });

  // ==========================================
  // WHATSAPP API & GEMINI RESPONDER ENGINE (PROXY PARA CLOUD RUN)
  // ==========================================
  
  const CHATBOT_API_URL = process.env.CHATBOT_API_URL || "https://chatbot-v2-240342026700.us-central1.run.app";

  // Endpoint de status da sessão do WhatsApp (Proxy)
  app.get("/api/whatsapp/session", async (req, res) => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/api/whatsapp/session`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      // Se falhar no Cloud Run, retorna estado desconectado amigável
      res.json({ status: 'DISCONNECTED', qrCode: null, connectedAt: null, phoneNumber: null, chats: {} });
    } catch (err) {
      res.json({ status: 'DISCONNECTED', qrCode: null, connectedAt: null, phoneNumber: null, chats: {} });
    }
  });

  // A rota '/get-qr' que retorna o QR Code da API real ou inicia se desconectada
  app.get("/get-qr", async (req, res) => {
    try {
      // No Cloud Run, o QR Code é exposto na rota de sessão ou similar
      const response = await fetch(`${CHATBOT_API_URL}/api/whatsapp/session`);
      if (response.ok) {
        const data = await response.json();
        return res.json({
          qr: data.qrCode || data.qr,
          qrCode: data.qrCode || data.qr,
          status: data.status
        });
      }
      res.json({ qr: null, qrCode: null, status: 'DISCONNECTED' });
    } catch (err) {
      res.json({ qr: null, qrCode: null, status: 'DISCONNECTED' });
    }
  });

  // Iniciar processo de conexão real
  app.post("/api/whatsapp/connect", async (req, res) => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/api/whatsapp/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro de conexão com o serviço de chatbot." });
    }
  });

  // Simular scan (caso queira simular localmente mas persistir ou espelhar a requisição)
  app.post("/api/whatsapp/simulate-scan", async (req, res) => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/api/whatsapp/simulate-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro de simulação no serviço de chatbot." });
    }
  });

  // Desconectar sessão real
  app.post("/api/whatsapp/disconnect", async (req, res) => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/api/whatsapp/disconnect`, {
        method: "POST"
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro ao desconectar no serviço de chatbot." });
    }
  });

  // Processar Webhook Simulator integrado ao Cloud Run
  app.post("/api/whatsapp/webhook-simulate", async (req, res) => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/api/whatsapp/webhook-simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      // Fallback para simulação local caso o Cloud Run esteja offline ou a rota de simulação falhe
      try {
        const { message, botConfig } = req.body;
        const bot = botConfig || {
          name: "Vendas WhatsApp - E-commerce",
          niche: "E-commerce",
          voice: "Persuasivo",
          goal: "Recuperação de carrinho abandonado e conversão de Pix",
          instructions: "Você é um assistente de vendas da loja Foco em Dados."
        };
        const systemPrompt = `Você é um Robô de Atendimento com IA. Nova mensagem do cliente: "${message}". Responda de forma persuasiva para cumprir: ${bot.goal}`;
        const responseAI = await generateContentWithRetryAndFallback({
          model: "gemini-3.5-flash",
          contents: systemPrompt
        });
        return res.json({
          success: true,
          reply: responseAI.text || "Entendido! Estou processando seu atendimento.",
          history: [],
          session: { status: "CONNECTED" }
        });
      } catch (innerErr: any) {
        res.status(500).json({ error: innerErr.message || "Erro ao processar simulação." });
      }
    }
  });

  // ROTA GET '/' que responde com JSON { status: "online", bot: "aguardando_conexao" } para checagem/uptime de saúde
  app.get("/", (req, res, next) => {
    // Se o cliente explicitamente solicita JSON ou se for uma rota de checagem automatizada (ex: com query ou Accept JSON)
    if (req.headers.accept && req.headers.accept.includes("application/json") || req.query.json === "true") {
      return res.json({ status: "online", bot: "aguardando_conexao" });
    }
    // Caso contrário, continua para renderizar o front-end em React (Vite/Static files)
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}

startServer();
