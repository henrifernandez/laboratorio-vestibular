import { amplitude, desvioPadrao, histograma, media, mediaPonderada, mediana, moda, variancia } from './calculo'

describe('média', () => {
  it('média aritmética', () => {
    expect(media([2, 4, 6])).toBe(4)
    expect(media([1, 2, 3, 4])).toBe(2.5)
    expect(media([7])).toBe(7)
  })
  it('lista vazia não tem média', () => {
    expect(media([])).toBeNaN()
  })
  it('média ponderada por frequências', () => {
    expect(mediaPonderada([{ valor: 2, freq: 3 }, { valor: 4, freq: 1 }])).toBe(2.5)
    expect(mediaPonderada([{ valor: 5, freq: 0 }])).toBeNaN()
  })
})

describe('mediana', () => {
  it('quantidade ímpar: termo central depois de ordenar', () => {
    expect(mediana([9, 1, 5])).toBe(5)
    expect(mediana([3, 1, 2, 10, 4])).toBe(3)
  })
  it('quantidade par: média dos dois centrais', () => {
    expect(mediana([4, 1, 3, 2])).toBe(2.5)
    expect(mediana([10, 2])).toBe(6)
  })
  it('não altera a lista original', () => {
    const l = [3, 1, 2]
    mediana(l)
    expect(l).toEqual([3, 1, 2])
  })
})

describe('moda', () => {
  it('valor mais frequente', () => {
    expect(moda([1, 2, 2, 3])).toEqual([2])
  })
  it('amodal quando todos aparecem o mesmo número de vezes', () => {
    expect(moda([1, 2, 3])).toEqual([])
  })
  it('bimodal', () => {
    expect(moda([1, 1, 2, 2, 3])).toEqual([1, 2])
  })
})

describe('dispersão', () => {
  it('amplitude', () => {
    expect(amplitude([5, 1, 9])).toBe(8)
  })
  it('variância e desvio padrão populacionais', () => {
    expect(variancia([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4)
    expect(desvioPadrao([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2)
    expect(desvioPadrao([3, 3, 3])).toBe(0)
  })
})

describe('histograma', () => {
  it('conta valores por classe [a, b)', () => {
    const h = histograma([1, 2, 2, 3, 4, 5, 6], 0, 2, 4)
    expect(h.map((c) => c.freq)).toEqual([1, 3, 2, 1])
    expect(h[0]).toMatchObject({ de: 0, ate: 2 })
    expect(h[3]).toMatchObject({ de: 6, ate: 8 })
  })
  it('valor no limite superior vai para a classe seguinte', () => {
    const h = histograma([2], 0, 2, 2)
    expect(h.map((c) => c.freq)).toEqual([0, 1])
  })
  it('valores fora das classes são ignorados', () => {
    expect(histograma([-1, 100], 0, 2, 2).map((c) => c.freq)).toEqual([0, 0])
  })
})
