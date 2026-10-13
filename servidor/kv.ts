/**
 * Banco chave-valor usado pelas contas (Upstash Redis, ligado ao projeto pela Vercel). A interface é pequena de propósito,
 * para os testes usarem um banco na memória.
 */
export interface Kv {
  get(chave: string): Promise<string | null>
  /** `nx`: só grava se a chave ainda não existe (devolve falso se já existia); `ex`: segundos até expirar */
  set(chave: string, valor: string, opcoes?: { nx?: boolean; ex?: number }): Promise<boolean>
  del(chave: string): Promise<void>
  /** soma 1 e devolve o novo valor */
  incr(chave: string): Promise<number>
  expire(chave: string, segundos: number): Promise<void>
}

type Comando = (string | number)[]

/** Cliente da API REST do Upstash: cada comando é um POST com a lista de argumentos. */
export function criarKvUpstash(url: string, token: string): Kv {
  async function executar(comando: Comando): Promise<unknown> {
    const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(comando) })
    if (!r.ok) throw new Error(`banco indisponível (${r.status})`)
    const corpo = (await r.json()) as { result?: unknown; error?: string }
    if (corpo.error) throw new Error('erro no banco')
    return corpo.result
  }
  return {
    async get(chave) {
      const v = await executar(['GET', chave])
      return typeof v === 'string' ? v : null
    },
    async set(chave, valor, opcoes = {}) {
      const c: Comando = ['SET', chave, valor]
      if (opcoes.ex) c.push('EX', opcoes.ex)
      if (opcoes.nx) c.push('NX')
      return (await executar(c)) === 'OK'
    },
    async del(chave) {
      await executar(['DEL', chave])
    },
    async incr(chave) {
      return Number(await executar(['INCR', chave]))
    },
    async expire(chave, segundos) {
      await executar(['EXPIRE', chave, segundos])
    },
  }
}

/**
 * Banco ligado pelas variáveis de ambiente da Vercel, ou `null` se não houver. Aceita os nomes padrão (`KV_REST_API_*` e
 * `UPSTASH_REDIS_REST_*`) e também os que a integração cria quando se escolhe um prefixo (por exemplo, `STORAGE_REST_API_URL`
 * ou `STORAGE_KV_REST_API_URL`). O token de leitura (`*_READ_ONLY_TOKEN`) nunca é usado, pois as contas precisam gravar.
 */
export function kvDoAmbiente(env: Record<string, string | undefined> = process.env): Kv | null {
  let url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL
  let token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    const sufixoUrl = /_(?:KV_)?REST_API_URL$|_REDIS_REST_URL$/
    const chaveUrl = Object.keys(env).find((k) => sufixoUrl.test(k) && env[k])
    if (chaveUrl) {
      url = env[chaveUrl]
      token = env[chaveUrl.replace(/_URL$/, '_TOKEN')]
    }
  }
  return url && token ? criarKvUpstash(url, token) : null
}
