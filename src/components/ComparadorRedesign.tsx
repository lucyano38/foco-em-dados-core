import { useEffect, useMemo, useState } from 'react';
import { PUBLIC_TUNNEL_URL } from '../lib/contact';

export interface ClientRow {
  id: string;
  nome: string;
  slug: string;
  old?: string | null;
  motivo?: string;
}

const CLIENTES: ClientRow[] = [
  { id: '1', nome: 'Clínica Odonto Prime Alphaville', slug: 'clinica-odonto-alphaville', old: null, motivo: 'Site Flash desatualizado' },
  { id: '2', nome: 'Martins & Associados Advocacia', slug: 'escritorio-advocacia-martins', old: 'https://www.martinsadv.com.br', motivo: '' },
  { id: '3', nome: 'Bistrô Terroir & Vinhos', slug: 'bistro-terroir-gastronomia', old: null, motivo: 'Sem redesign pronto' },
  { id: '4', nome: 'Lúmina Arquitetura', slug: 'studio-arquitetura-lumina', old: null, motivo: 'Sem redesign pronto' },
  { id: '5', nome: 'Vortex Centro Automotivo', slug: 'auto-mecanica-vortex', old: null, motivo: 'Sem site próprio' },
  { id: '6', nome: 'Espaço Zen Pilates', slug: 'espaco-zen-fisioterapia', old: null, motivo: 'Sem redesign pronto' },
];

const DEMO_BASE = 'https://capitol-tobacco-outstanding-jewelry.trycloudflare.com/sites';

export default function ComparadorRedesign() {
  const [activeId, setActiveId] = useState<string>(CLIENTES[0]?.id ?? '');
  const cliente = useMemo(() => CLIENTES.find((c) => c.id === activeId) || null, [activeId]);

  useEffect(() => {
    if (!CLIENTES.length) return;
    setActiveId((prev) => (CLIENTES.some((c) => c.id === prev) ? prev : CLIENTES[0].id));
  }, []);

  const novoUrl = cliente ? `${DEMO_BASE}/${cliente.slug}/${cliente.slug}.html` : '#';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#ffe4af]">Comparador — Antes vs Depois</h1>
        <p className="text-xs text-[#d4c5ab] mt-1">
          Esquerda: site atual · Direita: nova versão. Se o site antigo bloquear incorporação, use “abrir em nova aba”.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CLIENTES.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`h-9 px-4 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeId === c.id
                ? 'bg-[#ffc107] text-[#121414] border-[#ffc107]'
                : 'bg-white/5 border-white/10 text-[#e3e2e2] hover:bg-white/10'
            }`}
          >
            {idx + 1}. {c.nome}
          </button>
        ))}
      </div>

      {cliente ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between bg-white/[0.04] border-b border-white/10 px-3 py-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]">Site atual</span>
              {cliente.old ? (
                <a href={cliente.old} target="_blank" rel="noreferrer" className="text-[11px] text-cyan-300 hover:underline">
                  abrir em nova aba ↗
                </a>
              ) : null}
            </div>
            {cliente.old ? (
              <iframe src={cliente.old} title="Site atual" className="w-full h-[420px] bg-white" sandbox="allow-scripts" />
            ) : (
              <div className="w-full h-[420px] bg-[#0b0d10] flex flex-col items-center justify-center gap-2 text-center px-6">
                <span className="text-sm font-bold text-red-400">Sem site para comparar</span>
                <span className="text-xs text-[#d4c5ab]/70">{cliente.motivo || 'Site fora do ar ou não informado.'}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between bg-white/[0.04] border-b border-white/10 px-3 py-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]">Nova versão</span>
              <a href={novoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-cyan-300 hover:underline">
                abrir demo temporária ↗
              </a>
            </div>
            <iframe src={novoUrl} title="Nova versão" className="w-full h-[420px] bg-white" sandbox="allow-scripts allow-same-origin" />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-[#d4c5ab]">
          Nenhum cliente selecionado.
        </div>
      )}
    </div>
  );
}
