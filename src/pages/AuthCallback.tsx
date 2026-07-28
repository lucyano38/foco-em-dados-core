import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) {
        console.error('[AuthCallback] Nenhum access_token encontrado na URL');
        window.location.href = '/login';
        return;
      }

      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        console.error('[AuthCallback] access_token não extraído do hash');
        window.location.href = '/login';
        return;
      }

      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });

        if (error) {
          console.error('[AuthCallback] Erro no setSession:', error.message, error);
          window.location.href = '/login';
          return;
        }

        console.log('[AuthCallback] Sessão criada com sucesso:', data);

        // Full page reload para evitar race condition com React state
        window.location.href = '/app';
      } catch (err) {
        console.error('[AuthCallback] Exceção no setSession:', err);
        window.location.href = '/login';
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Autenticando...</p>
      </div>
    </div>
  );
}