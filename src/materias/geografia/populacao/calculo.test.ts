import { CENSOS } from '@/conteudo/geografia/populacao'
import {
  FAIXAS,
  PARAMETROS_FASE,
  crescimentoNatural,
  esperancaDeVida,
  faseDasTaxas,
  formaDaPiramide,
  grupos,
  indiceEnvelhecimento,
  nivelDeMortalidade,
  parametrosNoTempo,
  piramideModelo,
  projetar,
  razaoDependencia,
  razaoIdosos,
  razaoJovens,
  sobrevivencia,
  taxaMedia,
  taxasNoTempo,
  tempoDuplicacao70,
  tempoDuplicacaoExato,
  type Fase,
  type Piramide,
} from './calculo'

const soma = (v: number[]) => v.reduce((a, b) => a + b, 0)
/** Percentual de jovens somando à mão as três primeiras faixas dos dois sexos. */
const jovensDe = (p: Piramide) => p.homens[0]! + p.homens[1]! + p.homens[2]! + p.mulheres[0]! + p.mulheres[1]! + p.mulheres[2]!
const idososDe = (p: Piramide) => soma(p.homens.slice(13)) + soma(p.mulheres.slice(13))

describe('Pirâmide etária: faixas e grupos', () => {
  it('são 17 faixas de cinco anos, a última aberta (80+)', () => {
    expect(FAIXAS).toHaveLength(17)
    expect(FAIXAS[0]).toBe('0–4')
    expect(FAIXAS[2]).toBe('10–14')
    expect(FAIXAS[3]).toBe('15–19')
    expect(FAIXAS[12]).toBe('60–64')
    expect(FAIXAS[13]).toBe('65–69')
    expect(FAIXAS[16]).toBe('80+')
  })
  it('grupos somam jovens (0–14), adultos (15–64) e idosos (65+) dos dois sexos', () => {
    const p: Piramide = { homens: Array.from({ length: 17 }, (_, i) => i + 1), mulheres: Array.from({ length: 17 }, () => 1) }
    const g = grupos(p)
    // jovens: homens 1+2+3 = 6, mulheres 3 → 9; adultos: homens 4..13 = 85, mulheres 10 → 95; idosos: homens 14..17 = 62, mulheres 4 → 66
    expect(g.jovens).toBe(9)
    expect(g.adultos).toBe(95)
    expect(g.idosos).toBe(66)
  })
})

describe('Razões e índices (com conta feita à mão)', () => {
  const g = { jovens: 30, adultos: 60, idosos: 10 }
  it('razão de dependência = (30 + 10) ÷ 60 × 100', () => {
    expect(razaoDependencia(g)).toBeCloseTo(66.6667, 3)
    expect(razaoJovens(g)).toBeCloseTo(50, 9)
    expect(razaoIdosos(g)).toBeCloseTo(16.6667, 3)
  })
  it('índice de envelhecimento = 10 ÷ 30 × 100', () => {
    expect(indiceEnvelhecimento(g)).toBeCloseTo(33.3333, 3)
    expect(indiceEnvelhecimento({ jovens: 15, adultos: 55, idosos: 30 })).toBeCloseTo(200, 9)
  })
  it('a razão de dependência é a soma da razão de jovens com a de idosos', () => {
    for (const x of [g, { jovens: 20, adultos: 55, idosos: 25 }, { jovens: 45, adultos: 52, idosos: 3 }]) expect(razaoDependencia(x)).toBeCloseTo(razaoJovens(x) + razaoIdosos(x), 9)
  })
  it('forma da pirâmide pelos limites de 35% e 20% de jovens', () => {
    expect(formaDaPiramide({ jovens: 35, adultos: 60, idosos: 5 })).toBe('base-larga')
    expect(formaDaPiramide({ jovens: 34.9, adultos: 60, idosos: 5 })).toBe('intermediaria')
    expect(formaDaPiramide({ jovens: 20, adultos: 60, idosos: 20 })).toBe('intermediaria')
    expect(formaDaPiramide({ jovens: 19.9, adultos: 60, idosos: 20 })).toBe('base-estreita')
  })
})

