import { ANGULOS_NOTAVEIS, exato, grausParaRad, normalizar, quadrante, radParaGraus, referencia, sinais, textoRad } from './calculo'

const rad = (g: number) => (g * Math.PI) / 180

describe('conversão', () => {
  it('graus ↔ radianos', () => {
    expect(grausParaRad(180)).toBeCloseTo(Math.PI)
    expect(radParaGraus(Math.PI / 2)).toBeCloseTo(90)
    expect(radParaGraus(1)).toBeCloseTo(57.29578, 4)
  })
  it('texto em radianos como fração de π', () => {
    expect(textoRad(0)).toBe('0')
    expect(textoRad(30)).toBe('π/6')
    expect(textoRad(45)).toBe('π/4')
    expect(textoRad(60)).toBe('π/3')
    expect(textoRad(90)).toBe('π/2')
    expect(textoRad(180)).toBe('π')
    expect(textoRad(150)).toBe('5π/6')
    expect(textoRad(210)).toBe('7π/6')
    expect(textoRad(360)).toBe('2π')
    expect(textoRad(-60)).toBe('−π/3')
    expect(textoRad(540)).toBe('3π')
  })
})

describe('normalização e quadrante', () => {
  it('leva qualquer ângulo para [0, 360)', () => {
    expect(normalizar(750)).toBe(30)
    expect(normalizar(-60)).toBe(300)
    expect(normalizar(360)).toBe(0)
    expect(normalizar(-720)).toBe(0)
  })
  it('quadrante (0 em cima dos eixos)', () => {
    expect(quadrante(30)).toBe(1)
    expect(quadrante(135)).toBe(2)
    expect(quadrante(210)).toBe(3)
    expect(quadrante(300)).toBe(4)
    expect(quadrante(750)).toBe(1)
    expect(quadrante(-60)).toBe(4)
    expect(quadrante(0)).toBe(0)
    expect(quadrante(90)).toBe(0)
    expect(quadrante(180)).toBe(0)
    expect(quadrante(270)).toBe(0)
  })
  it('ângulo de referência no 1º quadrante', () => {
    expect(referencia(150)).toBe(30)
    expect(referencia(225)).toBe(45)
    expect(referencia(300)).toBe(60)
    expect(referencia(30)).toBe(30)
    expect(referencia(-60)).toBe(60)
  })
})

describe('sinais por quadrante', () => {
  it('seno, cosseno e tangente', () => {
    expect(sinais(1)).toEqual({ sen: '+', cos: '+', tan: '+' })
    expect(sinais(2)).toEqual({ sen: '+', cos: '−', tan: '−' })
    expect(sinais(3)).toEqual({ sen: '−', cos: '−', tan: '+' })
    expect(sinais(4)).toEqual({ sen: '−', cos: '+', tan: '−' })
  })
})

describe('valores exatos dos ângulos notáveis', () => {
  it('todos os ângulos notáveis, em qualquer volta, batem com Math.sin/cos/tan', () => {
    for (const g of ANGULOS_NOTAVEIS) {
      for (const volta of [-720, -360, 0, 360, 720]) {
        const a = g + volta
        expect(exato('sen', a).num).toBeCloseTo(Math.sin(rad(a)), 9)
        expect(exato('cos', a).num).toBeCloseTo(Math.cos(rad(a)), 9)
        const t = exato('tan', a)
        if (t.existe) expect(t.num).toBeCloseTo(Math.tan(rad(a)), 9)
      }
    }
  })
  it('textos exatos conhecidos', () => {
    expect(exato('sen', 30).texto).toBe('1/2')
    expect(exato('sen', 150).texto).toBe('1/2')
    expect(exato('cos', 150).texto).toBe('−√3/2')
    expect(exato('sen', 225).texto).toBe('−√2/2')
    expect(exato('cos', 300).texto).toBe('1/2')
    expect(exato('tan', 120).texto).toBe('−√3')
    expect(exato('tan', 45).texto).toBe('1')
    expect(exato('sen', 90).texto).toBe('1')
    expect(exato('cos', 90).texto).toBe('0')
    expect(exato('sen', 0).texto).toBe('0')
    expect(exato('cos', 180).texto).toBe('−1')
    expect(exato('sen', 270).texto).toBe('−1')
  })
  it('tangente não existe em 90° e 270°', () => {
    expect(exato('tan', 90).existe).toBe(false)
    expect(exato('tan', 270).existe).toBe(false)
    expect(exato('tan', 450).existe).toBe(false)
    expect(exato('tan', 90).texto).toBe('não existe')
  })
  it('zero não tem sinal (sem "−0")', () => {
    expect(exato('sen', 180).texto).toBe('0')
    expect(exato('cos', 270).texto).toBe('0')
    expect(exato('tan', 180).texto).toBe('0')
    expect(exato('tan', 360).texto).toBe('0')
  })
})
