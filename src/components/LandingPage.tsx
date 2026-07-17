import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, TrendingUp, DollarSign, Package, RefreshCw, Plus, Trash2, 
  Sliders, Info, ToggleLeft, LayoutDashboard, Database, Upload, Download, 
  Sparkles, Send, MessageSquare, X, ChevronRight, Filter, CheckCircle2,
  FileSpreadsheet, HelpCircle, ArrowRight, Bot, Zap, Rocket, Globe, Shield,
  Layers, Users, Share2, Code, Mail, Smartphone, ArrowDown, ChevronDown, Check, Play, LogOut, LogIn, MessageCircle
} from 'lucide-react';
import { auth, signInWithGoogle, logOut } from '../firebase-config';
import { onAuthStateChanged, User } from 'firebase/auth';

interface LandingPageProps {
  onNavigateToBI: () => void;
  onNavigateToLogin: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToBotFactory?: () => void;
  user: any;
  setUser: (user: any) => void;
}

import { loadStripe } from '@stripe/stripe-js';
import QRCodeModal from './QRCodeModal';

// Substitua esta chave pela sua chave publicável (Publishable Key) do painel do Stripe
const stripePromise = loadStripe('pk_test_YOUR_STRIPE_PUBLISHABLE_KEY');

export default function LandingPage({ 
  onNavigateToBI, 
  onNavigateToLogin, 
  onNavigateToPrivacy,
  onNavigateToTerms,
  onNavigateToBotFactory,
  user,
  setUser 
}: LandingPageProps) {

  // Estados para as interações dos playgrounds
  const [activeTab, setActiveTab] = useState<'bi' | 'bots' | 'marketing'>('bi');
  
  // Playground 2: Bots - Configuração do simulador
  const [botNiche, setBotNiche] = useState('E-commerce');
  const [botChannel, setBotChannel] = useState('WhatsApp');
  const [botVoice, setBotVoice] = useState('Persuasivo/Vendedor');
  const [botGoal, setBotGoal] = useState('Capturar Lead e Agendar');
  const [botLoading, setBotLoading] = useState(false);
  const [botResult, setBotResult] = useState<any | null>(null);

  // Playground 3: Marketing - Configuração do gerador de copy
  const [mktProduct, setMktProduct] = useState('Mentoria Foco em Dados');
  const [mktDescription, setMktDescription] = useState('Treinamento prático de automação de BI e criação de robôs de processos corporativos.');
  const [mktAudience, setMktAudience] = useState('Donos de Agências, Empresários e Profissionais de TI');
  const [mktHook, setMktHook] = useState('PAS (Problema, Agitação, Solução)');
  const [mktLoading, setMktLoading] = useState(false);
  const [mktResult, setMktResult] = useState<any | null>(null);

  // Backstage: Links de Checkout do STRIPE (persistem no localStorage)
  const [stripeProUrl, setStripeProUrl] = useState(() => {
    const saved = localStorage.getItem('stripe_pro_url');
    if (!saved || saved === 'https://buy.stripe.com/mock_stripe_pro_4990') {
      return 'https://buy.stripe.com/dRm9AT7ZNfk65yba5K5Vu02';
    }
    return saved;
  });
  const [stripePremiumUrl, setStripePremiumUrl] = useState(() => {
    const saved = localStorage.getItem('stripe_premium_url');
    if (!saved || saved === 'https://buy.stripe.com/mock_stripe_premium_9900' || saved === 'https://buy.stripe.com/test_5kQ6oH2Fh90GcazgDo4gg00') {
      return 'https://buy.stripe.com/9B600j4NBc7UaSv4Lq5Vu01';
    }
    return saved;
  });
  const [stripeEnterpriseUrl, setStripeEnterpriseUrl] = useState(() => {
    const saved = localStorage.getItem('stripe_enterprise_url');
    if (!saved || saved === 'https://buy.stripe.com/mock_stripe_enterprise_49900') {
      return 'https://buy.stripe.com/6oUdR94NB8VIe4H7XC5Vu00';
    }
    return saved;
  });
  const [savedConfig, setSavedConfig] = useState(false);

  // Backstage: Linguagem preferida no snippet de código do webhook
  const [codeLanguage, setCodeLanguage] = useState<'typescript' | 'python'>('typescript');

  // Estado para simulação de compra/checkout
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'paid_simulated'>('select');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // WhatsApp QR Modal State
  const [showWaModal, setShowWaModal] = useState(false);
  const [waQrLoading, setWaQrLoading] = useState(false);
  const [waQrImage, setWaQrImage] = useState<string | null>(null);
  const [waQrError, setWaQrError] = useState<string | null>(null);

  const fetchWaQrCode = async () => {
    setWaQrLoading(true);
    setWaQrError(null);
    try {
      const response = await fetch('/get-qr');
      if (!response.ok) {
        throw new Error('Falha ao obter o QR Code. Tente novamente.');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const qr = data.qr || data.image || data.qrCode || data.url;
        if (qr) {
          if (qr.startsWith('data:image') || qr.startsWith('http')) {
            setWaQrImage(qr);
          } else {
            setWaQrImage(`data:image/png;base64,${qr}`);
          }
        } else {
          throw new Error('Nenhum QR Code retornado no JSON.');
        }
      } else {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setWaQrImage(imageUrl);
      }
    } catch (error: any) {
      console.warn("[WhatsApp QR] Erro ao carregar da API de QR Code:", error.message || error);
      setWaQrError(error.message || 'Erro ao conectar com a API de QR Code. Por favor, tente novamente.');
      setWaQrImage(null);
    } finally {
      setWaQrLoading(false);
    }
  };

  const handleConnectWhatsApp = () => {
    setShowWaModal(true);
    fetchWaQrCode();
  };

  // Estatísticas flutuantes do Hero (Simulação em tempo real)
  const [liveStats, setLiveStats] = useState({
    conversao: 12.4,
    leadCost: 2.15,
    botsAtivos: 842,
    faturamentoGerado: 142850
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        conversao: parseFloat((prev.conversao + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        leadCost: parseFloat((prev.leadCost + (Math.random() * 0.1 - 0.05)).toFixed(2)),
        botsAtivos: prev.botsAtivos + (Math.random() > 0.7 ? 1 : 0),
        faturamentoGerado: prev.faturamentoGerado + Math.floor(Math.random() * 15)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const saveCheckoutUrls = () => {
    localStorage.setItem('stripe_pro_url', stripeProUrl);
    localStorage.setItem('stripe_premium_url', stripePremiumUrl);
    localStorage.setItem('stripe_enterprise_url', stripeEnterpriseUrl);
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 3000);
  };

  // Função para simular criação de Bot
  const handleSimulateBot = async () => {
    setBotLoading(true);
    try {
      const response = await fetch('/api/simulate-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: botNiche, channel: botChannel, voice: botVoice, goal: botGoal })
      });
      if (!response.ok) throw new Error('Falha no servidor');
      const data = await response.json();
      setBotResult(data);
    } catch (error) {
      console.warn('Usando fallback local para simulação de bot:', error);
      let flow = [];
      let copyText = '';
      
      if (botNiche === 'E-commerce') {
        flow = [
          { step: '1. Saudação Inteligente', desc: 'Olá! Bem-vindo à nossa loja automatizada. Identifiquei que você veio através de nossa campanha de novidades. Como posso te chamar?' },
          { step: '2. Qualificação por Interesse', desc: 'Perfeito, {Nome}! Você gostaria de ver os mais vendidos da categoria Modas, Eletrônicos ou conferir seu cupom de 10%?' },
          { step: '3. Apresentação Direta', desc: 'Excelente escolha. Aqui está o link com frete grátis e o cupom ATIVADO: {Link_Personalizado}. Posso reservar seu carrinho agora para garantir o desconto?' },
          { step: '4. Fechamento e Transição de Status', desc: 'Ótimo, seu pedido foi enviado para o nosso checkout integrado. Vou enviar o comprovante Pix por aqui para você realizar a aprovação instantânea.' }
        ];
        copyText = `💡 *Roteiro de Atendimento para E-commerce - Canal ${botChannel}* (Tom: ${botVoice})\n` +
          `• Gatilho: Clique no anúncio ou palavra-chave "Quero Desconto".\n` +
          `• Objetivo: Reduzir carrinho abandonado e triplicar vendas no Pix.\n` +
          `• Conversão Esperada: +28% de faturamento recuperado de forma 100% autônoma.`;
      } else if (botNiche === 'Serviços/Agência') {
        flow = [
          { step: '1. Diagnóstico de Negócios', desc: 'Olá! Eu sou o assistente de triagem da nossa agência de crescimento. Qual é o faturamento médio atual da sua empresa hoje?' },
          { step: '2. Mapeamento de Gargalos', desc: 'Entendi. E hoje, qual o seu maior desafio de crescimento: Falta de Leads qualificados, Processos manuais lentos ou falta de dashboards de BI?' },
          { step: '3. Demonstração de Autoridade', desc: 'Compreendo perfeitamente. Sabia que empresas do seu nicho aumentam a eficiência em 40% nas primeiras 2 semanas usando o Foco em Dados? Vamos agendar um diagnóstico de 15 min?' },
          { step: '4. Agendamento Concluído', desc: 'Conectado à agenda do especialista! Por favor, selecione o melhor horário no link: {Calendly_Url}. Estaremos te esperando!' }
        ];
        copyText = `💡 *Roteiro de Triagem de Leads - Canal ${botChannel}* (Tom: ${botVoice})\n` +
          `• Gatilho: Usuário clica no botão "Falar com Consultor".\n` +
          `• Objetivo: Qualificar Leads frios e agendar reuniões apenas com quem tem orçamento.\n` +
          `• Conversão Esperada: Redução de 70% no tempo gasto pela equipe comercial com curiosos.`;
      } else {
        flow = [
          { step: '1. Resposta Rápida 24/7', desc: 'Olá! Sou o assistente inteligente da clínica/empresa local. Qual serviço ou especialidade você gostaria de agendar hoje?' },
          { step: '2. Disponibilidade da Agenda', desc: 'Para essa semana temos horários na Terça-feira às 14h ou Quinta-feira às 10h. Qual fica melhor para você?' },
          { step: '3. Coleta de Cadastro', desc: 'Excelente. Me informe seu Nome completo e CPF para criarmos sua ficha de atendimento instantaneamente no nosso sistema.' },
          { step: '4. Confirmação do Slot', desc: 'Confirmado! Seu horário foi reservado. Acabamos de te enviar o lembrete de confirmação de presença automática.' }
        ];
        copyText = `💡 *Roteiro de Atendimento Local - Canal ${botChannel}* (Tom: ${botVoice})\n` +
          `• Gatilho: Entrada de lead pelo Google Meu Negócio ou botão do site.\n` +
          `• Objetivo: Agendar consultas ou serviços locais de forma imediata sem atendente humano.\n` +
          `• Conversão Esperada: Ocupação total da agenda comercial mesmo fora do horário de expediente.`;
      }

      setBotResult({ flow, copyText });
    } finally {
      setBotLoading(false);
    }
  };

  // Função para simular criação de Copy
  const handleSimulateMarketing = async () => {
    setMktLoading(true);
    try {
      const response = await fetch('/api/simulate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: mktProduct, description: mktDescription, audience: mktAudience, hook: mktHook })
      });
      if (!response.ok) throw new Error('Falha no servidor');
      const data = await response.json();
      setMktResult(data);
    } catch (error) {
      console.warn('Usando fallback local para simulação de marketing:', error);
      let copy = {
        headline: '',
        primaryText: '',
        description: '',
        cta: '',
        imageSuggestion: ''
      };

      if (mktHook.includes('PAS')) {
        copy = {
          headline: `⚠️ CHEGA DE DECIDIR NO ACHISMO: Pare de queimar dinheiro em anúncios sem saber o seu ROI exato.`,
          primaryText: `Você passa o dia inteiro atualizando planilhas de faturamento e mesmo assim sente que sua empresa está estagnada?\n\n[PROBLEMA] A falta de dados consolidados e a lentidão na tomada de decisões é o assassino silencioso de empresas brasileiras hoje. Você gasta fortunas em tráfego pago mas não sabe qual produto dá mais lucro real.\n\n[AGITAÇÃO] Enquanto você tenta decifrar tabelas complexas, seus concorrentes estão usando robôs para fechar clientes no WhatsApp e IA para extrair gráficos de faturamento em 5 segundos.\n\n[SOLUÇÃO] Conheça o Ecossistema Foco em Dados: a única solução de dados do mercado que unifica BI Inteligente, robôs de WhatsApp de alta conversão e automações de tráfego que escalam suas vendas de forma 100% autônoma.`,
          description: `🔗 Pare de chutar dados. Assine agora o Foco em Dados e turbine seu crescimento corporativo hoje mesmo!`,
          cta: `Quero Automatizar Minha Empresa`,
          imageSuggestion: `Criativo tecnológico em Slate/Dark. Um executivo olhando para um painel holográfico de BI com linhas de lucro crescendo e um robô de WhatsApp trabalhando ao lado. Texto centralizado: "Decisões baseadas em Dados = Lucro 3x maior".`
        };
      } else if (mktHook.includes('AIDA')) {
        copy = {
          headline: `🔥 REVELADO: O Segredo de BI e Robôs de WhatsApp das Maiores Empresas que Faturam 7 Dígitos.`,
          primaryText: `[ATENÇÃO] Se você quer escalar seu negócio para o próximo nível sem contratar uma equipe gigante de TI, leia isto com atenção.\n\n[INTERESSE] Nosso ecossistema unifica inteligência analítica com automações operacionais brutas. Você faz o upload de qualquer planilha Excel e nosso assistente de IA extrai relatórios de faturamento, margem e tendências em segundos.\n\n[DESEJO] Além disso, você ganha acesso aos nossos Bots de WhatsApp focados em vendas que qualificam, atendem e enviam o link de pagamento Pix automaticamente para seus clientes 24 horas por dia.\n\n[AÇÃO] Chega de processos lentos. Clique no botão abaixo para escolher o seu plano e automatizar sua operação agora mesmo.`,
          description: `🚀 SaaS de Dados + Chatbot de IA + Automação de Briefing. Planos a partir de R$ 49,90/mês.`,
          cta: `Quero Acesso Instantâneo`,
          imageSuggestion: `Banner limpo e corporativo. Contraste profundo de fundo escuro com linhas ciano e azul. Na imagem, uma tela de smartphone mostrando o chatbot enviando links de cobrança e, no fundo, um gráfico de Power BI explodindo de crescimento.`
        };
      } else {
        copy = {
          headline: `💡 Como este simples sistema de dados economizou 180 horas de trabalho manual de empresários e dobrou a conversão.`,
          primaryText: `\"Eu vivia escravo do Excel. Passava as noites cruzando dados e montando apresentações. Hoje, meu sistema faz tudo em 3 segundos e meus robôs vendem por mim enquanto durmo.\"\n\nEsta é a história de centenas de empresários que adotaram o Foco em Dados.\n\nNós eliminamos todo o trabalho chato. O software lê seus arquivos de vendas, monta gráficos interativos e prevê as tendências do seu estoque para os próximos meses.\n\nE com a Fábrica de Automações, nós plugamos um cérebro de inteligência artificial diretamente no seu funil comercial para que você nunca mais perca um lead por falta de atendimento rápido.`,
          description: `📈 Uma verdadeira revolução de IA para negócios modernos. Sem setup complexo.`,
          cta: `Quero Testar a Demo Grátis`,
          imageSuggestion: `Gráficos de barras interativos e limpos em degradê azul/ciano. Uma linha de tendência projeta o crescimento futuro com a marcação "Foco em Dados AI".`
        };
      }
      setMktResult(copy);
    } finally {
      setMktLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    try {
      // Como o método client-side stripe.redirectToCheckout foi removido ou depreciado em novas versões do Stripe.js,
      // nós redirecionamos de forma limpa e profissional para os links de pagamento configurados (Stripe Payment Links).
      let targetUrl = stripePremiumUrl;
      if (priceId.includes('PRO') || priceId.includes('pro')) {
        targetUrl = stripeProUrl;
      } else if (priceId.includes('ENTERPRISE') || priceId.includes('enterprise')) {
        targetUrl = stripeEnterpriseUrl;
      }
      
      console.log(`Redirecionando para o Stripe Payment Link (${priceId}): ${targetUrl}`);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error("Erro ao redirecionar para o checkout do Stripe:", err);
    }
  };

  const openSimulatedCheckout = (plan: string) => {
    setSelectedPlan(plan);
    setCheckoutStep('select');
    setShowCheckoutModal(true);
  };

  const handleSimulatePayment = () => {
    setCheckoutStep('paid_simulated');
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans relative overflow-x-hidden bg-slate-950">
      {/* Background Mesh with Neon Radial Ambient Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[150px]" />
        <div className="absolute top-[60%] left-[15%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[550px] h-[550px] bg-indigo-500/15 rounded-full blur-[140px]" />
      </div>

      {/* Header with Futuristic Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-slate-950/60 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              <BarChart3 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">Foco em Dados</span>
              <span className="block text-[10px] text-cyan-400 font-semibold tracking-widest uppercase drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]">Ecosystem</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#como-funciona" className="hover:text-cyan-400 hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-all">Soluções</a>
            <button 
              onClick={onNavigateToBotFactory} 
              className="hover:text-cyan-400 hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-all bg-transparent border-0 cursor-pointer text-slate-400 font-medium text-sm"
            >
              Fábrica de Bots
            </button>
            <a href="#demo-section" className="hover:text-cyan-400 hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-all flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Playgrounds
            </a>
            <a href="#pricing" className="hover:text-cyan-400 hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-all">Preços</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* User info from Google */}
                <div className="flex items-center gap-2">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email || 'User'}`} 
                    alt="User Profile" 
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]" 
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-200 leading-none">{user.displayName || 'Usuário'}</span>
                    <span className="text-[9px] text-slate-500 font-mono leading-none mt-1">{user.email}</span>
                  </div>
                </div>

                <button 
                  onClick={onNavigateToBI}
                  className="inline-flex items-center justify-center text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 px-4 h-10 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-300 active:scale-95 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 text-slate-950" />
                  Acessar Painel
                </button>

                <button 
                  onClick={async () => {
                    await logOut();
                    setUser(null);
                  }}
                  className="inline-flex items-center justify-center text-xs font-bold text-red-400 hover:text-red-300 border border-white/5 hover:border-red-950/40 bg-white/5 hover:bg-white/10 px-3 h-10 rounded-xl transition-all cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={onNavigateToLogin}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 px-4 h-10 rounded-xl transition-all cursor-pointer"
                >
                  Entrar
                </button>

                <a 
                  href="#pricing"
                  className="inline-flex items-center justify-center text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 px-5 h-10 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-300 active:scale-95"
                >
                  Começar Agora
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Direct Response Copywriting */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/40 text-xs text-cyan-300 font-medium tracking-wide shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <Zap className="w-3.5 h-3.5 animate-pulse text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
              Sua Empresa Automatizada e Orientada a Dados
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-bold">
              Transforme dados brutos em <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.2)]">máquinas de faturamento</span> que rodam 24/7.
            </h1>

            <p className="text-lg text-slate-400 font-normal leading-relaxed max-w-2xl">
              Chega de tomar decisões no escuro ou passar noites decifrando planilhas. Nosso ecossistema SaaS oferece <strong className="text-cyan-400">BI Automatizado</strong>, <strong className="text-cyan-400">Fábrica de Bots de WhatsApp</strong> e <strong className="text-cyan-400">Crescimento Baseado em Dados</strong> para escalar seu negócio de forma 100% autônoma e lucrativa.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 font-extrabold text-base bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 px-8 h-14 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_35px_rgba(34,211,238,0.55)] transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
              >
                Ativar Minha Automação
                <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </a>
              <button 
                onClick={onNavigateToBI}
                className="inline-flex items-center justify-center gap-2 font-bold text-base text-slate-200 border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] px-8 h-14 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                Experimentar Demo Grátis
              </button>
            </div>

            {/* Botão de Destaque WhatsApp integrado */}
            <div className="pt-2">
              <a 
                href="#demo-section"
                onClick={() => setActiveTab('bots')}
                className="inline-flex items-center justify-center gap-2.5 font-bold text-sm bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-400/30 hover:border-emerald-400 text-emerald-400 px-6 h-12 rounded-xl transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400 animate-pulse fill-emerald-500/10" />
                <span>Testar Conexão Dinâmica via QR Code (SaaS)</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ml-1 animate-pulse border border-emerald-400/20">API Ativa</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center sm:text-left">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">+{liveStats.botsAtivos}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Robôs Ativos</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">{liveStats.conversao}%</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Conversão Média</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">R$ {(liveStats.faturamentoGerado / 1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Faturamento Gerado</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Hub Simulation */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-3xl blur-2xl -z-10 animate-pulse" />
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 sm:p-8 space-y-6 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:border-cyan-500/20 transition-all duration-300 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
              </div>
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">Foco em Dados Live Monitor</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider uppercase">Ambiente Seguro</span>
              </div>

              {/* Simulated Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="backdrop-blur-sm bg-slate-950/40 border border-white/5 p-4 rounded-2xl hover:border-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Taxa de Conversão</span>
                  <p className="text-xl sm:text-2xl font-black text-cyan-400 mt-1 flex items-baseline gap-1.5 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">
                    {liveStats.conversao}%
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </p>
                </div>
                <div className="backdrop-blur-sm bg-slate-950/40 border border-white/5 p-4 rounded-2xl hover:border-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Custo por Lead (CPL)</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-200 mt-1">
                    R$ {liveStats.leadCost.toFixed(2)}
                  </p>
                </div>
                <div className="backdrop-blur-sm bg-slate-950/40 border border-white/5 p-4 rounded-2xl hover:border-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Faturamento do Mês</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-200 mt-1">
                    R$ {liveStats.faturamentoGerado.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="backdrop-blur-sm bg-slate-950/40 border border-white/5 p-4 rounded-2xl hover:border-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Integrações API</span>
                  <p className="text-xl sm:text-2xl font-black text-cyan-400 mt-1 flex items-center gap-1.5 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">
                    100%
                    <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
                  </p>
                </div>
              </div>


            </div>
          </div>
        </div>
      </section>

      {/* Seção das 3 Verticais de Serviços */}
      <section id="como-funciona" className="py-20 border-t border-white/5 bg-slate-950 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest block drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]">As 3 Verticais de Escala</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-100">Modelo de Negócio Unificado em Dados</h2>
          <p className="text-slate-400">Desenvolvemos três frentes tecnológicas autônomas integradas sob o mesmo ecossistema para impulsionar a operação da sua empresa.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vertical 1 */}
          <div className="glass-card p-8 flex flex-col justify-between hover:border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300 group">
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-950/80 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-300">
                <BarChart3 className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_6px_rgba(34,211,238,0.2)]">Vertical 1: Software de BI com IA</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Nossa ferramenta SaaS de Business Intelligence automatiza a leitura e limpeza de arquivos Excel e CSV. Possui um chat inteligente integrado com IA que interpreta seus dados, cria gráficos dinâmicos instantaneamente e faz previsões de tendências matemáticas de faturamento.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Upload de planilhas de até 10MB</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Gráficos de Recharts interativos</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Chatbot com inteligência analítica Gemini</li>
              </ul>
            </div>
            <div className="pt-8">
              <button 
                onClick={onNavigateToBI}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-slate-950 border border-cyan-500/30 hover:border-cyan-400 text-slate-200 h-12 rounded-xl transition-all hover:bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
              >
                Testar Software de BI
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Vertical 2 */}
          <div className="glass-card p-8 flex flex-col justify-between hover:border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300 group">
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-950/80 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-300">
                <Bot className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_6px_rgba(34,211,238,0.2)]">Vertical 2: Fábrica de Bots & Automações</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Desenvolvemos robôs sob demanda e automações de atendimento para WhatsApp que qualificam leads frios, explicam seus produtos, lidam com objeções e realizam o envio do link do Pix e cartões para garantir o fechamento de vendas de forma 100% autônoma.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Integração com WhatsApp, Site e Instagram</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Tom de voz moldado pelo cliente</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Envio e monitoramento de Pix/Boleto</li>
              </ul>
            </div>
            <div className="pt-8 flex flex-col gap-3">
              <button 
                onClick={handleConnectWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-12 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.55)] transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950/10" />
                Conectar Meu WhatsApp Real
              </button>
              <a 
                href="#demo-section" 
                onClick={() => setActiveTab('bots')}
                className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-all py-1.5"
              >
                Simular Bot na Tela (Playground)
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          </div>

          {/* Vertical 3 */}
          <div className="glass-card p-8 flex flex-col justify-between hover:border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300 group">
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-950/80 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-300">
                <Rocket className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_6px_rgba(34,211,238,0.2)]">Vertical 3: Growth & Marketing Direto</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Estruturamos funis de tráfego pago baseados em dados estatísticos reais de mercado. Criamos criativos de alta conversão, capas profissionais para redes sociais/YouTube e textos persuasivos de copywriting focados em vendas brutas, sem desperdiçar verba de marketing.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Copys baseadas em modelos PAS & AIDA</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Design profissional de criativos e capas</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] stroke-[2.5]" /> Estruturação de funis no Facebook/Google</li>
              </ul>
            </div>
            <div className="pt-8">
              <a 
                href="#demo-section" 
                onClick={() => setActiveTab('marketing')}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-slate-950 border border-cyan-500/30 hover:border-cyan-400 text-slate-200 h-12 rounded-xl transition-all hover:bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
              >
                Gerar Minha Copy com IA
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Playgrounds Interativos (Demonstração Funcional de Valor) */}
      <section id="demo-section" className="py-20 border-t border-white/5 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest block drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]">Interactive Playgrounds</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-100">Sinta o Poder do Nosso Ecossistema</h2>
          <p className="text-slate-400">Nós não apenas falamos de tecnologia, nós a mostramos. Escolha uma das frentes abaixo e teste os simuladores em tempo real.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button 
            onClick={() => setActiveTab('bi')}
            className={`flex items-center gap-2 px-6 h-12 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${activeTab === 'bi' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:text-slate-200 hover:bg-white/10 hover:border-cyan-500/20'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Playground 1: SaaS BI com IA
          </button>
          <button 
            onClick={() => setActiveTab('bots')}
            className={`flex items-center gap-2 px-6 h-12 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${activeTab === 'bots' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:text-slate-200 hover:bg-white/10 hover:border-cyan-500/20'}`}
          >
            <Bot className="w-4 h-4" />
            Playground 2: Fábrica de Bots
          </button>
          <button 
            onClick={() => setActiveTab('marketing')}
            className={`flex items-center gap-2 px-6 h-12 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${activeTab === 'marketing' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-slate-400 border border-white/10 hover:text-slate-200 hover:bg-white/10 hover:border-cyan-500/20'}`}
          >
            <Rocket className="w-4 h-4" />
            Playground 3: Growth & Copywriting
          </button>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {activeTab === 'bi' && (
              <div className="glass-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:border-cyan-500/20 transition-all duration-300">
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
                    O Primeiro Software de BI com Assistente Gemini Integrado
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Carregue qualquer planilha de faturamento, vendas, leads ou estoque. Nosso sistema identifica automaticamente os tipos de colunas, gera gráficos incríveis e permite que você converse com uma inteligência artificial em português para filtrar, ordenar e descobrir insights profundos em segundos.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 text-cyan-400 stroke-[3]" />
                      </div>
                      <span className="text-xs text-slate-300 font-medium">100% autônomo, sem precisar saber SQL ou usar fórmulas complexas.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 text-cyan-400 stroke-[3]" />
                      </div>
                      <span className="text-xs text-slate-300 font-medium">Motor de busca comparativa em tempo real na web (Plano Premium).</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={onNavigateToBI}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-sm px-6 h-12 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] active:scale-95"
                    >
                      Abrir Demo do BI Grátis
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="relative group cursor-pointer" onClick={onNavigateToBI}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
                    <div className="backdrop-blur-sm bg-slate-950/60 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] p-4 space-y-4">
                      {/* Simulated Chart Graphic */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">dados_vendas.xlsx</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase">Mapeado</span>
                      </div>
                      
                      <div className="h-40 bg-slate-950/80 rounded-xl border border-white/5 flex items-end justify-between px-6 py-4 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 group-hover:bg-slate-950/25 transition-all">
                          <span className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs px-4 h-9 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                            <Rocket className="w-3.5 h-3.5" />
                            Iniciar Demo de BI
                          </span>
                        </div>
                        <div className="w-10 h-24 bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t opacity-40 group-hover:opacity-60 transition-all" />
                        <div className="w-10 h-16 bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t opacity-40 group-hover:opacity-60 transition-all" />
                        <div className="w-10 h-32 bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t opacity-40 group-hover:opacity-60 transition-all" />
                        <div className="w-10 h-20 bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t opacity-40 group-hover:opacity-60 transition-all" />
                      </div>

                      <div className="bg-slate-950/50 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Última pergunta IA</p>
                          <p className="text-[11px] text-slate-300 truncate">"Qual vendedor teve a maior margem de lucro?"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bots' && (
              <div className="glass-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:border-cyan-500/20 transition-all duration-300">
                {/* Simulator Inputs */}
                <div className="lg:col-span-5 space-y-6 text-left">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                      Painel de Criação do Bot
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Configure o nicho e os canais do seu robô comercial.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nicho da sua Empresa</label>
                      <select 
                        value={botNiche}
                        onChange={(e) => setBotNiche(e.target.value)}
                        className="w-full h-11 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-xl px-4 text-sm text-slate-300 outline-none transition-all"
                      >
                        <option value="E-commerce">E-commerce / Vendas Físicas</option>
                        <option value="Serviços/Agência">Crescimento / Agência / Serviços B2B</option>
                        <option value="Clínica/Local">Clínica / Negócio Local / Consultório</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Canal de Entrada</label>
                      <select 
                        value={botChannel}
                        onChange={(e) => setBotChannel(e.target.value)}
                        className="w-full h-11 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-xl px-4 text-sm text-slate-300 outline-none transition-all"
                      >
                        <option value="WhatsApp">WhatsApp Business</option>
                        <option value="Instagram">Instagram Direct / Reels Auto-Reply</option>
                        <option value="Site">Widget no Site / Landing Page</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tom de Voz da IA</label>
                      <select 
                        value={botVoice}
                        onChange={(e) => setBotVoice(e.target.value)}
                        className="w-full h-11 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-xl px-4 text-sm text-slate-300 outline-none transition-all"
                      >
                        <option value="Persuasivo/Vendedor">Persuasivo & Focado em Vendas</option>
                        <option value="Formal/Corporativo">Formal, Técnico & Coporativo</option>
                        <option value="Amigável/Prestativo">Amigável, Quente & Acolhedor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Objetivo Principal</label>
                      <select 
                        value={botGoal}
                        onChange={(e) => setBotGoal(e.target.value)}
                        className="w-full h-11 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-xl px-4 text-sm text-slate-300 outline-none transition-all"
                      >
                        <option value="Capturar Lead e Agendar">Capturar Lead e Agendar Reunião</option>
                        <option value="Enviar Pix/Checkout">Quebrar Objeções e Enviar Pix</option>
                        <option value="Suporte e FAQs">Suporte 24/7 e Responder Dúvidas</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSimulateBot}
                      disabled={botLoading}
                      className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] cursor-pointer"
                    >
                      {botLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          Processando Inteligência...
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4" />
                          Gerar Roteiro e Fluxo de IA
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Simulated Output Frame */}
                <div className="lg:col-span-7 flex flex-col h-full justify-between">
                  {botResult ? (
                    <div className="space-y-4 text-left flex flex-col h-full justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            Roteiro Gerado com Sucesso!
                          </span>
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-mono border border-cyan-500/20">100% Pronto</span>
                        </div>
                        
                        {/* Copytext container */}
                        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/20 font-mono text-[11px] text-cyan-300 whitespace-pre-line leading-relaxed shadow-[inset_0_0_10px_rgba(34,211,238,0.15)]">
                          {botResult.copyText}
                        </div>

                        {/* Visual Node Flow */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mapeamento Visual de Estados (WhatsApp)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {botResult.flow.map((node: any, idx: number) => (
                              <div key={idx} className="backdrop-blur-sm bg-slate-950/50 border border-white/5 p-3.5 rounded-xl hover:border-cyan-500/30 transition-all duration-300">
                                <span className="text-[10px] text-cyan-400 font-bold font-mono block">{node.step}</span>
                                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">"{node.desc}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-400 text-center sm:text-left flex-1">
                          Esse roteiro é mapeado em nossos servidores Node.js/Python e sincronizado diretamente no seu banco Firebase de forma automática pós-compra.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                          <button
                            onClick={() => onNavigateToBotFactory?.()}
                            className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 h-11 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-slate-950/10 animate-pulse" />
                            Testar Conexão Real (SaaS)
                          </button>
                          <a 
                            href="#pricing"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-extrabold px-5 h-11 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105"
                          >
                            Contratar Fábrica de Bots
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="backdrop-blur-sm bg-slate-950/40 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[350px]">
                      <Bot className="w-12 h-12 text-slate-700 animate-pulse mb-4" />
                      <h4 className="text-base font-bold text-slate-300">Aguardando Parâmetros do Bot</h4>
                      <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
                        Selecione o nicho de mercado e o canal acima e clique em "Gerar Roteiro e Fluxo de IA" para visualizar a estrutura do robô de conversão pronto.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'marketing' && (
              <div className="glass-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:border-cyan-500/20 transition-all duration-300">
                {/* Marketing Inputs */}
                <div className="lg:col-span-5 space-y-6 text-left">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                      Configuração da Campanha
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Preencha os dados do seu produto para gerar a copy perfeita.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Produto</label>
                      <input 
                        type="text"
                        value={mktProduct}
                        onChange={(e) => setMktProduct(e.target.value)}
                        className="w-full h-11 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-xl px-4 text-sm text-slate-300 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">O que o Produto faz? (Descrição Curta)</label>
                      <textarea 
                        value={mktDescription}
                        onChange={(e) => setMktDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-xl p-3 text-sm text-slate-300 outline-none resize-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Público-Alvo</label>
                      <input 
                        type="text"
                        value={mktAudience}
                        onChange={(e) => setMktAudience(e.target.value)}
                        className="w-full h-11 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-xl px-4 text-sm text-slate-300 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fórmula de Copywriting</label>
                      <select 
                        value={mktHook}
                        onChange={(e) => setMktHook(e.target.value)}
                        className="w-full h-11 bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] rounded-xl px-4 text-sm text-slate-300 outline-none transition-all"
                      >
                        <option value="PAS (Problema, Agitação, Solução)">PAS (Problema, Agitação, Solução)</option>
                        <option value="AIDA (Atenção, Interesse, Desejo, Ação)">AIDA (Atenção, Interesse, Desejo, Ação)</option>
                        <option value="Storytelling (Jornada do Cliente)">Storytelling (Jornada do Cliente)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSimulateMarketing}
                      disabled={mktLoading}
                      className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] cursor-pointer"
                    >
                      {mktLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          Estruturando Funil de Anúncio...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4" />
                          Gerar Copy Baseada em Dados
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Simulated Marketing Copy Output */}
                <div className="lg:col-span-7 flex flex-col h-full justify-between">
                  {mktResult ? (
                    <div className="space-y-4 text-left flex flex-col h-full justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            Anúncio Facebook/Google Gerado!
                          </span>
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-mono border border-cyan-500/20">{mktHook.split(' ')[0]}</span>
                        </div>

                        {/* Visual Social Ad Preview */}
                        <div className="bg-slate-950/90 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.6)] max-w-xl mx-auto">
                          {/* Ad Header */}
                          <div className="p-3.5 flex items-center justify-between border-b border-white/5 bg-slate-900/60">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center text-[11px] font-black text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]">FD</div>
                              <div>
                                <span className="font-semibold text-xs text-slate-300 block leading-tight">Foco em Dados Marketing Lab</span>
                                <span className="text-[9px] text-slate-500 leading-none">Patrocinado · Baseado em Dados</span>
                              </div>
                            </div>
                            <Share2 className="w-3.5 h-3.5 text-slate-500" />
                          </div>

                          {/* Ad Body */}
                          <div className="p-4 space-y-3">
                            <h4 className="font-extrabold text-sm text-slate-200 leading-tight">
                              {mktResult.headline}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                              {mktResult.primaryText}
                            </p>
                          </div>

                          {/* Simulated Graphic / Sugestão de Arte */}
                          <div className="bg-slate-950/80 p-4 border-y border-white/5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                              <Sparkles className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-[9px] text-cyan-400 uppercase font-bold tracking-wider block">Recomendação de Arte Digital</span>
                              <p className="text-[10px] text-slate-400 italic leading-relaxed">"{mktResult.imageSuggestion}"</p>
                            </div>
                          </div>

                          {/* Ad Footer / CTA */}
                          <div className="p-3 bg-slate-900/40 flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-mono">focoemdados.com.br</span>
                              <span className="text-[11px] font-bold text-slate-300 block mt-0.5 truncate max-w-[200px] sm:max-w-[320px]">{mktResult.description}</span>
                            </div>
                            <a 
                              href="#pricing"
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-[11px] uppercase tracking-wide px-4 h-9 rounded-lg flex items-center justify-center transition-all shrink-0"
                            >
                              {mktResult.cta}
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-400 text-center sm:text-left">
                          Nosso time de Growth implementa funis como este integrando suas métricas diretamente no dashboard de BI.
                        </p>
                        <a 
                          href="#pricing"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-extrabold px-6 h-11 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105"
                        >
                          Adquirir Estruturação de Growth
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="backdrop-blur-sm bg-slate-950/40 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[350px]">
                      <Rocket className="w-12 h-12 text-slate-700 animate-pulse mb-4" />
                      <h4 className="text-base font-bold text-slate-300">Aguardando Dados da Campanha</h4>
                      <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
                        Preencha o nome do produto, nicho e selecione o gancho persuasivo acima e clique em "Gerar Copy Baseada em Dados" para simular o criativo profissional gerado com IA de Resposta Direta.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Tabela de Preços e Planos */}
      <section id="pricing" className="py-20 border-t border-white/5 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest block drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]">Investimento Inteligente</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-100">Planos & Soluções Comerciais SaaS</h2>
          <p className="text-slate-400">Escolha o plano ideal para a sua empresa crescer orientada a dados, ou solicite um briefing sob demanda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Plano Pro */}
          <div className="glass-card p-8 flex flex-col justify-between hover:border-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-6">
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-extrabold px-3 py-1 rounded-full uppercase font-mono tracking-wider border border-cyan-500/20">SaaS Inteligência Analítica</span>
              <div>
                <h3 className="text-2xl font-black text-slate-100">Plano Pro</h3>
                <p className="text-xs text-slate-500 mt-1">BI Inteligente & Dashboards Automatizados</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-sm font-bold text-slate-400">R$</span>
                <span className="text-4xl font-black text-slate-100 ml-1">49,90</span>
                <span className="text-xs text-slate-500 ml-1">/mês</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Ideal para empresários e analistas que precisam limpar dados, ver dashboards profissionais e plotar gráficos complexos sem passar trabalho.
              </p>

              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Upload Ilimitado de CSV/Excel</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Dashboards Inteligentes estilo Power BI</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Gráficos interativos (Exportação PDF/PNG)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Suporte por e-mail em até 24h</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <a 
                href={stripeProUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center font-bold text-sm bg-white/5 hover:bg-white/10 text-slate-100 h-12 rounded-xl border border-white/10 hover:border-cyan-500/20 transition-all duration-300 cursor-pointer active:scale-95 text-center"
              >
                Ativar Plano Pro
              </a>
            </div>
          </div>

          {/* Plano Premium - Destaque */}
          <div className="glass-card border-2 border-cyan-400 p-8 flex flex-col justify-between hover:bg-white/15 transition-all duration-300 relative overflow-hidden group scale-100 md:scale-105 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-4 py-1.5 rounded-bl-xl shadow-[0_0_10px_rgba(34,211,238,0.4)]">
              Mais Vendido
            </div>
            
            <div className="space-y-6">
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-extrabold px-3 py-1 rounded-full uppercase font-mono tracking-wider border border-cyan-400/30">Inteligência Total</span>
              <div>
                <h3 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                  Plano Premium
                  <Sparkles className="w-4.5 h-4.5 text-cyan-400 animate-pulse drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
                </h3>
                <p className="text-xs text-cyan-400 font-bold mt-1">SaaS de Dados + Chatbot de IA + Web Search</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-sm font-bold text-cyan-400">R$</span>
                <span className="text-5xl font-black bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent ml-1">99,00</span>
                <span className="text-xs text-slate-500 ml-1">/mês</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Nossa licença máxima recomendada para empresários que exigem inteligência profunda, monitoramento de concorrentes na internet e chatbot de IA de suporte nativo.
              </p>

              <div className="pt-2 border-t border-cyan-950 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span><strong className="text-cyan-400">Tudo do Plano Pro</strong> incluído</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Chatbot de IA integrado para responder dados</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span><strong className="text-cyan-400">Módulo de Busca Web</strong> (Data Enrichment)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Análise de Preços de Concorrentes automática</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Suporte VIP e gerência de API personalizada</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <a 
                href={stripePremiumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center font-black text-sm bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 h-12 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-300 cursor-pointer active:scale-95 text-center"
              >
                Liberar Inteligência Total
              </a>
            </div>
          </div>

          {/* Plano Enterprise */}
          <div className="glass-card p-8 flex flex-col justify-between hover:border-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-6">
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-extrabold px-3 py-1 rounded-full uppercase font-mono tracking-wider border border-cyan-500/20">Soluções Corporativas</span>
              <div>
                <h3 className="text-2xl font-black text-slate-100">Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">Fábrica de Bots e Growth Sob Demanda</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">A partir de</span>
                <span className="text-3xl font-black text-slate-100 ml-1.5">R$ 499</span>
                <span className="text-xs text-slate-500 ml-1">Setup único</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Indicado para agências, startups e empresas locais que precisam de robôs de processos e funis de marketing sob demanda para rodar vendas em escala.
              </p>

              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Criação de Bots WhatsApp Personalizados</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Integração de Sistemas Legados à APIs</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Roteiros persuasivos e Copys completas</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                  <span>Setup de webhook e sincronização automatizada</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <a 
                href={stripeEnterpriseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center font-bold text-sm bg-white/5 hover:bg-white/10 text-slate-100 h-12 rounded-xl border border-white/10 hover:border-cyan-500/20 transition-all duration-300 cursor-pointer active:scale-95 text-center"
              >
                Solicitar Briefing Rápido
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Dúvidas Frequentes
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">
            Perguntas & Respostas
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-xs leading-relaxed">
            Esclareça suas principais dúvidas sobre o funcionamento da plataforma, segurança de informações e nossa política transparente de acesso ao Google Drive.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              question: "Como a Foco em Dados utiliza meus arquivos do Google Drive?",
              answer: "A plataforma utiliza a integração oficial da API do Google para permitir que você selecione planilhas diretamente do seu Google Drive. Esse acesso é temporário e estritamente restrito à leitura para o motor de BI Analytics. Seus dados de arquivos são processados em memória de forma transitória e nunca são armazenados permanentemente ou partilhados com terceiros."
            },
            {
              question: "Os meus dados empresariais e pessoais estão protegidos?",
              answer: "Sim, com prioridade máxima. Empregamos criptografia de ponta a ponta (HTTPS/TLS) em todo o tráfego de dados e armazenamos credenciais de acesso sob regras de segurança rígidas no Firebase. Seus dados de BI e os registros de conversas de seus bots são estritamente confidenciais e isolados de outros usuários."
            },
            {
              question: "Posso revogar as permissões de acesso do Google Drive a qualquer momento?",
              answer: "Sim, absolutamente. Você detém total controle sobre as suas conexões. A revogação do token de acesso do Google Drive pode ser feita instantaneamente com um clique a partir do painel da plataforma ou diretamente pelas configurações de segurança da sua Conta Google."
            },
            {
              question: "Como a Inteligência Artificial e os Robôs de WhatsApp processam dados?",
              answer: "Nossos robôs da Fábrica de Bots utilizam a API do Gemini de forma segura para interpretar instruções de atendimento e dúvidas operacionais dos seus clientes. Todo o processamento de IA é realizado server-side de forma isolada, garantindo total conformidade de privacidade de dados comerciais."
            },
            {
              question: "Como posso falar com o suporte sobre dúvidas de privacidade ou exclusão de dados?",
              answer: "Para qualquer esclarecimento relacionado à privacidade de dados ou para solicitar a exclusão integral das suas credenciais e conta, basta enviar uma mensagem direta para o nosso e-mail de suporte oficial: atendimento@focoemdados.com.br."
            }
          ].map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx} 
                className="glass-card overflow-hidden transition-all duration-300 hover:border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer select-none"
                >
                  <span className="text-sm font-bold text-slate-200 hover:text-cyan-400 transition-colors">
                    {item.question}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {/* Accordion body with smooth motion transition */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950/80 backdrop-blur-md border-t border-white/5 py-12 relative z-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="font-bold text-sm text-slate-300">Foco em Dados</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Sua estrutura de inteligência e vendas automatizadas. Levando o poder da IA, BI e Bots integrados ao dia a dia de empresas in crescimento.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-400 mb-3 uppercase tracking-wider text-[10px]">Verticais</h4>
            <ul className="space-y-2 font-medium">
              <li><button onClick={onNavigateToBI} className="hover:text-cyan-400 transition-colors">SaaS de BI Inteligente</button></li>
              <li>
                <button 
                  onClick={onNavigateToBotFactory} 
                  className="hover:text-cyan-400 transition-colors bg-transparent border-0 cursor-pointer text-slate-400 font-medium text-sm text-left p-0"
                >
                  Fábrica de Bots WhatsApp
                </button>
              </li>
              <li><a href="#demo-section" onClick={() => setActiveTab('marketing')} className="hover:text-cyan-400 transition-colors">Crescimento & Growth</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-400 mb-2 uppercase tracking-wider text-[10px]">Contato Comercial</h4>
            <p className="flex items-center gap-2 text-slate-400"><Mail className="w-3.5 h-3.5 text-cyan-400" /> atendimento@focoemdados.com.br</p>
            <p className="flex items-center gap-2 text-slate-400"><Globe className="w-3.5 h-3.5 text-cyan-400" /> focoemdados.com.br</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Foco em Dados Tecnologia Ltda. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-slate-400 font-bold text-xs">
            <button 
              onClick={() => onNavigateToTerms?.()} 
              className="hover:text-cyan-400 transition-colors cursor-pointer select-none"
            >
              Termos de Uso
            </button>
            <button 
              onClick={() => onNavigateToPrivacy?.()} 
              className="hover:text-cyan-400 transition-colors cursor-pointer select-none"
            >
              Política de Privacidade
            </button>
          </div>
        </div>
      </footer>

      {/* Checkout Simulator Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckoutModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="backdrop-blur-lg bg-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(34,211,238,0.2)] space-y-6 text-left"
            >
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/20 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {checkoutStep === 'select' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-cyan-400 animate-pulse drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                      Ativação do Plano - Foco em Dados
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Simule o fluxo de contratação rápida para liberar suas ferramentas imediatamente.</p>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-3.5">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Plano Selecionado</span>
                      <span className="font-extrabold text-sm text-slate-200 uppercase mt-0.5 block">
                        {selectedPlan === 'pro' && 'Plano Pro (SaaS BI de Dados) - R$ 49,90/mês'}
                        {selectedPlan === 'premium' && 'Plano Premium (Inteligência Total) - R$ 99,00/mês'}
                        {selectedPlan === 'enterprise' && 'Soluções Enterprise - Briefing customizado'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Destinatário do Acesso</span>
                      <p className="text-[11px] text-slate-300 mt-1 font-mono">
                        lucyano.pci@gmail.com
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Os dados de login e o ambiente de BI estarão imediatamente integrados e prontos para uso sob esta conta.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleSimulatePayment}
                      className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] cursor-pointer active:scale-95 transition-all duration-300"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Confirmar Ativação & Liberar Acesso
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-100">Assinatura Ativada!</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Sua conta foi atualizada para o plano <code className="text-cyan-400 font-mono font-semibold uppercase">{selectedPlan}</code> com sucesso! Todas as ferramentas de BI, inteligência artificial e análises de dados já estão disponíveis.
                    </p>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      onClick={() => setShowCheckoutModal(false)}
                      className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                    <button 
                      onClick={() => {
                        setShowCheckoutModal(false);
                        onNavigateToBI();
                      }}
                      className="flex-1 h-11 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all active:scale-95 duration-300 cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-950" />
                      Acessar Plataforma de BI
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        <QRCodeModal
          isOpen={showWaModal}
          onClose={() => setShowWaModal(false)}
          qrData={waQrImage}
          isLoading={waQrLoading}
          error={waQrError}
          onRefresh={fetchWaQrCode}
          title="Conectar WhatsApp Real"
          description="Escaneie o QR Code abaixo para sincronizar seu WhatsApp corporativo com os fluxos e automações de IA da Foco em Dados."
        />
      </AnimatePresence>
    </div>
  );
}
