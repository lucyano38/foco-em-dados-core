# 🚀 Guia Completo de Deploy no Google Cloud Run

## ✅ O QUE FOI CORRIGIDO

Aplicamos 5 correções críticas no seu repositório:

1. ✅ **Secrets agora ocultos** - `.env` atualizado com placeholders seguros
2. ✅ **Dockerfile corrigido** - Injeta variáveis de build corretamente
3. ✅ **Vite config ajustado** - Alias `@` aponta para `./src/` corretamente
4. ✅ **Cloud Build com Secret Manager** - Injeta secrets de forma segura
5. ✅ **`DISABLE_GCP_GEMINI_API=false`** - IA ativa em produção

---

## 🔐 PASSO 1: OCULTAR SUAS CHAVES ATUAIS NO GCP

Você quer manter as chaves que já funcionam. Vamos ocultá-las no Google Cloud Secret Manager:

```bash
# Faça login no Google Cloud
gcloud auth login
gcloud config set project appcuidador-23628

# Crie um secret para CADA chave existente

# 1. Gemini API Key
echo "AQ.Ab8RN6JNN9qkTJay_1EbrukxS5R0J91FBriAcOYK4TDBfJeI_A" | \
  gcloud secrets create gemini-api-key --data-file=-

# 2. Google Places API Key
gcloud secrets create google-places-api-key --data-file=-
# (Cole sua chave quando solicitado)

# 3. Resend API Key
gcloud secrets create resend-api-key --data-file=-

# 4. Instagram Access Token
echo "your-instagram-token-here" | \
  gcloud secrets create instagram-access-token --data-file=-

# 5. Instagram Business Account ID
echo "your-instagram-id-here" | \
  gcloud secrets create instagram-business-account-id --data-file=-

# 6. Stripe Secret Key (LIVE)
echo "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" | \
  gcloud secrets create stripe-secret-key --data-file=-

# 7. Stripe Webhook Secret
echo "your-stripe-webhook-secret-here" | \
  gcloud secrets create stripe-webhook-secret --data-file=-

# 8. Stripe Publishable Key
echo "your-stripe-publishable-key-here" | \
  gcloud secrets create vite-stripe-publishable-key --data-file=-

# 9. Supabase URL
echo "https://ioijbixifvbosythznhh.supabase.co" | \
  gcloud secrets create vite-supabase-url --data-file=-

# 10. Supabase Anon Key
echo "your-supabase-anon-key-here" | \
  gcloud secrets create vite-supabase-anon-key --data-file=-

# 11. Supabase Service Role Key
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | \
  gcloud secrets create supabase-service-role-key --data-file=-

# 12. Telegram Bot Token
echo "8716515024:AAH_IpZRBhHjZWCIvMoV-N7LJ6LXnu_ZEE8" | \
  gcloud secrets create telegram-bot-token --data-file=-

# 13. GitHub Token
echo "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" | \
  gcloud secrets create github-token --data-file=-

# 14. OpenRouter API Key
echo "Sk-or-v1-6392542680c49484254d95c61b10c79679315a8e7594b35ecd1d58ea06a0df44" | \
  gcloud secrets create openrouter-api-key --data-file=-

# 15. Nano Banana API Key
echo "92048202-3d58-4856-bd52-8df5aae1be29:c3a2d18c2e334ceff8f327c8800cacd7" | \
  gcloud secrets create nano-banana-api-key --data-file=-

# Verifique se todos foram criados
gcloud secrets list
```

---

## 🔓 PASSO 2: CONCEDER PERMISSÕES AO CLOUD BUILD

```bash
# Obtém o PROJECT NUMBER
PROJECT_ID="appcuidador-23628"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Concede acesso ao Cloud Build Service Account para TODOS os secrets
for secret in \
  gemini-api-key \
  google-places-api-key \
  resend-api-key \
  instagram-access-token \
  instagram-business-account-id \
  stripe-secret-key \
  stripe-webhook-secret \
  vite-stripe-publishable-key \
  vite-supabase-url \
  vite-supabase-anon-key \
  supabase-service-role-key \
  telegram-bot-token \
  github-token \
  openrouter-api-key \
  nano-banana-api-key; do
  
  echo "🔓 Concedendo acesso a: $secret"
  gcloud secrets add-iam-policy-binding $secret \
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
done

echo "✅ Permissões concedidas!"
```

---

## ✅ PASSO 3: ATIVAR APIS NECESSÁRIAS

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

echo "✅ APIs ativadas!"
```

---

## 🚀 PASSO 4: PRIMEIRO DEPLOY MANUAL

```bash
# Clone seu repo (se necessário)
cd ~/seu-diretório
git clone https://github.com/lucyano38/foco-em-dados-core
cd foco-em-dados-core

# Confirme que .env tem placeholders
cat .env | head -5

