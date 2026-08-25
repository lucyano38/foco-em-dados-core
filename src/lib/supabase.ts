import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://ioijbixifvbosythznhh.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''

export const SUPABASE_URL = supabaseUrl
export const SUPABASE_PUBLISHABLE_KEY = supabaseAnonKey

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }
  return client
}

export const supabase = getSupabaseClient()

export const signInWithProvider = async (provider: 'google' | 'github') => {
  const currentClient = getSupabaseClient()
  if (!currentClient) {
    throw new Error('Supabase não configurado.')
  }

  const options: any = {
    redirectTo: `${window.location.origin}/`,
  }
  if (provider === 'google') {
    options.queryParams = {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
  const { data, error } = await currentClient.auth.signInWithOAuth({
    provider,
    options,
  })
  if (error) {
    console.error(`[Auth] erro no login com ${provider}:`, error.message)
    throw error
  }
  return data
}
