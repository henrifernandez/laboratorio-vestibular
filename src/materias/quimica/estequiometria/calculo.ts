import { lerFormula, massaMolar, type Contagem } from '../comum/elementos'

/** Uma equação química: reagentes e produtos com os coeficientes corretos. */
export interface Reacao {
  id: string
  reagentes: string[]
  produtos: string[]
  /** coeficientes na ordem [...reagentes, ...produtos], nas menores proporções inteiras */
  coefs: number[]
  /** nome comum, para os enunciados */
  nome: string
}

const mdc = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mdc(b, a % b))

/** Fração com inteiros pequenos (basta para sistemas de poucas espécies). */
type Fr = [number, number]
const norm = ([n, d]: Fr): Fr => {
  if (d < 0) [n, d] = [-n, -d]
  const g = mdc(n, d) || 1
  return [n / g, d / g]
}
const sub = (a: Fr, b: Fr): Fr => norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]])
const mul = (a: Fr, b: Fr): Fr => norm([a[0] * b[0], a[1] * b[1]])
const div = (a: Fr, b: Fr): Fr => norm([a[0] * b[1], a[1] * b[0]])

/**
 * Balanceia uma equação resolvendo o sistema "átomos à esquerda = átomos à direita"
 * (eliminação de Gauss com frações). Devolve as menores proporções inteiras ou null se não houver solução única.
 */
export function balancear(reagentes: string[], produtos: string[]): number[] | null {
  const especies = [...reagentes, ...produtos]
  const contagens = especies.map((f) => lerFormula(f))
  const elementos = [...new Set(contagens.flatMap((c) => Object.keys(c)))]
  const n = especies.length
  // linhas = elementos; colunas = espécies (reagente +, produto −)
  const m: Fr[][] = elementos.map((el) => contagens.map((c, j) => norm([(c[el] ?? 0) * (j < reagentes.length ? 1 : -1), 1])))
  const pivos: number[] = []
  let linha = 0
  for (let col = 0; col < n && linha < m.length; col++) {
    let p = linha
    while (p < m.length && (m[p] as Fr[])[col]![0] === 0) p++
    if (p === m.length) continue
    ;[m[linha], m[p]] = [m[p] as Fr[], m[linha] as Fr[]]
    const piv = (m[linha] as Fr[])[col] as Fr
    m[linha] = (m[linha] as Fr[]).map((x) => div(x, piv))
    for (let r = 0; r < m.length; r++) {
      if (r === linha) continue
      const fator = (m[r] as Fr[])[col] as Fr
      if (fator[0] === 0) continue
      m[r] = (m[r] as Fr[]).map((x, k) => sub(x, mul(fator, (m[linha] as Fr[])[k] as Fr)))
    }
    pivos.push(col)
    linha++
  }
  const livres = Array.from({ length: n }, (_, j) => j).filter((j) => !pivos.includes(j))
  if (livres.length !== 1) return null
  const livre = livres[0] as number
  const x: Fr[] = Array.from({ length: n }, () => [0, 1] as Fr)
  x[livre] = [1, 1]
  pivos.forEach((col, r) => {
    x[col] = norm([-(m[r] as Fr[])[livre]![0], (m[r] as Fr[])[livre]![1]])
  })
  // denominador comum e menores inteiros
  let mmc = 1
  for (const [, d] of x) mmc = (mmc * d) / mdc(mmc, d)
  let inteiros = x.map(([a, d]) => (a * mmc) / d)
  const g = inteiros.reduce((acc, v) => mdc(acc, v), 0)
  inteiros = inteiros.map((v) => v / g)
  if (inteiros.some((v) => v <= 0)) return null
  return inteiros
}

/** Átomos de cada elemento de um lado da equação, dados os coeficientes. */
export function contarLado(coefs: number[], formulas: string[]): Contagem {
  const total: Contagem = {}
  formulas.forEach((f, i) => {
    for (const [el, n] of Object.entries(lerFormula(f))) total[el] = (total[el] ?? 0) + n * (coefs[i] ?? 0)
  })
  return total
}

