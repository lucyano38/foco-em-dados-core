import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../lib/supabase';

type IndicadorRow = {
  codigo: string;
  data: string;
  valor: number;
  atualizado_em: string;
};

type SeriesMap = Record<string, IndicadorRow[]>;

export default function DashboardIndicadores() {
  const [series, setSeries] = useState<SeriesMap>({});
  const [selo, setSelo] = useState<string>('Carregando...');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);

    try {
      const statusRes = await fetch('/api/indicadores/status');
      const status = await statusRes.json();

      const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      const { data, error } = await supabase
        .from('indicadores_economicos')
        .select('*')
        .order('data', { ascending: true });

      if (error) throw error;

      const map: SeriesMap = {};
      (data || []).forEach((row: IndicadorRow) => {
        if (!map[row.codigo]) map[row.codigo] = [];
        map[row.codigo].push(row);
      });

      setSeries(map);
      setSelo(status.selo || 'Sem dados');
    } catch (err: any) {
      setErro(err.message || 'Falha ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 6 * 60 * 60 * 1000); // 6h
    return () => clearInterval(timer);
  }, []);

  const cores: Record<string, string> = {
    SELIC: '#f59e0b',
    IPCA: '#ef4444',
    DOLAR: '#22c55e',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel de Indicadores</h1>
          <p className="text-sm text-slate-400">Séries históricas automáticas do BCB</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            {selo}
          </span>
          <button
            onClick={carregar}
            className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar agora
          </button>
        </div>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-semibold">Falha ao carregar dados</p>
            <p className="text-xs opacity-80">{erro}</p>
          </div>
        </div>
      )}

      {Object.keys(series).length === 0 && !loading && !erro && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-slate-400">
          Nenhum indicador disponível ainda. O scheduler vai popular o painel automaticamente.
        </div>
      )}

      <div className="grid gap-6">
        {Object.entries(series).map(([codigo, linhas]) => (
          <div key={codigo} className="glass-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold">{codigo}</h2>
                <p className="text-xs text-slate-400">{linhas.length} pontos carregados</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: cores[codigo] || '#fff' }}>
                  {linhas[linhas.length - 1]?.valor?.toLocaleString('pt-BR')}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {linhas[linhas.length - 1]?.data}
                </p>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={linhas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    stroke="rgba(255,255,255,0.05)"
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0b0d10',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: '#e3e2e2',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    name={codigo}
                    stroke={cores[codigo] || '#ffc107'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
