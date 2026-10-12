import {
  REACOES_EQ,
  deltaGas,
  deslocamento,
  equilibrioN2O4,
  especies,
  grauIonizacao,
  hAcidoFraco,
  hAcidoFracoAprox,
  hAcidoForte,
  hDePh,
  kaDePh,
  kc,
  kcN2O4,
  pH,
  phAcidoForte,
  phBaseForte,
  phTitulacao,
  reacaoEq,
  volumeEquivalencia,
  type Perturbacao,
  type Sentido,
} from './calculo'

describe('pH de ácidos e bases fortes', () => {
  it('valores conhecidos', () => {
    expect(phAcidoForte(0.01)).toBeCloseTo(2, 6)
    expect(phAcidoForte(1)).toBeCloseTo(0, 6)
    expect(phBaseForte(0.001)).toBeCloseTo(11, 6)
    expect(pH(2e-4)).toBeCloseTo(3.699, 3)
    expect(hDePh(5)).toBeCloseTo(1e-5, 12)
  })
  it('diluir 10 vezes um ácido forte aumenta o pH em 1 (quando concentrado o bastante)', () => {
    for (const c of [1, 0.1, 0.01, 1e-3]) expect(phAcidoForte(c / 10) - phAcidoForte(c)).toBeCloseTo(1, 3)
  })
  it('diluir muito nunca leva o ácido além de 7: a água limita', () => {
    expect(phAcidoForte(1e-8)).toBeCloseTo(6.978, 3)
    expect(phAcidoForte(1e-10)).toBeLessThan(7)
    expect(phAcidoForte(1e-10)).toBeCloseTo(7, 2)
    expect(phBaseForte(1e-8)).toBeGreaterThan(7)
  })
  it('[H⁺]·[OH⁻] = 10⁻¹⁴ e pH + pOH = 14', () => {
    const h = hAcidoForte(3e-5)
    const oh = 1e-14 / h
    expect(pH(h) + -Math.log10(oh)).toBeCloseTo(14, 9)
  })
})

describe('ácido fraco', () => {
  it('ácido acético 0,1 mol/L (Ka = 1,8·10⁻⁵): pH ≈ 2,88 e ≈ 1,3 % ionizado', () => {
    const h = hAcidoFraco(1.8e-5, 0.1)
    expect(pH(h)).toBeCloseTo(2.875, 3)
    expect(grauIonizacao(h, 0.1) * 100).toBeCloseTo(1.33, 1)
  })
  it('a aproximação √(Ka·C) concorda com a solução exata quando ionização < 5 %', () => {
    const exato = hAcidoFraco(1e-5, 0.1)
    const aprox = hAcidoFracoAprox(1e-5, 0.1)
    expect(Math.abs(exato - aprox) / exato).toBeLessThan(0.01)
  })
  it('a solução exata satisfaz Ka = x² / (C − x)', () => {
    const x = hAcidoFraco(4e-4, 0.05)
    expect((x * x) / (0.05 - x)).toBeCloseTo(4e-4, 12)
  })
  it('Ka a partir do pH: pH 3 numa solução 0,1 mol/L dá 10⁻⁵', () => {
    expect(kaDePh(3, 0.1)).toBeCloseTo(1e-5, 12)
  })
})

describe('titulação', () => {
  const forte = { ca: 0.1, va: 25, ka: null, cb: 0.1 }
  it('ácido forte × base forte: pontos conhecidos da curva', () => {
    expect(phTitulacao(forte, 0)).toBeCloseTo(1, 4)
    expect(volumeEquivalencia(forte)).toBe(25)
    expect(phTitulacao(forte, 25)).toBeCloseTo(7, 4)
    // 24,9 mL: sobra 0,01 mmol de H⁺ em 49,9 mL
    expect(phTitulacao(forte, 24.9)).toBeCloseTo(-Math.log10(0.01 / 49.9), 2)
    expect(phTitulacao(forte, 25.1)).toBeCloseTo(14 + Math.log10(0.01 / 50.1), 2)
  })
  it('o pH sobe sempre com a base adicionada (curva monótona)', () => {
    for (const t of [forte, { ca: 0.1, va: 25, ka: 1.8e-5, cb: 0.1 }]) {
      let anterior = -1
      for (let vb = 0; vb <= 50; vb += 0.5) {
        const v = phTitulacao(t, vb)
        expect(v).toBeGreaterThan(anterior - 1e-9)
        anterior = v
      }
    }
  })
  it('ácido fraco: no meio do caminho pH ≈ pKa e na equivalência pH ≈ 8,7', () => {
    const fraco = { ca: 0.1, va: 25, ka: 1.8e-5, cb: 0.1 }
    expect(phTitulacao(fraco, 12.5)).toBeCloseTo(-Math.log10(1.8e-5), 1)
    expect(phTitulacao(fraco, 25)).toBeCloseTo(8.72, 1)
    expect(phTitulacao(fraco, 0)).toBeCloseTo(2.875, 2)
  })
  it('conservação de carga em qualquer ponto (eletroneutralidade)', () => {
    const t = { ca: 0.2, va: 30, ka: 6e-5, cb: 0.15 }
    for (const vb of [5, 15, 30, 40, 60]) {
      const v = (t.va + vb) / 1000
      const h = hDePh(phTitulacao(t, vb))
      const na = (t.cb * vb) / 1000 / v
      const ct = (t.ca * t.va) / 1000 / v
      const a = (ct * t.ka) / (t.ka + h)
      expect(na + h).toBeCloseTo(a + 1e-14 / h, 10)
    }
  })
})

