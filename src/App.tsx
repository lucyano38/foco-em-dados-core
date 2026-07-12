import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LandingPage from './components/LandingPage';
import PainelBI from './components/PainelBI';
import BotFactory from './components/BotFactory';
import ClientDashboard from './components/ClientDashboard';
import Login from './components/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import NotFound from './pages/NotFound';
import { ArrowLeft, Terminal, LayoutDashboard, Bot, Sparkles, LogOut } from 'lucide-react';
import { auth } from './firebase-config';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

const VIEW_METADATA = {
  landing: {
    title: 'Foco em Dados | Inteligência Artificial e BI Analytics para Empresas',
    description: 'Transforme os dados da sua empresa em decisões inteligentes. Descubra nosso BI Analytics de planilhas por IA e a nossa Fábrica de Bots inteligentes para WhatsApp.'
  },
  bi: {
    title: 'BI Analytics Engine | Foco em Dados',
    description: 'Analise e visualize suas planilhas Excel e CSV utilizando inteligência artificial de última geração. Crie gráficos, relatórios e obtenha insights instantâneos.'
  },
  'bot-factory': {
    title: 'Fábrica de Bots de WhatsApp | Foco em Dados',
    description: 'Crie e configure robôs de conversação inteligentes integrados ao WhatsApp. Automatize o atendimento da sua empresa de forma autônoma e personalizada.'
  },
  login: {
    title: 'Entrar na Plataforma | Foco em Dados',
    description: 'Faça login com sua conta do Google para acessar a plataforma Foco em Dados, o Painel de BI com IA e a Fábrica de Bots.'
  },
  privacy: {
    title: 'Política de Privacidade | Foco em Dados',
    description: 'Leia nossa Política de Privacidade. Saiba como a Foco em Dados protege seus dados, sua segurança e como tratamos o acesso ao Google Drive de forma estritamente transparente.'
  },
  terms: {
    title: 'Termos de Serviço | Foco em Dados',
    description: 'Consulte os Termos e Condições de Uso da plataforma Foco em Dados. Veja as diretrizes para uso aceitável de automações, bots de IA e BI Analytics.'
  },
  notfound: {
    title: 'Página não encontrada | Foco em Dados',
    description: 'A página que você procura não existe ou foi movida. Volte para a página inicial.'
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'bi' | 'login' | 'bot-factory' | 'privacy' | 'terms' | 'notfound'>('landing');
  const [user, setUser] = useState<User | null>(null);

  // Dynamically update SEO Titles & Meta tags
  useEffect(() => {
    const metadata = VIEW_METADATA[currentView] || VIEW_METADATA.landing;
    
    // 1. Update document title
    document.title = metadata.title;
    
    // 2. Update description meta tag
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', metadata.description);

    // 3. Update OG Title
    let ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (!ogTitleMeta) {
      ogTitleMeta = document.createElement('meta');
      ogTitleMeta.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitleMeta);
    }
    ogTitleMeta.setAttribute('content', metadata.title);

    // 4. Update OG Description
    let ogDescMeta = document.querySelector('meta[property="og:description"]');
    if (!ogDescMeta) {
      ogDescMeta = document.createElement('meta');
      ogDescMeta.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescMeta);
    }
    ogDescMeta.setAttribute('content', metadata.description);
  }, [currentView]);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Simple and robust routing listener for path-based deep linking
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/fabrica-bots') {
        setCurrentView('bot-factory');
      } else if (path === '/bi') {
        setCurrentView('bi');
      } else if (path === '/login') {
        setCurrentView('login');
      } else if (path === '/privacidade') {
        setCurrentView('privacy');
      } else if (path === '/termos') {
        setCurrentView('terms');
      } else if (path === '/' || path === '') {
        setCurrentView('landing');
      } else {
        setCurrentView('notfound');
      }
    };
    
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange(); // Run on mount
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Custom navigation wrapper to push state to window.history
  const navigateTo = (view: 'landing' | 'bi' | 'login' | 'bot-factory' | 'privacy' | 'terms' | 'notfound') => {
    setCurrentView(view);
    let path = '/';
    if (view === 'bi') path = '/bi';
    else if (view === 'bot-factory') path = '/fabrica-bots';
    else if (view === 'login') path = '/login';
    else if (view === 'privacy') path = '/privacidade';
    else if (view === 'terms') path = '/termos';
    
    window.history.pushState(null, '', path);
  };

  const handleNavigateToBI = () => {
    if (user) {
      navigateTo('bi');
    } else {
      navigateTo('login');
    }
  };

  const handleNavigateToBotFactory = () => {
    if (user) {
      navigateTo('bot-factory');
    } else {
      navigateTo('login');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigateTo('landing');
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans relative">
      <AnimatePresence mode="wait">
        {currentView === 'landing' ? (
          <motion.div
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen"
          >
            <LandingPage 
              onNavigateToBI={handleNavigateToBI} 
              onNavigateToLogin={() => navigateTo('login')}
              onNavigateToPrivacy={() => navigateTo('privacy')}
              onNavigateToTerms={() => navigateTo('terms')}
              onNavigateToBotFactory={handleNavigateToBotFactory}
              user={user}
              setUser={setUser}
            />
          </motion.div>
        ) : currentView === 'login' ? (
          <motion.div
            key="login-page"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen"
          >
            <Login 
              onBack={() => navigateTo('landing')} 
              onSuccess={(loggedInUser) => {
                setUser(loggedInUser);
                navigateTo('bi');
              }} 
            />
          </motion.div>
        ) : currentView === 'privacy' ? (
          <motion.div
            key="privacy-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen"
          >
            <PrivacyPolicy onBack={() => navigateTo('landing')} />
          </motion.div>
        ) : currentView === 'terms' ? (
          <motion.div
            key="terms-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen"
          >
            <TermsOfService onBack={() => navigateTo('landing')} />
          </motion.div>
        ) : currentView === 'notfound' ? (
          <motion.div
            key="notfound-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen"
          >
            <NotFound onBack={() => navigateTo('landing')} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen flex flex-col md:flex-row bg-slate-950"
          >
            {/* Left Sidebar (Menu Lateral do Painel) */}
            <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 z-40">
              {/* Brand Header */}
              <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between md:justify-start gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="font-bold text-sm bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">Foco em Dados</span>
                    <span className="block text-[8px] text-cyan-400 font-semibold tracking-widest uppercase">Ecosystem</span>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-3 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible items-center md:items-stretch">
                <div className="hidden md:block px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 select-none">
                  Painel de Controle
                </div>
                
                <button
                  onClick={() => navigateTo('bi')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 w-auto md:w-full ${
                    currentView === 'bi'
                      ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>BI Analytics Engine</span>
                </button>

                <button
                  onClick={() => navigateTo('bot-factory')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 w-auto md:w-full ${
                    currentView === 'bot-factory'
                      ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
                  }`}
                >
                  <Bot className="w-4 h-4 shrink-0" />
                  <span>Fábrica de Bots</span>
                </button>
              </nav>

              {/* Sidebar Footer Actions */}
              <div className="p-3 md:p-4 border-t border-slate-800 flex flex-col gap-2 mt-auto w-full md:w-auto">
                <button
                  onClick={() => navigateTo('landing')}
                  className="flex items-center gap-2 px-3 py-2 md:py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-xl transition-all cursor-pointer w-full justify-center md:justify-start"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Site</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 md:py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl border border-transparent hover:border-red-500/10 transition-all cursor-pointer w-full justify-center md:justify-start"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 flex flex-col min-w-0">
              {/* Top Bar Info */}
              <div className="w-full bg-slate-950 border-b border-slate-900 h-14 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                    Painel {currentView === 'bi' ? 'BI Analytics' : 'Fábrica de Bots'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>focoemdados.com.br{currentView === 'bi' ? '/bi' : '/fabrica-bots'}</span>
                </div>
              </div>

              {/* Render dynamic dashboard view */}
              <div className="flex-1 w-full overflow-y-auto">
                {currentView === 'bi' ? <PainelBI currentUser={user} /> : <ClientDashboard />}
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
