import { TODOS_OS_PARES } from './geradores'
import { FAMILIAS, moleculaDe, relacoes, type TipoIsomeria } from './isomeria'
import { assinatura, construir, formulaMolecular, nomeIUPAC } from './molecula'

describe('famílias de isômeros', () => {
  for (const f of FAMILIAS) {
    it(`${f.formula}: ${f.total} isômeros, todos com a mesma fórmula e sem repetição`, () => {
      expect(f.lista).toHaveLength(f.total)
      for (const i of f.lista) expect(formulaMolecular(moleculaDe(i)), i.nome).toBe(f.formula)
      expect(new Set(f.lista.map((i) => assinatura(moleculaDe(i)))).size).toBe(f.total)
    })
    it(`${f.formula}: os nomes batem com a nomenclatura calculada (cadeias de carbono)`, () => {
      for (const i of f.lista) {
        const calc = nomeIUPAC(i.espec)
        if (calc) expect(calc, i.nome).toBe(i.nome)
      }
    })
  }
})

describe('relações entre isômeros (classificação feita pelo grafo)', () => {
  const por = (formula: string, nome: string) => moleculaDe(FAMILIAS.find((f) => f.formula === formula)!.lista.find((i) => i.nome === nome)!)
  const rel = (formula: string, a: string, b: string): TipoIsomeria[] => relacoes(por(formula, a), por(formula, b))

  it('C4H10O: álcoois entre si', () => {
    expect(rel('C4H10O', 'butan-1-ol', 'butan-2-ol')).toEqual(['posicao'])
    expect(rel('C4H10O', 'butan-1-ol', '2-metilpropan-1-ol')).toEqual(['cadeia'])
    expect(rel('C4H10O', 'butan-1-ol', '2-metilpropan-2-ol')).toEqual(['cadeia'])
    expect(rel('C4H10O', 'butan-2-ol', '2-metilpropan-1-ol')).toEqual(['cadeia'])
    expect(rel('C4H10O', 'butan-2-ol', '2-metilpropan-2-ol')).toEqual(['cadeia'])
    expect(rel('C4H10O', '2-metilpropan-1-ol', '2-metilpropan-2-ol')).toEqual(['posicao'])
  })
  it('C4H10O: álcool × éter é isomeria de função', () => {
    for (const a of ['butan-1-ol', 'butan-2-ol', '2-metilpropan-1-ol', '2-metilpropan-2-ol'])
      for (const b of ['metoxipropano', 'etoxietano', '2-metoxipropano']) expect(rel('C4H10O', a, b), `${a} × ${b}`).toEqual(['funcao'])
  })
  it('C4H10O: éteres entre si (compensação e/ou cadeia)', () => {
    expect(rel('C4H10O', 'metoxipropano', 'etoxietano')).toEqual(['compensacao'])
    expect(rel('C4H10O', 'metoxipropano', '2-metoxipropano')).toEqual(['cadeia'])
    expect(rel('C4H10O', 'etoxietano', '2-metoxipropano')).toEqual(['compensacao', 'cadeia'])
  })
  it('C3H8O e C2H6O', () => {
    expect(rel('C3H8O', 'propan-1-ol', 'propan-2-ol')).toEqual(['posicao'])
    expect(rel('C3H8O', 'propan-1-ol', 'metoxietano')).toEqual(['funcao'])
    expect(rel('C2H6O', 'etanol', 'metoximetano')).toEqual(['funcao'])
  })
  it('hexanos: cadeia quando a maior cadeia muda; posição quando só muda a ramificação', () => {
    expect(rel('C6H14', 'hexano', '2-metilpentano')).toEqual(['cadeia'])
    expect(rel('C6H14', '2-metilpentano', '3-metilpentano')).toEqual(['posicao'])
    expect(rel('C6H14', '2-metilpentano', '2,3-dimetilbutano')).toEqual(['cadeia'])
    expect(rel('C6H14', '2,2-dimetilbutano', '2,3-dimetilbutano')).toEqual(['posicao'])
    expect(rel('C6H14', '3-metilpentano', '2,2-dimetilbutano')).toEqual(['cadeia'])
  })
  it('butanos e pentanos: sempre cadeia', () => {
    expect(rel('C4H10', 'butano', '2-metilpropano')).toEqual(['cadeia'])
    for (const [a, b] of [['pentano', '2-metilbutano'], ['pentano', '2,2-dimetilpropano'], ['2-metilbutano', '2,2-dimetilpropano']]) expect(rel('C5H12', a!, b!)).toEqual(['cadeia'])
  })
  it('os pares dos desafios (exceto cis/trans) são classificados do mesmo jeito pelo grafo', () => {
    for (const tipo of ['cadeia', 'posicao', 'funcao', 'compensacao', 'nao'] as const)
      for (const [a, b] of TODOS_OS_PARES[tipo]) {
        const r = relacoes(construir('espec' in a ? a.espec : { cadeia: [] }), construir('espec' in b ? b.espec : { cadeia: [] }))
        expect(r, `${tipo}: ${JSON.stringify(a)}`).toContain(tipo)
      }
  })
  it('estruturas idênticas não têm relação', () => {
    expect(rel('C4H10O', 'butan-2-ol', 'butan-2-ol')).toEqual([])
  })
})
