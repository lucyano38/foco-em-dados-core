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
  - Corrigido travamento no `AuthCallback.tsx` com listeners de autenticação ativos (commit 736c9b0).
  - Criada migration para a tabela `public.leads` no Supabase (commit 0b88bfa).
  - Criado e integrado o módulo de automação/Prospector (`src/pages/AdminAutomacao/index.tsx`) com interface Glassmorphic e conexão Supabase (`public.leads`) (commit 0b88bfa).
  - Reescrito `AuthCallback.tsx` para redirecionamento robusto e imediato via `window.location.replace('/app')`.
  - Redesenhada a `LandingPage.tsx` no estilo SaaS Hero (inspiração Tripo.ai) com `mesh-bg`, `glass-panel`, hierarquia visual focada e faixa de logotipos de autoridade.
  - Atualizado o arquivo `index.html` com o tema **Foco Completo | Mystic Tech**, incorporando as fontes (Hanken Grotesk, Manrope, Geist), Tailwind CSS com a paleta de cores personalizada e classes `.glass-panel` e `.glow-hover`.
