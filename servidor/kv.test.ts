// @vitest-environment node
import { criarKvUpstash, kvDoAmbiente } from './kv.js'

describe('Cliente do Upstash (REST)', () => {
  afterEach(() => vi.unstubAllGlobals())

  function simular(resultados: unknown[], status = 200) {
    const chamadas: { url: string; metodo: string; corpo: unknown; autorizacao: string | null }[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      chamadas.push({ url, metodo: init.method ?? '', corpo: JSON.parse(init.body as string), autorizacao: new Headers(init.headers).get('authorization') })
      const r = resultados.shift()
      return new Response(JSON.stringify(typeof r === 'object' && r !== null && 'error' in r ? r : { result: r }), { status })
    })
    return chamadas
  }

  it('cada operação é um POST com o comando em lista e o token no cabeçalho', async () => {
    const chamadas = simular(['OK', 'valor', 1, 1, 1])
    const kv = criarKvUpstash('https://exemplo.upstash.io', 'token-secreto')
    expect(await kv.set('a', 'b', { ex: 60, nx: true })).toBe(true)
    expect(await kv.get('a')).toBe('valor')
    expect(await kv.incr('n')).toBe(1)
    await kv.expire('n', 900)
    await kv.del('a')
    expect(chamadas.map((c) => c.corpo)).toEqual([['SET', 'a', 'b', 'EX', 60, 'NX'], ['GET', 'a'], ['INCR', 'n'], ['EXPIRE', 'n', 900], ['DEL', 'a']])
    for (const c of chamadas) {
      expect(c.url).toBe('https://exemplo.upstash.io')
      expect(c.metodo).toBe('POST')
      expect(c.autorizacao).toBe('Bearer token-secreto')
    }
  })
  it('"só se não existir" devolve falso quando a chave já existia (resposta nula) e GET de chave ausente devolve nulo', async () => {
    simular([null, null])
    const kv = criarKvUpstash('https://x', 't')
    expect(await kv.set('a', 'b', { nx: true })).toBe(false)
    expect(await kv.get('ausente')).toBeNull()
  })
  it('erro HTTP ou erro do banco vira exceção (as rotas respondem 503 sem detalhes)', async () => {
    simular([{ error: 'WRONGPASS' }])
    await expect(criarKvUpstash('https://x', 't').get('a')).rejects.toThrow('erro no banco')
    simular([null], 500)
    await expect(criarKvUpstash('https://x', 't').get('a')).rejects.toThrow('indisponível')
  })
})

describe('kvDoAmbiente', () => {
  it('lê os dois nomes de variável que as integrações da Vercel usam, e devolve nulo sem elas', () => {
    expect(kvDoAmbiente({})).toBeNull()
    expect(kvDoAmbiente({ KV_REST_API_URL: 'https://x' })).toBeNull()
    expect(kvDoAmbiente({ KV_REST_API_URL: 'https://x', KV_REST_API_TOKEN: 't' })).not.toBeNull()
    expect(kvDoAmbiente({ UPSTASH_REDIS_REST_URL: 'https://x', UPSTASH_REDIS_REST_TOKEN: 't' })).not.toBeNull()
  })
  it('aceita um prefixo escolhido na integração e não usa o token somente de leitura', () => {
    expect(kvDoAmbiente({ STORAGE_REST_API_URL: 'https://x', STORAGE_REST_API_TOKEN: 't' })).not.toBeNull()
    expect(kvDoAmbiente({ STORAGE_KV_REST_API_URL: 'https://x', STORAGE_KV_REST_API_TOKEN: 't', STORAGE_KV_REST_API_READ_ONLY_TOKEN: 'ro' })).not.toBeNull()
    // só a URL e o token de leitura: não serve para gravar
    expect(kvDoAmbiente({ STORAGE_KV_REST_API_URL: 'https://x', STORAGE_KV_REST_API_READ_ONLY_TOKEN: 'ro' })).toBeNull()
  })
})
