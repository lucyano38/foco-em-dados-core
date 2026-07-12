import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

interface InsightsAutomaticosProps {
  dados: any[];
  eixoX: string;
  eixoY: string;
  tema?: 'dark' | 'light' | 'high-contrast';
}

export default function InsightsAutomaticos({ dados, eixoX, eixoY, tema = 'dark' }: InsightsAutomaticosProps) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [recomendacoes, setRecomendacoes] = useState<string[]>([]);

  // Configurações de cores baseadas no tema
  const c = {
    dark: {
      bgCard: 'bg-slate-900/40 border-slate-900',
      textPrimary: 'text-white',
      textSecondary: 'text-slate-400',
      textMuted: 'text-slate-500',
      btnRefresh: 'border-slate-800 text-slate-300 hover:text-cyan-400 bg-slate-950 hover:bg-slate-900',
      glow: 'shadow-cyan-900/20'
    },
    light: {
      bgCard: 'bg-white border-slate-200',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-500',
      btnRefresh: 'border-slate-200 text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50',
      glow: 'shadow-blue-900/5'
    },
    'high-contrast': {
      bgCard: 'bg-black border-yellow-400',
      textPrimary: 'text-yellow-400',
      textSecondary: 'text-white',
      textMuted: 'text-gray-400',
      btnRefresh: 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-black',
      glow: ''
    }
  }[tema];

  const gerarInsights = async () => {
    if (!dados || dados.length === 0) {
      setInsight("Não há dados suficientes para gerar insights.");
      return;
    }

    setLoading(true);
    setInsight(null);
    setRecomendacoes([]);

    try {
      // Agrupa valores de eixoY por eixoX para diminuir o payload
      const agregados: Record<string, number> = {};
      dados.forEach(row => {
        const chave = String(row[eixoX] || 'Desconhecido');
        const valor = Number(row[eixoY]) || 0;
        agregados[chave] = (agregados[chave] || 0) + valor;
      });

      const payload = Object.entries(agregados)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50) // Limita aos top 50 para evitar excesso de tokens
        .map(([key, value]) => ({ [eixoX]: key, [eixoY]: value }));

      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dados: payload,
          eixoX,
          eixoY
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar insights da API.");
      }

      const result = await response.json();
      setInsight(result.textoResumo || "Nenhum resumo gerado.");
      setRecomendacoes(result.novasRecomendacoes || []);
    } catch (error) {
      console.error(error);
      setInsight("Ocorreu um erro ao comunicar com a IA para gerar os insights. Tente novamente mais tarde.");
      setRecomendacoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Pode gerar insights automaticamente ao montar ou ao mudar as colunas principais
    // mas por enquanto vamos deixar explícito pelo botão, ou chamar na primeira vez.
    if (dados && dados.length > 0) {
      gerarInsights();
    }
  }, [eixoX, eixoY]); // Recalcula quando o eixo muda

  return (
    <div className={`rounded-2xl p-5 shadow-xl border transition-all duration-200 flex flex-col h-full ${c.bgCard} ${c.glow}`}>
      <div className={`flex items-center justify-between mb-4 border-b pb-3 ${tema === 'high-contrast' ? 'border-yellow-400' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <Bot className={`w-5 h-5 ${tema === 'high-contrast' ? 'text-yellow-400' : 'text-cyan-400'}`} />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${c.textPrimary}`}>
            Insights com Gemini AI
          </h2>
        </div>
        <button 
          onClick={gerarInsights}
          disabled={loading}
          className={`p-1.5 rounded-lg border transition-all ${c.btnRefresh} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Recalcular Insights"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-4">
            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${tema === 'high-contrast' ? 'border-yellow-400' : 'border-cyan-500'}`}></div>
            <p className={`text-xs animate-pulse font-medium ${c.textSecondary}`}>
              A Inteligência Artificial está analisando os dados...
            </p>
          </div>
        ) : insight ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Resumo Textual */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${tema === 'high-contrast' ? 'text-yellow-400' : 'text-purple-400'}`} />
                <h3 className={`text-xs font-bold ${c.textPrimary}`}>Síntese Analítica</h3>
              </div>
              <p className={`text-sm leading-relaxed ${c.textSecondary}`} dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, `<strong class="${c.textPrimary}">$1</strong>`) }} />
            </div>

            {/* Recomendações */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 ${tema === 'high-contrast' ? 'text-yellow-400' : 'text-emerald-400'}`} />
                <h3 className={`text-xs font-bold ${c.textPrimary}`}>Ações Recomendadas</h3>
              </div>
              <ul className="space-y-2">
                {recomendacoes.map((rec, idx) => (
                  <li key={idx} className={`flex items-start gap-2 p-3 rounded-xl border ${tema === 'high-contrast' ? 'border-yellow-400/30 bg-black' : 'border-slate-800/50 bg-slate-900/20'}`}>
                    <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${tema === 'high-contrast' ? 'text-yellow-400' : 'text-cyan-500'}`} />
                    <span className={`text-xs leading-relaxed ${c.textSecondary}`}>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 space-y-3 text-center">
            <Bot className={`w-10 h-10 opacity-20 ${c.textPrimary}`} />
            <p className={`text-xs ${c.textMuted}`}>Selecione os eixos de análise e clique no botão para gerar insights estratégicos sobre seus dados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
