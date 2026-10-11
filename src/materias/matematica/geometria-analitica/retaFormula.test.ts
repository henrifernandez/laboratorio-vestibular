import { retaFormula, type InstanciaReta } from './retaFormula'

const base: InstanciaReta = {
  semente: 1,
  nivel: 1,
  variante: 'doisPontos',
  m: 2,
  n: -1,
  pontos: [
    { x: 1, y: 1 },
    { x: 3, y: 5 },
  ],
}

describe('Equação da reta — correção', () => {
  it('aceita formas equivalentes, com ou sem "y ="', () => {
    expect(retaFormula.corrigir(base, '2x - 1').correto).toBe(true)
    expect(retaFormula.corrigir(base, 'y = 2x - 1').correto).toBe(true)
    expect(retaFormula.corrigir(base, 'y=-1+2x').correto).toBe(true)
    expect(retaFormula.corrigir(base, '(4x - 2)/2').correto).toBe(true)
  })
  it('coeficiente angular certo, linear errado: nomeia o ponto que a reta não atinge', () => {
    const c = retaFormula.corrigir(base, '2x + 1')
    expect(c.correto).toBe(false)
    expect(c.motivo).toBe('coeficiente linear errado')
    expect(c.feedback).toMatch(/não passa por A\(1, 1\)/)
  })
  it('sinal do coeficiente angular trocado', () => {
    const c = retaFormula.corrigir(base, '-2x - 1')
    expect(c.motivo).toBe('sinal do coeficiente angular trocado')
  })
  it('coeficiente angular invertido (Δx/Δy)', () => {
    const c = retaFormula.corrigir(base, 'x/2 - 1')
    expect(c.motivo).toBe('coeficiente angular invertido')
  })
  it('expressão que não é reta', () => {
    const c = retaFormula.corrigir(base, 'x^2 - 1')
    expect(c.correto).toBe(false)
    expect(c.motivo).toBe('não é uma reta')
  })
  it('fórmula inválida', () => {
    const c = retaFormula.corrigir(base, '2x +')
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/fórmula/i)
  })
  it('variante paralela: usar o coeficiente da perpendicular é apontado', () => {
    const inst: InstanciaReta = { ...base, variante: 'paralela', m: 2, n: 1, pontos: [{ x: 1, y: 3 }], ref: { m: 2, n: -5 } }
    expect(retaFormula.corrigir(inst, '2x + 1').correto).toBe(true)
    const c = retaFormula.corrigir(inst, '-x/2 + 3')
    expect(c.motivo).toBe('usou a perpendicular no lugar da paralela')
  })
  it('variante perpendicular: repetir o coeficiente da reta dada é apontado', () => {
    const inst: InstanciaReta = { ...base, variante: 'perpendicular', m: -0.5, n: 3.5, pontos: [{ x: 1, y: 3 }], ref: { m: 2, n: 0 } }
    expect(retaFormula.corrigir(inst, '-x/2 + 3.5').correto).toBe(true)
    const c = retaFormula.corrigir(inst, '2x + 1')
    expect(c.motivo).toBe('usou a paralela no lugar da perpendicular')
  })
})

describe('Equação da reta — geração', () => {
  it('os pontos pertencem à reta e as retas têm coeficientes bonitos', () => {
    for (let s = 1; s <= 120; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = retaFormula.gerar(s, n)
        for (const p of i.pontos) expect(i.m * p.x + i.n).toBeCloseTo(p.y, 9)
        expect(Number.isFinite(i.m) && Number.isFinite(i.n)).toBe(true)
        expect(Math.abs(i.n * 2 - Math.round(i.n * 2))).toBeLessThan(1e-9) // n múltiplo de 0,5
        expect(retaFormula.corrigir(i, retaFormula.respostaCanonica(i)).correto).toBe(true)
      }
    }
  })
  it('nível 3 gera retas paralelas e perpendiculares coerentes com a reta dada', () => {
    const vistos = new Set<string>()
    for (let s = 1; s <= 200; s++) {
      const i = retaFormula.gerar(s, 3)
      vistos.add(i.variante)
      expect(i.ref).toBeDefined()
      if (i.variante === 'paralela') expect(i.m).toBeCloseTo(i.ref!.m, 9)
      if (i.variante === 'perpendicular') expect(i.m * i.ref!.m).toBeCloseTo(-1, 9)
      expect(i.pontos).toHaveLength(1)
    }
    expect([...vistos].sort()).toEqual(['paralela', 'perpendicular'])
  })
  it('dicas e explicação', () => {
    const i = retaFormula.gerar(4, 2)
    expect(retaFormula.dicas(i)).toHaveLength(3)
    expect(retaFormula.explicar(i).length).toBeGreaterThan(30)
  })
})
