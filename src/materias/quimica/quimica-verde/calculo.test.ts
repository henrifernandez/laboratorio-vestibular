import { massaMolar } from '../comum/elementos'
import { balancear } from '../estequiometria/calculo'
import {
  COMBUSTIVEIS,
  REACOES_VERDES,
  co2PorGrama,
  co2PorMJ,
  co2PorMol,
  combustivel,
  economiaAtomica,
  fatorE,
  fluxos,
  h2so4DeEnxofre,
  massaCO2,
  massaDesejada,
  massaReagentes,
  phChuva,
  reacaoVerde,
  so2DeEnxofre,
  solAbsorvido,
  temperaturaSuperficie,
} from './calculo'

describe('combustíveis', () => {
  it('as equações da biblioteca estão balanceadas (conferidas pelo balanceador)', () => {
    for (const c of COMBUSTIVEIS) expect(balancear([c.formula, 'O2'], ['CO2', 'H2O']), c.id).toEqual([...c.coefs])
  })
  it('CO₂ por grama de combustível, calculado à mão', () => {
    expect(co2PorGrama(combustivel('metano'))).toBeCloseTo(44 / 16, 9)
    expect(co2PorGrama(combustivel('etanol'))).toBeCloseTo(88 / 46, 9)
    expect(co2PorGrama(combustivel('propano'))).toBeCloseTo(3, 9)
    expect(co2PorGrama(combustivel('octano'))).toBeCloseTo(352 / 114, 9)
    expect(co2PorGrama(combustivel('butano'))).toBeCloseTo(176 / 58, 9)
  })
  it('conservação do carbono: a massa de C no combustível é a massa de C no CO₂', () => {
    for (const c of COMBUSTIVEIS) {
      const mol = 1
      const carbonoNoCombustivel = (c.formula.match(/C(\d*)/)?.[1] ? Number(c.formula.match(/C(\d*)/)![1] || 1) : 1) * mol
      expect(co2PorMol(c)).toBeCloseTo(c.formula === 'C2H5OH' ? 2 : carbonoNoCombustivel, 9)
    }
  })
  it('conservação da massa em cada equação', () => {
    for (const c of COMBUSTIVEIS) {
      const [a, b, p, q] = c.coefs
      expect(a * massaMolar(c.formula) + b * 32).toBeCloseTo(p * 44 + q * 18, 9)
    }
  })
  it('g de CO₂ por MJ: gás natural emite menos que etanol, gasolina e GLP', () => {
    expect(co2PorMJ(combustivel('metano'))).toBeCloseTo(49.4, 1)
    expect(co2PorMJ(combustivel('etanol'))).toBeCloseTo(64.4, 1)
    expect(co2PorMJ(combustivel('octano'))).toBeCloseTo(64.3, 1)
    expect(co2PorMJ(combustivel('butano'))).toBeCloseTo(61.2, 1)
    expect(co2PorMJ(combustivel('propano'))).toBeCloseTo(59.5, 1)
    for (const c of COMBUSTIVEIS) if (c.id !== 'metano') expect(co2PorMJ(c)).toBeGreaterThan(co2PorMJ(combustivel('metano')))
  })
  it('a massa de CO₂ de 4,6 kg de etanol é 8,8 kg', () => {
    expect(massaCO2(combustivel('etanol'), 4600)).toBeCloseTo(8800, 6)
  })
})

describe('enxofre e chuva ácida', () => {
  it('20 kg de S → 40 kg de SO₂ → 61,25 kg de H₂SO₄', () => {
    expect(so2DeEnxofre(20)).toBeCloseTo(40, 9)
    expect(h2so4DeEnxofre(20)).toBeCloseTo(61.25, 9)
  })
  it('o pH da chuva natural é 5,6 e diminui com o ácido forte', () => {
    expect(phChuva(0)).toBeCloseTo(5.6, 6)
    expect(phChuva(1e-5)).toBeCloseTo(5.0, 1)
    expect(phChuva(1e-4)).toBeCloseTo(4.0, 1)
    let anterior = Infinity
    for (const c of [0, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3]) {
      const v = phChuva(c)
      expect(v).toBeLessThan(anterior + 1e-12)
      anterior = v
    }
  })
})

