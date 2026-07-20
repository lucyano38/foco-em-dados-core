# Migrations — Foco em Dados

## Ordem de execução

| #  | Arquivo                                      | Descrição                          |
|----|----------------------------------------------|-------------------------------------|
| 01 | `20260720000001_extensions_and_tables.sql`    | Extensions + 22 tabelas             |
| 02 | `20260720000002_indexes.sql`                  | Índices de performance              |
| 03 | `20260720000003_rls.sql`                      | Row Level Security (20 tabelas)     |
| 04 | `20260720000004_functions_and_triggers.sql`   | 5 functions + 6 triggers            |
| 05 | `20260720000005_seed_data.sql`                | 5 plans, 7 addons, 7 templates, 12 FAQ docs |

## Aplicar via Supabase CLI

```bash
# 1. Login (se ainda não fez)
npx supabase login

# 2. Link com o projeto
npx supabase link --project-ref ioijbixifvbosythznhh

# 3. Push das migrations (executa na ordem correta)
npx supabase db push

# OU aplicar manualmente uma a uma via Management API:
python3 -c "
import json, sys
for m in ['20260720000001_extensions_and_tables', '20260720000002_indexes', '20260720000003_rls', '20260720000004_functions_and_triggers', '20260720000005_seed_data']:
    with open(f'supabase/migrations/{m}.sql') as f:
        sql = f.read()
    # URL-encode seguro para curl
    import urllib.request, urllib.parse
    payload = json.dumps({'query': sql}).encode()
    req = urllib.request.Request(
        'https://api.supabase.com/v1/projects/ioijbixifvbosythznhh/database/query',
        data=payload,
        headers={
            'Authorization': 'Bearer sbp_311f50c16fc49ea9c85c8ab6ebea75605bce7776',
            'Content-Type': 'application/json'
        }
    )
    resp = urllib.request.urlopen(req)
    print(f'{m}: {resp.status}')
"
```

## Rollback

Não há rollback automático. Para reverter, use:

```sql
DROP TABLE IF EXISTS
  public.documents, public.processed_events, public.user_addons, public.addons,
  public.chatbot_conversations, public.notifications, public.usage_logs,
  public.email_sequences, public.tickets, public.scheduled_reports,
  public.integrations, public.user_templates, public.templates, public.chatbots,
  public.data_uploads, public.dashboards, public.payments, public.subscriptions,
  public.profiles, public.plans CASCADE;
```

Depois ajuste as migrations e rode `npx supabase db push` novamente.

## O que foi adicionado em relação ao schema anterior

- `subscriptions.trial_ends_at` — campo timestamptz para automação trial → pago
- `handle_new_user()` agora cria subscription + notificação de boas-vindas
- Tabela `addons` — funcionalidades extras avulsas (ex: relatórios agendados, integração WhatsApp, exportação avançada, API pública, white label)
- Tabela `user_addons` — addons contratados por usuário (com UNIQUE user_id + addon_id)
