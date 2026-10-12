import { fracaoEfetiva } from './calculo'
import { LADO, RAIO, contar, criarEstado, eaEfetiva, rodar, sigma, sortearEnergias, type Parametros } from './simulacao'

const base: Parametros = { T: 300, ea: 5, nA: 30, nB: 30, catalisador: false }

describe('simulação de colisões', () => {
  it('é reprodutível: mesma semente, mesmo resultado', () => {
    const a = criarEstado(base, 7)
    const b = criarEstado(base, 7)
    rodar(a, base, 5)
    rodar(b, base, 5)
    expect(a.efetivas).toBe(b.efetivas)
    expect(a.colisoes).toBe(b.colisoes)
    expect(a.particulas.map((p) => [p.x, p.y])).toEqual(b.particulas.map((p) => [p.x, p.y]))
  })
  it('semente diferente, história diferente', () => {
    const a = criarEstado(base, 1)
    const b = criarEstado(base, 2)
    rodar(a, base, 5)
    rodar(b, base, 5)
    expect(a.particulas.map((p) => p.x)).not.toEqual(b.particulas.map((p) => p.x))
  })
  it('as partículas nunca saem da caixa', () => {
    const p = { ...base, T: 500, ea: 2 }
    const e = criarEstado(p, 3)
    for (let i = 0; i < 40; i++) {
      rodar(e, p, 0.5)
      for (const q of e.particulas) {
        expect(q.x).toBeGreaterThanOrEqual(RAIO - 1e-9)
        expect(q.x).toBeLessThanOrEqual(LADO - RAIO + 1e-9)
        expect(q.y).toBeGreaterThanOrEqual(RAIO - 1e-9)
        expect(q.y).toBeLessThanOrEqual(LADO - RAIO + 1e-9)
      }
    }
  })
  it('conserva a matéria: A + C = A₀ e B + C = B₀ o tempo todo', () => {
    const p = { ...base, nA: 40, nB: 25 }
    const e = criarEstado(p, 11)
    for (let i = 0; i < 20; i++) {
      rodar(e, p, 1)
      const c = contar(e, 'C')
      expect(contar(e, 'A') + c).toBe(40)
      expect(contar(e, 'B') + c).toBe(25)
      expect(e.efetivas).toBe(c)
    }
  })
  it('o reagente só diminui e o produto só aumenta', () => {
    const e = criarEstado(base, 5)
    rodar(e, base, 15)
    for (let i = 1; i < e.serie.length; i++) {
      expect(e.serie[i]![1]).toBeLessThanOrEqual(e.serie[i - 1]![1])
      expect(e.serie[i]![3]).toBeGreaterThanOrEqual(e.serie[i - 1]![3])
    }
    expect(e.serie.length).toBeGreaterThan(50)
  })
  it('a distribuição de energias é a esperada: fração com E ≥ Ea é exp(−Ea/RT)', () => {
    for (const [T, ea] of [[300, 5], [300, 2], [400, 8], [250, 3]] as const) {
      const E = sortearEnergias(T, 40000, 99)
      const frac = E.filter((x) => x >= ea * 1000).length / E.length
      expect(frac).toBeCloseTo(fracaoEfetiva(ea, T), 2)
    }
  })
  it('a energia relativa média é R·T (equipartição em 2D)', () => {
    const E = sortearEnergias(300, 40000, 5)
    const media = E.reduce((s, x) => s + x, 0) / E.length
    expect(media / (8.314 * 300)).toBeCloseTo(1, 1)
    expect(sigma(300)).toBeCloseTo(Math.sqrt(8.314 * 300), 9)
  })

  /** produto formado depois de 12 s, em média sobre várias sementes */
  const media = (p: Parametros) => {
    let soma = 0
    for (let s = 1; s <= 8; s++) {
      const e = criarEstado(p, s)
      rodar(e, p, 12)
      soma += contar(e, 'C')
    }
    return soma / 8
  }
  it('mais calor, mais produto (a velocidade cresce com a temperatura)', () => {
    expect(media({ ...base, T: 400 })).toBeGreaterThan(media({ ...base, T: 300 }))
  })
  it('barreira maior, menos produto', () => {
    expect(media({ ...base, ea: 3 })).toBeGreaterThan(media({ ...base, ea: 9 }))
  })
  it('o catalisador (barreira 40 % menor) aumenta a velocidade', () => {
    const p = { ...base, ea: 8 }
    expect(eaEfetiva({ ...p, catalisador: true })).toBeCloseTo(4.8, 9)
    expect(media({ ...p, catalisador: true })).toBeGreaterThan(media(p))
  })
  it('mais partículas (maior concentração), mais colisões por segundo', () => {
    const colisoes = (n: number) => {
      let soma = 0
      for (let s = 1; s <= 6; s++) {
        // barreira altíssima: ninguém reage, só se contam as colisões
        const p = { ...base, ea: 1000, nA: n, nB: n }
        const e = criarEstado(p, s)
        rodar(e, p, 6)
        soma += e.colisoes
      }
      return soma
    }
    expect(colisoes(40)).toBeGreaterThan(colisoes(15) * 2)
  })
  it('com barreira enorme nenhuma colisão é efetiva', () => {
    const p = { ...base, ea: 1000 }
    const e = criarEstado(p, 4)
    rodar(e, p, 8)
    expect(e.colisoes).toBeGreaterThan(5)
    expect(e.efetivas).toBe(0)
  })
})
