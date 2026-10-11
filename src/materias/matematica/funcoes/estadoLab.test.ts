import { PADRAO, lerEstado, paraFuncao, paraParams, normalizarBase } from './estadoLab'

describe('estado do laboratório', () => {
  it('ida e volta pela URL preserva o estado', () => {
    const e = { ...PADRAO.quadratica, a: -1.5, b: 2, c: 3 }
    const params = new URLSearchParams(paraParams(e))
    expect(lerEstado(params)).toEqual(e)
  })

  it('URL vazia ou lixo voltam ao padrão', () => {
    expect(lerEstado(new URLSearchParams())).toEqual(PADRAO.afim)
    expect(lerEstado(new URLSearchParams('f=xyz&a=abc'))).toEqual(PADRAO.afim)
  })

  it('valores fora dos limites são cortados', () => {
    const e = lerEstado(new URLSearchParams('f=afim&a=99&b=-99'))
    expect(e.a).toBe(4)
    expect(e.b).toBe(-8)
  })

  it('paraFuncao monta cada família', () => {
    expect(paraFuncao({ ...PADRAO.afim, a: 2, b: 1 })).toEqual({ tipo: 'afim', a: 2, b: 1 })
    expect(paraFuncao({ ...PADRAO.quadratica, a: 1, b: 0, c: -4 })).toEqual({ tipo: 'quadratica', a: 1, b: 0, c: -4 })
    expect(paraFuncao({ ...PADRAO.exponencial, a: 2, base: 3, k: 1 })).toEqual({ tipo: 'exponencial', a: 2, base: 3, k: 1 })
    expect(paraFuncao({ ...PADRAO.logaritmica, a: 1, base: 10, k: 0 })).toEqual({ tipo: 'logaritmica', a: 1, base: 10, k: 0 })
  })

  it('quadrática com a = 0 vira uma função afim (degenerada)', () => {
    expect(paraFuncao({ ...PADRAO.quadratica, a: 0, b: 2, c: 1 })).toEqual({ tipo: 'afim', a: 2, b: 1 })
  })

  it('exponencial com base 1 vira constante', () => {
    expect(paraFuncao({ ...PADRAO.exponencial, a: 2, base: 1, k: 1 })).toEqual({ tipo: 'afim', a: 0, b: 3 })
  })

  it('normalizarBase pula o valor 1', () => {
    expect(normalizarBase(1, 0.9)).toBe(0.9 + 0.2)
    expect(normalizarBase(1, 1.1)).toBe(0.9)
    expect(normalizarBase(2, 1.5)).toBe(2)
  })
})
