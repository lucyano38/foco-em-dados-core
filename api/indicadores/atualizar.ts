import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[indicadores] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

type SerieBCB = { data: string; valor: string };

const SERIES: Record<string, { codigo: string; nome: string }> = {
  selic: { codigo: '11', nome: 'SELIC' },
  ipca: { codigo: '433', nome: 'IPCA' },
  dolar: { codigo: '1', nome: 'DOLAR' },
};

async function fetchSerie(codigo: string): Promise<SerieBCB[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/10?formato=json`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`BCB ${codigo} HTTP ${res.status}`);
  return res.json();
}

async function atualizar() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Env do Supabase não configurado.');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const resultados: Record<string, { linhas: number; erro?: string }> = {};

  for (const [chave, serie] of Object.entries(SERIES)) {
    try {
      const dados = await fetchSerie(serie.codigo);
      const linhas = dados.map((item) => ({
        codigo: serie.nome,
        data: item.data,
        valor: Number(item.valor.replace(',', '.')),
      }));

      const { error } = await supabase
        .from('indicadores_economicos')
        .upsert(linhas, { onConflict: 'codigo,data' });

      if (error) throw error;
      resultados[chave] = { linhas: linhas.length };
    } catch (err: any) {
      resultados[chave] = { linhas: 0, erro: err.message };
      console.error(`[indicadores] Falha em ${serie.nome}:`, err);
    }
  }

  return { atualizadoEm: new Date().toISOString(), resultados };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST para disparar manualmente.' });
  }

  try {
    const payload = await atualizar();
    return res.status(200).json(payload);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao atualizar indicadores.' });
  }
}
