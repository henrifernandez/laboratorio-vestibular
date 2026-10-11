export const soma = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)

export const media = (xs: readonly number[]) => (xs.length ? soma(xs) / xs.length : NaN)

export function mediaPonderada(itens: readonly { valor: number; freq: number }[]): number {
  const total = itens.reduce((s, i) => s + i.freq, 0)
  return total ? itens.reduce((s, i) => s + i.valor * i.freq, 0) / total : NaN
}

export function mediana(xs: readonly number[]): number {
  if (xs.length === 0) return NaN
  const o = [...xs].sort((a, b) => a - b)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? (o[m] as number) : ((o[m - 1] as number) + (o[m] as number)) / 2
}

/** Valores mais frequentes. Lista vazia quando todos aparecem o mesmo número de vezes (amodal). */
export function moda(xs: readonly number[]): number[] {
  const cont = new Map<number, number>()
  for (const x of xs) cont.set(x, (cont.get(x) ?? 0) + 1)
  const max = Math.max(0, ...cont.values())
  const topo = [...cont].filter(([, c]) => c === max).map(([v]) => v)
  return topo.length === cont.size ? [] : topo.sort((a, b) => a - b)
}

export const amplitude = (xs: readonly number[]) => Math.max(...xs) - Math.min(...xs)

export function variancia(xs: readonly number[]): number {
  const m = media(xs)
  return media(xs.map((x) => (x - m) ** 2))
}

export const desvioPadrao = (xs: readonly number[]) => Math.sqrt(variancia(xs))

export interface Classe {
  de: number
  ate: number
  freq: number
}

/** Histograma com classes [de, ate) de largura fixa, a partir de `inicio`. */
export function histograma(xs: readonly number[], inicio: number, largura: number, nClasses: number): Classe[] {
  const classes: Classe[] = Array.from({ length: nClasses }, (_, k) => ({ de: inicio + k * largura, ate: inicio + (k + 1) * largura, freq: 0 }))
  for (const x of xs) {
    const k = Math.floor((x - inicio) / largura)
    if (k >= 0 && k < nClasses) (classes[k] as Classe).freq++
  }
  return classes
}
