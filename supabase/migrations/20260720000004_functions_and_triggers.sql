-- ============================================================
-- Migration 004: Functions & Triggers
-- Foco em Dados
-- ============================================================

-- ################################################################
-- 4.1. Auto-update updated_at
-- ################################################################
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON public.chatbots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ################################################################
-- 4.2. Auto-create profile on user signup
-- Cria perfil + subscription trial + notificação de boas-vindas
-- ################################################################
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id uuid;
  v_referral_code text;
  v_subscription_id uuid;
BEGIN
  SELECT id INTO v_plan_id FROM public.plans WHERE tier = 'free' LIMIT 1;
  v_referral_code := 'FOCO' || upper(substr(md5(random()::text), 1, 8));

  INSERT INTO public.profiles (
    id, email, name, plan_id, plan_tier, referral_code, subscription_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    v_plan_id,
    'free',
    v_referral_code,
    'active'
  );

  INSERT INTO public.subscriptions (
    user_id, plan_id, status, trial_ends_at
  ) VALUES (
    NEW.id, v_plan_id, 'trialing', now() + interval '7 days'
  );

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    NEW.id, 'system', 'Bem-vindo ao Foco em Dados!',
    'Sua conta foi criada com sucesso. Comece enviando sua primeira planilha.'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ################################################################
-- 4.3. Check plan limit before usage
-- Valida se o usuário ainda tem cota disponível no plano
-- para a feature solicitada antes de permitir a operação.
-- ################################################################
CREATE OR REPLACE FUNCTION public.check_plan_limit(
  p_user_id uuid,
  p_feature text,
  p_quantity integer DEFAULT 1
)
RETURNS boolean AS $$
DECLARE
  v_plan_limit integer;
  v_current_usage integer;
  v_limit_col text;
BEGIN
  v_limit_col := CASE p_feature
    WHEN 'dashboard' THEN 'limits_dashboards'
    WHEN 'upload' THEN 'limits_rows'
    WHEN 'chatbot' THEN 'limits_chatbots'
    WHEN 'integration' THEN 'limits_marketplaces'
    WHEN 'api_call' THEN 'limits_api_calls'
    ELSE NULL
  END;

  IF v_limit_col IS NULL THEN RETURN true; END IF;

  EXECUTE format(
    'SELECT %I FROM public.plans WHERE id = (SELECT plan_id FROM public.profiles WHERE id = $1)',
    v_limit_col
  ) INTO v_plan_limit USING p_user_id;

  IF v_plan_limit IS NULL OR v_plan_limit >= 999999 THEN RETURN true; END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_current_usage
  FROM public.usage_logs
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND period = date_trunc('month', now())::date;

  RETURN (v_current_usage + p_quantity) <= v_plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ################################################################
-- 4.4. Create upsell notification on usage insert
-- Gera alerta automático ao atingir 80% e 100% do limite do plano
-- ################################################################
CREATE OR REPLACE FUNCTION public.create_upsell_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_limit integer;
  v_current_usage integer;
  v_usage_percent numeric;
  v_limit_col text;
BEGIN
  v_limit_col := CASE NEW.feature
    WHEN 'dashboard' THEN 'limits_dashboards'
    WHEN 'upload' THEN 'limits_rows'
    WHEN 'chatbot' THEN 'limits_chatbots'
    WHEN 'integration' THEN 'limits_marketplaces'
    ELSE NULL
  END;

  IF v_limit_col IS NULL THEN RETURN NEW; END IF;

  EXECUTE format(
    'SELECT %I FROM public.plans WHERE id = (SELECT plan_id FROM public.profiles WHERE id = $1)',
    v_limit_col
  ) INTO v_plan_limit USING NEW.user_id;

  IF v_plan_limit IS NULL OR v_plan_limit >= 999999 THEN RETURN NEW; END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_current_usage
  FROM public.usage_logs
  WHERE user_id = NEW.user_id
    AND feature = NEW.feature
    AND period = date_trunc('month', now())::date;

  v_usage_percent := (v_current_usage::numeric / NULLIF(v_plan_limit, 0)) * 100;

  IF v_usage_percent >= 80 AND v_usage_percent < 100 THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'upsell',
      'Você está quase no limite!',
      'Você usou ' || v_current_usage || ' de ' || v_plan_limit
        || ' ' || NEW.feature || 's este mês. Faça upgrade para continuar sem limites.',
      jsonb_build_object(
        'feature', NEW.feature,
        'usage', v_current_usage,
        'limit', v_plan_limit,
        'percent', v_usage_percent
      )
    );
  ELSIF v_usage_percent >= 100 THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'limit_warning',
      'Limite atingido!',
      'Você atingiu o limite de ' || v_plan_limit
        || ' ' || NEW.feature || 's. Faça upgrade para continuar usando.',
      jsonb_build_object(
        'feature', NEW.feature,
        'usage', v_current_usage,
        'limit', v_plan_limit
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_upsell_notification
  AFTER INSERT ON public.usage_logs
  FOR EACH ROW EXECUTE FUNCTION public.create_upsell_notification();

-- ################################################################
-- 4.5. Affiliate commission on first successful payment
-- ################################################################
CREATE OR REPLACE FUNCTION public.calculate_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_affiliate_id uuid;
  v_plan_price integer;
  v_commission integer;
BEGIN
  SELECT a.id INTO v_affiliate_id
  FROM public.referrals r
  JOIN public.affiliates a ON a.id = r.affiliate_id
  WHERE r.referred_user_id = NEW.user_id AND r.status = 'pending'
  LIMIT 1;

  IF v_affiliate_id IS NOT NULL THEN
    SELECT p.price_monthly INTO v_plan_price
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.id = NEW.subscription_id
    LIMIT 1;

    v_commission := COALESCE((v_plan_price * 20) / 100, 0);

    UPDATE public.referrals
    SET status = 'converted',
        commission_amount = v_commission,
        converted_at = now()
    WHERE referred_user_id = NEW.user_id AND status = 'pending';

    UPDATE public.affiliates
    SET balance = balance + v_commission,
        total_earned = total_earned + v_commission
    WHERE id = v_affiliate_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_affiliate_commission
  AFTER INSERT ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded')
  EXECUTE FUNCTION public.calculate_affiliate_commission();
