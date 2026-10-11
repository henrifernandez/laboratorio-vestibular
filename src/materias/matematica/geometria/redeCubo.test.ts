import { ehPlanificacaoDeCubo, formaCanonica, hexaminosFixos, redesInvalidas, redesValidas, type Celula } from './redeCubo'

const c = (...xs: [number, number][]): Celula[] => xs.map(([x, y]) => ({ x, y }))

describe('planificação de cubo', () => {
  it('a cruz clássica é válida', () => {
    expect(ehPlanificacaoDeCubo(c([1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]))).toBe(true)
  })
  it('seis quadrados em linha não formam cubo', () => {
    expect(ehPlanificacaoDeCubo(c([0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]))).toBe(false)
  })
  it('um bloco 2×2 nunca é planificação', () => {
    expect(ehPlanificacaoDeCubo(c([0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [3, 0]))).toBe(false)
  })
  it('quadrados desconectados ou em número errado não valem', () => {
    expect(ehPlanificacaoDeCubo(c([0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [7, 7]))).toBe(false)
    expect(ehPlanificacaoDeCubo(c([0, 0], [1, 0], [2, 0]))).toBe(false)
  })
  it('é invariante a translação e rotação', () => {
    const cruz = c([1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3])
    const girada = cruz.map(({ x, y }) => ({ x: -y + 10, y: x + 5 }))
    expect(ehPlanificacaoDeCubo(girada)).toBe(true)
  })
})

describe('todos os hexaminós', () => {
  it('há 216 hexaminós fixos e 35 livres; exatamente 11 livres são planificações de cubo', () => {
    const fixos = hexaminosFixos()
    expect(fixos).toHaveLength(216)
    const livres = new Set(fixos.map(formaCanonica))
    expect(livres.size).toBe(35)
    expect(redesValidas()).toHaveLength(11)
    expect(redesInvalidas()).toHaveLength(24)
  })
  it('os bancos são consistentes com o verificador e diferentes entre si', () => {
    for (const r of redesValidas()) expect(ehPlanificacaoDeCubo(r)).toBe(true)
    for (const r of redesInvalidas()) expect(ehPlanificacaoDeCubo(r)).toBe(false)
    expect(new Set([...redesValidas(), ...redesInvalidas()].map(formaCanonica)).size).toBe(35)
  })
})
