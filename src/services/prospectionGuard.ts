import { supabase } from '../lib/supabase';

// Geofiltro estrito para Itupeva/SP
export async function searchLeads(city = 'Itupeva', uf = 'SP') {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('city', city)
    .eq('uf', uf)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export const formatPhoneToInternational = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 10) return `+55${digits.slice(0, 2)}9${digits.slice(2)}`;
  return `+55${digits}`;
};
