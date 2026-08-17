import React, { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  address?: string;
  state?: string;
}

export const LocationSearch: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGPSClick = () => {
    setLoading(true);
    setErrorMsg('');

    if (!navigator.geolocation) {
      setErrorMsg('A geolocalização não é suportada pelo seu navegador.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `/api/leads/search?lat=${latitude}&lng=${longitude}&radius=15000&state=SP`
          );
          
          if (!response.ok) throw new Error('Falha na resposta da API');
          
          const data = await response.json();

          const leadsBrutos: Lead[] = Array.isArray(data) ? data : (data.leads || []);

          // FILTRO ESTREITO: Remove tudo que não for de SP (São Paulo)
          const leadsFiltrados = leadsBrutos.filter((lead: Lead) => {
            const local = `${lead.address || ''} ${lead.state || ''}`.toLowerCase();
            return local.includes('sp') || local.includes('são paulo') || local.includes('itupeva');
          });

          setLeads(leadsFiltrados);
        } catch (err) {
          setErrorMsg('Erro ao buscar leads para a sua localização.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMsg('Permissão de GPS negada.');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMsg('Informação de localização indisponível.');
            break;
          case error.TIMEOUT:
            setErrorMsg('A requisição para obter a localização expirou.');
            break;
          default:
            setErrorMsg('Ocorreu um erro ao obter a localização.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleGPSClick}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {loading ? 'Obtendo GPS...' : '📍 Buscar Leads Próximos (GPS)'}
      </button>

      {errorMsg && (
        <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
      )}
      
      {leads.length > 0 && (
        <ul className="text-sm text-gray-300">
          {leads.map(lead => <li key={lead.id}>{lead.name}</li>)}
        </ul>
      )}
    </div>
  );
};
