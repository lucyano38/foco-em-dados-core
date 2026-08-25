import { createClient } from '@supabase/supabase-js'

// URL oficial e correta do Supabase fornecida por você (hardcoded para
// sobrepor qualquer env errada na Vercel, ex.: appcuidador-23628).
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

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// Autenticação OAuth (Google e GitHub).
// redirectTo vai direto para /dashboard — o supabase-js troca o código PKCE
// na própria página via detectSessionInUrl.
export const signInWithProvider = async (provider: 'google' | 'github') => {
  const options: any = {
    redirectTo: `${window.location.origin}/`,
  }
  // queryParams são específicos do Google; GitHub ignora, mas evitamos enviar
  if (provider === 'google') {
    options.queryParams = {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options,
  })
  if (error) {
    console.error(`[Auth] erro no login com ${provider}:`, error.message)
    throw error
  }
  return data
}
