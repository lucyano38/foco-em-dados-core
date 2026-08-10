import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Database, Plus, Trash2, Send, Phone, Mail, ArrowRight, GripVertical,
  ShieldCheck, Users, Target, CheckCircle2, Loader2,
} from 'lucide-react';

export interface PipelineLead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  value?: number;
  status: PipelineStageId;
  source?: string;
  created_at: string;
}

export const PIPELINE_STAGES: {
  id: PipelineStageId;
  label: string;
  number: number;
  accent: string;
  dot: string;
}[] = [
  { id: 'prospeccao', label: 'Prospecção', number: 1, accent: 'border-[#60a5fa]/40', dot: '#60a5fa' },
  { id: 'qualificacao', label: 'Qualificação', number: 2, accent: 'border-[#fbbf24]/40', dot: '#fbbf24' },
  { id: 'proposta', label: 'Proposta', number: 3, accent: 'border-[#cdbdff]/40', dot: '#cdbdff' },
  { id: 'negociacao', label: 'Negociação', number: 4, accent: 'border-[#ff8a5c]/40', dot: '#ff8a5c' },
  { id: 'fechamento', label: 'Fechamento', number: 5, accent: 'border-[#4ade80]/40', dot: '#4ade80' },
];

export type PipelineStageId = 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechamento';

const STORAGE_KEY = 'foco_admin_pipeline';

const SEED_LEADS: PipelineLead[] = [
  { id: 'seed-1', name: 'Moda Bella Store', phone: '5511999990001', email: 'contato@modabellastore.com.br', notes: 'Loja de moda feminina, sem site. Capturado via busca automatizada.', value: 2900, status: 'prospeccao', source: 'Hermes AI', created_at: new Date().toISOString() },
  { id: 'seed-2', name: 'Auto Peças Silva', phone: '5511988880002', email: 'vendas@autopecassilva.com.br', notes: 'Possui site simples, sem integração de vendas.', value: 1800, status: 'prospeccao', source: 'Hermes AI', created_at: new Date().toISOString() },
  { id: 'seed-3', name: 'Padaria Pão Dourado', phone: '5511977770003', email: 'contato@paodourado.com.br', notes: 'Interessada em automação de WhatsApp.', value: 950, status: 'qualificacao', source: 'Indicação', created_at: new Date().toISOString() },
  { id: 'seed-4', name: 'Clínica Vida Plena', phone: '5511966660004', email: 'recepcao@clinicavidaplena.com.br', notes: 'Quer dashboard de BI para agenda e faturamento.', value: 3900, status: 'proposta', source: 'Indicação', created_at: new Date().toISOString() },
  { id: 'seed-5', name: 'Mercado Bom Preço', phone: '5511955550005', email: 'adm@mercadobompreco.com.br', notes: 'Negociando site + loja virtual completa.', value: 4800, status: 'negociacao', source: 'Hermes AI', created_at: new Date().toISOString() },
];

const STAGE_LABEL: Record<PipelineStageId, string> = {
  prospeccao: 'Prospecção',
  qualificacao: 'Qualificação',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechamento: 'Fechamento',
};