export interface BalancoElemento {
  elemento: string
  esquerda: number
  direita: number
}

export function balanco(r: Pick<Reacao, 'reagentes' | 'produtos'>, coefs: number[]): BalancoElemento[] {
  const nr = r.reagentes.length
  const esq = contarLado(coefs.slice(0, nr), r.reagentes)
  const dir = contarLado(coefs.slice(nr), r.produtos)
  const elementos = [...new Set([...Object.keys(esq), ...Object.keys(dir)])]
  return elementos.map((elemento) => ({ elemento, esquerda: esq[elemento] ?? 0, direita: dir[elemento] ?? 0 }))
}

export const estaBalanceada = (r: Pick<Reacao, 'reagentes' | 'produtos'>, coefs: number[]) =>
  coefs.every((c) => c > 0) && balanco(r, coefs).every((b) => b.esquerda === b.direita)

/* ------------------------------------------------------------------ biblioteca de reações */

const rx = (id: string, nome: string, reagentes: string[], produtos: string[], coefs: number[]): Reacao => ({ id, nome, reagentes, produtos, coefs })

export const REACOES: Reacao[] = [
  rx('agua', 'formação da água', ['H2', 'O2'], ['H2O'], [2, 1, 2]),
  rx('amonia', 'síntese da amônia', ['N2', 'H2'], ['NH3'], [1, 3, 2]),
  rx('so3', 'oxidação do dióxido de enxofre', ['SO2', 'O2'], ['SO3'], [2, 1, 2]),
  rx('peroxido', 'decomposição da água oxigenada', ['H2O2'], ['H2O', 'O2'], [2, 2, 1]),
  rx('calcario', 'decomposição do calcário', ['CaCO3'], ['CaO', 'CO2'], [1, 1, 1]),
  rx('clorato', 'decomposição do clorato de potássio', ['KClO3'], ['KCl', 'O2'], [2, 2, 3]),
  rx('mg-hcl', 'ataque do magnésio ao ácido clorídrico', ['Mg', 'HCl'], ['MgCl2', 'H2'], [1, 2, 1, 1]),
  rx('zn-hcl', 'ataque do zinco ao ácido clorídrico', ['Zn', 'HCl'], ['ZnCl2', 'H2'], [1, 2, 1, 1]),
  rx('na-agua', 'sódio com água', ['Na', 'H2O'], ['NaOH', 'H2'], [2, 2, 2, 1]),
  rx('ferro-o2', 'formação da ferrugem', ['Fe', 'O2'], ['Fe2O3'], [4, 3, 2]),
  rx('al-o2', 'oxidação do alumínio', ['Al', 'O2'], ['Al2O3'], [4, 3, 2]),
  rx('metano', 'combustão do metano', ['CH4', 'O2'], ['CO2', 'H2O'], [1, 2, 1, 2]),
  rx('propano', 'combustão do propano', ['C3H8', 'O2'], ['CO2', 'H2O'], [1, 5, 3, 4]),
  rx('etano', 'combustão do etano', ['C2H6', 'O2'], ['CO2', 'H2O'], [2, 7, 4, 6]),
  rx('butano', 'combustão do butano', ['C4H10', 'O2'], ['CO2', 'H2O'], [2, 13, 8, 10]),
  rx('etanol', 'combustão do etanol', ['C2H5OH', 'O2'], ['CO2', 'H2O'], [1, 3, 2, 3]),
  rx('glicose', 'combustão da glicose', ['C6H12O6', 'O2'], ['CO2', 'H2O'], [1, 6, 6, 6]),
  rx('al-hcl', 'alumínio com ácido clorídrico', ['Al', 'HCl'], ['AlCl3', 'H2'], [2, 6, 2, 3]),
  rx('neutral-h2so4', 'neutralização do ácido sulfúrico', ['H2SO4', 'NaOH'], ['Na2SO4', 'H2O'], [1, 2, 1, 2]),
  rx('neutral-ca', 'neutralização do hidróxido de cálcio', ['Ca(OH)2', 'HCl'], ['CaCl2', 'H2O'], [1, 2, 1, 2]),
  rx('al-oh3', 'neutralização do hidróxido de alumínio', ['Al(OH)3', 'H2SO4'], ['Al2(SO4)3', 'H2O'], [2, 3, 1, 6]),
  rx('alto-forno', 'redução do minério de ferro', ['Fe2O3', 'CO'], ['Fe', 'CO2'], [1, 3, 2, 3]),
  rx('termita', 'reação da termita', ['Al', 'Fe2O3'], ['Al2O3', 'Fe'], [2, 1, 1, 2]),
  rx('nh3-o2', 'oxidação da amônia', ['NH3', 'O2'], ['NO', 'H2O'], [4, 5, 4, 6]),
  rx('carbonato-hcl', 'carbonato de sódio com ácido', ['Na2CO3', 'HCl'], ['NaCl', 'H2O', 'CO2'], [1, 2, 2, 1, 1]),
  rx('calcario-hcl', 'calcário com ácido clorídrico', ['CaCO3', 'HCl'], ['CaCl2', 'H2O', 'CO2'], [1, 2, 1, 1, 1]),
]

