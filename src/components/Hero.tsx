import { Link } from 'react-router-dom';
import { Sparkles, Rocket, ArrowDown, BarChart3 } from 'lucide-react';
import FloatingWords from './FloatingWords';
import { Button } from './ui/Button';

export default function Hero() {
  return (
    <section
      className="relative pt-36 pb-32 px-4 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 30%, rgba(250, 189, 0, 0.16) 0%, rgba(82, 3, 213, 0.18) 45%, #121414 100%)',
      }}
    >
      {/* Nuvem de palavras flutuantes interativas */}
      <FloatingWords />

      {/* Halos de luz âmbar/roxo */}
      <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-[#fabd00]/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#5203d5]/20 blur-[120px]" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fabd00]/10 border border-[#fabd00]/30 text-[#ffe4af] text-xs font-semibold mb-6 glassmorphism">
          <Sparkles className="w-3.5 h-3.5 text-[#fabd00]" />
          Automação, Sites e BI impulsionados por IA — 24/7
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          <span className="text-glow">Painel Central</span>
          <br />
          <span className="bg-gradient-to-r from-[#fabd00] via-[#ffc107] to-[#cdbdff] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(250,189,0,0.35)]">
            Foco Completo
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-[#d4c5ab] max-w-2xl mx-auto leading-relaxed">
          Automação com IA, prospecção ativa, sites de alta conversão e BI em um
          único painel. Sua esteira de descoberta de clientes até o fechamento
          pronta para rodar em minutos.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="h-12 px-8 text-sm">
            <Link to="/login">
              <Rocket className="w-4 h-4" />
              Começar de Graça
            </Link>
          </Button>
          <a
            href="#demo"
            className="h-12 px-8 rounded-xl border border-[#fabd00]/20 hover:border-[#fabd00]/40 text-sm font-medium text-[#e3e2e2] flex items-center gap-2 transition-all bg-white/5 backdrop-blur-xl"
          >
            <BarChart3 className="w-4 h-4 text-[#fabd00]" />
            Ver Demonstração
          </a>
        </div>

        <a
          href="#pilares"
          className="inline-flex items-center gap-2 mt-12 text-xs text-[#d4c5ab]/50 hover:text-[#ffe4af] transition-colors"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          Explorar soluções
        </a>
      </div>
    </section>
  );
}
