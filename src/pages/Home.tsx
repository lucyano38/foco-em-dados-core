import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SpreadsheetUpload from '../components/SpreadsheetUpload'
import { Upload, BarChart3, TrendingUp, Database, ArrowRight, Sparkles, Check, Shield } from 'lucide-react'

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
    document.title = 'Foco em Dados | Inteligência de Dados e Previsão de Vendas para o Varejo'
  }, [])

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="mesh-bg" />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Foco em Dados</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#funciona" className="hover:text-white transition-colors">Como funciona</a>
            <Link to="/precos" className="hover:text-white transition-colors">Planos</Link>
            <Link to="/admin/automacao" className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Acesso Restrito Admin
            </Link>
            <a href="#contato" className="hover:text-white transition-colors">Suporte</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/app"
                className="h-9 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all"
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
                  className="h-9 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all"
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
          <div className="absolute inset-0 bg-slate-950/40"></div>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-6 glassmorphism">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sua loja com IA — sem programação
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Inteligência de Dados e{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 bg-clip-text text-transparent">
                Previsão de Vendas
              </span>
              <br />
              para o Varejo
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Faça upload da sua planilha de vendas e receba dashboards automáticos, 
              insights por IA e previsões para os próximos 30 dias. 
              Sem setup, sem equipe técnica.
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
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Foco em Dados
          </div>
          <div className="flex items-center gap-6">
            <Link to="/admin/automacao" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">Acesso Restrito Admin</Link>
            <Link to="/privacidade" className="hover:text-slate-300 transition-colors">Privacidade</Link>
            <Link to="/termos" className="hover:text-slate-300 transition-colors">Termos</Link>
            <a href="mailto:atendimento@focoemdados.com.br" className="hover:text-slate-300 transition-colors">atendimento@focoemdados.com.br</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
