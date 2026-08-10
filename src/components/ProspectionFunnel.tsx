import { Kanban } from 'lucide-react';

const STAGES = [
  { label: 'Discovery', count: 5, dot: 'bg-[#60a5fa]', hover: 'hover:border-[#60a5fa]/40' },
  { label: 'Abordagem', count: 2, dot: 'bg-[#fabd00]', hover: 'hover:border-[#fabd00]/40' },
  { label: 'Qualificação', count: 3, dot: 'bg-[#fbbf24]', hover: 'hover:border-[#fbbf24]/40' },
  { label: 'Proposta', count: 2, dot: 'bg-[#cdbdff]', hover: 'hover:border-[#cdbdff]/40' },
  { label: 'Fechamento', count: 1, dot: 'bg-[#4ade80]', hover: 'hover:border-[#4ade80]/40' },
];

export default function ProspectionFunnel() {
  return (
    <section id="funil" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-16">
      <div className="glass-card rounded-[32px] p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-[#e3e2e2] mb-2">
              Funil de Prospecção &amp; Conversão
            </h2>
            <p className="text-[#d4c5ab]">
              Do discovery ao fechamento — pipeline gerido pelo Hermes Agent.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[#fabd00] font-bold text-sm">
            <Kanban className="w-4 h-4" />
            Pipeline de Leads
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STAGES.map((stage, idx) => (
            <div key={stage.label} className="relative">
              <div
                className={`p-6 rounded-2xl bg-[#121414]/80 border border-white/5 transition-all ${stage.hover} card-hover`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2 h-2 rounded-full ${stage.dot} shadow-[0_0_10px_currentColor]`} />
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 uppercase tracking-widest">
                    Etapa {idx + 1}
                  </span>
                </div>
                <p className="text-4xl font-[family-name:var(--font-display)] font-bold text-white mb-1">
                  {stage.count}
                </p>
                <p className="text-[#d4c5ab] text-sm font-medium">{stage.label}</p>
              </div>
              {idx < STAGES.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2.5 w-5 h-px bg-gradient-to-r from-[#fabd00]/40 to-transparent z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
