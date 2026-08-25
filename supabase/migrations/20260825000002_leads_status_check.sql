-- ============================================================
-- Migration 20260825000002: Ensure leads status vocabulary
-- Foco em Dados
-- Adds a CHECK constraint so leads.status stays in the known
-- prospector/pipeline vocabulary.
-- ============================================================

ALTER TABLE public.leads
  ADD CONSTRAINT IF NOT EXISTS leads_status_check
  CHECK (status IS NULL OR status IN (
    'novo','redesenhado','publicado','proposta','respondeu','fechado',
    'prospeccao','qualificacao','negociacao','fechamento'
  ));
