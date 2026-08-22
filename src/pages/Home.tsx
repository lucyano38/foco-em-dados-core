import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import SpreadsheetUpload from '../components/SpreadsheetUpload'
import { WHATSAPP_URL, CONTACT_EMAIL, TELEGRAM_URL } from '../lib/contact'
import { safeJson } from '../lib/safeFetch'
import {
  Upload, BarChart3, TrendingUp, Database, ArrowRight, Sparkles, Check, Bot, Target, Kanban, Workflow, Mail, MessageCircle, FileText, DollarSign, Zap, PlayCircle, Bell, Settings, ChevronsDown, Search, MapPin, Globe, MessageSquare, Send, Shield
} from 'lucide-react'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
const PROSPECTION_PRICE_CENTS = 3990 // R$ 39,90

const LUCIANO_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano! Gostaria de ativar o seu agente de IA no meu negócio.')}`
const PROSPECTION_CHECKOUT_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano, quero ativar a Prospecção Inteligente por R$ 39,90.')}`
const FREE_PLAN_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano, quero iniciar no plano Gratuito')}`

const PIPELINE_STAGES = [
  { name: 'Novo', color: '#60a5fa' },
  { name: 'Redesenhado', color: '#a78bfa' },
  { name: 'Publicado', color: '#ffc107' },
  { name: 'Proposta', color: '#f472b6' },
  { name: 'Respondeu', color: '#4ade80' },
  { name: 'Fechado', color: '#34d399' },
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

  const [prospectForm, setProspectForm] = useState({ city: '', niche: '' })
  const [prospectLoading, setProspectLoading] = useState(false)
  const [prospectResult, setProspectResult] = useState<string | null>(null)

  const NICHOS = [
    'Restaurante',
    'Barbearia',
    'Clínica odontológica',
    'Clínica estética',
    'Imobiliária',
    'Academia',
    'Padaria',
    'E-commerce',
    'Serviços locais',
    'Profissional liberal',
  ]

  const handleProspect = async () => {
    setProspectResult(null)
    setProspectLoading(true)
    try {
      const payload = {
        city: prospectForm.city.trim(),
        segment: prospectForm.niche.trim(),
        geo: true,
        limit: 8,
      }
      const res = await fetch('/api/prospection/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao prospectar.')
      }
      const total = Array.isArray(data.leads) ? data.leads.length : 0
      setProspectResult(`Prospecção concluída: ${total} leads encontrados em "${payload.city || 'sua região'}".`)
    } catch (err: any) {
      setProspectResult(err?.message || 'Erro inesperado.')
    } finally {
      setProspectLoading(false)
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
            <span className="font-[family-name:var(--font-display)] font-bold text-2xl tracking-tighter text-[#ffe4af]">Foco em Dados</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#prospeccao" className="hover:text-[#ffe4af] transition-colors border-b-2 border-transparent hover:border-[#ffc107] pb-0.5">Prospecção</a>
            <a href="#analytics" className="hover:text-[#ffe4af] transition-colors">IA</a>
            <a href="#crm" className="hover:text-[#ffe4af] transition-colors">CRM</a>
            <a href="#agente" className="hover:text-[#ffe4af] transition-colors">Agente</a>
            <Link to="/precos" className="hover:text-[#ffe4af] transition-colors">Preços</Link>
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
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden portal-bg">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#121414]"></div>
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full bg-gradient-to-tr from-[#5203d5]/30 via-[#ffc107]/20 to-transparent blur-[100px] animate-portal"></div>
            <div className="absolute w-[300px] h-[300px] rounded-full border border-[#ffc107]/20 animate-ping opacity-20"></div>
          </div>

          <div className="relative z-20 px-6 md:px-16 text-center max-w-4xl mx-auto space-y-8">
            <div className="space-y-4 animate-float">
              <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold text-glow tracking-tight text-center">
                Painel Central{' '}
                <span className="text-[#ffe4af]">Foco em Dados</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300/80 max-w-2xl mx-auto font-light leading-relaxed">
                Prospecção, CRM e atendimento inteligente em uma plataforma só.
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
                href="#prospeccao"
                className="glass-panel px-10 py-5 rounded-full text-lg font-medium hover:bg-white/5 transition-all flex items-center gap-3 border border-white/10"
              >
                Ver Funcionalidades
                <PlayCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* Zig-Zag 1 - Prospecção */}
        <section id="prospeccao" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-purple-500 flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#ffe4af] uppercase tracking-wider">Nova captação</p>
                  <p className="text-sm text-slate-300">Google Maps, Redes e CNAE</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Cidade ou região"
                  className="input-mystic h-10 px-3 text-sm"
                  value={prospectForm.city}
                  onChange={(e) => setProspectForm((f) => ({ ...f, city: e.target.value }))}
                />
                <input
                  placeholder="Nicho ou CNAE"
                  className="input-mystic h-10 px-3 text-sm"
                  value={prospectForm.niche}
                  onChange={(e) => setProspectForm((f) => ({ ...f, niche: e.target.value }))}
                />
              </div>
              <button
                type="button"
                onClick={handleProspect}
                disabled={prospectLoading}
                className="mt-4 w-full h-10 rounded-lg bg-gradient-to-r from-amber-400 to-purple-500 hover:from-amber-300 hover:to-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer pointer-events-auto disabled:opacity-50"
              >
                {prospectLoading ? 'Prospectando...' : 'Prospectar'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {prospectResult && (
                <p className="mt-3 text-[11px] font-mono text-[#d4c5ab] whitespace-pre-wrap">{prospectResult}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semib mb-5 glassmorphism">
                <Target className="w-3.5 h-3.5" />
                Prospecção Inteligente
              </div>
              <h2 className="text-3xl font-bold">Captação externa qualificada</h2>
              <p className="text-slate-400 leading-relaxed">
                Busque empresas por cidade, nicho e CNAE, gere leads qualificados e envie automaticamente para o CRM.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Busca segmentada em Google Maps e redes</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Abordagens personalizadas por IA</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Envio automático para o pipeline</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Zig-Zag 2 - Análise de IA */}
        <section id="analytics" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semib mb-5 glassmorphism">
                <BarChart3 className="w-3.5 h-3.5" />
                BI & Data Pipeline
              </div>
              <h2 className="text-3xl font-bold">Análise preditiva em tempo real</h2>
              <p className="text-slate-400 leading-relaxed">
                Dashboards executivos consolidados de múltiplas fontes com alertas automáticos e previsão de vendas.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> KPIs consolidados em tempo real</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Alertas automáticos por IA</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Previsão de vendas para 30 dias</li>
              </ul>
            </div>

            <div className="order-1 md:order-2">
              <div className="glass-card p-5 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Leads', value: '12,845', delta: '+14.2%' },
                    { label: 'MRR', value: 'R$ 256k', delta: '+12%' },
                    { label: 'Propostas', value: '342', delta: '+5' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]">{m.label}</p>
                      <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white mt-1">{m.value}</p>
                      <p className="text-[11px] text-[#4ade80]">{m.delta}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 h-44 w-full">
                  <svg viewBox="0 0 400 140" className="h-full w-full">
                    <defs>
                      <linearGradient id="glowGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffc107" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#ffc107" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="glowPortal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#cdbdff" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#cdbdff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,110 C40,95 70,80 110,72 C150,64 180,60 220,48 C260,36 290,40 330,24 C360,14 380,20 400,16 L400,140 L0,140 Z" fill="url(#glowGold)" />
                    <path d="M0,120 C40,110 80,100 120,96 C160,92 200,80 240,76 C280,72 320,68 360,58 C380,54 390,52 400,50 L400,140 L0,140 Z" fill="url(#glowPortal)" />
                    <polyline points="0,110 40,95 70,80 110,72 150,64 180,60 220,48 260,36 290,40 330,24 360,14 380,20 400,16" fill="none" stroke="#ffc107" strokeWidth="2.5" />
                    <polyline points="0,120 40,110 80,100 120,96 160,92 200,80 240,76 280,72 320,68 360,58 380,54 390,52 400,50" fill="none" stroke="#cdbdff" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Zig-Zag 3 - CRM Comercial */}
        <section id="crm" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <p className="text-xs font-bold text-[#ffe4af] uppercase tracking-wider mb-4">Pipeline Comercial</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.name} className="flex flex-col items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: stage.color }}></div>
                    <span className="text-[11px] font-semibold text-center text-slate-200">{stage.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ffc107] to-[#5203d5]" style={{ width: '64%' }}></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semib mb-5 glassmorphism">
                <Kanban className="w-3.5 h-3.5" />
                CRM Comercial
              </div>
              <h2 className="text-3xl font-bold">Acompanhamento do pipeline</h2>
              <p className="text-slate-400 leading-relaxed">
                Gerencie propostas, follow-ups e fechamento com histórico unificado e sincronização automática com as captações.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Pipeline visual em 6 etapas</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Histórico unificado de conversas</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Geração de minuta e documento final</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Zig-Zag 4 - Agente Hermes & Telegram */}
        <section id="agente" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm text-slate-300 mb-4">Atendimento automático integrado ao Telegram via n8n.</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('site-chat-open-btn');
                    if (btn) btn.click();
                  }}
                  className="h-10 rounded-lg bg-[#ffc107] hover:bg-[#ffca28] text-[#121414] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer pointer-events-auto"
                >
                  Abrir Chat do Agente
                </button>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  Abrir Telegram
                  <Send className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semib mb-5 glassmorphism">
                <Bot className="w-3.5 h-3.5" />
                Agente Luciano
              </div>
              <h2 className="text-3xl font-bold">Automação no WhatsApp, Telegram e Instagram</h2>
              <p className="text-slate-400 leading-relaxed">
                Agente com IA treinada nos dados da sua empresa, com atendimento 24/7, agendamento e alertas VIP.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Respostas inteligentes por canal</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Integração n8n + Telegram</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-400 mt-0.5" /> Qualificação de leads em tempo real</li>
              </ul>
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
                <div key={item.step} className="glass-card p-8 text-center bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl">
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
              {[
                { icon: Upload, title: 'Upload de Planilhas', desc: 'Arraste seu CSV ou Excel. A IA analisa automaticamente seus dados.' },
                { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Visualize receita, ticket médio, top produtos e tendências.' },
                { icon: TrendingUp, title: 'Previsão de Vendas', desc: 'Projeções para os próximos 30 dias com base no histórico.' },
                { icon: Sparkles, title: 'Insights por IA', desc: 'Alertas automáticos de oportunidade, risco e sazonalidade.' },
              ].map((f) => (
                <div key={f.title} className="glass-card p-6 rounded-3xl">
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
              {[
                { name: 'Gratuito', price: 'R$ 0', cta: 'Começar Grátis', features: ['3 dashboards', '2.000 linhas/mês', 'Upload CSV/Excel', 'Insights básicos por IA'], popular: false, href: FREE_PLAN_WHATSAPP_URL },
                { name: 'Starter', price: 'R$ 97', cta: 'Assinar', features: ['10 dashboards', '50.000 linhas/mês', 'Alertas automáticos', 'Previsão de vendas 30 dias', 'Exportação de relatórios'], popular: false, href: 'https://buy.stripe.com/cNifZheobdbYd0Db9O5Vu04' },
                { name: 'Pro', price: 'R$ 297', cta: 'Assinar', features: ['Dashboards ilimitados', '500.000 linhas/mês', 'Análise preditiva avançada', 'API pública', 'Integrações com ERPs', 'Suporte prioritário'], popular: true, href: 'https://buy.stripe.com/cNi7sLfsf0pcbWzem05Vu05' },
              ].map((p) => (
                <div key={p.name} className={`glass-card p-6 flex flex-col rounded-3xl ${p.popular ? 'border-cyan-500/30 ring-1 ring-cyan-500/20' : ''}`}>
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

      <footer id="contato" className="relative border-t border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center shadow-lg shadow-[#5203d5]/20">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#e3e2e2] leading-tight">Foco em Dados</p>
                  <p className="text-[10px] font-mono text-[#fabd00]/80">CNPJ: 00.000.000/0001-00</p>
                </div>
              </div>
              <p className="text-xs text-[#d4c5ab]/80 leading-relaxed max-w-xs">
                Automação com IA, sites de alta conversão e Business Intelligence para o seu negócio.
              </p>
              <div className="space-y-1.5 text-[11px] text-[#d4c5ab]/70">
                <p className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-[#fabd00]/80" /> São Paulo, SP — Brasil
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-[#fabd00]/80" /> focoemdados.com.br
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#fabd00]/70">
                Atendimento & Automação
              </p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-[#d4c5ab] hover:text-[#fabd00] transition-colors inline-flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" /> {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#d4c5ab] hover:text-[#4ade80] transition-colors inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp (11) 99441-1307
                  </a>
                </li>
                <li>
                  <a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#d4c5ab] hover:text-[#60a5fa] transition-colors inline-flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Telegram n8n
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#fabd00]/70">
                Políticas & Transparência
              </p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/termos-de-uso" className="text-[#d4c5ab] hover:text-[#fabd00] transition-colors inline-flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link to="/politica-de-privacidade" className="text-[#d4c5ab] hover:text-[#fabd00] transition-colors inline-flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Política de Privacidade
                  </Link>
                </li>
                <li className="text-[#d4c5ab]/70">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Sem vínculo com Google Inc.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#d4c5ab]/50">
            <p>© 2026 Foco em Dados — Luciano Tavares. Todos os direitos reservados.</p>
            <p className="flex items-center gap-2">
              <Globe className="w-3 h-3" /> focoemdados.com.br
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
