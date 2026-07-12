import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 flex items-center justify-center">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10" />

      <div className="text-center px-4 max-w-lg">
        <div className="text-[120px] font-black bg-gradient-to-b from-slate-800 to-slate-950 bg-clip-text text-transparent leading-none mb-4 select-none">
          404
        </div>

        <h1 className="text-2xl font-black text-slate-100 mb-2">
          Página não encontrada
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          A página que você está procurando pode ter sido removida, 
          renomeada ou está temporariamente indisponível.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 h-12 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/25 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Voltar para o Início
          </button>
        </div>
      </div>
    </div>
  );
}
