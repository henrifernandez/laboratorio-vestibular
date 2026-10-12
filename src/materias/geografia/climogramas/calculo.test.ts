import { CIDADES, CLIMAS } from '@/conteudo/geografia/climogramas'
import {
  ESTACOES,
  amplitude,
  chuvaPorEstacao,
  cidade,
  escalas,
  estacaoExtrema,
  gerarSintetico,
  hemisferioPelaTemperatura,
  maisParecida,
  mediaAnual,
  mesMaisChuvoso,
  mesMaisFrio,
  mesMaisQuente,
  mesesDaEstacao,
  mesesSecos,
  totalAnual,
} from './calculo'

/* Tabela conferida à mão, somando as barras e olhando os extremos da linha (independente das funções). */
const ESPERADO: Record<string, { total: number; amp: number; secos: number[]; hem: 'N' | 'S' | null; soma: number }> = {
  manaus: { total: 2320, amp: 1.9, secos: [], hem: null, soma: 324.8 },
  brasilia: { total: 1523, amp: 3.5, secos: [4, 5, 6, 7], hem: null, soma: 256.3 },
  recife: { total: 1725, amp: 2.5, secos: [9, 10, 11], hem: null, soma: 313 },
  petrolina: { total: 606, amp: 4.5, secos: [4, 5, 6, 7, 8, 9], hem: null, soma: 313 },
  'sao-paulo': { total: 1430, amp: 7, secos: [], hem: 'S', soma: 230.5 },
  'porto-alegre': { total: 1350, amp: 11, secos: [], hem: 'S', soma: 237 },
  roma: { total: 750, amp: 18, secos: [5, 6, 7], hem: 'N', soma: 199.5 },
  cairo: { total: 24, amp: 15, secos: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], hem: 'N', soma: 268.5 },
  moscou: { total: 710, amp: 25.5, secos: [], hem: 'N', soma: 70.5 },
  londres: { total: 620, amp: 14, secos: [], hem: 'N', soma: 136.5 },
}

describe('Dados das cidades', () => {
  it('são dez cidades, com 12 meses de temperatura e de chuva, e um clima cada', () => {
    expect(CIDADES).toHaveLength(10)
    for (const c of CIDADES) {
      expect(c.temp, c.id).toHaveLength(12)
      expect(c.chuva, c.id).toHaveLength(12)
      expect(c.chuva.every((p) => p >= 0)).toBe(true)
    }
    expect(new Set(CIDADES.map((c) => c.clima)).size).toBe(10)
    expect(Object.keys(CLIMAS)).toHaveLength(10)
  })
  it.each(Object.keys(ESPERADO))('%s: total, amplitude, meses secos, hemisfério e soma das temperaturas batem com a tabela', (id) => {
    const e = ESPERADO[id]!
    const c = cidade(id)
    expect(totalAnual(c)).toBe(e.total)
    expect(amplitude(c)).toBeCloseTo(e.amp, 6)
    expect(mesesSecos(c)).toEqual(e.secos)
    expect(hemisferioPelaTemperatura(c)).toBe(e.hem)
    expect(mediaAnual(c) * 12).toBeCloseTo(e.soma, 6)
  })
  it('as assinaturas dos climas se verificam nos dados', () => {
    const por = (id: string) => cidade(id)
    // equatorial: sem mês seco, muita chuva, amplitude mínima
    expect(mesesSecos(por('manaus'))).toHaveLength(0)
    expect(totalAnual(por('manaus'))).toBeGreaterThan(2000)
    expect(amplitude(por('manaus'))).toBeLessThan(3)
    // tropical: vários meses secos no inverno, verão chuvoso
    expect(mesesSecos(por('brasilia')).length).toBeGreaterThanOrEqual(3)
    expect(mesMaisChuvoso(por('brasilia'))).toBeOneOf([10, 11, 0])
    // semiárido: seis ou mais meses secos e pouca chuva
    expect(mesesSecos(por('petrolina')).length).toBeGreaterThanOrEqual(6)
    expect(totalAnual(por('petrolina'))).toBeLessThan(800)
    // mediterrâneo: meses secos no verão do Norte (junho a agosto) e chuva maior no outono/inverno
    expect(mesesSecos(por('roma'))).toEqual([5, 6, 7])
    // desértico: praticamente sem chuva
    expect(totalAnual(por('cairo'))).toBeLessThan(250)
    // continental: inverno abaixo de zero e grande amplitude
    expect(Math.min(...por('moscou').temp)).toBeLessThan(0)
    expect(amplitude(por('moscou'))).toBeGreaterThan(20)
    // oceânico: amplitude moderada, nenhum mês seco, chuva bem distribuída (nenhum mês passa do dobro da média)
    expect(mesesSecos(por('londres'))).toHaveLength(0)
    expect(Math.max(...por('londres').chuva)).toBeLessThan(2 * (totalAnual(por('londres')) / 12))
    // subtropical: quatro estações (amplitude maior que a tropical de altitude) e chuva distribuída
    expect(amplitude(por('porto-alegre'))).toBeGreaterThan(amplitude(por('sao-paulo')))
    expect(Math.max(...por('porto-alegre').chuva)).toBeLessThan(1.6 * (totalAnual(por('porto-alegre')) / 12))
    // litorâneo úmido: máximo de chuva no outono e inverno do Sul (março a agosto)
    expect(mesMaisChuvoso(por('recife'))).toBeGreaterThanOrEqual(2)
    expect(mesMaisChuvoso(por('recife'))).toBeLessThanOrEqual(7)
  })
  it('mês mais quente, mais frio e mais chuvoso', () => {
    expect(mesMaisQuente(cidade('moscou'))).toBe(6)
    expect(mesMaisFrio(cidade('moscou'))).toBe(0)
    expect(mesMaisChuvoso(cidade('manaus'))).toBe(2)
  })
})

