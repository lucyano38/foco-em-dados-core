import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import SpreadsheetUpload from '../components/SpreadsheetUpload'
import { WHATSAPP_URL, CONTACT_EMAIL } from '../lib/contact'
import { safeJson } from '../lib/safeFetch'
import { Upload, BarChart3, TrendingUp, Database, ArrowRight, Sparkles, Check, Bot, Target, Kanban, Workflow, Mail, MessageCircle, FileText, DollarSign, Zap, PlayCircle, Bell, Settings, ChevronsDown } from 'lucide-react'

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
    subtitle: 'Ferramenta de captação externa: busca empresas em Google Maps, redes e CNAE, gera leads qualificados e envia para o CRM.',
    gradient: 'from-amber-400 to-purple-500',
    glow: 'shadow-purple-500/20',
    cta: 'Prospectar R$ 39,90',
    includes: [
      'Busca segmentada por cidade, nicho e porte',
      'Abordagens personalizadas geradas por IA',
      'Pontuação de oportunidade para priorizar contatos',
      'Redesign demonstrativo (Antes/Depois) para prospecção ativa',
    ],
    marketPrice: 'R$ 1.200,00',
    salePrice: 'R$ 39,90',
    ctaType: 'checkout' as const,
  },
  {
    icon: Kanban,
    tag: 'GESTÃO DE VENDAS',
    name: 'CRM Comercial',
    subtitle: 'Painel de acompanhamento do pipeline: propostas, follow-ups, negociação e fechamento com histórico unificado.',
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

const FUNNEL_STAGES = [
  { name: 'Discovery', desc: 'Descoberta e coleta de dados do lead', percent: '100%', count: 128, color: '#60a5fa' },
  { name: 'Abordagem', desc: 'Contato inicial e proposta de valor', percent: '75%', count: 96, color: '#ffc107' },
  { name: 'Qualificação', desc: 'Validação de necessidade e orçamento', percent: '48%', count: 61, color: '#cdbdff' },
  { name: 'Proposta', desc: 'Envio de proposta sob medida', percent: '22%', count: 28, color: '#f472b6' },
  { name: 'Fechamento', desc: 'Contrato assinado e onboarding', percent: '11%', count: 14, color: '#4ade80' },
]

const LEADS_TABLE = [
  { name: 'Distribuidora Central Bebidas', segment: 'Distribuição', city: 'São Paulo/SP', value: 'R$ 5.900', stage: 'Negociação', badgeColor: '#ffc107' },
  { name: 'Farmácia Vida + Saúde', segment: 'Farmácia', city: 'Itupeva/SP', value: 'R$ 6.800', stage: 'Fechado', badgeColor: '#4ade80' },
  { name: 'Moda Bella Store', segment: 'Moda & Vestuário', city: 'Guarulhos/SP', value: 'R$ 2.900', stage: 'Abordagem', badgeColor: '#60a5fa' },
  { name: 'Auto Peças Silva', segment: 'Automotivo', city: 'Campinas/SP', value: 'R$ 1.800', stage: 'Discovery', badgeColor: '#cdbdff' },
  { name: 'Mercado Bom Preço', segment: 'Varejo', city: 'Osasco/SP', value: 'R$ 4.800', stage: 'Negociação', badgeColor: '#ffc107' },
  { name: 'Loja Bella Calçados', segment: 'Calçados', city: 'Santos/SP', value: 'R$ 2.600', stage: 'Proposta', badgeColor: '#f472b6' },
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

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-amber-400/15 shadow-[0_0_20px_rgba(250,189,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-[#5203d5] flex items-center justify-center shadow-[0_0_12px_rgba(255,193,7,0.3)]">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-[family-name:var(--font-display)] font-bold text-2xl tracking-tighter text-[#ffe4af]">Foco Completo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#demo" className="hover:text-[#ffe4af] transition-colors border-b-2 border-transparent hover:border-[#ffc107] pb-0.5">Funções</a>
            <a href="#solucoes" className="hover:text-[#ffe4af] transition-colors">Produtos</a>
            <a href="#funil" className="hover:text-[#ffe4af] transition-colors">Pesquisa</a>
            <Link to="/precos" className="hover:text-[#ffe4af] transition-colors">Preços</Link>
            <a href="#funciona" className="hover:text-[#ffe4af] transition-colors">Recursos</a>
          </nav>
          <div className="flex items-center gap-6">
            {user ? (
              <Link
                to="/app"
                className="h-10 px-6 rounded-full bg-[#ffc107] hover:bg-[#ffca28] text-[#3f2e00] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(250,189,0,0.25)] hover:scale-105 active:scale-95"
              >
                <Database className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-400 hover:text-[#ffe4af] transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/login"
                  className="h-10 px-6 rounded-full bg-[#ffc107] hover:bg-[#ffca28] text-[#3f2e00] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(250,189,0,0.25)] hover:scale-105 active:scale-95"
                >
                  Começar Agora
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section — Portal Místico CSS */}
        <section
          className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden portal-bg"
        >
          <img
            src="/dashboard-analytics.png"
            alt="Foco em Dados — análise de dados"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#121414]"></div>
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full bg-gradient-to-tr from-[#5203d5]/30 via-[#ffc107]/20 to-transparent blur-[100px] animate-portal"></div>
            <div className="absolute w-[300px] h-[300px] rounded-full border border-[#ffc107]/20 animate-ping opacity-20"></div>
          </div>

          <div className="relative z-20 px-6 md:px-16 text-center max-w-4xl mx-auto space-y-8">
            <div className="space-y-4 animate-float">
              <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold text-glow tracking-tight text-center">
                Painel Central{' '}
                <span className="text-[#ffe4af]">Foco Completo</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300/80 max-w-2xl mx-auto font-light leading-relaxed">
                A sua esteira de prospecção profissional acelerada por inteligência
                mística e tecnologia de ponta.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link
                to={user ? '/app' : '/login'}
                className="bg-[#ffc107] text-[#3f2e00] px-10 py-5 rounded-full text-lg font-bold shadow-[0_0_30px_rgba(250,189,0,0.4)] hover:shadow-[0_0_50px_rgba(250,189,0,0.6)] hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
              >
                Começar de Graça
                <Zap className="w-5 h-5" />
              </Link>
              <a
                href="#demo"
                className="glass-panel px-10 py-5 rounded-full text-lg font-medium hover:bg-white/5 transition-all flex items-center gap-3 border border-white/10"
              >
                Ver Demonstração
                <PlayCircle className="w-5 h-5" />
              </a>
            </div>
            <div className="pt-12 text-slate-400/60 flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest">Role para descobrir</span>
              <ChevronsDown className="w-5 h-5 text-[#ffe4af] animate-bounce" />
            </div>
          </div>
        </section>

        {/* Dashboard Global — Demonstração (overlay sobre o hero) */}
        <section id="demo" className="px-4 md:px-16 -mt-24 relative z-30 mb-24">
          <div className="max-w-7xl mx-auto">
            <div className="glass-panel rounded-[2rem] p-4 md:p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffc107] to-transparent opacity-50"></div>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-64 space-y-6 hidden md:block">
                  <div className="h-10 bg-white/5 rounded-lg border border-amber-400/10 flex items-center px-4 gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#ffc107] animate-pulse"></div>
                    <div className="h-2 w-24 bg-slate-400/30 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 bg-[#ffc107]/10 rounded border border-[#ffc107]/20"></div>
                    <div className="h-8 bg-white/5 rounded border border-white/5"></div>
                    <div className="h-8 bg-white/5 rounded border border-white/5"></div>
                    <div className="h-8 bg-white/5 rounded border border-white/5"></div>
                  </div>
                </div>
                <div className="flex-1 space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-semibold text-white">
                      Dashboard Global
                    </h2>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-amber-400/15 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-amber-400/15 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total de Leads', value: '12,845', footer: '+14.2% este mês', footerColor: 'text-green-400', icon: TrendingUp },
                      { label: 'Propostas Ativas', value: '342', footer: 'Conversão média 12%', footerColor: 'text-slate-400/60', icon: FileText },
                      { label: 'Receita de Setups', value: 'R$ 84k', footer: 'Meta atingida', footerColor: 'text-green-400', icon: DollarSign },
                      { label: 'MRR', value: 'R$ 256k', footer: 'Recorrência garantida', footerColor: 'text-slate-400/60', icon: TrendingUp },
                    ].map((m, i) => (
                      <div key={m.label} className={`glass-panel p-6 rounded-2xl glow-hover transition-all ${i === 3 ? 'border-[#ffc107]/40' : ''}`}>
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{m.label}</span>
                        <div className="text-3xl font-bold mt-2 text-[#ffe4af]">{m.value}</div>
                        <div className={`text-xs mt-1 flex items-center gap-1 ${m.footerColor}`}>
                          <m.icon className="w-3.5 h-3.5" />
                          {m.footer}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative h-64 md:h-96 w-full rounded-2xl overflow-hidden border border-amber-400/10 bg-gradient-to-b from-[#0d0e0f] via-[#121414] to-[#121414] p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-amber-400/10 pb-4">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#ffe4af]">Análise Preditiva em Tempo Real</span>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Ao Vivo
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2 h-48 pt-8 px-4">
                      {[30, 50, 40, 75, 60, 95].map((h, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-t transition-all ${i === 5 ? 'bg-[#ffc107] shadow-[0_0_15px_rgba(255,193,7,0.5)]' : i % 2 === 0 ? 'bg-[#ffc107]/20 hover:bg-[#ffc107]/40' : 'bg-[#ffc107]/30 hover:bg-[#ffc107]/50'}`}
                          style={{ height: `${h}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Módulo de Prospecção & Conversão — inspirado no fluxo evoluaprospect */}
        <section id="funil" className="py-20 px-4 relative overflow-hidden">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-5 glassmorphism">
                <Target className="w-3.5 h-3.5" />
                Prospecção &amp; Conversão
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
                Do <span className="text-amber-300">Discovery</span> ao{' '}
                <span className="text-[#cdbdff]">Fechamento</span>
              </h2>
              <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
                Fluxo de captação ativa inspirado no evoluaprospect: cada lead avança
                por etapas com abordagem personalizada por IA e pontuação de oportunidade.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="md:col-span-2 lg:col-span-5 glass-card p-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                <p className="text-xs font-bold text-[#ffe4af] uppercase tracking-wider mb-2">Prospecção Inteligente</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Ferramenta de captação externa: busca empresas em Google Maps, redes e CNAE, gera leads qualificados e envia para o CRM.
                </p>
              </div>
              {FUNNEL_STAGES.map((s, i) => (
                <div key={s.name} className="glass-card p-5 rounded-2xl card-hover border border-white/10 bg-white/[0.03] backdrop-blur-xl relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-slate-950" style={{ background: s.color }}>
                      {i + 1}
                    </div>
                    <span className="font-mono text-xs font-bold" style={{ color: s.color }}>{s.percent}%</span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{s.name}</h3>
                  <p className="text-[11px] text-[#d4c5ab] mt-1 leading-relaxed">{s.desc}</p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-white">{s.count}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: s.percent, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 glass-card rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <Kanban className="w-4 h-4 text-[#ffc107]" />
                <h3 className="font-[family-name:var(--font-display)] font-bold text-white">CRM Comercial — Acompanhamento</h3>
                <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]">propostas, follow-ups e fechamento</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs font-bold text-[#ffe4af] uppercase tracking-wider mb-2">Propostas</p>
                  <p>Envie valores de setup e mensalidades com histórico claro.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs font-bold text-[#ffe4af] uppercase tracking-wider mb-2">Follow-ups</p>
                  <p>Controle retornos e propostas estagnadas para não perder vendas.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs font-bold text-[#ffe4af] uppercase tracking-wider mb-2">Fechamento</p>
                  <p>Gere minuta A4 e documento protegido para o cliente final.</p>
                </div>
              </div>
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
              <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
                Uma plataforma única de Inteligência Artificial, automação e dados para
                escalar a captação e gestão de clientes da sua empresa.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SOLUTIONS.map((s) => (
                <div
                  key={s.name}
                  className="group glass-card p-6 flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  <div className="w-full mb-4 flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} ${s.glow} flex items-center justify-center shadow-lg`}>
                      <s.icon className="w-6 h-6 text-slate-950" />
                    </div>
                    <span className="text-[9px] font-bold tracking-[0.18em] text-slate-400 uppercase border border-white/10 bg-white/[0.03] rounded-full px-2.5 py-1">
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{s.name}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{s.subtitle}</p>

                  <p className="text-[10px] font-bold tracking-[0.14em] text-amber-300/90 uppercase mt-5 mb-2">
                    O que está incluído:
                  </p>
                  <ul className="space-y-2 flex-1">
                    {s.includes.map((item) => (
                      <li key={item} className="text-xs text-slate-300 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                      Preço de mercado
                    </p>
                    <p className="text-lg font-bold text-slate-500 line-through">{s.marketPrice}</p>
                    <p className="text-[10px] font-bold tracking-[0.14em] text-amber-300/90 uppercase">
                      Comigo (Luciano)
                    </p>
                    <p className={`text-2xl font-extrabold bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>
                      {s.salePrice}
                    </p>
                  </div>

                  {s.ctaType === 'external' ? (
                    <a
                      href={s.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 h-10 rounded-lg bg-gradient-to-r from-amber-400 to-purple-500 hover:from-amber-300 hover:to-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      {s.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : s.ctaType === 'checkout' ? (
                    <button
                      onClick={openProspectionCheckout}
                      className="mt-5 h-10 rounded-lg bg-gradient-to-r from-amber-400 to-purple-500 hover:from-amber-300 hover:to-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {s.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      to={s.route}
                      className="mt-5 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      {s.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-slate-500 mt-8">
              Prospecção em massa (acima de 100 linhas) por apenas <strong className="text-amber-300">R$ 39,90</strong> — pagamento único via Stripe.
            </p>
          </div>
        </section>

        {/* Seção Como Funciona com Background HD 2 */}
        <section 
          id="funciona" 
          className="py-20 px-4 relative bg-cover bg-center overflow-hidden border-t border-b border-white/5"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1920&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <h2 className="text-3xl font-bold text-center mb-4">Como funciona</h2>
            <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
              Três passos simples para transformar dados em decisões.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Faça upload', desc: 'Arraste sua planilha CSV ou Excel. Aceitamos dados de vendas, estoque, clientes e financeiro.' },
                { step: '02', title: 'IA analisa', desc: 'Nossa IA processa e identifica padrões, sazonalidade, produtos top e gargalos automaticamente.' },
                { step: '03', title: 'Decida com dados', desc: 'Receba dashboards, alertas e previsões para tomar decisões mais rápidas e precisas.' },
              ].map((item) => (
                <div key={item.step} className="glass-card p-8 text-center bg-slate-900/60 backdrop-blur-xl border border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Tudo que o varejista precisa</h2>
            <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
              Funcionalidades pensadas para lojas físicas e e-commerces.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="glass-card p-6">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload de Planilha + Pipeline + Stripe */}
        <section className="py-20 px-4 relative">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Envie sua planilha de prospecção</h2>
            <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">
              Até 100 linhas: envio gratuito para o pipeline. Acima disso, faça login e desbloqueie com um
              pagamento único de R$ 39,90.
            </p>
            <SpreadsheetUpload />
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Planos</h2>
            <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
              Do teste gratuito ao plano Pro. Sem fidelidade.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {PLANS.map((p) => (
                <div key={p.name} className={`glass-card p-6 flex flex-col ${p.popular ? 'border-cyan-500/30 ring-1 ring-cyan-500/20' : ''}`}>
                  {p.popular && (
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">Mais Popular</span>
                  )}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-2xl font-bold mt-2">{p.price}<span className="text-sm font-normal text-slate-400">{p.price !== 'R$ 0' ? '/mês' : ''}</span></p>
                  <ul className="mt-4 space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm text-slate-400 flex items-start gap-2">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 h-10 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    {p.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-[#0d0e0f] border-t border-amber-400/10 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#ffe4af]" />
            <span className="font-[family-name:var(--font-display)] font-bold text-xl tracking-tighter text-[#ffe4af]">Foco Completo</span>
          </div>
          <div className="flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            <Link to="/privacidade" className="hover:text-[#ffe4af] transition-colors">Privacidade</Link>
            <Link to="/termos" className="hover:text-[#ffe4af] transition-colors">Termos</Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25d366]/10 border border-[#25d366]/30 text-[#4ade80] hover:bg-[#25d366]/20 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Suporte
            </a>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            © 2026 Foco Completo. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
