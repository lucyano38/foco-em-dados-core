import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugLog((prev) => [...prev, message]);
  };

  useEffect(() => {
    const handleAuth = async () => {
      addLog("Detectando hash na URL...");
      const hash = window.location.hash;

      if (!hash || !hash.includes('access_token')) {
        addLog("Token encontrado: Não");
        addLog("Erro encontrado: Nenhum access_token encontrado na URL");
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        return;
      }

      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        addLog("Token encontrado: Não");
        addLog("Erro encontrado: access_token não extraído do hash");
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        return;
      }

      addLog("Token encontrado: Sim");

      try {
        addLog("Chamando setSession...");
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });

        if (error) {
          addLog(`Erro encontrado: ${error.message}`);
          setTimeout(() => {
            window.location.href = '/login';
          }, 4000);
          return;
        }

        addLog("Sucesso! Redirecionando...");
        setTimeout(() => {
          window.location.href = '/app';
        }, 1500);
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        addLog(`Erro encontrado: ${errorMsg}`);
        setTimeout(() => {
          window.location.href = '/login';
        }, 4000);
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 max-w-lg w-full">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Autenticando...</p>
        
        <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 shadow-xl space-y-2 mt-4 text-left overflow-x-auto">
          <div className="text-cyan-400 font-semibold mb-2 border-b border-slate-800 pb-1">
            Debug Log:
          </div>
          {debugLog.length === 0 ? (
            <div className="text-slate-500 italic">Iniciando...</div>
          ) : (
            debugLog.map((log, index) => (
              <div 
                key={index} 
                className={
                  log.includes('Erro') 
                    ? 'text-red-400' 
                    : log.includes('Sucesso') 
                    ? 'text-green-400' 
                    : 'text-slate-300'
                }
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
