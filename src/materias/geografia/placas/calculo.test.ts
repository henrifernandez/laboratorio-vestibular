import { ALTURA, LARGURA, LIMITES, deslocamentoKm, idadeDaCrosta, ladoQueAfunda, larguraDoOceano, limiteDe, montarCena, taxaTotal, tempoMa, velocidadeCmAno, type Crosta, type IdLimite, type Movimento } from './calculo'

const CROSTAS: Crosta[] = ['oceanica', 'continental']
const MOVS: Movimento[] = ['afastam', 'aproximam', 'deslizam']

describe('Tipo de limite', () => {
  // Tabela escrita à parte: [esquerda, direita, movimento] -> limite
  const ESPERADO: [Crosta, Crosta, Movimento, IdLimite | null][] = [
    ['oceanica', 'oceanica', 'afastam', 'dorsal'],
    ['continental', 'continental', 'afastam', 'rifte'],
    ['oceanica', 'continental', 'afastam', null],
    ['continental', 'oceanica', 'afastam', null],
    ['oceanica', 'continental', 'aproximam', 'subducao-continental'],
    ['continental', 'oceanica', 'aproximam', 'subducao-continental'],
    ['oceanica', 'oceanica', 'aproximam', 'subducao-oceanica'],
    ['continental', 'continental', 'aproximam', 'colisao'],
    ['oceanica', 'oceanica', 'deslizam', 'transformante'],
    ['oceanica', 'continental', 'deslizam', 'transformante'],
    ['continental', 'oceanica', 'deslizam', 'transformante'],
    ['continental', 'continental', 'deslizam', 'transformante'],
  ]
  it.each(ESPERADO)('%s + %s, %s', (a, b, mov, id) => {
    expect(limiteDe(a, b, mov)?.id ?? null).toBe(id)
  })
  it('as 12 combinações possíveis estão cobertas', () => {
    expect(ESPERADO).toHaveLength(CROSTAS.length * CROSTAS.length * MOVS.length)
  })
  it('só a colisão e a transformante não têm vulcões; os demais têm', () => {
    const sem = Object.values(LIMITES)
      .filter((l) => !l.vulcoes)
      .map((l) => l.id)
    expect(sem.sort()).toEqual(['colisao', 'transformante'])
  })
  it('as classes: dois divergentes, três convergentes, um transformante', () => {
    const cont = (c: string) => Object.values(LIMITES).filter((l) => l.classe === c).length
    expect([cont('divergente'), cont('convergente'), cont('transformante')]).toEqual([2, 3, 1])
  })
  it('na subducção, quem afunda é a oceânica; na colisão, ninguém', () => {
    expect(ladoQueAfunda('oceanica', 'continental')).toBe(0)
    expect(ladoQueAfunda('continental', 'oceanica')).toBe(1)
    expect(ladoQueAfunda('oceanica', 'oceanica')).toBe(0)
    expect(ladoQueAfunda('continental', 'continental')).toBeNull()
  })
})

describe('Contas de deslocamento', () => {
  it('1 cm/ano = 10 km por milhão de anos', () => {
    expect(deslocamentoKm(1, 1)).toBe(10)
    expect(deslocamentoKm(5, 100)).toBe(5000)
    // conferência por unidades: 3 cm/ano × 20 milhões de anos = 60.000.000 cm = 600 km
    expect((3 * 20e6) / 100 / 1000).toBe(deslocamentoKm(3, 20))
  })
  it('tempo e velocidade são as operações inversas', () => {
    for (const v of [1, 2.5, 4, 8])
      for (const t of [10, 40, 100]) {
        const d = deslocamentoKm(v, t)
        expect(tempoMa(d, v)).toBeCloseTo(t, 9)
        expect(velocidadeCmAno(d, t)).toBeCloseTo(v, 9)
      }
  })
  it('espalhamento: a taxa total é o dobro da meia-taxa e a idade da crosta é simétrica', () => {
    expect(taxaTotal(2.5)).toBe(5)
    expect(idadeDaCrosta(1000, 2.5)).toBe(40)
    expect(idadeDaCrosta(-1000, 2.5)).toBe(40)
    expect(larguraDoOceano(100, 2.5)).toBe(5000)
    // coerência: cada margem anda meia-taxa × t
    expect(larguraDoOceano(80, 2)).toBe(2 * deslocamentoKm(2, 80))
  })
})

