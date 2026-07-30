import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const [errorState, setErrorState] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      console.log("AuthCallback: Iniciando processamento do callback...");

      const hash = window.location.hash;
      const search = window.location.search;

      try {
        // 1. Se houver tokens no hash da URL (OAuth implicit flow)
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.replace('#', '?'));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            console.log("AuthCallback: Token detectado na URL, salvando sessão...");
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken ?? '',
            });

            if (error) {
              console.error("AuthCallback: Erro ao definir sessão:", error.message);
              throw error;
            }

            console.log("AuthCallback: Sessão salva com sucesso. Redirecionando para /app...");
            window.location.replace('/app');
            return;
          }
        }

        // 2. Se houver código PKCE (?code=...) na query string
        if (search && search.includes('code=')) {
          console.log("AuthCallback: Código PKCE detectado na query string. O cliente Supabase processará automaticamente.");
          // Aguarda um momento para o Supabase processar o código via detectSessionInUrl: true
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (session) {
            console.log("AuthCallback: Sessão PKCE obtida com sucesso. Redirecionando para /app...");
            window.location.replace('/app');
            return;
          }
        }

        // 3. Fallback geral: verificar se já existe sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("AuthCallback: Sessão ativa encontrada. Redirecionando para /app...");
          window.location.replace('/app');
          return;
        }

        // Se chegou aqui sem token nem sessão após 2 segundos, falha
        console.warn("AuthCallback: Nenhum token ou sessão válida encontrados.");
        throw new Error("Sessão não encontrada.");

      } catch (err: any) {
        console.error("AuthCallback erro:", err);
        setErrorState(true);
        setTimeout(() => {
          window.location.replace('/login');
        }, 3000);
      }
    };

    handleAuth();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      color: '#fff',
      padding: '20px'
    }}>
      {errorState ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '8px' }}>Erro ao autenticar, redirecionando...</p>
          <p style={{ color: '#9ca3af', fontSize: '12px' }}>Voltando para o login em instantes.</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #22d3ee',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px auto'
          }} />
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>Autenticando e abrindo o sistema...</p>
        </div>
      )}
    </div>
  );
}
