export interface Pt {
  x: number
  y: number
}

export interface Geral {
  a: number
  b: number
  c: number
}

export interface Reta {
  vertical: boolean
  m?: number
  n?: number
  geral: Geral
}

export const distancia = (p: Pt, q: Pt) => Math.hypot(q.x - p.x, q.y - p.y)
export const pontoMedio = (p: Pt, q: Pt): Pt => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 })

const mdc = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mdc(b, a % b))
const EPS = 1e-9
const ehInteiro = (x: number) => Math.abs(x - Math.round(x)) < EPS

/** Reta pelos pontos p e q (que não podem coincidir). A equação geral sai com inteiros primos entre si quando possível. */
export function reta(p: Pt, q: Pt): Reta {
  if (Math.abs(p.x - q.x) < EPS && Math.abs(p.y - q.y) < EPS) throw new Error('pontos coincidentes não definem uma reta')
  let a = p.y - q.y
  let b = q.x - p.x
  let c = p.x * q.y - q.x * p.y
  if ([a, b, c].every(ehInteiro)) {
    const g = mdc(mdc(Math.round(a), Math.round(b)), Math.round(c)) || 1
    a = Math.round(a) / g
    b = Math.round(b) / g
    c = Math.round(c) / g
  }
  // sinal: a > 0; se a = 0, b > 0
  if (a < 0 || (Math.abs(a) < EPS && b < 0)) {
    a = -a
    b = -b
    c = -c
  }
  const geral = { a: a + 0, b: b + 0, c: c + 0 }
  if (Math.abs(b) < EPS) return { vertical: true, geral }
  const m = -a / b
  const n = -c / b
  return { vertical: false, m: m + 0, n: n + 0, geral }
}

const num = (x: number) => String(Math.round(x * 1000) / 1000).replace('.', ',')

/** 0,75 → "3/4"; 2 → "2". */
export function fracaoTxt(x: number): string {
  const neg = x < 0 ? '−' : ''
  const ax = Math.abs(x)
  if (ehInteiro(ax)) return `${neg}${Math.round(ax)}`
  for (let den = 2; den <= 12; den++) {
    const nu = ax * den
    if (ehInteiro(nu)) return `${neg}${Math.round(nu)}/${den}`
  }
  return `${neg}${num(ax)}`
}

export function textoReduzida(m: number, n: number): string {
  let termoX = ''
  if (Math.abs(m) > EPS) {
    const ehFrac = !ehInteiro(m)
    const abs = Math.abs(m)
    const coef = abs === 1 ? '' : ehFrac ? `(${fracaoTxt(abs)})` : String(Math.round(abs))
    termoX = `${m < 0 ? '−' : ''}${coef}x`
  }
  if (Math.abs(n) < EPS) return termoX ? `y = ${termoX}` : 'y = 0'
  const nn = fracaoTxt(Math.abs(n))
  if (!termoX) return `y = ${n < 0 ? '−' : ''}${nn}`
  return `y = ${termoX} ${n < 0 ? '−' : '+'} ${nn}`
}

export function textoGeral({ a, b, c }: Geral): string {
  const partes: string[] = []
  const termo = (coef: number, v: string) => {
    if (Math.abs(coef) < EPS) return
    const abs = Math.abs(coef)
    const t = `${abs === 1 ? '' : fracaoTxt(abs)}${v}`
    partes.push(partes.length === 0 ? `${coef < 0 ? '−' : ''}${t}` : `${coef < 0 ? '−' : '+'} ${t}`)
  }
  termo(a, 'x')
  termo(b, 'y')
  if (Math.abs(c) > EPS) partes.push(`${partes.length === 0 ? (c < 0 ? '−' : '') : c < 0 ? '− ' : '+ '}${fracaoTxt(Math.abs(c))}`)
  return `${partes.join(' ')} = 0`
}

export function distPontoReta(p: Pt, { a, b, c }: Geral): number {
  return Math.abs(a * p.x + b * p.y + c) / Math.hypot(a, b)
}

// ---------------------------------------------------------------- circunferência

const termoCirc = (v: 'x' | 'y', h: number) => {
  if (Math.abs(h) < EPS) return `${v}²`
  return `(${v} ${h > 0 ? '−' : '+'} ${fracaoTxt(Math.abs(h))})²`
}

export function eqReduzidaCirc(h: number, k: number, r: number): string {
  return `${termoCirc('x', h)} + ${termoCirc('y', k)} = ${fracaoTxt(r * r)}`
}

export function eqGeralCirc(h: number, k: number, r: number): string {
  const partes = ['x² + y²']
  const linha = (coef: number, v: string) => {
    if (Math.abs(coef) < EPS) return
    const abs = Math.abs(coef)
    partes.push(`${coef < 0 ? '−' : '+'} ${abs === 1 ? '' : fracaoTxt(abs)}${v}`)
  }
  linha(-2 * h, 'x')
  linha(-2 * k, 'y')
  const c = h * h + k * k - r * r
  if (Math.abs(c) > EPS) partes.push(`${c < 0 ? '−' : '+'} ${fracaoTxt(Math.abs(c))}`)
  return `${partes.join(' ')} = 0`
}

export type PosicaoPonto = 'dentro' | 'sobre' | 'fora'
export type PosicaoReta = 'secante' | 'tangente' | 'externa'

export function posicaoPontoCirc(p: Pt, centro: Pt, r: number): PosicaoPonto {
  const d2 = (p.x - centro.x) ** 2 + (p.y - centro.y) ** 2
  const r2 = r * r
  if (Math.abs(d2 - r2) < 1e-9) return 'sobre'
  return d2 < r2 ? 'dentro' : 'fora'
}

/** Compara (a·h + b·k + c)² com r²·(a² + b²): evita raiz quadrada e erros de arredondamento. */
export function posicaoRetaCirc({ a, b, c }: Geral, centro: Pt, r: number): PosicaoReta {
  const num2 = (a * centro.x + b * centro.y + c) ** 2
  const den = r * r * (a * a + b * b)
  if (Math.abs(num2 - den) < 1e-9) return 'tangente'
  return num2 < den ? 'secante' : 'externa'
}

export function relacaoRetas(m1: number, m2: number): 'paralelas' | 'perpendiculares' | 'concorrentes' {
  if (Math.abs(m1 - m2) < EPS) return 'paralelas'
  if (Math.abs(m1 * m2 + 1) < EPS) return 'perpendiculares'
  return 'concorrentes'
}