describe('Diagrama', () => {
  const IDS = Object.keys(LIMITES) as IdLimite[]
  it('todas as formas ficam dentro do quadro, com números finitos, em qualquer progresso', () => {
    const ordens: [Crosta, Crosta][] = [
      ['oceanica', 'continental'],
      ['continental', 'oceanica'],
    ]
    for (const id of IDS)
      for (const p of [0, 0.25, 0.5, 0.75, 1])
        for (const ordem of ordens) {
          const c = montarCena(id, p, ordem)
          for (const f of c.formas)
            for (const [x, y] of f.pontos) {
              expect(Number.isFinite(x) && Number.isFinite(y), `${id} ${f.id}`).toBe(true)
              expect(x, `${id} ${f.id} x`).toBeGreaterThanOrEqual(-1)
              expect(x, `${id} ${f.id} x`).toBeLessThanOrEqual(LARGURA + 1)
              expect(y, `${id} ${f.id} y p=${p}`).toBeGreaterThanOrEqual(-1)
              expect(y, `${id} ${f.id} y p=${p}`).toBeLessThanOrEqual(ALTURA + 1)
            }
          for (const r of c.rotulos) {
            expect(r.y, `${id} rótulo ${r.texto}`).toBeGreaterThan(8)
            expect(r.y, `${id} rótulo ${r.texto}`).toBeLessThan(ALTURA)
          }
        }
  })
  it('o progresso é limitado a 0..1', () => {
    expect(montarCena('dorsal', 2)).toEqual(montarCena('dorsal', 1))
    expect(montarCena('dorsal', -1)).toEqual(montarCena('dorsal', 0))
  })
  it('na dorsal, a fenda alarga com o progresso', () => {
    const larg = (p: number) => {
      const c = montarCena('dorsal', p)
      const nova = c.formas.find((f) => f.id === 'crosta-nova')!
      const xs = nova.pontos.map((q) => q[0])
      return Math.max(...xs) - Math.min(...xs)
    }
    expect(larg(1)).toBeGreaterThan(larg(0.5))
    expect(larg(0.5)).toBeGreaterThan(larg(0))
  })
  it('subducção: a placa que afunda cresce com o progresso; há vulcão; a ordem espelha o desenho', () => {
    const profundidade = (p: number) =>
      Math.max(...montarCena('subducao-continental', p).formas.find((f) => f.id === 'placa-slab')!.pontos.map((q) => q[1]))
    expect(profundidade(1)).toBeGreaterThan(profundidade(0.2))
    const esq = montarCena('subducao-continental', 0.5, ['oceanica', 'continental'])
    const dir = montarCena('subducao-continental', 0.5, ['continental', 'oceanica'])
    const xMedio = (c: typeof esq) => {
      const s = c.formas.find((f) => f.id === 'placa-slab')!
      return s.pontos.reduce((a, q) => a + q[0], 0) / s.pontos.length
    }
    expect(xMedio(esq)).toBeLessThan(LARGURA / 2)
    expect(xMedio(dir)).toBeGreaterThan(LARGURA / 2)
    expect(esq.vulcoes).toHaveLength(1)
  })
  it('colisão: a montanha sobe; não há vulcões no desenho da colisão nem da transformante', () => {
    const topo = (p: number) => Math.min(...montarCena('colisao', p).formas.find((f) => f.id === 'montanha')!.pontos.map((q) => q[1]))
    expect(topo(1)).toBeLessThan(topo(0.1))
    expect(montarCena('colisao', 1).vulcoes).toHaveLength(0)
    expect(montarCena('transformante', 1).vulcoes).toHaveLength(0)
  })
  it('rifte: o mar só entra quando o afastamento está bem avançado', () => {
    expect(montarCena('rifte', 0.4).formas.some((f) => f.id === 'mar-novo')).toBe(false)
    expect(montarCena('rifte', 0.95).formas.some((f) => f.id === 'mar-novo')).toBe(true)
  })
})
