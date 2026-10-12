import { larguraTexto } from '@/lib/rotulos'
import type { Topologia } from './calculo'
import { MEIO_BATERIA, MEIO_COMP, caixasRotulos, cortarFios, esquemaCircuito, nosDeJuncao, type Seg } from './esquema'

const CASOS: [Topologia, number][] = [
  ['serie', 2],
  ['serie', 3],
  ['serie', 4],
  ['paralelo', 2],
  ['paralelo', 3],
  ['misto', 3],
  ['misto2', 3],
]

const sobre = ([x1, y1, x2, y2]: Seg, x: number, y: number) =>
  y1 === y2 ? y === y1 && x >= Math.min(x1, x2) && x <= Math.max(x1, x2) : x === x1 && y >= Math.min(y1, y2) && y <= Math.max(y1, y2)

describe('Esquema dos circuitos', () => {
  it('cada componente e a bateria ficam sobre um fio, e tudo cabe no quadro', () => {
    for (const [t, n] of CASOS) {
      const e = esquemaCircuito(t, n)
      expect(e.comps, `${t} ${n}`).toHaveLength(n)
      for (const c of [...e.comps, e.bateria]) expect(e.fios.some((s) => sobre(s, c.x, c.y)), `${t} ${n}: (${c.x}, ${c.y})`).toBe(true)
      for (const [x1, , x2] of e.fios) for (const v of [x1, x2]) expect(v >= 0 && v <= e.W).toBe(true)
      for (const [, y1, , y2] of e.fios) for (const v of [y1, y2]) expect(v >= 0 && v <= e.H, `${t} ${n} y=${v}`).toBe(true)
    }
  })
  it('os fios cortados deixam um vão do tamanho do símbolo em cada componente e na bateria', () => {
    for (const [t, n] of CASOS) {
      const e = esquemaCircuito(t, n)
      const cortados = cortarFios(e)
      for (const c of e.comps) {
        // nenhum pedaço de fio passa pelo centro do componente nem a menos de MEIO_COMP dele, ao longo do fio
        for (const s of cortados) {
          if (!sobre(s, c.x, c.y)) continue
          throw new Error(`${t} ${n}: fio passa por cima do componente em (${c.x}, ${c.y})`)
        }
      }
      for (const s of cortados) expect(sobre(s, e.bateria.x, e.bateria.y), `${t} ${n}: fio sobre a bateria`).toBe(false)
      // os vãos têm exatamente o tamanho do símbolo: o comprimento total diminui 2·meio por componente e pela bateria
      const comp = (ss: Seg[]) => ss.reduce((a, [x1, y1, x2, y2]) => a + Math.abs(x2 - x1) + Math.abs(y2 - y1), 0)
      expect(comp(e.fios) - comp(cortados)).toBeCloseTo(2 * MEIO_COMP * n + 2 * MEIO_BATERIA, 6)
    }
  })
  it('os nós de junção aparecem só onde a corrente se divide: nenhum em série, dois por bloco em paralelo', () => {
    for (const [t, n] of CASOS) {
      const nos = nosDeJuncao(esquemaCircuito(t, n))
      if (t === 'serie') expect(nos, `${t} ${n}`).toHaveLength(0)
      else if (t === 'paralelo') expect(nos, `${t} ${n}`).toHaveLength(2 * (n - 1))
      else expect(nos, `${t}`).toHaveLength(2)
    }
  })
  it('os rótulos (nome em cima, até duas linhas de valores embaixo) não se sobrepõem e cabem no quadro', () => {
    const nome = larguraTexto('L3', 12, true)
    const linhas = [larguraTexto('60 Ω', 11), larguraTexto('24 V · 0,38 A', 11)]
    for (const [t, n] of CASOS) {
      const e = esquemaCircuito(t, n)
      const caixas = e.comps.flatMap((c) => caixasRotulos(c, { nome, linhas }))
      for (const b of caixas) {
        expect(b.x0, `${t} ${n}`).toBeGreaterThanOrEqual(0)
        expect(b.x1, `${t} ${n}`).toBeLessThanOrEqual(e.W)
        expect(b.y0, `${t} ${n}`).toBeGreaterThanOrEqual(0)
        expect(b.y1, `${t} ${n}`).toBeLessThanOrEqual(e.H)
      }
      for (let i = 0; i < caixas.length; i++)
        for (let j = i + 1; j < caixas.length; j++) {
          const a = caixas[i]!
          const b = caixas[j]!
          const sep = a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0
          expect(sep, `${t} ${n}: rótulos ${i} e ${j} se sobrepõem`).toBe(true)
        }
      // e nenhum rótulo é cortado por um fio vertical
      for (const [x1, y1, , y2] of e.fios.filter((s) => s[0] === s[2]))
        for (const b of caixas) {
          const cruza = x1 > b.x0 && x1 < b.x1 && Math.max(y1, y2) > b.y0 && Math.min(y1, y2) < b.y1
          expect(cruza, `${t} ${n}: fio vertical em x=${x1} corta um rótulo`).toBe(false)
        }
    }
  })
})
