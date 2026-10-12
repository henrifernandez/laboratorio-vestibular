/** Concentrações, diluição, mistura e curvas de solubilidade. */

export const concentracaoComum = (massaG: number, volumeL: number) => massaG / volumeL
export const molaridade = (massaG: number, massaMolar: number, volumeL: number) => massaG / massaMolar / volumeL
/** mol/L a partir do título em % (m/m) e da densidade em g/mL: M = 10·d·τ(%) / MM */
export const molaridadeDeTitulo = (tituloPercent: number, densidade: number, massaMolar: number) => (10 * densidade * tituloPercent) / massaMolar
/** 1 ppm = 1 mg de soluto por litro de solução aquosa diluída */
export const ppm = (massaMg: number, volumeL: number) => massaMg / volumeL

/** C1·V1 = C2·V2 (a quantidade de soluto não muda ao diluir) */
export const volumeFinalDiluicao = (c1: number, v1: number, c2: number) => (c1 * v1) / c2
export const concentracaoDiluida = (c1: number, v1: number, v2: number) => (c1 * v1) / v2
/** soluto igual nas duas soluções: C = (C1·V1 + C2·V2) / (V1 + V2) */
export const misturar = (c1: number, v1: number, c2: number, v2: number) => (c1 * v1 + c2 * v2) / (v1 + v2)

/* ------------------------------------------------------------------ solubilidade */

/** Curva de solubilidade didática: pontos [temperatura °C, g de sal por 100 g de água]. */
export interface CurvaSol {
  id: 'A' | 'B' | 'C'
  nome: string
  pontos: [number, number][]
  /** a solubilidade cai quando a temperatura sobe */
  decrescente: boolean
}

export const CURVAS: CurvaSol[] = [
  { id: 'A', nome: 'Sal A', pontos: [[0, 10], [20, 30], [40, 60], [60, 110], [80, 170]], decrescente: false },
  { id: 'B', nome: 'Sal B', pontos: [[0, 30], [20, 32], [40, 34], [60, 36], [80, 38]], decrescente: false },
  { id: 'C', nome: 'Sal C', pontos: [[0, 20], [20, 16], [40, 12], [60, 8], [80, 4]], decrescente: true },
]

export const curva = (id: string): CurvaSol => CURVAS.find((c) => c.id === id) ?? (CURVAS[0] as CurvaSol)

/** Solubilidade (g/100 g de água) por interpolação linear entre os pontos da curva. */
export function solubilidade(c: CurvaSol, T: number): number {
  const p = c.pontos
  const primeiro = p[0] as [number, number]
  const ultimo = p[p.length - 1] as [number, number]
  if (T <= primeiro[0]) return primeiro[1]
  if (T >= ultimo[0]) return ultimo[1]
  for (let i = 0; i < p.length - 1; i++) {
    const [t0, s0] = p[i] as [number, number]
    const [t1, s1] = p[i + 1] as [number, number]
    if (T >= t0 && T <= t1) return s0 + ((s1 - s0) * (T - t0)) / (t1 - t0)
  }
  return ultimo[1]
}

export type EstadoSol = 'insaturada' | 'saturada' | 'corpo-de-fundo'

export interface ResultadoMistura {
  estado: EstadoSol
  /** massa de sal que cabe na água a essa temperatura (g) */
  capacidade: number
  dissolvido: number
  /** sal que sobra no fundo (g) */
  depositado: number
}

/** O que acontece ao misturar `massaSal` g de sal com `massaAgua` g de água à temperatura T. */
export function misturaSalAgua(c: CurvaSol, T: number, massaSal: number, massaAgua: number): ResultadoMistura {
  const capacidade = (solubilidade(c, T) * massaAgua) / 100
  if (Math.abs(massaSal - capacidade) < 1e-9) return { estado: 'saturada', capacidade, dissolvido: massaSal, depositado: 0 }
  if (massaSal < capacidade) return { estado: 'insaturada', capacidade, dissolvido: massaSal, depositado: 0 }
  return { estado: 'corpo-de-fundo', capacidade, dissolvido: capacidade, depositado: massaSal - capacidade }
}

/** Massa de sal que se separa quando a solução saturada a T1 passa a T2 (sem evaporar água). */
export function precipitado(c: CurvaSol, massaAgua: number, T1: number, T2: number): number {
  return Math.max(0, ((solubilidade(c, T1) - solubilidade(c, T2)) * massaAgua) / 100)
}

/** Sal que cristaliza ao evaporar `massaEvaporada` g de água de uma solução saturada à temperatura T. */
export const precipitadoPorEvaporacao = (c: CurvaSol, T: number, massaEvaporada: number) => (solubilidade(c, T) * massaEvaporada) / 100

/** Massa de solução saturada que contém `massaAgua` g de água a T. */
export const massaSolucaoSaturada = (c: CurvaSol, T: number, massaAgua: number) => massaAgua + (solubilidade(c, T) * massaAgua) / 100
