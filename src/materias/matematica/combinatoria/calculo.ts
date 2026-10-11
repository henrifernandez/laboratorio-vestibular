export function fatorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) return NaN
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

export const permutacao = (n: number) => fatorial(n)

export function permutacaoComRepeticao(n: number, repeticoes: readonly number[]): number {
  return Math.round(fatorial(n) / repeticoes.reduce((p, r) => p * fatorial(r), 1))
}

/** Número de anagramas (letras repetidas contam uma vez). */
export function anagramas(palavra: string): number {
  const cont = new Map<string, number>()
  for (const c of palavra) cont.set(c, (cont.get(c) ?? 0) + 1)
  return permutacaoComRepeticao(palavra.length, [...cont.values()])
}

/** A(n,p) = n·(n−1)·…·(n−p+1), multiplicando só os fatores necessários. */
export function arranjo(n: number, p: number): number {
  if (p < 0 || p > n) return 0
  let r = 1
  for (let i = 0; i < p; i++) r *= n - i
  return r
}

/** C(n,p), calculado de forma incremental para não estourar com fatoriais grandes. */
export function combinacao(n: number, p: number): number {
  if (p < 0 || p > n) return 0
  const k = Math.min(p, n - p)
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}

export function listarArranjos(itens: readonly string[], p: number): string[] {
  if (p === 0) return ['']
  const saida: string[] = []
  itens.forEach((x, i) => {
    const resto = itens.filter((_, k) => k !== i)
    for (const s of listarArranjos(resto, p - 1)) saida.push(x + s)
  })
  return saida
}

export function listarCombinacoes(itens: readonly string[], p: number): string[] {
  if (p === 0) return ['']
  const saida: string[] = []
  itens.forEach((x, i) => {
    for (const s of listarCombinacoes(itens.slice(i + 1), p - 1)) saida.push(x + s)
  })
  return saida
}

export const probabilidade = (favoraveis: number, possiveis: number) => (possiveis > 0 ? favoraveis / possiveis : NaN)
