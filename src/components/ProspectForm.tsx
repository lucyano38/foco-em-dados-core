import { useState, useEffect, useCallback } from 'react';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { fetchLeadsRemote, upsertLeadsRemote, buildLocalProspectSnapshot, isSupabaseConfigured } from '../lib/prospectService';
import { useAuth } from '../contexts/AuthContext';

export function ProspectForm({ defaultCity = 'Itupeva', defaultNiche = 'Barbearia' }: { defaultCity?: string; defaultNiche?: string }) {
  const [cidade, setCidade] = useState(defaultCity);
  const [nicho, setNicho] = useState(defaultNiche);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace('/login');
    }
  }, [authLoading, user]);

  const handleProspectar = useCallback(async () => {
    if (!user) {
      window.location.replace('/login');
      return;
    }

    setLoading(true);
    setFeedback('');
    try {
      let result = await fetchLeadsRemote(200);
      let insertedCount = 0;

      if (result.success && result.count > 0) {
        const withNovo = result.leads.map((lead) => ({
          ...lead,
          status: 'novo',
        }));
        const up = await upsertLeadsRemote(withNovo);
        insertedCount = up.count;
        setFeedback(`CRM atualizado: ${insertedCount} leads`);
        console.log(`CRM atualizado: ${insertedCount} leads`);
      } else {
        const snapshot = buildLocalProspectSnapshot(cidade, nicho, 5);
        const up = await upsertLeadsRemote(snapshot.leads);
        insertedCount = up.count;
        setFeedback(`CRM atualizado: ${insertedCount} leads`);
        console.log(`CRM atualizado: ${insertedCount} leads`);
      }
    } catch (err: any) {
      setFeedback(`Falha na prospecção: ${err?.message || 'Erro inesperado.'}`);
      console.error('[ProspectForm] erro:', err);
    } finally {
      setLoading(false);
    }
  }, [cidade, nicho, user]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="w-1/2 p-3 bg-slate-800 border border-slate-700 rounded text-white"
          placeholder="Cidade"
        />
        <input
          value={nicho}
          onChange={(e) => setNicho(e.target.value)}
          className="w-1/2 p-3 bg-slate-800 border border-slate-700 rounded text-white"
          placeholder="Nicho"
        />
      </div>

      <button
        onClick={handleProspectar}
        disabled={loading}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 font-bold text-black rounded transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Buscando e Integrando ao CRM...
          </>
        ) : (
          <>
            Prospectar
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {feedback && <p className="text-sm text-amber-400 mt-2">{feedback}</p>}
    </div>
  );
}

export const handleScroll = (id: string) => {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.location.href = `/#${id}`;
  }
};
