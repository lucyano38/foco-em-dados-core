-- ============================================================
-- Migration 003: Row Level Security
-- Foco em Dados
-- Todas as tabelas com RLS, isolamento por auth.uid()
-- ============================================================

-- ################################################################
-- ENABLE RLS
-- ################################################################
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ################################################################
-- PROCESSED EVENTS (service role only — zero public access)
-- ################################################################
CREATE POLICY "processed_events_service_only" ON public.processed_events
  FOR ALL USING (false);

-- ################################################################
-- PROFILES (dono gerencia o próprio perfil)
-- ################################################################
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ################################################################
-- SUBSCRIPTIONS
-- ################################################################
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ################################################################
-- PAYMENTS
-- ################################################################
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- ################################################################
-- DASHBOARDS (próprios + públicos)
-- ################################################################
CREATE POLICY "dashboards_select_own" ON public.dashboards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dashboards_select_public" ON public.dashboards
  FOR SELECT USING (is_public = true);
CREATE POLICY "dashboards_insert_own" ON public.dashboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dashboards_update_own" ON public.dashboards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dashboards_delete_own" ON public.dashboards
  FOR DELETE USING (auth.uid() = user_id);

-- ################################################################
-- DATA UPLOADS
-- ################################################################
CREATE POLICY "uploads_select_own" ON public.data_uploads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "uploads_insert_own" ON public.data_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uploads_update_own" ON public.data_uploads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "uploads_delete_own" ON public.data_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- ################################################################
-- CHATBOTS
-- ################################################################
CREATE POLICY "chatbots_select_own" ON public.chatbots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chatbots_insert_own" ON public.chatbots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chatbots_update_own" ON public.chatbots
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chatbots_delete_own" ON public.chatbots
  FOR DELETE USING (auth.uid() = user_id);

-- ################################################################
-- TEMPLATES (público: só ativos)
-- ################################################################
CREATE POLICY "templates_select_active" ON public.templates
  FOR SELECT USING (is_active = true);

-- ################################################################
-- USER TEMPLATES
-- ################################################################
CREATE POLICY "user_templates_select_own" ON public.user_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_templates_insert_own" ON public.user_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ################################################################
-- INTEGRATIONS
-- ################################################################
CREATE POLICY "integrations_select_own" ON public.integrations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "integrations_insert_own" ON public.integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "integrations_update_own" ON public.integrations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "integrations_delete_own" ON public.integrations
  FOR DELETE USING (auth.uid() = user_id);

-- ################################################################
-- SCHEDULED REPORTS
-- ################################################################
CREATE POLICY "reports_select_own" ON public.scheduled_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_insert_own" ON public.scheduled_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_update_own" ON public.scheduled_reports
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reports_delete_own" ON public.scheduled_reports
  FOR DELETE USING (auth.uid() = user_id);

-- ################################################################
-- TICKETS
-- ################################################################
CREATE POLICY "tickets_select_own" ON public.tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_insert_own" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ################################################################
-- EMAIL SEQUENCES
-- ################################################################
CREATE POLICY "email_seq_select_own" ON public.email_sequences
  FOR SELECT USING (auth.uid() = user_id);

-- ################################################################
-- USAGE LOGS
-- ################################################################
CREATE POLICY "usage_select_own" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_insert_own" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ################################################################
-- NOTIFICATIONS
-- ################################################################
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ################################################################
-- CHATBOT CONVERSATIONS
-- ################################################################
CREATE POLICY "conversations_select_own" ON public.chatbot_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- ################################################################
-- ADDONS (público: ativos)
-- ################################################################
CREATE POLICY "addons_select_active" ON public.addons
  FOR SELECT USING (is_active = true);

-- ################################################################
-- USER ADDONS
-- ################################################################
CREATE POLICY "user_addons_select_own" ON public.user_addons
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_addons_insert_own" ON public.user_addons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_addons_update_own" ON public.user_addons
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_addons_delete_own" ON public.user_addons
  FOR DELETE USING (auth.uid() = user_id);

-- ################################################################
-- DOCUMENTS (FAQ público)
-- ################################################################
CREATE POLICY "documents_select_active" ON public.documents
  FOR SELECT USING (is_active = true);
