import type { Familia, Funcao } from './modelo'

/** Estado único do laboratório: gráfico, equação, tabela e sliders leem e escrevem aqui. */
export interface EstadoLab {
  familia: Familia
  a: number
  b: number
  c: number
  base: number
  k: number
}

export const PADRAO: Record<Familia, EstadoLab> = {
  afim: { familia: 'afim', a: 1, b: 1, c: 0, base: 2, k: 0 },
  quadratica: { familia: 'quadratica', a: 1, b: -2, c: -3, base: 2, k: 0 },
  exponencial: { familia: 'exponencial', a: 1, base: 2, k: 0, b: 0, c: 0 },
  logaritmica: { familia: 'logaritmica', a: 1, base: 2, k: 0, b: 0, c: 0 },
}

export const LIMITES = {
  a: [-4, 4],
  b: [-8, 8],
  c: [-8, 8],
  k: [-8, 8],
  base: [0.2, 5],
} as const

const FAMILIAS: Familia[] = ['afim', 'quadratica', 'exponencial', 'logaritmica']
const CHAVES = ['a', 'b', 'c', 'base', 'k'] as const

const corta = (v: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, v))

/** Pular a base 1 (que não é uma exponencial nem um logaritmo de verdade). */
export function normalizarBase(novo: number, anterior: number): number {
  if (Math.abs(novo - 1) > 1e-9) return novo
  return Math.round((anterior < 1 ? anterior + 0.2 : 0.9) * 100) / 100
}

export function paraFuncao(e: EstadoLab): Funcao {
  switch (e.familia) {
    case 'afim':
      return { tipo: 'afim', a: e.a, b: e.b }
    case 'quadratica':
      return e.a === 0 ? { tipo: 'afim', a: e.b, b: e.c } : { tipo: 'quadratica', a: e.a, b: e.b, c: e.c }
    case 'exponencial':
      return Math.abs(e.base - 1) < 1e-9 ? { tipo: 'afim', a: 0, b: e.a + e.k } : { tipo: 'exponencial', a: e.a, base: e.base, k: e.k }
    case 'logaritmica':
      return { tipo: 'logaritmica', a: e.a, base: Math.abs(e.base - 1) < 1e-9 ? 2 : e.base, k: e.k }
  }
}

export function lerEstado(params: URLSearchParams): EstadoLab {
  const f = params.get('f') as Familia | null
  const familia = f && FAMILIAS.includes(f) ? f : 'afim'
  const e: EstadoLab = { ...PADRAO[familia] }
  for (const k of CHAVES) {
    const bruto = params.get(k)
    if (bruto === null) continue
    const n = Number(bruto)
    if (bruto.trim() !== '' && Number.isFinite(n)) e[k] = corta(n, LIMITES[k])
  }
  return e
}

export function paraParams(e: EstadoLab): Record<string, string> {
  return { f: e.familia, a: String(e.a), b: String(e.b), c: String(e.c), base: String(e.base), k: String(e.k) }
}
