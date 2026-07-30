# Histórico e Diagnóstico de Problemas

## Erro 1: Callback travando
- **Sintoma**: Após o login com Google, a página ficava em branco em `/auth/callback`.
- **Causa Raiz**: Ausência de listener proativo (`onAuthStateChange` e `getSession`) no componente `AuthCallback.tsx`.
- **Resolução**: Implementado listener e redirecionamento automático baseado no estado da sessão do Supabase.

## Erro 2: Layout desalinhado no menu / Módulo de Automação
- **Sintoma**: O módulo de automação (Prospector) estava desconectado do layout global e sem estilização padronizada.
- **Causa Raiz**: Componentes legados sem unificação de design system (`glass-card`, `glass-panel`).
- **Resolução**: Criado o componente `AdminAutomacao` (`src/pages/AdminAutomacao/index.tsx`) totalmente integrado ao Supabase (`public.leads`), utilizando classes de Glassmorphism do `index.css` e rotas protegidas em `App.tsx`.
