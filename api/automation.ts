import { GoogleGenAI } from "@google/genai";

// Configuração básica do Gemini
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

export async function handleWhatsAppMessage(message: string, sender: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const context = `
    Você é o assistente virtual do Foco em Dados (Agente Luciano).
    Seu objetivo é prospectar clientes, explicar serviços de BI e automação, e agendar reuniões.
    
    Informações da empresa:
    - Foco em Dados: Automação com IA, dashboards executivos, prospecção.
    - Especialidade: Upload de CSV/XLSX, Fábrica de Bots, Prospecção inteligente.
    - Tom de voz: Profissional, eficiente, focado em resultados. Sempre tente mover a conversa para uma ação clara (agendamento ou prospecção).
    - Regra: Se o cliente perguntar preço, ofereça uma consultoria rápida ou redirecione para a página de preços.
    - Regra: Seja conciso nas respostas.
    
    Mensagem do cliente: ${message}
  `;

  const result = await model.generateContent(context);
  return result.response.text();
}
