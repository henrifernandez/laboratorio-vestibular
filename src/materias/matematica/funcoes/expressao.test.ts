import { compilar, equivalentes } from './expressao'

const f = (s: string) => {
  const r = compilar(s)
  if (!r.ok) throw new Error(r.erro)
  return r.fn
}

describe('compilar', () => {
  it('aceita ^, multiplicação implícita, sqrt e e', () => {
    expect(f('2(x-1)^2')(3)).toBe(8)
    expect(f('3x')(2)).toBe(6)
    expect(f('sqrt(x)')(9)).toBe(3)
    expect(f('e^x')(1)).toBeCloseTo(Math.E)
    expect(f('2x^2 - 4x + 2')(3)).toBe(8)
  })

  it('log(x) é base 10, log(x, b) usa a base b e ln é natural', () => {
    expect(f('log(100)')(0)).toBeCloseTo(2)
    expect(f('log(x, 2)')(8)).toBeCloseTo(3)
    expect(f('ln(x)')(Math.E)).toBeCloseTo(1)
    expect(f('log2(x)')(16)).toBeCloseTo(4)
  })

  it('aceita vírgula decimal e símbolos comuns de digitação', () => {
    expect(f('0,5x')(4)).toBe(2)
    expect(f('x²')(3)).toBe(9)
    expect(f('2·x')(3)).toBe(6)
    expect(f('x − 1')(3)).toBe(2)
  })

  it('x(x-1) e (x-1)(x+1) são multiplicação, não chamada de função', () => {
    expect(f('x(x-1)')(3)).toBe(6)
    expect(f('(x-1)(x+1)')(3)).toBe(8)
    expect(f('2(x+1)(x-1)')(3)).toBe(16)
    expect(f('e(x)')(2)).toBeCloseTo(2 * Math.E)
    expect(f('3x(x+1)')(2)).toBe(18)
  })

  it('devolve NaN fora do domínio em vez de lançar', () => {
    expect(f('log(x, 2)')(-1)).toBeNaN()
    expect(f('sqrt(x)')(-4)).toBeNaN()
  })

  it('rejeita texto inválido ou perigoso com erro legível', () => {
    expect(compilar('').ok).toBe(false)
    expect(compilar('2x +').ok).toBe(false)
    expect(compilar('y + 1').ok).toBe(false)
    expect(compilar('import("fs")').ok).toBe(false)
    expect(compilar('a = 3').ok).toBe(false)
    const r = compilar('foo(x)')
    expect(r.ok).toBe(false)
  })
})

describe('equivalentes', () => {
  const alvo = (x: number) => 2 * x * x - 4 * x + 2

  it('formas equivalentes contam como certas', () => {
    expect(equivalentes('2(x-1)^2', alvo, { min: -5, max: 5 }).ok).toBe(true)
    expect(equivalentes('2x^2-4x+2', alvo, { min: -5, max: 5 }).ok).toBe(true)
    expect(equivalentes('2*(x^2 - 2x + 1)', alvo, { min: -5, max: 5 }).ok).toBe(true)
  })

  it('formas diferentes são recusadas e informam onde erraram', () => {
    const r = equivalentes('2x^2-4x+3', alvo, { min: -5, max: 5 })
    expect(r.ok).toBe(false)
    expect(r.errados.length).toBeGreaterThan(0)
    expect(r.errados[0]).toMatchObject({ esperado: expect.any(Number) })
  })

  it('logarítmica: compara só dentro do domínio (x > 0)', () => {
    const logAlvo = (x: number) => Math.log2(x) + 1
    expect(equivalentes('log(x, 2) + 1', logAlvo, { min: 0.1, max: 10 }).ok).toBe(true)
    expect(equivalentes('ln(x)/ln(2) + 1', logAlvo, { min: 0.1, max: 10 }).ok).toBe(true)
    expect(equivalentes('log(x) + 1', logAlvo, { min: 0.1, max: 10 }).ok).toBe(false)
  })

  it('expressão inválida volta ok=false com a mensagem', () => {
    const r = equivalentes('2x +', alvo, { min: -5, max: 5 })
    expect(r.ok).toBe(false)
    expect(r.erro).toBeTruthy()
  })
})

describe('variável configurável', () => {
  it('aceita n como variável (termo geral de sequências)', () => {
    const r = compilar('3*2^(n-1)', 'n')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.fn(4)).toBe(24)
  })
  it('multiplicação implícita com n: 2n+1 e n(n+1)', () => {
    const a = compilar('2n+1', 'n')
    const b = compilar('n(n+1)', 'n')
    expect(a.ok && a.fn(5)).toBe(11)
    expect(b.ok && b.fn(3)).toBe(12)
  })
  it('rejeita o x quando a variável é n, e vice-versa', () => {
    expect(compilar('x+1', 'n').ok).toBe(false)
    expect(compilar('n+1').ok).toBe(false)
  })
  it('equivalentes aceita a variável', () => {
    const alvo = (n: number) => 5 + (n - 1) * 3
    expect(equivalentes('3n+2', alvo, { min: 1, max: 10 }, 20, 'n').ok).toBe(true)
    expect(equivalentes('3n+1', alvo, { min: 1, max: 10 }, 20, 'n').ok).toBe(false)
  })
})
