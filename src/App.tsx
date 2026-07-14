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
import DashboardLayout from './components/DashboardLayout';
import { LayoutDashboard, Bot } from 'lucide-react';
import { auth } from './firebase-config';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

type View = 'landing' | 'bi' | 'login' | 'bot-factory' | 'privacy' | 'terms' | 'notfound';

const VIEW_METADATA: Record<View, { title: string; description: string }> = {
  landing: {
    title: 'Foco em Dados | Inteligência Artificial e BI Analytics para Empresas',
    description: 'Transforme os dados da sua empresa em decisões inteligentes.'
  },
  bi: {
    title: 'BI Analytics Engine | Foco em Dados',
    description: 'Analise e visualize suas planilhas Excel e CSV utilizando inteligência artificial.'
  },
  'bot-factory': {
    title: 'Fábrica de Bots de WhatsApp | Foco em Dados',
    description: 'Crie e configure robôs de conversação inteligentes integrados ao WhatsApp.'
  },
  login: {
    title: 'Entrar na Plataforma | Foco em Dados',
    description: 'Faça login com sua conta do Google para acessar a plataforma.'
  },
  privacy: {
    title: 'Política de Privacidade | Foco em Dados',
    description: 'Leia nossa Política de Privacidade.'
  },
  terms: {
    title: 'Termos de Serviço | Foco em Dados',
    description: 'Consulte os Termos e Condições de Uso da plataforma.'
  },
  notfound: {
    title: 'Página não encontrada | Foco em Dados',
    description: 'A página que você procura não existe ou foi movida.'
  }
};

const DASHBOARD_NAV = [
  { id: 'bi', label: 'BI Analytics Engine', icon: LayoutDashboard },
  { id: 'bot-factory', label: 'Fábrica de Bots', icon: Bot },
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const metadata = VIEW_METADATA[currentView] || VIEW_METADATA.landing;
    document.title = metadata.title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[${name.startsWith('og:') ? 'property' : 'name'}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('description', metadata.description);
    setMeta('og:title', metadata.title);
    setMeta('og:description', metadata.description);
  }, [currentView]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/fabrica-bots') setCurrentView('bot-factory');
      else if (path === '/bi') setCurrentView('bi');
      else if (path === '/login') setCurrentView('login');
      else if (path === '/privacidade') setCurrentView('privacy');
      else if (path === '/termos') setCurrentView('terms');
      else if (path === '/' || path === '') setCurrentView('landing');
      else setCurrentView('notfound');
    };
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (view: View) => {
    setCurrentView(view);
    const paths: Record<string, string> = {
      bi: '/bi', 'bot-factory': '/fabrica-bots', login: '/login',
      privacy: '/privacidade', terms: '/termos',
    };
    window.history.pushState(null, '', paths[view] || '/');
  };

  const handleNavigateToBI = () => navigateTo(user ? 'bi' : 'login');
  const handleNavigateToBotFactory = () => navigateTo(user ? 'bot-factory' : 'login');
  const handleLogout = async () => {
    try { await signOut(auth); navigateTo('landing'); }
    catch (error) { console.error("Erro ao realizar logout:", error); }
  };

  const isDashboardView = currentView === 'bi' || currentView === 'bot-factory';

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans relative">
      <AnimatePresence mode="wait">
        {!isDashboardView ? (
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-screen"
          >
            {currentView === 'landing' && (
              <LandingPage
                onNavigateToBI={handleNavigateToBI}
                onNavigateToLogin={() => navigateTo('login')}
                onNavigateToPrivacy={() => navigateTo('privacy')}
                onNavigateToTerms={() => navigateTo('terms')}
                onNavigateToBotFactory={handleNavigateToBotFactory}
                user={user}
                setUser={setUser}
              />
            )}
            {currentView === 'login' && (
              <Login
                onBack={() => navigateTo('landing')}
                onSuccess={(loggedInUser) => { setUser(loggedInUser); navigateTo('bi'); }}
              />
            )}
            {currentView === 'privacy' && <PrivacyPolicy onBack={() => navigateTo('landing')} />}
            {currentView === 'terms' && <TermsOfService onBack={() => navigateTo('landing')} />}
            {currentView === 'notfound' && <NotFound onBack={() => navigateTo('landing')} />}
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-screen"
          >
            <DashboardLayout
              currentView={currentView}
              navItems={DASHBOARD_NAV}
              onNavigate={(view) => navigateTo(view as View)}
              onBack={() => navigateTo('landing')}
              onLogout={handleLogout}
            >
              {currentView === 'bi' ? <PainelBI currentUser={user} /> : <ClientDashboard />}
            </DashboardLayout>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
