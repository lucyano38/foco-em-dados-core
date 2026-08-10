import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Database, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { user, signInWithEmail, signInWithGoogle, signInWithGithub, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/app', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Preencha todos os campos.')
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Informe seu nome para criar a conta.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
      } else {
        const { autoLoggedIn } = await signUp(email, password, name.trim())
        if (autoLoggedIn) {
          navigate('/app', { replace: true })
        } else {
          setMode('login')
          setError('Conta criada! Confirme seu e-mail (verifique spam) e faça login.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err?.message || 'Erro ao entrar com Google.')
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#121414] text-[#e3e2e2] font-sans flex items-center justify-center p-4">
      <div className="mesh-bg" />

      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center">
            <Database className="w-4 h-4 text-[#121414]" />
          </div>
          <span className="font-[family-name:var(--font-display)] font-bold text-lg">Foco em Dados</span>
        </Link>

        <div className="glassmorphism p-6 rounded-2xl space-y-5">
          <div className="text-center">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#ffe4af]">
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </h1>
            <p className="text-sm text-[#d4c5ab] mt-1">
              {mode === 'login' ? 'Acesse sua conta para continuar.' : 'Cadastre-se grátis e comece agora.'}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#d4c5ab] ml-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="input-mystic w-full h-10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#d4c5ab] ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4c5ab]/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-mystic w-full h-10 pl-10 pr-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#d4c5ab] ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4c5ab]/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="input-mystic w-full h-10 pl-10 pr-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full h-10 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#121414]/30 border-t-[#121414] rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#4f4632]/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#121414] px-2 text-[#d4c5ab]/60">ou</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            className="w-full h-10 rounded-lg border border-[#4f4632]/60 hover:border-[#fabd00]/50 text-sm font-medium text-[#e3e2e2] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? 'Aguardando Google...' : 'Entrar com Google'}
          </button>

          <button
            onClick={async () => {
              setError(null)
              try {
                await signInWithGithub()
              } catch (err: any) {
                setError(err?.message || 'Erro ao entrar com GitHub.')
              }
            }}
            className="w-full h-10 rounded-lg border border-[#4f4632]/60 hover:border-[#cdbdff]/50 text-sm font-medium text-[#e3e2e2] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.03 11.03 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
            {loading ? 'Aguardando GitHub...' : 'Entrar com GitHub'}
          </button>

          <p className="text-center text-xs text-[#d4c5ab]/60">
            {mode === 'login' ? (
              <>
                Ainda não tem conta?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null) }}
                  className="text-[#fabd00] hover:underline font-medium cursor-pointer"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null) }}
                  className="text-[#fabd00] hover:underline font-medium cursor-pointer"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
