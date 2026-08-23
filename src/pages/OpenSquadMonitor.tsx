import { useEffect, useMemo, useState } from 'react';

type LogEntry = {
  id: string;
  cnpj: string;
  razao_social: string;
  agente_nome: string;
  acao: string;
  data_acao: string;
};

const MOCK_LOGS: LogEntry[] = [
  { id: '1', cnpj: '12345678000190', razao_social: 'Clínica OdontoSorriso', agente_nome: 'Carlos', acao: 'Disparou WhatsApp', data_acao: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
  { id: '2', cnpj: '98765432000155', razao_social: 'Barbearia do Alencar', agente_nome: 'Mariana', acao: 'Moveu para Fechado', data_acao: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: '3', cnpj: '45612378000133', razao_social: 'Clínica OdontoSorriso', agente_nome: 'Carlos', acao: 'Moveu para Fechado', data_acao: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function OpenSquadMonitor() {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.razao_social, l.agente_nome, l.acao].some((v) => v.toLowerCase().includes(q))
    );
  }, [logs, filter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const custom = event as CustomEvent<LogEntry>;
      if (custom.detail?.acao) {
        setLogs((prev) => [custom.detail, ...prev].slice(0, 200));
      }
    };
    window.addEventListener('opensquad-log', handler);
    return () => window.removeEventListener('opensquad-log', handler);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <h1 className="text-2xl font-bold">Monitor do Squad — OpenSquad</h1>
      <p className="text-sm text-gray-600">
        Feed de atividades dos agentes em tempo local. Para produção, substituir por WebSockets com backend real.
      </p>

      <input
        className="w-full rounded border p-2"
        placeholder="Filtrar por lead, agente ou ação..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="space-y-2">
        {filtered.map((log) => (
          <div
            key={log.id}
            className="rounded border p-3 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold">
                [{formatTime(log.data_acao)}] {log.agente_nome}: {log.acao} — {log.razao_social}
              </p>
              <p className="text-xs text-gray-500">CNPJ: {log.cnpj}</p>
            </div>
            <span className="text-xs text-gray-500">{new Date(log.data_acao).toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
