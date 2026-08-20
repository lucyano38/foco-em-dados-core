import { handleWhatsAppMessage } from './automation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, sender } = req.body;

  if (!message || !sender) {
    return res.status(400).json({ error: 'Missing message or sender' });
  }

  try {
    const response = await handleWhatsAppMessage(message, sender);
    return res.status(200).json({ reply: response });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
