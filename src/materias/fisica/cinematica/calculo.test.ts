import {
  G,
  alcance,
  alturaMaxima,
  distanciaFrenagem,
  kmhParaMs,
  lancamento,
  msParaKmh,
  movimento,
  posicao,
  tempoDeVoo,
  trechos,
  velocidade,
  velocidadeMedia,
  encontro,
  alturaEmX,
} from './calculo'

describe('MRU e MRUV', () => {
  it('posição e velocidade: x = x0 + v0·t + a·t²/2 ; v = v0 + a·t', () => {
    expect(posicao({ x0: 2, v0: 3, a: 0 }, 4)).toBe(14)
    expect(posicao({ x0: 0, v0: 0, a: 2 }, 5)).toBe(25)
    expect(posicao({ x0: 10, v0: 20, a: -5 }, 4)).toBe(50)
    expect(velocidade({ x0: 0, v0: 20, a: -5 }, 4)).toBe(0)
    expect(velocidade({ x0: 0, v0: 3, a: 2 }, 3)).toBe(9)
  })
  it('Torricelli: distância até parar = v²/(2|a|)', () => {
    expect(distanciaFrenagem(20, 5)).toBe(40)
    expect(distanciaFrenagem(0, 5)).toBe(0)
    // coerente com a equação horária
    const m = { x0: 0, v0: 20, a: -5 }
    expect(posicao(m, 4)).toBe(distanciaFrenagem(20, 5))
  })
  it('conversão km/h ↔ m/s', () => {
    expect(kmhParaMs(72)).toBe(20)
    expect(kmhParaMs(36)).toBe(10)
    expect(msParaKmh(5)).toBe(18)
  })
  it('velocidade média = Δx/Δt', () => {
    expect(velocidadeMedia({ x0: 0, v0: 0, a: 2 }, 0, 4)).toBe(4)
  })
})

describe('encontro de móveis', () => {
  it('dois MRU em sentidos contrários', () => {
    // A: x = 0 + 10t ; B: x = 100 − 15t  → 25 t = 100 → t = 4, x = 40
    const e = encontro({ x0: 0, v0: 10, a: 0 }, { x0: 100, v0: -15, a: 0 })
    expect(e).toHaveLength(1)
    expect(e[0]!.t).toBeCloseTo(4)
    expect(e[0]!.x).toBeCloseTo(40)
  })
  it('MRUV alcançando MRU: duas soluções possíveis e só as de t ≥ 0 contam', () => {
    // A: x = t² (a=2) ; B: x = 4 + 4t → t² − 4t − 4 = 0 → t = 2 + 2√2
    const e = encontro({ x0: 0, v0: 0, a: 2 }, { x0: 4, v0: 4, a: 0 })
    expect(e).toHaveLength(1)
    expect(e[0]!.t).toBeCloseTo(2 + 2 * Math.SQRT2)
  })
  it('sem encontro', () => {
    expect(encontro({ x0: 0, v0: 5, a: 0 }, { x0: 10, v0: 5, a: 0 })).toEqual([])
  })
})

describe('movimento por trechos (aceleração constante em cada trecho)', () => {
  it('as posições e velocidades são contínuas nas emendas', () => {
    const m = movimento({ x0: 1, v0: 0 }, [{ dur: 2, a: 3 }, { dur: 3, a: 0 }, { dur: 2, a: -3 }])
    expect(m.duracao).toBe(7)
    expect(velocidade2(m, 2)).toBeCloseTo(6)
    expect(velocidade2(m, 5)).toBeCloseTo(6)
    expect(velocidade2(m, 7)).toBeCloseTo(0)
    expect(posicao2(m, 2)).toBeCloseTo(1 + 6)
    expect(posicao2(m, 5)).toBeCloseTo(7 + 18)
    expect(posicao2(m, 7)).toBeCloseTo(25 + 6)
  })
  it('trechos lista as fases (início, fim, aceleração, v inicial)', () => {
    const t = trechos({ x0: 0, v0: 2 }, [{ dur: 2, a: 1 }, { dur: 1, a: -2 }])
    expect(t).toEqual([
      { de: 0, ate: 2, a: 1, x0: 0, v0: 2 },
      { de: 2, ate: 3, a: -2, x0: 6, v0: 4 },
    ])
  })
})

function posicao2(m: ReturnType<typeof movimento>, t: number) {
  return m.x(t)
}
function velocidade2(m: ReturnType<typeof movimento>, t: number) {
  return m.v(t)
}

describe('lançamento oblíquo (g = 10 m/s², sem resistência do ar)', () => {
  it('45° com 20 m/s: alcance 40 m, altura 10 m, tempo 2√2 s', () => {
    expect(alcance(20, 45)).toBeCloseTo(40)
    expect(alturaMaxima(20, 45)).toBeCloseTo(10)
    expect(tempoDeVoo(20, 45)).toBeCloseTo(2 * Math.SQRT2)
  })
  it('ângulos complementares têm o mesmo alcance', () => {
    expect(alcance(30, 30)).toBeCloseTo(alcance(30, 60))
    expect(alcance(30, 20)).toBeCloseTo(alcance(30, 70))
  })
  it('o máximo alcance é a 45°', () => {
    for (const a of [10, 20, 30, 40, 50, 60, 70, 80]) expect(alcance(25, a)).toBeLessThan(alcance(25, 45))
  })
  it('lançamento vertical: alcance 0 e altura v²/2g', () => {
    expect(alcance(20, 90)).toBeCloseTo(0, 9)
    expect(alturaMaxima(20, 90)).toBeCloseTo(20)
  })
  it('posição ao longo do tempo é coerente com os fórmulas fechadas', () => {
    const l = lancamento(20, 45)
    const T = tempoDeVoo(20, 45)
    expect(l.x(T)).toBeCloseTo(alcance(20, 45))
    expect(l.y(T)).toBeCloseTo(0, 9)
    expect(l.y(T / 2)).toBeCloseTo(alturaMaxima(20, 45))
  })
  it('altura em um dado x (trajetória parabólica)', () => {
    // y(x) = x·tgθ − g·x²/(2 v0² cos²θ)
    expect(alturaEmX(20, 45, 20)).toBeCloseTo(20 - (G * 400) / (2 * 400 * 0.5))
    expect(alturaEmX(20, 45, 0)).toBeCloseTo(0)
    expect(alturaEmX(20, 45, 40)).toBeCloseTo(0, 9)
  })
})
