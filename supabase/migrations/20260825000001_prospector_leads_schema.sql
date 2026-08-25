-- ============================================================
-- Migration 20260825000001: Ensure prospecting leads schema
-- Foco em Dados
-- Adiciona/assegura colunas necessárias para prospecção/CRM.
-- ============================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS nicho text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS url_preview text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS valor numeric;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mrr_manutencao numeric;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS observacoes text;
