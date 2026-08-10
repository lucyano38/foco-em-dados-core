import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface Profile {
  id: string
  name: string | null
  email: string | null
  store_name: string | null
  segment: string | null
  plan_id: string | null
  plan_tier: string | null
  subscription_status: string | null
  avatar_url: string | null
  role: string | null
  referral_code: string | null
  affiliate_enabled: boolean
  affiliate_balance: number
  lines_consumed: number
  dashboards_created: number
  marketplaces_connected: number
  created_at: string
  updated_at: string
}

interface Plan {
  id: string
  name: string
  tier: string
  price_monthly: number
  price_yearly: number
  limits_dashboards: number
  limits_rows: number
  limits_marketplaces: number
  limits_chatbots: number
  limits_api_calls: number
  limits_storage_mb: number
  features_json: string[]
  is_active: boolean
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  plan: Plan | null
  loading: boolean
  isAdmin: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ autoLoggedIn: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const ADMIN_EMAIL = 'lucyano.pci@gmail.com'

export function translateAuthError(error: any): string {
  const code = error?.message || ''
  if (/invalid login credentials/i.test(code)) return 'E-mail ou senha incorretos.'
  if (/user already registered/i.test(code)) return 'Este e-mail já está cadastrado. Faça login ou redefina sua senha.'
  if (/password should be at least/i.test(code)) return 'A senha deve ter pelo menos 6 caracteres.'
  if (/email not confirmed/i.test(code)) return 'Confirme seu e-mail antes de entrar (verifique a caixa de entrada/spam).'
  if (/unable to validate|no user found/i.test(code)) return 'Usuário não encontrado. Verifique o e-mail ou crie uma conta.'
  if (/rate limit/i.test(code)) return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.'
  if (/network|fetch|timed out/i.test(code)) return 'Falha de conexão. Verifique sua internet e tente novamente.'
  return error?.message || 'Erro ao autenticar.'
}

async function fetchProfile(
  userId: string
): Promise<{ profile: Profile | null; plan: Plan | null }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return { profile: null, plan: null }

  let plan: Plan | null = null
  if (profile.plan_id) {
    const { data: planData } = await supabase
      .from('plans')
      .select('*')
      .eq('id', profile.plan_id)
      .maybeSingle()

    if (planData) plan = planData as Plan
  }

  return { profile: profile as Profile, plan }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = Boolean(
    user &&
    (user.email === ADMIN_EMAIL ||
      profile?.role === 'admin' ||
      profile?.role === 'master')
  )

  const loadUser = useCallback(async (currentUser: User | null) => {
    setUser(currentUser)
    if (currentUser) {
      const result = await fetchProfile(currentUser.id)
      setProfile(result.profile)
      setPlan(result.plan)
    } else {
      setProfile(null)
      setPlan(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadUser(session?.user ?? null)
      }
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [loadUser])

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Autenticação indisponível: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw translateAuthError(error)
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Login com Google indisponível: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    }
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      console.error('[Auth] signInWithOAuth error:', error)
      throw translateAuthError(error)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ autoLoggedIn: boolean }> => {
    if (!isSupabaseConfigured) {
      throw new Error('Cadastro indisponível: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim(), full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw translateAuthError(error)

    // Se a confirmação de e-mail estiver desativada no projeto, a sessão já vem pronta
    const session: Session | null = data.session
    if (session?.user) {
      await loadUser(session.user)
      return { autoLoggedIn: true }
    }
    return { autoLoggedIn: false }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = async () => {
    if (!user) return
    const result = await fetchProfile(user.id)
    setProfile(result.profile)
    setPlan(result.plan)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        plan,
        loading,
        isAdmin,
        signInWithEmail,
        signInWithGoogle,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