describe('Kc e deslocamento do equilíbrio', () => {
  it('Δn de gás', () => {
    expect(deltaGas(reacaoEq('haber'))).toBe(-2)
    expect(deltaGas(reacaoEq('n2o4'))).toBe(1)
    expect(deltaGas(reacaoEq('so3'))).toBe(-1)
    expect(deltaGas(reacaoEq('hi'))).toBe(0)
    expect(deltaGas(reacaoEq('calcario'))).toBe(1)
    expect(deltaGas(reacaoEq('shift'))).toBe(0)
  })
  it('expressão de Kc: expoentes pelos coeficientes e sólidos fora', () => {
    // H2 + I2 ⇌ 2 HI com [H2] = 0,5, [I2] = 0,5, [HI] = 3 → Kc = 9 / 0,25 = 36
    expect(kc(reacaoEq('hi'), [0.5, 0.5, 3])).toBeCloseTo(36, 9)
    // CaCO3 ⇌ CaO + CO2: só [CO2] aparece
    expect(kc(reacaoEq('calcario'), [10, 20, 0.25])).toBeCloseTo(0.25, 9)
    // N2 + 3 H2 ⇌ 2 NH3
    expect(kc(reacaoEq('haber'), [1, 2, 4])).toBeCloseTo(16 / (1 * 8), 9)
  })

  /** verificação numérica independente: compara o quociente Q depois da perturbação com K */
  function numerico(id: string, p: Perturbacao): Sentido {
    const r = reacaoEq(id)
    const todas = especies(r)
    const conc = todas.map(() => 1)
    const K = kc(r, conc)
    if (p.tipo === 'T') {
      const R = 8.314
      const T = 300
      const T2 = p.sobe ? 330 : 270
      const K2 = K * Math.exp((-(r.dH * 1000) / R) * (1 / T2 - 1 / T))
      return K2 > K * (1 + 1e-9) ? 'direta' : K2 < K * (1 - 1e-9) ? 'inversa' : 'nenhum'
    }
    const novas = conc.map((c, i) => {
      const e = todas[i]!
      const ativa = e.fase === 'g' || e.fase === 'aq'
      if (p.tipo === 'add') return i === p.especie && ativa ? c * 2 : c
      if (p.tipo === 'remove') return i === p.especie && ativa ? c * 0.5 : c
      if (p.tipo === 'P') return e.fase === 'g' ? c * (p.aumenta ? 2 : 0.5) : c
      return c
    })
    const Q = kc(r, novas)
    return Q < K * (1 - 1e-9) ? 'direta' : Q > K * (1 + 1e-9) ? 'inversa' : 'nenhum'
  }

  it('o princípio de Le Chatelier confere com a comparação numérica Q × K em todas as reações e perturbações', () => {
    let casos = 0
    for (const r of REACOES_EQ) {
      const n = especies(r).length
      const perturbacoes: Perturbacao[] = [
        ...Array.from({ length: n }, (_, i) => ({ tipo: 'add', especie: i }) as Perturbacao),
        ...Array.from({ length: n }, (_, i) => ({ tipo: 'remove', especie: i }) as Perturbacao),
        { tipo: 'T', sobe: true },
        { tipo: 'T', sobe: false },
        { tipo: 'P', aumenta: true },
        { tipo: 'P', aumenta: false },
        { tipo: 'cat' },
        { tipo: 'inerte' },
      ]
      for (const p of perturbacoes) {
        casos++
        expect(deslocamento(r, p).sentido, `${r.id} ${JSON.stringify(p)}`).toBe(numerico(r.id, p))
      }
    }
    expect(casos).toBeGreaterThan(90)
  })
  it('cada resposta traz uma explicação', () => {
    expect(deslocamento(reacaoEq('haber'), { tipo: 'P', aumenta: true }).porque).toContain('menos mols de gás')
    expect(deslocamento(reacaoEq('n2o4'), { tipo: 'T', sobe: true }).sentido).toBe('direta')
    expect(deslocamento(reacaoEq('calcario'), { tipo: 'add', especie: 0 }).codigo).toBe('solido')
  })
})

describe('N₂O₄ ⇌ 2 NO₂ (modelo do laboratório)', () => {
  it('Kc cresce com a temperatura e vale ≈ 0,006 a 298 K', () => {
    expect(kcN2O4(298)).toBeCloseTo(0.006, 6)
    expect(kcN2O4(350)).toBeGreaterThan(kcN2O4(300))
    expect(kcN2O4(250)).toBeLessThan(kcN2O4(298))
  })
  it('o equilíbrio calculado satisfaz Kc e conserva o nitrogênio', () => {
    for (const [c0, k] of [[0.1, 0.006], [0.2, 0.05], [0.05, 0.5]] as const) {
      const { n2o4, no2 } = equilibrioN2O4(c0, k)
      expect((no2 * no2) / n2o4).toBeCloseTo(k, 9)
      expect(n2o4 + no2 / 2).toBeCloseTo(c0, 12)
    }
  })
})
