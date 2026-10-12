import { FASES_MEIOSE, FASES_MITOSE, contagem, type TipoDivisao } from './calculo'
import { desenhar, descreverDesenho, type CelulaDesenho, type Cromo } from './desenhoDivisao'

const TODAS: [TipoDivisao, string][] = [...FASES_MITOSE.map((f) => ['mitose', f] as [TipoDivisao, string]), ...FASES_MEIOSE.map((f) => ['meiose', f] as [TipoDivisao, string])]

describe('Desenho das fases (2n = 4) confere com a tabela de contagem', () => {
  it.each(TODAS)('%s – %s: células, cromossomos e cromátides', (tipo, fase) => {
    const d = desenhar(tipo, fase)
    const c = contagem(tipo, fase, 4)
    expect(d.celulas).toHaveLength(c.celulas)
    for (const cel of d.celulas) {
      expect(cel.cromos).toHaveLength(c.cromossomosPorCelula)
      expect(cel.cromos.reduce((s, x) => s + x.cromatides, 0)).toBe(c.cromatidesPorCelula)
    }
  })

  it.each(TODAS)('%s – %s: tudo cabe dentro da célula e nada se sobrepõe', (tipo, fase) => {
    const d = desenhar(tipo, fase)
    for (const cel of d.celulas) {
      for (const x of cel.cromos) {
        for (const ponta of [x.y - x.comprimento / 2, x.y + x.comprimento / 2]) {
          const dentro = ((x.x - cel.cx) / cel.rx) ** 2 + ((ponta - cel.cy) / cel.ry) ** 2
          expect(dentro, `${tipo} ${fase} cromossomo em (${x.x},${x.y})`).toBeLessThan(0.97)
        }
      }
      cel.cromos.forEach((a, i) =>
        cel.cromos.slice(i + 1).forEach((b) => {
          const sobrepoeX = Math.abs(a.x - b.x) < 12
          const sobrepoeY = Math.abs(a.y - b.y) < (a.comprimento + b.comprimento) / 2 + 2
          expect(sobrepoeX && sobrepoeY, `${tipo} ${fase}: (${a.x},${a.y}) × (${b.x},${b.y})`).toBe(false)
        }),
      )
    }
    // células vizinhas não se sobrepõem
    d.celulas.forEach((a, i) =>
      d.celulas.slice(i + 1).forEach((b) => {
        const distX = Math.abs(a.cx - b.cx) / (a.rx + b.rx)
        const distY = Math.abs(a.cy - b.cy) / (a.ry + b.ry)
        expect(Math.max(distX, distY), `${tipo} ${fase}: células sobrepostas`).toBeGreaterThanOrEqual(0.99)
      }),
    )
  })

  it('meiose: antes da anáfase I cada célula tem os dois homólogos de cada par; depois, só um de cada par', () => {
    const paresPorCelula = (cel: CelulaDesenho) => [1, 2].map((p) => cel.cromos.filter((c: Cromo) => c.par === p).length)
    for (const fase of ['G1', 'S/G2', 'Prófase I', 'Metáfase I'])
      for (const cel of desenhar('meiose', fase).celulas) expect(paresPorCelula(cel), fase).toEqual([2, 2])
    for (const fase of ['Telófase I', 'Prófase II', 'Metáfase II', 'Telófase II'])
      for (const cel of desenhar('meiose', fase).celulas) {
        expect(paresPorCelula(cel), fase).toEqual([1, 1])
        // um cromossomo de cada par, e de origens diferentes ou não (assortment): o que importa é um de cada par
        expect(new Set(cel.cromos.map((c) => c.par)).size).toBe(2)
      }
    // na anáfase I os dois homólogos de um par vão para polos opostos
    const ana = desenhar('meiose', 'Anáfase I').celulas[0] as CelulaDesenho
    for (const par of [1, 2]) {
      const xs = ana.cromos.filter((c) => c.par === par).map((c) => c.x)
      expect(Math.min(...xs)).toBeLessThan(170)
      expect(Math.max(...xs)).toBeGreaterThan(170)
    }
  })

  it('mitose: na anáfase as cromátides-irmãs (mesma origem e par) vão para lados opostos', () => {
    const ana = desenhar('mitose', 'Anáfase').celulas[0] as CelulaDesenho
    for (const par of [1, 2] as const)
      for (const origem of ['M', 'P'] as const) {
        const xs = ana.cromos.filter((c) => c.par === par && c.origem === origem).map((c) => c.x)
        expect(xs).toHaveLength(2)
        expect(xs[0]! < 170 && xs[1]! > 170).toBe(true)
      }
  })

  it('a descrição acessível diz o que há na figura, sem revelar o nome da fase', () => {
    for (const [tipo, fase] of TODAS) {
      const t = descreverDesenho(desenhar(tipo, fase))
      expect(t).not.toMatch(/prófase|metáfase|anáfase|telófase|mitose|meiose/i)
      expect(t.length).toBeGreaterThan(30)
    }
    expect(descreverDesenho(desenhar('meiose', 'Metáfase I'))).toContain('pares de homólogos')
    expect(descreverDesenho(desenhar('mitose', 'Metáfase'))).toContain('quatro cromossomos duplicados')
    expect(descreverDesenho(desenhar('meiose', 'Telófase II'))).toContain('quatro células')
  })

  it('fase inexistente gera erro', () => {
    expect(() => desenhar('mitose', 'Metáfase I')).toThrow()
  })
})
