export async function safeJson<T = any>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(res.ok ? 'Resposta inesperada do servidor.' : 'O servidor retornou uma resposta inválida.')
  }
}

export function friendlyFetchError(err: any, fallback: string): string {
  if (!err) return fallback
  if (err instanceof TypeError && /fetch|network|load/i.test(err.message || '')) {
    return 'Falha de conexão com o servidor. Verifique sua internet e tente novamente.'
  }
  const msg = String(err?.message || '')
  if (msg === 'Unexpected end of JSON input') {
    return 'O servidor não retornou uma resposta válida. Tente novamente.'
  }
  return msg || fallback
}