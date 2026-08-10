import { Users, Send, DollarSign, TrendingUp } from 'lucide-react';

const METRICS = [
  { icon: Users, label: 'Leads', value: '5', hint: '2 sem site · 3 com site antigo', accent: 'text-[#4ade80]', bar: 'bg-[#4ade80]' },
  { icon: Send, label: 'Propostas', value: '3', hint: '2 clientes já aceitaram', accent: 'text-[#fabd00]', bar: 'bg-[#fabd00]' },
  { icon: DollarSign, label: 'Receita Setups', value: 'R$ 497', hint: '1 faturamento realizado', accent: 'text-[#60a5fa]', bar: 'bg-[#60a5fa]' },
  { icon: TrendingUp, label: 'MRR Manutenção', value: 'R$ 97', hint: 'Projeção anual: R$ 1.164', accent: 'text-[#cdbdff]', bar: 'bg-[#cdbdff]' },
];

export default function MetricsOverlay() {
  return (
    <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
      <div className="glassmorphism rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {METRICS.map((m) => (
            <div key={m.label} className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#d4c5ab]/70 uppercase tracking-widest">
                  {m.label}
                </p>
                <m.icon className={`w-4 h-4 ${m.accent} opacity-50 group-hover:opacity-100 transition-opacity`} />
              </div>
              <p className={`font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold ${m.accent}`}>
                {m.value}
              </p>
              <p className="text-xs text-[#d4c5ab]/60 mt-2">{m.hint}</p>
              <div className={`absolute bottom-0 left-0 w-full h-0.5 ${m.bar} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
