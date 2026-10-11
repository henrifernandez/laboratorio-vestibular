export type Funcao =
  | { tipo: 'afim'; a: number; b: number } // ax + b
  | { tipo: 'quadratica'; a: number; b: number; c: number } // ax² + bx + c
  | { tipo: 'exponencial'; a: number; base: number; k: number } // a·base^x + k
  | { tipo: 'logaritmica'; a: number; base: number; k: number } // a·log_base(x) + k

export type Familia = Funcao['tipo']

export const NOMES_FAMILIA: Record<Familia, string> = {
  afim: 'Afim',
  quadratica: 'Quadrática',
  exponencial: 'Exponencial',
  logaritmica: 'Logarítmica',
}

export function avaliar(f: Funcao, x: number): number {
  switch (f.tipo) {
    case 'afim':
      return f.a * x + f.b
    case 'quadratica':
      return f.a * x * x + f.b * x + f.c
    case 'exponencial':
      return f.a * Math.pow(f.base, x) + f.k
    case 'logaritmica':
      return x > 0 ? (f.a * Math.log(x)) / Math.log(f.base) + f.k : NaN
  }
}

export interface Caracteristicas {
  raizes: number[]
  interceptoY: number | null
  crescimento: 'crescente' | 'decrescente' | 'constante' | 'misto'
  delta?: number
  vertice?: { x: number; y: number }
  concavidade?: 'cima' | 'baixo'
  assintota?: { tipo: 'horizontal' | 'vertical'; valor: number }
}

const arredonda = (n: number) => Math.round(n * 1e9) / 1e9

export function caracteristicas(f: Funcao): Caracteristicas {
  switch (f.tipo) {
    case 'afim':
      return {
        raizes: f.a === 0 ? [] : [arredonda(-f.b / f.a)],
        interceptoY: f.b,
        crescimento: f.a > 0 ? 'crescente' : f.a < 0 ? 'decrescente' : 'constante',
      }
    case 'quadratica': {
      const delta = f.b * f.b - 4 * f.a * f.c
      const xv = -f.b / (2 * f.a)
      let raizes: number[] = []
      if (delta === 0) raizes = [arredonda(xv)]
      else if (delta > 0) {
        const r = Math.sqrt(delta)
        raizes = [arredonda((-f.b - r) / (2 * f.a)), arredonda((-f.b + r) / (2 * f.a))].sort((p, q) => p - q)
      }
      return {
        raizes,
        interceptoY: f.c,
        crescimento: 'misto',
        delta,
        vertice: { x: arredonda(xv), y: arredonda(-delta / (4 * f.a)) },
        concavidade: f.a > 0 ? 'cima' : 'baixo',
      }
    }
    case 'exponencial': {
      const razao = -f.k / f.a
      const sobe = f.a > 0 === f.base > 1
      return {
        raizes: razao > 0 ? [arredonda(Math.log(razao) / Math.log(f.base))] : [],
        interceptoY: f.a + f.k,
        crescimento: sobe ? 'crescente' : 'decrescente',
        assintota: { tipo: 'horizontal', valor: f.k },
      }
    }
    case 'logaritmica': {
      const sobe = f.a > 0 === f.base > 1
      return {
        raizes: [arredonda(Math.pow(f.base, -f.k / f.a))],
        interceptoY: null,
        crescimento: sobe ? 'crescente' : 'decrescente',
        assintota: { tipo: 'vertical', valor: 0 },
      }
    }
  }
}

// ---------- texto ----------

const num = (n: number) => String(Math.round(n * 100) / 100)

/** coeficiente seguido de um fator (ex.: 'x'); omite o 1 e usa só o sinal para -1 */
function termo(coef: number, fator: string): string {
  if (coef === 1) return fator
  if (coef === -1) return `-${fator}`
  return `${num(coef)}${fator}`
}

function somar(partes: [number, string][]): string {
  let s = ''
  for (const [c, texto] of partes) {
    if (c === 0) continue
    if (s === '') s = texto
    else s += c < 0 ? ` - ${texto.replace(/^-/, '')}` : ` + ${texto}`
  }
  return s === '' ? '0' : s
}

