import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ atualizado_em: null, selo: 'Erro de configuração' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase
    .from('indicadores_economicos')
    .select('codigo, data, atualizado_em')
    .order('atualizado_em', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return res.status(200).json({
      atualizado_em: null,
      selo: 'Sem dados ainda',
      detalhe: error?.message,
    });
  }

  const ultimo = data[0];
  const dataHora = new Date(ultimo.atualizado_em);
  const agora = new Date();
  const diffMs = agora.getTime() - dataHora.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);

  let selo = 'Dados desatualizados';
  if (diffHoras < 1) {
    selo = `Dados atualizados hoje às ${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffHoras < 6) {
    selo = `Atualizados há ${Math.round(diffHoras)}h`;
  }

  return res.status(200).json({
    atualizado_em: ultimo.atualizado_em,
    selo,
  });
}
