import { classificar, somaPA, somaPG, somaPGInfinita, termoPA, termoPG, termosPA, termosPG } from './calculo'

describe('PA', () => {
  it('termo geral e soma', () => {
    expect(termoPA(3, 4, 1)).toBe(3)
    expect(termoPA(3, 4, 10)).toBe(39)
    expect(termoPA(10, -3, 5)).toBe(-2)
    expect(somaPA(1, 1, 100)).toBe(5050)
    expect(somaPA(3, 4, 10)).toBe(210)
  })
  it('lista de termos', () => {
    expect(termosPA(2, 5, 4)).toEqual([2, 7, 12, 17])
  })
})

describe('PG', () => {
  it('termo geral e soma', () => {
    expect(termoPG(3, 2, 1)).toBe(3)
    expect(termoPG(3, 2, 5)).toBe(48)
    expect(termoPG(81, 1 / 3, 4)).toBeCloseTo(3)
    expect(somaPG(1, 2, 10)).toBe(1023)
    expect(somaPG(5, 1, 4)).toBe(20)
  })
  it('soma infinita só quando |q| < 1', () => {
    expect(somaPGInfinita(1, 0.5)).toBe(2)
    expect(somaPGInfinita(9, 1 / 3)).toBeCloseTo(13.5)
    expect(somaPGInfinita(1, 2)).toBeNull()
    expect(somaPGInfinita(1, -1)).toBeNull()
  })
  it('lista de termos', () => {
    expect(termosPG(3, 2, 4)).toEqual([3, 6, 12, 24])
  })
})

describe('classificar', () => {
  it('reconhece PA e PG com a razão', () => {
    expect(classificar([2, 5, 8, 11])).toEqual({ tipo: 'PA', razao: 3 })
    expect(classificar([3, 6, 12, 24])).toEqual({ tipo: 'PG', razao: 2 })
    expect(classificar([16, 8, 4, 2])).toEqual({ tipo: 'PG', razao: 0.5 })
    expect(classificar([10, 7, 4, 1])).toEqual({ tipo: 'PA', razao: -3 })
  })
  it('sequência constante é PA de razão 0 (e PG de razão 1): devolve PA', () => {
    expect(classificar([4, 4, 4])).toEqual({ tipo: 'PA', razao: 0 })
  })
  it('PG com sinais alternados', () => {
    expect(classificar([1, -2, 4, -8])).toEqual({ tipo: 'PG', razao: -2 })
  })
  it('nem PA nem PG', () => {
    expect(classificar([1, 2, 4, 7])).toEqual({ tipo: 'nenhuma', razao: null })
    expect(classificar([1, 4, 9, 16])).toEqual({ tipo: 'nenhuma', razao: null })
  })
  it('menos de 3 termos não permite concluir', () => {
    expect(classificar([1, 2])).toEqual({ tipo: 'nenhuma', razao: null })
  })
  it('PG com zero não é PG', () => {
    expect(classificar([0, 0, 0]).tipo).toBe('PA')
    expect(classificar([0, 1, 2, 4]).tipo).toBe('nenhuma')
  })
})
