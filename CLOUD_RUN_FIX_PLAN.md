# 🚀 PLANO DE AÇÃO INTEGRADO - CORRIGIR FOCO-EM-DADOS-CORE
## Baseado no Diagnóstico do Google Cloud + Análise Copilot

---

## 📋 O QUE ESTÁ QUEBRADO AGORA

### 1️⃣ LAYOUT QUEBRADO NO CLOUD RUN (foco-completo)
- **Sintoma**: Site abre mas está sem estilo CSS, sem dados do Supabase
- **Causa Raiz**: Variáveis Vite (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) não foram passadas no build
- **Por quê**: Dockerfile antigo não recebia `--build-arg` do Cloud Build

### 2️⃣ BACKEND/HERMES/N8N PAROU EM FOCOEMDADOS.COM.BR
- **Sintoma**: Agente autônomo não funciona, webhooks retornam erro
- **Causa Raiz**: Secrets não estão setados no Cloud Run (apenas ADMIN_PASSWORD e GEMINI_API_KEY)
- **Por quê**: Quando você removeu `.env` do GitHub (certo!), o Cloud Run perdeu todas as variáveis

### 3️⃣ CSS E JAVASCRIPT QUEBRADOS
- **Sintoma**: Página em branco ou com erros de console 404
- **Causa Raiz**: Build do Vite sem `VITE_STRIPE_PUBLISHABLE_KEY` gera bundle incompleto
- **Por quê**: Vite é um build-time framework, precisa dessas variáveis durante `npm run build`

---

## ✅ SOLUÇÃO EM 3 PASSOS

### PASSO 1: ATUALIZAR DOCKERFILE
**Arquivo:** `Dockerfile`
```dockerfile
# Adicione ANTES de "RUN npm run build":

ARG VITE_SUPABASE_URL=https://ioijbixifvbosythznhh.supabase.co
ARG VITE_SUPABASE_ANON_KEY=placeholder
ARG VITE_STRIPE_PUBLISHABLE_KEY=pk_live_placeholder

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

RUN npm run build
```

**Status**: ✅ Já aplicado acima

---

### PASSO 2: ATUALIZAR CLOUDBUILD.YAML
**Arquivo:** `cloudbuild.yaml`
```yaml
# Na etapa "Build", adicione:

- name: 'gcr.io/cloud-builders/docker'
  args: 
    - 'build'
    - '--build-arg=VITE_SUPABASE_URL=${_VITE_SUPABASE_URL}'
    - '--build-arg=VITE_SUPABASE_ANON_KEY=${_VITE_SUPABASE_ANON_KEY}'
    - '--build-arg=VITE_STRIPE_PUBLISHABLE_KEY=${_VITE_STRIPE_PUBLISHABLE_KEY}'
    # ... resto dos args
```

**Na etapa "Deploy", adicione TODAS as variáveis de runtime:**
```yaml
- '--set-env-vars=GEMINI_API_KEY=${_GEMINI_API_KEY},STRIPE_SECRET_KEY=${_STRIPE_SECRET_KEY},SUPABASE_SERVICE_ROLE_KEY=${_SUPABASE_SERVICE_ROLE_KEY},TELEGRAM_BOT_TOKEN=${_TELEGRAM_BOT_TOKEN},DISABLE_GCP_GEMINI_API=false,...'
```

**Status**: ✅ Já aplicado acima

---

### PASSO 3: EXECUTAR O DEPLOY
```bash
# 1. Navegue até seu projeto
cd ~/seu-caminho/foco-em-dados-core

# 2. Commit as mudanças
git add Dockerfile cloudbuild.yaml
git commit -m "🐳 Fix: Pass Vite build args and set all runtime env vars"
git push

# 3. Isso dispara Cloud Build automaticamente
# Aguarde ~10-15 minutos

# 4. Verifique o status
gcloud builds list --limit=5
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)') --stream

# 5. Teste a URL
curl https://foco-completo-xxxxx.a.run.app
# Ou abra no navegador (Limpe cache: Ctrl+F5)
```

---

## 🔍 ENTENDA O PROBLEMA TÉCNICO

### Por que Vite é diferente?

**Outras frameworks (Express, Django, Rails):**
```
Runtime ENV: Você pode ler variáveis a qualquer hora
.env → NODE_ENV → Runtime → Pode mudar entre deploys
```

**Vite (Frontend Build Tool):**
```
Build-time ENV: Variáveis viram hardcoded no JavaScript
npm run build + VITE_VAR=valor → JavaScript gerado já tem o valor
Depois de compilado, não pode mudar sem novo build
```

### O Ciclo Correto:

```
1. Cloud Build lê secrets do GCP Secret Manager
2. Cloud Build passa --build-arg para Docker
3. Docker recebe como ENV durante npm run build
4. Vite injeta no JavaScript (hardcoded)
5. Docker push imagem
6. Cloud Run inicia container
7. Servidor Node lê OUTRAS variáveis (Stripe, Telegram, etc)
8. Frontend JS já tem URLs corretas
```

---

## 🔧 RESOLVER O .ENV PROBLEM

### Por que ".env" é um problema:

