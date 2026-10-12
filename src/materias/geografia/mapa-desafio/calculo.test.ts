import {
  KM_POR_GRAU,
  RAIO_TERRA,
  denominadorDaEscala,
  distanciaGrandeCirculo,
  distanciaNoMapa,
  distanciaNoMeridiano,
  distanciaReal,
  escalaMaior,
  formatarCoordenada,
  formatarEscala,
  hemisferioLO,
  hemisferioNS,
  umCentimetro,
} from './calculo'

describe('Coordenadas', () => {
  it('hemisférios pelo sinal da latitude e da longitude', () => {
    expect(hemisferioNS(23)).toBe('Norte')
    expect(hemisferioNS(-23)).toBe('Sul')
    expect(hemisferioNS(0)).toBe('sobre o Equador')
    expect(hemisferioLO(46)).toBe('Oriental')
    expect(hemisferioLO(-46)).toBe('Ocidental')
    expect(hemisferioLO(0)).toBe('sobre o meridiano de Greenwich')
  })
  it('texto das coordenadas com a letra do lado', () => {
    expect(formatarCoordenada({ lat: -23, lon: -46 })).toBe('23° S, 46° O')
    expect(formatarCoordenada({ lat: 40, lon: 116 })).toBe('40° N, 116° L')
    expect(formatarCoordenada({ lat: 0, lon: 0 })).toBe('0°, 0°')
  })
  it('1° de latitude mede cerca de 111 km (circunferência de ≈ 40.000 km ÷ 360)', () => {
    expect(KM_POR_GRAU).toBeCloseTo(111.19, 1)
    expect(KM_POR_GRAU * 360).toBeCloseTo(2 * Math.PI * RAIO_TERRA, 6)
    expect(distanciaNoMeridiano(0, 10)).toBeCloseTo(1111.95, 1)
    expect(distanciaNoMeridiano(-10, 10)).toBeCloseTo(2223.9, 1)
    expect(distanciaNoMeridiano(30, -20)).toBeCloseTo(50 * KM_POR_GRAU, 6)
  })
  it('círculo máximo (haversine): um quarto da volta no Equador e meia volta nos antípodas', () => {
    expect(distanciaGrandeCirculo({ lat: 0, lon: 0 }, { lat: 0, lon: 90 })).toBeCloseTo((Math.PI * RAIO_TERRA) / 2, 4)
    expect(distanciaGrandeCirculo({ lat: 0, lon: 0 }, { lat: 0, lon: 180 })).toBeCloseTo(Math.PI * RAIO_TERRA, 4)
    expect(distanciaGrandeCirculo({ lat: 10, lon: 20 }, { lat: 10, lon: 20 })).toBe(0)
    // do polo ao Equador: um quarto do meridiano
    expect(distanciaGrandeCirculo({ lat: 90, lon: 0 }, { lat: 0, lon: 77 })).toBeCloseTo(distanciaNoMeridiano(0, 90), 4)
    // sobre o mesmo meridiano, concorda com a conta por graus
    expect(distanciaGrandeCirculo({ lat: -30, lon: -50 }, { lat: 10, lon: -50 })).toBeCloseTo(distanciaNoMeridiano(-30, 10), 6)
  })
})

describe('Escala', () => {
  it('4 cm em 1:50.000 valem 2 km', () => {
    expect(distanciaReal(4, 50_000)).toBe(2)
    expect(distanciaReal(10, 25_000)).toBe(2.5)
    expect(distanciaReal(1, 100_000)).toBe(1)
  })
  it('150 km em 1:3.000.000 cabem em 5 cm', () => {
    expect(distanciaNoMapa(150, 3_000_000)).toBe(5)
    expect(distanciaNoMapa(2, 50_000)).toBe(4)
  })
  it('5 cm para 100 km é a escala 1:2.000.000', () => {
    expect(denominadorDaEscala(5, 100)).toBe(2_000_000)
    expect(denominadorDaEscala(4, 2)).toBe(50_000)
  })
  it('as três contas são inversas entre si', () => {
    for (const E of [10_000, 250_000, 5_000_000])
      for (const cm of [0.5, 2, 7.5]) {
        const km = distanciaReal(cm, E)
        expect(distanciaNoMapa(km, E)).toBeCloseTo(cm, 9)
        expect(denominadorDaEscala(cm, km)).toBeCloseTo(E, 6)
      }
  })
  it('a escala de menor denominador é a maior', () => {
    expect(escalaMaior(10_000, 1_000_000)).toBe(10_000)
    expect(escalaMaior(50_000_000, 1_000_000)).toBe(1_000_000)
  })
  it('texto da escala e de 1 cm', () => {
    expect(formatarEscala(50_000)).toBe('1:50.000')
    expect(umCentimetro(50_000)).toBe('500 m')
    expect(umCentimetro(10_000)).toBe('100 m')
    expect(umCentimetro(250_000)).toBe('2,5 km')
    expect(umCentimetro(1_000_000)).toBe('10 km')
  })
})
