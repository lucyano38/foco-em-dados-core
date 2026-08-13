-- ============================================================
-- Migration 20260811000001: Fix schema public permissions + leads
-- Foco em Dados
-- Causa raiz: roles anon/authenticated/service_role sem USAGE
-- no schema public -> "permission denied for schema public"
-- ============================================================

-- ################################################################
-- 1) Permissões padrão do Supabase no schema public
-- ################################################################
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ################################################################
-- 2) Colunas faltantes na tabela public.leads
--    O schema legado usava nome/criado_em; o pipeline novo usa
--    name/created_at. Unificar os dois sem quebrar o legado.
-- ################################################################
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score real;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pitch text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tem_site boolean DEFAULT false;

-- Colunas legadas eram NOT NULL sem default -> quebravam INSERT sem slug/nome
ALTER TABLE public.leads ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN nome DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN slug SET DEFAULT ''::text;
ALTER TABLE public.leads ALTER COLUMN nome SET DEFAULT ''::text;

-- ################################################################
-- 3) Trigger para manter updated_at em sincronia
-- ################################################################
CREATE OR REPLACE FUNCTION public.set_leads_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  NEW.atualizado_em = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_leads_updated_at();
