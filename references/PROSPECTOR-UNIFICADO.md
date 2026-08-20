# Prospector Foco Completo — Spec Unificado

Consolidação dos 3 materiais originais num único modelo (schemas, pipeline e integração
definidos **uma única vez**, sem duplicação entre painel, módulo de captação e app):

| Material | Origem | Destino na consolidação |
|---|---|---|
| `references/dashboard-template.html` (painel Prospector, modo arquivo+db) | Foco Completo | Referência visual + runtime do painel |
| `prospectar.py` (captação Maps/Redes/CNAE → CRM local) | Foco Completo | `src/` do módulo web + entrada de dados |
| Prompt genérico "AppCuidador" (projeto estranho) | outro projeto | **Descartado** — não se aplica a este repositório |

## 1. Modelo de dados único (leads)

Um único schema vale para o banco SQLite local (`prospector.db`), para a resposta de
`GET /api/leads` do painel e para o CRM do app. Campos:

| Campo | Tipo | Uso |
|---|---|---|
| `slug` | TEXT PK | chave estável (derivada do nome) |
| `nome`, `nicho`, `cidade` | TEXT | identidade e segmentação |
| `nota`, `avaliacoes` | REAL/INT | pontuação Google Maps |
| `email`, `telefone`, `whatsapp` | TEXT | contato (whatsapp no formato 55DDDnúmero) |
| `siteAntigo`, `urlNova` | TEXT | redes/site atual e site publicado |
| `motivo`, `obs` | TEXT | argumento de abordagem e observações |
| `status` | TEXT | ver pipeline único abaixo (default `novo`) |
| `dataProposta`, `valor`, `manutencao`, `pago` | TEXT/REAL/INT | proposta e recorrência |
| `contratoStatus`, `contratoEm` | TEXT | pendente / enviado / assinado |
| `atualizado` | TEXT | timestamp local |

## 2. Pipeline único (status)

Uma única cadeia de estágios, usada pelo painel e pelo módulo:

`novo` → `redesenhado` → `publicado` → `proposta` → `respondeu` → `fechado` (+ `descartado`)

Cores únicas: novo `#7A8CA8`, redesenhado `#9C7BB8`, publicado `#5E9DA8`,
proposta `#C98A2D`, respondeu `#6A9B72`, fechado `#4E8757`, descartado `#B7B2A7`.

## 3. Captação unificada

Fontes combinadas (sem fluxos paralelos): Google Maps (nota/avaliações),
Redes Sociais (Instagram/Facebook como `siteAntigo`) e CNAE. Entrada única:
`AdicionarLead(...)` em `prospectar.py` → grava em `prospector.db` com `status='novo'`
e obs `Origem: Prospecção (CNAE: ...)`.

Execução validada:

```bash
python3 prospectar.py
# → "CRM atualizado: 1 leads" (Estética & Spa Aurora, Itupeva/SP, novo)
```

## 4. Integração com o app

- `dashboard.html` (gerado a partir do template) tenta `GET /api/leads`; se OK, troca
  para "banco conectado" e renderiza do servidor; senão, usa os dados embutidos.
- O CRM web existente (React/Supabase) permanece a fonte para o painel `/admin`;
  `prospector.db` é o CRM local do pipeline de prospecção externa.

## 5. Arquivos

```
references/dashboard-template.html  → template-fonte do painel (com __DADOS__)
dashboard.html                       → painel gerado (estado inicial vazio)
prospectar.py                        → módulo de captação + escrita no CRM
prospector.db                        → banco local (gerado, fora do git)
```