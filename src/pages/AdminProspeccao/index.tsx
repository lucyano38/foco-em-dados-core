import { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RedesignComparator from '../../components/RedesignComparator';
import { Database, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AdminProspeccao() {
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    document.title = 'Prospecção Redesign | Admin Foco em Dados';
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#121414] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#fabd00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="w-full min-h-screen bg-[#121414] text-[#e3e2e2] font-sans">
      <div className="mesh-bg" />

      <header className="border-b border-[#4f4632]/40 backdrop-blur-xl bg-[#121414]/70 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-[#121414]" />
            </div>
            <span className="font-bold text-sm">Prospecção Redesign</span>
            <span className="text-[10px] font-mono text-[#ffe4af] bg-[#fabd00]/10 px-2 py-0.5 rounded-full ml-2 border border-[#fabd00]/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> ADMIN ONLY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#d4c5ab] hover:text-[#e3e2e2] transition-colors">
              <ArrowLeft className="w-3 h-3" />
              Pipeline
            </Link>
            <Link to="/app" className="text-xs text-[#d4c5ab] hover:text-[#e3e2e2] transition-colors">Área do Cliente</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RedesignComparator />
      </main>
    </div>
  );
}