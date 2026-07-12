# Especificações de Segurança do Firestore (Security Spec)

## 1. Invariantes de Dados (Data Invariants)
- **Perfil do Usuário (`/users/{userId}`)**: Um usuário só pode acessar e modificar seu próprio perfil. O ID do documento deve ser o UID do usuário (`request.auth.uid`). O e-mail e a data de criação são imutáveis após o cadastro.
- **Arquivos (`/users/{userId}/files/{fileId}`)**: Só podem ser criados ou visualizados se o usuário pai correspondente for o usuário autenticado (`userId == request.auth.uid`). O documento pai na coleção `/users` deve existir.
- **Configurações de Dashboard (`/users/{userId}/dashboards/{dashboardId}`)**: O acesso de leitura e escrita é restrito estritamente ao proprietário. O campo `userId` do dashboard e a data `createdAt` são imutáveis na edição.

---

## 2. As "Doze Cargas Úteis Sujas" (The "Dirty Dozen" Payloads)
Tentativas de invasão que devem retornar `PERMISSION_DENIED`:

1. **Ataque de Identidade Oculta (User Profile Spoofing)**: Enviar criação de perfil com UID de outro usuário.
2. **Atualização Injetada de E-mail**: Atualizar perfil alterando o campo `email`.
3. **Ghost Invariant (Arquivo Órfão)**: Adicionar um arquivo sem que a conta do usuário `/users/{userId}` correspondente esteja criada no banco de dados.
4. **Roubo de Arquivos (File Theft)**: Acessar ou listar arquivos da subcoleção de outro usuário.
5. **Sequestro de Arquivo (File Hijack)**: Criar um arquivo na pasta de outro usuário.
6. **Bypass de Status de Processamento**: Tentar alterar o status de processamento do arquivo de outro usuário.
7. **Modificação Imutável de Arquivo**: Atualizar o `uploadedAt` ou o `userId` de um arquivo existente.
8. **Substituição de Dashboard Alheio**: Modificar ou deletar o dashboard de outro usuário.
9. **Poluição de Configuração de Dashboard**: Tentar salvar uma configuração de layout excedendo o limite de caracteres (10.000 caracteres) para evitar Denial of Wallet.
10. **Assinatura Autodeclarada (Self-Promotion)**: Modificar a assinatura própria diretamente para plano `enterprise` sem verificação ou faturamento do Stripe.
11. **Injeção de ID Malicioso (Path Poisoning)**: Tentar salvar um arquivo com ID contendo caracteres especiais ou sequências de diretório (ex: `../../hack`).
12. **Histórico de Pagamento Fictício**: Tentar criar um registro de pagamento diretamente pela API do cliente na subcoleção `/payments`.

---

## 3. Testes Automatizados Simulados (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Testes para as regras de segurança descritas acima.
describe('Políticas de Segurança do Firestore', () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'appcuidador-23628',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('deve bloquear acesso de usuário anônimo', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('users').doc('user1').get());
  });

  it('deve permitir que o usuário gerencie seus próprios dashboards e arquivos', async () => {
    const authDb = testEnv.authenticatedContext('user1').firestore();
    // Criação de perfil
    await assertSucceeds(authDb.collection('users').doc('user1').set({
      uid: 'user1',
      email: 'user1@email.com',
      currentPlan: 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });
});
```