describe('Crescimento', () => {
  it('crescimento natural: (30 − 10) por mil = 2% ao ano', () => {
    expect(crescimentoNatural(30, 10)).toBe(2)
    expect(crescimentoNatural(12, 10)).toBeCloseTo(0.2, 9)
    expect(crescimentoNatural(9, 11)).toBeCloseTo(-0.2, 9)
  })
  it('regra dos 70 e tempo exato: 2% ao ano dobra em ≈ 35 anos', () => {
    expect(tempoDuplicacao70(2)).toBe(35)
    expect(tempoDuplicacaoExato(2)).toBeCloseTo(35.0028, 3)
    expect(tempoDuplicacao70(1)).toBe(70)
    // a regra dos 70 erra pouco para taxas até 3%
    for (const r of [0.5, 1, 1.5, 2, 3]) expect(Math.abs(tempoDuplicacao70(r) - tempoDuplicacaoExato(r)) / tempoDuplicacaoExato(r)).toBeLessThan(0.02)
  })
  it('população composta: 100 milhões a 2% por 35 anos ≈ 200 milhões; a conta inversa devolve a taxa', () => {
    expect(projetar(100, 2, 35)).toBeCloseTo(199.989, 2)
    expect(projetar(50, 0, 10)).toBe(50)
    expect(projetar(10, 10, 2)).toBeCloseTo(12.1, 9)
    for (const r of [0.5, 1.7, 3]) expect(taxaMedia(80, projetar(80, r, 25), 25)).toBeCloseTo(r, 9)
  })
  it('os censos do Brasil dão 1,17% ao ano (2000–2010) e 0,52% (2010–2022), como o IBGE divulgou', () => {
    const [c2000, c2010, c2022] = CENSOS
    expect(taxaMedia(c2000!.populacao, c2010!.populacao, 10)).toBeCloseTo(1.17, 2)
    expect(taxaMedia(c2010!.populacao, c2022!.populacao, 12)).toBeCloseTo(0.52, 2)
  })
})

describe('Modelo de mortalidade', () => {
  it('sobrevivência começa em 1, só cai e cai mais com mortalidade maior', () => {
    expect(sobrevivencia(0, 1)).toBe(1)
    let anterior = 1
    for (let a = 1; a <= 120; a++) {
      const s = sobrevivencia(a, 1)
      expect(s).toBeLessThanOrEqual(anterior)
      anterior = s
    }
    expect(sobrevivencia(60, 2)).toBeLessThan(sobrevivencia(60, 1))
  })
  it.each([35, 42, 55, 70, 80, 85])('o nível de mortalidade calibrado dá esperança de vida %i', (e0) => {
    expect(esperancaDeVida(nivelDeMortalidade(e0))).toBeCloseTo(e0, 3)
  })
  it('a esperança de vida confere com uma integral trapezoidal independente', () => {
    const m = nivelDeMortalidade(72)
    const h = 0.02
    let s = 0
    for (let a = 0; a < 130; a += h) s += ((sobrevivencia(a, m) + sobrevivencia(a + h, m)) / 2) * h
    expect(s).toBeCloseTo(72, 1)
  })
})

