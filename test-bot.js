import { handleWhatsAppMessage } from './api/automation.ts';

async function testarBot() {
  console.log("--- Simulação de Atendimento: Agente Luciano ---");
  
  const mensagensTeste = [
    "Olá, o que vocês fazem?",
    "Quanto custa o serviço de BI?",
    "Quero agendar uma reunião para automação."
  ];

  for (const msg of mensagensTeste) {
    console.log(`\nCliente: ${msg}`);
    try {
      const resposta = await handleWhatsAppMessage(msg, "5511999999999");
      console.log(`Agente Luciano: ${resposta}`);
    } catch (error) {
      console.error("Erro ao simular:", error.message);
    }
  }
}

testarBot();
