import { useState } from 'react';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { safeJson, friendlyFetchError } from '../lib/safeFetch';
import { PUBLIC_TUNNEL_URL } from '../lib/contact';

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

function buildOfflineTemplate(row: RedesignRow): string {
  const color = '#f7b500';
  const name = row.name.replace(/[<>&"']/g, '');
  const segment = row.segment || 'comércio local';
  const city = [row.city, row.uf].filter(Boolean).join(' - ') || 'Sua cidade';
  const wa = row.whatsapp ? `https://wa.me/${String(row.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi a proposta da ${name} e quero saber mais.`)}` : '';
  const demoUrl = PUBLIC_TUNNEL_URL;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${name} — Proposta Comercial | Foco em Dados</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;background:#0b0d10;color:#f1f5f9;min-height:100vh}
  .bg{position:fixed;inset:0;background:radial-gradient(circle at 20% 10%,${color}26 0%,rgba(88,28,228,.22) 45%,#0b0d10 100%);z-index:-2}
  .wrap{max-width:1080px;margin:0 auto;padding:56px 24px}
  .badge{display:inline-flex;padding:8px 16px;border-radius:999px;border:1px solid ${color}55;color:${color};background:${color}0f;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
  h1{font-size:clamp(2.1rem,5vw,3.6rem);font-weight:800;line-height:1.1;margin:22px 0 16px;background:linear-gradient(100deg,#fff 20%,${color} 80%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .sub{font-size:clamp(1rem,2vw,1.2rem);color:#cbd5e1;max-width:640px;line-height:1.65}
  .meta{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0;font-size:13px;color:#94a3b8}
  .chip{padding:6px 12px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
  .offers{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin:34px 0}
  .offer{padding:20px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);font-size:14px;color:#e2e8f0;line-height:1.6}
  .offer::before{content:"✦ ";color:${color}}
  .cta{display:inline-block;margin-top:10px;padding:15px 30px;border-radius:14px;background:linear-gradient(135deg,${color},#7c3aed);color:#0b0d10;font-weight:800;text-decoration:none;box-shadow:0 12px 34px ${color}40}
  .foot{margin-top:44px;padding-top:20px;border-top:1px solid rgba(255,255,255,.08);font-size:12px;color:#64748b;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
</style>
</head>
<body>
  <div class="bg"></div>
  <main class="wrap">
    <span class="badge">✦ ${row.hasWebsite ? 'Redesign completo' : 'Sem site — presença digital do zero'}</span>
    <h1>${name}: presença digital que vende mais</h1>
    <p class="sub">A ${name} está estruturando sua presença digital em ${city} com uma página moderna, rápida e focada em conversão.</p>
    <div class="meta">
      <span class="chip">${segment}</span>
      <span class="chip">${city}</span>
      <span class="chip">Proposta gerada por IA — Foco em Dados</span>
    </div>
    <div class="offers">
      <div class="offer">Site/redesign profissional responsivo</div>
      <div class="offer">Integração com WhatsApp</div>
      <div class="offer">Otimização para busca local (SEO)</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:12px">
      ${wa ? `<a class="cta" href="${wa}">Chamar no WhatsApp</a>` : ''}
      <a class="cta" href="${demoUrl}" target="_blank" rel="noreferrer" style="background:linear-gradient(135deg,#7c3aed,${color})">Ver demo temporária</a>
    </div>
    <div class="foot">
      <span>${name} — ${city}</span>
      <span>Demonstração temporária · Foco em Dados</span>
    </div>
  </main>
</body>
</html>`;
}

export default function RedesignComparator() {
  const [rows, setRows] = useState<RedesignRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [result, setResult] = useState<ComparatorResult | null>(null);
  const [currentLead, setCurrentLead] = useState<RedesignRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [view, setView] = useState<'antes' | 'depois'>('depois');

  const fetchProspects = async () => {
    setLoadingRows(true);
    setError(null);
    try {
      let list: RedesignRow[] = [];

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw new Error(error.message);
        list = (data || []).map((l: any) => ({
          id: String(l.id || l.name),
          name: l.name || l.companyName || 'Sem nome',
          segment: l.segment || l.segmento,
          city: l.city || l.cidade,
          uf: l.uf,
          whatsapp: l.whatsapp || l.phone || l.telefone,
          hasWebsite: Boolean(l.hasWebsite ?? l.has_site ?? l.has_site_web),
        }));
      }

      if (list.length === 0) {
        const res = await fetch('/api/prospection/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: '', segment: '', limit: 50 }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          throw new Error((await safeJson(res)).error || 'Falha ao carregar prospecções.');
        }
        const data = await safeJson(res);
        list = (data.leads || []).map((l: any) => ({
          id: String(l.id || l.name),
          name: l.name || l.companyName || 'Sem nome',
          segment: l.segment,
          city: l.city,
          uf: l.uf,
          whatsapp: l.whatsapp || l.phone,
          hasWebsite: Boolean(l.hasWebsite),
        }));
      }

      const seen = new Set<string>();
      setRows(list.filter((r) => !seen.has(r.id) && (seen.add(r.id), true)));
      if (list.length === 0) {
        setError('Nenhum lead encontrado na tabela leads do Supabase.');
      }
    } catch (err: any) {
      setError(friendlyFetchError(err, 'Erro ao buscar prospecções.'));
    } finally {
      setLoadingRows(false);
    }
  };

  const generate = async (row: RedesignRow) => {
    setGeneratingId(row.id);
    setError(null);
    setErrorLog(null);
    setCurrentLead(row);
    let serverDetail: string | null = null;
    try {
      const res = await fetch('/api/nano-banana/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: row.name,
          segment: row.segment || 'comércio local',
          city: row.city || '',
          uf: row.uf || '',
          whatsapp: row.whatsapp || '',
          hasWebsite: row.hasWebsite,
          redesignGoal: 'modernizar presença digital e converter via WhatsApp',
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const errorData = await res.text();
        setErrorLog(`Erro ${res.status}: ${errorData}`);
        throw new Error(`Falha na geração: ${res.status}`);
      }
      
      const data = await safeJson(res);
      setResult({ designId: data.designId, html: data.html, generatedAt: data.generatedAt, model: data.model });
      setView('depois');
    } catch (err: any) {
      if (!errorLog) {
        setErrorLog("Erro de conexão: " + err.message);
      }
      const offline = buildOfflineTemplate(row);
      setResult({ designId: `offline_${Date.now().toString(36)}`, html: offline, generatedAt: new Date().toISOString(), model: 'template-offline' });
      setView('depois');
      setError(
        `${serverDetail || friendlyFetchError(err, 'Erro ao gerar o redesign.')} — mockup gerado offline no navegador.`
      );
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

      {errorLog && (
        <div className="bg-red-900/90 border border-red-500 text-white p-4 my-4 rounded-xl shadow-lg">
          <h3 className="font-bold text-lg mb-2">⚠️ Erro Detectado:</h3>
          <p className="text-sm font-mono break-all">{errorLog}</p>
          <button 
            onClick={() => setErrorLog(null)} 
            className="mt-2 px-4 py-1 bg-red-600 rounded text-xs"
          >
            Fechar
          </button>
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