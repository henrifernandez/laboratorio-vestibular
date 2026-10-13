import { presentesEm, type TipoCelular } from './calculo'
import { PECAS, caixaDaPeca, caixaDoRotulo, dentroDaCelula, encostam, type Caixa } from './desenhoCelula'

const TIPOS: TipoCelular[] = ['animal', 'vegetal', 'bacteria']
const cantos = (c: Caixa) => [
  [c.x0, c.y0],
  [c.x1, c.y0],
  [c.x0, c.y1],
  [c.x1, c.y1],
]

describe('Desenho das células', () => {
  it.each(TIPOS)('%s: cada estrutura de dentro da célula aparece e tem um rótulo', (tipo) => {
    const desenhadas = new Set(PECAS[tipo].map((p) => p.id))
    const internas = presentesEm(tipo)
      .map((e) => e.id)
      .filter((id) => id !== 'membrana' && id !== 'parede')
    expect([...desenhadas].sort()).toEqual(internas.sort())
    for (const id of desenhadas) if (id !== 'vacuolo') expect(PECAS[tipo].some((p) => p.id === id && p.rotulo), id).toBe(true)
  })
  it.each(TIPOS)('%s: estruturas e rótulos ficam dentro da célula', (tipo) => {
    for (const p of PECAS[tipo]) {
      const caixas = [caixaDaPeca(p), caixaDoRotulo(p)].filter((c): c is Caixa => c !== null)
      for (const c of caixas) for (const [x, y] of cantos(c)) expect(dentroDaCelula(tipo, x as number, y as number), `${p.id} (${x}, ${y})`).toBe(true)
    }
  })
  it.each(TIPOS)('%s: nenhuma estrutura encosta em outra, e nenhum rótulo cobre estrutura ou outro rótulo', (tipo) => {
    const org = PECAS[tipo].map(caixaDaPeca)
    const rot = PECAS[tipo].map(caixaDoRotulo).filter((c): c is Caixa => c !== null)
    for (let i = 0; i < org.length; i++) for (let j = i + 1; j < org.length; j++) expect(encostam(org[i] as Caixa, org[j] as Caixa, 3), `${org[i]?.id} × ${org[j]?.id}`).toBe(false)
    for (let i = 0; i < rot.length; i++) {
      for (let j = i + 1; j < rot.length; j++) expect(encostam(rot[i] as Caixa, rot[j] as Caixa, 3), `rótulos ${rot[i]?.id} × ${rot[j]?.id}`).toBe(false)
      for (const o of org) expect(encostam(rot[i] as Caixa, o, 2), `rótulo ${rot[i]?.id} × ${o.id}`).toBe(false)
    }
  })
})
