import { ANGULO_PLANO, FORCAS, diagrama, vetorDe, type CenarioId, type Direcao, type InstanciaDCL, type RespostaDCL } from './dcl'

/** Existe combinação não negativa (não nula) desses vetores que dá a soma zero? (Carathéodory: basta olhar pares e trios.) */
function podeEquilibrar(vs: [number, number][]): boolean {
  const n = vs.length
  const cruz = (a: [number, number], b: [number, number]) => a[0] * b[1] - a[1] * b[0]
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = vs[i] as [number, number]
      const b = vs[j] as [number, number]
      if (Math.abs(cruz(a, b)) < 1e-9 && a[0] * b[0] + a[1] * b[1] < 0) return true
      for (let k = j + 1; k < n; k++) {
        const c = vs[k] as [number, number]
        // resolve w_a·a + w_b·b + 1·c = 0 por Cramer
        const det = cruz(a, b)
        if (Math.abs(det) < 1e-9) continue
        const wa = cruz([-c[0], -c[1]], b) / det
        const wb = cruz(a, [-c[0], -c[1]]) / det
        if (wa >= -1e-9 && wb >= -1e-9) return true
      }
    }
  }
  return false
}

const CENARIOS: CenarioId[] = ['mesa', 'pendurado', 'subindo', 'puxado', 'planoParado', 'planoDescendo', 'planoPuxado']

describe('diagrama de corpo livre — cenários', () => {
  it('todos os cenários têm gabarito para as cinco forças', () => {
    for (const c of CENARIOS) {
      const g = diagrama.gabarito(c)
      for (const f of FORCAS) expect(g[f.id]).toBeDefined()
      expect(g.movimento).toBe('nenhuma') // não existe "força do movimento"
      expect(g.peso).toBe('baixo') // o peso sempre aponta para baixo
    }
  })

  it('cenários em equilíbrio: as forças marcadas podem mesmo se cancelar', () => {
    const equilibrio: CenarioId[] = ['mesa', 'pendurado', 'subindo', 'planoParado', 'planoPuxado']
    for (const c of equilibrio) {
      const g = diagrama.gabarito(c)
      const vs = FORCAS.filter((f) => g[f.id] !== 'nenhuma').map((f) => vetorDe(g[f.id] as Direcao))
      expect(podeEquilibrar(vs)).toBe(true)
    }
  })

  it('cenários que aceleram: as forças marcadas não conseguem se cancelar sem o termo extra (F > atrito etc.)', () => {
    // no bloco puxado, só tração e atrito no eixo x: precisam diferir; os verticais se cancelam
    const g = diagrama.gabarito('puxado')
    const vs = FORCAS.filter((f) => g[f.id] !== 'nenhuma').map((f) => vetorDe(g[f.id] as Direcao))
    expect(podeEquilibrar(vs)).toBe(true) // com |tração| = |atrito| seria equilíbrio; com tração maior, acelera
    // ao descer o plano rugoso há uma resultante para baixo do plano: sem a tração, peso + normal + atrito têm solução se atrito = componente
    const d = diagrama.gabarito('planoDescendo')
    expect(d.atrito).toBe('subindoPlano')
    expect(d.normal).toBe('perpPlano')
  })

  it('o atrito se opõe ao movimento (ou à tendência de movimento)', () => {
    expect(diagrama.gabarito('puxado').atrito).toBe('esquerda')
    expect(diagrama.gabarito('planoParado').atrito).toBe('subindoPlano')
    expect(diagrama.gabarito('planoDescendo').atrito).toBe('subindoPlano')
    expect(diagrama.gabarito('planoPuxado').atrito).toBe('descendoPlano') // sobe: o atrito aponta para baixo
  })

  it('a normal é perpendicular à superfície', () => {
    const [nx, ny] = vetorDe('perpPlano')
    const [dx, dy] = vetorDe('descendoPlano')
    expect(nx * dx + ny * dy).toBeCloseTo(0, 9)
    expect(Math.atan2(-ny, nx)).toBeCloseTo(Math.PI / 2 - (ANGULO_PLANO * Math.PI) / 180, 9)
  })
})

const inst = (c: CenarioId): InstanciaDCL => ({ semente: 1, nivel: 2, cenario: c })
const resp = (c: CenarioId, mudar: Partial<RespostaDCL> = {}): RespostaDCL => ({ ...diagrama.gabarito(c), ...mudar })

describe('diagrama de corpo livre — correção', () => {
  it('aceita o gabarito', () => {
    for (const c of CENARIOS) {
      const r = diagrama.corrigir(inst(c), resp(c))
      expect(r.correto).toBe(true)
      expect(r.parcial).toBe(1)
    }
  })
  it('falta uma força: nomeia qual', () => {
    const r = diagrama.corrigir(inst('mesa'), resp('mesa', { normal: 'nenhuma' }))
    expect(r.correto).toBe(false)
    expect(r.feedback).toMatch(/normal/i)
    expect(r.motivo).toBe('faltou a normal')
  })
  it('força a mais: a "força do movimento" não existe', () => {
    const r = diagrama.corrigir(inst('puxado'), resp('puxado', { movimento: 'direita' }))
    expect(r.correto).toBe(false)
    expect(r.motivo).toBe('inventou uma "força do movimento"')
    expect(r.feedback).toMatch(/inércia|não existe/i)
  })
  it('atrito numa mesa lisa não existe', () => {
    const r = diagrama.corrigir(inst('mesa'), resp('mesa', { atrito: 'esquerda' }))
    expect(r.motivo).toBe('colocou atrito onde não há')
  })
  it('direção errada: atrito a favor do movimento', () => {
    const r = diagrama.corrigir(inst('puxado'), resp('puxado', { atrito: 'direita' }))
    expect(r.motivo).toBe('atrito com direção errada')
    expect(r.feedback).toMatch(/oposto|contra|opõe/i)
  })
  it('normal vertical no plano inclinado', () => {
    const r = diagrama.corrigir(inst('planoParado'), resp('planoParado', { normal: 'cima' }))
    expect(r.motivo).toBe('normal com direção errada')
    expect(r.feedback).toMatch(/perpendicular/i)
  })
  it('traz o gabarito para mostrar', () => {
    const r = diagrama.corrigir(inst('puxado'), resp('puxado', { atrito: 'nenhuma' }))
    expect((r.destaque as { gabarito: RespostaDCL }).gabarito).toEqual(diagrama.gabarito('puxado'))
  })
})

describe('diagrama de corpo livre — geração', () => {
  it('cada nível sorteia cenários coerentes e reproduzíveis', () => {
    const por: Record<number, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set() }
    for (let s = 1; s <= 80; s++) for (const n of [1, 2, 3] as const) por[n]!.add(diagrama.gerar(s, n).cenario)
    expect([...por[1]!].sort()).toEqual(['mesa', 'pendurado', 'subindo'])
    expect([...por[2]!].sort()).toEqual(['planoParado', 'puxado'])
    expect([...por[3]!].sort()).toEqual(['planoDescendo', 'planoPuxado'])
    expect(diagrama.gerar(5, 2)).toEqual(diagrama.gerar(5, 2))
  })
  it('dicas e explicação', () => {
    const i = diagrama.gerar(2, 3)
    expect(diagrama.dicas(i)).toHaveLength(3)
    expect(diagrama.explicar(i).length).toBeGreaterThan(30)
  })
})
