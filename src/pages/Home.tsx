import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import SpreadsheetUpload from '../components/SpreadsheetUpload'
import { WHATSAPP_URL, CONTACT_EMAIL } from '../lib/contact'
import { safeJson } from '../lib/safeFetch'
import { Upload, BarChart3, TrendingUp, Database, ArrowRight, Sparkles, Check, Bot, Target, Kanban, Workflow, Mail, MessageCircle } from 'lucide-react'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
const PROSPECTION_PRICE_CENTS = 3990 // R$ 39,90

const LUCIANO_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano! Gostaria de ativar o seu agente de IA no meu negócio.')}`

const PROSPECTION_CHECKOUT_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano, quero ativar a Prospecção Inteligente por R$ 39,90.')}`

const FREE_PLAN_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano, quero iniciar no plano Gratuito')}`

const SOLUTIONS = [
  {
    icon: Bot,
    tag: 'AUTOMAÇÃO 24/7 & IA',
    name: 'Agente Luciano',
    subtitle: 'Atendimento automático e qualificação de leads no WhatsApp, Telegram e Instagram.',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/20',
    cta: 'Ativar Agente',
    includes: [
      'Atendimento automático no WhatsApp, Telegram e Instagram',
      'Respostas inteligentes treinadas com os dados da sua empresa',
      'Agendamento de reuniões e qualificação de leads em tempo real',
      'Alerta VIP no seu WhatsApp assim que o cliente aceitar fechar',
    ],
    marketPrice: 'R$ 2.500,00',
    salePrice: 'Sob Consulta',
    ctaType: 'external' as const,
    externalUrl: LUCIANO_WHATSAPP_URL,
  },
  {
    icon: BarChart3,
    tag: 'BUSINESS INTELLIGENCE',
    name: 'BI & Data Pipeline',
    subtitle: 'Dashboards executivos e consolidação de dados em tempo real, sem programação.',
    gradient: 'from-purple-500 to-fuchsia-500',
    glow: 'shadow-purple-500/20',
    cta: 'Criar Dashboard',
    includes: [
      'Importação rápida de arquivos CSV e Excel',
      'Dashboards dinâmicos com KPIs e faturamento',
      'Consolidação de dados em tempo real via Supabase',
      'Dataset corporativo demonstrativo para início imediato',
    ],
    marketPrice: 'R$ 1.800,00',
    salePrice: 'Grátis / R$ 39,90',
    ctaType: 'route' as const,
    route: '/app',
  },
  {
    icon: Target,
    tag: 'CAPTAÇÃO DE CLIENTES',
    name: 'Prospecção Inteligente',
    subtitle: 'Captação ativa de clientes com abordagens personalizadas por IA e pontuação de oportunidade.',
    gradient: 'from-amber-400 to-purple-500',
    glow: 'shadow-purple-500/20',
    cta: 'Prospectar',
    ctaType: 'route' as const,
    route: '/admin/prospeccao',
    includes: [
      'Busca segmentada por cidade, nicho e porte',
      'Abordagens personalizadas geradas por IA',
      'Pontuação de oportunidade para priorizar contatos',
      'Redesign demonstrativo (Antes/Depois) para prospecção ativa',
    ],
    marketPrice: 'R$ 1.200,00',
    salePrice: 'R$ 39,90',
  },
  {
    icon: Kanban,
    tag: 'GESTÃO DE VENDAS',
    name: 'CRM Comercial',
    subtitle: 'Pipeline de vendas organizado em 5 etapas com histórico unificado de conversas.',
    gradient: 'from-fuchsia-500 to-amber-400',
    glow: 'shadow-amber-500/20',
    cta: 'Abrir Pipeline',
    includes: [
      'Pipeline visual organizado em 5 etapas claras',
      'Histórico unificado de conversas e propostas',
      'Sincronização automática com as captações do Luciano',
      'Painel limpo sem poluição visual',
    ],
    marketPrice: 'R$ 350,00',
    salePrice: 'Incluso',
    ctaType: 'route' as const,
    route: '/admin',
  },
]

const FEATURES = [
  {
    icon: Upload,
    title: 'Upload de Planilhas',
    desc: 'Arraste seu CSV ou Excel. A IA analisa automaticamente seus dados de vendas, estoque e clientes.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Inteligente',
    desc: 'Visualize receita, ticket médio, top produtos e tendências em gráficos interativos.',
  },
  {
    icon: TrendingUp,
    title: 'Previsão de Vendas',
    desc: 'Projeções para os próximos 30 dias com base no histórico da sua loja.',
  },
  {
    icon: Sparkles,
    title: 'Insights por IA',
    desc: 'Alertas automáticos de oportunidade, risco e sazonalidade — sem configurar nada.',
  },
]

const PLANS = [
  {
    name: 'Gratuito', price: 'R$ 0', cta: 'Começar Grátis',
    features: ['3 dashboards', '2.000 linhas/mês', 'Upload CSV/Excel', 'Insights básicos por IA'],
    popular: false, href: FREE_PLAN_WHATSAPP_URL,
  },
  {
    name: 'Starter', price: 'R$ 97', cta: 'Assinar',
    features: ['10 dashboards', '50.000 linhas/mês', 'Alertas automáticos', 'Previsão de vendas 30 dias', 'Exportação de relatórios'],
    popular: false, href: 'https://buy.stripe.com/cNifZheobdbYd0Db9O5Vu04',
  },
  {
    name: 'Pro', price: 'R$ 297', cta: 'Assinar',
    features: ['Dashboards ilimitados', '500.000 linhas/mês', 'Análise preditiva avançada', 'API pública', 'Integrações com ERPs', 'Suporte prioritário'],
    popular: true, href: 'https://buy.stripe.com/cNi7sLfsf0pcbWzem05Vu05',
  },
]

