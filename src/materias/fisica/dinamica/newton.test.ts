import { ONIBUS, blocosEmContato, instanteContato, onibus, patinadores, tempoAte } from './newton'

describe('Patinadores (3ª lei)', () => {
  const casos = [
    { mA: 50, mB: 80, F: 200, dt: 0.5 },
    { mA: 30, mB: 120, F: 400, dt: 1 },
    { mA: 70, mB: 70, F: 50, dt: 0.2 },
  ]
  it('forças iguais dão acelerações na razão inversa das massas', () => {
    for (const c of casos) {
      const p = patinadores(c)
      // F_BA = m_A·a_A e F_AB = m_B·a_B têm o mesmo módulo
      expect(c.mA * p.aA).toBeCloseTo(c.mB * p.aB, 9)
      expect(p.aA / p.aB).toBeCloseTo(c.mB / c.mA, 9)
    }
  })
  it('as quantidades de movimento finais são iguais e opostas (o total continua zero)', () => {
    for (const c of casos) {
      const p = patinadores(c)
      expect(c.mA * p.vA - c.mB * p.vB).toBeCloseTo(0, 9)
      expect(c.mA * p.vA).toBeCloseTo(p.impulso, 9)
    }
  })
  it('a posição é contínua e, depois do empurrão, cresce em linha reta (1ª lei)', () => {
    for (const c of casos) {
      const p = patinadores(c)
      const eps = 1e-6
      expect(p.xA(c.dt - eps)).toBeCloseTo(p.xA(c.dt + eps), 3)
      // velocidade numérica depois do empurrão é constante e igual a vA
      for (const t of [c.dt + 0.3, c.dt + 1, c.dt + 2.5]) expect((p.xA(t + eps) - p.xA(t - eps)) / (2 * eps)).toBeCloseTo(p.vA, 4)
      // durante o empurrão, aceleração numérica = aA
      const t = c.dt / 2
      expect((p.xA(t + 1e-3) - 2 * p.xA(t) + p.xA(t - 1e-3)) / 1e-6).toBeCloseTo(p.aA, 3)
    }
  })
  it('tempoAte inverte o deslocamento', () => {
    for (const c of casos) {
      const p = patinadores(c)
      for (const d of [0.01, 0.5, 3, 10]) expect(p.xA(tempoAte(p.aA, c.dt, d))).toBeCloseTo(d, 9)
    }
  })
})

describe('Blocos encostados', () => {
  it('em cada bloco, a resultante (contato de trás − contato da frente) é m·a', () => {
    for (const [F, massas] of [
      [30, [2, 4]],
      [60, [1, 2, 3]],
      [24, [5, 1, 6]],
    ] as [number, number[]][]) {
      const { a, contatos } = blocosEmContato(F, massas)
      const atras = [F, ...contatos]
      const frente = [...contatos, 0]
      massas.forEach((m, i) => expect((atras[i] as number) - (frente[i] as number)).toBeCloseTo(m * a, 9))
    }
  })
  it('a força de contato é menor que F e cai ao longo da fila', () => {
    const { contatos } = blocosEmContato(60, [1, 2, 3])
    expect(contatos).toEqual([50, 30])
  })
})

describe('Ônibus (1ª lei)', () => {
  it('antes de encostar, a bola mantém a velocidade que tinha (nenhuma força horizontal)', () => {
    for (const modo of ['freia', 'arranca'] as const) {
      const tc = instanteContato(modo)
      expect(Number.isFinite(tc)).toBe(true)
      const v0 = onibus(modo, 0).vBola
      for (let t = 0; t < tc; t += 0.05) expect(onibus(modo, t).vBola).toBe(v0)
    }
  })
  it('freando, a bola anda para a frente em relação ao ônibus até encostar na frente, ainda durante a freada', () => {
    const tc = instanteContato('freia')
    const rel = (t: number) => onibus('freia', t).xBola - onibus('freia', t).xOnibus
    expect(rel(0)).toBe(ONIBUS.bola0)
    expect(rel(ONIBUS.freia.inicio)).toBeCloseTo(ONIBUS.bola0, 9)
    expect(rel(tc)).toBeCloseTo(ONIBUS.comprimento - ONIBUS.raioBola, 6)
    expect(tc).toBeLessThan(ONIBUS.freia.inicio + ONIBUS.freia.v0 / ONIBUS.freia.desac)
    expect(onibus('freia', ONIBUS.freia.fim).vBola).toBe(0)
  })
  it('arrancando, a bola fica onde estava (no chão) e o fundo do ônibus vem até ela', () => {
    const tc = instanteContato('arranca')
    expect(onibus('arranca', tc * 0.9).xBola).toBe(ONIBUS.bola0)
    expect(onibus('arranca', tc).xBola - onibus('arranca', tc).xOnibus).toBeCloseTo(ONIBUS.raioBola, 6)
    expect(onibus('arranca', ONIBUS.arranca.fim).vBola).toBeGreaterThan(0)
  })
  it('a cena cabe em 21 m de chão', () => {
    for (const modo of ['freia', 'arranca'] as const) expect(onibus(modo, ONIBUS[modo].fim).xOnibus + ONIBUS.comprimento).toBeLessThan(21)
  })
})
