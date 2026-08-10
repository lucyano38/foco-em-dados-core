import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDataUpload } from '../hooks/useDataUpload'
import { usePlanLimits } from '../hooks/usePlanLimits'
import BIExecutivePanel from '../components/BIExecutivePanel'
import {
  Upload, Database, BarChart3, TrendingUp, LogOut,
  FileText, AlertCircle, CheckCircle, X, Loader2,
} from 'lucide-react'

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
            <a href="mailto:atendimento@focoemdados.com.br" className="text-xs text-[#d4c5ab] hover:text-[#e3e2e2] transition-colors">
              Suporte
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
