import { type ReactNode } from 'react';
import { ArrowLeft, LayoutDashboard, Bot, LogOut, Terminal } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface DashboardLayoutProps {
  currentView: string;
  children: ReactNode;
  navItems: NavItem[];
  onNavigate: (view: string) => void;
  onBack: () => void;
  onLogout: () => void;
}

export default function DashboardLayout({
  currentView,
  children,
  navItems,
  onNavigate,
  onBack,
  onLogout,
}: DashboardLayoutProps) {
  const activeNav = navItems.find((item) => item.id === currentView);

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-slate-950">
      <aside className="w-full md:w-56 bg-gradient-to-b from-slate-950 via-slate-900/80 to-slate-950 border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col shrink-0 z-40">
        <div className="p-4 md:p-5 border-b border-white/[0.06] flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight leading-none block">
                Foco em Dados
              </span>
              <span className="block text-[7px] text-cyan-400/80 font-semibold tracking-[0.2em] uppercase mt-0.5">
                Ecosystem
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 md:p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible items-center md:items-stretch">
          <div className="hidden md:block px-3 py-1.5 text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1 select-none">
            Navegação
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer shrink-0 w-auto md:w-full ${
                  isActive
                    ? 'nav-link active'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 md:p-4 border-t border-white/[0.06] flex flex-col gap-1 mt-auto w-full md:w-auto">
          <button
            onClick={onBack}
            className="nav-link flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 rounded-lg transition-all duration-150 cursor-pointer w-full justify-center md:justify-start"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Site</span>
          </button>
          <button
            onClick={onLogout}
            className="nav-link flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-400 rounded-lg transition-all duration-150 cursor-pointer w-full justify-center md:justify-start"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-white/[0.06] h-12 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              {activeNav?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
            <Terminal className="w-3 h-3" />
            <span>focoemdados.com.br/{currentView}</span>
          </div>
        </header>

        <div className="flex-1 w-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
