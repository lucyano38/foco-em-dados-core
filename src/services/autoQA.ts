import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8716515024:AAH_IpZRBhHjZWCIvMoV-N7LJ6LXnu_ZEE8';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '5643486739';
const APP_URL = process.env.APP_URL || 'https://focoemdados.com.br';

export async function sendTelegramAlert(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) return;
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    console.error('[AutoQA] Falha ao enviar alerta para o Telegram:', err);
  }
}

export async function runAutomatedQA(): Promise<{ success: boolean; report: string }> {
  console.log('[AutoQA] Iniciando bateria de testes automatizados (Smoke Test & Health Check)...');
  const checks: string[] = [];
  let hasError = false;

  // 1. Health Check URL Principal
  try {
    const start = Date.now();
    const res = await fetch(APP_URL);
    const duration = Date.now() - start;
    if (res.status >= 200 && res.status < 400) {
      checks.push(`✅ Landing Page / App (${res.status}) - ${duration}ms`);
    } else {
      hasError = true;
      checks.push(`❌ Landing Page retornou status ${res.status}`);
    }
  } catch (err: any) {
    hasError = true;
    checks.push(`❌ Falha de conexão com ${APP_URL}: ${err.message}`);
  }

  // 2. Health Check API / Chat Hermes / 9router
  try {
    const res = await fetch('https://focoemdados2.app.n8n.cloud/webhook/site-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Health Check QA', phone: 'system_qa', source: 'QA_Agent' })
    });
    if (res.ok) {
      checks.push('✅ Webhook n8n / Hermes Agent: Online');
    } else {
      hasError = true;
      checks.push(`❌ Webhook n8n retornou status ${res.status}`);
    }
  } catch (err: any) {
    hasError = true;
    checks.push(`❌ Falha no Webhook n8n: ${err.message}`);
  }

  const report = `🤖 *RELATÓRIO DE QA AUTOMATIZADO - HERMES AGENT*\n\n` +
    checks.join('\n') + `\n\n` +
    (hasError ? `⚠️ *Status:* Erros detectados na infraestrutura!` : `🚀 *Status:* Todos os sistemas operando 100%!`);

  if (hasError) {
    await sendTelegramAlert(report);
  }

  return { success: !hasError, report };
}

export async function generateMarketingPostWithNanoBanana(): Promise<string> {
  const nanoKey = process.env.NANO_BANANA_API_KEY;
  const prompt = "Crie uma postagem de marketing B2B altamente persuasiva destacando a automação de vendas, IA e BI para varejo.";
  
  try {
    // Integração com a API do Nano Banana / OpenRouter
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || nanoKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gc/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data: any = await res.json();
    const postText = data?.choices?.[0]?.message?.content || "🚀 Acelere suas vendas B2B com inteligência artificial e BI na Foco em Dados!";
    
    await sendTelegramAlert(`📢 *POST AUTOMÁTICO DE MARKETING (NANO BANANA)*\n\n${postText}`);
    return postText;
  } catch (err) {
    console.error('[Marketing] Erro ao gerar post com Nano Banana:', err);
    return "Erro na geração de post.";
  }
}
