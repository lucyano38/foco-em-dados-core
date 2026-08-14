import { WHATSAPP_NUMBER } from './contact'

export const generateSharedMessage = (clientData: { name: string; phone?: string; city?: string }, serviceName: string) => {
  const focoEmDadosInfo = `
----------------------------------
📌 *Foco em Dados — Soluções Inteligentes*
🌐 Website: https://focoemdados.com.br
📞 WhatsApp: (11) 99441-1307
  `.trim()

  return encodeURIComponent(
    `Olá, ${clientData.name}!\n\n` +
      `Aqui estão as informações sobre o *${serviceName}* solicitadas para a sua empresa:\n\n` +
      `👤 *Dados do Cliente:*\n` +
      `• Nome: ${clientData.name}\n` +
      `${clientData.city ? `• Cidade: ${clientData.city}\n` : ''}\n` +
      `Estamos à disposição para alinhar os próximos passos!\n\n` +
      `${focoEmDadosInfo}`
  )
}

export const sharedWhatsAppUrl = (clientData: { name: string; phone?: string; city?: string }, serviceName: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${generateSharedMessage(clientData, serviceName)}`