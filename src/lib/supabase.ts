import { createClient } from '@supabase/supabase-js'

// URL oficial e correta do Supabase fornecida por você (hardcoded para
// sobrepor qualquer env errada na Vercel, ex.: appcuidador-23628).
const supabaseUrl = 'https://ioijbixifvbosythznhh.supabase.co'
// Anon key é pública por design (vai no bundle do browser).
// Env da Vercel tem prioridade; fallback = chave real do projeto.
// import.meta.env só existe no client; no server bundle (CJS) usa process.env.
const envValue = (key: string): string | undefined => {
  const metaEnv = (globalThis as any).import_meta?.env
  if (metaEnv?.[key]) return metaEnv[key]
  return (globalThis as any).process?.env?.[key]
}
const supabaseAnonKey =
  envValue('VITE_SUPABASE_ANON_KEY') ||
  'eyJhbG...2hBs'

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
    redirectTo: `${window.location.origin}/auth/callback`,
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