describe('Estações', () => {
  it('Sul: verão é dezembro-fevereiro; Norte: junho-agosto', () => {
    expect(mesesDaEstacao('verao', 'S')).toEqual([11, 0, 1])
    expect(mesesDaEstacao('inverno', 'S')).toEqual([5, 6, 7])
    expect(mesesDaEstacao('verao', 'N')).toEqual([5, 6, 7])
    expect(mesesDaEstacao('inverno', 'N')).toEqual([11, 0, 1])
    expect(mesesDaEstacao('outono', 'N')).toEqual([8, 9, 10])
    expect(mesesDaEstacao('primavera', 'N')).toEqual([2, 3, 4])
  })
  it('a soma das quatro estações é o total anual', () => {
    for (const c of CIDADES) for (const h of ['N', 'S'] as const) expect(ESTACOES.reduce((a, e) => a + chuvaPorEstacao(c, h)[e], 0), c.id).toBe(totalAnual(c))
  })
  it('Roma (Norte): o verão é a estação mais seca; São Paulo (Sul): o inverno', () => {
    expect(estacaoExtrema(cidade('roma'), 'N', 'seca').estacao).toBe('verao')
    expect(estacaoExtrema(cidade('sao-paulo'), 'S', 'seca').estacao).toBe('inverno')
    expect(estacaoExtrema(cidade('sao-paulo'), 'S', 'chuvosa').estacao).toBe('verao')
  })
})

describe('Cidade sintética', () => {
  const casos = [
    { media: 24, amp: 4, hem: 'S' as const, total: 1500, conc: 0.7, chuvaNoVerao: true },
    { media: 10, amp: 16, hem: 'N' as const, total: 800, conc: 0.9, chuvaNoVerao: false },
    { media: 0, amp: 30, hem: 'N' as const, total: 300, conc: 1, chuvaNoVerao: true },
  ]
  it('a média anual, a amplitude e o total saem exatos (até o arredondamento)', () => {
    for (const p of casos) {
      const d = gerarSintetico(p)
      expect(mediaAnual(d)).toBeCloseTo(p.media, 1)
      expect(amplitude(d)).toBeCloseTo(p.amp, 1)
      expect(Math.abs(totalAnual(d) - p.total)).toBeLessThanOrEqual(6)
    }
  })
  it('o mês mais quente é janeiro (Sul) ou julho (Norte)', () => {
    expect(mesMaisQuente(gerarSintetico(casos[0]!))).toBe(0)
    expect(mesMaisQuente(gerarSintetico(casos[1]!))).toBe(6)
  })
  it('a estação chuvosa pedida é mesmo a mais chuvosa, e a oposta é a mais seca', () => {
    for (const hem of ['N', 'S'] as const)
      for (const chuvaNoVerao of [true, false]) {
        const d = gerarSintetico({ media: 15, amp: 12, hem, total: 1000, conc: 0.8, chuvaNoVerao })
        expect(hemisferioPelaTemperatura(d)).toBe(hem)
        expect(estacaoExtrema(d, hem, 'chuvosa').estacao).toBe(chuvaNoVerao ? 'verao' : 'inverno')
        expect(estacaoExtrema(d, hem, 'seca').estacao).toBe(chuvaNoVerao ? 'inverno' : 'verao')
      }
  })
  it('as sugestões do laboratório se confirmam: equatorial, semiárido e continental', () => {
    const base = { hem: 'S' as const, conc: 0.7, chuvaNoVerao: true }
    expect(maisParecida(gerarSintetico({ ...base, media: 27, amp: 2, total: 2300 })).id).toBe('manaus')
    expect(maisParecida(gerarSintetico({ ...base, media: 26, amp: 4, total: 550, conc: 0.95 })).id).toBe('petrolina')
    expect(maisParecida(gerarSintetico({ ...base, hem: 'N', media: 6, amp: 25, total: 1500 })).id).toBe('moscou')
  })
  it('cada cidade-modelo é a mais parecida consigo mesma', () => {
    for (const c of CIDADES) expect(maisParecida(c).id).toBe(c.id)
  })
})

describe('Escalas do gráfico', () => {
  it('abrangem todos os dados e começam em zero ou abaixo', () => {
    for (const c of CIDADES) {
      const { tlo, thi, pmax } = escalas(c)
      expect(tlo).toBeLessThanOrEqual(Math.min(0, ...c.temp))
      expect(thi).toBeGreaterThanOrEqual(Math.max(...c.temp))
      expect(pmax).toBeGreaterThanOrEqual(Math.max(...c.chuva))
      expect(thi).toBeGreaterThan(tlo)
    }
  })
})
