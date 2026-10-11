import { G, angulos, atwood, forcaResultante, mesaComPolia, plano } from './calculo'

const rad = (g: number) => (g * Math.PI) / 180

describe('plano inclinado', () => {
  it('componentes do peso e atrito máximo', () => {
    const p = plano({ m: 5, angulo: 30, mu: 0.5 })
    expect(p.peso).toBe(50)
    expect(p.paralela).toBeCloseTo(25)
    expect(p.normal).toBeCloseTo(50 * Math.cos(rad(30)))
    expect(p.atritoMax).toBeCloseTo(0.5 * p.normal)
  })
  it('desliza quando tg θ > μ (e a massa não importa)', () => {
    expect(plano({ m: 5, angulo: 30, mu: 0.5 }).desliza).toBe(true) // tg 30° = 0,577
    expect(plano({ m: 5, angulo: 30, mu: 0.6 }).desliza).toBe(false)
    expect(plano({ m: 500, angulo: 30, mu: 0.5 }).desliza).toBe(true)
    expect(plano({ m: 0.1, angulo: 30, mu: 0.6 }).desliza).toBe(false)
  })
  it('em repouso o atrito iguala a componente paralela do peso (não μ·N)', () => {
    const p = plano({ m: 10, angulo: 30, mu: 0.8 })
    expect(p.desliza).toBe(false)
    expect(p.atrito).toBeCloseTo(p.paralela)
    expect(p.atrito).toBeLessThan(p.atritoMax)
    expect(p.aceleracao).toBe(0)
  })
  it('deslizando o atrito vale μ·N e a = g(sen θ − μ cos θ)', () => {
    const p = plano({ m: 4, angulo: 45, mu: 0.2 })
    expect(p.desliza).toBe(true)
    expect(p.atrito).toBeCloseTo(p.atritoMax)
    expect(p.aceleracao).toBeCloseTo(G * (Math.sin(rad(45)) - 0.2 * Math.cos(rad(45))))
    // consistência: F_res = m·a
    expect(p.paralela - p.atrito).toBeCloseTo(4 * p.aceleracao)
  })
  it('sem atrito: a = g·sen θ', () => {
    expect(plano({ m: 3, angulo: 30, mu: 0 }).aceleracao).toBeCloseTo(5)
  })
  it('ângulo crítico = arctg μ', () => {
    expect(angulos.critico(1)).toBeCloseTo(45)
    expect(angulos.critico(0.5)).toBeCloseTo(26.565, 2)
    expect(plano({ m: 1, angulo: angulos.critico(0.5) - 0.01, mu: 0.5 }).desliza).toBe(false)
    expect(plano({ m: 1, angulo: angulos.critico(0.5) + 0.01, mu: 0.5 }).desliza).toBe(true)
  })
})

describe('polias', () => {
  it('máquina de Atwood: a = (m1 − m2)g/(m1 + m2), T = 2 m1 m2 g/(m1 + m2)', () => {
    const r = atwood(3, 1)
    expect(r.a).toBeCloseTo(5)
    expect(r.T).toBeCloseTo(15)
    expect(atwood(2, 2).a).toBe(0)
    expect(atwood(2, 2).T).toBeCloseTo(20)
  })
  it('na máquina de Atwood a tração é coerente com cada corpo', () => {
    const { a, T } = atwood(7, 3)
    expect(T).toBeCloseTo(3 * (G + a)) // corpo que sobe
    expect(T).toBeCloseTo(7 * (G - a)) // corpo que desce
  })
  it('bloco na mesa + bloco pendurado, sem atrito', () => {
    const r = mesaComPolia(2, 3, 0)
    expect(r.a).toBeCloseTo(6)
    expect(r.T).toBeCloseTo(12)
    expect(r.T).toBeCloseTo(3 * (G - r.a))
  })
  it('com atrito: a = (m2 g − μ m1 g)/(m1 + m2)', () => {
    const r = mesaComPolia(2, 3, 0.5)
    expect(r.a).toBeCloseTo(4)
    expect(r.T).toBeCloseTo(18)
    expect(r.T).toBeCloseTo(3 * (G - r.a))
    expect(r.desliza).toBe(true)
  })
  it('atrito grande demais: o sistema não se move', () => {
    const r = mesaComPolia(5, 1, 0.5)
    expect(r.desliza).toBe(false)
    expect(r.a).toBe(0)
    expect(r.T).toBeCloseTo(10) // o corpo pendurado fica em equilíbrio: T = m2·g
  })
})

describe('2ª lei de Newton', () => {
  it('força resultante sobre um bloco puxado numa superfície com atrito', () => {
    // F = 30 N, m = 5 kg, μ = 0,2 → atrito = 10 N → F_res = 20 N → a = 4
    const r = forcaResultante({ F: 30, m: 5, mu: 0.2 })
    expect(r.atrito).toBeCloseTo(10)
    expect(r.res).toBeCloseTo(20)
    expect(r.a).toBeCloseTo(4)
  })
  it('se F não vence o atrito máximo, o bloco fica parado e o atrito é igual a F', () => {
    const r = forcaResultante({ F: 8, m: 5, mu: 0.2 })
    expect(r.a).toBe(0)
    expect(r.atrito).toBe(8)
    expect(r.res).toBe(0)
  })
})
