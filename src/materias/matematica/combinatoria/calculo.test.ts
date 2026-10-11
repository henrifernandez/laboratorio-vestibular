import { anagramas, arranjo, combinacao, fatorial, permutacao, permutacaoComRepeticao, probabilidade, listarArranjos, listarCombinacoes } from './calculo'

describe('fatorial e permutação', () => {
  it('fatorial', () => {
    expect(fatorial(0)).toBe(1)
    expect(fatorial(1)).toBe(1)
    expect(fatorial(5)).toBe(120)
    expect(fatorial(10)).toBe(3628800)
  })
  it('fatorial inválido', () => {
    expect(fatorial(-1)).toBeNaN()
    expect(fatorial(2.5)).toBeNaN()
  })
  it('permutação simples', () => {
    expect(permutacao(4)).toBe(24)
  })
  it('permutação com repetição', () => {
    expect(permutacaoComRepeticao(5, [3, 2])).toBe(10)
    expect(permutacaoComRepeticao(6, [3, 2, 1])).toBe(60)
  })
  it('anagramas de uma palavra', () => {
    expect(anagramas('ARARA')).toBe(10)
    expect(anagramas('AMOR')).toBe(24)
    expect(anagramas('BANANA')).toBe(60)
    expect(anagramas('')).toBe(1)
  })
})

describe('arranjo e combinação', () => {
  it('arranjo A(n,p) = n!/(n-p)!', () => {
    expect(arranjo(5, 2)).toBe(20)
    expect(arranjo(8, 3)).toBe(336)
    expect(arranjo(4, 4)).toBe(24)
    expect(arranjo(3, 0)).toBe(1)
  })
  it('combinação C(n,p) = n!/(p!(n-p)!)', () => {
    expect(combinacao(5, 2)).toBe(10)
    expect(combinacao(8, 3)).toBe(56)
    expect(combinacao(10, 0)).toBe(1)
    expect(combinacao(10, 10)).toBe(1)
  })
  it('simetria e relação com o arranjo', () => {
    expect(combinacao(9, 3)).toBe(combinacao(9, 6))
    expect(arranjo(7, 3)).toBe(combinacao(7, 3) * fatorial(3))
  })
  it('p maior que n não tem possibilidades', () => {
    expect(arranjo(3, 5)).toBe(0)
    expect(combinacao(3, 5)).toBe(0)
  })
  it('combinação grande sem estourar (C(40,20))', () => {
    expect(combinacao(40, 20)).toBe(137846528820)
  })
})

describe('listagens', () => {
  it('lista os arranjos de 2 entre 3 elementos', () => {
    expect(listarArranjos(['A', 'B', 'C'], 2)).toEqual(['AB', 'AC', 'BA', 'BC', 'CA', 'CB'])
  })
  it('lista as combinações de 2 entre 4 elementos', () => {
    expect(listarCombinacoes(['A', 'B', 'C', 'D'], 2)).toEqual(['AB', 'AC', 'AD', 'BC', 'BD', 'CD'])
  })
  it('tamanhos batem com as fórmulas', () => {
    expect(listarArranjos(['A', 'B', 'C', 'D', 'E'], 3)).toHaveLength(arranjo(5, 3))
    expect(listarCombinacoes(['A', 'B', 'C', 'D', 'E'], 3)).toHaveLength(combinacao(5, 3))
  })
})

describe('probabilidade', () => {
  it('casos favoráveis ÷ casos possíveis', () => {
    expect(probabilidade(1, 6)).toBeCloseTo(1 / 6)
    expect(probabilidade(3, 6)).toBe(0.5)
  })
  it('sem casos possíveis é inválida', () => {
    expect(probabilidade(1, 0)).toBeNaN()
  })
})
