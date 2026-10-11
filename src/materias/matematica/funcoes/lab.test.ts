import { interseccoes, raizesNumericas } from './lab'

describe('ferramentas numéricas do laboratório', () => {
  it('interseção de uma reta com uma parábola', () => {
    // x² = x + 2  →  x = -1 ou x = 2
    const r = interseccoes((x) => x * x, (x) => x + 2, -5, 5)
    expect(r).toHaveLength(2)
    expect(r[0]!.x).toBeCloseTo(-1, 6)
    expect(r[0]!.y).toBeCloseTo(1, 6)
    expect(r[1]!.x).toBeCloseTo(2, 6)
    expect(r[1]!.y).toBeCloseTo(4, 6)
  })

  it('curvas que não se cruzam não têm interseção', () => {
    expect(interseccoes((x) => x * x + 1, () => 0, -5, 5)).toEqual([])
  })

  it('ignora a região onde uma das funções não existe', () => {
    // log2(x) = 1 só em x = 2; para x ≤ 0 o log é NaN
    const log2 = (x: number) => (x > 0 ? Math.log2(x) : NaN)
    const r = interseccoes(log2, () => 1, -5, 5)
    expect(r).toHaveLength(1)
    expect(r[0]!.x).toBeCloseTo(2, 6)
  })

  it('não confunde assíntota (salto) com cruzamento', () => {
    const r = interseccoes((x) => 1 / x, () => 0, -3, 3)
    expect(r).toEqual([])
  })

  it('raízes numéricas', () => {
    const r = raizesNumericas((x) => x * x - 4, -5, 5)
    expect(r.map((x) => Math.round(x * 1e6) / 1e6)).toEqual([-2, 2])
    expect(raizesNumericas((x) => x * x + 1, -5, 5)).toEqual([])
  })

  it('raiz dupla é encontrada quando a curva só encosta', () => {
    const r = raizesNumericas((x) => (x - 1) * (x - 1), -5, 5)
    expect(r).toHaveLength(1)
    expect(r[0]).toBeCloseTo(1, 3)
  })
})
