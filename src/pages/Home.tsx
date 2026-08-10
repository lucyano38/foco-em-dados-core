import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import MetricsOverlay from '../components/MetricsOverlay'
import SpreadsheetUpload from '../components/SpreadsheetUpload'
import Footer from '../components/Footer'
import MouseGlow from '../components/MouseGlow'
import {
  Bot, Globe, BarChart3, Check, ArrowRight, Upload, Zap, MessageCircle,
} from 'lucide-react'

const PILLARS = [
  {
    icon: Bot,
    title: 'Automação & IA',
    tag: 'Hermes Agent',
    desc: 'Prospecção autônoma de leads (empresas com ou sem site), abordagem via WhatsApp e pipeline de conversão gerenciado 24/7.',
    accent: 'text-[#fabd00]',
    border: 'border-[#fabd00]/30 hover:border-[#fabd00]/60',
  },
  {
    icon: Globe,
    title: 'Sites & Lojas Virtuais',
    tag: 'Alta Conversão',
    desc: 'Criação e redesign de sites, landing pages e lojas virtuais de alta conversão, com links de demonstração temporários (*.ts.net).',
    accent: 'text-[#cdbdff]',
    border: 'border-[#5203d5]/50 hover:border-[#cdbdff]/60',
  },
  {
    icon: BarChart3,
    title: 'Business Intelligence',
    tag: 'Power BI / Qlik',
    desc: 'Upload de planilhas CSV/XLSX gerando instantaneamente dashboards executivos interativos com gráficos e tabelas.',
    accent: 'text-[#4ade80]',
    border: 'border-[#4ade80]/30 hover:border-[#4ade80]/60',
  },
]

const STEPS = [
  {
    icon: Upload,
    title: 'Envie sua planilha',
    desc: 'CSV ou Excel com até 100 linhas grátis. Acima disso, um pagamento único de R$ 39,90 desbloqueia o processamento completo.',
  },
  {
    icon: Zap,
    title: 'IA processa o pipeline de dados',
    desc: 'ETL automático: ingestão, limpeza e padronização dos dados em segundos — sem planilha interminável.',
  },
  {
    icon: MessageCircle,
    title: 'Receba insights e ação',
    desc: 'Dashboard executivo interativo + automação de prospecção e acompanhamento pelo WhatsApp.',
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

  useEffect(() => {
    document.title = 'Foco em Dados | Automação, Sites e BI com IA'
  }, [])

  return (
    <div className="w-full min-h-screen bg-[#121414] text-[#e3e2e2] font-sans">
      <div className="mesh-bg" />
      <MouseGlow />
      <Navbar />

      <main>
        <Hero />

        <MetricsOverlay />

        {/* Pilares do negócio */}
        <section id="pilares" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-center mb-4">
            Soluções para o seu negócio
          </h2>
          <p className="text-[#d4c5ab] text-center mb-12 max-w-xl mx-auto">
            Três frentes integradas por IA, do primeiro contato à análise de dados.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {PILLARS.map((p) => (
              <div key={p.title} className={`glass-card p-8 rounded-2xl border ${p.border} card-hover`}>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                  <p.icon className={`w-6 h-6 ${p.accent}`} />
                </div>
                <span className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest ${p.accent}`}>
                  {p.tag}
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold mt-1 mb-2">{p.title}</h3>
                <p className="text-sm text-[#d4c5ab] leading-relaxed">{p.desc}</p>
                <Link to="#upload" className="inline-flex items-center gap-1.5 text-sm text-[#fabd00] font-medium mt-4 hover:text-[#ffe4af] transition-colors">
                  Começar <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-center mb-4">Como funciona</h2>
          <p className="text-[#d4c5ab] text-center mb-12 max-w-xl mx-auto">
            Do upload da planilha ao dashboard executivo em 3 passos.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="glass-card p-8 rounded-2xl relative card-hover">
                <span className="font-[family-name:var(--font-mono)] text-4xl font-bold text-[#fabd00]/10 absolute top-4 right-6">
                  0{i + 1}
                </span>
                <div className="w-12 h-12 rounded-xl bg-[#fabd00]/10 border border-[#fabd00]/30 flex items-center justify-center mb-5">
                  <s.icon className="w-6 h-6 text-[#fabd00]" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-[#d4c5ab] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upload de Planilha + Stripe */}
        <section id="upload" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-center mb-4">
            Fazer Upload de Planilha
          </h2>
          <p className="text-[#d4c5ab] text-center mb-10 max-w-xl mx-auto">
            Até 100 linhas: processamento gratuito. Acima disso, faça login e
            desbloqueie com um pagamento único de R$ 39,90.
          </p>
          <SpreadsheetUpload />
        </section>

        {/* CTA final */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-20">
          <div className="glassmorphism rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#fabd00]/10 via-transparent to-[#5203d5]/20 pointer-events-none" />
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold mb-3 relative">
              Pronto para escalar com IA?
            </h2>
            <p className="text-[#d4c5ab] max-w-lg mx-auto mb-8 relative">
              Automação de vendas, site de alta conversão e BI sob demanda em um só lugar. Teste grátis agora.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
              <Link to={user ? '/app' : '/login'} className="btn-glow h-12 px-8 rounded-xl text-sm flex items-center gap-2">
                {user ? 'Abrir minha área' : 'Criar conta grátis'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/5511999990000?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20Foco%20em%20Dados"
                target="_blank"
                rel="noreferrer"
                className="h-12 px-8 rounded-xl border border-[#4f4632]/60 hover:border-[#4ade80]/50 text-sm text-[#4ade80] flex items-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Planos */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-center mb-4">Planos</h2>
          <p className="text-[#d4c5ab] text-center mb-12 max-w-xl mx-auto">
            Do teste gratuito ao enterprise. Sem fidelidade.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PLANS.map((p) => (
              <div key={p.name} className={`glass-card p-6 rounded-2xl flex flex-col card-hover ${p.popular ? 'border-[#fabd00]/40 ring-1 ring-[#fabd00]/20' : ''}`}>
                {p.popular && (
                  <span className="text-[10px] font-bold text-[#fabd00] uppercase tracking-wider mb-2">Mais Popular</span>
                )}
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">{p.name}</h3>
                <p className="text-2xl font-bold mt-2 text-[#ffe4af]">{p.price}<span className="text-sm font-normal text-[#d4c5ab]/60">{p.price !== 'R$ 0' ? '/mês' : ''}</span></p>
                <ul className="mt-4 space-y-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="text-sm text-[#d4c5ab] flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#fabd00] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className="mt-6 h-10 rounded-lg btn-glow text-sm flex items-center justify-center gap-2"
                >
                  {p.price === 'R$ 0' ? 'Começar Grátis' : 'Assinar'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
