import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { gerarAtrito, gerarDeslizar, gerarSistema, vereditoPlano } from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 150 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 7919 + n)

/** Decomposição vetorial "à mão": gravidade projetada no sistema (descida, normal) sem usar sen/cos da fórmula. */
function projecoes(m: number, angulo: number) {
  const a = (angulo * Math.PI) / 180
  const peso: [number, number] = [0, -m * 10]
  const descida: [number, number] = [Math.cos(a), -Math.sin(a)]
  const normal: [number, number] = [Math.sin(a), Math.cos(a)]
  const dot = (u: [number, number], v: [number, number]) => u[0] * v[0] + u[1] * v[1]
  return { paralela: dot(peso, descida), N: -dot(peso, normal) }
}

describe('Vai deslizar?', () => {
  it('o veredito bate com o cálculo vetorial independente (e não depende da massa)', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarDeslizar(rng(s, n), n)
        const d = inst.dados!
        const { paralela, N } = projecoes(d.m, d.angulo)
        const esperado = Math.abs(paralela - d.mu * N) < 1e-6 ? 'iminencia' : paralela > d.mu * N ? 'desliza' : 'parado'
        expect(d.veredito).toBe(esperado)
        // massa diferente, mesmo veredito
        const outra = projecoes(d.m * 7, d.angulo)
        const esp2 = Math.abs(outra.paralela - d.mu * outra.N) < 1e-6 ? 'iminencia' : outra.paralela > d.mu * outra.N ? 'desliza' : 'parado'
        expect(esp2).toBe(esperado)
        expect(vereditoPlano(d.angulo, d.mu)).toBe(esperado)
      }
    }
  })

  it('a alternativa certa corresponde ao veredito e as erradas são explicadas', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarDeslizar(rng(s, n), n)
        expect(inst.opcoes).toHaveLength(4)
        const rotulos = inst.opcoes.map((o) => o.rotulo)
        expect(new Set(rotulos).size).toBe(4)
        const certaRotulo = inst.opcoes.find((o) => o.id === inst.certa)!.rotulo
        const d = inst.dados!
        const fragmento = d.veredito === 'desliza' ? 'Desliza' : d.veredito === 'parado' ? 'com folga' : 'no limite'
        expect(certaRotulo).toContain(fragmento)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]).toBeTruthy()
          expect(c.motivo).not.toBe('opção errada')
        }
      }
    }
  })

  it('o nível 3 inclui a iminência e casos muito próximos', () => {
    const tipos = new Set(SEMENTES.map((s) => gerarDeslizar(rng(s, 3), 3).dados!.veredito))
    expect(tipos.has('iminencia')).toBe(true)
    expect(tipos.has('desliza')).toBe(true)
    expect(tipos.has('parado')).toBe(true)
  })

  it('o nível 1 mostra os dois resultados e o nível 2 usa a rampa em metros', () => {
    const v1 = new Set(SEMENTES.map((s) => gerarDeslizar(rng(s, 1), 1).dados!.veredito))
    expect(v1.has('parado') && v1.has('desliza')).toBe(true)
    expect(gerarDeslizar(rng(3, 2), 2).dados!.rampa).toBeDefined()
  })

  it('é reproduzível pela semente', () => {
    expect(gerarDeslizar(rng(5, 2), 2)).toEqual(gerarDeslizar(rng(5, 2), 2))
  })
})

