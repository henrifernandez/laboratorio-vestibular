/** Chamadas à API de contas (funções em `api/`). Nunca lançam: devolvem o status e, se houver, a mensagem de erro. */

export interface Resposta<T> {
  /** 0 quando não houve resposta (sem rede, tempo esgotado) */
  status: number
  dados: T | null
  erro: string | null
}

const TEMPO = 12_000

export async function chamar<T = Record<string, unknown>>(caminho: string, metodo: 'GET' | 'POST' | 'PUT', corpo?: unknown): Promise<Resposta<T>> {
  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), TEMPO)
  try {
    const r = await fetch(caminho, {
      method: metodo,
      credentials: 'same-origin',
      headers: corpo === undefined ? undefined : { 'content-type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controle.signal,
    })
    let json: unknown = null
    try {
      json = await r.json()
    } catch {
      /* resposta sem corpo JSON (por exemplo, uma página de erro da hospedagem) */
    }
    const obj = json && typeof json === 'object' ? (json as Record<string, unknown>) : null
    if (r.ok) return { status: r.status, dados: obj as T | null, erro: null }
    return { status: r.status, dados: null, erro: typeof obj?.erro === 'string' ? obj.erro : 'Não foi possível concluir. Tente de novo.' }
  } catch {
    return { status: 0, dados: null, erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' }
  } finally {
    clearTimeout(timer)
  }
}