export default function Home() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Foco em Dados | Agente Luciano, BI, Prospecção e CRM — Inteligência para Empresas'
  }, [])

  const openProspectionCheckout = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (isAdmin) {
      navigate('/admin/prospeccao')
      return
    }
    try {
      if (!STRIPE_PUBLISHABLE_KEY) {
        window.location.href = PROSPECTION_CHECKOUT_WHATSAPP_URL
        return
      }
      const res = await fetch('/api/stripe/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: PROSPECTION_PRICE_CENTS,
          successUrl: `${window.location.origin}/?checkout=success`,
          cancelUrl: `${window.location.origin}/?checkout=canceled`,
        }),
      })
      const data = await safeJson(res)
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao iniciar o checkout.')
      }
      if (!data.url) throw new Error('URL de checkout não retornada pelo servidor.')
      window.location.href = data.url
    } catch {
      window.location.href = PROSPECTION_CHECKOUT_WHATSAPP_URL
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#121414] text-slate-100 font-sans">
      <div className="mesh-bg" />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#121414]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Foco em Dados</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#solucoes" className="hover:text-white transition-colors">Soluções</a>
            <a href="#funciona" className="hover:text-white transition-colors">Como funciona</a>
            <Link to="/precos" className="hover:text-white transition-colors">Planos</Link>
            <a href="#contato" className="hover:text-white transition-colors">Suporte</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/app"
                className="h-9 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <Database className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-9 px-4 rounded-lg border border-white/10 hover:border-white/20 text-sm font-medium transition-all flex items-center"
                >
                  Entrar
                </Link>
                <Link
                  to="/login"
                  className="h-9 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all"
                >
                  Começar Grátis
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section com Background Místico Cyber 3D */}
        <section 
          className="pt-36 pb-20 px-4 relative overflow-hidden"
          style={{ background: 'radial-gradient(circle at center, rgba(250, 189, 0, 0.2) 0%, rgba(82, 3, 213, 0.15) 50%, #121414 100%)' }}
        >
          <div className="absolute inset-0 bg-[#121414]/40"></div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-6 glassmorphism">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sua loja com IA — sem programação
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              IA, Automação e{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 bg-clip-text text-transparent">
                Dados
              </span>
              <br />
              para o seu negócio crescer
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Agente de IA autônomo (Luciano), BI & Data Pipeline, prospecção inteligente e CRM
              Kanban — tudo em uma única plataforma. Sem setup, sem equipe técnica.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                to={user ? '/app' : '/login'}
                className="h-12 px-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 border border-amber-300/50"
              >
                <Upload className="w-4 h-4" />
                Fazer Upload Grátis
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="h-12 px-8 rounded-xl border border-amber-400/20 hover:border-amber-400/40 text-sm font-medium flex items-center gap-2 transition-all bg-white/5 backdrop-blur-xl"
              >
                <MessageCircle className="w-4 h-4 text-amber-300" />
                Falar no WhatsApp
              </a>
              <a
                href="#funciona"
                className="h-12 px-8 rounded-xl border border-amber-400/20 hover:border-amber-400/40 text-sm font-medium flex items-center gap-2 transition-all bg-white/5 backdrop-blur-xl"
              >
                Ver Como Funciona
              </a>
            </div>
          </div>
        </section>

        {/* Seção Produtos e Serviços — Vitrine Comercial */}
        <section id="solucoes" className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08)_0%,transparent_60%)]"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-5 glassmorphism">
                <Workflow className="w-3.5 h-3.5" />
                Ecossistema comercial completo
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Produtos e Serviços{' '}
                <span className="bg-gradient-to-r from-amber-400 to-purple-500 bg-clip-text text-transparent">
                  Foco em Dados
                </span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SOLUTIONS.map((s) => (
                <div
                  key={s.name}
                  className="group glass-card p-6 flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:border-white/20 transition-all hover:-translate-y-1"
                >
                  <div className="w-full mb-4 flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                      <s.icon className="w-6 h-6 text-slate-950" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{s.name}</h3>
                  <p className="text-sm text-slate-400 mt-2 flex-1">{s.subtitle}</p>

                  {s.ctaType === 'external' ? (
                    <a
                      href={s.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 h-10 rounded-lg bg-gradient-to-r from-amber-400 to-purple-500 hover:from-amber-300 hover:to-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      {s.cta}
                    </a>
                  ) : s.ctaType === 'checkout' ? (
                    <button
                      onClick={openProspectionCheckout}
                      className="mt-5 h-10 rounded-lg bg-gradient-to-r from-amber-400 to-purple-500 hover:from-amber-300 hover:to-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {s.cta}
                    </button>
                  ) : (
                    <Link
                      to={s.route}
                      className="mt-5 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      {s.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ... (resto do componente mantido simplificado para o exemplo) ... */}
      </main>
    </div>
  )
}
',path: