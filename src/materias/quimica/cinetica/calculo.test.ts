import {
  LN2,
  comCatalisador,
  concentracao,
  deltaH,
  eaDireta,
  eaInversa,
  ehEndotermica,
  fatorRegraDez,
  fracaoEfetiva,
  kDeMeiaVida,
  meiaVida,
  meiaVidaDeK,
  ordemDe,
  razaoArrhenius,
  restante,
  velocidade,
} from './calculo'

describe('lei de velocidade', () => {
  it('v = k [A]^m [B]^n', () => {
    expect(velocidade(2, [1, 2], [0.5, 3])).toBeCloseTo(2 * 0.5 * 9, 12)
    expect(velocidade(5, [0], [10])).toBe(5)
  })
  it('o método das velocidades iniciais recupera as ordens', () => {
    for (const [m, n] of [[1, 1], [2, 0], [0, 1], [1, 2], [2, 1]] as const) {
      const k = 3
      const exps = [
        { conc: [0.1, 0.1], v: velocidade(k, [m, n], [0.1, 0.1]) },
        { conc: [0.2, 0.1], v: velocidade(k, [m, n], [0.2, 0.1]) },
        { conc: [0.1, 0.3], v: velocidade(k, [m, n], [0.1, 0.3]) },
      ]
      expect(ordemDe(exps, 0)).toBeCloseTo(m, 9)
      expect(ordemDe(exps, 1)).toBeCloseTo(n, 9)
    }
  })
  it('sem experimentos comparáveis devolve null', () => {
    expect(ordemDe([{ conc: [1, 1], v: 1 }, { conc: [2, 2], v: 4 }], 0)).toBeNull()
  })
})

describe('decaimento', () => {
  it('meia-vida: depois de cada t½ resta a metade', () => {
    expect(restante(100, 20, 20)).toBeCloseTo(50, 9)
    expect(restante(100, 60, 20)).toBeCloseTo(12.5, 9)
    expect(restante(80, 15, 5)).toBeCloseTo(10, 9)
  })
  it('k e t½ se convertem: t½ = ln 2 / k', () => {
    expect(meiaVidaDeK(kDeMeiaVida(46))).toBeCloseTo(46, 9)
    expect(LN2).toBeCloseTo(0.693, 3)
  })
  it('as fórmulas integradas conferem com a meia-vida de cada ordem', () => {
    for (const [ordem, a0, k] of [[0, 2, 0.1], [1, 2, 0.1], [2, 2, 0.1]] as const) {
      const th = meiaVida(ordem, a0, k)
      expect(concentracao(ordem, a0, k, th)).toBeCloseTo(a0 / 2, 9)
      expect(concentracao(ordem, a0, k, 0)).toBeCloseTo(a0, 12)
    }
  })
  it('ordem 1 coincide com a regra de meia-vida; ordem 0 acaba em A₀/k', () => {
    expect(concentracao(1, 100, kDeMeiaVida(20), 40)).toBeCloseTo(restante(100, 40, 20), 9)
    expect(concentracao(0, 1, 0.1, 10)).toBe(0)
    expect(concentracao(0, 1, 0.1, 20)).toBe(0)
  })
  it('a concentração só diminui, em qualquer ordem', () => {
    for (const ordem of [0, 1, 2] as const) {
      let anterior = Infinity
      for (let t = 0; t <= 30; t += 1) {
        const c = concentracao(ordem, 1, 0.07, t)
        expect(c).toBeLessThanOrEqual(anterior + 1e-12)
        anterior = c
      }
    }
  })
})

describe('temperatura', () => {
  it('regra de dez graus: 20 °C → 50 °C multiplica por 8', () => {
    expect(fatorRegraDez(293, 323)).toBeCloseTo(8, 9)
    expect(fatorRegraDez(300, 290)).toBeCloseTo(0.5, 9)
  })
  it('Arrhenius: com Ea ≈ 50 kJ/mol, +10 K perto de 300 K quase dobra a velocidade (regra aproximada)', () => {
    expect(razaoArrhenius(50, 300, 310)).toBeGreaterThan(1.8)
    expect(razaoArrhenius(50, 300, 310)).toBeLessThan(2.1)
    expect(razaoArrhenius(50, 300, 300)).toBeCloseTo(1, 12)
  })
  it('a fração de colisões efetivas cai com Ea e sobe com T', () => {
    expect(fracaoEfetiva(5, 300)).toBeCloseTo(Math.exp(-5000 / (8.314 * 300)), 12)
    expect(fracaoEfetiva(5, 300)).toBeGreaterThan(fracaoEfetiva(10, 300))
    expect(fracaoEfetiva(5, 350)).toBeGreaterThan(fracaoEfetiva(5, 300))
  })
})

describe('diagrama de energia', () => {
  const d = { hr: 20, hts: 80, hp: 50 }
  it('Ea direta, Ea inversa e ΔH', () => {
    expect(eaDireta(d)).toBe(60)
    expect(eaInversa(d)).toBe(30)
    expect(deltaH(d)).toBe(30)
    expect(ehEndotermica(d)).toBe(true)
    expect(ehEndotermica({ hr: 50, hts: 80, hp: 20 })).toBe(false)
  })
  it('conservação: Ea direta − Ea inversa = ΔH', () => {
    for (const x of [d, { hr: 10, hts: 100, hp: -20 }, { hr: 0, hts: 40, hp: 40 }]) expect(eaDireta(x) - eaInversa(x)).toBe(deltaH(x))
  })
  it('o catalisador reduz as duas barreiras em igual quantidade e não muda ΔH', () => {
    const c = comCatalisador(d, 25)
    expect(eaDireta(c)).toBe(35)
    expect(eaInversa(c)).toBe(5)
    expect(deltaH(c)).toBe(deltaH(d))
  })
})
