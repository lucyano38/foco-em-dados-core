import { createClient } from '@supabase/supabase-js'

// Env vars da Vercel têm prioridade. O fallback usa o projeto real
// (URL e anon key são públicas por design — vão no bundle do browser).
const SUPABASE_PROJECT_URL = 'https://ioijbixifvbosythznhh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvaWpiaXhpZnZib3N5dGh6bmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjk4MzksImV4cCI6MjA5OTk0NTgzOX0.mnX7iKNChokWSGnJm8iep58Cu_syKKOpr-ywwKt2hBs'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_PROJECT_URL
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[supabase] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes — usando fallback do projeto real (ioijbixifvbosythznhh). Configure as env vars na Vercel para sobrescrever.')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
)
