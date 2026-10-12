import {
  GRAD_NORMAL,
  SUPERFICIES,
  alturaCondensacaoKm,
  camadasDeInversao,
  faseEnso,
  forcaAlisios,
  intensidadeEnso,
  nivelComMedidas,
  perfilInversao,
  inclinacaoTermoclina,
  resultadoOrografico,
  temperaturaNaAltura,
  temperaturaNoCaminho,
  type Montanha,
} from './calculo'

/** Integração numérica passo a passo (a cada 1 m), independente das fórmulas fechadas do código. */
function simular(m: Montanha) {
  const passo = 0.001 // km
  let t = m.t0
  let z = 0
  while (z < m.altura - 1e-9) {
    t -= (z < m.zc - 1e-9 ? 10 : 6) * passo
    z += passo
  }
  const topo = t
  while (z > 1e-9) {
    t += 10 * passo
    z -= passo
  }
  return { topo, sotavento: t }
}

describe('Chuva orográfica', () => {
  const casos: Montanha[] = [
    { t0: 28, altura: 3, zc: 1 },
    { t0: 24, altura: 2, zc: 0.5 },
    { t0: 34, altura: 3.5, zc: 1.5 },
    { t0: 30, altura: 2.5, zc: 0.75 },
  ]
  it.each(casos)('fórmulas fechadas = integração numérica (%o)', (m) => {
    const r = resultadoOrografico(m)
    const s = simular(m)
    expect(r.tTopo).toBeCloseTo(s.topo, 1)
    expect(r.tSotavento).toBeCloseTo(s.sotavento, 1)
    expect(r.aquecimento).toBeCloseTo(4 * (m.altura - m.zc), 6)
  })
  it('exemplo do enunciado: 28 °C, serra de 3 km, condensação a 1 km: topo 6 °C e sotavento 36 °C', () => {
    const r = resultadoOrografico({ t0: 28, altura: 3, zc: 1 })
    expect(r.tTopo).toBe(6)
    expect(r.tSotavento).toBe(36)
    expect(r.chove).toBe(true)
  })
  it('sem condensação até o topo, o ar volta com a temperatura de entrada e não chove', () => {
    const r = resultadoOrografico({ t0: 25, altura: 1, zc: 2 })
    expect(r.chove).toBe(false)
    expect(r.tSotavento).toBe(25)
    expect(r.aquecimento).toBe(0)
  })
  it('Espy: 125 m por °C entre temperatura e orvalho', () => {
    expect(alturaCondensacaoKm(28, 20)).toBe(1)
    expect(alturaCondensacaoKm(30, 30)).toBe(0)
    expect(alturaCondensacaoKm(20, 24)).toBe(0)
  })
  it('o caminho começa em T0, passa pelo topo e termina em T de sotavento', () => {
    const m = { t0: 28, altura: 3, zc: 1 }
    expect(temperaturaNoCaminho(m, 0).t).toBe(28)
    expect(temperaturaNoCaminho(m, 1).t).toBe(6)
    expect(temperaturaNoCaminho(m, 2).t).toBe(36)
    expect(temperaturaNoCaminho(m, 0.2).nuvem).toBe(false)
    expect(temperaturaNoCaminho(m, 0.8).nuvem).toBe(true)
    expect(temperaturaNoCaminho(m, 1.5).nuvem).toBe(false)
    expect(temperaturaNoCaminho(m, 1.5).z).toBeCloseTo(1.5, 9)
  })
})

