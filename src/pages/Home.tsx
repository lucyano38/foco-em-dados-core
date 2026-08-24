import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import SpreadsheetUpload from '../components/SpreadsheetUpload'
import VideoShowcase from '../components/VideoShowcase'
import { WHATSAPP_URL, CONTACT_EMAIL, TELEGRAM_URL, WHATSAPP_NUMBER } from '../lib/contact'
import { safeJson } from '../lib/safeFetch'
import {
  Upload, BarChart3, TrendingUp, Database, ArrowRight, Check, Bot, Target, Kanban, Workflow, Mail, MessageCircle, FileText, DollarSign, Zap, PlayCircle, Bell, Settings, Search, MapPin, Globe, MessageSquare, Send, Shield, Phone, Linkedin, Twitter
} from 'lucide-react'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
const PROSPECTION_PRICE_CENTS = 3990 // R$ 39,90

const LUCIANO_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano! Gostaria de ativar o seu agente de IA no meu negócio.')}`
const PROSPECTION_CHECKOUT_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano, quero ativar a Prospecção Inteligente por R$ 39,90.')}`
const FREE_PLAN_WHATSAPP_URL = `https://wa.me/5511994411307?text=${encodeURIComponent('Olá Luciano, quero iniciar no plano Gratuito')}`

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const PIPELINE_STAGES = [
  { name: 'Novo', color: '#60a5fa' },
  { name: 'Redesenhado', color: '#a78bfa' },
  { name: 'Publicado', color: '#ffc107' },
  { name: 'Proposta', color: '#f472b6' },
  { name: 'Respondeu', color: '#4ade80' },
  { name: 'Fechado', color: '#34d399' },
]

const TRUST_LOGOS = [
  { name: 'TechCrunch', icon: 'TC' },
  { name: 'Forbes', icon: 'FB' },
  { name: 'Exame', icon: 'EX' },
  { name: 'Valor Econômico', icon: 'VE' },
  { name: 'Startup Brasil', icon: 'SB' },
]

const METRICS = [
  { label: 'Leads Ativos', value: '12.8k', delta: '+14.2%', icon: Target },
  { label: 'MRR', value: 'R$ 256k', delta: '+12%', icon: TrendingUp },
  { label: 'Propostas', value: '342', delta: '+5', icon: FileText },
  { label: 'Empresas Atendidas', value: '850+', delta: '+22', icon: Target },
]

const INDUSTRIES = [
  { title: 'Varejo', desc: 'Dashboards de vendas, estoque e sazonalidade.', icon: Upload },
  { title: 'Serviços', desc: 'Prospecção local, CRM e agenda inteligente.', icon: MessageSquare },
  { title: 'Saúde', desc: 'Indicadores de pacientes, convênios e faturamento.', icon: Shield },
  { title: 'Indústria', desc: 'Produção, qualidade, manutenção e custos.', icon: Settings },
]

