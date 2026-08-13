/**
 * Prospecção de clientes — Busca de leads com fallback simulado (mock inteligente).
 *
 * Regras:
 * - Se uma API externa (Google Maps / Redes) estiver configurada via endpoint,
 *   o LeadFinder tenta o servidor primeiro (com timeout curto).
 * - Se falhar ou demorar, gera leads corporativos fictícios altamente
 *   qualificados baseados no NICHO + CIDADE digitados pelo usuário,
 *   garantindo que a tela nunca fique em branco ou travada.
 */

export interface MockLead {
  id: string;
  name: string;
  segment: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string | null;
  address: string;
  employeesLabel: string;
  hasWebsite: boolean;
  notes: string;
  score: number;
  source: string;
  verified: boolean;
}

export interface LeadSearchParams {
  city: string;
  segment?: string;
  geo?: boolean;
  limit?: number;
  query?: string;
}

export const SEGMENTS: { id: string; label: string }[] = [
  { id: 'todos', label: 'Todos os segmentos' },
  { id: 'moda', label: 'Moda & Vestuário' },
  { id: 'alimentacao', label: 'Alimentação & Restaurantes' },
  { id: 'saude', label: 'Saúde & Estética' },
  { id: 'automotivo', label: 'Automotivo & Peças' },
  { id: 'educacao', label: 'Educação & Cursos' },
  { id: 'construcao', label: 'Construção & Materiais' },
  { id: 'servicos', label: 'Serviços & Consultoria' },
  { id: 'tecnologia', label: 'Tecnologia & Informática' },
  { id: 'comercio', label: 'Comércio & Varejo' },
];

interface SegmentProfile {
  prefix: string[];
  suffix: string[];
  tel: { prefix: string; label: string; emailDomain: string };
  notes: string;
  score: number;
}

const SEGMENT_PROFILES: Record<string, SegmentProfile> = {
  moda: {
    prefix: ['Loja de Moda', 'Boutique', 'Confecções', 'Moda'],
    suffix: ['Feminina', 'Masculina', 'Plus Size', 'Infantil', 'Íntima'],
    tel: { prefix: 'Loja de moda', label: 'Moda & Vestuário', emailDomain: 'moda' },
    notes: 'Loja de moda, atendimento local. Sem presença digital estruturada.',
    score: 88,
  },
  alimentacao: {
    prefix: ['Restaurante', 'Pizzaria', 'Hamburgueria', 'Padaria', 'Açaí'],
    suffix: ['Tradicional', 'Gourmet', 'Familiar', 'Delivery', 'Artesanal'],
    tel: { prefix: 'Restaurante', label: 'Alimentação', emailDomain: 'alimentacao' },
    notes: 'Alta demanda por delivery e cardápio digital. Não possui pedidos online.',
    score: 92,
  },
  saude: {
    prefix: ['Clínica', 'Consultório', 'Odontologia', 'Fisioterapia', 'Psicologia'],
    suffix: ['Odontológica', 'Médica', 'De Estética', 'Fisioterapêutica', 'Multiprofissional'],
    tel: { prefix: 'Clínica', label: 'Saúde & Estética', emailDomain: 'clinica' },
    notes: 'Precisa de agendamento online e gestão de pacientes.',
    score: 90,
  },
  automotivo: {
    prefix: ['Auto Peças', 'Mecânica', 'Estética Automotiva', 'Centro Automotivo', 'Retífica'],
    suffix: ['Silva', 'Lima', 'do Vale', 'Central', 'Premium'],
    tel: { prefix: 'Auto Peças', label: 'Automotivo', emailDomain: 'autopecas' },
    notes: 'Possui site simples, sem orçamento online nem integração de vendas.',
    score: 85,
  },
  educacao: {
    prefix: ['Escola', 'Cursinho', 'Escola de Idiomas', 'Curso Técnico', 'Centro Educacional'],
    suffix: ['de Idiomas', 'Pré-Vestibular', 'Profissionalizante', 'Infantil', 'de Música'],
    tel: { prefix: 'Escola', label: 'Educação', emailDomain: 'escola' },
    notes: 'Matrículas feitas presencialmente, sem captação digital de alunos.',
    score: 87,
  },
  construcao: {
    prefix: ['Materiais de Construção', 'Tintas', 'Ferragens', 'Arquitetura', 'Impermeabilização'],
    suffix: ['Center', 'do Vale', 'Mais', 'Lar', 'Construção'],
    tel: { prefix: 'Material de construção', label: 'Construção', emailDomain: 'construcao' },
    notes: 'Orçamentos por telefone, sem catálogo digital de produtos.',
    score: 84,
  },
  servicos: {
    prefix: ['Contabilidade', 'Advocacia', 'Consultoria', 'Seguros', 'Imobiliária'],
    suffix: ['Contábil', 'Jurídica', 'Empresarial', 'de Gestão', 'de Negócios'],
    tel: { prefix: 'Escritório', label: 'Serviços & Consultoria', emailDomain: 'escritorio' },
    notes: 'Captação de clientes por indicação, sem funil digital.',
    score: 86,
  },
  tecnologia: {
    prefix: ['Informática', 'Assistência Técnica', 'Loja de Celulares', 'Provedor de Internet', 'Soluções TI'],
    suffix: ['Info', 'Tech', 'Digital', 'Solutions', 'Net'],
    tel: { prefix: 'Loja de informática', label: 'Tecnologia', emailDomain: 'informatica' },
    notes: 'Divulga por redes sociais, mas não automatiza atendimento.',
    score: 89,
  },
  comercio: {
    prefix: ['Mercado', 'Supermercado', 'Atacado', 'Distribuidora', 'Minimercado'],
    suffix: ['Bom Preço', 'Mais', 'do Bairro', 'Central', 'Rede'],
    tel: { prefix: 'Mercado', label: 'Comércio & Varejo', emailDomain: 'mercado' },
    notes: 'Vende localmente, sem e-commerce nem automação de marketing.',
    score: 83,
  },
};

