-- ============================================================
-- Migration 001: Extensions & All Tables
-- Foco em Dados — SaaS B2B de BI e Automação para Varejo
-- ============================================================

-- ################################################################
-- EXTENSIONS
-- ################################################################
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ################################################################
-- PLANS (tiers fixos, preços em centavos)
-- ################################################################
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text UNIQUE NOT NULL CHECK (tier IN ('free', 'starter', 'pro', 'business', 'enterprise')),
  description text,
  price_monthly integer NOT NULL DEFAULT 0,
  price_yearly integer NOT NULL DEFAULT 0,
  limits_dashboards integer NOT NULL DEFAULT 3,
  limits_rows integer NOT NULL DEFAULT 2000,
  limits_marketplaces integer NOT NULL DEFAULT 1,
  limits_chatbots integer NOT NULL DEFAULT 1,
  limits_api_calls integer NOT NULL DEFAULT 0,
  limits_storage_mb integer NOT NULL DEFAULT 50,
  features_json jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- PROFILES (estende auth.users)
-- ################################################################
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  store_name text,
  segment text CHECK (segment IN ('moda', 'eletronicos', 'alimentacao', 'beleza', 'casa', 'outro')),
  plan_id uuid REFERENCES public.plans(id),
  plan_tier text,
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'trial')),
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  lines_consumed integer DEFAULT 0,
  dashboards_created integer DEFAULT 0,
  marketplaces_connected integer DEFAULT 0,
  referral_code text UNIQUE,
  affiliate_enabled boolean DEFAULT false,
  affiliate_balance integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ################################################################
-- SUBSCRIPTIONS (com trial_ends_at para automação trial→pago)
-- ################################################################
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  pagseguro_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- PAYMENTS
-- ################################################################
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  subscription_id uuid REFERENCES public.subscriptions(id),
  amount integer NOT NULL,
  currency text DEFAULT 'BRL',
  status text NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  gateway text NOT NULL CHECK (gateway IN ('stripe', 'pagseguro', 'pix')),
  gateway_payment_id text,
  invoice_url text,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- DASHBOARDS
-- ################################################################
CREATE TABLE public.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  name text,
  config jsonb DEFAULT '{}'::jsonb,
  data_source text CHECK (data_source IN ('upload', 'google_sheets', 'shopify', 'woocommerce', 'mercado_livre', 'shopee', 'bling', 'manual')),
  is_favorite boolean DEFAULT false,
  is_public boolean DEFAULT false,
  public_slug text UNIQUE,
  share_token text,
  last_viewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ################################################################
-- DATA UPLOADS
-- ################################################################
CREATE TABLE public.data_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_id uuid REFERENCES public.dashboards(id),
  filename text NOT NULL,
  original_name text NOT NULL,
  storage_path text NOT NULL,
  file_size integer,
  mime_type text,
  row_count integer,
  rows_count integer,
  column_count integer,
  columns jsonb,
  detected_columns jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message text,
  processed_data jsonb,
  insight_summary text,
  insight_kpis jsonb,
  insight_alerts jsonb,
  insight_forecast jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- CHATBOTS
-- ################################################################
CREATE TABLE public.chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  platform text DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp', 'instagram', 'facebook', 'web', 'telegram')),
  config jsonb DEFAULT '{}'::jsonb,
  script_json jsonb DEFAULT '{}'::jsonb,
  script_flow jsonb DEFAULT '{}'::jsonb,
  knowledge_base text,
  phone_number text,
  avatar_url text,
  welcome_message text DEFAULT 'Olá! Como posso ajudar?',
  is_active boolean DEFAULT false,
  status text DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft', 'error')),
  total_conversations integer DEFAULT 0,
  metrics jsonb DEFAULT '{"resolution_rate": 0, "avg_response_time": 0, "satisfaction": 0}'::jsonb,
  webhook_url text,
  last_active_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ################################################################
-- TEMPLATES (marketplace de dashboards e fluxos)
-- ################################################################
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text CHECK (category IN ('vendas', 'estoque', 'marketing', 'chatbot', 'financeiro', 'geral')),
  subcategory text CHECK (subcategory IN ('moda', 'eletronicos', 'alimentacao', 'beleza', 'casa', 'geral')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_image text,
  thumbnail_url text,
  price integer DEFAULT 0,
  is_free boolean DEFAULT true,
  download_count integer DEFAULT 0,
  rating numeric(2,1) DEFAULT 5.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- USER TEMPLATES (relação N:N com config por instalação)
-- ################################################################
CREATE TABLE public.user_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.templates(id),
  installed_config jsonb,
  purchased_at timestamptz DEFAULT now(),
  payment_id uuid REFERENCES public.payments(id)
);

-- ################################################################
-- INTEGRATIONS (conexões com ERPs, marketplaces, anúncios)
-- ################################################################
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('shopify', 'woocommerce', 'mercado_livre', 'shopee', 'bling', 'omie', 'tiny', 'google_sheets', 'meta_ads', 'google_ads')),
  label text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  credentials jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected', 'pending', 'disabled')),
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- SCHEDULED REPORTS
-- ################################################################
CREATE TABLE public.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_id uuid REFERENCES public.dashboards(id),
  name text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  format text DEFAULT 'pdf' CHECK (format IN ('pdf', 'png', 'excel')),
  last_sent_at timestamptz,
  next_send_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- TICKETS (suporte assíncrono)
-- ################################################################
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  response text,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- ################################################################
-- EMAIL SEQUENCES (automação de marketing/onboarding)
-- ################################################################
CREATE TABLE public.email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_type text NOT NULL CHECK (sequence_type IN ('onboarding', 'trial', 'retention', 'churn', 'upgrade', 'affiliate', 'welcome')),
  step integer NOT NULL DEFAULT 1,
  subject text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- USAGE LOGS (métricas mensais por feature)
-- ################################################################
CREATE TABLE public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('dashboard', 'upload', 'chatbot', 'api_call', 'report', 'integration', 'template')),
  quantity integer DEFAULT 1,
  period date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- NOTIFICATIONS (in-app, multicanal)
-- ################################################################
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('upsell', 'limit_warning', 'insight', 'report_ready', 'payment', 'system', 'affiliate', 'campaign', 'alert', 'success', 'error')),
  title text NOT NULL,
  message text,
  channel text DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'whatsapp', 'push')),
  data jsonb,
  metadata jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- CHATBOT CONVERSATIONS (histórico de mensagens)
-- ################################################################
CREATE TABLE public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES public.chatbots(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  message text NOT NULL,
  response text,
  source text DEFAULT 'rag' CHECK (source IN ('rag', 'human', 'fallback', 'ai')),
  satisfaction integer CHECK (satisfaction BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- ADDONS (funcionalidades extras avulsas)
-- Ex: "relatorios_agendados", "integracao_whatsapp",
--      "exportacao_avancada", "api_publica", "white_label"
-- ################################################################
CREATE TABLE public.addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price_monthly integer NOT NULL DEFAULT 0,
  price_yearly integer NOT NULL DEFAULT 0,
  category text CHECK (category IN ('export', 'integration', 'automation', 'ai', 'api', 'customization')),
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- USER ADDONS (addons contratados por usuário)
-- ################################################################
CREATE TABLE public.user_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_id uuid REFERENCES public.addons(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_subscription_item_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, addon_id)
);

-- ################################################################
-- PROCESSED EVENTS (idempotência para webhooks)
-- ################################################################
CREATE TABLE public.processed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  handler text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ################################################################
-- DOCUMENTS (FAQ para chatbot RAG)
-- ################################################################
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