describe('El Niño e La Niña', () => {
  it('limiares de ±0,5 °C (o limite pertence ao fenômeno)', () => {
    expect(faseEnso(0.5)).toBe('el-nino')
    expect(faseEnso(0.49)).toBe('neutro')
    expect(faseEnso(-0.49)).toBe('neutro')
    expect(faseEnso(-0.5)).toBe('la-nina')
    expect(faseEnso(0)).toBe('neutro')
  })
  it('intensidade pela NOAA: 0,5–0,9 fraco; 1,0–1,4 moderado; 1,5–1,9 forte; ≥ 2,0 muito forte (em módulo)', () => {
    const tabela: [number, string | null][] = [
      [0.3, null],
      [0.5, 'fraco'],
      [0.9, 'fraco'],
      [1, 'moderado'],
      [1.4, 'moderado'],
      [1.5, 'forte'],
      [1.9, 'forte'],
      [2, 'muito forte'],
      [2.8, 'muito forte'],
      [-0.7, 'fraco'],
      [-1.6, 'forte'],
      [-2.3, 'muito forte'],
    ]
    for (const [a, esperado] of tabela) expect(intensidadeEnso(a), String(a)).toBe(esperado)
  })
  it('os alísios enfraquecem e a água quente vai para o leste conforme a anomalia sobe', () => {
    expect(forcaAlisios(2)).toBeLessThan(forcaAlisios(0))
    expect(forcaAlisios(0)).toBeLessThan(forcaAlisios(-2))
    expect(inclinacaoTermoclina(0)).toBe(1)
    expect(inclinacaoTermoclina(2)).toBeLessThan(inclinacaoTermoclina(0))
    expect(inclinacaoTermoclina(-2)).toBeGreaterThan(inclinacaoTermoclina(0))
    for (const a of [-3, -1, 0, 1, 3]) {
      expect(forcaAlisios(a)).toBeGreaterThanOrEqual(0)
      expect(forcaAlisios(a)).toBeLessThanOrEqual(1)
    }
  })
})

describe('Inversão térmica', () => {
  const p = { t0: 10, base: 200, espessura: 300, delta: 3 }
  const alturas = [0, 100, 200, 300, 400, 500, 600, 700]
  it('o perfil cai 6,5 °C/km, sobe `delta` na camada e volta a cair', () => {
    expect(temperaturaNaAltura(p, 0)).toBe(10)
    expect(temperaturaNaAltura(p, 200)).toBeCloseTo(10 - GRAD_NORMAL * 0.2, 9)
    expect(temperaturaNaAltura(p, 500)).toBeCloseTo(10 - GRAD_NORMAL * 0.2 + 3, 9)
    expect(temperaturaNaAltura(p, 700)).toBeCloseTo(10 - GRAD_NORMAL * 0.2 + 3 - GRAD_NORMAL * 0.2, 9)
  })
  it('a camada de inversão lida na tabela é exatamente a configurada', () => {
    expect(camadasDeInversao(perfilInversao(p, alturas))).toEqual([{ de: 200, ate: 500 }])
  })
  it('sem aquecimento (delta 0) não há camada de inversão', () => {
    expect(camadasDeInversao(perfilInversao({ ...p, delta: 0 }, alturas))).toEqual([])
  })
  it('perfil normal (queda constante) não tem inversão', () => {
    expect(camadasDeInversao(perfilInversao({ t0: 10, base: 0, espessura: 1000, delta: -6.5 }, alturas))).toEqual([])
  })
})

describe('Ilha de calor', () => {
  it('o centro é o mais quente; água, parque e campo são os mais frescos', () => {
    const nivel = (id: string) => SUPERFICIES.find((s) => s.id === id)!.nivel
    expect(nivel('centro')).toBe(4)
    expect(Math.max(...SUPERFICIES.map((s) => s.nivel))).toBe(4)
    for (const id of ['rio', 'parque', 'campo']) expect(nivel(id)).toBe(1)
    expect(nivel('suburbio')).toBeLessThan(nivel('residencial'))
  })
  it('as medidas reduzem o nível, nunca abaixo de 1', () => {
    expect(nivelComMedidas(4, [])).toBe(4)
    expect(nivelComMedidas(4, ['arvores'])).toBe(3)
    expect(nivelComMedidas(4, ['arvores', 'telhado'])).toBe(2)
    expect(nivelComMedidas(1, ['arvores', 'telhado'])).toBe(1)
  })
})
