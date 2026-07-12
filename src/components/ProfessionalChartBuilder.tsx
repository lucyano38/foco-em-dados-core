import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as DonutIcon, 
  Layers, 
  Sigma, 
  Binary, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers2, 
  Calculator,
  HelpCircle,
  Hash,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

export type ChartType = 'column' | 'line' | 'bar' | 'area' | 'donut';
export type AggregationOp = 'sum' | 'avg' | 'count' | 'max' | 'min';

interface ProfessionalChartBuilderProps {
  /**
   * Raw JSON dataset received from the spreadsheet.
   * Format: Array of objects, e.g., [{ Category: 'Electronics', Sales: 1200 }, ...]
   */
  rawData: Record<string, any>[];
  /**
   * Available headers/columns in the dataset.
   */
  headers: string[];
  /**
   * Optional default selected X key (categorical column)
   */
  defaultXKey?: string;
  /**
   * Optional default selected Y key (numerical column)
   */
  defaultYKey?: string;
}

// Premium color palette for the charts
const CHART_COLORS = [
  '#6366f1', // Indigo
  '#a855f7', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f43f5e'  // Rose
];

export const ProfessionalChartBuilder: React.FC<ProfessionalChartBuilderProps> = ({
  rawData = [],
  headers = [],
  defaultXKey = '',
  defaultYKey = ''
}) => {
  // 1. Core builder states
  const [chartType, setChartType] = useState<ChartType>('column');
  const [selectedX, setSelectedX] = useState<string>(defaultXKey);
  const [selectedY, setSelectedY] = useState<string>(defaultYKey);
  const [aggOp, setAggOp] = useState<AggregationOp>('sum');

  // Auto-detect categorical and numerical defaults if props are empty
  React.useEffect(() => {
    if (rawData.length > 0 && headers.length > 0) {
      if (!selectedX) {
        const firstStringCol = headers.find(h => typeof rawData[0]?.[h] === 'string') || headers[0];
        setSelectedX(firstStringCol);
      }
      if (!selectedY) {
        const firstNumCol = headers.find(h => typeof rawData[0]?.[h] === 'number') || headers[1] || '';
        setSelectedY(firstNumCol);
      }
    }
  }, [rawData, headers]);

  // 2. BI BI-Engine: Advanced Grouping and Aggregation logic
  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0 || !selectedX || !selectedY) {
      return [];
    }

    const groups: Record<string, number[]> = {};

    rawData.forEach(row => {
      // Get the categorical key safely stringified
      const rawXVal = row[selectedX];
      const xVal = rawXVal !== undefined && rawXVal !== null ? String(rawXVal) : '(Vazio)';
      
      // Get the numerical value safely parsed
      const rawYVal = row[selectedY];
      let yVal = 0;
      if (typeof rawYVal === 'number') {
        yVal = rawYVal;
      } else if (typeof rawYVal === 'string') {
        const parsed = parseFloat(rawYVal.replace(/[^\d.-]/g, ''));
        yVal = isNaN(parsed) ? 0 : parsed;
      }

      if (!groups[xVal]) {
        groups[xVal] = [];
      }
      groups[xVal].push(yVal);
    });

    // Run selected aggregate operation on each group
    return Object.entries(groups).map(([category, values]) => {
      let aggregatedValue = 0;

      switch (aggOp) {
        case 'sum':
          aggregatedValue = values.reduce((sum, v) => sum + v, 0);
          break;
        case 'avg':
          const sum = values.reduce((sum, v) => sum + v, 0);
          aggregatedValue = values.length > 0 ? Number((sum / values.length).toFixed(2)) : 0;
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        case 'max':
          aggregatedValue = values.length > 0 ? Math.max(...values) : 0;
          break;
        case 'min':
          aggregatedValue = values.length > 0 ? Math.min(...values) : 0;
          break;
        default:
          aggregatedValue = 0;
      }

      return {
        name: category,
        value: aggregatedValue
      };
    }).sort((a, b) => {
      // Numerical sort descending by default if applicable, or alphabetical
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return b.value - a.value;
      }
      return String(a.name).localeCompare(String(b.name));
    });
  }, [rawData, selectedX, selectedY, aggOp]);

  // 3. KPI Calculations based on the active Y axis column (overall raw dataset context)
  const kpis = useMemo(() => {
    if (!rawData || rawData.length === 0 || !selectedY) {
      return { total: 0, average: 0, count: 0, max: 0 };
    }

    let sum = 0;
    let count = 0;
    let max = -Infinity;

    rawData.forEach(row => {
      const rawVal = row[selectedY];
      let val = 0;
      if (typeof rawVal === 'number') {
        val = rawVal;
      } else if (typeof rawVal === 'string') {
        const parsed = parseFloat(rawVal.replace(/[^\d.-]/g, ''));
        val = isNaN(parsed) ? 0 : parsed;
      }
      sum += val;
      count++;
      if (val > max) max = val;
    });

    return {
      total: sum,
      average: count > 0 ? Number((sum / count).toFixed(2)) : 0,
      count: count,
      max: max === -Infinity ? 0 : max
    };
  }, [rawData, selectedY]);

  // Helper formatting for currency/large numbers
  const formatValue = (val: number) => {
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toFixed(1)}k`;
    }
    return val.toLocaleString('pt-BR');
  };

  // Modern custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-white/10 backdrop-blur-md p-3.5 rounded-xl shadow-2xl font-sans text-xs">
          <p className="text-slate-400 font-medium mb-1">{selectedX}: <span className="text-white font-bold">{data.name}</span></p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[0] }} />
            <span className="text-slate-300 capitalize">{aggOp === 'avg' ? 'Média' : aggOp === 'sum' ? 'Soma' : aggOp === 'count' ? 'Contagem' : aggOp === 'max' ? 'Máximo' : 'Mínimo'}:</span>
            <span className="text-indigo-400 font-extrabold text-sm">
              {typeof data.value === 'number' ? data.value.toLocaleString('pt-BR') : data.value}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-slate-900/45 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col gap-6" id="bi-chart-builder">
      
      {/* Upper Panel: KPI Cards and Summary Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total KPI */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-slate-950/20 to-transparent border border-indigo-500/15 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sigma className="w-3 h-3 text-indigo-400" />
              Soma Total ({selectedY || 'Métrica'})
            </span>
            <h4 className="text-2xl font-black text-white tracking-tight mt-1">
              {formatValue(kpis.total)}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Acumulado do eixo selecionado</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
            <ArrowUpRight className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Average KPI */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-slate-950/20 to-transparent border border-purple-500/15 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Calculator className="w-3 h-3 text-purple-400" />
              Média Geral
            </span>
            <h4 className="text-2xl font-black text-white tracking-tight mt-1">
              {formatValue(kpis.average)}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Média aritmética por linha</p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <Binary className="w-5 h-5" />
          </div>
        </div>

        {/* Count KPI */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-slate-950/20 to-transparent border border-cyan-500/15 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" />
              Registros Analisados
            </span>
            <h4 className="text-2xl font-black text-white tracking-tight mt-1">
              {kpis.count.toLocaleString('pt-BR')}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Total de linhas carregadas</p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Hash className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Builder Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Control Column (Power BI-Style Sidebar) */}
        <div className="lg:col-span-1 bg-slate-950/40 rounded-xl p-4 border border-white/5 space-y-5">
          
          {/* Visual Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Tipo de Visual (BI)
            </label>
            <div className="grid grid-cols-5 gap-1.5 bg-slate-900 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setChartType('column')}
                className={`p-2 rounded-md transition-all flex justify-center items-center ${chartType === 'column' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Colunas"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md transition-all flex justify-center items-center ${chartType === 'line' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Linha / Tendência"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-md transition-all flex justify-center items-center rotate-90 ${chartType === 'bar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Barras Agrupadas"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`p-2 rounded-md transition-all flex justify-center items-center ${chartType === 'area' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Área"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('donut')}
                className={`p-2 rounded-md transition-all flex justify-center items-center ${chartType === 'donut' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Pizza / Donut"
              >
                <DonutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* X Axis Selector (Categorical Column) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Eixo X (Categoria)
            </label>
            <select
              value={selectedX}
              onChange={(e) => setSelectedX(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>Selecionar Coluna</option>
              {headers.map(h => (
                <option key={`x-${h}`} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Y Axis Selector (Numerical Column) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Eixo Y (Métrica)
            </label>
            <select
              value={selectedY}
              onChange={(e) => setSelectedY(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>Selecionar Coluna</option>
              {headers.map(h => (
                <option key={`y-${h}`} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Advanced Aggregation Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Agregação (Y)</span>
              <span className="text-[10px] text-indigo-400 font-semibold lowercase">BI Engine</span>
            </label>
            <div className="grid grid-cols-1 gap-1">
              {[
                { id: 'sum', label: 'Soma total' },
                { id: 'avg', label: 'Média aritmética' },
                { id: 'count', label: 'Contagem de linhas' },
                { id: 'max', label: 'Valor máximo' },
                { id: 'min', label: 'Valor mínimo' }
              ].map(op => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setAggOp(op.id as AggregationOp)}
                  className={`px-3 py-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                    aggOp === op.id 
                      ? 'bg-indigo-600/20 border border-indigo-500 text-indigo-200' 
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-transparent'
                  }`}
                >
                  <span>{op.label}</span>
                  {aggOp === op.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Chart Canvas Area */}
        <div className="lg:col-span-3 bg-slate-950/20 border border-white/5 rounded-xl p-5 flex flex-col justify-between min-h-[380px]">
          
          {/* Active Configuration Label */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Gráfico Inteligente de {selectedX || '...'} por {selectedY || '...'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Valores consolidados utilizando <span className="text-indigo-400 font-semibold uppercase">{aggOp}</span>
              </p>
            </div>
            <div className="px-2.5 py-1 bg-slate-900 border border-white/10 rounded-md text-[10px] font-mono text-slate-400">
              {processedData.length} categorias
            </div>
          </div>

          {/* Live Chart Container */}
          <div className="flex-grow w-full min-h-[280px]">
            {processedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {/* 1. COLUMN CHART */}
                {chartType === 'column' && (
                  <BarChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" fill="url(#colGrad)" radius={[4, 4, 0, 0]}>
                      {processedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.95}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.35}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                )}

                {/* 2. LINE CHART */}
                {chartType === 'line' && (
                  <LineChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ r: 4, stroke: '#8b5cf6', strokeWidth: 2, fill: '#0f172a' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#a855f7' }}
                    />
                  </LineChart>
                )}

                {/* 3. BAR CHART (HORIZONTAL) */}
                {chartType === 'bar' && (
                  <BarChart data={processedData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                      {processedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}

                {/* 4. AREA CHART */}
                {chartType === 'area' && (
                  <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#areaGrad)" 
                    />
                  </AreaChart>
                )}

                {/* 5. PIE/DONUT CHART */}
                {chartType === 'donut' && (
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={processedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {processedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ fontSize: '10px', color: '#94a3b8', paddingTop: '15px' }} 
                    />
                  </PieChart>
                )}

              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-slate-500 text-xs border border-dashed border-white/5 rounded-xl bg-slate-950/20">
                <Layers2 className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                <span>Escolha as colunas de dados acima para construir o visual de BI</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 mt-3 border-t border-white/5 pt-3 flex items-center justify-between">
            <span>Powered by Gemini & Recharts Core</span>
            <span>Estilo Inteligente Power BI habilitado</span>
          </div>

        </div>

      </div>

    </div>
  );
};
