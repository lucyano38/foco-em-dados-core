import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const PRECOS = {
  "Redesign de Site": "R$ 1.200,00",
  "Criação de Site do Zero": "R$ 2.500,00",
  "Automação de WhatsApp/Instagram/Facebook": "R$ 2.500,00 (personalizado)",
  "Dashboard de BI Profissional": "R$ 1.800,00"
};

export async function handleWhatsAppMessage(message, sender) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const context = `
    Você é o Agente Luciano, o assistente virtual de elite da 'Foco em Dados'.
    Sua missão é atuar como vendedor autônomo e orquestrador de automação.

    Tabela de Preços para Consultas:
    ${JSON.stringify(PRECOS, null, 2)}

    Diretrizes de Atendimento:
    1. Se o lead for novo, apresente a Foco em Dados e pergunte o objetivo do negócio.
    2. Se perguntarem preço, cite os valores da tabela acima com profissionalismo.
    3. Se houver interesse em automação ou site, peça o link do site atual (se tiver) e ofereça uma análise gratuita.
    4. Sempre tente agendar uma reunião ou converter para uma ação direta.
    5. Tom: Profissional, eficiente e focado em alta conversão.

    Mensagem do cliente (${sender}): ${message}
  `;

  const result = await model.generateContent(context);
  return result.response.text();
}