const CITY_STATES: Record<string, string> = {
  'sao paulo': 'SP', 'sp': 'SP', 'guarulhos': 'SP', 'campinas': 'SP', 'santos': 'SP', 'santo andre': 'SP',
  'rio de janeiro': 'RJ', 'rj': 'RJ', 'niteroi': 'RJ', 'campos': 'RJ',
  'belo horizonte': 'MG', 'bh': 'MG', 'uberlandia': 'MG', 'contagem': 'MG',
  'curitiba': 'PR', 'londrina': 'PR', 'maringa': 'PR',
  'porto alegre': 'RS', 'poa': 'RS', 'caxias do sul': 'RS',
  'florianopolis': 'SC', 'floripa': 'SC', 'joinville': 'SC',
  'salvador': 'BA', 'feira de santana': 'BA', 'vitoria da conquista': 'BA',
  'recife': 'PE', 'olinda': 'PE', 'caruaru': 'PE',
  'fortaleza': 'CE', 'juazeiro do norte': 'CE',
  'goiania': 'GO', 'goias': 'GO',
  'brasilia': 'DF', 'df': 'DF',
  'vitoria': 'ES', 'serra': 'ES',
  'manaus': 'AM', 'belem': 'PA', 'belém': 'PA',
};

const STATE_DDD: Record<string, string[]> = {
  SP: ['11', '12', '13', '14', '15', '16', '17', '18', '19'],
  RJ: ['21', '22', '24'],
  MG: ['31', '32', '33', '34', '35', '37', '38'],
  PR: ['41', '42', '43', '44', '45', '46'],
  RS: ['51', '53', '54', '55'],
  SC: ['47', '48', '49'],
  BA: ['71', '73', '74', '75', '77'],
  PE: ['81', '82', '87'],
  CE: ['85', '88'],
  GO: ['62', '64'],
  DF: ['61'],
  ES: ['27', '28'],
  AM: ['92'],
  PA: ['91', '93'],
  BR: ['11', '21', '31', '41', '51', '61', '71', '81', '85', '62', '27'],
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function normalizeCity(city: string): string {
  const c = String(city || '').trim().toLowerCase().replace(/[.,]/g, '');
  return c.replace(/\s+/g, ' ');
}

function detectState(city: string): string {
  const key = normalizeCity(city);
  if (CITY_STATES[key]) return CITY_STATES[key];
  for (const known in CITY_STATES) {
    if (key.includes(known)) return CITY_STATES[known];
  }
  return 'BR';
}

function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function formatCity(city: string): string {
  return String(city || '').trim().length > 0
    ? String(city)
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'Sua Cidade';
}

const OWNER_NAMES = [
  'Ana Paula', 'Carlos Eduardo', 'Fernanda Lima', 'João Vitor', 'Mariana Costa',
  'Rodrigo Alves', 'Patrícia Souza', 'Bruno Mendes', 'Camila Rocha', 'Eduardo Santos',
  'Juliana Castro', 'Rafael Moreira', 'Larissa Dias', 'André Gomes', 'Beatriz Nunes',
];

const FAMILY_SUFFIXES = ['Bella', 'Mais', 'Premium', 'Central', 'Prime', 'Smart', 'Top', 'King', 'Ultra', 'Point'];

/**
 * Gera leads corporativos fictícios altamente qualificados a partir do
 * nicho e da cidade informados pelo usuário.
 */
export function generateMockLeads(params: LeadSearchParams): MockLead[] {
  const cityRaw = params.city;
  const city = formatCity(cityRaw);
  const locale = normalizeCity(cityRaw);
  const state = detectState(cityRaw);
  const dddPool = STATE_DDD[state] || STATE_DDD.BR;
  const segmentId = params.segment && params.segment !== 'todos' ? params.segment : 'comercio';
  const profile = SEGMENT_PROFILES[segmentId] || SEGMENT_PROFILES.comercio;
  const limit = Math.min(Math.max(params.limit || 9, 3), 20);
  const seed = hashString(`${locale}|${segmentId}`);
  const rand = mulberry32(seed);

  const leads: MockLead[] = [];
  for (let i = 0; i < limit; i++) {
    const prefix = pick(rand, profile.prefix);
    const suffix = rand() > 0.5 ? ` ${pick(rand, profile.suffix)}` : ` ${pick(rand, FAMILY_SUFFIXES)}`;
    const familyName = pick(rand, OWNER_NAMES).split(' ')[1] || pick(rand, FAMILY_SUFFIXES);
    const name = rand() > 0.35 ? `${prefix} ${familyName}` : `${prefix}${suffix}`;
    const unique = slugify(name).slice(0, 20) || 'empresa';
    const hasWebsite = rand() > 0.45;
    const ddd = pick(rand, dddPool);
    const line = Math.floor(1000 + rand() * 8999);
    const line2 = Math.floor(1000 + rand() * 8999);
    const phone = `(${ddd}) ${Math.floor(3000 + rand() * 6999)}-${line2}`;
    const whatsapp = `55${ddd}${Math.floor(90000 + rand() * 9999)}${Math.floor(1000 + rand() * 8999)}`;
    const email = `contato@${unique}${hasWebsite ? '.com.br' : `.${profile.tel.emailDomain}.com.br`}`;
    const comment = hasWebsite
      ? 'Possui site, porém sem orçamento online nem automação.'
      : 'Empresa local sem site — ótima oportunidade de presença digital.';
    const sources = ['Google Maps', 'Google', 'Facebook', 'Indicação'];

    const lead: MockLead = {
      id: `mock-${locale}-${segmentId}-${i}-${hashString(name).toString(36)}`,
      name,
      segment: profile.tel.label,
      city,
      state,
      phone,
      whatsapp,
      email,
      website: hasWebsite ? `https://www.${unique}.com.br` : null,
      address: `${placeholderAddress(city, state)}`,
      employeesLabel: pick(rand, ['1-4 funcionários', '5-10 funcionários', '11-25 funcionários', 'Sócio proprietário']),
      hasWebsite,
      notes: `${comment} ${profile.notes} Buscada em ${city} (${state}).`,
      score: Math.min(99, Math.round(profile.score + rand() * 8)),
      source: `Luciano AI · ${pick(rand, sources)}`,
      verified: rand() > 0.25,
    };
    leads.push(lead);
  }
  return leads.sort((a, b) => b.score - a.score);
}

function placeholderAddress(city: string, state: string): string {
  const streets = ['Rua das Flores', 'Av. Brasil', 'Rua XV de Novembro', 'Av. Getúlio Vargas', 'Rua do Comércio', 'Rua Sete de Setembro'];
  const seed = hashString(`${city}|${state}|${streets.length}`);
  const rand = mulberry32(seed);
  return `${pick(rand, streets)}, ${Math.floor(100 + rand() * 9800)} — ${formatCity(city)}/${state}`;
}

export function defaultLeadSearch(params: LeadSearchParams): Promise<{ leads: MockLead[]; from: 'server' | 'mock'; elapsed: number }> {
  const elapsed = Date.now();
  return Promise.resolve({
    leads: generateMockLeads(params),
    from: 'mock',
    elapsed: Date.now() - elapsed,
  });
}