/* ======================================================================
   Genética mendeliana: gametas, cruzamentos, razões, ABO/Rh, ligação gênica,
   herança ligada ao X e equilíbrio de Hardy-Weinberg.
   As probabilidades são frações exatas (sem erro de arredondamento).
   ====================================================================== */

/* ------------------------------------------------------------------ frações */

export interface Fracao {
  n: number
  d: number
}

const mdc = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mdc(b, a % b))

export function fracao(n: number, d = 1): Fracao {
  if (d === 0) throw new Error('denominador zero')
  const g = mdc(n, d) || 1
  const s = d < 0 ? -1 : 1
  return { n: (s * n) / g, d: (s * d) / g }
}

export const somar = (a: Fracao, b: Fracao) => fracao(a.n * b.d + b.n * a.d, a.d * b.d)
export const multiplicar = (a: Fracao, b: Fracao) => fracao(a.n * b.n, a.d * b.d)
export const valor = (a: Fracao) => a.n / a.d
export const porcento = (a: Fracao) => (100 * a.n) / a.d
export const ZERO = fracao(0)
export const UM = fracao(1)
export const textoFracao = (a: Fracao) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`)

/* ------------------------------------------------------------------ genótipos de vários genes */

/** Um genótipo é uma lista de pares de alelos, um por gene, por exemplo "AaBb". Dentro de cada par, o alelo maiúsculo vem primeiro. */
export function normalizar(genotipo: string): string {
  const pares = genotipo.match(/../g) ?? []
  return pares
    .map((p) => {
      const [a, b] = [p.charAt(0), p.charAt(1)]
      return a === a.toUpperCase() && b !== b.toUpperCase() ? a + b : b === b.toUpperCase() && a !== a.toUpperCase() ? b + a : a <= b ? a + b : b + a
    })
    .join('')
}

/** Gametas de um genótipo (genes de cromossomos diferentes, com segregação independente), com sua probabilidade. */
export function gametas(genotipo: string): Map<string, Fracao> {
  const pares = normalizar(genotipo).match(/../g) ?? []
  let atual = new Map<string, Fracao>([['', UM]])
  for (const par of pares) {
    const proximo = new Map<string, Fracao>()
    const a = par.charAt(0)
    const b = par.charAt(1)
    for (const [g, p] of atual) {
      const metade = multiplicar(p, fracao(1, 2))
      for (const al of [a, b]) {
        const chave = g + al
        proximo.set(chave, somar(proximo.get(chave) ?? ZERO, metade))
      }
    }
    atual = proximo
  }
  return atual
}

/** Resultado de um cruzamento: probabilidade de cada genótipo da prole. */
export function cruzar(pai: string, mae: string): Map<string, Fracao> {
  const saida = new Map<string, Fracao>()
  for (const [gp, pp] of gametas(pai))
    for (const [gm, pm] of gametas(mae)) {
      // combina alelo a alelo, gene por gene
      let genotipo = ''
      for (let i = 0; i < gp.length; i++) genotipo += gp.charAt(i) + gm.charAt(i)
      const g = normalizar(genotipo)
      saida.set(g, somar(saida.get(g) ?? ZERO, multiplicar(pp, pm)))
    }
  return saida
}

export type Dominancia = 'completa' | 'incompleta'

/** Fenótipo de um gene com dominância completa (Aa → dominante) ou incompleta (Aa → intermediário). */
export function fenotipoGene(par: string, modo: Dominancia = 'completa'): 'dominante' | 'intermediario' | 'recessivo' {
  const a = par.charAt(0)
  const b = par.charAt(1)
  const dominantes = [a, b].filter((x) => x === x.toUpperCase()).length
  if (dominantes === 2) return 'dominante'
  if (dominantes === 0) return 'recessivo'
  return modo === 'completa' ? 'dominante' : 'intermediario'
}

/** Fenótipo do genótipo (um rótulo por gene, por exemplo "dominante,recessivo"). */
export function fenotipo(genotipo: string, modo: Dominancia = 'completa'): string {
  return (normalizar(genotipo).match(/../g) ?? []).map((p) => fenotipoGene(p, modo)).join(',')
}

/** Distribuição de fenótipos da prole. */
export function distribuicaoFenotipos(pai: string, mae: string, modo: Dominancia = 'completa'): Map<string, Fracao> {
  const saida = new Map<string, Fracao>()
  for (const [g, p] of cruzar(pai, mae)) {
    const f = fenotipo(g, modo)
    saida.set(f, somar(saida.get(f) ?? ZERO, p))
  }
  return saida
}

/** Razão inteira mínima entre as probabilidades (por exemplo, 9:3:3:1), da maior para a menor. */
export function razao(dist: Map<string, Fracao>): number[] {
  const valores = [...dist.values()]
  const den = valores.reduce((m, f) => (m * f.d) / mdc(m, f.d), 1)
  const inteiros = valores.map((f) => (f.n * den) / f.d)
  const g = inteiros.reduce((m, x) => mdc(m, x), 0) || 1
  return inteiros.map((x) => x / g).sort((a, b) => b - a)
}

/** Probabilidade de a prole ter um dado genótipo. */
export function probGenotipo(pai: string, mae: string, genotipo: string): Fracao {
  return cruzar(pai, mae).get(normalizar(genotipo)) ?? ZERO
}

/** Probabilidade de a prole ter um fenótipo (rótulos por gene, na mesma ordem dos genes). */
export function probFenotipo(pai: string, mae: string, rotulo: string, modo: Dominancia = 'completa'): Fracao {
  return distribuicaoFenotipos(pai, mae, modo).get(rotulo) ?? ZERO
}

/** Número de tipos de gametas de um genótipo: 2 elevado ao número de genes heterozigotos. */
export const tiposDeGametas = (genotipo: string) => gametas(genotipo).size

/* ------------------------------------------------------------------ genes ligados */

export interface GametasLigados {
  /** gametas parentais (mantêm as combinações da geração anterior) */
  parentais: [string, string]
  /** gametas recombinantes (formados por crossing-over) */
  recombinantes: [string, string]
  /** frequência de cada gameta */
  freq: Map<string, number>
}

/**
 * Gametas de um duplo-heterozigoto com os genes no mesmo cromossomo.
 * `cis`: AB/ab (os dominantes juntos); `trans`: Ab/aB. `r` é a taxa de recombinação (0 a 0,5).
 */
export function gametasLigados(r: number, arranjo: 'cis' | 'trans'): GametasLigados {
  const parentais: [string, string] = arranjo === 'cis' ? ['AB', 'ab'] : ['Ab', 'aB']
  const recombinantes: [string, string] = arranjo === 'cis' ? ['Ab', 'aB'] : ['AB', 'ab']
  const freq = new Map<string, number>()
  for (const g of parentais) freq.set(g, (1 - r) / 2)
  for (const g of recombinantes) freq.set(g, r / 2)
  return { parentais, recombinantes, freq }
}

/** Distribuição fenotípica do cruzamento duplo-heterozigoto ligado × aabb (cruzamento-teste). */
export function cruzamentoTesteLigado(r: number, arranjo: 'cis' | 'trans') {
  const { freq } = gametasLigados(r, arranjo)
  const fen = (g: string) => (g === 'AB' ? 'A_B_' : g === 'Ab' ? 'A_bb' : g === 'aB' ? 'aaB_' : 'aabb')
  const saida = new Map<string, number>()
  for (const [g, f] of freq) saida.set(fen(g), (saida.get(fen(g)) ?? 0) + f)
  return saida
}

/** Duplo-heterozigoto ligado × duplo-heterozigoto ligado: probabilidade de cada fenótipo (A_B_, A_bb, aaB_, aabb). */
export function autocruzamentoLigado(r: number, arranjo: 'cis' | 'trans') {
  const { freq } = gametasLigados(r, arranjo)
  const saida = new Map<string, number>([
    ['A_B_', 0],
    ['A_bb', 0],
    ['aaB_', 0],
    ['aabb', 0],
  ])
  for (const [g1, f1] of freq)
    for (const [g2, f2] of freq) {
      const aDom = g1.charAt(0) === 'A' || g2.charAt(0) === 'A'
      const bDom = g1.charAt(1) === 'B' || g2.charAt(1) === 'B'
      const chave = `${aDom ? 'A_' : 'aa'}${bDom ? 'B_' : 'bb'}`
      saida.set(chave, (saida.get(chave) ?? 0) + f1 * f2)
    }
  return saida
}

/** Distância entre genes em centimorgans: 1 cM = 1 % de recombinantes. */
export const distanciaCM = (recombinantes: number, total: number) => (100 * recombinantes) / total

/* ------------------------------------------------------------------ grupos sanguíneos */

export type Aglutinogenio = 'A' | 'B'
export type TipoABO = 'A' | 'B' | 'AB' | 'O'
export type TipoSangue = { abo: TipoABO; rh: '+' | '-' }

/** Genótipos ABO possíveis para cada tipo (alelos Iᴬ = A, Iᴮ = B, i = O). */
export const GENOTIPOS_ABO: Record<TipoABO, string[]> = { A: ['AA', 'AO'], B: ['BB', 'BO'], AB: ['AB'], O: ['OO'] }

export function tipoDoGenotipoABO(g: string): TipoABO {
  const temA = g.includes('A')
  const temB = g.includes('B')
  return temA && temB ? 'AB' : temA ? 'A' : temB ? 'B' : 'O'
}

/** Probabilidade de cada tipo ABO na prole de dois genótipos ABO. */
export function prole(abo1: string, abo2: string): Map<TipoABO, Fracao> {
  const saida = new Map<TipoABO, Fracao>()
  for (const a of abo1)
    for (const b of abo2) {
      const t = tipoDoGenotipoABO(a + b)
      saida.set(t, somar(saida.get(t) ?? ZERO, fracao(1, 4)))
    }
  return saida
}

/** Tipos ABO que a prole pode ter, sabendo apenas os tipos dos pais (considera todos os genótipos possíveis de cada um). */
export function tiposPossiveisDosFilhos(pai: TipoABO, mae: TipoABO): Set<TipoABO> {
  const saida = new Set<TipoABO>()
  for (const gp of GENOTIPOS_ABO[pai]) for (const gm of GENOTIPOS_ABO[mae]) for (const t of prole(gp, gm).keys()) saida.add(t)
  return saida
}

/** Aglutinogênios (antígenos) presentes nas hemácias de cada tipo. */
export const aglutinogenios = (t: TipoABO): Aglutinogenio[] => (t === 'AB' ? ['A', 'B'] : t === 'O' ? [] : [t])

/** Aglutininas (anticorpos) presentes no plasma: contra os aglutinogênios que a pessoa não tem. */
export const aglutininas = (t: TipoABO): Aglutinogenio[] => (['A', 'B'] as const).filter((x) => !aglutinogenios(t).includes(x))

/**
 * Transfusão de hemácias: o receptor não pode ter anticorpos contra nenhum antígeno do doador.
 * Anti-Rh só existe em pessoas Rh− que foram sensibilizadas; aqui, considera-se a regra prática: doador Rh+ só para receptor Rh+.
 */
export function podeReceber(doador: TipoSangue, receptor: TipoSangue): boolean {
  const abo = aglutinogenios(doador.abo).every((x) => aglutinogenios(receptor.abo).includes(x))
  const rh = !(doador.rh === '+' && receptor.rh === '-')
  return abo && rh
}

export const TIPOS_ABO: TipoABO[] = ['A', 'B', 'AB', 'O']
export const rotuloSangue = (t: TipoSangue) => `${t.abo}${t.rh === '+' ? '+' : '−'}`

/** Doadores compatíveis com um receptor. */
export function doadoresCompativeis(receptor: TipoSangue): TipoSangue[] {
  const todos: TipoSangue[] = TIPOS_ABO.flatMap((abo) => (['+', '-'] as const).map((rh) => ({ abo, rh })))
  return todos.filter((d) => podeReceber(d, receptor))
}

/**
 * Risco de eritroblastose fetal (doença hemolítica do recém-nascido): mãe Rh− e feto Rh+ (pai Rh+ pode transmitir o alelo D).
 * Devolve a probabilidade de a criança ser Rh+ quando a mãe é Rh−: depende do genótipo do pai (DD, Dd, dd).
 */
export function probFilhoRhPositivo(paiGenotipo: 'DD' | 'Dd' | 'dd', maeGenotipo: 'DD' | 'Dd' | 'dd' = 'dd'): Fracao {
  let p = ZERO
  for (const [g, f] of cruzar(paiGenotipo, maeGenotipo)) if (g.includes('D')) p = somar(p, f)
  return p
}

/* ------------------------------------------------------------------ herança ligada ao X */

export type GenotipoX = 'XAXA' | 'XAXa' | 'XaXa' | 'XAY' | 'XaY'

/** Prole de um cruzamento com um gene no cromossomo X (pai: XAY ou XaY; mãe: XAXA, XAXa ou XaXa). */
export function proleX(pai: 'XAY' | 'XaY', mae: 'XAXA' | 'XAXa' | 'XaXa'): { genotipo: GenotipoX; sexo: 'F' | 'M'; p: Fracao }[] {
  const gamPai = pai === 'XAY' ? ['XA', 'Y'] : ['Xa', 'Y']
  const gamMae = mae === 'XAXA' ? ['XA', 'XA'] : mae === 'XAXa' ? ['XA', 'Xa'] : ['Xa', 'Xa']
  const mapa = new Map<string, { genotipo: GenotipoX; sexo: 'F' | 'M'; p: Fracao }>()
  for (const gp of gamPai)
    for (const gm of gamMae) {
      let genotipo: string
      let sexo: 'F' | 'M'
      if (gp === 'Y') {
        genotipo = `${gm}Y`
        sexo = 'M'
      } else {
        sexo = 'F'
        genotipo = gm === 'XA' && gp === 'XA' ? 'XAXA' : gm === 'Xa' && gp === 'Xa' ? 'XaXa' : 'XAXa'
      }
      const ant = mapa.get(genotipo)
      mapa.set(genotipo, { genotipo: genotipo as GenotipoX, sexo, p: somar(ant?.p ?? ZERO, fracao(1, 4)) })
    }
  return [...mapa.values()]
}

/** O alelo recessivo ligado ao X (a) se expressa em XaXa e em XaY. */
export const afetadoXR = (g: GenotipoX) => g === 'XaXa' || g === 'XaY'

/** Probabilidade de a criança (de qualquer sexo, ou de um sexo dado) ser afetada. */
export function probAfetadoXR(pai: 'XAY' | 'XaY', mae: 'XAXA' | 'XAXa' | 'XaXa', sexo?: 'F' | 'M'): Fracao {
  const lista = proleX(pai, mae).filter((x) => !sexo || x.sexo === sexo)
  const total = lista.reduce((s, x) => somar(s, x.p), ZERO)
  const afetados = lista.filter((x) => afetadoXR(x.genotipo)).reduce((s, x) => somar(s, x.p), ZERO)
  return fracao(afetados.n * total.d, afetados.d * total.n)
}

/* ------------------------------------------------------------------ Hardy-Weinberg */

export interface FreqGenotipos {
  p: number // freq. de A
  q: number // freq. de a
  AA: number
  Aa: number
  aa: number
}

/** Frequências genotípicas esperadas no equilíbrio, a partir da frequência q do alelo recessivo. */
export function hardyWeinberg(q: number): FreqGenotipos {
  const p = 1 - q
  return { p, q, AA: p * p, Aa: 2 * p * q, aa: q * q }
}

/** Frequência do alelo recessivo a partir da frequência de afetados (q² no equilíbrio). */
export const qDeAfetados = (freqAa: number) => Math.sqrt(freqAa)

/** Equilíbrio de Hardy-Weinberg para genes ligados ao X: homens afetados q, mulheres afetadas q². */
export function hardyWeinbergX(q: number) {
  const p = 1 - q
  return { homensAfetados: q, mulheresAfetadas: q * q, mulheresPortadoras: 2 * p * q, mulheresNormais: p * p, homensNormais: p }
}

/** Frequência de alelos a partir de contagens de genótipos. */
export function freqAlelicaDeContagens(AA: number, Aa: number, aa: number): { p: number; q: number } {
  const n = 2 * (AA + Aa + aa)
  return { p: (2 * AA + Aa) / n, q: (2 * aa + Aa) / n }
}

/** A população está em equilíbrio quando as frequências observadas coincidem com as esperadas (p², 2pq, q²). */
export function emEquilibrio(AA: number, Aa: number, aa: number, tolerancia = 1e-9): boolean {
  const total = AA + Aa + aa
  const { q } = freqAlelicaDeContagens(AA, Aa, aa)
  const e = hardyWeinberg(q)
  return Math.abs(AA / total - e.AA) < tolerancia && Math.abs(Aa / total - e.Aa) < tolerancia && Math.abs(aa / total - e.aa) < tolerancia
}

/* ------------------------------------------------------------------ herança quantitativa (poligênica aditiva) */

/** Probabilidade de cada número de alelos "aditivos" (0 a 2n) na prole de dois duplo-heterozigotos para n genes: binomial(2n, 1/2). */
export function distribuicaoPoligenica(n: number): Fracao[] {
  const total = 2 * n
  const binom = (k: number) => {
    let r = 1
    for (let i = 1; i <= k; i++) r = (r * (total - k + i)) / i
    return Math.round(r)
  }
  return Array.from({ length: total + 1 }, (_, k) => fracao(binom(k), 2 ** total))
}

/** Número de classes fenotípicas com n genes de efeito aditivo (todos os pares heterozigotos e sem dominância): 2n + 1. */
export const classesPoligenicas = (n: number) => 2 * n + 1
