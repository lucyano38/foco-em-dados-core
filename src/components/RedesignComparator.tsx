import { useState } from 'react';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';

export interface RedesignRow {
  id: string;
  name: string;
  segment?: string;
  city?: string;
  uf?: string;
  whatsapp?: string;
  hasWebsite: boolean;
}

interface ComparatorResult {
  designId: string;
  html: string;
  generatedAt: string;
  model: string;
}

export default function RedesignComparator() {
  const [rows, setRows] = useState<RedesignRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [result, setResult] = useState<ComparatorResult | null>(null);
  const [currentLead, setCurrentLead] = useState<RedesignRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'antes' | 'depois'>('depois');

  const fetchProspects = async () => {
    setLoadingRows(true);
    setError(null);
    try {
      const res = await fetch('/api/prospection/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: '', segment: '', limit: 50 }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Falha ao carregar prospecções.');
      }
      const data = await res.json();
      const list: RedesignRow[] = (data.leads || []).map((l: any) => ({
        id: String(l.id || l.name),
        name: l.name || l.companyName || 'Sem nome',
        segment: l.segment,
        city: l.city,
        uf: l.uf,
        whatsapp: l.whatsapp || l.phone,
        hasWebsite: Boolean(l.hasWebsite),
      }));
      const seen = new Set<string>();
      setRows(list.filter((r) => !seen.has(r.id) && (seen.add(r.id), true)));
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar prospecções.');
    } finally {
      setLoadingRows(false);
    }
  };

  const generate = async (row: RedesignRow) => {
    setGeneratingId(row.id);
    setError(null);
    setCurrentLead(row);
    try {
      const res = await fetch('/api/auto-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            companyName: row.name,
            segment: row.segment || 'comércio local',
            city: row.city || '',
            uf: row.uf || '',
            whatsapp: row.whatsapp || '',
            hasWebsite: row.hasWebsite,
            redesignGoal: 'modernizar presença digital e converter via WhatsApp',
          },
        }),
        signal: AbortSignal.timeout(45000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar o redesign.');
      setResult({ designId: data.designId, html: data.html, generatedAt: data.generatedAt, model: data.model });
      setView('depois');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar o redesign.');
      setResult(null);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#ffe4af] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#fabd00]" />
            Comparador Antes/Depois — Redesign de Site
          </h2>
          <p className="text-xs text-[#d4c5ab] mt-1">
            Gera o mockup da nova página (HTML/CSS por IA) e exibe lado a lado com o estado atual do lead.
          </p>
        </div>
        <button
          onClick={fetchProspects}
          disabled={loadingRows}
          className="btn-glow h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loadingRows ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Carregar Prospecções
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          {error.includes('falha') ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /> : null}
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="glass-card p-4 rounded-2xl">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]/70 mb-3">
          Leads na fila de redesign ({rows.length})
        </p>
        {rows.length === 0 && !loadingRows ? (
          <p className="text-sm text-[#d4c5ab]/70 py-6 text-center">
            Clique em "Carregar Prospecções" para listar os leads do Supabase e gerar os mockups.
          </p>
        ) : (
          <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#e3e2e2] truncate">{row.name}</p>
                  <p className="text-[11px] text-[#d4c5ab] truncate">
                    {[row.segment, row.city, row.uf].filter(Boolean).join(' · ') || 'Sem segmento'} —{' '}
                    {row.hasWebsite ? 'site atual existe' : 'sem site hoje'}
                  </p>
                </div>
                <button
                  onClick={() => generate(row)}
                  disabled={generatingId !== null}
                  className="h-8 px-3 rounded-lg bg-gradient-to-r from-[#fabd00] to-[#5203d5] text-[#121414] text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {generatingId === row.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Gerar Redesign
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {currentLead && (
        <div className="glass-panel p-4 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-sm text-[#e3e2e2]">
              <strong className="text-[#fabd00]">Prospecção:</strong> {currentLead.name}
            </p>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setView('antes')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${view === 'antes' ? 'bg-[#fabd00] text-[#121414]' : 'text-[#d4c5ab] hover:text-[#e3e2e2]'}`}
              >
                ANTES
              </button>
              <button
                onClick={() => setView('depois')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${view === 'depois' ? 'bg-gradient-to-r from-[#fabd00] to-[#5203d5] text-[#121414]' : 'text-[#d4c5ab] hover:text-[#e3e2e2]'}`}
              >
                DEPOIS
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div
              className={`rounded-xl border border-white/10 overflow-hidden ${view === 'antes' ? 'ring-2 ring-[#fabd00]/40' : 'opacity-60'}`}
            >
              <div className="bg-white/[0.04] border-b border-white/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]">
                Antes — presença atual
              </div>
              {currentLead.hasWebsite ? (
                <iframe
                  src="about:blank"
                  title="Site atual do lead"
                  className="w-full h-[420px] bg-white"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="w-full h-[420px] bg-[#0b0d10] flex items-center justify-center">
                  <p className="text-xs text-[#d4c5ab]/60 max-w-[220px] text-center">
                    Sem site ativo — o lead não possui presença digital para comparar.
                  </p>
                </div>
              )}
            </div>

            <div
              className={`rounded-xl border border-white/10 overflow-hidden ${view === 'depois' ? 'ring-2 ring-[#5203d5]/50' : 'opacity-60'}`}
            >
              <div className="bg-white/[0.04] border-b border-white/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab] flex items-center justify-between">
                <span>Depois — mockup gerado por IA</span>
                {result?.model && <span className="text-[#fabd00]">modelo: {result.model}</span>}
              </div>
              {result ? (
                <iframe
                  srcDoc={result.html}
                  title="Mockup do site redesenhado"
                  className="w-full h-[420px] bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : generatingId === currentLead.id ? (
                <div className="w-full h-[420px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#fabd00] animate-spin" />
                </div>
              ) : (
                <div className="w-full h-[420px] bg-[#0b0d10] flex items-center justify-center">
                  <p className="text-xs text-[#d4c5ab]/60">Clique em "Gerar Redesign" para criar o mockup.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}