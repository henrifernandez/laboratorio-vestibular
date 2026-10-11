import type { Rng } from '@/lib/rng'

export type TipoExperimento = 'moeda' | 'dado' | 'urna'

export interface Urna {
  vermelhas: number
  azuis: number
  verdes: number
}

export interface Experimento {
  rotulos: string[]
  probs: number[]
}

export function experimento(tipo: TipoExperimento, urna: Urna): Experimento {
  if (tipo === 'moeda') return { rotulos: ['cara', 'coroa'], probs: [0.5, 0.5] }
  if (tipo === 'dado') return { rotulos: ['1', '2', '3', '4', '5', '6'], probs: Array(6).fill(1 / 6) as number[] }
  const cores = [
    { r: 'vermelha', n: urna.vermelhas },
    { r: 'azul', n: urna.azuis },
    { r: 'verde', n: urna.verdes },
  ].filter((c) => c.n > 0)
  const total = cores.reduce((s, c) => s + c.n, 0) || 1
  return { rotulos: cores.map((c) => c.r), probs: cores.map((c) => c.n / total) }
}

/** n resultados independentes (índices) segundo as probabilidades. */
export function sequencia(rng: Rng, probs: readonly number[], n: number): number[] {
  const acum: number[] = []
  probs.reduce((s, p, i) => (acum[i] = s + p), 0)
  return Array.from({ length: n }, () => {
    const u = rng()
    const k = acum.findIndex((a) => u < a)
    return k === -1 ? probs.length - 1 : k
  })
}

/** Quantas vezes cada resultado apareceu nos primeiros `ate` itens. */
export function contar(seq: readonly number[], nResultados: number, ate: number): number[] {
  const c = Array(nResultados).fill(0) as number[]
  for (let i = 0; i < Math.min(ate, seq.length); i++) c[seq[i] as number]!++
  return c
}

/** Frequência relativa de um resultado em pontos de verificação (n = número de repetições feitas). */
export function frequenciasAcumuladas(seq: readonly number[], resultado: number, pontos: readonly number[]): { n: number; freq: number }[] {
  const saida: { n: number; freq: number }[] = []
  let k = 0
  let feitos = 0
  for (const n of pontos) {
    while (feitos < n && feitos < seq.length) {
      if (seq[feitos] === resultado) k++
      feitos++
    }
    saida.push({ n, freq: feitos ? k / feitos : 0 })
  }
  return saida
}
