import { K1, K2, TOTAL, equilibrioAB, estadoAB, kc, particulasB, permutacao, tempoAteEquilibrio } from './dinamico'

describe('Equilíbrio dinâmico A ⇌ B', () => {
  it('a soma das concentrações se conserva e nenhuma fica negativa', () => {
    for (const inicio of ['reagente', 'produto'] as const)
      for (let t = 0; t <= 6; t += 0.25) {
        const e = estadoAB(t, inicio)
        expect(e.a + e.b).toBeCloseTo(TOTAL, 12)
        expect(e.a).toBeGreaterThanOrEqual(0)
        expect(e.b).toBeGreaterThanOrEqual(0)
      }
  })
  it('a solução obedece à lei de velocidade: d[A]/dt = −v direta + v inversa (derivada numérica)', () => {
    for (const t of [0, 0.3, 0.9, 1.7, 3]) {
      const h = 1e-5
      const deriv = (estadoAB(t + h).a - estadoAB(t - h > 0 ? t - h : 0).a) / (t - h > 0 ? 2 * h : h)
      const e = estadoAB(t)
      expect(deriv).toBeCloseTo(-e.vDireta + e.vInversa, 4)
    }
  })
  it('no equilíbrio as velocidades se igualam e Kc = [B]/[A] = k1/k2; as concentrações não são iguais', () => {
    const eq = equilibrioAB()
    expect(K1 * eq.a).toBeCloseTo(K2 * eq.b, 12)
    expect(eq.b / eq.a).toBeCloseTo(kc(), 12)
    expect(Math.abs(eq.a - eq.b)).toBeGreaterThan(0.2)
    const longe = estadoAB(30)
    expect(longe.vDireta).toBeCloseTo(longe.vInversa, 10)
  })
  it('começando pelo produto, chega ao mesmo equilíbrio', () => {
    const a = estadoAB(30, 'reagente')
    const b = estadoAB(30, 'produto')
    expect(a.a).toBeCloseTo(b.a, 10)
    expect(a.b).toBeCloseTo(b.b, 10)
  })
  it('a partir do tempo de equilíbrio, as concentrações ficam a menos de 1% da distância inicial', () => {
    const t = tempoAteEquilibrio(0.01)
    const eq = equilibrioAB()
    expect(Math.abs(estadoAB(t).a - eq.a)).toBeCloseTo(0.01 * (TOTAL - eq.a), 10)
    expect(Math.abs(estadoAB(t - 0.5).a - eq.a)).toBeGreaterThan(0.01 * (TOTAL - eq.a))
  })
  it('a caixa de partículas acompanha [B] e, no equilíbrio, troca partículas sem mudar a contagem', () => {
    expect(new Set(permutacao(30)).size).toBe(30)
    expect(particulasB(0, 30).size).toBe(0)
    expect(particulasB(0, 30, 'produto').size).toBe(30)
    const t1 = 3.5
    const t2 = 3.5 + 1 / 6
    const p1 = particulasB(t1, 30)
    const p2 = particulasB(t2, 30)
    expect(p1.size).toBe(p2.size)
    expect(p1.size).toBe(Math.round(equilibrioAB().b * 30))
    // uma entrou e uma saiu
    expect([...p2].filter((i) => !p1.has(i))).toHaveLength(1)
  })
})
