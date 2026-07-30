import { useState } from 'react';
import { BarChart3, ArrowRight, Bot, Zap, Rocket, Check, Play, LogOut, LogIn, MessageCircle, Shield, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  onNavigateToBI: () => void;
  onNavigateToLogin: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToBotFactory?: () => void;
}

export default function LandingPage({ 
  onNavigateToBI, 
  onNavigateToLogin, 
  onNavigateToBotFactory,
}: LandingPageProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen text-slate-100 font-sans relative overflow-x-hidden bg-slate-950">
      {/* Background Mesh */}
      <div className="mesh-bg absolute inset-0 z-0 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-slate-950/60 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              <BarChart3 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">Foco em Dados</span>
              <span className="block text-[10px] text-cyan-400 font-semibold tracking-widest uppercase">Ecosystem</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <button 
              onClick={onNavigateToBotFactory} 
              className="hover:text-cyan-400 transition-all bg-transparent border-0 cursor-pointer text-slate-400 font-medium text-sm"
            >
              Fábrica de Bots
            </button>
            <button 
              onClick={onNavigateToBI}
              className="hover:text-cyan-400 transition-all bg-transparent border-0 cursor-pointer text-slate-400 font-medium text-sm"
            >
              Dashboard BI
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img 
                    src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || user?.email || 'User'}`} 
                    alt="User Profile" 
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]" 
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-200 leading-none">{user?.user_metadata?.full_name || 'Usuário'}</span>
                    <span className="text-[9px] text-slate-500 font-mono leading-none mt-1">{user?.email}</span>
                  </div>
                </div>

                <button 
                  onClick={onNavigateToBI}
                  className="inline-flex items-center justify-center text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-4 h-10 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all cursor-pointer"
                >
                  Acessar Painel
                </button>

                <button 
                  onClick={async () => { await signOut(); }}
                  className="inline-flex items-center justify-center text-xs font-bold text-red-400 hover:text-red-300 border border-white/5 bg-white/5 px-3 h-10 rounded-xl transition-all cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={onNavigateToLogin}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 border border-white/5 bg-white/5 hover:bg-white/10 px-4 h-10 rounded-xl transition-all cursor-pointer"
                >
                  Entrar
                </button>

                <button 
                  onClick={onNavigateToBI}
                  className="inline-flex items-center justify-center text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-5 h-10 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all cursor-pointer"
                >
                  Começar de Graça
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (SaaS Hero Style - Tripo.ai inspired) */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto z-10 text-center">
        <div className="glass-panel p-8 sm:p-14 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] relative overflow-hidden">
          
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-xs text-cyan-300 font-semibold tracking-wide mb-6 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Zap className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            Ecossistema SaaS de Inteligência e Automação
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            Transforme dados em <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">máquinas de faturamento</span> 24/7.
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Elimine planilhas manuais e decifre insights em segundos com nosso BI Inteligente e Fábrica de Robôs de Atendimento para WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onNavigateToBI}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-extrabold text-base bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 px-8 h-14 rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Começar de Graça
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>
            <button 
              onClick={onNavigateToBotFactory}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold text-base text-slate-200 border border-white/10 hover:border-cyan-500/30 bg-white/5 hover:bg-white/10 px-8 h-14 rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              Explorar Fábrica de Bots
            </button>
          </div>
        </div>

        {/* Faixa de Logotipos e Autoridade */}
        <div className="mt-20 pt-10 border-t border-white/5">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-8">
            Confiado por centenas de empresas e agências de alta performance
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-center opacity-60">
            <div className="glass-card py-4 px-6 rounded-xl text-sm font-bold tracking-wider text-slate-400 border border-white/5">
              🚀 DATACORP
            </div>
            <div className="glass-card py-4 px-6 rounded-xl text-sm font-bold tracking-wider text-slate-400 border border-white/5">
              ⚡ OMNI BOT
            </div>
            <div className="glass-card py-4 px-6 rounded-xl text-sm font-bold tracking-wider text-slate-400 border border-white/5">
              💎 RETAIL AI
            </div>
            <div className="glass-card py-4 px-6 rounded-xl text-sm font-bold tracking-wider text-slate-400 border border-white/5">
              📈 SCALE METRICS
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
