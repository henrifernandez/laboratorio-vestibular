import { avaliar, caracteristicas, formulaTex, formulaTexto, textoSinal, type Funcao } from './modelo'

const afim = (a: number, b: number): Funcao => ({ tipo: 'afim', a, b })
const quad = (a: number, b: number, c: number): Funcao => ({ tipo: 'quadratica', a, b, c })
const exp = (a: number, base: number, k: number): Funcao => ({ tipo: 'exponencial', a, base, k })
const log = (a: number, base: number, k: number): Funcao => ({ tipo: 'logaritmica', a, base, k })

describe('avaliar', () => {
  it('avalia cada família', () => {
    expect(avaliar(afim(2, -4), 3)).toBe(2)
    expect(avaliar(quad(1, -3, 2), 3)).toBe(2)
    expect(avaliar(exp(2, 3, 1), 2)).toBe(19)
    expect(avaliar(log(1, 2, 0), 8)).toBeCloseTo(3)
  })
  it('logarítmica fora do domínio é NaN', () => {
    expect(avaliar(log(1, 2, 0), 0)).toBeNaN()
    expect(avaliar(log(1, 2, 0), -3)).toBeNaN()
  })
})

describe('características', () => {
  it('afim: raiz, intercepto e crescimento', () => {
    const c = caracteristicas(afim(2, -4))
    expect(c.raizes).toEqual([2])
    expect(c.interceptoY).toBe(-4)
    expect(c.crescimento).toBe('crescente')
    expect(caracteristicas(afim(-1, 3)).crescimento).toBe('decrescente')
    expect(caracteristicas(afim(0, 3)).raizes).toEqual([])
  })

  it('quadrática: delta, raízes, vértice e concavidade', () => {
    const c = caracteristicas(quad(1, -3, 2))
    expect(c.delta).toBe(1)
    expect(c.raizes).toEqual([1, 2])
    expect(c.vertice).toEqual({ x: 1.5, y: -0.25 })
    expect(c.concavidade).toBe('cima')
    expect(c.interceptoY).toBe(2)
  })

  it('quadrática: raiz dupla e sem raízes', () => {
    expect(caracteristicas(quad(1, -2, 1)).raizes).toEqual([1])
    expect(caracteristicas(quad(1, 0, 1)).raizes).toEqual([])
    expect(caracteristicas(quad(-1, 0, 4)).concavidade).toBe('baixo')
  })

  it('exponencial: assíntota, raiz e crescimento', () => {
    const c = caracteristicas(exp(1, 2, -4))
    expect(c.assintota).toEqual({ tipo: 'horizontal', valor: -4 })
    expect(c.raizes[0]).toBeCloseTo(2)
    expect(c.interceptoY).toBe(-3)
    expect(c.crescimento).toBe('crescente')
    expect(caracteristicas(exp(1, 0.5, 0)).crescimento).toBe('decrescente')
    expect(caracteristicas(exp(1, 2, 0)).raizes).toEqual([])
  })

  it('logarítmica: assíntota vertical, raiz e sem intercepto em y', () => {
    const c = caracteristicas(log(1, 2, -3))
    expect(c.assintota).toEqual({ tipo: 'vertical', valor: 0 })
    expect(c.raizes[0]).toBeCloseTo(8)
    expect(c.interceptoY).toBeNull()
    expect(c.crescimento).toBe('crescente')
  })
})

describe('texto da fórmula', () => {
  it('formulaTexto é interpretável e compacta coeficientes', () => {
    expect(formulaTexto(afim(2, -4))).toBe('2x - 4')
    expect(formulaTexto(afim(-1, 0))).toBe('-x')
    expect(formulaTexto(quad(1, -3, 2))).toBe('x^2 - 3x + 2')
    expect(formulaTexto(quad(-2, 0, 8))).toBe('-2x^2 + 8')
    expect(formulaTexto(exp(1, 2, -4))).toBe('2^x - 4')
    expect(formulaTexto(exp(3, 2, 0))).toBe('3*2^x')
    expect(formulaTexto(log(1, 2, 3))).toBe('log(x, 2) + 3')
  })
  it('formulaTex gera LaTeX', () => {
    expect(formulaTex(quad(1, -3, 2))).toBe('f(x) = x^{2} - 3x + 2')
    expect(formulaTex(exp(3, 2, 0))).toBe('f(x) = 3 \\cdot 2^{x}')
    expect(formulaTex(log(1, 2, 3))).toBe('f(x) = \\log_{2} x + 3')
  })
})

describe('sinal da função', () => {
  it('afim: positiva à direita da raiz quando a > 0', () => {
    expect(textoSinal(afim(2, -4))).toBe('positiva para x > 2; negativa para x < 2')
    expect(textoSinal(afim(-1, 3))).toBe('positiva para x < 3; negativa para x > 3')
  })
  it('quadrática com duas raízes e abrindo para cima', () => {
    expect(textoSinal(quad(1, -3, 2))).toBe('positiva para x < 1 e para x > 2; negativa para 1 < x < 2')
  })
  it('quadrática sem raízes é sempre positiva ou sempre negativa', () => {
    expect(textoSinal(quad(1, 0, 1))).toBe('sempre positiva')
    expect(textoSinal(quad(-1, 0, -1))).toBe('sempre negativa')
  })
  it('exponencial sem raiz e logarítmica (domínio x > 0)', () => {
    expect(textoSinal(exp(2, 2, 0))).toBe('sempre positiva')
    expect(textoSinal(exp(1, 2, -4))).toBe('positiva para x > 2; negativa para x < 2')
    expect(textoSinal(log(1, 2, 0))).toBe('positiva para x > 1; negativa para 0 < x < 1')
  })
})
