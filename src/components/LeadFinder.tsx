import { useRef, useState } from 'react'
import {
  Search, MapPin, LocateFixed, Loader2, UserPlus, Phone, Mail,
  Globe, AlertCircle, CheckCircle2, Sparkles, Building2, Target,
} from 'lucide-react'
import { SEGMENTS, generateMockLeads, type MockLead, type LeadSearchParams } from '../services/mockLeadSearch'
import { safeJson } from '../lib/safeFetch'
import { Button } from './ui/Button'

export interface LeadForPipeline {
  id: string
  name: string
  phone?: string
  email?: string
  notes?: string
  value?: number
  status: string
  source?: string
  created_at: string
}

const CITY_SUGGESTIONS = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Florianópolis', 'Salvador', 'Recife', 'Goiânia', 'São Luís', 'Caxias do Sul', 'Brasília']

interface LeadFinderProps {
  onAddToPipeline?: (lead: LeadForPipeline) => void
}

export default function LeadFinder({ onAddToPipeline }: LeadFinderProps) {
  const [city, setCity] = useState('')
  const [segment, setSegment] = useState('todos')
  const [geo, setGeo] = useState(false)
  const [geoText, setGeoText] = useState('')
  const [searching, setSearching] = useState(false)
  const [timeoutHit, setTimeoutHit] = useState(false)
  const [leads, setLeads] = useState<MockLead[]>([])
  const [source, setSource] = useState<'server' | 'mock' | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  const useGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoText('Geolocalização não suportada neste navegador.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo(true)
        setGeoText(`GPS ativado (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`)
        if (!city.trim()) setCity('Sua Cidade')
      },
      (err) => {
        setGeo(false)
        setGeoText(`GPS indisponível (${err.code === 1 ? 'permissão negada' : 'sem sinal'}).`)
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
  }

  const runSearch = async (params: LeadSearchParams) => {
    setSearching(true)
    setError(null)
    setReady(false)
    setTimeoutHit(false)

    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), 7000)

    try {
      const res = await fetch('/api/prospection/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) throw new Error('Servidor indisponível para busca.')
      const data = await safeJson(res)
      if (Array.isArray(data.leads) && data.leads.length > 0) {
        setLeads(data.leads)
        setSource(data.source === 'external' ? 'server' : 'mock')
      } else {
        throw new Error('Sem resultados.')
      }
    } catch (err: any) {
      clearTimeout(timeout)
      const isAbort = err?.name === 'AbortError'
      setTimeoutHit(isAbort)
      console.warn(`[LeadFinder] ${isAbort ? 'Timeout (7s) — usando mock inteligente' : 'API falhou — usando mock inteligente'}:`, err?.message)
      setLeads(generateMockLeads(params))
      setSource('mock')
    } finally {
      setSearching(false)
      setReady(true)
      setAdded(new Set())
    }
  }

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const cityText = city.trim()
    if (!cityText && !geo) {
      setError('Digite uma cidade ou ative o GPS para buscar leads.')
      return
    }
    runSearch({ city: cityText || 'Sua Cidade', segment: segment === 'todos' ? undefined : segment, geo, limit: 10, query: cityText })
  }

  const addLead = (lead: MockLead) => {
    if (!onAddToPipeline) return
    const pipelineLead: LeadForPipeline = {
      id: `${lead.id}-${Date.now()}`,
      name: lead.name,
      phone: lead.whatsapp,
      email: lead.email,
      notes: `${lead.notes} ${lead.address} · Score ${lead.score}/100`,
      value: Math.round((lead.score * 35 + 500) / 50) * 50,
      status: 'prospeccao',
      source: lead.source,
      created_at: new Date().toISOString(),
    }
    onAddToPipeline(pipelineLead)
    setAdded((prev) => new Set(prev).add(lead.id))
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#60a5fa]/10 border border-[#60a5fa]/30 flex items-center justify-center shrink-0">
          <Search className="w-4 h-4 text-[#60a5fa]" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#ffe4af]">
            Busca Inteligente de Leads
          </h2>
          <p className="text-xs text-[#d4c5ab]">
            Google Maps, Google e Facebook — com fallback automático inteligente. Digite o nicho e a cidade desejada.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-3">
        <div className="space-y-1">
          <label className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[#d4c5ab]/70 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Cidade / Localização *
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex.: São Luís, Caxias do Sul, Brasília..."
            className="input-mystic w-full h-10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40"
            list="lead-cities"
          />
          <datalist id="lead-cities">
            {CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <div className="flex flex-wrap gap-1.5">
            {CITY_SUGGESTIONS.slice(0, 4).map((c) => (
              <button key={c} type="button" onClick={() => setCity(c)}
                className="text-[10px] text-[#60a5fa]/80 hover:text-[#60a5fa] border border-[#60a5fa]/20 rounded-full px-2 py-0.5 cursor-pointer">
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[#d4c5ab]/70 flex items-center gap-1">
            <Target className="w-3 h-3" /> Segmento / Nicho
          </label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="input-mystic w-full h-10 px-3 text-sm text-[#e3e2e2] cursor-pointer"
          >
            {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={useGeolocation}
            disabled={searching}
            className={`h-10 px-4 rounded-xl text-sm border flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
              geo
                ? 'bg-[#4ade80]/10 border-[#4ade80]/40 text-[#4ade80]'
                : 'border-[#4f4632]/60 text-[#d4c5ab] hover:border-[#60a5fa]/50 hover:text-[#60a5fa]'
            }`}
            title="Usar minha localização (GPS)"
          >
            <LocateFixed className="w-4 h-4" />
            GPS
          </button>
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={searching}
            className="h-10 px-6 rounded-xl text-sm"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar Leads
          </Button>
        </div>
      </form>

      {(geoText || error) && (
        <div className="mt-3 space-y-1.5">
          {geoText && (
            <p className="text-[11px] text-[#4ade80]/80 flex items-center gap-1.5">
              <LocateFixed className="w-3 h-3" /> {geoText}
            </p>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>
      )}

      {searching && (
        <div className="mt-5 rounded-xl border border-dashed border-[#60a5fa]/30 bg-[#60a5fa]/[0.04] p-6 text-center">
          <Loader2 className="w-6 h-6 text-[#60a5fa] animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#e3e2e2]">Procurando empresas em {city.trim() || 'sua região'}...</p>
          <p className="text-[11px] text-[#d4c5ab]/60 mt-1">
            Consultando Google Maps, Google e redes sociais. Se demorar, mostramos o fallback inteligente automaticamente.
          </p>
        </div>
      )}

      {ready && !searching && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              source === 'server'
                ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                : 'bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24]'
            }`}>
              {source === 'server' ? <CheckCircle2 className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {source === 'server' ? 'Resultados reais (servidor)' : 'Modo demonstração (mock inteligente)'}
            </span>
            {timeoutHit && (
              <span className="text-[10px] text-[#d4c5ab]/60">
                A API externa demorou mais de 7s — exibimos leads simulados altamente qualificados.
              </span>
            )}
            <span className="ml-auto text-xs text-[#d4c5ab]">
              <strong className="text-[#ffe4af]">{leads.length}</strong> empresas em{' '}
              <strong className="text-[#60a5fa]">{city.trim() || 'sua região'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-xl border border-[#4f4632]/50 bg-white/[0.02] p-4 card-hover">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#e3e2e2] truncate flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#60a5fa] shrink-0" />
                      {lead.name}
                    </p>
                    <p className="text-[10px] font-mono text-[#fabd00]/80 mt-0.5">{lead.segment}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                      lead.score >= 90
                        ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                        : lead.score >= 85
                        ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24]'
                        : 'bg-[#60a5fa]/10 border-[#60a5fa]/30 text-[#60a5fa]'
                    }`}
                  >
                    Score {lead.score}
                  </span>
                </div>

                <p className="text-[11px] text-[#d4c5ab]/70 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 shrink-0" /> {lead.city}/{lead.state} · {lead.employeesLabel}
                </p>

                <div className="space-y-1 mt-2 text-[11px] text-[#d4c5ab]/80">
                  <p className="flex items-center gap-1.5 truncate"><Phone className="w-3 h-3 shrink-0 text-[#4ade80]" /> {lead.phone}</p>
                  <p className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 shrink-0 text-[#60a5fa]" /> {lead.email}</p>
                  <p className="flex items-center gap-1.5 truncate">
                    {lead.website ? (
                      <><Globe className="w-3 h-3 shrink-0 text-[#cdbdff]" /> {lead.website}</>
                    ) : (
                      <><AlertCircle className="w-3 h-3 shrink-0 text-[#fabd00]" /> Sem site — oportunidade de presença digital</>
                    )}
                  </p>
                </div>

                <p className="text-[11px] text-[#d4c5ab]/60 mt-2 line-clamp-2 leading-relaxed">{lead.notes}</p>
                <p className="text-[10px] font-mono text-[#d4c5ab]/50 mt-1.5">{lead.source}</p>

                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5">
                  {lead.whatsapp && (
                    <a
                      href={`https://wa.me/${lead.whatsapp}`}
                      target="_blank" rel="noreferrer"
                      className="text-[10px] text-[#4ade80]/80 hover:text-[#4ade80] flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                  {onAddToPipeline && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addLead(lead)}
                      disabled={added.has(lead.id)}
                      className="ml-auto h-8 px-3 text-[11px]"
                    >
                      {added.has(lead.id) ? <CheckCircle2 className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {added.has(lead.id) ? 'Adicionado' : 'Adicionar ao Pipeline'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!ready && !searching && (
        <div className="mt-5 rounded-xl border border-dashed border-[#4f4632]/40 p-6 text-center text-xs text-[#d4c5ab]/50">
          <Search className="w-5 h-5 mx-auto mb-2 text-[#d4c5ab]/40" />
          Informe a cidade desejada, selecione o nicho ou ative o GPS para encontrar empresas qualificadas.
        </div>
      )}
    </div>
  )
}
