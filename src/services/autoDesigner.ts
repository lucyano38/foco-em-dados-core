import http from "node:http";

export interface RedesignRequest {
  companyName: string;
  segment: string;
  city: string;
  uf?: string;
  primaryColor?: string;
  headline?: string;
  description?: string;
  offerings?: string[];
  whatsapp?: string;
  hasWebsite?: boolean;
  redesignGoal?: string;
}

export interface DesignOutput {
  designId: string;
  html: string;
  generatedAt: string;
  model: string;
}

export interface FunnelOutput {
  port: number;
  internalUrl: string;
  publicUrl: string | null;
  tailnet: string | null;
}

const FREE_MODEL = process.env.FREE_MODEL || "gc/gemini-2.5-flash";
const COST_ZERO = process.env.MAX_COST_PER_MONTH === "0.00" && process.env.PREFER_FREE_MODELS === "true";
const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const ROUTER_BASE = process.env["9ROUTER_BASE_URL"] || "http://localhost:20128";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

const activeFunnels = new Map<number, { server: http.Server; publicUrl: string | null; createdAt: number }>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTemplate(req: RedesignRequest, copy: { headline: string; description: string; offerings: string[] }): string {
  const color = /^#[0-9a-fA-F]{6}$/.test(req.primaryColor || "") ? req.primaryColor! : "#f7b500";
  const safeName = escapeHtml(req.companyName || "Sua Empresa");
  const safeSegment = escapeHtml(req.segment || "");
  const safeCity = escapeHtml(req.city || "");
  const safeUf = escapeHtml(req.uf || "");
  const safeHeadline = escapeHtml(copy.headline);
  const safeDescription = escapeHtml(copy.description);
  const safeOffers = copy.offerings.map((o) => `<div class="offer">${escapeHtml(o)}</div>`).join("");
  const safeWhatsapp = escapeHtml(req.whatsapp || "");
  const waLink = safeWhatsapp
    ? `<a class="cta" href="https://wa.me/${safeWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Vi a proposta da " + req.companyName + " e quero saber mais.")}">Chamar no WhatsApp</a>`
    : "";
  const badge = req.hasWebsite === false ? "Sem site — presença digital do zero" : "Redesign completo";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeName} — Proposta Comercial | Foco em Dados</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #0b0d10; color: #f1f5f9; min-height: 100vh; overflow-x: hidden; }
  .bg { position: fixed; inset: 0; background: radial-gradient(circle at 20% 10%, ${color}26 0%, rgba(88, 28, 228, 0.22) 45%, #0b0d10 100%); z-index: -2; }
  .orb { position: fixed; width: 420px; height: 420px; border-radius: 50%; filter: blur(120px); opacity: 0.5; z-index: -1; animation: float 12s ease-in-out infinite; }
  .orb.one { background: ${color}; top: -120px; right: -80px; }
  .orb.two { background: rgba(88, 28, 228, 0.8); bottom: -140px; left: -100px; animation-delay: -6s; }
  @keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(28px) scale(1.06); } }
  .glass { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-radius: 24px; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 56px 24px; }
  .badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; border: 1px solid ${color}55; color: ${color}; background: ${color}0f; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  h1 { font-size: clamp(2.1rem, 5vw, 3.6rem); font-weight: 800; line-height: 1.1; margin: 22px 0 16px; background: linear-gradient(100deg, #fff 20%, ${color} 80%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .sub { font-size: clamp(1rem, 2vw, 1.2rem); color: #cbd5e1; max-width: 640px; line-height: 1.65; }
  .meta { display: flex; flex-wrap: wrap; gap: 10px; margin: 22px 0; font-size: 13px; color: #94a3b8; }
  .chip { padding: 6px 12px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
  .offers { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin: 34px 0; }
  .offer { padding: 20px; border-radius: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09); font-size: 14px; color: #e2e8f0; line-height: 1.6; }
  .offer::before { content: "✦ "; color: ${color}; }
  .cta { display: inline-block; margin-top: 10px; padding: 15px 30px; border-radius: 14px; background: linear-gradient(135deg, ${color}, #7c3aed); color: #0b0d10; font-weight: 800; text-decoration: none; box-shadow: 0 12px 34px ${color}40; transition: transform .18s ease, box-shadow .18s ease; }
  .cta:hover { transform: translateY(-2px); box-shadow: 0 16px 44px ${color}60; }
  .foot { margin-top: 44px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
</style>
</head>
<body>
  <div class="bg"></div>
  <div class="orb one"></div>
  <div class="orb two"></div>
  <main class="wrap">
    <span class="badge">✦ ${badge}</span>
    <h1>${safeHeadline}</h1>
    <p class="sub">${safeDescription}</p>
    <div class="meta">
      <span class="chip">${safeSegment}</span>
      <span class="chip">${safeCity}${safeUf ? " - " + safeUf : ""}</span>
      <span class="chip">Proposta gerada por IA — Foco em Dados</span>
    </div>
    <div class="offers">${safeOffers}</div>
    ${waLink}
    <div class="foot">
      <span>${safeName} — ${safeCity}</span>
      <span>Demonstração temporária · Foco em Dados</span>
    </div>
  </main>
</body>
</html>`;
}

async function generateCopy(req: RedesignRequest): Promise<{ headline: string; description: string; offerings: string[] }> {
  const fallback = {
    headline: `${req.companyName}: ${req.segment === "padaria" ? "sabor" : "presença"} digital que vende mais`,
    description:
      req.description ||
      `${req.companyName} está estruturando sua presença digital em ${req.city}${req.uf ? "/" + req.uf : ""} com uma página moderna, rápida e focada em conversão.`,
    offerings: req.offerings?.length ? req.offerings : ["Site/redesign profissional responsivo", "Integração com WhatsApp", "Otimização para busca local (SEO)"],
  };

  if (!COST_ZERO || (!OPENROUTER_KEY && !ROUTER_BASE)) return fallback;

  const prompt = `Crie copy de venda em português (máx. 1 frase headline, 2 frases de descrição, 3 ofertas) para a empresa ${req.companyName} (segmento: ${req.segment}, cidade: ${req.city}). Retorne JSON: {"headline": "...", "description": "...", "offerings": ["...", "...", "..."]}`;

  try {
    const base = OPENROUTER_KEY ? OPENROUTER_BASE : ROUTER_BASE;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (OPENROUTER_KEY) headers["Authorization"] = `Bearer ${OPENROUTER_KEY}`;
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: FREE_MODEL,
        messages: [
          { role: "system", content: "Você é um redator comercial. Responda somente JSON válido." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      headline: String(parsed.headline || fallback.headline).slice(0, 120),
      description: String(parsed.description || fallback.description).slice(0, 400),
      offerings: Array.isArray(parsed.offerings) && parsed.offerings.length ? parsed.offerings.slice(0, 6).map(String) : fallback.offerings,
    };
  } catch (err) {
    console.error("[autoDesigner] Falha ao gerar copy via IA (usando template):", err);
    return fallback;
  }
}

export async function generateRedesignPage(req: RedesignRequest): Promise<DesignOutput> {
  const copy = await generateCopy(req);
  const html = buildTemplate(req, copy);
  return {
    designId: `design_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    html,
    generatedAt: new Date().toISOString(),
    model: COST_ZERO ? FREE_MODEL : "template",
  };
}

export function getActiveFunnels(): { port: number; publicUrl: string | null; createdAt: number }[] {
  return Array.from(activeFunnels.entries()).map(([port, f]) => ({
    port,
    publicUrl: f.publicUrl,
    createdAt: f.createdAt,
  }));
}

export async function closeFunnel(port: number): Promise<boolean> {
  const entry = activeFunnels.get(port);
  if (!entry) return false;
  return new Promise((resolve) => {
    entry.server.close(() => {
      activeFunnels.delete(port);
      resolve(true);
    });
    entry.server.closeAllConnections?.();
  });
}

async function requestRouterFunnel(port: number): Promise<{ publicUrl: string | null; tailnet: string | null }> {
  const payload = { port, description: "foco-em-dados demo" };
  const candidates = [
    { url: `${ROUTER_BASE}/v1/tailscale/funnel`, body: payload },
    { url: `${ROUTER_BASE}/funnel`, body: payload },
    { url: `${ROUTER_BASE}/api/funnel`, body: payload },
  ];
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate.body),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const text = await res.text();
      const urlMatch = text.match(/https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net\/?[^\s"']*/i);
      if (urlMatch) {
        const publicUrl = urlMatch[0];
        const tailnetMatch = publicUrl.match(/\.([a-z0-9-]+\.ts\.net)/i);
        return { publicUrl, tailnet: tailnetMatch ? tailnetMatch[1] : null };
      }
      try {
        const parsed = JSON.parse(text);
        const url = parsed?.url || parsed?.publicUrl || parsed?.funnelUrl || parsed?.data?.url;
        if (typeof url === "string" && url.includes(".ts.net")) {
          return { publicUrl: url, tailnet: url.match(/\.([a-z0-9-]+\.ts\.net)/i)?.[1] || null };
        }
      } catch {
        // resposta não-JSON sem URL -> tenta próximo candidato
      }
    } catch (err) {
      console.error(`[autoDesigner] 9router Funnel falhou em ${candidate.url}:`, err);
    }
  }
  return { publicUrl: null, tailnet: null };
}

export async function publishTailscaleFunnel(html: string): Promise<FunnelOutput> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });

    server.on("error", (err) => reject(err));
    server.listen(0, "0.0.0.0", async () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const internalUrl = `http://localhost:${port}`;
      activeFunnels.set(port, { server, publicUrl: null, createdAt: Date.now() });

      const { publicUrl, tailnet } = await requestRouterFunnel(port);
      if (publicUrl) {
        const entry = activeFunnels.get(port);
        if (entry) entry.publicUrl = publicUrl;
      }
      resolve({ port, internalUrl, publicUrl, tailnet });
    });
  });
}

export async function createAutoDesign(req: RedesignRequest, options: { publish?: boolean } = {}): Promise<{ design: DesignOutput; funnel?: FunnelOutput }> {
  const design = await generateRedesignPage(req);
  if (!options.publish) return { design };
  const funnel = await publishTailscaleFunnel(design.html);
  return { design, funnel };
}
