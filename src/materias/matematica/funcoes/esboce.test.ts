import { construirDosPontos, esboce, type InstanciaEsboce, type Ponto } from './esboce'
import { avaliar, type Funcao } from './modelo'

const quadAlvo: Funcao = { tipo: 'quadratica', a: 1, b: -4, c: 3 } // vértice (2,-1)
const instQuad = (alvo: Funcao): InstanciaEsboce => ({
  semente: 1,
  nivel: 2,
  alvo,
  janela: { xmin: -6, xmax: 6, ymin: -6, ymax: 8 },
  controles: [],
  inicial: [],
})

describe('construirDosPontos', () => {
  it('afim: reta por dois pontos', () => {
    const f = construirDosPontos('afim', [{ x: 0, y: 1 }, { x: 2, y: 5 }])
    expect(f).toEqual({ tipo: 'afim', a: 2, b: 1 })
  })
  it('afim: dois pontos na mesma vertical não definem função', () => {
    expect(construirDosPontos('afim', [{ x: 1, y: 1 }, { x: 1, y: 5 }])).toBeNull()
  })
  it('quadrática: vértice e um ponto', () => {
    const f = construirDosPontos('quadratica', [{ x: 2, y: -1 }, { x: 3, y: 0 }])
    expect(f).toEqual({ tipo: 'quadratica', a: 1, b: -4, c: 3 })
  })
  it('quadrática: ponto na mesma vertical do vértice é inválido', () => {
    expect(construirDosPontos('quadratica', [{ x: 2, y: -1 }, { x: 2, y: 3 }])).toBeNull()
  })
  it('exponencial: assíntota, ponto em x=0 e ponto em x=1', () => {
    const f = construirDosPontos('exponencial', [{ x: -3, y: 1 }, { x: 0, y: 3 }, { x: 1, y: 5 }])
    expect(f).toEqual({ tipo: 'exponencial', a: 2, base: 2, k: 1 })
  })
  it('exponencial: razão não positiva ou igual a 1 é inválida', () => {
    expect(construirDosPontos('exponencial', [{ x: -3, y: 1 }, { x: 0, y: 3 }, { x: 1, y: 0 }])).toBeNull()
    expect(construirDosPontos('exponencial', [{ x: -3, y: 1 }, { x: 0, y: 3 }, { x: 1, y: 3 }])).toBeNull()
  })
  it('logarítmica: f(1)=k e f(2)=k+a', () => {
    const f = construirDosPontos('logaritmica', [{ x: 1, y: -1 }, { x: 2, y: 1 }])
    expect(f).toEqual({ tipo: 'logaritmica', a: 2, base: 2, k: -1 })
    const g = f as Extract<Funcao, { tipo: 'logaritmica' }>
    expect(avaliar(g, 4)).toBeCloseTo(3)
  })
})

describe('gerar', () => {
  it('é reproduzível com a mesma semente e muda por nível', () => {
    expect(esboce.gerar(5, 2)).toEqual(esboce.gerar(5, 2))
    expect(esboce.gerar(5, 1).alvo.tipo).toBe('afim')
    expect(esboce.gerar(5, 2).alvo.tipo).toBe('quadratica')
    expect(['exponencial', 'logaritmica']).toContain(esboce.gerar(5, 3).alvo.tipo)
  })
  it('a resposta certa derivada da instância é aceita (todas as sementes)', () => {
    for (let s = 1; s <= 40; s++) {
      for (const n of [1, 2, 3] as const) {
        const inst = esboce.gerar(s, n)
        const resp = esboce.respostaCerta(inst)
        expect(esboce.corrigir(inst, resp).correto).toBe(true)
      }
    }
  })
  it('as posições iniciais não resolvem o desafio', () => {
    for (let s = 1; s <= 40; s++) {
      for (const n of [1, 2, 3] as const) {
        const inst = esboce.gerar(s, n)
        expect(esboce.corrigir(inst, inst.inicial).correto).toBe(false)
      }
    }
  })
})

describe('corrigir', () => {
  it('quadrática: vértice deslocado para a direita é nomeado', () => {
    const inst = instQuad(quadAlvo)
    const resp: Ponto[] = [{ x: 4, y: -1 }, { x: 5, y: 0 }] // mesma abertura, vértice 2 à direita
    const c = esboce.corrigir(inst, resp)
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/2 unidades para a direita/)
    expect(c.feedback).toMatch(/concavidade/i)
    expect(c.feedback).not.toMatch(/concavidade está errada/i)
  })
  it('quadrática: concavidade trocada é detectada', () => {
    const inst = instQuad(quadAlvo)
    const resp: Ponto[] = [{ x: 2, y: -1 }, { x: 3, y: -2 }]
    const c = esboce.corrigir(inst, resp)
    expect(c.correto).toBe(false)
    expect(c.motivo).toBe('concavidade trocada')
    expect(c.feedback).toMatch(/para baixo/)
  })
  it('afim: inclinação com sinal trocado', () => {
    const inst = instQuad({ tipo: 'afim', a: 2, b: 1 })
    const c = esboce.corrigir(inst, [{ x: 0, y: 1 }, { x: 2, y: -3 }])
    expect(c.correto).toBe(false)
    expect(c.motivo).toBe('inclinação trocada')
  })
  it('exponencial: assíntota fora do lugar', () => {
    const inst = instQuad({ tipo: 'exponencial', a: 2, base: 2, k: 1 })
    const c = esboce.corrigir(inst, [{ x: -3, y: 0 }, { x: 0, y: 3 }, { x: 1, y: 5 }])
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/assíntota/)
  })
  it('curva inválida produz feedback sem lançar', () => {
    const inst = instQuad(quadAlvo)
    const c = esboce.corrigir(inst, [{ x: 2, y: -1 }, { x: 2, y: 3 }])
    expect(c.correto).toBe(false)
    expect(c.feedback.length).toBeGreaterThan(10)
  })
  it('devolve a curva certa para sobrepor', () => {
    const inst = instQuad(quadAlvo)
    const c = esboce.corrigir(inst, [{ x: 2, y: -1 }, { x: 3, y: -2 }])
    expect((c.destaque as { alvo: Funcao }).alvo).toEqual(quadAlvo)
  })
})

describe('dicas e explicação', () => {
  it('traz três dicas, da mais vaga à mais específica', () => {
    const inst = esboce.gerar(3, 2)
    const d = esboce.dicas(inst)
    expect(d).toHaveLength(3)
    expect(esboce.explicar(inst).length).toBeGreaterThan(40)
  })
})
