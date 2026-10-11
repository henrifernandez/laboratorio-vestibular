import { areaTotal, areaLateral, areaBases, type Dimensoes, type Solido } from './calculo'
import { areaPeca, limitesRede, rede, redeComDefeito, type DefeitoRede } from './redes'

const CASOS: [Solido, Dimensoes][] = [
  ['prisma', { a: 2, b: 3, h: 4 }],
  ['prisma', { a: 5, b: 5, h: 5 }],
  ['cilindro', { r: 3, h: 10 }],
  ['cone', { r: 3, h: 4 }],
  ['cone', { r: 2, h: 7 }],
  ['piramide', { a: 6, h: 4 }],
  ['piramide', { a: 4, h: 10 }],
]

describe('planificações: a soma das áreas das peças é a área total do sólido', () => {
  for (const [s, d] of CASOS) {
    it(`${s} ${JSON.stringify(d)}`, () => {
      const pecas = rede(s, d)
      const soma = pecas.reduce((acc, p) => acc + areaPeca(p), 0)
      expect(soma).toBeCloseTo(areaTotal(s, d), 6)
    })
  }

  it('as peças marcadas como laterais somam a área lateral; as demais, a das bases', () => {
    for (const [s, d] of CASOS) {
      const pecas = rede(s, d)
      const lat = pecas.filter((p) => p.lateral).reduce((acc, p) => acc + areaPeca(p), 0)
      const bases = pecas.filter((p) => !p.lateral).reduce((acc, p) => acc + areaPeca(p), 0)
      expect(lat).toBeCloseTo(areaLateral(s, d), 6)
      expect(bases).toBeCloseTo(areaBases(s, d), 6)
    }
  })

  it('a esfera não tem planificação', () => {
    expect(rede('esfera', { r: 3 })).toEqual([])
  })

  it('o contorno envolve todas as peças e tem tamanho positivo', () => {
    for (const [s, d] of CASOS) {
      const l = limitesRede(rede(s, d))
      expect(l.xmax).toBeGreaterThan(l.xmin)
      expect(l.ymax).toBeGreaterThan(l.ymin)
    }
  })

  it('o setor do cone tem ângulo 2πr/g (o arco do setor é o perímetro da base)', () => {
    const pecas = rede('cone', { r: 3, h: 4 })
    const setor = pecas.find((p) => p.tipo === 'setor')!
    if (setor.tipo !== 'setor') throw new Error('sem setor')
    expect(setor.raio).toBeCloseTo(5)
    expect(setor.raio * setor.angulo).toBeCloseTo(2 * Math.PI * 3, 9)
  })
})

describe('planificações com defeito', () => {
  const DEFEITOS: DefeitoRede[] = ['larguraErrada', 'setorErrado', 'faltaFace', 'faceExtra']
  it('cada defeito muda a área total da figura (não é uma planificação correta)', () => {
    for (const [s, d] of CASOS) {
      const certa = redeComDefeito(s, d, 'correta').reduce((acc, p) => acc + areaPeca(p), 0)
      expect(certa).toBeCloseTo(areaTotal(s, d), 6)
      for (const def of DEFEITOS) {
        if (def === 'setorErrado' && s !== 'cone') continue
        if (def === 'larguraErrada' && s === 'cone') continue
        const soma = redeComDefeito(s, d, def).reduce((acc, p) => acc + areaPeca(p), 0)
        expect(Math.abs(soma - certa)).toBeGreaterThan(1e-6)
      }
    }
  })
  it('falta e excesso de faces mudam a quantidade de peças em 1', () => {
    for (const [s, d] of CASOS) {
      const n = rede(s, d).length
      expect(redeComDefeito(s, d, 'faltaFace')).toHaveLength(n - 1)
      expect(redeComDefeito(s, d, 'faceExtra')).toHaveLength(n + 1)
    }
  })
})