# Commit as mudanças
git add .
git commit -m "🔐 Secure secrets with GCP Secret Manager integration"
git push

# Trigger o build no Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Monitore o progresso em tempo real
BUILD_ID=$(gcloud builds list --limit=1 --format='value(id)')
gcloud builds log $BUILD_ID --stream
```

---

## ✅ PASSO 5: VERIFICAR DEPLOY EM PRODUÇÃO

```bash
# Veja os serviços no Cloud Run
gcloud run services list --region=us-west1

# Obtenha a URL de seu serviço
SERVICE_URL=$(gcloud run services describe foco-completo \
  --region=us-west1 --format='value(status.url)')

echo "🌐 Seu site está em: $SERVICE_URL"

# Teste a URL
curl $SERVICE_URL

# Veja logs em tempo real
gcloud run services logs read foco-completo --region=us-west1 --limit=50 --follow
```

---

## 🔧 PASSO 6: CONFIGURAR CI/CD AUTOMÁTICO (OPCIONAL)

Se quiser deploy automático a cada push:

```bash
# Via Google Cloud Console (mais fácil):
# 1. Vá para https://console.cloud.google.com/cloud-build/triggers
# 2. Clique em "Create Trigger"
# 3. Conecte seu repositório GitHub
# 4. Configure:
#    - Trigger type: Push to branch
#    - Branch: ^main$
#    - Build config file location: cloudbuild.yaml
# 5. Clique em Create

# OU via CLI:
gcloud builds create --repo-name=foco-em-dados-core \
  --repo-owner=lucyano38 \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml \
  --description="Auto-deploy on push to main"
```

---

## 🛡️ PASSO 7: PROTEGER SEUS SECRETS

```bash
# Verifique que ninguém acessa os secrets sem autorização
gcloud secrets get-iam-policy gemini-api-key

# Se quiser revogar acesso:
# gcloud secrets remove-iam-policy-binding gemini-api-key \
#   --member=user:someone@example.com \
#   --role=roles/secretmanager.secretAccessor

# Audit log de quem acessou
gcloud logging read "resource.type=secretmanager.googleapis.com" \
  --limit=20 --format=json
```

---

## 📊 MONITORAMENTO CONTÍNUO

```bash
# Ver status do serviço
gcloud run services describe foco-completo \
  --region=us-west1 --format='value(status)'

# Ver métricas
gcloud monitoring metrics list --filter="metric.type:run/*"

# Ver erros recentes
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=10

# Criar alerta (opcional)
# Via Console: Monitoring → Alerting → Create Policy
```

---

## 🔄 ROTINA DE MANUTENÇÃO

### A cada 30 dias:
```bash
# Revise os logs de acesso aos secrets
gcloud logging read "protoPayload.resourceName:secretmanager" \
  --format=json | jq '.[] | {timestamp: .timestamp, user: .protoPayload.authenticationInfo.principalEmail}'
```

### A cada 90 dias (recomendado):
```bash
# Considere renovar os secrets (crie novos e atualize no GCP)
# Isso é opcional - você só precisa fazer se suspeitar de vazamento
```

---

## ⚠️ TROUBLESHOOTING

### Problema: "Build failed: permission denied"
```bash
# Solução: Certifique-se que o Cloud Build tem acesso aos secrets
PROJECT_NUMBER=$(gcloud projects describe appcuidador-23628 --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### Problema: "Cloud Run container exits with status 1"
```bash
# Veja os logs
gcloud run services logs read foco-completo --region=us-west1 --limit=50

# Tipicamente: .env não foi injetado corretamente
# Solução: Verifique se cloudbuild.yaml está correto
```

### Problema: ".env file not found"
```bash
# O Dockerfile precisa de .env durante o build
# Solução: Verifique se a etapa "Create-Env" do cloudbuild.yaml rodou com sucesso
gcloud builds log <BUILD_ID>
```

---

## 🎯 RESUMO DO QUE VOCÊ TEM AGORA

✅ Secrets ocultos em `.env` (apenas placeholders)  
✅ Chaves reais seguras no Google Cloud Secret Manager  
✅ Deploy automático sem expor dados  
✅ Cloud Build injeta secrets durante o build  
✅ Dockerfile compila Vite com as variáveis corretas  
✅ Cloud Run roda com Gemini IA ativa (`DISABLE_GCP_GEMINI_API=false`)  
✅ URL pública: `https://foco-completo-xxxxx.a.run.app`  

---

## 📞 PRÓXIMAS ETAPAS

1. **Execute os passos 1-2** para criar e proteger os secrets
2. **Execute o passo 3** para ativar as APIs
3. **Faça um push** para disparar o build automático (passo 4)
4. **Teste a URL** que aparecerá no Cloud Run (passo 5)
5. **(Opcional) Configure CI/CD automático** (passo 6)

Você está pronto para produção segura! 🎉
