const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';

function resolveApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('Defina OPENROUTER_API_KEY ou OPENAI_API_KEY nas variáveis de ambiente.');
  }
  return key;
}

export type HermesMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function chatHermes(params: {
  messages: HermesMessage[];
  model?: string;
}): Promise<{ reply: string; model: string }> {
  const key = resolveApiKey();
  const model = params.model || DEFAULT_MODEL;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenRouter error ${response.status}: ${text || response.statusText}`);
  }

  const data = (await response.json()) as any;
  const reply =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.message ||
    JSON.stringify(data);

  return { reply: String(reply), model };
}

export { DEFAULT_MODEL, OPENROUTER_BASE_URL };