```
Antes (❌ Problema):
.env no GitHub
    ↓
Qualquer pessoa vê todos os secrets
    ↓
Risk: Stripe charges, bot spam, etc

Depois (✅ Correto):
.env no GCP Secret Manager
    ↓
Só Cloud Build acessa (com permissões IAM)
    ↓
Cloud Build injeta em tempo de build
    ↓
Safe: Secrets nunca viajam pelo GitHub
```

### Seu .env agora deve ter:
```dotenv
# Comentar/remover todas as chaves reais
GEMINI_API_KEY=placeholder_in_gcp_secret_manager
STRIPE_SECRET_KEY=sk_live_placeholder_in_gcp
TELEGRAM_BOT_TOKEN=placeholder_in_gcp
# etc
```

---

## ✨ CHECKLIST DE EXECUÇÃO

### ☑️ Pré-Requisitos
- [x] Dockerfile atualizado com ARG VITE_*
- [x] cloudbuild.yaml atualizado com --build-arg e --set-env-vars
- [x] .env com placeholders (não secrets reais)

### ☑️ Deployment
- [ ] `git add . && git commit && git push`
- [ ] Aguardar Cloud Build terminar
- [ ] Limpar cache do navegador (Ctrl+F5)
- [ ] Testar: https://foco-completo-xxxxx.a.run.app
- [ ] Verificar console do navegador (F12) - não deve ter erros

### ☑️ Validação
- [ ] Frontend carrega com CSS correto
- [ ] Supabase auth funciona
- [ ] Stripe checkout carrega
- [ ] Hermes/n8n responde em focoemdados.com.br
- [ ] Logs não mostram "VITE_SUPABASE_URL=undefined"

### ☑️ Pós-Deploy
- [ ] Monitorar logs: `gcloud run services logs read foco-completo --region=us-west1 --follow`
- [ ] Testar endpoints: `/api/admin/metrics`, `/api/chat`, etc
- [ ] Confirmar Telegram/Stripe webhooks recebem dados

---

## 🚨 SE AINDA NÃO FUNCIONAR

### Problema: CSS/JS ainda quebrado
```bash
# 1. Limpe o cache do Docker no Cloud Build
gcloud builds list --filter="status=FAILURE" --limit=5

# 2. Veja os logs do build
gcloud builds log <BUILD_ID>

# 3. Procure por erro tipo:
# "VITE_SUPABASE_URL is undefined"
# Isso significa --build-arg não foi passado

# 4. Force um novo build (sem cache)
gcloud builds submit --config=cloudbuild.yaml --no-cache
```

### Problema: Backend sem conectar a Stripe/Telegram
```bash
# Verifique as env vars no Cloud Run
gcloud run services describe foco-completo --region=us-west1 \
  --format='value(spec.template.spec.containers[0].env[*])'

# Se faltam variáveis, execute manualmente:
gcloud run services update foco-completo --region=us-west1 \
  --set-env-vars="STRIPE_SECRET_KEY=<sua-chave>,TELEGRAM_BOT_TOKEN=<seu-token>"
```

### Problema: "Cannot find module @/components"
```bash
# Significa que o alias @ está quebrado
# Você corrigiu vite.config.ts?
# Verifique se aponta para ./src/:

alias: {
  '@': path.resolve(__dirname, './src')  // ✅ Correto
}

# Se ainda quebrar, force rebuild:
npm run clean && npm run build
git add . && git commit -m "fix: rebuild" && git push
```

---

## 📊 RESUMO TÉCNICO

| Componente | Tipo | Onde | Como |
|-----------|------|------|------|
| `VITE_SUPABASE_URL` | Build-time | Frontend JS | `--build-arg` no Docker |
| `STRIPE_SECRET_KEY` | Runtime | Backend Node | `--set-env-vars` no Cloud Run |
| `TELEGRAM_BOT_TOKEN` | Runtime | Backend Node | Secret Manager → `--set-env-vars` |
| `DISABLE_GCP_GEMINI_API` | Runtime | Backend Node | Hardcoded como `false` |

---

## 🎯 PRÓXIMAS AÇÕES

1. **Imediato** (hoje):
   - [ ] Git push das mudanças
   - [ ] Aguardar deploy
   - [ ] Testar URL

2. **Curto prazo** (esta semana):
   - [ ] Validar todos os endpoints
   - [ ] Testar webhooks
   - [ ] Monitorar logs

3. **Médio prazo** (este mês):
   - [ ] Configurar CI/CD automático
   - [ ] Setup alertas no Monitoring
   - [ ] Documentar processo

---

## 📞 SUPORTE

Se algo não funcionar, copie e cole aqui:
```bash
# 1. Verifique status do build
gcloud builds list --limit=1

# 2. Verifique logs do build
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')

# 3. Verifique logs do Cloud Run
gcloud run services logs read foco-completo --region=us-west1 --limit=100

# 4. Verifique env vars do Cloud Run
gcloud run services describe foco-completo --region=us-west1 --format=json | jq '.spec.template.spec.containers[0].env'
```

**Status**: ✅ **PRONTO PARA DEPLOY**

Os arquivos Dockerfile e cloudbuild.yaml foram corrigidos.
Faça push e aguarde o Cloud Build terminar (~10-15 min).
Seu site voltará a funcionar com layout, dados e integrações! 🚀
