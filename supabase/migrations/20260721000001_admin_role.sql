-- ============================================================
-- Migration 006: Admin / Master Role + RLS bypass
-- Foco em Dados
-- ============================================================

-- ################################################################
-- 6.1. Add role column to profiles
-- ################################################################
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'master'));

-- ################################################################
-- 6.2. Helper function: is_master_or_admin
-- Retorna true se o usuário logado for master ou admin
-- ################################################################
CREATE OR REPLACE FUNCTION public.is_master_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('master', 'admin')
  );
$$;

-- ################################################################
-- 6.3. Drop all existing RLS policies and recreate with admin bypass
-- ################################################################

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_master_or_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_master_or_admin());

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());

-- PAYMENTS
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());

-- DASHBOARDS
DROP POLICY IF EXISTS "dashboards_select_own" ON public.dashboards;
DROP POLICY IF EXISTS "dashboards_select_public" ON public.dashboards;
DROP POLICY IF EXISTS "dashboards_insert_own" ON public.dashboards;
DROP POLICY IF EXISTS "dashboards_update_own" ON public.dashboards;
DROP POLICY IF EXISTS "dashboards_delete_own" ON public.dashboards;

CREATE POLICY "dashboards_select_own" ON public.dashboards
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "dashboards_select_public" ON public.dashboards
  FOR SELECT USING (is_public = true OR auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "dashboards_insert_own" ON public.dashboards
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "dashboards_update_own" ON public.dashboards
  FOR UPDATE USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "dashboards_delete_own" ON public.dashboards
  FOR DELETE USING (auth.uid() = user_id OR public.is_master_or_admin());

-- DATA UPLOADS
DROP POLICY IF EXISTS "uploads_select_own" ON public.data_uploads;
DROP POLICY IF EXISTS "uploads_insert_own" ON public.data_uploads;
DROP POLICY IF EXISTS "uploads_update_own" ON public.data_uploads;
DROP POLICY IF EXISTS "uploads_delete_own" ON public.data_uploads;

CREATE POLICY "uploads_select_own" ON public.data_uploads
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "uploads_insert_own" ON public.data_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "uploads_update_own" ON public.data_uploads
  FOR UPDATE USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "uploads_delete_own" ON public.data_uploads
  FOR DELETE USING (auth.uid() = user_id OR public.is_master_or_admin());

-- CHATBOTS
DROP POLICY IF EXISTS "chatbots_select_own" ON public.chatbots;
DROP POLICY IF EXISTS "chatbots_insert_own" ON public.chatbots;
DROP POLICY IF EXISTS "chatbots_update_own" ON public.chatbots;
DROP POLICY IF EXISTS "chatbots_delete_own" ON public.chatbots;

CREATE POLICY "chatbots_select_own" ON public.chatbots
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "chatbots_insert_own" ON public.chatbots
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "chatbots_update_own" ON public.chatbots
  FOR UPDATE USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "chatbots_delete_own" ON public.chatbots
  FOR DELETE USING (auth.uid() = user_id OR public.is_master_or_admin());

-- TEMPLATES
DROP POLICY IF EXISTS "templates_select_active" ON public.templates;
CREATE POLICY "templates_select_active" ON public.templates
  FOR SELECT USING (is_active = true OR public.is_master_or_admin());

-- USER TEMPLATES
DROP POLICY IF EXISTS "user_templates_select_own" ON public.user_templates;
DROP POLICY IF EXISTS "user_templates_insert_own" ON public.user_templates;

CREATE POLICY "user_templates_select_own" ON public.user_templates
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "user_templates_insert_own" ON public.user_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());

-- INTEGRATIONS
DROP POLICY IF EXISTS "integrations_select_own" ON public.integrations;
DROP POLICY IF EXISTS "integrations_insert_own" ON public.integrations;
DROP POLICY IF EXISTS "integrations_update_own" ON public.integrations;
DROP POLICY IF EXISTS "integrations_delete_own" ON public.integrations;

