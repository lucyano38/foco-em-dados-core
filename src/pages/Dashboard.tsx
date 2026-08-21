import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDataUpload } from '../hooks/useDataUpload'
import { usePlanLimits } from '../hooks/usePlanLimits'
import BIExecutivePanel from '../components/BIExecutivePanel'
import { WHATSAPP_URL } from '../lib/contact'
import {
  Upload, Database, BarChart3, TrendingUp, LogOut,
  FileText, AlertCircle, CheckCircle, X, Loader2, MessageCircle, Users, DollarSign,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const DASH_PIPELINE_DATA = [
  { semana: 'S1', leads: 18, fechamentos: 1 },
  { semana: 'S2', leads: 24, fechamentos: 2 },
  { semana: 'S3', leads: 22, fechamentos: 2 },
  { semana: 'S4', leads: 29, fechamentos: 3 },
  { semana: 'S5', leads: 34, fechamentos: 4 },
  { semana: 'S6', leads: 40, fechamentos: 5 },
  { semana: 'S7', leads: 45, fechamentos: 6 },
  { semana: 'S8', leads: 52, fechamentos: 7 },
  { semana: 'S9', leads: 60, fechamentos: 8 },
  { semana: 'S10', leads: 68, fechamentos: 9 },
  { semana: 'S11', leads: 75, fechamentos: 11 },
  { semana: 'S12', leads: 90, fechamentos: 14 },
]

function UsageBar({ label, used, limit, percent }: {
  label: string; used: number; limit: number; percent: number
}) {
  const isUnlimited = limit === -1
  const displayLimit = isUnlimited ? '∞' : limit.toLocaleString('pt-BR')
  const displayUsed = used.toLocaleString('pt-BR')
  const barPercent = isUnlimited ? 0 : Math.min(percent, 100)
  const color = percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-[#fbbf24]' : 'bg-[#fabd00]'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#d4c5ab]">{label}</span>
        <span className="text-[#e3e2e2] font-mono">{displayUsed} / {displayLimit}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${barPercent}%` }}
        />
      </div>
    </div>
  )
}

function UploadZone({ onClose }: { onClose: () => void }) {
  const { upload, uploading, progress, error, reset } = useDataUpload()
  const [result, setResult] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    reset()
    const allowed = [
      'text/csv', 'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (!allowed.includes(file.type) && !/\.(csv|xlsx?)$/i.test(file.name)) {
      setResult(`Formato não aceito: ${file.type || file.name}`)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setResult('Arquivo muito grande. Máximo: 10MB.')
      return
    }
    try {
      const res = await upload(file)
      setResult(`Upload realizado! ${res.filename} — status: ${res.status}`)
    } catch (err: any) {
      setResult(err.message || 'Erro no upload.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glassmorphism p-8 w-full max-w-md rounded-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#d4c5ab] hover:text-[#e3e2e2] transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold mb-1 text-[#e3e2e2]">Upload de Planilha</h2>
        <p className="text-sm text-[#d4c5ab] mb-6">Arraste seu CSV ou Excel ou clique para selecionar.</p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-[#4f4632]/60 hover:border-[#fabd00]/40 rounded-xl p-10 text-center cursor-pointer transition-all"
        >
          <Upload className="w-8 h-8 text-[#fabd00] mx-auto mb-3" />
          <p className="text-sm text-[#d4c5ab]">
            {uploading ? 'Enviando...' : 'Clique para selecionar ou arraste aqui'}
          </p>
          <p className="text-[10px] text-[#d4c5ab]/50 mt-1">CSV ou XLSX até 10MB</p>
        </div>

        {uploading && progress && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-[#d4c5ab]">
              <span>Enviando...</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-[#fabd00] transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {result && !error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80] text-xs">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, profile, plan, signOut } = useAuth()
  const { usage, alerts, loading: limitsLoading } = usePlanLimits()
  const navigate = useNavigate()
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    document.title = 'Dashboard | Foco em Dados'
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121414] flex items-center justify-center">
        <Link to="/login" className="text-[#fabd00] hover:underline">Fazer login</Link>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#121414] text-[#e3e2e2] font-sans">
      <div className="mesh-bg" />

      <header className="border-b border-[#4f4632]/40 backdrop-blur-xl bg-[#121414]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-[#121414]" />
            </div>
            <span className="font-[family-name:var(--font-display)] font-bold text-sm">Foco em Dados</span>
            <span className="text-[10px] font-mono text-[#ffe4af] bg-[#fabd00]/10 px-2 py-0.5 rounded-full ml-2 border border-[#fabd00]/20">
              {plan?.name || 'Grátis'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/precos" className="text-xs text-[#d4c5ab] hover:text-[#e3e2e2] transition-colors">
              Planos
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#d4c5ab] hover:text-[#4ade80] transition-colors">
              <MessageCircle className="w-3 h-3" />
              Suporte WhatsApp
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#d4c5ab] hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total de Leads', value: '128', delta: '+18%', color: '#ffc107' },
            { icon: FileText, label: 'Propostas Ativas', value: '14', delta: '+5', color: '#cdbdff' },
            { icon: DollarSign, label: 'Receita de Setups', value: 'R$ 47.400', delta: '+R$ 8.900', color: '#4ade80' },
            { icon: TrendingUp, label: 'MRR', value: 'R$ 9.870', delta: '+12%', color: '#60a5fa' },
          ].map((m) => (
            <div key={m.label} className="glass-card p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center" style={{ color: m.color }}>
                  <m.icon className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]">{m.label}</p>
              </div>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">{m.value}</p>
              <p className="text-[11px] mt-1 font-medium" style={{ color: m.color }}>{m.delta} este mês</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-[family-name:var(--font-display)] font-bold flex items-center gap-2 text-white">
              <BarChart3 className="w-4 h-4 text-[#ffc107]" />
              Inteligência de IA — pipeline de conversão
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffc107] border border-amber-400/20 bg-amber-400/5 rounded-full px-3 py-1">
              +32% vs trimestre anterior
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DASH_PIPELINE_DATA}>
                <defs>
                  <linearGradient id="dashGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffc107" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ffc107" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashPortal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cdbdff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#cdbdff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="semana" stroke="#64748b" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ background: '#121414', border: '1px solid rgba(255,193,7,0.2)', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#ffc107' }} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="#ffc107" fill="url(#dashGold)" strokeWidth={2} />
                <Area type="monotone" dataKey="fechamentos" name="Fechamentos" stroke="#cdbdff" fill="url(#dashPortal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <img
            src="/dashboard-analytics.png"
            alt="Análise de IA em tempo real"
            className="w-full h-auto object-cover rounded-2xl border border-outline-variant/30"
          />
          <p className="text-xs text-[#d4c5ab] mt-2 text-center">
            Análise de IA em tempo real — Sincronizado com 15 fontes de dados do ecossistema
          </p>
        </div>

        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#ffe4af]">
              Olá, {profile?.name || 'lojista'}!
            </h1>
            <p className="text-sm text-[#d4c5ab] mt-1">
              Faça upload de uma planilha CSV ou Excel para analisar vendas, estoque e gerar insights automáticos.
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-glow h-11 px-6 rounded-xl text-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload de Planilha
          </button>
        </div>

        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.feature}
                className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
                  a.level === 'exceeded'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24]'
                }`}
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {a.level === 'exceeded' ? 'Limite atingido!' : 'Quase no limite!'}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {a.level === 'exceeded'
                      ? `Você atingiu o limite de ${a.limit} ${a.feature}s este mês.`
                      : `Você usou ${a.usage} de ${a.limit} ${a.feature}s (${a.percent}%).`}
                  </p>
                  <Link to="/precos" className="text-xs font-medium underline mt-1 inline-block">
                    Fazer upgrade
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-card p-5 card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#fabd00]/10 border border-[#fabd00]/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#fabd00]" />
              </div>
              <div>
                <p className="text-xs text-[#d4c5ab] font-mono uppercase tracking-wider">Plano</p>
                <p className="font-bold">{plan?.name || 'Gratuito'}</p>
              </div>
            </div>
            <Link
              to="/precos"
              className="text-xs text-[#fabd00] hover:underline font-medium"
            >
              Gerenciar assinatura
            </Link>
          </div>

          <div className="glass-card p-5 card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#cdbdff]/10 border border-[#cdbdff]/20 flex items-center justify-center">
                <Upload className="w-4 h-4 text-[#cdbdff]" />
              </div>
              <div>
                <p className="text-xs text-[#d4c5ab] font-mono uppercase tracking-wider">Uploads</p>
                <p className="font-bold">Total de envios</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#cdbdff]">
              {usage.find((u) => u.feature === 'upload')?.used.toLocaleString('pt-BR') || '0'}
            </p>
          </div>

          <div className="glass-card p-5 card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#4ade80]" />
              </div>
              <div>
                <p className="text-xs text-[#d4c5ab] font-mono uppercase tracking-wider">Linhas</p>
                <p className="font-bold">Processadas no mês</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#4ade80]">
              {usage.find((u) => u.feature === 'upload')?.used.toLocaleString('pt-BR') || '0'}
            </p>
          </div>
        </div>

        <BIExecutivePanel />

        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#fabd00]" />
            Consumo do plano
          </h2>
          {limitsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#fabd00] animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {usage.map((u) => (
                <UsageBar
                  key={u.feature}
                  label={u.label}
                  used={u.used}
                  limit={u.limit}
                  percent={u.percent}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-[#d4c5ab]/60">
            Precisa de ajuda?{' '}
            <a href="mailto:atendimento@focoemdados.com.br" className="text-[#fabd00] hover:underline">
              atendimento@focoemdados.com.br
            </a>
          </p>
        </div>
      </main>

      {showUpload && <UploadZone onClose={() => setShowUpload(false)} />}
    </div>
  )
}
