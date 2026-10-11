import {
  montanteComposto,
  montanteSimples,
  fatorSucessivo,
  variacaoTotal,
  primeiroMesQueComposto,
  aplicarPercentuais,
} from './calculo'

describe('juros simples e compostos', () => {
  it('montante simples: C(1 + i·t)', () => {
    expect(montanteSimples(1000, 0.1, 3)).toBeCloseTo(1300)
    expect(montanteSimples(2000, 0.05, 0)).toBe(2000)
  })
  it('montante composto: C(1 + i)^t', () => {
    expect(montanteComposto(1000, 0.1, 3)).toBeCloseTo(1331)
    expect(montanteComposto(1000, 0.1, 0)).toBe(1000)
    expect(montanteComposto(500, 0.02, 2)).toBeCloseTo(520.2)
  })
  it('no primeiro período os dois regimes coincidem', () => {
    expect(montanteComposto(800, 0.07, 1)).toBeCloseTo(montanteSimples(800, 0.07, 1))
  })
  it('depois do primeiro período o composto passa o simples (mesma taxa)', () => {
    for (let t = 2; t <= 20; t++) expect(montanteComposto(1000, 0.05, t)).toBeGreaterThan(montanteSimples(1000, 0.05, t))
  })
})

describe('aumentos e descontos sucessivos', () => {
  it('+10% e depois -10% não volta ao valor inicial', () => {
    expect(fatorSucessivo([10, -10])).toBeCloseTo(0.99)
    expect(variacaoTotal([10, -10])).toBeCloseTo(-1)
  })
  it('dois aumentos de 20%: 44%', () => {
    expect(variacaoTotal([20, 20])).toBeCloseTo(44)
  })
  it('desconto de 50% seguido de aumento de 100% volta ao inicial', () => {
    expect(fatorSucessivo([-50, 100])).toBeCloseTo(1)
  })
  it('lista vazia não muda nada', () => {
    expect(fatorSucessivo([])).toBe(1)
    expect(variacaoTotal([])).toBe(0)
  })
  it('aplicarPercentuais devolve o valor depois de cada etapa', () => {
    const r = aplicarPercentuais(200, [10, -10])
    expect(r[0]).toBe(200)
    expect(r[1]).toBeCloseTo(220)
    expect(r[2]).toBeCloseTo(198)
  })
})

describe('quando o composto ultrapassa o simples', () => {
  it('composto 6% vs simples 10%', () => {
    // (1,06)^t > 1 + 0,10 t  → primeiro t inteiro
    const t = primeiroMesQueComposto(0.06, 0.1)
    expect(t).not.toBeNull()
    expect(montanteComposto(1, 0.06, t as number)).toBeGreaterThan(montanteSimples(1, 0.1, t as number))
    expect(montanteComposto(1, 0.06, (t as number) - 1)).toBeLessThanOrEqual(montanteSimples(1, 0.1, (t as number) - 1))
  })
  it('taxa igual: empata no mês 1 e o composto passa no mês 2; taxa maior: passa já no mês 1', () => {
    expect(primeiroMesQueComposto(0.1, 0.1)).toBe(2)
    expect(primeiroMesQueComposto(0.2, 0.1)).toBe(1)
  })
  it('devolve null se não houver cruzamento dentro do limite', () => {
    expect(primeiroMesQueComposto(0.001, 0.2, 60)).toBeNull()
  })
})
