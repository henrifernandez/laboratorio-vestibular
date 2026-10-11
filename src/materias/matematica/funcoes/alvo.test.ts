import { alvo, aplicarMovimentos, estrelas, type Movimento } from './alvo'

describe('Alvo — transformações', () => {
  it('deslocamentos e reflexões sobre a função base', () => {
    const base = (x: number) => x * x
    expect(aplicarMovimentos(base, ['cima'])(2)).toBe(5)
    expect(aplicarMovimentos(base, ['direita'])(3)).toBe(4) // (x-1)²
    expect(aplicarMovimentos(base, ['esquerda'])(-1)).toBe(0) // (x+1)²
    expect(aplicarMovimentos(base, ['refletirX'])(2)).toBe(-4)
    expect(aplicarMovimentos(base, ['esticar'])(2)).toBe(8)
    // a ordem importa: subir e depois refletir ≠ refletir e depois subir
    expect(aplicarMovimentos(base, ['cima', 'refletirX'])(2)).toBe(-5)
    expect(aplicarMovimentos(base, ['refletirX', 'cima'])(2)).toBe(-3)
  })

  it('refletir no eixo y espelha o gráfico (com deslocamento antes)', () => {
    const base = (x: number) => 2 ** x
    expect(aplicarMovimentos(base, ['refletirY'])(-3)).toBe(8)
    expect(aplicarMovimentos(base, ['direita', 'refletirY'])(-2)).toBe(2 ** (-1 * -2 - 1) * 1) // 2^(1)
  })
})

describe('Alvo — desafio', () => {
  it('gera alvos alcançáveis em exatamente `nivel` movimentos no máximo, e o ótimo é calculado', () => {
    for (let s = 1; s <= 40; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = alvo.gerar(s, n)
        expect(i.otimo).toBeGreaterThanOrEqual(1)
        expect(i.otimo).toBeLessThanOrEqual(n)
        expect(alvo.corrigir(i, i.solucao).correto).toBe(true)
      }
    }
  })

  it('o alvo não é igual à base (precisa mexer)', () => {
    const i = alvo.gerar(1, 1)
    expect(alvo.corrigir(i, []).correto).toBe(false)
  })

  it('mesma curva por outro caminho também vale', () => {
    // parábola refletida em y é a mesma parábola
    const i = { ...alvo.gerar(1, 1), base: 'quadrado' as const, solucao: ['cima'] as Movimento[], otimo: 1 }
    expect(alvo.corrigir(i, ['refletirY', 'cima']).correto).toBe(true)
  })

  it('feedback detecta deslocamento vertical, horizontal e reflexão', () => {
    const i = { ...alvo.gerar(1, 1), base: 'quadrado' as const, solucao: ['cima', 'cima'] as Movimento[], otimo: 2 }
    expect(alvo.corrigir(i, ['cima']).feedback).toMatch(/1 unidade para baixo/)
    const j = { ...i, solucao: ['direita', 'direita'] as Movimento[] }
    expect(alvo.corrigir(j, ['direita']).feedback).toMatch(/1 unidade para a esquerda/)
    const k = { ...i, solucao: ['refletirX'] as Movimento[], otimo: 1 }
    expect(alvo.corrigir(k, []).feedback).toMatch(/refletir/i)
  })

  it('estrelas dependem do número de movimentos vs. ótimo', () => {
    expect(estrelas(2, 2)).toBe(3)
    expect(estrelas(3, 2)).toBe(2)
    expect(estrelas(5, 2)).toBe(1)
    expect(estrelas(1, 1)).toBe(3)
  })

  it('o placar de movimentos é dado em dicas, explicação e correção', () => {
    const i = alvo.gerar(3, 3)
    expect(alvo.dicas(i)).toHaveLength(3)
    expect(alvo.explicar(i).length).toBeGreaterThan(20)
    const c = alvo.corrigir(i, i.solucao)
    expect(c.feedback).toMatch(/movimento/)
  })
})