CREATE POLICY "integrations_select_own" ON public.integrations
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "integrations_insert_own" ON public.integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "integrations_update_own" ON public.integrations
  FOR UPDATE USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "integrations_delete_own" ON public.integrations
  FOR DELETE USING (auth.uid() = user_id OR public.is_master_or_admin());

-- SCHEDULED REPORTS
DROP POLICY IF EXISTS "reports_select_own" ON public.scheduled_reports;
DROP POLICY IF EXISTS "reports_insert_own" ON public.scheduled_reports;
DROP POLICY IF EXISTS "reports_update_own" ON public.scheduled_reports;
DROP POLICY IF EXISTS "reports_delete_own" ON public.scheduled_reports;

CREATE POLICY "reports_select_own" ON public.scheduled_reports
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "reports_insert_own" ON public.scheduled_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "reports_update_own" ON public.scheduled_reports
  FOR UPDATE USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "reports_delete_own" ON public.scheduled_reports
  FOR DELETE USING (auth.uid() = user_id OR public.is_master_or_admin());

-- TICKETS
DROP POLICY IF EXISTS "tickets_select_own" ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert_own" ON public.tickets;

CREATE POLICY "tickets_select_own" ON public.tickets
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "tickets_insert_own" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());

-- EMAIL SEQUENCES
DROP POLICY IF EXISTS "email_seq_select_own" ON public.email_sequences;
CREATE POLICY "email_seq_select_own" ON public.email_sequences
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());

-- USAGE LOGS
DROP POLICY IF EXISTS "usage_select_own" ON public.usage_logs;
DROP POLICY IF EXISTS "usage_insert_own" ON public.usage_logs;

CREATE POLICY "usage_select_own" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "usage_insert_own" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id OR public.is_master_or_admin());

-- CHATBOT CONVERSATIONS
DROP POLICY IF EXISTS "conversations_select_own" ON public.chatbot_conversations;
CREATE POLICY "conversations_select_own" ON public.chatbot_conversations
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());

-- ADDONS
DROP POLICY IF EXISTS "addons_select_active" ON public.addons;
CREATE POLICY "addons_select_active" ON public.addons
  FOR SELECT USING (is_active = true OR public.is_master_or_admin());

-- USER ADDONS
DROP POLICY IF EXISTS "user_addons_select_own" ON public.user_addons;
DROP POLICY IF EXISTS "user_addons_insert_own" ON public.user_addons;
DROP POLICY IF EXISTS "user_addons_update_own" ON public.user_addons;
DROP POLICY IF EXISTS "user_addons_delete_own" ON public.user_addons;

CREATE POLICY "user_addons_select_own" ON public.user_addons
  FOR SELECT USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "user_addons_insert_own" ON public.user_addons
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "user_addons_update_own" ON public.user_addons
  FOR UPDATE USING (auth.uid() = user_id OR public.is_master_or_admin());
CREATE POLICY "user_addons_delete_own" ON public.user_addons
  FOR DELETE USING (auth.uid() = user_id OR public.is_master_or_admin());

-- DOCUMENTS
DROP POLICY IF EXISTS "documents_select_active" ON public.documents;
CREATE POLICY "documents_select_active" ON public.documents
  FOR SELECT USING (is_active = true OR public.is_master_or_admin());

-- PROCESSED EVENTS (service role only)
DROP POLICY IF EXISTS "processed_events_service_only" ON public.processed_events;
CREATE POLICY "processed_events_service_only" ON public.processed_events
  FOR ALL USING (public.is_master_or_admin());

-- ################################################################
-- 6.4. Set e-mails de administradores como 'master'
-- A migration é idempotente: só atualiza se a role ainda não for master
-- ################################################################
UPDATE public.profiles
SET role = 'master'
WHERE email IN ('lucyano.pci@gmail.com', 'atendimento@focoemdados.com.br')
  AND (role IS NULL OR role <> 'master');
