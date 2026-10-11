/** Montante em juros simples: M = C(1 + i·t). A taxa i é decimal (0,1 = 10%). */
export function montanteSimples(capital: number, i: number, t: number): number {
  return capital * (1 + i * t)
}

/** Montante em juros compostos: M = C(1 + i)^t. */
export function montanteComposto(capital: number, i: number, t: number): number {
  return capital * Math.pow(1 + i, t)
}

/** Fator multiplicativo de uma sequência de variações percentuais (ex.: [10, -10] → 0,99). */
export function fatorSucessivo(percentuais: readonly number[]): number {
  return percentuais.reduce((f, p) => f * (1 + p / 100), 1)
}

/** Variação percentual total de uma sequência de variações. */
export function variacaoTotal(percentuais: readonly number[]): number {
  return (fatorSucessivo(percentuais) - 1) * 100
}

/** Valor inicial seguido do valor depois de cada variação. */
export function aplicarPercentuais(inicial: number, percentuais: readonly number[]): number[] {
  const saida = [inicial]
  for (const p of percentuais) saida.push((saida[saida.length - 1] as number) * (1 + p / 100))
  return saida
}

/**
 * Primeiro mês inteiro (≥ 1) em que o montante composto (taxa jCompostos) fica estritamente acima
 * do simples (taxa iSimples), ou null se isso não ocorrer até o limite.
 */
export function primeiroMesQueComposto(jComposto: number, iSimples: number, limite = 240): number | null {
  for (let t = 1; t <= limite; t++) {
    if (Math.pow(1 + jComposto, t) > 1 + iSimples * t + 1e-12) return t
  }
  return null
}
