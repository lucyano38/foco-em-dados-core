# SKILL DE CONTEXTO: Foco em Dados Core & Ecossistema

## 1. Visão Geral do Projeto
- **Projeto Principal:** `~/foco-em-dados-core` (Next.js / TypeScript / Vercel).
- **Domínio Oficial:** `focoemdados.com.br` (URL Vercel: `foco-em-dados-core.vercel.app`).
- **CRM Integrado:** `~/DeskcommCRM` (Clonado do GitHub, instalado com `--legacy-peer-deps`).
- **Ambiente de Dev:** Termux no Tablet, Hermes CLI (`stepfun/step-3.7-flash:free`).

## 2. Status do Ambiente & Deploys
- **Cron Job Vercel:** Ajustado para execução diária `0 0 * * *` no `vercel.json`.
- **Build TypeScript:** Requer `@vercel/node` para resolver tipagens da pasta `api/`.
- **Domínio:** Executar `vercel domains add focoemdados.com.br` na pasta do projeto.

## 3. Tarefas de Correção Pendentes
1. **Cookies:** Remover overlay escuro, salvar `cookie_consent` no `localStorage` e desmontar o banner ao clicar em Fechar/Aceitar.
2. **Upload:** Corrigir processamento do upload de planilhas.
3. **Link CRM:** Apontar o botão "Abrir CRM" para o destino correto.
4. **Links de Área:** Corrigir botões "Diretor", "Marketing/Vendas" e "Operações BI" (remover link do WhatsApp e apontar para seções/modais internas).
