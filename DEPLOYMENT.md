# DEPLOYMENT — Front-end (Vercel) & Back-end (GCP)

Este documento descreve a migração do front-end para Vercel e os passos necessários para configurar variáveis de ambiente, build do Vite e checklist de implantação.

Resumo
- Migração do front-end: agora hospedado no Vercel (antes no Google Cloud).
- Backend / serviços permaneceram no Google Cloud (GCP) — o guia GCP existente deve continuar válido para backend e Secret Manager.

Links relevantes
- Repositório: https://github.com/lucyano38/foco-em-dados-core
- Commits de 2026-08-09:
  - Add VITE_STRIPE_PUBLISHABLE_KEY to .env — https://github.com/lucyano38/foco-em-dados-core/commit/616de20ccb2fc0ecb8b37c66d82b3aa388052311
  - Add comprehensive action plan: fix Vite build args and runtime env vars — https://github.com/lucyano38/foco-em-dados-core/commit/b3fb1db4165cb91e9f5ea0118c328e3015760309
  - Add comprehensive GCP deployment guide with Secret Manager setup — https://github.com/lucyano38/foco-em-dados-core/commit/4407f6f8b5199d26a52c7df71e6caf6f3c535775

Configuração no Vercel (Front-end)
1) Criar o projeto no Vercel
   - Importar o repositório `lucyano38/foco-em-dados-core` no Vercel.
   - Selecionar o diretório do front-end (se for uma monorepo, apontar para a pasta correta).

2) Environment Variables (Environment > Environment Variables)
   - Adicionar as variáveis de ambiente necessárias (exemplos):
     - VITE_STRIPE_PUBLISHABLE_KEY = <sua_chave_pub>
     - VITE_API_BASE_URL = https://api.seu-dominio.com (ou o URL do backend)
     - OUTRAS_VAR_EXEMPLO = valor
   - Atenção: variáveis que começam com `VITE_` são embutidas no bundle do cliente. Não colocar segredos sensíveis que não devem ficar no cliente.

3) Build & Output
   - Framework Preset: selecione `Vite` (ou configure build command manualmente).
   - Build command (exemplo): `npm run build` ou `yarn build` — valide se seu package.json usa outro script.
   - Output Directory: conforme configuração do Vite (ex: `dist`).
   - Se houver argumentos de build customizados (ver plano de ação), configurar no campo Build Command ou em `vercel.json`.

4) Variáveis de ambiente por branch
   - Defina variáveis separadas para `Production`, `Preview` e `Development` conforme necessário.

Migrando secrets do GCP (quando aplicável)
- Se o front recebia valores do GCP Secret Manager, avalie: manter os secrets no Secret Manager apenas para serviços backend; para o front, prefira configurar como Environment Variables no Vercel.
- Para backend (serviços GCP) mantenha o Secret Manager e verifique permissões de acesso.

Checklist de implantação (ação)
- [ ] Criar projeto no Vercel e conectar o repositório.
- [ ] Definir Environment Variables no Vercel (incluir VITE_STRIPE_PUBLISHABLE_KEY).
- [ ] Ajustar Build Command / Build Args conforme plano de ação (commit b3fb1db...).
- [ ] Validar Output Directory e configuração de framework.
- [ ] Configurar Preview URLs e testar build em `Preview`.
- [ ] Testar pagamento/Stripe em staging com VITE_STRIPE_PUBLISHABLE_KEY.
- [ ] Atualizar documentação: marcar passos GCP como “backend-only” e adicionar instruções Vercel no README/DEPLOYMENT.
- [ ] Criar issue/checklist no GitHub para rastrear quaisquer ajustes pendentes.

Dicas de troubleshooting
- Build falhando na Vercel: veja logs (Vercel → Deployments → Logs). Erros comuns:
  - Variáveis de ambiente ausentes (adicione na UI do Vercel).
  - Caminho de saída incorreto (confirme `dist` ou `build`).
  - Dependências nativas faltando (confirme versões do Node e instalação correta de dependências).

Rollback / Observações
- Se for necessário rollback, use as `Deployments` do Vercel para restaurar uma versão anterior.
- Manter o guia GCP no repositório para backend e operações relacionadas a infra.

Se preferir, eu também:
- Crio uma issue automaticamente com a checklist acima; ou
- Atualizo o README principal para sumarizar a migração para Vercel.


---
Gerado automaticamente em 2026-08-09 por Copilot.