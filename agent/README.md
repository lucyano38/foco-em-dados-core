# OpenSquad — Hermes Agent (Foco em Dados)

Esquadrão de subagentes autônomos que orquestram prospecção, redesign comercial
e infraestrutura do projeto, operando sob **custo zero absoluto** e **trava de
segurança de 5 envios/dia**.

## Árvore

```
agent/
├── core/
│   └── hermes.md            # Orquestrador principal (Hermes)
└── subas/
    ├── research/
    │   ├── finder.md        # Busca leads na web (empresas com/sem site)
    │   └── researcher.md    # Pesquisa profunda dos leads encontrados
    ├── planning/
    │   └── planner.md       # Estratégia de abordagem e priorização
    ├── implementation/
    │   └── implementer.md   # Execução (redesign, funnels, automação)
    ├── quality/
    │   └── qa.md            # Revisão de qualidade e conformidade
    └── infrastructure/
        └── infra.md         # Deploy Vercel, n8n, 9router, Tailscale Funnel
```

## Regras globais (valem para todos os subagentes)

1. **Custo zero absoluto**: `MAX_COST_PER_MONTH=0.00`, `PREFER_FREE_MODELS=true`,
   `DISABLE_GCP_GEMINI_API="true"`. Toda chamada de IA passa pelo
   OpenRouter/9router com modelo gratuito.
2. **Trava de prospecção**: máximo de **5 envios/abordagens por dia**
   (guarda em `src/services/prospectionGuard.ts`). Ao atingir o teto, bloquear
   com aviso "Limite diário de prospecção atingido".
3. **Canais seguros**: priorizar WhatsApp; e-mail (Resend) só como canal
   secundário e contado na mesma cota.
4. **Front-end na Vercel**, backend/automações no n8n Cloud, demos via
   Tailscale Funnel (`*.ts.net`) — sem custos de hospedagem.
