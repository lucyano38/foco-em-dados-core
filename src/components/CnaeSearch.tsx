import { useState } from 'react';

type LeadRow = {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  telefone?: string;
  email?: string;
  logradouro?: string;
  numero?: string;
  municipio?: string;
  uf?: string;
  situacao_cadastral?: number;
};

function cnaeUrl(cnae: string, uf?: string, municipio?: string) {
  const base = `https://minhareceita.org/${encodeURIComponent(cnae)}`;
  const params = new URLSearchParams();
  if (uf) params.set('uf', uf);
  if (municipio) params.set('municipio', municipio);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function mapsLink(razao_social: string, municipio?: string) {
  const termo = encodeURIComponent(`${razao_social} ${municipio || ''}`);
  return `https://www.google.com/maps/search/?api=1&query=${termo}`;
}

function linkedinLink(razao_social: string) {
  const termo = encodeURIComponent(razao_social);
  return `https://www.linkedin.com/search/results/companies/?keywords=${termo}`;
}

export default function CnaeSearch() {
  const [cnae, setCnae] = useState('');
  const [uf, setUf] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LeadRow[]>([]);

  const buscar = async () => {
    const codigo = cnae.replace(/\D/g, '');
    setError(null);
    setRows([]);

    if (!codigo) {
      setError('O campo CNAE é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const url = cnaeUrl(codigo, uf || undefined, municipio || undefined);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro na consulta ou CNAE não encontrado.');
      }

      const data = (await response.json()) as LeadRow[];

      if (!Array.isArray(data) || data.length === 0) {
        setError('Nenhuma empresa encontrada com esses filtros.');
        setLoading(false);
        return;
      }

      setRows(data);
    } catch (err: any) {
      setError(`Erro ao processar busca: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const limpar = () => {
    setCnae('');
    setUf('');
    setMunicipio('');
    setRows([]);
    setError(null);
  };

  const exportarCsv = () => {
    if (!rows.length) return;
    const header = [
      'CNPJ',
      'Razao Social',
      'Nome Fantasia',
      'Telefone',
      'Email',
      'Logradouro',
      'Municipio',
      'UF',
      'Google Maps',
      'LinkedIn',
    ];
    const lines = rows.map((r) =>
      [
        r.cnpj,
        r.razao_social,
        r.nome_fantasia || '',
        r.telefone || '',
        r.email || '',
        `${r.logradouro || ''} ${r.numero || ''}`.trim(),
        r.municipio || '',
        r.uf || '',
        mapsLink(r.razao_social, r.municipio),
        linkedinLink(r.razao_social),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-cnae-${cnae.replace(/\D/g, '')}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="busca-cnae-container">
      <h3>🎯 Painel de Prospecção B2B</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          marginBottom: 15,
        }}
      >
        <input
          type="text"
          value={cnae}
          onChange={(e) => setCnae(e.target.value)}
          placeholder="CNAE (ex: 6201501)"
        />
        <input
          type="text"
          value={uf}
          onChange={(e) => setUf(e.target.value.toUpperCase())}
          placeholder="UF (ex: SP)"
          maxLength={2}
        />
        <input
          type="text"
          value={municipio}
          onChange={(e) => setMunicipio(e.target.value)}
          placeholder="Município (ex: Itupeva)"
        />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={buscar} disabled={loading}>
          {loading ? 'Buscando...' : 'Gerar Lista de Leads'}
        </button>
        <button onClick={limpar} disabled={loading}>
          Limpar
        </button>
        <button onClick={exportarCsv} disabled={!rows.length}>
          Exportar CSV
        </button>
      </div>

      {error && <div style={{ marginTop: 20, color: 'crimson' }}>{error}</div>}
      {loading && <div style={{ marginTop: 10 }}>Cruzando dados cadastrais... Aguarde.</div>}

      {rows.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p>{rows.length} leads gerados com sucesso!</p>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: 8 }}>CNPJ</th>
                  <th style={{ border: '1px solid #ccc', padding: 8 }}>Razão Social</th>
                  <th style={{ border: '1px solid #ccc', padding: 8 }}>Telefone</th>
                  <th style={{ border: '1px solid #ccc', padding: 8 }}>E-mail</th>
                  <th style={{ border: '1px solid #ccc', padding: 8 }}>Endereço</th>
                  <th style={{ border: '1px solid #ccc', padding: 8 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((empresa, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{empresa.cnpj}</td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>
                      <b>{empresa.razao_social}</b>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>
                      {empresa.telefone || 'Não informado'}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>
                      {empresa.email || 'Não informado'}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>
                      {empresa.logradouro}, {empresa.numero || 's/n'} - {empresa.municipio}/{empresa.uf}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>
                      <a href={mapsLink(empresa.razao_social, empresa.municipio)} target="_blank" rel="noopener">
                        📍 Maps
                      </a>{' '}
                      <a href={linkedinLink(empresa.razao_social)} target="_blank" rel="noopener">
                        🔗 LinkedIn
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
