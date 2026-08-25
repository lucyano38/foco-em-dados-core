import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type LeadRecord = {
  id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  notes?: string | null;
  value?: number | null;
  url_preview?: string | null;
  mrr_manutencao?: number | null;
  cidade?: string | null;
  nicho?: string | null;
};

export type ProspectResult = {
  success: boolean;
  count: number;
  leads: Array<LeadRecord & { id?: string | null }>;
  source: 'supabase' | 'local';
  message?: string;
};

let cachedClient: SupabaseClient | null = null;
let cachedLocalClient: SupabaseClient | null = null;

function resolveEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    '';

  return { url, anon, serviceRole };
}

export function getSupabaseServiceClient(): SupabaseClient | null {
  const { url, serviceRole } = resolveEnv();
  if (!url || !serviceRole) return null;
  if (!cachedLocalClient) cachedLocalClient = createClient(url, serviceRole);
  return cachedLocalClient;
}

export function getSupabasePublicClient(): SupabaseClient | null {
  const { url, anon } = resolveEnv();
  if (!url || !anon) return null;
  if (!cachedClient) cachedClient = createClient(url, anon);
  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseServiceClient());
}

export async function fetchLeadsRemote(limit = 200): Promise<ProspectResult> {
  const service = getSupabaseServiceClient();
  if (!service) {
    return { success: false, count: 0, leads: [], source: 'local', message: 'Supabase não configurado.' };
  }

  let attempt = 0;
  while (attempt < 2) {
    attempt += 1;
    const { data, error } = await service
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (attempt === 1) continue;
      return { success: false, count: 0, leads: [], source: 'local', message: error.message };
    }

    const leads = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      status: row.status ?? null,
      notes: row.notes ?? null,
      value: row.valor ?? row.value ?? null,
      url_preview: row.url_preview ?? null,
      mrr_manutencao: row.mrr_manutencao ?? null,
      cidade: row.cidade ?? null,
      nicho: row.nicho ?? null,
    }));

    return { success: true, count: leads.length, leads, source: 'supabase' };
  }

  return { success: false, count: 0, leads: [], source: 'local', message: 'Falha ao buscar leads.' };
}

export async function upsertLeadsRemote(leads: LeadRecord[]): Promise<ProspectResult> {
  const service = getSupabaseServiceClient();
  if (!service || leads.length === 0) {
    return { success: false, count: 0, leads, source: 'local', message: 'Supabase não configurado.' };
  }

  const payload = leads.map((lead) => ({
    name: lead.name,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    status: lead.status ?? 'novo',
    notes: lead.notes ?? null,
    valor: lead.value ?? null,
    url_preview: lead.url_preview ?? null,
    mrr_manutencao: lead.mrr_manutencao ?? null,
    cidade: lead.cidade ?? null,
    nicho: lead.nicho ?? null,
  }));

  const { data, error } = await service
    .from('leads')
    .upsert(payload, { onConflict: 'id' })
    .select('*');

  if (error) {
    return { success: false, count: 0, leads, source: 'local', message: error.message };
  }

  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email ?? null,
    phone: row.phone ?? null,
    status: row.status ?? null,
    notes: row.notes ?? null,
    value: row.valor ?? row.value ?? null,
    url_preview: row.url_preview ?? null,
    mrr_manutencao: row.mrr_manutencao ?? null,
    cidade: row.cidade ?? null,
    nicho: row.nicho ?? null,
  }));

  return { success: true, count: mapped.length, leads: mapped, source: 'supabase' };
}

export function buildLocalProspectSnapshot(city: string, nicho: string, limit = 5): ProspectResult {
  const leads: LeadRecord[] = [];
  const safeLimit = Math.max(1, Math.min(limit, 50));

  for (let i = 0; i < safeLimit; i++) {
    leads.push({
      id: `local-${Date.now()}-${i}`,
      name: `${nicho || 'Lead'} ${city || 'Local'} ${i + 1}`,
      cidade: city || null,
      nicho: nicho || null,
      status: 'novo',
      notes: 'Fallback local gerado automaticamente quando o Supabase está indisponível.',
      url_preview: null,
      mrr_manutencao: null,
    });
  }

  return { success: true, count: leads.length, leads, source: 'local' };
}
