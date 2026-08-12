# WAHA Plus sem Docker — Setup Alpine Linux

Guia de execução do WAHA (WhatsApp HTTP API — Plus) diretamente no Alpine
Linux, sem Docker, integrado ao n8n e ao Hermes Agent.

## 1. Dependências de sistema (Chromium para o Puppeteer)

```bash
apk update
apk add nodejs npm chromium nss freetype harfbuzz ca-certificates ttf-freefont

# O Puppeteer precisa saber onde está o Chromium
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 2. Projeto WAHA

```bash
mkdir -p ~/waha-app
cd ~/waha-app
npm init -y
npm install @devlikeapro/waha
```

> **Importante:** o pacote `@devlikeapro/waha` **não existe no registro público
> do npm** (`404 Not Found`). Ele é distribuído apenas via imagem Docker
> (`devlikeapro/waha-plus`) ou do registry privado do fornecedor.
>
> **Alternativas viáveis:**
> - Rodar via Docker/Podman: `docker run -p 3000:3000 devlikeapro/waha-plus`
> - Ou apontar o registro privado: `npm config set @devlikeapro:registry <url-fornecida>`
> - Ou usar a n8n oficial: `@devlikeapro/n8n-nodes-waha` (publicado no npm público)

## 3. Script de inicialização

```js
// ~/waha-app/index.js
const { start } = require('@devlikeapro/waha');

// Configurações iniciais da sessão
process.env.WHATSAPP_DEFAULT_SESSION = 'default';
process.env.WHATSAPP_HOOK_URL = 'https://focoemdados2.app.n8n.cloud/webhook/seu-webhook-aqui';

start().then(() => {
  console.log('WAHA rodando com sucesso no Alpine!');
});
```

## 4. Gerenciamento com PM2

```bash
npm install -g pm2
pm2 start index.js --name "waha-service"
pm2 save
```

## 5. Integração com o Hermes / n8n

- O WAHA envia os eventos (mensagens recebidas, status de envio) para o webhook
  configurado em `WHATSAPP_HOOK_URL` (n8n: `https://focoemdados2.app.n8n.cloud`).
- O n8n repassa os eventos para a aplicação via `POST /api/waha/webhook`
  (implementado em `src/services/wahaIntegration.ts`).
- Prospecções automatizadas chegam via `POST /api/n8n/prospect` e são
  persistidas na tabela `leads` do Supabase
  (`https://ioijbixifvbosythznhh.supabase.co`).

## 6. Script de orquestração

`~/iniciar-hermes.sh` sobe o ecossistema completo:

```bash
cd ~/foco-em-dados-core
npm install --silent
opencode serve --port 4096 &
```

O OpenCode passa a escutar na porta **4096** e recebe as requisições
automatizadas do n8n/WAHA (`opencode serve --port 4096`).