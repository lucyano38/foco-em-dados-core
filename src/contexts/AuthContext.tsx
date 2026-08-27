import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, signInWithProvider } from '../lib/supabase'
import { useLocalAuth, type LocalUser } from '../hooks/useLocalAuth'

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
  signInWithGithub: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ autoLoggedIn: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const ADMIN_EMAILS = ['lucyano.pci@gmail.com', 'atendimento@focoemdados.com.br']

export const ADMIN_EMAIL = ADMIN_EMAILS[0]

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
  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (readError) {
    console.error('[Auth] erro ao buscar perfil:', readError.message)
  }

  if (!profile) return { profile: null, plan: null }

  let plan: Plan | null = null
  if (profile.plan_id) {
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', profile.plan_id)
      .maybeSingle()

    if (planError) {
      console.error('[Auth] erro ao buscar plano:', planError.message)
    }
    if (planData) plan = planData as Plan
  }

  return { profile: profile as Profile, plan }
}

// Garante que o usuário tenha registro na tabela profiles.
// Contas já existentes (ex.: lucyano.pci@gmail.com) são apenas lidas;
// usuários novos vindos do Google OAuth ganham perfil sem erro de permissão
// (insert com RLS "profiles_insert_own" + onConflict para evitar duplicidade).
async function ensureProfileExists(user: User): Promise<Profile | null> {
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (readError) {
    console.error('[Auth] erro ao verificar perfil existente:', readError.message)
    return null
  }

  if (existing) return existing as Profile

  const name =
    String(user.user_metadata?.name || user.user_metadata?.full_name || '').trim() ||
    user.email?.split('@')[0] ||
    ''

  console.log('[Auth] perfil não encontrado — criando para', user.email ?? user.id)
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
        name,
      },
      { onConflict: 'id' }
    )
    .select()
    .maybeSingle()

  if (insertError) {
    console.error('[Auth] falha ao criar perfil (o trigger handle_new_user pode ter criado antes):', insertError.message)
    // Tolerante: a tabela pode ter sido criada pelo trigger entre a leitura e o upsert
    const { data: retry } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    return (retry as Profile) ?? null
  }

  return (inserted as Profile) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const local = useLocalAuth()

  const isAdmin = Boolean(
    user &&
    (ADMIN_EMAILS.includes(String(user.email || '').toLowerCase()) ||
      profile?.role === 'admin' ||
      profile?.role === 'master')
  )

  const loadUser = useCallback(async (currentUser: User | null) => {
    setUser(currentUser)
    if (currentUser) {
      try {
        const profileRow = await ensureProfileExists(currentUser)
        const result = await fetchProfile(currentUser.id)
        setProfile(profileRow ?? result.profile)
        setPlan(result.plan)
        console.log('[Auth] sessão carregada para', currentUser.email ?? currentUser.id)
      } catch (err: any) {
        console.error('[Auth] falha ao carregar perfil/sessão:', err?.message || err)
        setProfile(null)
        setPlan(null)
      }
    } else if (local.user) {
      setUser({
        id: 'local-session',
        email: local.user.email,
        user_metadata: {
          name: local.user.name,
          full_name: local.user.name,
        },
      } as unknown as User)
      setProfile({
        id: 'local-session',
        name: local.user.name,
        email: local.user.email,
        store_name: null,
        segment: null,
        plan_id: null,
        plan_tier: null,
        subscription_status: null,
        avatar_url: null,
        role: local.user.role,
        referral_code: null,
        affiliate_enabled: false,
        affiliate_balance: 0,
        lines_consumed: 0,
        dashboards_created: 0,
        marketplaces_connected: 0,
        created_at: null,
        updated_at: null,
      })
      setPlan({
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
      } as Plan)
    } else {
      setProfile(null)
      setPlan(null)
    }
    setLoading(false)
  }, [local.user])

  useEffect(() => {
    setLoading(true)
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('[Auth] falha ao recuperar sessão:', error.message)
          setLoading(false)
          return
        }
        loadUser(session?.user ?? null)
      })
      .catch((err: any) => {
        console.error('[Auth] exceção ao recuperar sessão:', err?.message || err)
        setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[Auth] evento onAuthStateChange:', _event)
        loadUser(session?.user ?? null)
      }
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [loadUser])

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Autenticação indisponível: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw translateAuthError(error)
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Login com Google indisponível: configure VITE_SUPABASE_ANON_KEY.')
    }
    // Redireciona direto para /dashboard — o supabase-js troca o código PKCE
    // na própria página (detectSessionInUrl) e o ProtectedRoute libera o acesso.
    try {
      await signInWithProvider('google')
    } catch (err: any) {
      console.error('[Auth] signInWithGoogle error:', err)
      throw translateAuthError(err)
    }
  }

  const signInWithGithub = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Login com GitHub indisponível: configure VITE_SUPABASE_ANON_KEY.')
    }
    try {
      await signInWithProvider('github')
    } catch (err: any) {
      console.error('[Auth] signInWithGithub error:', err)
      throw translateAuthError(err)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ autoLoggedIn: boolean }> => {
    if (!isSupabaseConfigured()) {
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
        signInWithGithub,
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
