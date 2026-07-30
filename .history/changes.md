# Histórico de Alterações

- 2026-07-30:
  - Adicionado `OPENAI_BASE_URL` e `OPENAI_API_KEY` ao `.bashrc`.
  - Migração de Firebase para Supabase Auth completa (commit bfe10aa).
  - Simplificação do `src/pages/AuthCallback.tsx` para redirecionamento imediato (commit 8b68f63).
  - Unificação de configurações `.env` entre repositórios e commit (commit 1c89af8).
  - Habilitada detecção de sessão automática no `src/lib/supabase.ts` (commit 8c5500e).
  - Criada pasta `.history` e arquivo `.history/changes.md`.
  - Corrigido carregamento da chave do Stripe na `LandingPage.tsx` (commit ad3f097).
  - Refatorado `src/components/Login.tsx` para remover dependências do Firebase e utilizar `AuthContext` do Supabase (commit a8ccd22).