export default function Admin() {
  const { user, signOut } = useAuth();
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStageId | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '', value: '' });
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const persist = (next: PipelineLead[]) => {
    setLeads(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { /* storage indisponível */ }
    syncToSupabase(next);
  };

  const syncToSupabase = async (next: PipelineLead[]) => {
    if (!isSupabaseConfigured || !user) return;
    try {
      for (const lead of next) {
        const { error } = await supabase
          .from('leads')
          .upsert(
            {
              id: lead.id.startsWith('seed-') ? undefined : lead.id,
              user_id: user.id,
              name: lead.name,
              email: lead.email ?? null,
              phone: lead.phone ?? null,
              status: lead.status,
              notes: lead.notes ?? null,
            },
            { onConflict: 'id' }
          );
        if (error) console.warn('[admin] upsert lead falhou:', error.message);
      }
    } catch (err) {
      console.warn('[admin] sync supabase indisponível:', err);
    }
  };

  useEffect(() => {
    document.title = 'Painel Administrativo | Foco em Dados';
    const load = async () => {
      let stored: PipelineLead[] | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        stored = raw ? JSON.parse(raw) : null;
      } catch { stored = null; }

      let remote: PipelineLead[] = [];
      if (isSupabaseConfigured && user) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          remote = (data as any[]).map((l) => ({
            id: String(l.id),
            name: l.name,
            phone: l.phone ?? undefined,
            email: l.email ?? undefined,
            notes: l.notes ?? undefined,
            status: (STAGE_LABEL[l.status] ? l.status : 'prospeccao') as PipelineStageId,
            created_at: l.created_at,
          }));
        }
      }

      const merged = remote.length
        ? [...remote, ...(stored || []).filter((s) => s.id.startsWith('seed-'))]
        : (stored && stored.length ? stored : SEED_LEADS);
      setLeads(merged);
      setLoaded(true);
    };
    load();
  }, [user]);

  const addLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const lead: PipelineLead = {
      id: `local-${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      notes: form.notes.trim() || undefined,
      value: Number(form.value) || undefined,
      status: 'prospeccao',
      source: 'Manual',
      created_at: new Date().toISOString(),
    };
    persist([lead, ...leads]);
    setForm({ name: '', phone: '', email: '', notes: '', value: '' });
    setShowForm(false);
    setToast(`Lead "${lead.name}" adicionado à Prospecção.`);
    setTimeout(() => setToast(null), 3500);
  };

  const moveLead = (id: string, status: PipelineStageId) => {
    setDragOverStage(null);
    setLeads((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, status } : l));
      persist(next);
      return next;
    });
  };

  const removeLead = (id: string) => {
    persist(leads.filter((l) => l.id !== id));
  };

  const sendApproach = async (lead: PipelineLead) => {
    setSendingId(lead.id);
    setToast(null);
    try {
      const res = await fetch('/api/prospection/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          notes: lead.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no envio.');
      }
      setToast(`Abordagem enviada para ${lead.name}.`);
    } catch (err: any) {
      setToast(`Erro: ${err.message || 'falha no envio.'}`);
    } finally {
      setSendingId(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const byStage = (id: PipelineStageId) => leads.filter((l) => l.status === id);
  const totalValue = leads.filter((l) => l.status === 'fechamento').reduce((acc, l) => acc + (l.value || 0), 0);

  if (!loaded) {
    return (
      <div className="w-full min-h-screen bg-[#121414] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#fabd00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#121414] text-[#e3e2e2] font-sans">
      <div className="mesh-bg" />

      <header className="border-b border-[#4f4632]/40 backdrop-blur-xl bg-[#121414]/70 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-[#121414]" />
            </div>
            <span className="font-[family-name:var(--font-display)] font-bold text-sm">Painel Administrativo</span>
            <span className="text-[10px] font-mono text-[#ffe4af] bg-[#fabd00]/10 px-2 py-0.5 rounded-full ml-2 border border-[#fabd00]/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/app" className="text-xs text-[#d4c5ab] hover:text-[#e3e2e2] transition-colors">Área do Cliente</Link>
            <button
              onClick={() => signOut()}
              className="text-xs text-[#d4c5ab] hover:text-red-400 transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#ffe4af]">Pipeline de Vendas</h1>
            <p className="text-sm text-[#d4c5ab] mt-1">
              Kanban estilo RD Station / HubSpot — arraste os cards entre as etapas.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-glow h-11 px-6 rounded-xl text-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Prospecção
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((s) => (
            <div key={s.id} className="glass-card p-4">
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[#d4c5ab]/70">
                {s.number}. {s.label}
              </p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold" style={{ color: s.dot }}>
                {byStage(s.id).length}
              </p>
            </div>
          ))}
        </div>

        <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#d4c5ab]">
            <Users className="w-3.5 h-3.5 inline mr-1.5" />
            {leads.length} leads no pipeline
          </p>
          <p className="text-xs text-[#4ade80] font-mono">
            Valor em Fechamento: <strong>R$ {totalValue.toLocaleString('pt-BR')}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.id);
              }}
              onDragLeave={() => setDragOverStage((prev) => (prev === stage.id ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveLead(dragId, stage.id);
              }}
              className={`rounded-2xl border bg-white/[0.02] p-3 min-h-[320px] transition-all ${
                dragOverStage === stage.id ? 'border-[#fabd00]/60 bg-[#fabd00]/[0.04]' : `border-[#4f4632]/50 ${stage.accent}`
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: stage.dot }} />
                  {stage.number}. {stage.label}
                </span>
                <span className="text-[10px] font-mono text-[#d4c5ab]/60">{byStage(stage.id).length}</span>
              </div>

              <div className="space-y-2">
                {byStage(stage.id).map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onDragEnd={() => setDragId(null)}
                    className="glass-card rounded-xl p-3 cursor-grab active:cursor-grabbing card-hover group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#e3e2e2] leading-snug">{lead.name}</p>
                      <GripVertical className="w-3.5 h-3.5 text-[#d4c5ab]/40 shrink-0" />
                    </div>
                    {lead.source && (
                      <span className="text-[10px] font-mono text-[#fabd00]/80">{lead.source}</span>
                    )}
                    {lead.notes && (
                      <p className="text-[11px] text-[#d4c5ab]/70 mt-1.5 line-clamp-2">{lead.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5">
                      {lead.phone && (
                        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[#4ade80]/80 hover:text-[#4ade80]" title="Abrir WhatsApp">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="text-[#60a5fa]/80 hover:text-[#60a5fa]" title="Enviar e-mail">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {lead.value ? (
                        <span className="ml-auto font-mono text-[11px] text-[#ffe4af]">
                          R$ {lead.value.toLocaleString('pt-BR')}
                        </span>
                      ) : (
                        <span className="ml-auto" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => sendApproach(lead)}
                        disabled={sendingId === lead.id}
                        className="flex items-center gap-1 text-[10px] text-[#fabd00] hover:underline cursor-pointer disabled:opacity-50"
                        title="Enviar abordagem (WhatsApp/e-mail)"
                      >
                        {sendingId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Enviar
                      </button>
                      <button
                        onClick={() => removeLead(lead.id)}
                        className="flex items-center gap-1 text-[10px] text-red-400/80 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover
                      </button>
                      {stage.id !== 'fechamento' && (
                        <button
                          onClick={() => moveLead(lead.id, PIPELINE_STAGES[stage.number].id as PipelineStageId)}
                          className="ml-auto text-[10px] text-[#d4c5ab]/60 hover:text-[#ffe4af] cursor-pointer"
                          title={`Mover para ${PIPELINE_STAGES[stage.number].label}`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {byStage(stage.id).length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#4f4632]/40 p-4 text-center text-[11px] text-[#d4c5ab]/40">
                    Solte leads aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card p-5 flex items-start gap-3">
          <Target className="w-4 h-4 text-[#cdbdff] shrink-0 mt-0.5" />
          <p className="text-xs text-[#d4c5ab] leading-relaxed">
            <strong className="text-[#e3e2e2]">Fluxo de conversão:</strong> o Hermes Agent captura leads (empresas com ou sem site),
            insere na etapa <strong>1. Prospecção</strong> e você conduz até <strong>5. Fechamento</strong>. O botão "Enviar"
            dispara a abordagem via WhatsApp/e-mail (limite de 5 prospecções/dia na política atual).
          </p>
        </div>

        <div className="flex items-center gap-2 justify-center pb-6">
          <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
          <span className="text-xs text-[#d4c5ab]/60">Sincronizado com o CRM (tabela leads do Supabase)</span>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={addLead} className="glassmorphism p-6 w-full max-w-md rounded-2xl space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#ffe4af]">Nova Prospecção</h2>
            <div className="space-y-1.5">
              <label className="text-xs text-[#d4c5ab] ml-1">Nome da empresa/contato *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Loja Bella Moda"
                className="input-mystic w-full h-10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[#d4c5ab] ml-1">WhatsApp</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="5511999999999"
                  className="input-mystic w-full h-10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#d4c5ab] ml-1">Valor (R$)</label>
                <input
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="Ex.: 1500"
                  className="input-mystic w-full h-10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#d4c5ab] ml-1">E-mail</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contato@empresa.com.br"
                className="input-mystic w-full h-10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#d4c5ab] ml-1">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Contexto, interesse, próximo passo..."
                className="input-mystic w-full px-3 py-2 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/40 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 px-4 rounded-lg border border-[#4f4632]/60 text-sm text-[#d4c5ab] hover:border-[#fabd00]/50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-glow h-10 px-6 rounded-lg text-sm flex-1 cursor-pointer">
                Adicionar ao Pipeline
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glassmorphism px-5 py-3 rounded-xl text-sm text-[#e3e2e2] max-w-md text-center">
          {toast}
        </div>
      )}

      <div className="text-center pb-8">
        <Link to="/" className="text-xs text-[#d4c5ab]/50 hover:text-[#fabd00] transition-colors">
          Voltar para o site
        </Link>
      </div>
    </div>
  );
}
