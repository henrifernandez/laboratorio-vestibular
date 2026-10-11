/** mulberry32: gerador pseudoaleatório pequeno e reproduzível a partir de uma semente. */
export type Rng = () => number

export function criarRng(semente: number): Rng {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Inteiro em [min, max], inclusive nos dois lados. */
export function sortear(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function escolher<T>(rng: Rng, itens: readonly T[]): T {
  return itens[sortear(rng, 0, itens.length - 1)] as T
}

export function embaralhar<T>(rng: Rng, itens: readonly T[]): T[] {
  const r = [...itens]
  for (let i = r.length - 1; i > 0; i--) {
    const j = sortear(rng, 0, i)
    ;[r[i], r[j]] = [r[j] as T, r[i] as T]
  }
  return r
}
