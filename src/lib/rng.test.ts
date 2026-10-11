import { criarRng, sortear, embaralhar } from './rng'

describe('rng com semente', () => {
  it('é reproduzível para a mesma semente', () => {
    const a = criarRng(42)
    const b = criarRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('muda com sementes diferentes', () => {
    expect(criarRng(1)()).not.toBe(criarRng(2)())
  })

  it('fica em [0,1)', () => {
    const r = criarRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('sortear devolve inteiro dentro do intervalo inclusivo', () => {
    const r = criarRng(3)
    const vistos = new Set<number>()
    for (let i = 0; i < 500; i++) vistos.add(sortear(r, -2, 2))
    expect([...vistos].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2])
  })

  it('embaralhar mantém os elementos e não altera o original', () => {
    const original = [1, 2, 3, 4, 5]
    const r = embaralhar(criarRng(9), original)
    expect(original).toEqual([1, 2, 3, 4, 5])
    expect([...r].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })
})
