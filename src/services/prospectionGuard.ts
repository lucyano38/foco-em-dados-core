const DAILY_LIMIT = Math.max(1, parseInt(process.env.DAILY_PROSPECTION_LIMIT || "5", 10));
const LIMIT_MESSAGE = `Limite diário de prospecção atingido (máximo de ${DAILY_LIMIT} envios/dia). Tente novamente amanhã.`;
const CHATBOT_API_URL = process.env.CHATBOT_API_URL || "https://chatbot-v2-240342026700.us-central1.run.app";

interface CounterEntry {
  date: string;
  count: number;
}

const counters = new Map<string, CounterEntry>();

export class ProspectionLimitError extends Error {
  public remaining: number;
  constructor(message: string, remaining: number) {
    super(message);
    this.name = "ProspectionLimitError";
    this.remaining = remaining;
  }
}

export function getDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pruneStale(now = new Date()): void {
  const today = getDayKey(now);
  for (const [key, entry] of counters) {
    if (entry.date !== today) counters.delete(key);
  }
}

export function getProspectionStatus(key: string, now = new Date()): { key: string; used: number; limit: number; remaining: number; resetDate: string } {
  pruneStale(now);
  const today = getDayKey(now);
  const entry = counters.get(key);
  const used = entry && entry.date === today ? entry.count : 0;
  return { key, used, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used), resetDate: today };
}

export function assertProspectionQuota(key: string, now = new Date()): { used: number; remaining: number } {
  const status = getProspectionStatus(key, now);
  if (status.used >= DAILY_LIMIT) {
    throw new ProspectionLimitError(LIMIT_MESSAGE, 0);
  }
  return { used: status.used, remaining: status.remaining };
}

export function registerProspection(key: string, now = new Date()): { used: number; remaining: number } {
  pruneStale(now);
  const today = getDayKey(now);
  const entry = counters.get(key) || { date: today, count: 0 };
  if (entry.date !== today) {
    entry.date = today;
    entry.count = 0;
  }
  entry.count += 1;
  counters.set(key, entry);
  return { used: entry.count, remaining: Math.max(0, DAILY_LIMIT - entry.count) };
}

export function resetProspectionCounter(key: string): void {
  counters.delete(key);
}

export async function sendWhatsApp(to: string, text: string): Promise<{ sent: boolean; channel: string; detail?: string }> {
  try {
    const res = await fetch(`${CHATBOT_API_URL}/api/whatsapp/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message: text }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { sent: true, channel: "whatsapp" };
    return { sent: false, channel: "whatsapp", detail: `HTTP ${res.status}` };
  } catch (err: any) {
    console.error("[prospectionGuard] Falha ao enviar WhatsApp:", err);
    return { sent: false, channel: "whatsapp", detail: err.message };
  }
}

export async function sendEmail(to: string, subject: string, text: string): Promise<{ sent: boolean; channel: string; detail?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, channel: "email", detail: "RESEND_API_KEY não configurada" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: "Foco em Dados <contato@focoemdados.com.br>", to, subject, text }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { sent: true, channel: "email" };
    return { sent: false, channel: "email", detail: `HTTP ${res.status}` };
  } catch (err: any) {
    console.error("[prospectionGuard] Falha ao enviar e-mail:", err);
    return { sent: false, channel: "email", detail: err.message };
  }
}

export interface ProspectionMessage {
  key: string;
  channel?: "whatsapp" | "email";
  to: string;
  text: string;
  subject?: string;
}

export async function sendProspectionMessage(msg: ProspectionMessage): Promise<{
  sent: boolean;
  channel: string;
  used: number;
  remaining: number;
  detail?: string;
}> {
  assertProspectionQuota(msg.key);

  const channel = msg.channel || "whatsapp";
  let result: { sent: boolean; channel: string; detail?: string };

  if (channel === "email") {
    result = await sendEmail(msg.to, msg.subject || "Proposta Foco em Dados", msg.text);
  } else {
    result = await sendWhatsApp(msg.to, msg.text);
  }

  if (result.sent) {
    const { used, remaining } = registerProspection(msg.key);
    return { sent: true, channel: result.channel, used, remaining };
  }

  return { sent: false, channel: result.channel, used: getProspectionStatus(msg.key).used, remaining: getProspectionStatus(msg.key).remaining, detail: result.detail };
}

export const PROSPECTION_LIMIT_MESSAGE = LIMIT_MESSAGE;
export const PROSPECTION_DAILY_LIMIT = DAILY_LIMIT;
