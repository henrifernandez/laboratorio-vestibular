import { desenho, type InstanciaDesenho } from './desenho'

const base: InstanciaDesenho = {
  semente: 1,
  nivel: 2,
  T: 6,
  x0: 1,
  trechos: [
    { dur: 2, v: 2 },
    { dur: 2, v: 0 },
    { dur: 2, v: -1 },
  ],
  alvo: [1, 3, 5, 5, 5, 4, 3],
  xmax: 10,
}

describe('Desenhe o movimento — correção', () => {
  it('aceita a resposta certa', () => {
    const c = desenho.corrigir(base, [1, 3, 5, 5, 5, 4, 3])
    expect(c.correto).toBe(true)
    expect(c.parcial).toBe(1)
  })
  it('tolera meio degrau de erro, mas não um degrau inteiro', () => {
    expect(desenho.corrigir(base, [1, 3, 5, 5, 5, 4, 3.25]).correto).toBe(true)
    expect(desenho.corrigir(base, [1, 3, 5, 5, 5, 4, 4]).correto).toBe(false)
  })
  it('posição inicial errada é nomeada primeiro', () => {
    const c = desenho.corrigir(base, [3, 5, 7, 7, 7, 6, 5])
    expect(c.motivo).toBe('posição inicial errada')
    expect(c.feedback).toMatch(/partir de x = 1/)
  })
  it('velocidade errada em um trecho: informa o intervalo e as duas velocidades', () => {
    const c = desenho.corrigir(base, [1, 2, 3, 3, 3, 2, 1]) // anda a 1 m/s em vez de 2
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/entre t = 0 s e t = 1 s/)
    expect(c.feedback).toMatch(/2 m\/s/)
    expect(c.feedback).toMatch(/1 m\/s/)
  })
  it('sinal da velocidade trocado', () => {
    const c = desenho.corrigir(base, [1, 3, 5, 5, 5, 6, 7]) // sobe no trecho final em vez de descer
    expect(c.motivo).toBe('sinal da velocidade trocado')
  })
  it('ficou parado quando deveria andar, e andou quando deveria ficar parado', () => {
    expect(desenho.corrigir(base, [1, 1, 1, 1, 1, 0, -1]).motivo).toBe('ficou parado quando devia andar')
    expect(desenho.corrigir(base, [1, 3, 5, 6, 7, 6, 5]).motivo).toBe('andou quando devia ficar parado')
  })
  it('traz a curva certa para sobrepor', () => {
    const c = desenho.corrigir(base, [1, 1, 1, 1, 1, 1, 1])
    expect((c.destaque as { alvo: number[] }).alvo).toEqual(base.alvo)
  })
})

describe('Desenhe o movimento — geração', () => {
  it('o alvo segue os trechos de velocidade constante e fica dentro da pista', () => {
    for (let s = 1; s <= 150; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = desenho.gerar(s, n)
        expect(i.alvo).toHaveLength(i.T + 1)
        let x = i.x0
        let t = 0
        for (const tr of i.trechos) {
          for (let k = 1; k <= tr.dur; k++) {
            x += tr.v
            t++
            expect(i.alvo[t]).toBeCloseTo(x, 9)
          }
        }
        expect(t).toBe(i.T)
        expect(i.alvo[0]).toBe(i.x0)
        for (const v of i.alvo) {
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(i.xmax)
          expect(Math.abs(v * 2 - Math.round(v * 2))).toBeLessThan(1e-9)
        }
        expect(desenho.corrigir(i, i.alvo).correto).toBe(true)
        expect(desenho.corrigir(i, desenho.respostaInicial(i)).correto).toBe(false)
      }
    }
  })
  it('descrição, dicas e explicação', () => {
    const i = desenho.gerar(5, 3)
    expect(desenho.enunciado(i).length).toBeGreaterThan(30)
    expect(desenho.dicas(i)).toHaveLength(3)
    expect(desenho.explicar(i).length).toBeGreaterThan(30)
  })
})
