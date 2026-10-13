/**
 * Funções puras do progresso, sem nenhuma importação: servem ao navegador e ao servidor (as funções em `api/`).
 * O progresso é um dicionário `"materia/tema/desafio:nivel" → contagens`.
 */

export interface RegistroProgresso {
  tentativas: number
  acertos: number
  ultimo: boolean
  /** AAAA-MM-DD */
  data: string
}
export type DicionarioProgresso = Record<string, RegistroProgresso>

export const MAX_CHAVES = 2000
const CHAVE = /^[a-z0-9-]{1,40}\/[a-z0-9-]{1,60}\/[a-z0-9-]{1,60}:[123]$/
const DATA = /^\d{4}-\d{2}-\d{2}$/

/**
 * Valida e limpa um progresso vindo de fora: só chaves no formato esperado, contagens inteiras e coerentes
 * (acertos ≤ tentativas). Devolve `null` se o formato geral não for um dicionário ou tiver chaves demais.
 * Entradas inválidas são descartadas, e não corrigidas.
 */
export function sanitizarProgresso(bruto: unknown): DicionarioProgresso | null {
  if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) return null
  const entradas = Object.entries(bruto as Record<string, unknown>)
  if (entradas.length > MAX_CHAVES) return null
  const saida: DicionarioProgresso = {}
  for (const [chave, v] of entradas) {
    if (!CHAVE.test(chave) || typeof v !== 'object' || v === null) continue
    const r = v as Record<string, unknown>
    const { tentativas, acertos, ultimo, data } = r
    if (!Number.isInteger(tentativas) || !Number.isInteger(acertos) || typeof ultimo !== 'boolean' || typeof data !== 'string' || !DATA.test(data)) continue
    const t = tentativas as number
    const a = acertos as number
    if (t < 1 || t > 100_000 || a < 0 || a > t) continue
    saida[chave] = { tentativas: t, acertos: a, ultimo, data }
  }
  return saida
}

/**
 * Junta dois progressos (por exemplo, o do aparelho e o da conta). Como as contagens só crescem, para cada desafio vale o
 * registro com mais tentativas; em empate, o de data mais recente. Assim entrar de novo nunca soma duas vezes a mesma tentativa.
 */
export function mesclarProgresso(a: DicionarioProgresso, b: DicionarioProgresso): DicionarioProgresso {
  const saida: DicionarioProgresso = { ...a }
  for (const [chave, rb] of Object.entries(b)) {
    const ra = saida[chave]
    if (!ra || rb.tentativas > ra.tentativas || (rb.tentativas === ra.tentativas && rb.data > ra.data)) saida[chave] = rb
  }
  return saida
}

/** Os dois dicionários têm exatamente o mesmo conteúdo? */
export function progressosIguais(a: DicionarioProgresso, b: DicionarioProgresso): boolean {
  const ca = Object.keys(a)
  if (ca.length !== Object.keys(b).length) return false
  return ca.every((k) => {
    const x = a[k]
    const y = b[k]
    return !!x && !!y && x.tentativas === y.tentativas && x.acertos === y.acertos && x.ultimo === y.ultimo && x.data === y.data
  })
}