export const reacao = (id: string): Reacao => REACOES.find((r) => r.id === id) as Reacao

/* ------------------------------------------------------------------ cálculos estequiométricos */

export const MM = massaMolar

/** Equação em texto, com coeficientes (1 fica implícito). */
export function equacaoTexto(r: Reacao, coefs: number[] = r.coefs): string {
  const lado = (formulas: string[], inicio: number) => formulas.map((f, i) => `${coefs[inicio + i] === 1 ? '' : coefs[inicio + i]}${f}`).join(' + ')
  return `${lado(r.reagentes, 0)} → ${lado(r.produtos, r.reagentes.length)}`
}

/** coeficiente da espécie de índice `k` (reagentes primeiro, depois produtos) */
export const coefDe = (r: Reacao, k: number) => r.coefs[k] as number
export const formulaDe = (r: Reacao, k: number) => (k < r.reagentes.length ? r.reagentes[k] : r.produtos[k - r.reagentes.length]) as string

/** Massa (g) da espécie `para` formada/consumida a partir de `massa` g da espécie `de`. */
export function massaParaMassa(r: Reacao, de: number, para: number, massa: number): number {
  return (massa / MM(formulaDe(r, de))) * (coefDe(r, para) / coefDe(r, de)) * MM(formulaDe(r, para))
}

export interface ResultadoLimitante {
  /** índice (nos reagentes) do reagente limitante; -1 se as proporções são exatas */
  limitante: number
  /** avanço da reação em "mols de equação": quantas vezes a equação ocorre */
  avanco: number
  /** razão mol/coeficiente de cada reagente */
  razoes: number[]
  /** mols restantes de cada reagente */
  sobra: number[]
  /** mols formados de cada produto */
  produtos: number[]
}

/** Reagente limitante a partir dos mols iniciais de cada reagente. */
export function limitante(r: Reacao, mols: number[]): ResultadoLimitante {
  const nr = r.reagentes.length
  const razoes = mols.map((n, i) => n / coefDe(r, i))
  const avanco = Math.min(...razoes)
  const iguais = razoes.every((x) => Math.abs(x - avanco) < 1e-9)
  const lim = iguais ? -1 : razoes.indexOf(avanco)
  const sobra = mols.map((n, i) => Math.max(0, n - avanco * coefDe(r, i)))
  const produtos = r.produtos.map((_, k) => avanco * coefDe(r, nr + k))
  return { limitante: lim, avanco, razoes, sobra, produtos }
}

export const molsDeMassa = (formula: string, massa: number) => massa / MM(formula)
export const rendimento = (real: number, teorico: number) => (real / teorico) * 100
