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

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Foco em Dados | Agente Luciano, BI, Prospecção e CRM — Inteligência para Empresas'
  }, [])

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
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/app" className="h-9 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="h-9 px-4 rounded-lg border border-white/10 text-sm font-medium">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24">
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SOLUTIONS.map((s) => (
              <div key={s.name} className="glass-card p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
                <h3 className="text-lg font-bold text-slate-100">{s.name}</h3>
                <p className="text-sm text-slate-400 mt-2">{s.subtitle}</p>
                {s.ctaType === 'external' ? (
                  <a href={s.externalUrl} target="_blank" rel="noreferrer" className="mt-5 block w-full text-center py-2 rounded-lg bg-amber-500 text-black font-bold">
                    {s.cta}
                  </a>
                ) : (
                  <Link to={s.route} className="mt-5 block w-full text-center py-2 rounded-lg bg-white/10 border border-white/10">
                    {s.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
',path: