import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from 'lucide-react';

const MAX_WAIT_MS = 8000;
const POLL_INTERVAL_MS = 500;

export default function AuthCallback() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [message, setMessage] = useState('Autenticando e abrindo o sistema...');

  useEffect(() => {
    let cancelled = false;

    const handleAuth = async () => {
      console.log('[AuthCallback] processando callback...');
      const params = new URLSearchParams(window.location.search);

      // Erro enviado pelo provedor OAuth (ex.: usuário cancelou, configuração inválida)
      const oauthError = params.get('error') || params.get('error_description');
      if (oauthError) {
        console.error('[AuthCallback] erro do provedor OAuth:', oauthError);
        setMessage('Falha no login com Google. Verifique se o provedor OAuth está habilitado no Supabase e as URLs de redirecionamento.');
        setStatus('error');
        setTimeout(() => {
          if (!cancelled) window.location.replace('/login');
        }, 4000);
        return;
      }

      // 1. Tokens no hash (implicit flow — raridade com PKCE, mantido por compatibilidade)
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') ?? '',
        });
        if (error) {
          console.error('[AuthCallback] erro ao definir sessão:', error.message);
        } else if (!cancelled) {
          window.location.replace('/app');
          return;
        }
      }

      // 2. Fluxo PKCE (?code=...): o supabase-js troca o código automaticamente
      // via detectSessionInUrl, mas há uma corrida: esperamos a sessão aparecer.
      const startedAt = Date.now();
      while (Date.now() - startedAt < MAX_WAIT_MS) {
        if (cancelled) return;
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthCallback] erro ao obter sessão:', error.message);
          break;
        }
        if (session?.user) {
          console.log('[AuthCallback] sessão obtida, redirecionando para /app');
          window.location.replace('/app');
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      // 3. Fallback: sessão já existente de outro login
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (existing?.user && !cancelled) {
        window.location.replace('/app');
        return;
      }

      console.warn('[AuthCallback] nenhuma sessão válida encontrada após espera.');
      setMessage('Não foi possível concluir a autenticação. Você será redirecionado para o login.');
      setStatus('error');
      setTimeout(() => {
        if (!cancelled) window.location.replace('/login');
      }, 3000);
    };

    handleAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#121414] text-[#e3e2e2] font-sans flex items-center justify-center p-4">
      <div className="mesh-bg" />
      <div className="glassmorphism rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center mx-auto">
          <Database className="w-5 h-5 text-[#121414]" />
        </div>
        {status === 'processing' ? (
          <>
            <div className="w-8 h-8 border-2 border-[#fabd00] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#d4c5ab]">{message}</p>
          </>
        ) : (
          <p className="text-sm text-red-400">{message}</p>
        )}
      </div>
    </div>
  );
}
