/**
 * Integração WAHA Plus + n8n + Supabase.
 *
 * Roda tanto no browser quanto no Node (server.ts). Não importa o cliente
 * Supabase (src/lib/supabase utiliza import.meta.env — incompatível com o
 * bundle CJS do servidor); a persistência usa a REST API (PostgREST) via
 * fetch, apontando estritamente para https://ioijbixifvbosythznhh.supabase.co
 */

export interface WahaContact {
  chatId: string
  phone: string
  name?: string
  message?: string
  timestamp?: number
}

export interface WahaMessage {
  chatId: string
  from: string
  phone: string
  text: string
  name?: string
  isFromMe: boolean
  timestamp: number
  mediaUrl?: string
}

export interface N8nProspect {
  name?: string
  phone?: string
  email?: string
  notes?: string
  status?: string
  source?: string
  city?: string
}

function env(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) return process.env[name]
  return undefined
}

export const STRICT_SUPABASE_URL = 'https://ioijbixifvbosythznhh.supabase.co'

export function getSupabaseUrl(): string {
  return env('SUPABASE_URL') || STRICT_SUPABASE_URL
}

export function getSupabaseKey(): string {
  return (
    env('SUPABASE_SERVICE_ROLE_KEY') ||
    env('SUPABASE_ANON_KEY') ||
    env('VITE_SUPABASE_ANON_KEY') ||
    ''
  )
}

export function getConfig(): { apiUrl?: string; apiToken?: string; session: string; supabaseUrl: string; supabaseKey: string } {
  return {
    apiUrl: env('WAHA_API_URL'),
    apiToken: env('WAHA_API_KEY') || env('WAHA_API_TOKEN'),
    session: env('WAHA_SESSION') || 'default',
    supabaseUrl: getSupabaseUrl(),
    supabaseKey: getSupabaseKey(),
  }
}

export function extractPhone(raw: string | null | undefined): string {
  return String(raw || '').replace(/[^\d]/g, '').replace(/^(?:55)?0?/, '')
}

export function normalizeChatId(phone: string): string {
  const digits = extractPhone(phone)
  if (!digits) return ''
  return `${digits}@c.us`
}

// Normaliza payloads do WAHA Plus (formato oficial e variantes do n8n)
export function normalizeWahaEvent(body: any): WahaMessage | null {
  if (!body || typeof body !== 'object') return null
  const payload = body.payload && typeof body.payload === 'object' ? body.payload : body
  const eventName = String(body.event || payload.event || body.type || payload.type || '')
  if (eventName && !/message|messaging|chat/i.test(eventName)) return null

  const chatId = String(payload.chatId || payload.from || payload.chat?.id || '')
  const from = String(payload.from || payload.chatId || payload.chat?.id || payload.sender?.id || '')
  if (!from || from.toLowerCase().includes('status@broadcast')) return null

  const isFromMe = Boolean(payload.fromMe ?? payload.from_me ?? body.fromMe ?? body.isFromMe)
  const text = String(
    payload.text || payload.message?.text || payload.message || payload.body?.text ||
    payload.body?.caption || payload.body || body.text || body.message || ''
  ).trim()
  const mediaUrl = String(
    payload.mediaUrl || payload.body?.media?.link || payload.body?.mediaUrl || ''
  ) || undefined

  const name = String(payload.chat?.pushname || payload.chat?.name || payload.pushname ||
    payload.contactName || (typeof payload.sender?.name === 'string' ? payload.sender.name : '') || '')

  const timestamp = Number(payload.timestamp || payload.time || Date.now())

  return { chatId, from, phone: extractPhone(from), text, name, isFromMe, timestamp, mediaUrl }
}

interface SupabaseResult<T> {
  data: T | null
  error: { message: string } | null
}

function restHeaders(): Record<string, string> {
  const { supabaseUrl, supabaseKey } = getConfig()
  void supabaseUrl
  return {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: 'return=representation',
  }
}

