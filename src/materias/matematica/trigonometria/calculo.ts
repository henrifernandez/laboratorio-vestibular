export const ANGULOS_NOTAVEIS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360] as const

export const grausParaRad = (g: number) => (g * Math.PI) / 180
export const radParaGraus = (r: number) => (r * 180) / Math.PI

const mdc = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mdc(b, a % b))

/** Ângulo (graus inteiros) escrito como fração de π: 150 → "5π/6". */
export function textoRad(graus: number): string {
  if (graus === 0) return '0'
  const g = mdc(Math.abs(graus), 180)
  const num = Math.abs(graus) / g
  const den = 180 / g
  const sinal = graus < 0 ? '−' : ''
  return `${sinal}${num === 1 ? '' : num}π${den === 1 ? '' : `/${den}`}`
}

export const normalizar = (graus: number) => ((graus % 360) + 360) % 360

/** 1 a 4; 0 quando o ângulo está sobre um eixo. */
export function quadrante(graus: number): 0 | 1 | 2 | 3 | 4 {
  const a = normalizar(graus)
  if (a % 90 === 0) return 0
  return (Math.floor(a / 90) + 1) as 1 | 2 | 3 | 4
}

/** Ângulo correspondente no 1º quadrante (para usar a tabela dos notáveis). */
export function referencia(graus: number): number {
  const a = normalizar(graus)
  if (a <= 90) return a
  if (a <= 180) return 180 - a
  if (a <= 270) return a - 180
  return 360 - a
}

export type Sinal = '+' | '−'

export function sinais(q: 1 | 2 | 3 | 4): { sen: Sinal; cos: Sinal; tan: Sinal } {
  switch (q) {
    case 1:
      return { sen: '+', cos: '+', tan: '+' }
    case 2:
      return { sen: '+', cos: '−', tan: '−' }
    case 3:
      return { sen: '−', cos: '−', tan: '+' }
    case 4:
      return { sen: '−', cos: '+', tan: '−' }
  }
}

interface Mag {
  texto: string
  num: number
}

const MAG_SEN: Record<number, Mag> = {
  0: { texto: '0', num: 0 },
  30: { texto: '1/2', num: 0.5 },
  45: { texto: '√2/2', num: Math.SQRT2 / 2 },
  60: { texto: '√3/2', num: Math.sqrt(3) / 2 },
  90: { texto: '1', num: 1 },
}
const MAG_COS: Record<number, Mag> = { 0: MAG_SEN[90] as Mag, 30: MAG_SEN[60] as Mag, 45: MAG_SEN[45] as Mag, 60: MAG_SEN[30] as Mag, 90: MAG_SEN[0] as Mag }
const MAG_TAN: Record<number, Mag> = {
  0: { texto: '0', num: 0 },
  30: { texto: '√3/3', num: Math.sqrt(3) / 3 },
  45: { texto: '1', num: 1 },
  60: { texto: '√3', num: Math.sqrt(3) },
}

export interface Valor {
  existe: boolean
  texto: string
  num: number
}

/** Valor exato de sen, cos ou tan de um ângulo múltiplo de 30° ou 45°, em qualquer volta. */
export function exato(fn: 'sen' | 'cos' | 'tan', graus: number): Valor {
  const a = normalizar(graus)
  const ref = referencia(a)
  const q = quadrante(a)
  if (fn === 'tan') {
    if (a % 180 === 90) return { existe: false, texto: 'não existe', num: NaN }
    const m = MAG_TAN[ref] as Mag
    if (m.num === 0) return { existe: true, texto: '0', num: 0 }
    const neg = q === 2 || q === 4
    return { existe: true, texto: `${neg ? '−' : ''}${m.texto}`, num: neg ? -m.num : m.num }
  }
  const m = (fn === 'sen' ? MAG_SEN : MAG_COS)[ref] as Mag
  if (m.num === 0) return { existe: true, texto: '0', num: 0 }
  // sobre os eixos o sinal vem direto do ponto do círculo; fora deles, do quadrante
  const neg = q === 0 ? (fn === 'sen' ? a === 270 : a === 180) : sinais(q)[fn] === '−'
  return { existe: true, texto: `${neg ? '−' : ''}${m.texto}`, num: neg ? -m.num : m.num }
}
