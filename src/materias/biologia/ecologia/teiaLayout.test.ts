import { TEIAS, camada } from './calculo'
import { ESPACO_CAMADAS, LARGURA, NO_A, NO_L, layoutTeia, quebrarNome } from './teiaLayout'

describe('Layout da teia', () => {
  it.each(TEIAS.map((t) => [t.id, t] as const))('%s: nenhuma espécie sai do desenho nem se sobrepõe a outra', (_id, t) => {
    const lay = layoutTeia(t)
    expect(lay.nos).toHaveLength(t.especies.length)
    for (const n of lay.nos) {
      expect(n.x).toBeGreaterThanOrEqual(0)
      expect(n.x + NO_L).toBeLessThanOrEqual(LARGURA)
      expect(n.y).toBeGreaterThanOrEqual(0)
      expect(n.y + NO_A).toBeLessThanOrEqual(lay.altura)
    }
    for (let i = 0; i < lay.nos.length; i++)
      for (let j = i + 1; j < lay.nos.length; j++) {
        const a = lay.nos[i]!
        const b = lay.nos[j]!
        const sobrepoe = a.x < b.x + NO_L && b.x < a.x + NO_L && a.y < b.y + NO_A && b.y < a.y + NO_A
        expect(sobrepoe, `${a.id} × ${b.id}`).toBe(false)
      }
  })
  it('produtores ficam na camada de baixo e cada predador fica acima das suas presas', () => {
    for (const t of TEIAS) {
      const lay = layoutTeia(t)
      const y = new Map(lay.nos.map((n) => [n.id, n.y]))
      for (const e of t.especies) if (e.produtor) expect(camada(t, e.id)).toBe(1)
      for (const s of lay.setas) expect(y.get(s.para)!, `${t.id}: ${s.de} → ${s.para}`).toBeLessThan(y.get(s.de)!)
    }
  })
  it('as setas saem do topo da presa e chegam à base do predador', () => {
    for (const t of TEIAS) {
      const lay = layoutTeia(t)
      expect(lay.setas).toHaveLength(t.come.length)
      const no = new Map(lay.nos.map((n) => [n.id, n]))
      for (const s of lay.setas) {
        expect(s.y1).toBe(no.get(s.de)!.y)
        expect(s.y2).toBe(no.get(s.para)!.y + NO_A)
        expect(s.x1).toBeGreaterThanOrEqual(no.get(s.de)!.x)
        expect(s.x1).toBeLessThanOrEqual(no.get(s.de)!.x + NO_L)
        expect(s.x2).toBeGreaterThanOrEqual(no.get(s.para)!.x)
        expect(s.x2).toBeLessThanOrEqual(no.get(s.para)!.x + NO_L)
      }
    }
  })
  it('a altura acompanha o número de camadas', () => {
    for (const t of TEIAS) {
      const L = Math.max(...t.especies.map((e) => camada(t, e.id)))
      expect(layoutTeia(t).altura).toBe(8 + (L - 1) * ESPACO_CAMADAS + NO_A + 8)
    }
  })
})

describe('Quebra de nomes', () => {
  it('nomes curtos ficam em uma linha', () => {
    expect(quebrarNome('Fitoplâncton')).toEqual(['Fitoplâncton'])
    expect(quebrarNome('Lobo-guará')).toEqual(['Lobo-guará'])
  })
  it('nomes longos quebram no hífen e nenhuma linha passa de 13 caracteres, em todas as espécies', () => {
    expect(quebrarNome('Foca-caranguejeira')).toEqual(['Foca-', 'caranguejeira'])
    expect(quebrarNome('Mico-leão-dourado')).toEqual(['Mico-leão-', 'dourado'])
    expect(quebrarNome('Coruja-buraqueira')).toEqual(['Coruja-', 'buraqueira'])
    for (const t of TEIAS) for (const e of t.especies) for (const linha of quebrarNome(e.nome)) expect(linha.length, e.nome).toBeLessThanOrEqual(13)
  })
})
