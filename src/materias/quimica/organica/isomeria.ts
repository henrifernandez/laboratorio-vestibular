import { alcano, assinatura, comGrupos, construir, eter, formulaMolecular, funcoes, maiorCadeia, type Espec, type Molecula, type Sub } from './molecula'

export type TipoIsomeria = 'cadeia' | 'posicao' | 'funcao' | 'compensacao' | 'geometrica' | 'nao'

const OH = (no: number) => ({ no, g: 'OH' as Sub })
const ME = (no: number) => ({ no, g: 'CH3' as Sub })

export interface Isomero {
  nome: string
  espec: Espec
}

export interface FamiliaIsomeros {
  formula: string
  /** número total de isômeros constitucionais acíclicos e saturados conhecidos para a fórmula */
  total: number
  titulo: string
  lista: Isomero[]
}

/** 2-metoxipropano: CH3–O–CH(CH3)–CH3 (cadeia O no meio, com o carbono ligado ao O ramificado). */
const metoxipropan2: Espec = { cadeia: ['C', 'O', 'C', 'C'], subs: [{ no: 2, g: 'CH3' }] }

/**
 * Todos os isômeros constitucionais (sem estereoisômeros) das fórmulas abaixo. As contagens (2, 3, 5, 2, 3 e 7)
 * são resultados clássicos; os testes conferem que cada estrutura tem a fórmula certa e que não há duas iguais.
 */
export const FAMILIAS: FamiliaIsomeros[] = [
  {
    formula: 'C4H10',
    total: 2,
    titulo: 'Butanos',
    lista: [
      { nome: 'butano', espec: alcano(4) },
      { nome: '2-metilpropano', espec: comGrupos(3, [ME(1)]) },
    ],
  },
  {
    formula: 'C5H12',
    total: 3,
    titulo: 'Pentanos',
    lista: [
      { nome: 'pentano', espec: alcano(5) },
      { nome: '2-metilbutano', espec: comGrupos(4, [ME(1)]) },
      { nome: '2,2-dimetilpropano', espec: comGrupos(3, [ME(1), ME(1)]) },
    ],
  },
  {
    formula: 'C6H14',
    total: 5,
    titulo: 'Hexanos',
    lista: [
      { nome: 'hexano', espec: alcano(6) },
      { nome: '2-metilpentano', espec: comGrupos(5, [ME(1)]) },
      { nome: '3-metilpentano', espec: comGrupos(5, [ME(2)]) },
      { nome: '2,2-dimetilbutano', espec: comGrupos(4, [ME(1), ME(1)]) },
      { nome: '2,3-dimetilbutano', espec: comGrupos(4, [ME(1), ME(2)]) },
    ],
  },
  {
    formula: 'C2H6O',
    total: 2,
    titulo: 'Álcool e éter com dois carbonos',
    lista: [
      { nome: 'etanol', espec: comGrupos(2, [OH(0)]) },
      { nome: 'metoximetano', espec: eter(1, 1) },
    ],
  },
  {
    formula: 'C3H8O',
    total: 3,
    titulo: 'Álcoois e éter com três carbonos',
    lista: [
      { nome: 'propan-1-ol', espec: comGrupos(3, [OH(0)]) },
      { nome: 'propan-2-ol', espec: comGrupos(3, [OH(1)]) },
      { nome: 'metoxietano', espec: eter(1, 2) },
    ],
  },
  {
    formula: 'C4H10O',
    total: 7,
    titulo: 'Álcoois e éteres com quatro carbonos',
    lista: [
      { nome: 'butan-1-ol', espec: comGrupos(4, [OH(0)]) },
      { nome: 'butan-2-ol', espec: comGrupos(4, [OH(1)]) },
      { nome: '2-metilpropan-1-ol', espec: comGrupos(3, [OH(0), ME(1)]) },
      { nome: '2-metilpropan-2-ol', espec: comGrupos(3, [OH(1), ME(1)]) },
      { nome: 'metoxipropano', espec: eter(1, 3) },
      { nome: 'etoxietano', espec: eter(2, 2) },
      { nome: '2-metoxipropano', espec: metoxipropan2 },
    ],
  },
]

/* ------------------------------------------------------------------ classificação de pares */

/** O grupo é ramificado se algum carbono tem 3 ligações a carbono ou ao oxigênio que divide a cadeia (como o isopropil). */
function ramificado(m: Molecula, ids: number[]): boolean {
  const grau = (id: number) => m.ligacoes.filter((l) => l.a === id || l.b === id).length
  return ids.some((id) => {
    const vizinhos = m.ligacoes.filter((l) => l.a === id || l.b === id).map((l) => (l.a === id ? l.b : l.a))
    const comCarbono = vizinhos.filter((v) => ids.includes(v)).length
    const aoOxigenio = vizinhos.filter((v) => m.atomos[v]!.el === 'O' && grau(v) === 2).length
    return comCarbono + aoOxigenio >= 3
  })
}

/** Grupos de carbonos separados por heteroátomos da cadeia (um de cada lado do O de um éter). */
function componentesDeCarbono(m: Molecula): number[][] {
  const carbonos = m.atomos.filter((a) => a.el === 'C').map((a) => a.id)
  const vistos = new Set<number>()
  const comps: number[][] = []
  for (const c of carbonos) {
    if (vistos.has(c)) continue
    const comp: number[] = []
    const pilha = [c]
    while (pilha.length) {
      const x = pilha.pop() as number
      if (vistos.has(x)) continue
      vistos.add(x)
      comp.push(x)
      for (const l of m.ligacoes) {
        const outro = l.a === x ? l.b : l.b === x ? l.a : -1
        if (outro >= 0 && m.atomos[outro]!.el === 'C' && !vistos.has(outro)) pilha.push(outro)
      }
    }
    comps.push(comp)
  }
  return comps
}

/**
 * Relações possíveis entre duas moléculas: pode haver mais de uma (um éter ramificado e outro linear
 * diferem por cadeia e por compensação). Não trata estereoisomeria.
 */
export function relacoes(a: Molecula, b: Molecula): TipoIsomeria[] {
  if (formulaMolecular(a) !== formulaMolecular(b)) return ['nao']
  const fa = funcoes(a).join()
  const fb = funcoes(b).join()
  if (fa !== fb) return ['funcao']
  const compA = componentesDeCarbono(a)
  const compB = componentesDeCarbono(b)
  if (compA.length > 1 || compB.length > 1) {
    // heteroátomo dividindo a cadeia (éter, éster)
    const tam = (c: number[][]) => c.map((x) => x.length).sort((x, y) => x - y).join()
    const saida: TipoIsomeria[] = []
    const ramA = compA.some((c) => ramificado(a, c))
    const ramB = compB.some((c) => ramificado(b, c))
    if (tam(compA) !== tam(compB)) saida.push('compensacao')
    if (ramA !== ramB || (tam(compA) === tam(compB) && assinatura(a) !== assinatura(b))) saida.push('cadeia')
    return saida.length ? saida : ['posicao']
  }
  // mesma função, sem heteroátomo na cadeia: cadeia se a maior cadeia de carbonos muda; senão, posição
  if (maiorCadeia(a) !== maiorCadeia(b)) return ['cadeia']
  return assinatura(a) !== assinatura(b) ? ['posicao'] : []
}

export const moleculaDe = (i: Isomero) => construir(i.espec)