async function supabaseRpc<T = any>(method: 'GET' | 'POST' | 'PATCH', table: string, body?: any, query = ''): Promise<SupabaseResult<T>> {
  const { supabaseUrl, supabaseKey } = getConfig()
  if (!supabaseKey) return { data: null, error: { message: 'Chave do Supabase não configurada.' } }
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}${query}`, {
      method,
      headers: restHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { data: null, error: { message: `HTTP ${res.status} ${detail.slice(0, 200)}` } }
    }
    const data = (await res.json().catch(() => null)) as T | null
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Falha de rede no Supabase' } }
  }
}

// Salva/atualiza um lead na tabela `leads` do Supabase (por telefone)
export async function upsertLeadByPhone(lead: {
  name?: string
  phone?: string
  email?: string
  notes?: string
  status?: string
  source?: string
  city?: string
  value?: number
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const phone = lead.phone ? extractPhone(lead.phone) : ''
  if (!phone) return { ok: false, error: 'Telefone ausente' }
  if (!getSupabaseKey()) return { ok: true, id: undefined }

  const { data: existing, error: listErr } = await supabaseRpc<any[]>(
    'GET', 'leads', undefined, `?phone=eq.${phone}&select=id,notes,status&limit=1`
  )
  if (listErr) return { ok: false, error: listErr.message }

  const payload: any = {
    phone,
    name: lead.name || 'Lead sem nome',
    email: lead.email || null,
    notes: [lead.notes, existing?.[0]?.notes].filter(Boolean).join(' | ') || null,
    status: lead.status || existing?.[0]?.status || 'prospeccao',
    source: lead.source || 'WAHA',
    city: lead.city || null,
    value: lead.value || null,
  }

  if (existing && existing.length > 0) {
    const { error } = await supabaseRpc('PATCH', 'leads', payload, `?id=eq.${existing[0].id}`)
    return error ? { ok: false, error: error.message } : { ok: true, id: existing[0].id }
  }
  const { data, error } = await supabaseRpc<any[]>('POST', 'leads', payload)
  return error ? { ok: false, error: error.message } : { ok: true, id: data?.[0]?.id }
}

// Envia uma mensagem de texto via WAHA Plus API
export async function sendWahaText(message: {
  chatId?: string
  phone?: string
  text: string
}): Promise<{ sent: boolean; detail?: string }> {
  const cfg = getConfig()
  if (!cfg.apiUrl) return { sent: false, detail: 'WAHA_API_URL não configurada' }

  const chatId = message.chatId || normalizeChatId(message.phone || '')
  if (!chatId) return { sent: false, detail: 'Destinatário inválido' }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (cfg.apiToken) headers['X-Api-Key'] = cfg.apiToken

    const res = await fetch(`${cfg.apiUrl.replace(/\/$/, '')}/api/sendText?session=${encodeURIComponent(cfg.session || 'default')}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ chatId, text: message.text }),
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) return { sent: true }
    const detail = await res.text().catch(() => '')
    return { sent: false, detail: `HTTP ${res.status} ${detail.slice(0, 200)}` }
  } catch (err: any) {
    return { sent: false, detail: err.message || 'Falha de rede' }
  }
}

// Gera a mensagem de proposta automatizada com link do mockup (Hermes)
export function buildProposalMessage(params: {
  leadName: string
  mockupUrl?: string
  offer?: string
}): string {
  const lead = params.leadName || 'empresa'
  const offer = params.offer || 'site profissional + WhatsApp integrado + dashboard de BI'
  const link = params.mockupUrl
    ? `\n\n▶ Veja o mockup do seu novo site aqui: ${params.mockupUrl}`
    : ''
  return `Olá, ${lead}! Tudo bem?\n\nSomos da Foco em Dados e notamos que sua empresa pode crescer muito com presença digital. Preparamos uma proposta especial com ${offer}.${link}\n\nQuer que eu te explique os detalhes?`
}

// Processa um webhook recebido do WAHA Plus (ou repassado pelo n8n)
export async function handleWahaWebhook(body: any): Promise<{
  received: boolean
  type: string
  message?: WahaMessage
  lead?: { ok: boolean; id?: string; error?: string }
  sent?: boolean
  detail?: string
}> {
  const message = normalizeWahaEvent(body)
  if (!message) return { received: true, type: 'unsupported' }
  if (message.isFromMe) return { received: true, type: 'outgoing', message }

  const lead = await upsertLeadByPhone({
    name: message.name || message.text.slice(0, 60) || undefined,
    phone: message.phone,
    notes: `Mensagem recebida: ${message.text.slice(0, 300)}`,
    source: 'WAHA · WhatsApp'
  })

  let sent: boolean | undefined
  if (lead.ok) {
    const reply = await sendWahaText({
      phone: message.phone,
      text: buildProposalMessage({ leadName: message.name || 'empresa' }),
    })
    sent = reply.sent
  }

  return { received: true, type: 'incoming', message, lead, sent }
}

// Processa um lote de prospecções vindas do n8n
export async function processN8nProspects(prospects: N8nProspect[]): Promise<{
  received: number
  created: number
  failed: number
  leads: { ok: boolean; phone?: string; id?: string; error?: string }[]
}> {
  const arr = Array.isArray(prospects) ? prospects : []
  const results: { ok: boolean; phone?: string; id?: string; error?: string }[] = []
  let created = 0
  let failed = 0
  for (const p of arr) {
    const res = await upsertLeadByPhone({
      name: p.name,
      phone: p.phone,
      email: p.email,
      notes: p.notes,
      status: p.status || 'prospeccao',
      source: p.source || 'n8n · Hermes',
      city: p.city,
    })
    if (res.ok) created += 1
    else failed += 1
    results.push({ ...res, phone: p.phone })
  }
  return { received: arr.length, created, failed, leads: results }
}

// Status de integração (não expõe chaves)
export function getWahaStatus(): {
  wahaConfigured: boolean
  supabaseConfigured: boolean
  supabaseUrl: string
} {
  const cfg = getConfig()
  return {
    wahaConfigured: Boolean(cfg.apiUrl),
    supabaseConfigured: Boolean(cfg.supabaseKey && cfg.supabaseUrl),
    supabaseUrl: cfg.supabaseUrl,
  }
}