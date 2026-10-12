import { cruzar, valor } from './calculo'
import { sortearProle } from './simulacao'

const total = (m: Map<string, number>) => [...m.values()].reduce((s, x) => s + x, 0)

describe('Sorteio de descendentes', () => {
  it('conta exatamente n descendentes', () => {
    for (const n of [1, 10, 100, 1000]) expect(total(sortearProle('AaBb', 'AaBb', n, 5))).toBe(n)
  })
  it('é reproduzível com a mesma semente e muda com outra', () => {
    const a = sortearProle('Aa', 'Aa', 200, 7)
    const b = sortearProle('Aa', 'Aa', 200, 7)
    const c = sortearProle('Aa', 'Aa', 200, 8)
    expect([...a]).toEqual([...b])
    expect([...a]).not.toEqual([...c])
  })
  it('só produz genótipos possíveis (AA × aa dá só Aa)', () => {
    const m = sortearProle('AA', 'aa', 500, 3)
    expect([...m.keys()]).toEqual(['Aa'])
    expect(m.get('Aa')).toBe(500)
  })
  it('lei dos grandes números: com 200 000 descendentes, cada classe fica a menos de 0,5 ponto percentual do esperado', () => {
    for (const [pai, mae] of [
      ['Aa', 'Aa'],
      ['AaBb', 'AaBb'],
      ['AaBb', 'aabb'],
    ] as const) {
      const n = 200_000
      const obs = sortearProle(pai, mae, n, 11)
      for (const [g, p] of cruzar(pai, mae)) expect(Math.abs(((obs.get(g) ?? 0) / n) * 100 - valor(p) * 100), `${pai}×${mae} ${g}`).toBeLessThan(0.5)
    }
  })
  it('com poucos descendentes o resultado pode se afastar bastante do esperado (variação ao acaso)', () => {
    let maiorDesvio = 0
    for (let s = 1; s <= 60; s++) {
      const obs = sortearProle('Aa', 'Aa', 10, s)
      maiorDesvio = Math.max(maiorDesvio, Math.abs(((obs.get('aa') ?? 0) / 10) * 100 - 25))
    }
    expect(maiorDesvio).toBeGreaterThan(15)
  })
})
