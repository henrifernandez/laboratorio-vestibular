import { detetive, type InstanciaDetetive } from './detetive'
import { caracteristicas } from './modelo'

const respostaCerta = (i: InstanciaDetetive) => Object.fromEntries(i.perguntas.map((p) => [p.id, p.certa]))

describe('Detetive de gráfico', () => {
  it('reproduzível; perguntas coerentes com a função (todas as sementes)', () => {
    expect(detetive.gerar(3, 2)).toEqual(detetive.gerar(3, 2))
    for (let s = 1; s <= 80; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = detetive.gerar(s, n)
        const ids = i.perguntas.map((p) => p.id)
        expect(ids).toContain('tipo')
        expect(i.perguntas.find((p) => p.id === 'tipo')?.certa).toBe(i.alvo.tipo)
        for (const p of i.perguntas) expect(p.opcoes.map((o) => o.valor)).toContain(p.certa)
        expect(detetive.corrigir(i, respostaCerta(i)).correto).toBe(true)
      }
    }
  })

  it('nível 2 (quadrática) pergunta a, b, c e delta, e responde conforme a função', () => {
    const i = detetive.gerar(11, 2)
    expect(i.alvo.tipo).toBe('quadratica')
    if (i.alvo.tipo !== 'quadratica') return
    const sinal = (n: number) => (n > 0 ? '+' : n < 0 ? '-' : '0')
    const c = caracteristicas(i.alvo)
    const por = Object.fromEntries(i.perguntas.map((p) => [p.id, p.certa]))
    expect(por.a).toBe(sinal(i.alvo.a))
    expect(por.b).toBe(sinal(i.alvo.b))
    expect(por.c).toBe(sinal(i.alvo.c))
    expect(por.delta).toBe(sinal(c.delta as number))
  })

  it('o ponto onde a curva corta o eixo y fica visível na janela', () => {
    for (let s = 1; s <= 80; s++) {
      const i = detetive.gerar(s, 2)
      if (i.alvo.tipo === 'quadratica') {
        expect(Math.abs(i.alvo.c)).toBeLessThanOrEqual(i.janela.ymax - 2)
        expect(i.alvo.c).toBeGreaterThanOrEqual(i.janela.ymin + 1)
      }
    }
  })

  it('feedback cita a explicação específica da pergunta errada (sinal de b)', () => {
    let i: InstanciaDetetive | undefined
    for (let s = 1; s <= 80 && !i; s++) {
      const x = detetive.gerar(s, 2)
      if (x.perguntas.find((p) => p.id === 'b')?.certa === '+') i = x
    }
    expect(i).toBeDefined()
    const resp = { ...respostaCerta(i!), b: '-' }
    const c = detetive.corrigir(i!, resp)
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/inclinação|subindo/)
    expect(c.motivo).toBe('sinal de b errado')
    expect(c.parcial).toBeGreaterThan(0.5)
  })

  it('resposta em branco conta como errada', () => {
    const i = detetive.gerar(1, 1)
    const c = detetive.corrigir(i, {})
    expect(c.correto).toBe(false)
    expect(c.parcial).toBe(0)
  })

  it('traz 3 dicas e explicação', () => {
    const i = detetive.gerar(5, 3)
    expect(detetive.dicas(i)).toHaveLength(3)
    expect(detetive.explicar(i).length).toBeGreaterThan(30)
  })
})
