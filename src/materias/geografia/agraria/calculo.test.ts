import {
  areaEntreDiagonalECurva,
  areaSobCurva,
  crescimentoDaProdutividade,
  curvaModelo,
  decompor,
  giniDeFaixas,
  giniModelo,
  kDosMaiores,
  lorenzModelo,
  parteDosMaiores,
  pontosLorenz,
  producao,
  produtividade,
  variacaoPercentual,
  type FaixaFundiaria,
} from './calculo'

/**
 * Cálculo independente do Gini: transforma as faixas em 2.000 estabelecimentos, cada um com a área média da sua faixa,
 * e usa a definição por diferenças médias entre todos os pares: G = Σ|xi − xj| / (2·n²·média).
 */
function giniPorPares(faixas: FaixaFundiaria[], n = 2000): number {
  const areas: number[] = []
  for (const f of faixas) {
    const qtd = Math.round((f.estabelecimentos / 100) * n)
    for (let i = 0; i < qtd; i++) areas.push(f.area / 100 / (f.estabelecimentos / 100) / n)
  }
  const media = areas.reduce((a, b) => a + b, 0) / areas.length
  let soma = 0
  for (const x of areas) for (const y of areas) soma += Math.abs(x - y)
  return soma / (2 * areas.length * areas.length * media)
}

const CASOS: FaixaFundiaria[][] = [
  [
    { estabelecimentos: 50, area: 10 },
    { estabelecimentos: 50, area: 90 },
  ],
  [
    { estabelecimentos: 90, area: 40 },
    { estabelecimentos: 10, area: 60 },
  ],
  [
    { estabelecimentos: 60, area: 5 },
    { estabelecimentos: 30, area: 25 },
    { estabelecimentos: 10, area: 70 },
  ],
  [
    { estabelecimentos: 25, area: 25 },
    { estabelecimentos: 25, area: 25 },
    { estabelecimentos: 25, area: 25 },
    { estabelecimentos: 25, area: 25 },
  ],
  [
    { estabelecimentos: 40, area: 3 },
    { estabelecimentos: 40, area: 17 },
    { estabelecimentos: 19, area: 40 },
    { estabelecimentos: 1, area: 40 },
  ],
]

describe('Curva de Lorenz e Gini', () => {
  it('pontos da curva: acumulados, de (0, 0) até (1, 1)', () => {
    const pts = pontosLorenz(CASOS[2] as FaixaFundiaria[])
    expect(pts).toHaveLength(4)
    expect(pts[0]).toEqual({ p: 0, l: 0 })
    expect(pts[1]!.p).toBeCloseTo(0.6, 9)
    expect(pts[1]!.l).toBeCloseTo(0.05, 9)
    expect(pts[3]!.p).toBeCloseTo(1, 9)
    expect(pts[3]!.l).toBeCloseTo(1, 9)
  })
  it('duas faixas: 50% dos menores com 10% da área dão Gini de 0,40 (conta feita à mão)', () => {
    // área sob a curva = (0,5·0,1 + 0,5·(0,1+1))/2 = 0,3; G = 1 − 2·0,3 = 0,4
    expect(giniDeFaixas(CASOS[0] as FaixaFundiaria[])).toBeCloseTo(0.4, 9)
    expect(areaSobCurva(CASOS[0] as FaixaFundiaria[])).toBeCloseTo(0.3, 9)
    expect(areaEntreDiagonalECurva(CASOS[0] as FaixaFundiaria[])).toBeCloseTo(0.2, 9)
  })
  it('distribuição igual dá Gini 0', () => {
    expect(giniDeFaixas(CASOS[3] as FaixaFundiaria[])).toBeCloseTo(0, 9)
  })
  it.each(CASOS.map((c, i) => [i, c] as const))('caso %i: bate com o cálculo por pares de estabelecimentos', (_i, faixas) => {
    expect(giniDeFaixas(faixas)).toBeCloseTo(giniPorPares(faixas), 2)
  })
  it('o Gini é o dobro da área entre a diagonal e a curva e 1 menos o dobro da área sob a curva', () => {
    for (const c of CASOS) {
      expect(giniDeFaixas(c)).toBeCloseTo(2 * areaEntreDiagonalECurva(c), 12)
      expect(giniDeFaixas(c)).toBeCloseTo(1 - 2 * areaSobCurva(c), 12)
    }
  })
})

