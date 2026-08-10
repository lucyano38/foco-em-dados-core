import { Link } from 'react-router-dom';
import { Sparkles, Rocket, GitCompareArrows } from 'lucide-react';

export default function Hero() {
  return (
    <section
      className="pt-36 pb-28 px-4 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at center, rgba(250, 189, 0, 0.18) 0%, rgba(82, 3, 213, 0.16) 50%, #121414 100%)',
      }}
    >
      <div className="absolute inset-0 bg-[#121414]/30"></div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fabd00]/10 border border-[#fabd00]/30 text-[#ffe4af] text-xs font-semibold mb-6 glassmorphism">
          <Sparkles className="w-3.5 h-3.5 text-[#fabd00]" />
          Prospecção acelerada por IA — Hermes Agent 24/7
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          <span className="text-glow">Painel Central</span>
          <br />
          <span className="bg-gradient-to-r from-[#fabd00] via-[#ffc107] to-[#cdbdff] bg-clip-text text-transparent">
            Foco em Dados
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-[#d4c5ab] max-w-2xl mx-auto leading-relaxed">
          Automação de processos com IA, criação de sites de alta conversão e
          Business Intelligence profissional. Sua esteira de prospecção,
          redesign e análise de dados pronta para rodar.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/app"
            className="btn-glow h-12 px-8 rounded-xl text-sm flex items-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            Iniciar Nova Prospecção
          </Link>
          <a
            href="#funil"
            className="h-12 px-8 rounded-xl border border-[#fabd00]/20 hover:border-[#fabd00]/40 text-sm font-medium text-[#e3e2e2] flex items-center gap-2 transition-all bg-white/5 backdrop-blur-xl"
          >
            <GitCompareArrows className="w-4 h-4 text-[#fabd00]" />
            Ver Comparador Redesign
          </a>
        </div>
      </div>
    </section>
  );
}