describe('efeito estufa (modelo de uma camada)', () => {
  it('sem atmosfera a Terra teria ≈ 255 K (−18 °C)', () => {
    expect(temperaturaSuperficie(0.3, 0)).toBeCloseTo(254.6, 0)
    expect(solAbsorvido(0.3)).toBeCloseTo(238.2, 1)
  })
  it('com ε ≈ 0,78 o modelo dá ≈ 288 K (15 °C)', () => {
    expect(temperaturaSuperficie(0.3, 0.78)).toBeCloseTo(288, 0)
  })
  it('a temperatura cresce com ε e cai com o albedo', () => {
    expect(temperaturaSuperficie(0.3, 0.9)).toBeGreaterThan(temperaturaSuperficie(0.3, 0.5))
    expect(temperaturaSuperficie(0.4, 0.78)).toBeLessThan(temperaturaSuperficie(0.2, 0.78))
  })
  it('balanço de energia: topo da atmosfera e superfície', () => {
    for (const [a, e] of [[0.3, 0], [0.3, 0.5], [0.3, 0.78], [0.2, 0.9]] as const) {
      const f = fluxos(a, e)
      expect(f.escapa).toBeCloseTo(f.F, 6) // o que entra sai
      expect(f.F + f.contra).toBeCloseTo(f.superficie, 6) // a superfície emite o que absorve do Sol e da atmosfera
    }
  })
})

describe('química verde', () => {
  it('todas as equações estão balanceadas e conservam a massa', () => {
    for (const r of REACOES_VERDES) {
      expect(balancear(r.reagentes, r.produtos), r.id).toEqual(r.coefs)
      const nr = r.reagentes.length
      const prod = r.produtos.reduce((s, f, i) => s + (r.coefs[nr + i] as number) * massaMolar(f), 0)
      expect(massaReagentes(r), r.id).toBeCloseTo(prod, 9)
    }
  })
  it('economia atômica de casos conhecidos', () => {
    expect(economiaAtomica(reacaoVerde('hidrogenacao'))).toBeCloseTo(100, 9)
    expect(economiaAtomica(reacaoVerde('haber'))).toBeCloseTo(100, 9)
    expect(economiaAtomica(reacaoVerde('calcario-cao'))).toBeCloseTo(56, 9)
    expect(economiaAtomica(reacaoVerde('calcario-co2'))).toBeCloseTo(44, 9)
    expect(economiaAtomica(reacaoVerde('esterificacao'))).toBeCloseTo(83.02, 1)
    expect(economiaAtomica(reacaoVerde('neutralizacao'))).toBeCloseTo(76.47, 1)
    expect(economiaAtomica(reacaoVerde('clorometano'))).toBeCloseTo(58.05, 1)
  })
  it('economia atômica de produtos desejado + subprodutos soma 100 %', () => {
    const r = reacaoVerde('calcario-cao')
    expect(economiaAtomica(r) + economiaAtomica({ ...r, desejado: 2 })).toBeCloseTo(100, 9)
  })
  it('adições têm 100 %: todos os átomos vão para o produto', () => {
    for (const id of ['hidrogenacao', 'hidratacao', 'haber', 'adicao-hcl']) expect(economiaAtomica(reacaoVerde(id)), id).toBeCloseTo(100, 9)
  })
  it('fator E: (reagentes − produto) ÷ produto, com e sem rendimento', () => {
    const r = reacaoVerde('calcario-cao')
    expect(fatorE(r)).toBeCloseTo(44 / 56, 9)
    expect(fatorE(r, 0.8)).toBeCloseTo((100 - 0.8 * 56) / (0.8 * 56), 9)
    expect(fatorE(reacaoVerde('haber'))).toBeCloseTo(0, 9)
    expect(massaDesejada(r)).toBe(56)
  })
  it('fator E relaciona-se com a economia atômica: E = (100 − EA) ÷ EA', () => {
    for (const r of REACOES_VERDES) {
      const ea = economiaAtomica(r)
      expect(fatorE(r)).toBeCloseTo((100 - ea) / ea, 9)
    }
  })
})
