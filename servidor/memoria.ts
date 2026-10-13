import type { Kv } from './kv.js'

/** Banco na memória com a mesma interface do Upstash, para os testes (e para experimentar localmente). */
export function criarKvMemoria(): Kv & { dados: Map<string, string>; expiracoes: Map<string, number> } {
  const dados = new Map<string, string>()
  const expiracoes = new Map<string, number>()
  return {
    dados,
    expiracoes,
    async get(chave) {
      return dados.get(chave) ?? null
    },
    async set(chave, valor, opcoes = {}) {
      if (opcoes.nx && dados.has(chave)) return false
      dados.set(chave, valor)
      if (opcoes.ex) expiracoes.set(chave, opcoes.ex)
      return true
    },
    async del(chave) {
      dados.delete(chave)
      expiracoes.delete(chave)
    },
    async incr(chave) {
      const n = Number(dados.get(chave) ?? 0) + 1
      dados.set(chave, String(n))
      return n
    },
    async expire(chave, segundos) {
      expiracoes.set(chave, segundos)
    },
  }
}
