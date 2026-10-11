const EPS = 1e-9

export const termoPA = (a1: number, r: number, n: number) => a1 + (n - 1) * r
export const termoPG = (a1: number, q: number, n: number) => a1 * Math.pow(q, n - 1)

export const somaPA = (a1: number, r: number, n: number) => (n * (a1 + termoPA(a1, r, n))) / 2
export const somaPG = (a1: number, q: number, n: number) => (Math.abs(q - 1) < EPS ? a1 * n : (a1 * (Math.pow(q, n) - 1)) / (q - 1))
/** Soma de todos os termos de uma PG com |q| < 1; null quando a série não converge. */
export const somaPGInfinita = (a1: number, q: number): number | null => (Math.abs(q) < 1 ? a1 / (1 - q) : null)

export const termosPA = (a1: number, r: number, n: number) => Array.from({ length: n }, (_, k) => termoPA(a1, r, k + 1))
export const termosPG = (a1: number, q: number, n: number) => Array.from({ length: n }, (_, k) => termoPG(a1, q, k + 1))

const quase = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))

export interface Classificacao {
  tipo: 'PA' | 'PG' | 'nenhuma'
  razao: number | null
}

/** Classifica uma sequência com pelo menos 3 termos. Sequência constante conta como PA de razão 0. */
export function classificar(seq: readonly number[]): Classificacao {
  if (seq.length < 3) return { tipo: 'nenhuma', razao: null }
  const r = (seq[1] as number) - (seq[0] as number)
  if (seq.every((x, i) => i === 0 || quase(x - (seq[i - 1] as number), r))) return { tipo: 'PA', razao: r }
  if (seq.every((x) => Math.abs(x) > EPS)) {
    const q = (seq[1] as number) / (seq[0] as number)
    if (seq.every((x, i) => i === 0 || quase(x / (seq[i - 1] as number), q))) return { tipo: 'PG', razao: q }
  }
  return { tipo: 'nenhuma', razao: null }
}
