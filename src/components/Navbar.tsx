import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Database, Shield, Sparkles, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#4f4632]/40 backdrop-blur-xl bg-[#121414]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Database className="w-4 h-4 text-[#121414]" />
          </div>
          <span className="font-[family-name:var(--font-display)] font-bold text-lg tracking-tight text-[#e3e2e2]">
            Foco em Dados
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#d4c5ab]">
          <a href="#pilares" className="nav-link px-2 py-1 rounded-lg hover:text-[#e3e2e2]">Soluções</a>
          <a href="#funil" className="nav-link px-2 py-1 rounded-lg hover:text-[#e3e2e2]">Funil de Prospecção</a>
          <Link to="/precos" className="nav-link px-2 py-1 rounded-lg hover:text-[#e3e2e2]">Planos</Link>
          {isAdmin && (
            <Link to="/admin/prospeccao" className="nav-link px-2 py-1 rounded-lg hover:text-[#ffe4af] flex items-center gap-1 font-bold text-[#fabd00]">
              <Sparkles className="w-3.5 h-3.5" />
              Prospecção Redesign
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/automacao" className="nav-link px-2 py-1 rounded-lg hover:text-[#ffe4af] flex items-center gap-1 font-bold text-[#fabd00]">
              <Shield className="w-3.5 h-3.5" />
              Admin Automação
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/app"
              className="btn-glow h-9 px-4 rounded-lg text-sm flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="h-9 px-4 rounded-lg border border-[#4f4632]/60 hover:border-[#fabd00]/50 text-sm font-medium text-[#d4c5ab] hover:text-[#ffe4af] transition-all flex items-center"
              >
                Entrar
              </Link>
              <Link
                to="/login"
                className="btn-glow h-9 px-4 rounded-lg text-sm flex items-center gap-2"
              >
                Começar Agora
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