describe('Pirâmide do modelo', () => {
  const p = piramideModelo({ fecundidade: 2.6, expectativa: 70 })
  it('17 faixas, valores não negativos e total perto de 100%', () => {
    expect(p.homens).toHaveLength(17)
    expect(p.mulheres).toHaveLength(17)
    for (const v of [...p.homens, ...p.mulheres]) expect(v).toBeGreaterThanOrEqual(0)
    expect(soma(p.homens) + soma(p.mulheres)).toBeGreaterThan(99.5)
    expect(soma(p.homens) + soma(p.mulheres)).toBeLessThan(100.5)
  })
  it('nascem mais meninos (105 para 100 meninas) e há mais mulheres entre os idosos', () => {
    expect(p.homens[0]! / p.mulheres[0]!).toBeGreaterThan(1.03)
    expect(p.homens[0]! / p.mulheres[0]!).toBeLessThan(1.07)
    expect(p.mulheres[16]!).toBeGreaterThan(p.homens[16]!)
    expect(soma(p.mulheres.slice(13))).toBeGreaterThan(soma(p.homens.slice(13)))
  })
  it('grupos() bate com a soma feita à mão', () => {
    const g = grupos(p)
    expect(g.jovens).toBeCloseTo(jovensDe(p), 1)
    expect(g.idosos).toBeCloseTo(idososDe(p), 1)
    expect(g.jovens + g.adultos + g.idosos).toBeCloseTo(soma(p.homens) + soma(p.mulheres), 1)
  })
  it('mais filhos por mulher dá mais jovens; vida mais longa dá mais idosos', () => {
    expect(jovensDe(piramideModelo({ fecundidade: 4, expectativa: 65 }))).toBeGreaterThan(jovensDe(piramideModelo({ fecundidade: 2, expectativa: 65 })))
    expect(idososDe(piramideModelo({ fecundidade: 2, expectativa: 80 }))).toBeGreaterThan(idososDe(piramideModelo({ fecundidade: 2, expectativa: 60 })))
  })
  it('as quatro fases têm as formas esperadas: base larga, base larga, intermediária e base estreita', () => {
    const formas = ([1, 2, 3, 4] as Fase[]).map((f) => formaDaPiramide(grupos(piramideModelo(PARAMETROS_FASE[f]))))
    expect(formas).toEqual(['base-larga', 'base-larga', 'intermediaria', 'base-estreita'])
  })
  it('o envelhecimento aumenta de fase em fase (idosos) e os jovens diminuem', () => {
    const gs = ([1, 2, 3, 4] as Fase[]).map((f) => grupos(piramideModelo(PARAMETROS_FASE[f])))
    for (let i = 1; i < 4; i++) {
      expect(gs[i]!.idosos).toBeGreaterThan(gs[i - 1]!.idosos)
      expect(gs[i]!.jovens).toBeLessThan(gs[i - 1]!.jovens)
    }
  })
})

describe('Fases da transição', () => {
  it('fase pelas taxas (natalidade, mortalidade em por mil)', () => {
    const casos: [number, number, Fase][] = [
      [40, 35, 1],
      [30, 25, 1],
      [40, 15, 2],
      [30, 24, 2],
      [22, 8, 3],
      [29, 10, 3],
      [15, 10, 3],
      [12, 10, 4],
      [10, 11, 4],
      [9, 12, 4],
    ]
    for (const [n, m, esperada] of casos) expect(faseDasTaxas(n, m), `${n}/${m}`).toBe(esperada)
  })
  it('na linha do tempo, a mortalidade cai antes da natalidade e as fases aparecem em ordem', () => {
    const cruzaCom = (campo: 'natalidade' | 'mortalidade', valor: number) => {
      for (let t = 0; t <= 1; t += 0.001) if (taxasNoTempo(t)[campo] < valor) return t
      return 2
    }
    expect(cruzaCom('mortalidade', 20)).toBeLessThan(cruzaCom('natalidade', 20))
    const fases: Fase[] = []
    for (let t = 0; t <= 1.0001; t += 0.005) {
      const { natalidade, mortalidade } = taxasNoTempo(t)
      fases.push(faseDasTaxas(natalidade, mortalidade))
    }
    for (let i = 1; i < fases.length; i++) expect(fases[i]!).toBeGreaterThanOrEqual(fases[i - 1]!)
    expect(new Set(fases)).toEqual(new Set([1, 2, 3, 4]))
  })
  it('o crescimento natural é maior no meio da transição do que no início e no fim', () => {
    const cn = (t: number) => crescimentoNatural(taxasNoTempo(t).natalidade, taxasNoTempo(t).mortalidade)
    let maior = 0
    let tMaior = 0
    for (let t = 0; t <= 1; t += 0.01) if (cn(t) > maior) [maior, tMaior] = [cn(t), t]
    expect(tMaior).toBeGreaterThan(0.2)
    expect(tMaior).toBeLessThan(0.6)
    expect(maior).toBeGreaterThan(cn(0) + 1)
    expect(maior).toBeGreaterThan(cn(1) + 1)
  })
  it('a razão de dependência tem um mínimo no meio da transição (bônus demográfico)', () => {
    const rd = Array.from({ length: 21 }, (_, k) => razaoDependencia(grupos(piramideModelo(parametrosNoTempo(k / 20)))))
    const min = Math.min(...rd)
    const i = rd.indexOf(min)
    expect(i).toBeGreaterThan(3)
    expect(i).toBeLessThan(18)
    expect(rd[0]!).toBeGreaterThan(min + 8)
    expect(rd[20]!).toBeGreaterThan(min + 6)
  })
})
