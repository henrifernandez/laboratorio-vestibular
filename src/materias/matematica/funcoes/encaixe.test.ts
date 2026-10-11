import { encaixe, type InstanciaEncaixe, type RespostaEncaixe } from './encaixe'
import { avaliar } from './modelo'

const certa = (i: InstanciaEncaixe): RespostaEncaixe => ({
  graficos: i.funcoes.map((_, f) => i.ordemGraficos.indexOf(f)),
  tabelas: i.funcoes.map((_, f) => i.ordemTabelas.indexOf(f)),
})

describe('Encaixe', () => {
  it('gera 4 funções distintas, reproduzível; tabelas batem com as fórmulas', () => {
    expect(encaixe.gerar(2, 2)).toEqual(encaixe.gerar(2, 2))
    for (let s = 1; s <= 60; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = encaixe.gerar(s, n)
        expect(i.funcoes).toHaveLength(4)
        const assinaturas = new Set(i.funcoes.map((f) => [-2, -1, 0, 1, 2].map((x) => avaliar(f, x).toFixed(3)).join('|')))
        expect(assinaturas.size).toBe(4)
        i.funcoes.forEach((f, idx) => {
          const tabela = i.tabelas[idx]!
          for (const l of tabela) expect(avaliar(f, l.x)).toBeCloseTo(l.y, 2)
        })
        expect([...i.ordemGraficos].sort()).toEqual([0, 1, 2, 3])
        expect([...i.ordemTabelas].sort()).toEqual([0, 1, 2, 3])
        expect(encaixe.corrigir(i, certa(i)).correto).toBe(true)
      }
    }
  })

  it('nível 3 mistura as quatro famílias', () => {
    const tipos = new Set(encaixe.gerar(4, 3).funcoes.map((f) => f.tipo))
    expect(tipos.size).toBe(4)
  })

  it('erro em um gráfico: feedback indica o valor que não bate', () => {
    const i = encaixe.gerar(7, 2)
    const r = certa(i)
    const errada: RespostaEncaixe = { ...r, graficos: [...r.graficos] }
    // troca o gráfico das fórmulas 0 e 1
    ;[errada.graficos[0], errada.graficos[1]] = [r.graficos[1]!, r.graficos[0]!]
    const c = encaixe.corrigir(i, errada)
    expect(c.correto).toBe(false)
    expect(c.parcial).toBeCloseTo(6 / 8)
    expect(c.feedback).toMatch(/gráfico/)
    expect(c.feedback).toMatch(/f\(/)
  })

  it('erro em uma tabela: aponta a linha que não bate', () => {
    const i = encaixe.gerar(7, 2)
    const r = certa(i)
    const errada: RespostaEncaixe = { ...r, tabelas: [...r.tabelas] }
    ;[errada.tabelas[2], errada.tabelas[3]] = [r.tabelas[3]!, r.tabelas[2]!]
    const c = encaixe.corrigir(i, errada)
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/tabela/)
  })

  it('itens não escolhidos contam como errados', () => {
    const i = encaixe.gerar(1, 1)
    const c = encaixe.corrigir(i, { graficos: [-1, -1, -1, -1], tabelas: [-1, -1, -1, -1] })
    expect(c.correto).toBe(false)
    expect(c.parcial).toBe(0)
  })

  it('traz 3 dicas e explicação', () => {
    const i = encaixe.gerar(5, 3)
    expect(encaixe.dicas(i)).toHaveLength(3)
    expect(encaixe.explicar(i).length).toBeGreaterThan(30)
  })
})
