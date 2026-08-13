import { Link } from 'react-router-dom'
import { Check, Database, ArrowLeft } from 'lucide-react'

import { WHATSAPP_URL, CONTACT_EMAIL } from '../lib/contact'

const PLANS = [
  {
    tier: 'free',
    name: 'Gratuito',
    price: 0,
    description: 'Para testar a plataforma sem compromisso.',
    features: [
      '3 dashboards',
      '2.000 linhas/mês',
      'Upload CSV/Excel',
      'Insights básicos por IA',
      '50 MB de armazenamento',
    ],
  },
  {
    tier: 'starter',
    name: 'Starter',
    price: 97,
    description: 'Para pequenos lojistas que querem crescer.',
    features: [
      '10 dashboards',
      '50.000 linhas/mês',
      'Alertas automáticos',
      'Previsão de vendas 30 dias',
      'Exportação de relatórios',
      '500 MB de armazenamento',
    ],
    highlighted: false,
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 297,
    description: 'Para negócios em expansão com equipe enxuta.',
    features: [
      'Dashboards ilimitados',
      '500.000 linhas/mês',
      'Análise preditiva avançada',
      'API pública',
      'Integrações com ERPs',
      'Suporte prioritário',
      '2 GB de armazenamento',
    ],
    highlighted: true,
  },
  {
    tier: 'business',
    name: 'Business',
    price: 597,
    description: 'Para equipes que precisam de análises avançadas.',
    features: [
      'Dashboards ilimitados',
      'Linhas ilimitadas',
      'Múltiplos usuários',
      'Data lake dedicado',
      'Forecast avançado',
      'Onboarding personalizado',
      'Suporte 24h',
      '10 GB de armazenamento',
    ],
    highlighted: false,
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 997,
    description: 'Para grandes operações com demandas personalizadas.',
    features: [
      'Usuários ilimitados',
      'Linhas ilimitadas',
      'IA customizada',
      'SLA 99,9%',
      'Gerente dedicado',
      'Treinamento de equipe',
      'Suporte 24h',
      '100 GB de armazenamento',
    ],
    highlighted: false,
  },
]

function formatBRL(cents: number): string {
  if (cents === 0) return 'Grátis'
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Pricing() {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="mesh-bg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <Database className="w-3.5 h-3.5" />
            Planos
          </div>
          <h1 className="text-4xl font-bold">Escolha o plano ideal para sua loja</h1>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={`glass-card p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-cyan-500/30 ring-1 ring-cyan-500/20 scale-[1.02]'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  Mais Popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-xs text-slate-400 mt-1 mb-3">{plan.description}</p>
              <p className="text-3xl font-bold mb-1">
                {formatBRL(plan.price * 100)}
                {plan.price > 0 && <span className="text-sm font-normal text-slate-400">/mês</span>}
              </p>
              {plan.price > 0 && (
                <p className="text-xs text-slate-500 mb-4">
                  {(plan.price * 10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/ano
                </p>
              )}
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-slate-400 flex items-start gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`mt-6 h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  plan.highlighted
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                    : 'bg-white/5 hover:bg-white/10 text-slate-100 border border-white/10'
                }`}
              >
                {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 space-y-2">
          <p className="text-xs text-slate-500">
            Ao assinar, você concorda com nossos{' '}
            <Link to="/termos" className="text-cyan-400 hover:underline">Termos de Uso</Link>.
          </p>
          <p className="text-xs text-slate-500">
            Dúvidas? Fale com a gente no{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
              WhatsApp (11) 99441-1307
            </a>{' '}
            ou{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
