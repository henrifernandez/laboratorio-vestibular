import { termoGeral, type InstanciaTermoGeral } from './termoGeral'

const pa: InstanciaTermoGeral = { semente: 1, nivel: 1, tipo: 'PA', a1: 5, razao: 3, termos: [5, 8, 11, 14] }
const pg: InstanciaTermoGeral = { semente: 1, nivel: 2, tipo: 'PG', a1: 3, razao: 2, termos: [3, 6, 12, 24] }

describe('termoGeral — correção', () => {
  it('aceita formas equivalentes (PA)', () => {
    expect(termoGeral.corrigir(pa, '5 + (n-1)*3').correto).toBe(true)
    expect(termoGeral.corrigir(pa, '3n+2').correto).toBe(true)
    expect(termoGeral.corrigir(pa, '2 + 3n').correto).toBe(true)
  })
  it('aceita formas equivalentes (PG)', () => {
    expect(termoGeral.corrigir(pg, '3*2^(n-1)').correto).toBe(true)
    expect(termoGeral.corrigir(pg, '1,5*2^n').correto).toBe(true)
    expect(termoGeral.corrigir(pg, '3(2)^(n-1)').correto).toBe(true)
  })
  it('detecta índice deslocado (usou n em vez de n−1)', () => {
    const c = termoGeral.corrigir(pa, '5 + 3n')
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/a₁/)
    expect(c.motivo).toBe('índice deslocado (n no lugar de n − 1)')
    const d = termoGeral.corrigir(pg, '3*2^n')
    expect(d.motivo).toBe('índice deslocado (n no lugar de n − 1)')
  })
  it('nomeia o primeiro termo que não bate', () => {
    const c = termoGeral.corrigir(pa, '3n+1')
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/dá a₁ = 4, mas a₁ = 5/)
  })
  it('PA escrita no lugar de PG', () => {
    const c = termoGeral.corrigir(pg, '3 + 3n')
    expect(c.feedback).toMatch(/PA/)
    expect(c.motivo).toBe('confundiu PA com PG')
  })
  it('fórmula inválida ou com x em vez de n', () => {
    expect(termoGeral.corrigir(pa, '3x+2').correto).toBe(false)
    expect(termoGeral.corrigir(pa, '3x+2').feedback).toMatch(/n/)
    expect(termoGeral.corrigir(pa, '3n+').correto).toBe(false)
  })
})

describe('termoGeral — geração', () => {
  it('termos coerentes e a resposta canônica é aceita', () => {
    for (let s = 1; s <= 60; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = termoGeral.gerar(s, n)
        expect(i.termos).toHaveLength(4)
        expect(termoGeral.corrigir(i, termoGeral.respostaCanonica(i)).correto).toBe(true)
      }
    }
  })
  it('dicas e explicação', () => {
    const i = termoGeral.gerar(3, 2)
    expect(termoGeral.dicas(i)).toHaveLength(3)
    expect(termoGeral.explicar(i).length).toBeGreaterThan(20)
  })
})