describe('Modelo L(p) = p^k', () => {
  it('k = 1 é a igualdade; o Gini cresce com k e tende a 1', () => {
    expect(giniModelo(1)).toBe(0)
    expect(giniModelo(3)).toBeCloseTo(0.5, 12)
    expect(giniModelo(9)).toBeCloseTo(0.8, 12)
    let ant = -1
    for (let k = 1; k <= 50; k += 0.5) {
      expect(giniModelo(k)).toBeGreaterThan(ant)
      ant = giniModelo(k)
    }
    expect(giniModelo(1000)).toBeLessThan(1)
  })
  it('o Gini do modelo bate com a integral numérica da curva (regra do trapézio)', () => {
    for (const k of [1.5, 2, 4, 7, 12]) {
      const pts = curvaModelo(k, 4000)
      const area = pts.slice(1).reduce((s, q, i) => s + ((q.p - pts[i]!.p) * (q.l + pts[i]!.l)) / 2, 0)
      expect(1 - 2 * area).toBeCloseTo(giniModelo(k), 4)
    }
  })
  it('a parte dos maiores e o expoente são inversos', () => {
    for (const t of [0.2, 0.5, 0.8]) expect(parteDosMaiores(0.1, kDosMaiores(t))).toBeCloseTo(t, 12)
    expect(parteDosMaiores(0.1, 1)).toBeCloseTo(0.1, 12)
    expect(lorenzModelo(0.5, 2)).toBeCloseTo(0.25, 12)
  })
  it('a curva começa em (0, 0), termina em (1, 1) e nunca passa da diagonal', () => {
    for (const k of [1, 2, 6]) {
      const c = curvaModelo(k)
      expect(c[0]).toEqual({ p: 0, l: 0 })
      expect(c[c.length - 1]!.l).toBeCloseTo(1, 12)
      for (const q of c) expect(q.l).toBeLessThanOrEqual(q.p + 1e-12)
    }
  })
})

describe('Produção, área e produtividade', () => {
  it('produção = área × produtividade e as operações inversas', () => {
    expect(producao(250, 6)).toBe(1500)
    expect(produtividade(1000, 200)).toBe(5)
    expect(variacaoPercentual(80, 100)).toBeCloseTo(25, 12)
  })
  it('decomposição: os fatores multiplicam, e as partes (em log) somam 1', () => {
    const d = decompor(100, 2, 120, 3.5)
    expect(d.fatorProducao).toBeCloseTo(1.2 * 1.75, 12)
    expect(d.pctProducao).toBeCloseTo(110, 9)
    expect(d.pctArea).toBeCloseTo(20, 9)
    expect(d.pctProdutividade).toBeCloseTo(75, 9)
    expect(d.partePelaArea).toBeCloseTo(Math.log(1.2) / Math.log(2.1), 12)
    expect(d.partePelaArea).toBeGreaterThan(0)
    expect(d.partePelaArea).toBeLessThan(1)
    // só a área cresce: toda a explicação vem da área
    expect(decompor(100, 2, 150, 2).partePelaArea).toBeCloseTo(1, 12)
    // só a produtividade cresce: nada vem da área
    expect(decompor(100, 2, 100, 3).partePelaArea).toBeCloseTo(0, 12)
  })
  it('crescimento da produtividade dado o da produção e o da área', () => {
    expect(crescimentoDaProdutividade(110, 20)).toBeCloseTo(75, 9)
    expect(crescimentoDaProdutividade(50, 0)).toBeCloseTo(50, 9)
    // a subtração dos percentuais (90) seria um erro: 110 − 20
    expect(crescimentoDaProdutividade(110, 20)).not.toBeCloseTo(90, 0)
  })
})
