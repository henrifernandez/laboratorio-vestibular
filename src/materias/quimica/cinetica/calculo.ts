/** Cinética química: lei de velocidade, meia-vida, Arrhenius e diagrama de energia. */

export const R = 8.314
export const LN2 = Math.log(2)

/* ------------------------------------------------------------------ lei de velocidade */

export interface Experimento {
  /** concentrações dos reagentes (mol/L), na ordem A, B... */
  conc: number[]
  /** velocidade inicial (mol/L·s) */
  v: number
}

/** v = k · [A]^m · [B]^n */
export function velocidade(k: number, ordens: number[], conc: number[]): number {
  return conc.reduce((v, c, i) => v * c ** (ordens[i] ?? 0), k)
}

/**
 * Ordem de cada reagente pelo método das velocidades iniciais: compara dois experimentos em que
 * só a concentração desse reagente muda (log da razão das velocidades ÷ log da razão das concentrações).
 */
export function ordemDe(experimentos: Experimento[], reagente: number): number | null {
  for (let i = 0; i < experimentos.length; i++)
    for (let j = i + 1; j < experimentos.length; j++) {
      const a = experimentos[i] as Experimento
      const b = experimentos[j] as Experimento
      const soEste = a.conc.every((c, k) => (k === reagente ? c !== b.conc[k] : c === b.conc[k]))
      if (soEste) return Math.log(b.v / a.v) / Math.log((b.conc[reagente] as number) / (a.conc[reagente] as number))
    }
  return null
}

/* ------------------------------------------------------------------ decaimento */

/** Ordem 1: massa restante depois de t, com meia-vida t½. */
export const restante = (m0: number, t: number, tMeia: number) => m0 / 2 ** (t / tMeia)
export const kDeMeiaVida = (tMeia: number) => LN2 / tMeia
export const meiaVidaDeK = (k: number) => LN2 / k

export type OrdemInteira = 0 | 1 | 2

/** Concentração em função do tempo para reação de ordem 0, 1 ou 2 em um só reagente. */
export function concentracao(ordem: OrdemInteira, a0: number, k: number, t: number): number {
  if (ordem === 0) return Math.max(0, a0 - k * t)
  if (ordem === 1) return a0 * Math.exp(-k * t)
  return a0 / (1 + k * a0 * t)
}

/** Meia-vida de cada ordem: A₀/2k, ln 2/k, 1/(k·A₀). */
export function meiaVida(ordem: OrdemInteira, a0: number, k: number): number {
  if (ordem === 0) return a0 / (2 * k)
  if (ordem === 1) return LN2 / k
  return 1 / (k * a0)
}

/* ------------------------------------------------------------------ temperatura */

/** razão k₂/k₁ pela equação de Arrhenius, com Ea em kJ/mol */
export const razaoArrhenius = (eaKJ: number, T1: number, T2: number) => Math.exp(((eaKJ * 1000) / R) * (1 / T1 - 1 / T2))

/** regra empírica: a velocidade dobra a cada 10 °C */
export const fatorRegraDez = (T1: number, T2: number) => 2 ** ((T2 - T1) / 10)

/** fração de colisões com energia ≥ Ea (duas dimensões, relativa), com Ea em kJ/mol */
export const fracaoEfetiva = (eaKJ: number, T: number) => Math.exp(-(eaKJ * 1000) / (R * T))

/* ------------------------------------------------------------------ diagrama de energia */

export interface Diagrama {
  /** entalpia dos reagentes, do complexo ativado e dos produtos (kJ) */
  hr: number
  hts: number
  hp: number
}

export const eaDireta = (d: Diagrama) => d.hts - d.hr
export const eaInversa = (d: Diagrama) => d.hts - d.hp
export const deltaH = (d: Diagrama) => d.hp - d.hr
export const ehEndotermica = (d: Diagrama) => deltaH(d) > 0

/** Com catalisador a barreira cai por `reducao` kJ nos dois sentidos, e ΔH não muda. */
export function comCatalisador(d: Diagrama, reducao: number): Diagrama {
  return { hr: d.hr, hp: d.hp, hts: d.hts - reducao }
}
