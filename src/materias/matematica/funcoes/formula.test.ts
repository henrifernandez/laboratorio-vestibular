import { formula, type InstanciaFormula } from './formula'
import { avaliar, formulaTexto } from './modelo'

describe('Qual é a fórmula', () => {
  it('gera instâncias reproduzíveis com pontos inteiros sobre a curva', () => {
    expect(formula.gerar(4, 2)).toEqual(formula.gerar(4, 2))
    for (let s = 1; s <= 60; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = formula.gerar(s, n)
        expect(i.pontos.length).toBeGreaterThanOrEqual(2)
        for (const p of i.pontos) {
          expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true)
          expect(avaliar(i.alvo, p.x)).toBeCloseTo(p.y, 6)
        }
        const familias = { 1: ['afim'], 2: ['quadratica'], 3: ['exponencial', 'logaritmica'] }[n]
        expect(familias).toContain(i.alvo.tipo)
      }
    }
  })

  it('o texto canônico da própria função sempre é aceito', () => {
    for (let s = 1; s <= 60; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = formula.gerar(s, n)
        expect(formula.corrigir(i, formulaTexto(i.alvo)).correto).toBe(true)
      }
    }
  })

  const quad: InstanciaFormula = {
    semente: 1,
    nivel: 2,
    alvo: { tipo: 'quadratica', a: 2, b: -4, c: 2 },
    pontos: [{ x: 0, y: 2 }, { x: 1, y: 0 }, { x: 2, y: 2 }, { x: 3, y: 8 }],
    janela: { xmin: -6, xmax: 6, ymin: -8, ymax: 10 },
    dominio: { min: -4, max: 4 },
  }

  it('aceita formas equivalentes (fatorada, expandida, com multiplicação implícita)', () => {
    expect(formula.corrigir(quad, '2(x-1)^2').correto).toBe(true)
    expect(formula.corrigir(quad, '2x^2-4x+2').correto).toBe(true)
    expect(formula.corrigir(quad, '2*(x-1)*(x-1)').correto).toBe(true)
  })

  it('dá feedback citando os pontos marcados que a fórmula errou', () => {
    const c = formula.corrigir(quad, '2x^2-4x+3')
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/não passa pelo ponto \(0, 2\)/)
    expect(c.feedback).toMatch(/dá 3/)
    expect(c.parcial).toBe(0)
  })

  it('reconhece acerto parcial quando passa por alguns pontos', () => {
    const c = formula.corrigir(quad, '2x - 2') // passa por (1,0), (2,2)
    expect(c.correto).toBe(false)
    expect(c.parcial).toBeCloseTo(0.5)
    expect(c.feedback).toMatch(/2 dos 4 pontos/)
  })

  it('passa pelos pontos mas é outra função: avisa para conferir o tipo', () => {
    // x^4 não, usa polinômio de grau 3 que passa pelos 4 pontos
    const c = formula.corrigir(quad, '2x^2-4x+2+x(x-1)(x-2)(x-3)')
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/passa pelos pontos marcados/)
  })

  it('fórmula inválida volta mensagem de erro sem contar parcial', () => {
    const c = formula.corrigir(quad, '2x +')
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/fórmula/i)
  })

  it('logarítmica: aceita log(x,2) e ln(x)/ln(2)', () => {
    let achou = 0
    for (let s = 1; s <= 40 && achou < 3; s++) {
      const i = formula.gerar(s, 3)
      const alvo = i.alvo
      if (alvo.tipo !== 'logaritmica') continue
      achou++
      expect(formula.corrigir(i, `${alvo.a}*log(x,2)+${alvo.k}`).correto).toBe(true)
      expect(formula.corrigir(i, `${alvo.a}*ln(x)/ln(2)+${alvo.k}`).correto).toBe(true)
      expect(formula.corrigir(i, `${alvo.a}*log(x)+${alvo.k}`).correto).toBe(false)
    }
    expect(achou).toBe(3)
  })

  it('traz 3 dicas e explicação', () => {
    const i = formula.gerar(2, 2)
    expect(formula.dicas(i)).toHaveLength(3)
    expect(formula.explicar(i).length).toBeGreaterThan(30)
  })
})
