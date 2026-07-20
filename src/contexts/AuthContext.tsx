import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(
  userId: string
): Promise<{ profile: Profile | null; plan: Plan | null }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) return { profile: null, plan: null }

  let plan: Plan | null = null
  if (profile.plan_id) {
    const { data: planData } = await supabase
      .from('plans')
      .select('*')
      .eq('id', profile.plan_id)
      .single()

    if (planData) plan = planData as Plan
  }

  return { profile: profile as Profile, plan }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
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
