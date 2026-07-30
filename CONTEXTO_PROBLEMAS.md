# Diagnóstico

## Problema 1: Callback travando no #access_token
- **Causa Raiz**: O componente `AuthCallback` atual não possui o listener `onAuthStateChange` ou verificação proativa via `getSession()` para capturar o fluxo de autenticação que o SDK processa. Ele espera uma renderização automática que não está ocorrendo robustamente.
- **Plano de Correção**: Adicionar listener de estado de autenticação e verificação de `getSession` no `AuthCallback.tsx`.

## Problema 2: Botão "Criar conta" inativo
- **Causa Raiz**: O componente `FormCadastro.tsx` já utiliza `supabase.auth.signUp`, mas a lógica de navegação pode estar falhando ou o estado de carregamento travando. Não há referências ao Firebase, o que é bom. O problema pode ser na propagação do estado de sucesso via `onAuthSuccess`.
- **Plano de Correção**: Revisar `FormCadastro.tsx` e o fluxo de login no `App.tsx` para garantir que o redirecionamento após sucesso ocorra.

## Problema 3: Conflitos de Autenticação (Firebase)
- **Status**: Grande parte das referências foram removidas. Ainda resta uma limpeza no `package.json` para remover as dependências do `firebase` e `firebase-admin`, o que deve ser feito para evitar qualquer ambiguidade futura.
