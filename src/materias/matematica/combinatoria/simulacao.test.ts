import { criarRng } from '@/lib/rng'
import { contar, experimento, frequenciasAcumuladas, sequencia } from './simulacao'

describe('experimentos', () => {
  it('moeda, dado e urna têm as probabilidades teóricas certas', () => {
    expect(experimento('moeda', { vermelhas: 0, azuis: 0, verdes: 0 }).probs).toEqual([0.5, 0.5])
    const dado = experimento('dado', { vermelhas: 0, azuis: 0, verdes: 0 })
    expect(dado.probs).toHaveLength(6)
    expect(dado.probs[0]).toBeCloseTo(1 / 6)
    const urna = experimento('urna', { vermelhas: 3, azuis: 1, verdes: 0 })
    expect(urna.rotulos).toEqual(['vermelha', 'azul'])
    expect(urna.probs).toEqual([0.75, 0.25])
  })
  it('urna inclui só as cores que têm bolas', () => {
    const u = experimento('urna', { vermelhas: 2, azuis: 0, verdes: 2 })
    expect(u.rotulos).toEqual(['vermelha', 'verde'])
  })
})

describe('sequencia', () => {
  it('é reproduzível com a mesma semente', () => {
    const a = sequencia(criarRng(7), [0.5, 0.5], 100)
    const b = sequencia(criarRng(7), [0.5, 0.5], 100)
    expect(a).toEqual(b)
    expect(a).toHaveLength(100)
  })
  it('só gera resultados válidos', () => {
    const s = sequencia(criarRng(3), [0.2, 0.3, 0.5], 500)
    for (const x of s) expect([0, 1, 2]).toContain(x)
  })
  it('a frequência relativa se aproxima da probabilidade com muitas repetições (10.000)', () => {
    const s = sequencia(criarRng(11), [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6], 10000)
    const c = contar(s, 6, 10000)
    for (const k of c) expect(k / 10000).toBeGreaterThan(0.14)
    for (const k of c) expect(k / 10000).toBeLessThan(0.19)
  })
})

describe('contar e frequências acumuladas', () => {
  it('conta só até o limite dado', () => {
    expect(contar([0, 1, 1, 0, 1], 2, 3)).toEqual([1, 2])
    expect(contar([0, 1, 1, 0, 1], 2, 5)).toEqual([2, 3])
    expect(contar([0, 1], 2, 0)).toEqual([0, 0])
  })
  it('frequências acumuladas de um resultado em pontos de verificação', () => {
    const f = frequenciasAcumuladas([1, 0, 1, 1], 1, [1, 2, 4])
    expect(f).toEqual([
      { n: 1, freq: 1 },
      { n: 2, freq: 0.5 },
      { n: 4, freq: 0.75 },
    ])
  })
})
