import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Loader2, GitCompareArrows } from 'lucide-react';
import { safeJson } from '../lib/safeFetch';

interface Lead {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  value?: number | null;
  potential?: number | null;
  status: string;
  source?: string | null;
  hasWebsite?: boolean | null;
  created_at?: string | null;
}

interface Props {
  leads: Lead[];
}

export default function RedesignContractPanel({ leads }: Props) {
  const [leadId, setLeadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const lead = leads.find((l) => l.id === leadId) || null;

  const generateRedesign = async () => {
    if (!lead) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPublicUrl(null);

    try {
      const payload = {
        companyName: lead.name,
        segment: (lead as any).segment || (lead.notes?.split('·')[0]?.trim() || 'comércio local'),
        city: (lead as any).city || '',
        uf: (lead as any).uf || '',
        whatsapp: lead.phone || lead.email || '',
        hasWebsite: Boolean(lead.hasWebsite),
        redesignGoal: 'modernizar presença digital e converter via WhatsApp',
      };

      const res = await fetch('/api/auto-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: payload }),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Falha na geração: ${res.status} ${text}`);
      }

      const data = await safeJson(res);
      const publishRes = await fetch(`/api/auto-design/${data.designId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(30000),
      });

      if (publishRes.ok) {
        const publishData = await safeJson(publishRes);
        const url = publishData.publicUrl || publishData.internalUrl || null;
        setPublicUrl(url);
        setSuccess(url ? 'Redesign publicado e link temporário gerado.' : 'Redesign gerado, mas sem link público.');
      } else {
        setSuccess('Redesign gerado localmente.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar redesign.');
    } finally {
      setLoading(false);
    }
  };

  const downloadContract = () => {
    if (!lead) return;
    const content = `TERMOS DE CONTRATO — FOCO EM DADOS\n\nCliente: ${lead.name}\nTelefone: ${lead.phone || '___'}\nE-mail: ${lead.email || '___'}\nValor do projeto: ${lead.value ? `R$ ${Number(lead.value).toLocaleString('pt-BR')}` : '___'}\nStatus: ${lead.status || '___'}\nRedesign: ${publicUrl || 'gerado no sistema'}\n\n1. ESCOPO: criação/redesign de site profissional, integração com WhatsApp e dashboard de BI.\n2. PRAZO: entrega em até 15 dias úteis após aprovação do comparador Antes/Depois.\n3. PAGAMENTO: 50% na assinatura e 50% na entrega. Formas: PIX, cartão ou boleto.\n4. REVISÕES: 3 rodadas de ajustes inclusas; acima disso, cobrado hora técnica.\n5. HOSPEDAGEM/DOMÍNIO: pagos pelo cliente, sobressalente à proposta.\n6. PROPRIEDADE: o código e o domínio pertencem ao cliente após o pagamento total.\n7. SUPORTE: 30 dias de suporte pós-entrega por WhatsApp.\n8. LGPD: os dados do cliente são tratados conforme a Política de Privacidade do site.\n\nFoco em Dados — Luciano Tavares — focoemdados.com.br`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `termos-contrato-${String(lead.name).replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() || 'sem-lead'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-[#d4c5ab]">Cliente:</label>
        <select
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          className="bg-[#121414] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e3e2e2] focus:outline-none focus:border-[#fabd00]/40"
        >
          <option value="">Selecione um lead</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        <button
          onClick={generateRedesign}
          disabled={!leadId || loading}
          className="h-9 px-4 rounded-lg bg-[#ffc107] text-[#121414] text-xs font-bold disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompareArrows className="w-3.5 h-3.5" />}
          Gerar Redesign
        </button>

        <button
          onClick={downloadContract}
          disabled={!leadId}
          className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Baixar Contrato
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-[#4ade80]">{success}</p>}
      {publicUrl && (
        <p className="text-xs text-[#ffe4af]">
          Link temporário:{' '}
          <a href={publicUrl} target="_blank" rel="noreferrer" className="underline">
            {publicUrl}
          </a>
        </p>
      )}

      {lead && (
        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <p className="text-sm font-semibold text-[#ffe4af]">{lead.name}</p>
          <p className="text-[11px] text-[#d4c5ab]">
            Status: {lead.status || '___'} · Valor: {lead.value ? `R$ ${Number(lead.value).toLocaleString('pt-BR')}` : '___'}
          </p>
        </div>
      )}
    </div>
  );
}
