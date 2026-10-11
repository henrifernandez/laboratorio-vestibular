import { criarLaco } from './laco'

describe('laço de simulação com passo fixo', () => {
  it('executa um número inteiro de passos por intervalo e guarda o resto', () => {
    const chamadas: number[] = []
    const laco = criarLaco({ passo: 0.01 }, (dt) => chamadas.push(dt))
    expect(laco.avancar(0.035)).toBe(3)
    expect(chamadas).toEqual([0.01, 0.01, 0.01])
    expect(laco.avancar(0.006)).toBe(1) // 0.005 de resto + 0.006 ≥ 0.01
  })

  it('é determinístico: mesma sequência de tempos gera o mesmo estado', () => {
    const rodar = (tempos: number[]) => {
      let x = 0
      const laco = criarLaco({ passo: 1 / 60 }, (dt) => {
        x += 3 * dt
      })
      tempos.forEach((t) => laco.avancar(t))
      return x
    }
    // 1 segundo em quadros de 16ms ou de 33ms dá praticamente o mesmo resultado
    const a = rodar(Array(60).fill(1 / 60))
    const b = rodar(Array(30).fill(1 / 30))
    expect(a).toBeCloseTo(b, 6)
  })

  it('a velocidade escala o tempo simulado', () => {
    let passos = 0
    const laco = criarLaco({ passo: 0.01 }, () => passos++)
    laco.avancar(0.1, 0.5)
    expect(passos).toBe(5)
  })

  it('limita quadros acumulados (aba em segundo plano não dispara milhares de passos)', () => {
    let passos = 0
    const laco = criarLaco({ passo: 0.01, maxPassos: 20 }, () => passos++)
    laco.avancar(60)
    expect(passos).toBe(20)
  })

  it('passoUnico roda exatamente um passo', () => {
    let passos = 0
    const laco = criarLaco({ passo: 0.02 }, () => passos++)
    laco.passoUnico()
    expect(passos).toBe(1)
  })

  it('zerar descarta o tempo acumulado', () => {
    let passos = 0
    const laco = criarLaco({ passo: 0.01 }, () => passos++)
    laco.avancar(0.009)
    laco.zerar()
    laco.avancar(0.009)
    expect(passos).toBe(0)
  })
})