const ROLES = [
  { title: 'Diretor / Dono', desc: 'Decisão rápida com dados unificados.', cta: 'Quero ver o painel', whatsapp_message: 'Olá! Gostaria de saber mais sobre as automações e redesign da Foco em Dados.' },
  { title: 'Marketing / Vendas', desc: 'Leads qualificados, pipeline e conversão.', cta: 'Ver funil de vendas', whatsapp_message: 'Olá! Gostaria de ativar a Prospecção Inteligente e aumentar minha geração de leads.' },
  { title: 'Operações / BI', desc: 'Dashboards, alertas e automação.', cta: 'Conhecer o BI', whatsapp_message: 'Olá! Gostaria de saber mais sobre dashboards, automações e integração de dados.' },
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
      if (data.url) window.location.href = data.url
      else throw new Error('URL de checkout não retornada pelo servidor.')
    } catch {
      window.location.href = PROSPECTION_CHECKOUT_WHATSAPP_URL
    }
  }

  const [prospectForm, setProspectForm] = useState({ city: '', niche: '' })
  const [prospectLoading, setProspectLoading] = useState(false)
  const [prospectResult, setProspectResult] = useState<string | null>(null)

  const NICHOS = [
    'Restaurante', 'Barbearia', 'Clínica odontológica', 'Clínica estética',
    'Imobiliária', 'Academia', 'Padaria', 'E-commerce', 'Serviços locais', 'Profissional liberal',
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
      if (!res.ok) throw new Error(data?.error || 'Erro ao prospectar.')
      const total = Array.isArray(data.leads) ? data.leads.length : 0
      setProspectResult(`Prospecção concluída: ${total} leads encontrados em "${payload.city || 'sua região'}".`)
    } catch (err: any) {
      setProspectResult(err?.message || 'Erro inesperado.')
    } finally {
      setProspectLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#0B1220] text-slate-100 font-sans">
      <div className="mesh-bg" />

      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B1220]/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D97706] to-[#1E40AF] flex items-center justify-center shadow-[0_0_12px_rgba(217,119,6,0.25)]">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-[family-name:var(--font-display)] font-bold text-2xl tracking-tighter text-[#FFFBEB]">Foco em Dados</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#solucoes" className="hover:text-[#FFFBEB] transition-colors border-b-2 border-transparent hover:border-[#D97706] pb-0.5">Soluções</a>
            <a href="#setores" className="hover:text-[#FFFBEB] transition-colors">Setores</a>
            <a href="#resultados" className="hover:text-[#FFFBEB] transition-colors">Resultados</a>
            <Link to="/precos" className="hover:text-[#FFFBEB] transition-colors">Preços</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/app"
                className="h-10 px-5 rounded-full bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(217,119,6,0.35)] hover:scale-105 active:scale-95"
              >
                <Database className="w-4 h-4" />
                Acessar Painel
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-[#FFFBEB] transition-colors">Entrar</Link>
                <Link
                  to="/login"
                  className="h-10 px-5 rounded-full bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(217,119,6,0.35)] hover:scale-105 active:scale-95"
                >
                  Começar Agora
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-[92vh] flex items-center justify-center pt-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1220]/70 via-[#0B1220]/60 to-[#0B1220]"></div>
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <div className="w-[520px] h-[520px] md:w-[720px] md:h-[720px] rounded-full bg-gradient-to-tr from-[#1E40AF]/25 via-[#D97706]/15 to-transparent blur-[110px]"></div>
          </div>

          <div className="relative z-20 px-6 md:px-16 text-center max-w-5xl mx-auto space-y-7">
            <div className="space-y-4">
              <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-extrabold tracking-tight text-[#FFFBEB]">
                Inteligência de dados para decisões corporativas
              </h1>
              <p className="text-lg md:text-2xl text-slate-300/80 max-w-3xl mx-auto leading-relaxed">
                BI, prospecção, CRM e automação em uma plataforma. Resultados mensuráveis, menos ruído.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link
                to={user ? '/app' : '/login'}
                className="h-12 px-8 rounded-full bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-base flex items-center gap-2 transition-all shadow-[0_0_28px_rgba(217,119,6,0.45)] hover:scale-105 active:scale-95"
              >
                Solicitar acesso
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#resultados"
                className="h-12 px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-base font-medium text-[#FFFBEB] flex items-center gap-2 transition-all backdrop-blur-md"
              >
                Ver resultados
                <PlayCircle className="w-5 h-5" />
              </a>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-300/70">
              <span className="inline-flex items-center gap-2"><Check className="w-4 h-4 text-[#4ade80]" /> Integração em 48h</span>
              <span className="inline-flex items-center gap-2"><Check className="w-4 h-4 text-[#4ade80]" /> Suporte especializado</span>
              <span className="inline-flex items-center gap-2"><Check className="w-4 h-4 text-[#4ade80]" /> Dados seguros</span>
            </div>
          </div>
        </section>

        {/* Trust / Metrics */}
        <section id="resultados" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-80 mb-12">
              {TRUST_LOGOS.map((logo) => (
                <div key={logo.name} className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-[#FFFBEB]">{logo.icon}</span>
                  {logo.name}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {METRICS.map((m) => (
                <div key={m.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition hover:border-[#D97706]/40 hover:shadow-[0_0_30px_rgba(217,119,6,0.12)]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-300/70">{m.label}</p>
                  <p className="text-3xl font-extrabold text-[#FFFBEB] mt-1">{m.value}</p>
                  <p className="text-xs text-[#4ade80] mt-1">{m.delta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions by Industry */}
        <section id="setores" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight text-[#FFFBEB]">Soluções por setor</h2>
              <p className="mt-3 text-base text-slate-300/80 max-w-2xl mx-auto">Modelos prontos para operar, com governança e performance.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {INDUSTRIES.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#D97706]/40 hover:shadow-[0_0_30px_rgba(217,119,6,0.12)]">
                  <div className="w-10 h-10 rounded-xl bg-[#1E40AF]/10 border border-[#1E40AF]/20 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-[#60a5fa]" />
                  </div>
                  <h3 className="text-base font-bold text-[#FFFBEB]">{item.title}</h3>
                  <p className="text-sm text-slate-300/80 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions by Role */}
        <section id="solucoes" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {ROLES.map((role) => (
              <div key={role.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col transition hover:border-[#D97706]/40 hover:shadow-[0_0_30px_rgba(217,119,6,0.12)]">
                <h3 className="text-lg font-bold text-[#FFFBEB]">{role.title}</h3>
                <p className="text-sm text-slate-300/80 mt-2">{role.desc}</p>
                <button
                  type="button"
                  onClick={() => scrollToSection(role.title.includes('Diretor') || role.title.includes('Dono') ? 'resultados' : role.title.includes('Marketing') || role.title.includes('Vendas') ? 'solucoes' : 'setores')}
                  className="mt-6 h-10 rounded-lg bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {role.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Video Showcase */}
        <VideoShowcase />

        {/* Prospecção / Lead gen */}
        <section id="prospeccao" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 border border-[#D97706]/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#FFFBEB] uppercase tracking-wider">Captação qualificada</p>
                  <p className="text-sm text-slate-300">Google Maps, Google, Facebook e CNAE</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Cidade ou região"
                  className="h-10 px-3 text-sm rounded-lg bg-white/5 border border-white/10 text-[#FFFBEB] placeholder:text-slate-400 focus:border-[#D97706] focus:outline-none"
                  value={prospectForm.city}
                  onChange={(e) => setProspectForm((f) => ({ ...f, city: e.target.value }))}
                />
                <input
                  placeholder="Nicho ou CNAE"
                  className="h-10 px-3 text-sm rounded-lg bg-white/5 border border-white/10 text-[#FFFBEB] placeholder:text-slate-400 focus:border-[#D97706] focus:outline-none"
                  value={prospectForm.niche}
                  onChange={(e) => setProspectForm((f) => ({ ...f, niche: e.target.value }))}
                />
              </div>
              <button
                type="button"
                onClick={handleProspect}
                disabled={prospectLoading}
                className="mt-4 w-full h-10 rounded-lg bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {prospectLoading ? 'Prospectando...' : 'Prospectar'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {prospectResult && (
                <p className="mt-3 text-[11px] font-mono text-slate-300 whitespace-pre-wrap">{prospectResult}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D97706]/10 border border-[#D97706]/20 text-[#F59E0B] text-xs font-semib">
                <Target className="w-3.5 h-3.5" />
                Prospecção Inteligente
              </div>
              <h2 className="text-3xl font-bold text-[#FFFBEB]">Captação externa qualificada</h2>
              <p className="text-slate-300 leading-relaxed">
                Busque empresas por cidade, nicho e CNAE, gere leads qualificados e envie automaticamente para o CRM.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Busca segmentada em Google Maps e redes</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Abordagens personalizadas por IA</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Envio automático para o pipeline</li>
              </ul>
            </div>
          </div>
        </section>

        {/* BI / Analytics */}
        <section id="analytics" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E40AF]/10 border border-[#1E40AF]/20 text-[#60a5fa] text-xs font-semib">
                <BarChart3 className="w-3.5 h-3.5" />
                BI & Data Pipeline
              </div>
              <h2 className="text-3xl font-bold text-[#FFFBEB]">Análise preditiva em tempo real</h2>
              <p className="text-slate-300 leading-relaxed">
                Dashboards executivos consolidados de múltiplas fontes com alertas automáticos e previsão de vendas.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> KPIs consolidados em tempo real</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Alertas automáticos por IA</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Previsão de vendas para 30 dias</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Leads', value: '12,845', delta: '+14.2%' },
                  { label: 'MRR', value: 'R$ 256k', delta: '+12%' },
                  { label: 'Propostas', value: '342', delta: '+5' },
                ].map((m) => (
                  <div key={m.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-300/70">{m.label}</p>
                    <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#FFFBEB] mt-1">{m.value}</p>
                    <p className="text-[11px] text-[#4ade80]">{m.delta}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-44 w-full">
                <svg viewBox="0 0 400 140" className="h-full w-full">
                  <defs>
                    <linearGradient id="glowGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D97706" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,110 C40,95 70,80 110,72 C150,64 180,60 220,48 C260,36 290,40 330,24 C360,14 380,20 400,16 L400,140 L0,140 Z" fill="url(#glowGold)" />
                  <path d="M0,120 C40,110 80,100 120,96 C160,92 200,80 240,76 C280,72 320,68 360,58 C380,54 390,52 400,50 L400,140 L0,140 Z" fill="url(#glowBlue)" />
                  <polyline points="0,110 40,95 70,80 110,72 150,64 180,60 220,48 260,36 290,40 330,24 360,14 380,20 400,16" fill="none" stroke="#D97706" strokeWidth="2.5" />
                  <polyline points="0,120 40,110 80,100 120,96 160,92 200,80 240,76 280,72 320,68 360,58 380,54 390,52 400,50" fill="none" stroke="#3B82F6" strokeWidth="2.5" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* CRM / Pipeline */}
        <section id="crm" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
              <p className="text-xs font-bold text-[#FFFBEB] uppercase tracking-wider mb-4">Pipeline Comercial</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.name} className="flex flex-col items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: stage.color }}></div>
                    <span className="text-[11px] font-semibold text-center text-slate-200">{stage.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#D97706] to-[#1E40AF]" style={{ width: '64%' }}></div>
              </div>
              {user && isAdmin ? (
                <Link
                  to="/admin"
                  className="mt-4 w-full h-10 rounded-lg bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  Abrir CRM
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : user ? (
                <Link
                  to="/app"
                  className="mt-4 w-full h-10 rounded-lg bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  Abrir app
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="mt-4 w-full h-10 rounded-lg bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  Entrar para acessar o CRM
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D97706]/10 border border-[#D97706]/20 text-[#F59E0B] text-xs font-semib">
                <Kanban className="w-3.5 h-3.5" />
                CRM Comercial
              </div>
              <h2 className="text-3xl font-bold text-[#FFFBEB]">Acompanhamento do pipeline</h2>
              <p className="text-slate-300 leading-relaxed">
                Gerencie propostas, follow-ups e fechamento com histórico unificado e sincronização automática com as captações.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Pipeline visual em 6 etapas</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Histórico unificado de conversas</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Geração de minuta e documento final</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Agente / Automation */}
        <section id="agente" className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#1E40AF] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(217,119,6,0.25)]">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm text-slate-300 mb-4">Atendimento automático integrado ao Telegram via n8n.</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('site-chat-open-btn')
                    if (btn) btn.click()
                  }}
                  className="h-10 rounded-lg bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Abrir Chat do Agente
                </button>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Abrir Telegram
                  <Send className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D97706]/10 border border-[#D97706]/20 text-[#F59E0B] text-xs font-semib">
                <Bot className="w-3.5 h-3.5" />
                Agente Luciano
              </div>
              <h2 className="text-3xl font-bold text-[#FFFBEB]">Automação no WhatsApp, Telegram e Instagram</h2>
              <p className="text-slate-300 leading-relaxed">
                Agente com IA treinada nos dados da sua empresa, com atendimento 24/7, agendamento e alertas VIP.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Respostas inteligentes por canal</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Integração n8n + Telegram</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#4ade80] mt-0.5" /> Qualificação de leads em tempo real</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="funciona" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight text-[#FFFBEB]">Como funciona</h2>
              <p className="mt-3 text-base text-slate-300/80 max-w-xl mx-auto">Três passos simples para transformar dados em decisões.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Envie seus dados', desc: 'Planilhas, APIs ou fontes integradas.' },
                { step: '02', title: 'IA analisa', desc: 'Modelos treinados no seu negócio.' },
                { step: '03', title: 'Aja com dados', desc: 'Dashboards, alertas e automação.' },
              ].map((item) => (
                <div key={item.step} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-md">
                  <div className="w-12 h-12 rounded-xl bg-[#D97706]/10 border border-[#D97706]/20 flex items-center justify-center text-[#F59E0B] font-bold text-lg mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-[#FFFBEB]">{item.title}</h3>
                  <p className="text-sm text-slate-300 mt-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-md">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight text-[#FFFBEB]">Pronto para operar com dados?</h2>
            <p className="mt-3 text-base text-slate-300/80 max-w-2xl mx-auto">Peça acesso e veja o painel funcionando com a sua operação.</p>
            <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link
                to={user ? '/app' : '/login'}
                className="h-12 px-8 rounded-full bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-bold text-base flex items-center gap-2 transition-all shadow-[0_0_28px_rgba(217,119,6,0.45)] hover:scale-105 active:scale-95"
              >
                Solicitar acesso
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="h-12 px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-base font-medium text-[#FFFBEB] flex items-center gap-2 transition-all">
                Falar com especialista
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* Planos */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight text-[#FFFBEB]">Planos</h2>
              <p className="mt-3 text-base text-slate-300/80">Do teste gratuito ao plano Pro. Sem fidelidade.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                { name: 'Gratuito', price: 'R$ 0', cta: 'Começar Grátis', features: ['3 dashboards', '2.000 linhas/mês', 'Upload CSV/Excel', 'Insights básicos por IA'], popular: false, href: FREE_PLAN_WHATSAPP_URL },
                { name: 'Starter', price: 'R$ 97', cta: 'Assinar', features: ['10 dashboards', '50.000 linhas/mês', 'Alertas automáticos', 'Previsão de vendas 30 dias', 'Exportação de relatórios'], popular: false, href: 'https://buy.stripe.com/cNifZheobdbYd0Db9O5Vu04' },
                { name: 'Pro', price: 'R$ 297', cta: 'Assinar', features: ['Dashboards ilimitados', '500.000 linhas/mês', 'Análise preditiva avançada', 'API pública', 'Integrações com ERPs', 'Suporte prioritário'], popular: true, href: 'https://buy.stripe.com/cNi7sLfsf0pcbWzem05Vu05' },
              ].map((p) => (
                <div key={p.name} className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col transition hover:border-[#D97706]/40 ${p.popular ? 'ring-1 ring-[#D97706]/30' : ''}`}>
                  {p.popular && <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider mb-2">Mais Popular</span>}
                  <h3 className="text-lg font-bold text-[#FFFBEB]">{p.name}</h3>
                  <p className="text-2xl font-bold mt-2 text-[#FFFBEB]">{p.price}<span className="text-sm font-normal text-slate-300">{p.price !== 'R$ 0' ? '/mês' : ''}</span></p>
                  <ul className="mt-4 space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm text-slate-300 flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 h-10 rounded-lg bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    {p.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight text-[#FFFBEB]">Envie sua planilha</h2>
              <p className="mt-3 text-base text-slate-300/80 max-w-xl mx-auto">Até 100 linhas gratuitas. Acima disso, desbloqueie com um pagamento único.</p>
            </div>
            <SpreadsheetUpload />
          </div>
        </section>
      </main>

      <footer id="contato" className="relative border-t border-white/5 bg-white/[0.02]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D97706] to-[#1E40AF] flex items-center justify-center shadow-lg shadow-[#1E40AF]/20">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#FFFBEB] leading-tight">Foco em Dados</p>
                  <p className="text-[10px] font-mono text-[#F59E0B]/80">CNPJ: 00.000.000/0001-00</p>
                </div>
              </div>
              <p className="text-xs text-slate-300/80 leading-relaxed max-w-xs">Inteligência de dados, automação e BI para empresas.</p>
              <div className="space-y-1.5 text-[11px] text-slate-300/70">
                <p className="flex items-center gap-2"><MapPin className="w-3 h-3 text-[#F59E0B]/80" /> São Paulo, SP — Brasil</p>
                <p className="flex items-center gap-2"><Globe className="w-3 h-3 text-[#F59E0B]/80" /> focoemdados.com.br</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#F59E0B]/70">Atendimento & Automação</p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-slate-300 hover:text-[#F59E0B] transition-colors inline-flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-[#4ade80] transition-colors inline-flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp (11) 99441-1307
                  </a>
                </li>
                <li>
                  <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-[#60a5fa] transition-colors inline-flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" /> Telegram n8n
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#F59E0B]/70">Políticas & Transparência</p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/termos-de-uso" className="text-slate-300 hover:text-[#F59E0B] transition-colors inline-flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link to="/politica-de-privacidade" className="text-slate-300 hover:text-[#F59E0B] transition-colors inline-flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Política de Privacidade
                  </Link>
                </li>
                <li className="text-slate-300/70">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Sem vínculo com Google Inc.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-300/50">
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
