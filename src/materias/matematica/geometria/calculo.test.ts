import { angulosTriangulo, areaTotal, areaLateral, areaBases, catetoDado, ehRetangulo, hipotenusa, ladosTriangulo, razaoAreas, volume } from './calculo'

describe('volumes', () => {
  it('prisma (paralelepípedo), cilindro, cone, pirâmide e esfera', () => {
    expect(volume('prisma', { a: 2, b: 3, h: 4 })).toBe(24)
    expect(volume('cilindro', { r: 3, h: 10 })).toBeCloseTo(90 * Math.PI)
    expect(volume('cone', { r: 3, h: 4 })).toBeCloseTo(12 * Math.PI)
    expect(volume('piramide', { a: 6, h: 4 })).toBe(48)
    expect(volume('esfera', { r: 3 })).toBeCloseTo(36 * Math.PI)
  })
  it('relações clássicas: cone = 1/3 do cilindro, pirâmide = 1/3 do prisma, esfera = 2/3 do cilindro circunscrito', () => {
    expect(volume('cone', { r: 5, h: 9 })).toBeCloseTo(volume('cilindro', { r: 5, h: 9 }) / 3)
    expect(volume('piramide', { a: 4, h: 9 })).toBeCloseTo(volume('prisma', { a: 4, b: 4, h: 9 }) / 3)
    expect(volume('esfera', { r: 4 })).toBeCloseTo((2 / 3) * volume('cilindro', { r: 4, h: 8 }))
  })
})

describe('áreas', () => {
  it('prisma: 2(ab + ah + bh)', () => {
    expect(areaTotal('prisma', { a: 2, b: 3, h: 4 })).toBe(52)
    expect(areaLateral('prisma', { a: 2, b: 3, h: 4 })).toBe(40)
    expect(areaBases('prisma', { a: 2, b: 3, h: 4 })).toBe(12)
  })
  it('cilindro: lateral 2πrh, bases 2πr²', () => {
    expect(areaLateral('cilindro', { r: 3, h: 10 })).toBeCloseTo(60 * Math.PI)
    expect(areaBases('cilindro', { r: 3, h: 10 })).toBeCloseTo(18 * Math.PI)
    expect(areaTotal('cilindro', { r: 3, h: 10 })).toBeCloseTo(78 * Math.PI)
  })
  it('cone: lateral πrg, base πr²', () => {
    expect(areaLateral('cone', { r: 3, h: 4 })).toBeCloseTo(15 * Math.PI)
    expect(areaTotal('cone', { r: 3, h: 4 })).toBeCloseTo(24 * Math.PI)
  })
  it('pirâmide quadrangular: lateral 4·(a·ap/2)', () => {
    expect(areaLateral('piramide', { a: 6, h: 4 })).toBe(60)
    expect(areaTotal('piramide', { a: 6, h: 4 })).toBe(96)
  })
  it('esfera: 4πr²', () => {
    expect(areaTotal('esfera', { r: 3 })).toBeCloseTo(36 * Math.PI)
  })
})

describe('Pitágoras', () => {
  it('hipotenusa e cateto', () => {
    expect(hipotenusa(3, 4)).toBe(5)
    expect(catetoDado(13, 5)).toBe(12)
    expect(hipotenusa(1, 1)).toBeCloseTo(Math.SQRT2)
  })
  it('reconhece triângulo retângulo por três lados, em qualquer ordem', () => {
    expect(ehRetangulo([5, 3, 4])).toBe(true)
    expect(ehRetangulo([13, 12, 5])).toBe(true)
    expect(ehRetangulo([4, 5, 6])).toBe(false)
  })
})

describe('triângulo pelos vértices', () => {
  it('lados e ângulos de um 3-4-5', () => {
    const t = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }] as const
    const lados = ladosTriangulo(t[0], t[1], t[2])
    expect([...lados].sort((a, b) => a - b)).toEqual([3, 4, 5])
    const ang = angulosTriangulo(t[0], t[1], t[2])
    expect(ang.reduce((s, x) => s + x, 0)).toBeCloseTo(180)
    expect(ang.some((x) => Math.abs(x - 90) < 1e-9)).toBe(true)
  })
})

describe('semelhança', () => {
  it('razão de áreas é o quadrado da razão de semelhança', () => {
    expect(razaoAreas(2)).toBe(4)
    expect(razaoAreas(0.5)).toBe(0.25)
  })
})
