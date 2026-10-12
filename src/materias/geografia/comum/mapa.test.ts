import { carregarPaises, montarQuadro, type Extensao } from './mapa'

const AMERICA_DO_SUL: Extensao = [
  [-84, -57],
  [-32, 14],
]
const MUNDO: Extensao = [
  [-180, -58],
  [180, 84],
]

describe('Quadro do mapa (projeção ajustada à região)', () => {
  it('os cantos da região caem nos cantos do desenho (e não no mundo inteiro)', async () => {
    const paises = await carregarPaises()
    for (const ext of [AMERICA_DO_SUL, MUNDO]) {
      const q = montarQuadro(paises, ext)
      const [[lon0, lat0], [lon1, lat1]] = ext
      const sudoeste = q.projetar([lon0, lat0])!
      const nordeste = q.projetar([lon1, lat1])!
      expect(sudoeste[0], 'x do canto sudoeste').toBeCloseTo(0, 0)
      expect(sudoeste[1], 'y do canto sudoeste').toBeCloseTo(q.altura, 0)
      expect(nordeste[0], 'x do canto nordeste').toBeCloseTo(q.largura, 0)
      expect(nordeste[1], 'y do canto nordeste').toBeCloseTo(0, 0)
    }
  })
  it('a altura segue a proporção da região em graus', async () => {
    const paises = await carregarPaises()
    const q = montarQuadro(paises, AMERICA_DO_SUL)
    expect(q.altura / q.largura).toBeCloseTo((14 + 57) / (84 - 32), 1)
  })
  it('na América do Sul, o Brasil ocupa boa parte do desenho', async () => {
    const paises = await carregarPaises()
    const q = montarQuadro(paises, AMERICA_DO_SUL)
    const brasil = q.projetar([-52, -12])!
    expect(brasil[0]).toBeGreaterThan(q.largura * 0.3)
    expect(brasil[0]).toBeLessThan(q.largura * 0.9)
    expect(brasil[1]).toBeGreaterThan(q.altura * 0.2)
    expect(brasil[1]).toBeLessThan(q.altura * 0.8)
    // um ponto da Europa fica bem fora do quadro
    const europa = q.projetar([10, 50])!
    expect(europa[0]).toBeGreaterThan(q.largura * 1.5)
  })
})
