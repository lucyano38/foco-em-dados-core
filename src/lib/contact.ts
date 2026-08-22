export const CONTACT_EMAIL = 'atendimento@focoemdados.com.br'

export const WHATSAPP_NUMBER = '5511994411307'

export const WHATSAPP_MESSAGE =
  'Olá! Gostaria de saber mais sobre as automações e redesign da Foco em Dados.'

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

export const TELEGRAM_URL = 'https://t.me/focoemdados'

// Tunnel público temporário para demos de redesign.
// Sobrescreva via PUBLIC_TUNNEL_URL quando houver um link ativo.
export const PUBLIC_TUNNEL_URL = (() => {
  try {
    const explicit = import.meta.env?.PUBLIC_TUNNEL_URL as string | undefined
    if (explicit && explicit.trim()) return explicit.trim()
  } catch {
    // ignore
  }
  return 'https://attempting-postposted-processors-tennis.trycloudflare.com'
})()
