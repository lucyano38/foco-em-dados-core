import { createClient } from '@supabase/supabase-js'

// URL oficial e correta do Supabase fornecida por você (hardcoded para
// sobrepor qualquer env errada na Vercel, ex.: appcuidador-23628).
const supabaseUrl = 'https://ioijbixifvbosythznhh.supabase.co'
// Anon key é pública por design (vai no bundle do browser).
// Env da Vercel tem prioridade; fallback = chave real do projeto.
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvaWpiaXhpZnZib3N5dGh6bmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjk4MzksImV4cCI6MjA5OTk0NTgzOX0.mnX7iKNChokWSGnJm8iep58Cu_syKKOpr-ywwKt2hBs'

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
    redirectTo: `${window.location.origin}/dashboard`,
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
