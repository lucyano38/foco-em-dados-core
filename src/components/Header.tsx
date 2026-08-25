import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database, ArrowRight } from 'lucide-react';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [processingCode, setProcessingCode] = useState(false);
  const [authOk, setAuthOk] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    let cancelled = false;
    setProcessingCode(true);
    setAuthOk(false);

    (async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data?.session) {
          console.error('[Header] Falha ao trocar code por sessão:', error?.message || 'sem sessão');
        } else {
          const cleanUrl = `${window.location.pathname}${window.location.hash}`;
          window.history.replaceState(null, '', cleanUrl);
          setAuthOk(true);
        }
      } catch (err: any) {
        console.error('[Header] Erro no callback Google:', err?.message || err);
      } finally {
        if (!cancelled) setProcessingCode(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B1220]/70 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D97706] to-[#1E40AF] flex items-center justify-center shadow-[0_0_12px_rgba(217,119,6,0.25)]">
            <Database className="w-4 h-4 text-white" />
          </div>
          <span className="font-[family-name:var(--font-display)] font-bold text-2xl tracking-tighter text-[#FFFBEB]">Foco em Dados</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#solucoes" className="hover:text-[#FFFBEB] transition-colors border-b-2 border-transparent hover:border-[#D97706] pb-0.5">Soluções</a>
          <a href="#setores" className="hover:text-[#FFFBEB] transition-colors">Setores</a>
          <a href="#resultados" className="hover:text-[#FFFBEB] transition-colors">Resultados</a>
          <Link to="/precos" className="hover:text-[#FFFBEB] transition-colors">Preços</Link>
        </nav>
        <div className="flex items-center gap-4">
          {processingCode ? (
            <span className="text-xs text-[#D97706]">Validando login...</span>
          ) : authOk && user && isAdmin ? (
            <span className="text-xs text-[#4ade80]">Auth Google validado e Painel Admin liberado no Header</span>
          ) : user && isAdmin ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#FFFBEB] truncate max-w-[180px]">{user.email}</span>
              <button
                onClick={() => navigate('/admin')}
                className="h-10 px-5 rounded-full bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(217,119,6,0.35)] hover:scale-105 active:scale-95 cursor-pointer"
              >
                Painel Admin
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
                className="text-xs text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
              >
                Sair
              </button>
            </div>
          ) : user ? (
            <Link
              to="/app"
              className="h-10 px-5 rounded-full bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(217,119,6,0.35)] hover:scale-105 active:scale-95"
            >
              Acessar Painel
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-[#FFFBEB] transition-colors">Entrar</Link>
              <Link
                to="/login"
                className="h-10 px-5 rounded-full bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(217,119,6,0.35)] hover:scale-105 active:scale-95"
              >
                Começar Agora
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
