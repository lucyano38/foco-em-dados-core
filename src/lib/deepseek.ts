import { ChatDeepSeek } from 'langchain/chat_models/deepseek'

export type DeepSeekConfig = {
  apiKey: string
  baseUrl?: string
  model?: 'deepseek-chat' | 'deepseek-reasoner'
  temperature?: number
  maxTokens?: number
}

export function createDeepSeekLLM(config: DeepSeekConfig) {
  return new ChatDeepSeek({
    deepseekApiKey: config.apiKey,
    modelName: config.model ?? 'deepseek-chat',
    temperature: config.temperature ?? 0.2,
    maxTokens: config.maxTokens ?? 4096,
    baseUrl: config.baseUrl ?? 'https://api.deepseek.com',
  })
}

export function getDeepSeekConfigFromEnv(): DeepSeekConfig | null {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
  if (!apiKey || apiKey.includes('SUA_CHAVE_API_AQUI')) return null
  return {
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: (process.env.DEEPSEEK_MODEL as DeepSeekConfig['model']) || 'deepseek-chat',
  }
}
