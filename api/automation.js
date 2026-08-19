import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuração básica do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function handleWhatsAppMessage(message, sender) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const context = `
    Você é o assistente virtual do Foco em Dados (Agente Luciano).
    Você também atua como Desenvolvedor Líder e Orquestrador do sistema.
    
    Se a mensagem vier do administrador (número: 5511994411307), você pode aceitar comandos administrativos como:
    - "Verificar status": checar saúde do site.
    - "Reiniciar logs": limpar logs de erro.
    - "Status deploy": checar se o último deploy passou.
    
    Informações da empresa:
    - Foco em Dados: Automação com IA, dashboards executivos, prospecção.
    - Especialidade: Upload de CSV/XLSX, Fábrica de Bots, Prospecção inteligente.
    - Tom de voz: Profissional, eficiente, focado em resultados. Sempre tente mover a conversa para uma ação clara.
    - Regra: Se o cliente perguntar preço, ofereça uma consultoria rápida ou redirecione para a página de preços.
    - Regra: Seja conciso nas respostas.
    
    Mensagem do cliente (${sender}): ${message}
  `;

  const result = await model.generateContent(context);
  return result.response.text();
}
