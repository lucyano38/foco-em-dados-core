import { useState } from 'react';

export default function CnaeSearch() {
  const [cnae, setCnae] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<{ cnpj: string; razao_social: string; uf: string; situacao_cadastral: number }>>([]);

  const buscarPorCnae = async () => {
    const codigo = cnae.replace(/\D/g, '');
    setError(null);
    setRows([]);

    if (!codigo) {
      setError('Por favor, insira um código CNAE válido.');
      return;
    }

    setLoading(true);
    try {
      const url = `https://minhareceita.org/${codigo}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro na consulta ou CNAE não encontrado.');
      }

      const empresas = await response.json();

      if (!Array.isArray(empresas) || empresas.length === 0) {
        setError('Nenhuma empresa encontrada para este CNAE.');
        setLoading(false);
        return;
      }

      setRows(empresas);
    } catch (err: any) {
      setError(`Erro ao processar busca: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="busca-cnae-container">
      <h3>Buscar Empresas por CNAE</h3>
      <input
        type="text"
        value={cnae}
        onChange={(e) => setCnae(e.target.value)}
        placeholder="Digite apenas os números do CNAE (ex: 6201501)"
      />
      <button onClick={buscarPorCnae} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar Empresas'}
      </button>

      {loading && <div style={{ marginTop: 10 }}>Buscando empresas... Por favor, aguarde.</div>}
      {error && <div style={{ marginTop: 20, color: 'crimson' }}>{error}</div>}

      {rows.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>CNPJ</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Razão Social</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>UF</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((empresa, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{empresa.cnpj}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{empresa.razao_social}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{empresa.uf}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>
                    {empresa.situacao_cadastral === 2 ? 'Ativa' : 'Inativa'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
