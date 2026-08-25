import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocalAuth, type LocalUser } from './useLocalAuth'

function localRole(user: LocalUser | null): string | null {
  if (!user) return null
  return user.role?.trim() ? user.role.trim() : null
}

export function useAppAuth() {
  const supabase = useAuth()
  const local = useLocalAuth()

  const hasSupabaseUser = Boolean(supabase.user)
  const hasLocalUser = Boolean(local.user)

  const user =
    hasSupabaseUser
      ? supabase.user
      : hasLocalUser
        ? {
            id: 'local-session',
            email: local.user?.email ?? null,
            user_metadata: {
              name: local.user?.name ?? null,
              full_name: local.user?.name ?? null,
            },
          }
        : null

  const profile =
    hasSupabaseUser
      ? supabase.profile
      : hasLocalUser
        ? {
            id: 'local-session',
            name: local.user?.name ?? null,
            email: local.user?.email ?? null,
            store_name: null,
            segment: null,
            plan_id: null,
            plan_tier: null,
            subscription_status: null,
            avatar_url: null,
            role: localRole(local.user),
            referral_code: null,
            affiliate_enabled: false,
            affiliate_balance: 0,
            lines_consumed: 0,
            dashboards_created: 0,
            marketplaces_connected: 0,
            created_at: null,
            updated_at: null,
          }
        : null

  const plan =
    hasSupabaseUser
      ? supabase.plan
      : hasLocalUser
        ? {
            id: 'local-plan',
            name: 'Local',
            tier: 'local',
            price_monthly: 0,
            price_yearly: 0,
            limits_dashboards: 1,
            limits_rows: 100,
            limits_marketplaces: 0,
            limits_chatbots: 1,
            limits_api_calls: 100,
            limits_storage_mb: 100,
            features_json: ['local_fallback'],
            is_active: true,
          }
        : null

  const loading = supabase.loading || local.user === undefined

  const isAdmin = useMemo(() => {
    if (hasSupabaseUser) return supabase.isAdmin
    if (hasLocalUser) return localRole(local.user) === 'admin'
    return false
  }, [hasSupabaseUser, hasLocalUser, supabase.isAdmin, local.user])

  const signOut = async () => {
    try {
      await supabase.signOut()
    } catch {
      // keep local fallback usable even if Supabase signOut fails
    } finally {
      local.signOut()
    }
  }

  return {
    user,
    profile,
    plan,
    loading,
    isAdmin,
    signInWithEmail: supabase.signInWithEmail,
    signInWithGoogle: supabase.signInWithGoogle,
    signInWithGithub: supabase.signInWithGithub,
    signUp: supabase.signUp,
    signOut,
    refreshProfile: supabase.refreshProfile,
  }
}