function montarTexto(f: Funcao, tex: boolean): string {
  switch (f.tipo) {
    case 'afim':
      return somar([
        [f.a, termo(f.a, 'x')],
        [f.b, num(f.b)],
      ])
    case 'quadratica':
      return somar([
        [f.a, termo(f.a, tex ? 'x^{2}' : 'x^2')],
        [f.b, termo(f.b, 'x')],
        [f.c, num(f.c)],
      ])
    case 'exponencial': {
      const p = tex ? `${num(f.base)}^{x}` : `${num(f.base)}^x`
      const mult = tex ? ' \\cdot ' : '*'
      return somar([
        [f.a, f.a === 1 ? p : f.a === -1 ? `-${p}` : `${num(f.a)}${mult}${p}`],
        [f.k, num(f.k)],
      ])
    }
    case 'logaritmica': {
      const l = tex ? `\\log_{${num(f.base)}} x` : `log(x, ${num(f.base)})`
      const mult = tex ? ' \\cdot ' : '*'
      return somar([
        [f.a, f.a === 1 ? l : f.a === -1 ? `-${l}` : `${num(f.a)}${mult}${l}`],
        [f.k, num(f.k)],
      ])
    }
  }
}

/** Texto que o mathjs consegue interpretar (ex.: "2x - 4"). */
export function formulaTexto(f: Funcao): string {
  return montarTexto(f, false)
}

export function formulaTex(f: Funcao): string {
  return `f(x) = ${montarTexto(f, true)}`
}

// ---------- sinal ----------

interface Intervalo {
  de: number | null
  ate: number | null
  sinal: '+' | '-'
}

/** Intervalos em que a função é positiva ou negativa (null = sem limite). A logarítmica só existe para x > 0. */
export function intervalosDeSinal(f: Funcao): Intervalo[] {
  const limiteEsq = f.tipo === 'logaritmica' ? 0 : null
  const raizes = caracteristicas(f).raizes
  const cortes: (number | null)[] = [limiteEsq, ...raizes, null]
  const saida: Intervalo[] = []
  for (let i = 0; i < cortes.length - 1; i++) {
    const de = cortes[i] as number | null
    const ate = cortes[i + 1] as number | null
    const teste = de === null && ate === null ? 0 : de === null ? (ate as number) - 1 : ate === null ? de + 1 : (de + ate) / 2
    const y = avaliar(f, teste)
    const sinal = y > 0 ? '+' : '-'
    const ultimo = saida[saida.length - 1]
    if (ultimo && ultimo.sinal === sinal && ultimo.ate === de) ultimo.ate = ate
    else saida.push({ de, ate, sinal })
  }
  return saida
}

function textoIntervalo(i: Intervalo, comLimiteZero: boolean): string {
  const fmtN = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
  if (i.de === null && i.ate !== null) return `x < ${fmtN(i.ate)}`
  if (i.de !== null && i.ate === null) return `x > ${fmtN(i.de)}`
  if (i.de !== null && i.ate !== null) return `${fmtN(i.de)} < x < ${fmtN(i.ate)}`
  return comLimiteZero ? 'x > 0' : 'todo x'
}

export function textoSinal(f: Funcao): string {
  const ints = intervalosDeSinal(f)
  const log = f.tipo === 'logaritmica'
  if (ints.length === 1) return `sempre ${ints[0]!.sinal === '+' ? 'positiva' : 'negativa'}`
  const grupo = (s: '+' | '-') => {
    const partes = ints.filter((i) => i.sinal === s).map((i) => textoIntervalo(i, log))
    if (partes.length === 0) return null
    return `${s === '+' ? 'positiva' : 'negativa'} para ${partes.map((p, k) => (k === 0 ? p : `e para ${p}`)).join(' ')}`
  }
  return [grupo('+'), grupo('-')].filter(Boolean).join('; ')
}
