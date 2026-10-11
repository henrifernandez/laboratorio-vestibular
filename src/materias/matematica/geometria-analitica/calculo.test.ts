import {
  distancia,
  distPontoReta,
  eqGeralCirc,
  eqReduzidaCirc,
  fracaoTxt,
  pontoMedio,
  posicaoPontoCirc,
  posicaoRetaCirc,
  relacaoRetas,
  reta,
  textoGeral,
  textoReduzida,
} from './calculo'

describe('distância e ponto médio', () => {
  it('distância entre dois pontos', () => {
    expect(distancia({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(distancia({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5)
    expect(distancia({ x: -2, y: 3 }, { x: -2, y: -1 })).toBe(4)
  })
  it('ponto médio', () => {
    expect(pontoMedio({ x: 2, y: 4 }, { x: 6, y: 10 })).toEqual({ x: 4, y: 7 })
    expect(pontoMedio({ x: -1, y: 0 }, { x: 2, y: 3 })).toEqual({ x: 0.5, y: 1.5 })
  })
})

describe('reta por dois pontos', () => {
  it('coeficientes angular e linear', () => {
    const r = reta({ x: 1, y: 3 }, { x: 3, y: 7 })
    expect(r).toMatchObject({ vertical: false, m: 2, n: 1 })
  })
  it('equação geral com coeficientes inteiros primos entre si e a > 0', () => {
    expect(reta({ x: 1, y: 3 }, { x: 3, y: 7 }).geral).toEqual({ a: 2, b: -1, c: 1 })
    expect(reta({ x: 0, y: 0 }, { x: 2, y: 4 }).geral).toEqual({ a: 2, b: -1, c: 0 })
    expect(reta({ x: 0, y: 1 }, { x: 4, y: 3 }).geral).toEqual({ a: 1, b: -2, c: 2 })
  })
  it('reta vertical e horizontal', () => {
    const v = reta({ x: 2, y: 1 }, { x: 2, y: 5 })
    expect(v.vertical).toBe(true)
    expect(v.geral).toEqual({ a: 1, b: 0, c: -2 })
    const h = reta({ x: -1, y: 3 }, { x: 4, y: 3 })
    expect(h).toMatchObject({ vertical: false, m: 0, n: 3 })
    expect(h.geral).toEqual({ a: 0, b: 1, c: -3 })
  })
  it('os dois pontos satisfazem a equação geral', () => {
    const pts = [{ x: -3, y: 2 }, { x: 5, y: -4 }]
    const g = reta(pts[0]!, pts[1]!).geral
    for (const p of pts) expect(g.a * p.x + g.b * p.y + g.c).toBe(0)
  })
  it('pontos coincidentes não definem reta', () => {
    expect(() => reta({ x: 1, y: 1 }, { x: 1, y: 1 })).toThrow()
  })
})

describe('texto das equações', () => {
  it('forma reduzida', () => {
    expect(textoReduzida(2, 1)).toBe('y = 2x + 1')
    expect(textoReduzida(-1, 0)).toBe('y = −x')
    expect(textoReduzida(1, -3)).toBe('y = x − 3')
    expect(textoReduzida(0, 4)).toBe('y = 4')
    expect(textoReduzida(0.5, 1)).toBe('y = (1/2)x + 1')
    expect(textoReduzida(-1.5, 2)).toBe('y = −(3/2)x + 2')
  })
  it('forma geral', () => {
    expect(textoGeral({ a: 2, b: -1, c: 1 })).toBe('2x − y + 1 = 0')
    expect(textoGeral({ a: 1, b: 0, c: -2 })).toBe('x − 2 = 0')
    expect(textoGeral({ a: 0, b: 1, c: -3 })).toBe('y − 3 = 0')
    expect(textoGeral({ a: 3, b: 2, c: 0 })).toBe('3x + 2y = 0')
  })
  it('fração', () => {
    expect(fracaoTxt(0.75)).toBe('3/4')
    expect(fracaoTxt(2)).toBe('2')
    expect(fracaoTxt(-1.5)).toBe('−3/2')
  })
})

describe('distância ponto-reta', () => {
  it('|ax0 + by0 + c| / √(a² + b²)', () => {
    expect(distPontoReta({ x: 0, y: 0 }, { a: 3, b: 4, c: -10 })).toBe(2)
    expect(distPontoReta({ x: 1, y: 1 }, { a: 1, b: 1, c: -2 })).toBe(0)
    expect(distPontoReta({ x: 2, y: 3 }, { a: 1, b: 0, c: -6 })).toBe(4)
  })
})

describe('circunferência', () => {
  it('equação reduzida', () => {
    expect(eqReduzidaCirc(2, -1, 3)).toBe('(x − 2)² + (y + 1)² = 9')
    expect(eqReduzidaCirc(0, 0, 5)).toBe('x² + y² = 25')
    expect(eqReduzidaCirc(-3, 0, 2)).toBe('(x + 3)² + y² = 4')
  })
  it('equação geral', () => {
    expect(eqGeralCirc(2, -1, 3)).toBe('x² + y² − 4x + 2y − 4 = 0')
    expect(eqGeralCirc(0, 0, 5)).toBe('x² + y² − 25 = 0')
    expect(eqGeralCirc(-3, 0, 2)).toBe('x² + y² + 6x + 5 = 0')
  })
  it('posição de um ponto em relação à circunferência', () => {
    expect(posicaoPontoCirc({ x: 2, y: 2 }, { x: 0, y: 0 }, 3)).toBe('dentro')
    expect(posicaoPontoCirc({ x: 3, y: 4 }, { x: 0, y: 0 }, 5)).toBe('sobre')
    expect(posicaoPontoCirc({ x: 4, y: 4 }, { x: 0, y: 0 }, 5)).toBe('fora')
  })
  it('posição de uma reta em relação à circunferência', () => {
    const c = { x: 0, y: 0 }
    expect(posicaoRetaCirc({ a: 0, b: 1, c: -5 }, c, 5)).toBe('tangente')
    expect(posicaoRetaCirc({ a: 0, b: 1, c: -3 }, c, 5)).toBe('secante')
    expect(posicaoRetaCirc({ a: 0, b: 1, c: -7 }, c, 5)).toBe('externa')
    expect(posicaoRetaCirc({ a: 1, b: 1, c: -10 }, { x: 0, y: 0 }, 5)).toBe('externa') // dist = 10/√2 ≈ 7,07
    expect(posicaoRetaCirc({ a: 3, b: 4, c: -25 }, { x: 0, y: 0 }, 5)).toBe('tangente')
  })
})

describe('retas', () => {
  it('paralelas, perpendiculares e concorrentes', () => {
    expect(relacaoRetas(2, 2)).toBe('paralelas')
    expect(relacaoRetas(2, -0.5)).toBe('perpendiculares')
    expect(relacaoRetas(3, 1)).toBe('concorrentes')
    expect(relacaoRetas(0, 5)).toBe('concorrentes')
  })
})
