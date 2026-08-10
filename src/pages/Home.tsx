import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import MetricsOverlay from '../components/MetricsOverlay'
import ProspectionFunnel from '../components/ProspectionFunnel'
import LeadsTable from '../components/LeadsTable'
import SpreadsheetUpload from '../components/SpreadsheetUpload'
import MouseGlow from '../components/MouseGlow'
import { Bot, Globe, BarChart3, Check, Database, ArrowRight } from 'lucide-react'

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
    document.title = 'Foco em Dados | Painel Central — Prospecção, Sites e BI com IA'
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
              </div>
            ))}
          </div>
        </section>

        <ProspectionFunnel />
        <LeadsTable />

        {/* Upload de Planilha + Stripe */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-center mb-4">
            Envie sua planilha de prospecção
          </h2>
          <p className="text-[#d4c5ab] text-center mb-10 max-w-xl mx-auto">
            Até 100 linhas: envio gratuito para o pipeline. Acima disso, faça login e
            desbloqueie com um pagamento único de R$ 39,90.
          </p>
          <SpreadsheetUpload />
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

      <footer id="contato" className="border-t border-[#4f4632]/40 py-12 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#d4c5ab]/70">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#fabd00]" />
            <span className="font-semibold text-[#e3e2e2]">Foco em Dados</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/admin/automacao" className="text-[#fabd00] hover:text-[#ffe4af] font-bold transition-colors">Acesso Restrito Admin</Link>
            <Link to="/privacidade" className="hover:text-[#e3e2e2] transition-colors">Privacidade</Link>
            <Link to="/termos" className="hover:text-[#e3e2e2] transition-colors">Termos</Link>
            <a href="mailto:atendimento@focoemdados.com.br" className="hover:text-[#e3e2e2] transition-colors">atendimento@focoemdados.com.br</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
