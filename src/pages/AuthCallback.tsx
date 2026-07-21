import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/app', { replace: true })
      } else {
        const params = new URLSearchParams(window.location.hash.replace('#', '?'))
        const error = params.get('error_description') || params.get('error')
        if (error) {
          alert('Erro de Autenticação: ' + decodeURIComponent(error))
        }
        navigate('/login', { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Autenticando...</p>
      </div>
    </div>
  )
}
