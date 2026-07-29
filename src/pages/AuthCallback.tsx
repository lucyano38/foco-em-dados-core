import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      console.log("AuthCallback: Iniciando processo de autenticação...");
      const hash = window.location.hash;

      if (!hash || !hash.includes('access_token')) {
        console.error("AuthCallback: Nenhum access_token encontrado na URL.");
        window.location.replace('/login');
        return;
      }

      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        console.error("AuthCallback: access_token não extraído.");
        window.location.replace('/login');
        return;
      }

      console.log("AuthCallback: Token detectado, salvando sessão...");

      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });

        if (error) {
          console.error("AuthCallback: Erro ao salvar sessão:", error.message);
          window.location.replace('/login');
          return;
        }

        console.log("AuthCallback: Sessão salva com sucesso. Redirecionando para /app.");
        window.location.replace('/app');
      } catch (err: any) {
        console.error("AuthCallback: Erro inesperado:", err);
        window.location.replace('/login');
      }
    };

    handleAuth();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      Processando autenticação...
    </div>
  );
}
