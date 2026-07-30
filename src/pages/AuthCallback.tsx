import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      console.log("AuthCallback: Iniciando monitoramento de sessão...");

      // 1. Escuta mudanças no estado de autenticação
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log("AuthCallback: Evento SIGNED_IN detectado.");
          navigate('/app');
        }
      });

      // 2. Fallback: Checa se já existe sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("AuthCallback: Sessão encontrada no getSession.");
        navigate('/app');
        return;
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    handleAuth();
  }, [navigate]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', color: '#fff' }}>
      <p>Finalizando autenticação...</p>
    </div>
  );
}
