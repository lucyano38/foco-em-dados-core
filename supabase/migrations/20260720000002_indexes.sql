-- ============================================================
-- Migration 002: Indexes
-- Foco em Dados
-- ============================================================

CREATE INDEX idx_profiles_plan_id ON public.profiles(plan_id);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_trial ON public.subscriptions(trial_ends_at)
  WHERE status = 'trialing';
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_dashboards_user_id ON public.dashboards(user_id);
CREATE INDEX idx_data_uploads_user_id ON public.data_uploads(user_id);
CREATE INDEX idx_chatbots_user_id ON public.chatbots(user_id);
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_integrations_provider ON public.integrations(provider);
CREATE INDEX idx_usage_logs_user_feature ON public.usage_logs(user_id, feature, period);
CREATE INDEX idx_usage_logs_period ON public.usage_logs(period);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_chatbot_conversations_session ON public.chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_chatbot ON public.chatbot_conversations(chatbot_id);
CREATE INDEX idx_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_active ON public.templates(is_active);
CREATE INDEX idx_email_sequences_user ON public.email_sequences(user_id, sequence_type);
CREATE INDEX idx_user_addons_user ON public.user_addons(user_id);
CREATE INDEX idx_addons_slug ON public.addons(slug);
