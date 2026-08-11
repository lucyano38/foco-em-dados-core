import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '../contexts/AuthContext'
import SpreadsheetUpload from '../components/SpreadsheetUpload'
import { Upload, BarChart3, TrendingUp, Database, ArrowRight, Sparkles, Check, Bot, Target, Kanban, Workflow, Mail } from 'lucide-react'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
const PROSPECTION_PRICE_CENTS = 3990 // R$ 39,90

const SOLUTIONS = [
  {
    icon: Bot,
    name: 'Hermes Agent',
    tagline: 'Orquestrador de IA e Automação Multi-Agentes para Empresas',
    desc: 'Um agente de IA autônomo que conversa com seus clientes, prospecta no WhatsApp e Telegram e executa automações 24/7 no seu negócio.',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/20',
    cta: 'Ativar Agente',
  },
  {
    icon: BarChart3,
    name: 'BI & Data Pipeline (ETL)',
    tagline: 'Análise de dados automatizada estilo Power BI / Zernio',
    desc: 'Conecte planilhas, ERPs e APIs em um pipeline ETL que gera dashboards executivos, KPIs e relatórios automáticos sem programação.',
    gradient: 'from-purple-500 to-fuchsia-500',
    glow: 'shadow-purple-500/20',
    cta: 'Criar Dashboard',
  },
  {
    icon: Target,
    name: 'Prospecção Inteligente',
    tagline: 'Ferramenta de captação de clientes B2B',
    desc: 'Envie sua base de clientes e a IA gera abordagens personalizadas por WhatsApp e e-mail, com pontuação de oportunidade para cada lead.',
    gradient: 'from-amber-400 to-purple-500',
    glow: 'shadow-purple-500/20',
    cta: 'Prospectar R$ 39,90',
  },
  {
    icon: Kanban,
    name: 'CRM Comercial (Kanban)',
    tagline: 'Gestão de pipeline de vendas em 5 etapas',
    desc: 'Pipeline Discovery → Abordagem → Qualificação → Proposta → Fechamento. Organize leads, mova etapas e acompanhe tudo em tempo real.',
    gradient: 'from-fuchsia-500 to-amber-400',
    glow: 'shadow-amber-500/20',
    cta: 'Abrir Pipeline',
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
  { name: 'Gratuito', price: 'R$ 0', features: ['3 dashboards', '2.000 linhas/mês', 'Upload CSV/Excel', 'Insights básicos por IA'], popular: false },
  { name: 'Starter', price: 'R$ 97', features: ['10 dashboards', '50.000 linhas/mês', 'Alertas automáticos', 'Previsão de vendas 30 dias', 'Exportação de relatórios'], popular: false },
  { name: 'Pro', price: 'R$ 297', features: ['Dashboards ilimitados', '500.000 linhas/mês', 'Análise preditiva avançada', 'API pública', 'Integrações com ERPs', 'Suporte prioritário'], popular: true },
  { name: 'Business', price: 'R$ 597', features: ['Tudo do Pro +', 'Linhas ilimitadas', 'Múltiplos usuários', 'Data lake dedicado', 'Forecast avançado', 'Onboarding personalizado'], popular: false },
  { name: 'Enterprise', price: 'R$ 997', features: ['Tudo do Business +', 'IA customizada', 'SLA 99,9%', 'Gerente dedicado', 'Suporte 24h', 'Armazenamento ilimitado'], popular: false },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Foco em Dados | Hermes Agent, BI, Prospecção e CRM — Inteligência para Empresas'
  }, [])

  const openProspectionCheckout = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!STRIPE_PUBLISHABLE_KEY) return
    try {
      const res = await fetch('/api/stripe/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: PROSPECTION_PRICE_CENTS,
          successUrl: `${window.location.origin}/?checkout=success`,
          cancelUrl: `${window.location.origin}/?checkout=canceled`,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao iniciar o checkout.')
      const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY)
      if (!stripe) throw new Error('Falha ao carregar o Stripe.')
      await stripe.redirectToCheckout({ sessionId: data.sessionId })
    } catch (err: any) {
      alert(err?.message || 'Erro ao iniciar o pagamento.')
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

          {/* Palavras flutuantes interativas — Mystic Tech */}
          <span className="float-word hidden lg:inline-block top-[22%] left-[6%] px-4 py-2 rounded-full glassmorphism text-amber-300 text-xs font-bold tracking-wider">
            HERMES AGENT
          </span>
          <span className="float-word-alt hidden lg:inline-block top-[28%] right-[7%] px-4 py-2 rounded-full glassmorphism text-purple-300 text-xs font-bold tracking-wider">
            BI &amp; DATA PIPELINE
          </span>
          <span className="float-word-alt hidden lg:inline-block top-[58%] left-[9%] px-4 py-2 rounded-full glassmorphism text-fuchsia-300 text-xs font-bold tracking-wider">
            PROSPECÇÃO B2B
          </span>
          <span className="float-word hidden lg:inline-block top-[62%] right-[8%] px-4 py-2 rounded-full glassmorphism text-amber-300 text-xs font-bold tracking-wider">
            CRM KANBAN
          </span>
          <span className="float-word hidden lg:inline-block top-[40%] left-[3%] px-3 py-1.5 rounded-full border border-purple-500/30 text-purple-300 text-[10px] font-bold tracking-widest">
            IA AUTÔNOMA 24/7
          </span>
          <span className="float-word-alt hidden lg:inline-block top-[46%] right-[3.5%] px-3 py-1.5 rounded-full border border-amber-500/30 text-amber-300 text-[10px] font-bold tracking-widest">
            R$ 39,90 PROSPECÇÃO
          </span>

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
              Agente de IA autônomo (Hermes), BI & Data Pipeline, prospecção inteligente e CRM
              Kanban — tudo em uma única plataforma. Sem setup, sem equipe técnica.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                to={user ? '/app' : '/login'}
                className="h-12 px-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 border border-amber-300/50"
              >
                <Upload className="w-4 h-4" />
                Fazer Upload Grátis
              </Link>
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
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} ${s.glow} flex items-center justify-center mb-5 shadow-lg`}>
                    <s.icon className="w-6 h-6 text-slate-950" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{s.name}</h3>
                  <p className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-purple-400 uppercase tracking-wide mt-1">
                    {s.tagline}
                  </p>
                  <p className="text-sm text-slate-400 mt-3 flex-1 leading-relaxed">{s.desc}</p>
                  {s.name === 'Prospecção Inteligente' ? (
                    <button
                      onClick={openProspectionCheckout}
                      className="mt-6 h-10 rounded-lg bg-gradient-to-r from-amber-400 to-purple-500 hover:from-amber-300 hover:to-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {s.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="mt-6 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
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
              Do teste gratuito ao enterprise. Sem fidelidade.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <Link
                    to="/login"
                    className="mt-6 h-10 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    {p.price === 'R$ 0' ? 'Começar Grátis' : 'Assinar'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contato" className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">Foco em Dados</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacidade" className="hover:text-slate-300 transition-colors">Privacidade</Link>
            <Link to="/termos" className="hover:text-slate-300 transition-colors">Termos</Link>
            <a
              href="mailto:atendimento@focoemdados.com.br"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-amber-300 hover:bg-white/10 hover:text-amber-200 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              atendimento@focoemdados.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
