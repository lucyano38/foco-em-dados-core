import { useCallback, useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import RedesignComparator from '../../components/RedesignComparator';
import {
  Database, ShieldCheck, ArrowLeft, LayoutDashboard, Kanban, GitCompareArrows,
  FileText, Users, Target, TrendingUp, Loader2, CheckCircle2, AlertTriangle, MoveRight, Eye, MessageCircle, Download,
} from 'lucide-react';

export type ProspectorStatus = 'novo' | 'redesenhado' | 'publicado' | 'proposta' | 'respondeu' | 'fechado';

export const PROSPECTOR_STAGES: { id: ProspectorStatus; label: string; dot: string }[] = [
  { id: 'novo', label: 'Novo', dot: '#60a5fa' },
  { id: 'redesenhado', label: 'Redesenhado', dot: '#fbbf24' },
  { id: 'publicado', label: 'Publicado', dot: '#cdbdff' },
  { id: 'proposta', label: 'Proposta', dot: '#ff8a5c' },
  { id: 'respondeu', label: 'Respondeu', dot: '#22d3ee' },
  { id: 'fechado', label: 'Fechado', dot: '#4ade80' },
];

const STAGE_ORDER: ProspectorStatus[] = ['novo', 'redesenhado', 'publicado', 'proposta', 'respondeu', 'fechado'];

interface ProspectorLead {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status: ProspectorStatus;
  value?: number | null;
  potential?: number | null;
  source?: string | null;
  hasWebsite?: boolean | null;
  created_at?: string | null;
}

function normalizeLead(row: any): ProspectorLead {
  return {
    id: String(row.id),
    name: row.name || 'Sem nome',
    phone: row.phone ?? row.whatsapp ?? null,
    email: row.email ?? null,
    notes: row.notes ?? null,
    status: STAGE_ORDER.includes(row.status) ? row.status : 'novo',
    value: row.value ?? row.potential ?? row.faturamento ?? null,
    potential: row.potential ?? row.value ?? null,
    source: row.source ?? null,
    hasWebsite: row.hasWebsite ?? row.has_site ?? null,
    created_at: row.created_at ?? null,
  };
}

const STAGE_LABEL: Record<ProspectorStatus, string> = Object.fromEntries(
  PROSPECTOR_STAGES.map((s) => [s.id, s.label])
) as Record<ProspectorStatus, string>;

type ProspectorTab = 'overview' | 'kanban' | 'comparator' | 'contracts';

export default function AdminProspeccao() {
  const { user, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<ProspectorTab>('overview');
  const [leads, setLeads] = useState<ProspectorLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Prospector de Sites | Admin Foco em Dados';
  }, []);

  const loadLeads = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoadingLeads(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (dbError) throw new Error(dbError.message);
      setLeads((data || []).map(normalizeLead));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar leads do Supabase.');
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadLeads();
  }, [isAdmin, loadLeads]);

  const moveStatus = async (lead: ProspectorLead, next: ProspectorStatus) => {
    if (!isSupabaseConfigured) return;
    setMovingId(lead.id);
    setError(null);
    setSuccess(null);
    try {
      const { error: dbError } = await supabase
        .from('leads')
        .update({ status: next })
        .eq('id', lead.id);
      if (dbError) throw new Error(dbError.message);
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: next } : l)));
      setSuccess(`Lead "${lead.name}" movido para "${STAGE_LABEL[next]}".`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar o lead.');
    } finally {
      setMovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#121414] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#fabd00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/app" replace />;
  }

  const byStage = Object.fromEntries(PROSPECTOR_STAGES.map((s) => [s.id, leads.filter((l) => l.status === s.id)])) as Record<ProspectorStatus, ProspectorLead[]>;
  const totalPotential = leads.reduce((acc, l) => acc + (Number(l.value) || Number(l.potential) || 0), 0);
  const proposals = leads.filter((l) => ['proposta', 'respondeu', 'fechado'].includes(l.status)).length;
  const closed = leads.filter((l) => l.status === 'fechado').length;

  const TABS: { id: ProspectorTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'kanban', label: 'Pipeline Kanban', icon: Kanban },
    { id: 'comparator', label: 'Comparador Antes/Depois', icon: GitCompareArrows },
    { id: 'contracts', label: 'Contratos & Financeiro', icon: FileText },
  ];

  return (
    <div className="w-full min-h-screen bg-[#121414] text-[#e3e2e2] font-sans">
      <div className="mesh-bg" />

      <header className="border-b border-[#4f4632]/40 backdrop-blur-xl bg-[#121414]/70 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-[#121414]" />
            </div>
            <span className="font-bold text-sm">Prospector de Sites</span>
            <span className="text-[10px] font-mono text-[#ffe4af] bg-[#fabd00]/10 px-2 py-0.5 rounded-full ml-2 border border-[#fabd00]/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#d4c5ab] hover:text-[#e3e2e2] transition-colors">
              <ArrowLeft className="w-3 h-3" />
              Pipeline
            </Link>
            <Link to="/app" className="text-xs text-[#d4c5ab] hover:text-[#e3e2e2] transition-colors">Área do Cliente</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#ffe4af]">Painel Prospector de Sites</h1>
            <p className="text-xs text-[#d4c5ab] mt-1">
              Prospecção inteligente, redesign de sites, pipeline de vendas e contratos — dados direto da tabela {isSupabaseConfigured ? 'leads (Supabase)' : 'leads (local)'}.
            </p>
          </div>
          <button
            onClick={loadLeads}
            disabled={loadingLeads}
            className="btn-glow h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loadingLeads ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshIcon />}
            Atualizar Leads
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
            <p className="text-sm text-[#4ade80]">{success}</p>
          </div>
        )}

        <nav className="flex flex-wrap items-center gap-2 border-b border-[#4f4632]/40 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-[#fabd00]/10 border border-[#fabd00]/40 text-[#ffe4af]'
                  : 'text-[#d4c5ab] hover:text-[#e3e2e2] border border-transparent'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={Users} label="Leads Ativos" value={String(leads.length)} sub="Total na tabela leads" tint="#60a5fa" />
            <MetricCard icon={Target} label="Propostas em Jogo" value={String(proposals)} sub="Proposta · Respondeu · Fechado" tint="#ff8a5c" />
            <MetricCard icon={CheckCircle2} label="Fechados" value={String(closed)} sub="Contratos assinados" tint="#4ade80" />
            <MetricCard icon={TrendingUp} label="Potencial Total" value={formatBRL(totalPotential)} sub="Soma de value/potential" tint="#fabd00" />
          </div>
        )}

        {tab === 'kanban' && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {PROSPECTOR_STAGES.map((s) => (
              <div key={s.id} className="glass-card p-3 rounded-2xl">
                <p className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]/70 mb-3">
                  <span style={{ color: s.dot }}>{s.label}</span>
                  <span className="bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5 text-[#e3e2e2]">{byStage[s.id].length}</span>
                </p>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {byStage[s.id].length === 0 && (
                    <p className="text-[11px] text-[#d4c5ab]/40 text-center py-4">Vazio</p>
                  )}
                  {byStage[s.id].map((lead) => (
                    <div key={lead.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                      <p className="text-xs font-semibold text-[#e3e2e2] truncate">{lead.name}</p>
                      <p className="text-[10px] text-[#d4c5ab] truncate">
                        {lead.value ? formatBRL(Number(lead.value)) : 'Sem valor'} · {lead.phone || 'sem tel.'}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        {STAGE_ORDER.indexOf(lead.status) > 0 && (
                          <button
                            onClick={() => moveStatus(lead, STAGE_ORDER[STAGE_ORDER.indexOf(lead.status) - 1])}
                            disabled={movingId === lead.id}
                            title={`Voltar para ${STAGE_LABEL[STAGE_ORDER[STAGE_ORDER.indexOf(lead.status) - 1]]}`}
                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[#d4c5ab] disabled:opacity-50 cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {lead.status !== 'fechado' && (
                          <button
                            onClick={() => moveStatus(lead, STAGE_ORDER[STAGE_ORDER.indexOf(lead.status) + 1])}
                            disabled={movingId === lead.id}
                            title={`Avançar para ${STAGE_LABEL[STAGE_ORDER[STAGE_ORDER.indexOf(lead.status) + 1]]}`}
                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[#e3e2e2] disabled:opacity-50 cursor-pointer ml-auto"
                          >
                            {movingId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <MoveRight className="w-3 h-3" />}
                          </button>
                        )}
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${String(lead.phone).replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir WhatsApp"
                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[#4ade80]"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'comparator' && <RedesignComparator />}

        {tab === 'contracts' && <ContractsPanel leads={leads} />}
      </main>
    </div>
  );
}

function RefreshIcon() {
  return <Database className="w-3.5 h-3.5" />;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
}

function MetricCard({ icon: Icon, label, value, sub, tint }: { icon: any; label: string; value: string; sub: string; tint: string }) {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${tint}14`, border: `1px solid ${tint}33` }}>
        <Icon className="w-4 h-4" style={{ color: tint }} />
      </div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]/70">{label}</p>
      <p className="text-2xl font-extrabold text-[#ffe4af] mt-1">{value}</p>
      <p className="text-[11px] text-[#d4c5ab]/60 mt-1">{sub}</p>
    </div>
  );
}

function ContractsPanel({ leads }: { leads: ProspectorLead[] }) {
  const [selectedId, setSelectedId] = useState<string>('');
  const lead = leads.find((l) => l.id === selectedId) || null;

  const downloadTerms = () => {
    const content = `TERMOS DE CONTRATO — FOCO EM DADOS

Cliente: ${lead?.name || '___'}
Telefone: ${lead?.phone || '___'}
E-mail: ${lead?.email || '___'}
Valor do projeto: ${lead?.value ? formatBRL(Number(lead.value)) : '___'}
Status: ${lead ? STAGE_LABEL[lead.status] : '___'}

1. ESCOPO: criação/redesign de site profissional, integração com WhatsApp e dashboard de BI.
2. PRAZO: entrega em até 15 dias úteis após aprovação do comparador Antes/Depois.
3. PAGAMENTO: 50% na assinatura e 50% na entrega. Formas: PIX, cartão ou boleto.
4. REVISÕES: 3 rodadas de ajustes inclusas; acima disso, cobrado hora técnica.
5. HOSPEDAGEM/DOMÍNIO: pagos pelo cliente, sobressalente à proposta.
6. PROPRIEDADE: o código e o domínio pertencem ao cliente após o pagamento total.
7. SUPORTE: 30 dias de suporte pós-entrega por WhatsApp.
8. LGPD: os dados do cliente são tratados conforme a Política de Privacidade do site.

Foco em Dados — Luciano Tavares — focoemdados.com.br`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `termos-contrato-${lead?.name ? String(lead.name).replace(/\s+/g, '-').toLowerCase() : 'sem-lead'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#ffe4af] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#fabd00]" />
            Contratos & Financeiro
          </h2>
          <p className="text-xs text-[#d4c5ab] mt-1">
            Minuta de contrato em formato A4, imprimível, com exportação dos termos.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#d4c5ab]">
          Cliente:
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-[#121414] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e3e2e2] focus:outline-none focus:border-[#fabd00]/40"
          >
            <option value="">Selecione um lead…</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </label>
      </div>

      {!lead ? (
        <div className="glass-card p-8 text-center text-sm text-[#d4c5ab]/70 rounded-2xl">
          Selecione um lead acima para gerar a minuta contratual A4.
        </div>
      ) : (
        <>
          <div
            id="contrato-print"
            className="glass-card p-10 rounded-2xl bg-white text-slate-900 max-w-[210mm] mx-auto"
            style={{ fontFamily: 'Georgia, serif', minHeight: '297mm' }}
          >
            <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Minuta de Contrato — Foco em Dados</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Proposta de Desenvolvimento de Site</h3>
              </div>
              <p className="text-xs text-slate-500 text-right">São Paulo, {new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Entre <strong>Foco em Dados</strong> (Luciano Tavares, dev & IA) e{' '}
              <strong>{lead.name}</strong> — {lead.phone ? `tel. ${lead.phone}` : 'sem telefone'}
              {lead.email ? ` — ${lead.email}` : ''} — fica acordado o seguinte:
            </p>

            <div className="space-y-4 text-[13px] text-slate-700 leading-relaxed">
              <p><strong>1. Escopo.</strong> Criação ou redesign de site profissional de alta conversão, integração com WhatsApp e dashboard de BI (conforme comparador Antes/Depois aprovado).</p>
              <p><strong>2. Prazo.</strong> Entrega em até 15 dias úteis após a aprovação do mockup.</p>
              <p><strong>3. Pagamento.</strong> {lead.value ? formatBRL(Number(lead.value)) : 'Valor a combinar'} — 50% na assinatura, 50% na entrega (PIX, cartão ou boleto).</p>
              <p><strong>4. Revisões.</strong> 3 rodadas de ajustes inclusas; demais ajustes por hora técnica.</p>
              <p><strong>5. Domínio e hospedagem.</strong> Custos de terceiros são de responsabilidade do cliente.</p>
              <p><strong>6. Propriedade.</strong> Código e domínio passam ao cliente após o pagamento total.</p>
              <p><strong>7. Suporte.</strong> 30 dias de suporte pós-entrega via WhatsApp oficial (11) 99441-1307.</p>
              <p><strong>8. LGPD.</strong> Dados tratados conforme a Política de Privacidade disponível em focoemdados.com.br/politica-de-privacidade.</p>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-300 text-xs text-slate-600 space-y-1">
              <p>Contratante: ________________________________________</p>
              <p>Contratado: __________________________________________</p>
              <p className="mt-4 text-[10px] text-slate-400">Documento gerado automaticamente pelo Prospector de Sites — focoemdados.com.br</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.print()}
              className="btn-glow h-10 px-5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF (A4)
            </button>
            <button
              onClick={downloadTerms}
              className="h-10 px-5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Termos (.txt)
            </button>
          </div>
          {lead.status === 'fechado' && (
            <p className="text-xs text-[#4ade80] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Lead fechado — contrato finalizável.
            </p>
          )}
        </>
      )}
    </div>
  );
}