describe('Força de atrito', () => {
  /** resolve o caso com casos explícitos, sem as funções do cálculo */
  function esperado(d: NonNullable<ReturnType<typeof gerarAtrito>['dados']>): number {
    const m = d.m
    if (d.caso === 'horizontalParado') return d.F as number
    if (d.caso === 'horizontalDesliza') return d.mu * m * 10
    const sen = d.sen ?? Math.sin(((d.angulo as number) * Math.PI) / 180)
    const cos = d.cos ?? Math.cos(((d.angulo as number) * Math.PI) / 180)
    if (d.caso === 'planoParado') return m * 10 * sen
    if (d.caso === 'planoDesliza') return d.mu * m * 10 * cos
    return Math.abs(m * 10 * sen - (d.F as number))
  }
  it('a resposta confere com a solução por casos', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarAtrito(rng(s, n), n)
        expect(inst.resposta).toBeCloseTo(esperado(inst.dados!), 6)
      }
    }
  })
  it('o estado de movimento descrito é coerente com os números', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const d = gerarAtrito(rng(s, n), n).dados!
        const N = d.caso.startsWith('horizontal') ? d.m * 10 : d.m * 10 * (d.cos ?? Math.cos(((d.angulo as number) * Math.PI) / 180))
        const max = d.mu * N
        if (d.caso === 'horizontalParado') expect(d.F!).toBeLessThan(max)
        if (d.caso === 'horizontalDesliza') expect(d.F!).toBeGreaterThan(max)
        const sen = d.sen ?? (d.angulo !== undefined ? Math.sin((d.angulo * Math.PI) / 180) : 0)
        if (d.caso === 'planoParado') expect(d.m * 10 * sen).toBeLessThan(max)
        if (d.caso === 'planoDesliza') expect(d.m * 10 * sen).toBeGreaterThan(max)
        if (d.caso === 'planoPuxado') expect(Math.abs(d.m * 10 * sen - d.F!)).toBeLessThanOrEqual(max)
      }
    }
  })
  it('os erros típicos nunca coincidem com a resposta certa e são sempre positivos (ou zero)', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarAtrito(rng(s, n), n)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(e.valor).toBeGreaterThanOrEqual(0)
          expect(e.frase.length).toBeGreaterThan(20)
          // digitar o erro típico devolve exatamente a frase dele
          const c = corrigirNum(inst, String(e.valor).replace('.', ','))
          expect(c.correto).toBe(false)
          expect(c.feedback).toBe(inst.erros.find((x) => Math.abs(x.valor - e.valor) <= inst.tolerancia)!.frase)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
    }
  })
  it('cobre os cinco casos e o erro clássico "parado ⇒ μ·N" aparece', () => {
    const casos = new Set<string>()
    let classico = 0
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarAtrito(rng(s, n), n)
        casos.add(inst.dados!.caso)
        if (inst.dados!.caso === 'planoParado' && inst.erros.some((e) => e.motivo === 'usou μ·N com o bloco parado')) classico++
      }
    }
    expect([...casos].sort()).toEqual(['horizontalDesliza', 'horizontalParado', 'planoDesliza', 'planoParado', 'planoPuxado'])
    expect(classico).toBeGreaterThan(0)
  })
})

describe('Aceleração do sistema', () => {
  /** sistema linear 2×2 por Cramer: m_i·a = F_i ∓ T */
  function resolver(d: { tipo: 'atwood' | 'mesa'; m1: number; m2: number; mu: number }) {
    // incógnitas (a, T). Atwood: m1 a + T = m1 g ; m2 a − T = −m2 g. Mesa: m2 a + T = m2 g ; m1 a − T = −μ m1 g
    const [A, B] = d.tipo === 'atwood' ? [d.m1, d.m2] : [d.m2, d.m1]
    const c1 = d.tipo === 'atwood' ? d.m1 * 10 : d.m2 * 10
    const c2 = d.tipo === 'atwood' ? -d.m2 * 10 : -d.mu * d.m1 * 10
    // [A 1][a]   [c1]
    // [B -1][T] = [c2]
    const det = A * -1 - 1 * B
    const a = (c1 * -1 - 1 * c2) / det
    const T = (A * c2 - B * c1) / det
    return { a, T }
  }
  it('a resposta confere com a solução do sistema linear', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarSistema(rng(s, n), n)
        const d = inst.dados!
        const r = resolver(d)
        expect(inst.resposta).toBeCloseTo(d.pede === 'a' ? r.a : r.T, 6)
        expect(r.a).toBeGreaterThan(0)
      }
    }
  })
  it('as respostas têm no máximo uma casa decimal (dá para fazer à mão)', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const { resposta } = gerarSistema(rng(s, n), n)
        expect(Math.abs(resposta * 10 - Math.round(resposta * 10))).toBeLessThan(1e-9)
      }
    }
  })
  it('os níveis cobrem Atwood, mesa lisa e mesa com atrito, perguntando a e T', () => {
    const vistos = new Set<string>()
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const d = gerarSistema(rng(s, n), n).dados!
        vistos.add(`${n}:${d.tipo}:${d.mu === 0 ? 'lisa' : 'atrito'}:${d.pede}`)
      }
    }
    expect(vistos.has('1:atwood:lisa:a')).toBe(true)
    expect(vistos.has('2:atwood:lisa:T')).toBe(true)
    expect(vistos.has('2:mesa:lisa:a')).toBe(true)
    expect(vistos.has('3:mesa:atrito:a')).toBe(true)
    expect(vistos.has('3:mesa:atrito:T')).toBe(true)
    expect([...vistos].some((v) => v.startsWith('1:') && v.endsWith(':T'))).toBe(false)
  })
  it('erros típicos diferentes da resposta, com explicação; a resposta certa é aceita', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarSistema(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(e.frase.length).toBeGreaterThan(20)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
        expect(inst.dicas).toHaveLength(3)
      }
    }
  })
  it('com atrito, o sistema sempre se move (o atrito não segura)', () => {
    for (const s of SEMENTES) {
      const d = gerarSistema(rng(s, 3), 3).dados!
      expect(d.m2 * 10).toBeGreaterThan(d.mu * d.m1 * 10)
    }
  })
})
