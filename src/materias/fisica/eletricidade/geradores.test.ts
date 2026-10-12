import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { gerarBrilho, gerarConta, gerarCorrente, gerarEquivalente } from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 120 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 4241 + n)
const par = (a: number, b: number) => (a * b) / (a + b)

/** potências de cada lâmpada por fórmulas fechadas (sem usar o resolvedor) */
function potenciasFormulas(topologia: string, rs: number[], V: number): number[] {
  if (topologia === 'serie') {
    const i = V / rs.reduce((s, x) => s + x, 0)
    return rs.map((r) => r * i * i)
  }
  if (topologia === 'paralelo') return rs.map((r) => (V * V) / r)
  // misto: R0 em série com (R1 ‖ R2)
  const [r0, r1, r2] = rs as [number, number, number]
  const rp = par(r1, r2)
  const i = V / (r0 + rp)
  const Vp = i * rp
  return [r0 * i * i, (Vp * Vp) / r1, (Vp * Vp) / r2]
}

describe('Qual lâmpada brilha mais?', () => {
  it('as potências guardadas conferem com fórmulas fechadas', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const d = gerarBrilho(rng(s, n), n).dados!
        const f = potenciasFormulas(d.topologia, d.rs, d.V)
        f.forEach((p, k) => expect(d.antes[k]).toBeCloseTo(p, 9))
      }
    }
  })
  it('perguntas "qual brilha mais": a alternativa certa é a de maior potência', () => {
    let vistas = 0
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarBrilho(rng(s, n), n)
        const d = inst.dados!
        if (d.queimada !== undefined) continue
        vistas++
        const maior = d.antes.indexOf(Math.max(...d.antes))
        const rotuloCerto = inst.opcoes.find((o) => o.id === inst.certa)!.rotulo
        expect(rotuloCerto).toBe(`Lâmpada ${maior + 1}`)
        // a maior é única
        expect(d.antes.filter((p) => Math.abs(p - d.antes[maior]!) < 1e-9)).toHaveLength(1)
      }
    }
    expect(vistas).toBeGreaterThan(150)
  })
  it('perguntas sobre queimar: a resposta bate com o cálculo em fórmulas fechadas', () => {
    let vistas = 0
    for (const n of [2, 3] as const) {
      for (const s of SEMENTES) {
        const inst = gerarBrilho(rng(s, n), n)
        const d = inst.dados!
        if (d.queimada === undefined) continue
        vistas++
        const alvo = Number(/lâmpada (\d)\?/.exec(inst.enunciado)![1]) - 1
        let esperado: string
        if (d.topologia === 'paralelo') esperado = 'Continua com o mesmo brilho'
        else {
          const [r0, r1, r2] = d.rs as [number, number, number]
          const sobra = d.queimada === 1 ? r2 : r1
          const i = d.V / (r0 + sobra)
          const depois = [r0 * i * i, d.queimada === 1 ? 0 : sobra * i * i, d.queimada === 2 ? 0 : sobra * i * i]
          const antes = d.antes[alvo]!
          const novo = depois[alvo]!
          esperado = novo < 1e-9 ? 'Apaga' : Math.abs(novo - antes) < 1e-9 ? 'Continua com o mesmo brilho' : novo > antes ? 'Brilha mais' : 'Brilha menos, mas continua acesa'
        }
        expect(inst.opcoes.find((o) => o.id === inst.certa)!.rotulo).toBe(esperado)
      }
    }
    expect(vistas).toBeGreaterThan(80)
  })
  it('toda alternativa errada tem explicação e motivo, e a certa é aceita', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarBrilho(rng(s, n), n)
        expect(new Set(inst.opcoes.map((o) => o.rotulo)).size).toBe(inst.opcoes.length)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]!.length).toBeGreaterThan(30)
          expect(c.motivo).not.toBe('opção errada')
        }
      }
    }
  })
  it('o nível 3 mostra tanto "qual brilha mais" quanto "queima uma lâmpada"', () => {
    const tipos = new Set(SEMENTES.map((s) => (gerarBrilho(rng(s, 3), 3).dados!.queimada === undefined ? 'qual' : 'queima')))
    expect(tipos.size).toBe(2)
  })
})

describe('Resistência equivalente', () => {
  function formula(d: { topologia: string; rs: number[] }) {
    const [a, b, c] = d.rs as [number, number, number]
    if (d.topologia === 'serie') return d.rs.reduce((s, x) => s + x, 0)
    if (d.topologia === 'paralelo') return 1 / d.rs.reduce((s, x) => s + 1 / x, 0)
    if (d.topologia === 'misto') return a + par(b, c)
    return par(a, b + c)
  }
  it('a resposta confere com fórmulas fechadas', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) {
      const inst = gerarEquivalente(rng(s, n), n)
      expect(inst.resposta).toBeCloseTo(formula(inst.dados!), 9)
    }
  })
  it('as respostas são "redondas" (1 casa decimal) e os erros típicos nunca coincidem', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) {
      const inst = gerarEquivalente(rng(s, n), n)
      expect(Math.abs(inst.resposta * 10 - Math.round(inst.resposta * 10))).toBeLessThan(1e-6)
      expect(inst.erros.length).toBeGreaterThanOrEqual(2)
      for (const e of inst.erros) expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
      expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
    }
  })
  it('em paralelo a equivalente é menor que a menor; em série é maior que a maior', () => {
    for (const s of SEMENTES) {
      const p = gerarEquivalente(rng(s, 2), 2)
      const d = p.dados!
      if (d.topologia === 'paralelo') expect(p.resposta).toBeLessThan(Math.min(...d.rs))
      if (d.topologia === 'serie') expect(p.resposta).toBeGreaterThan(Math.max(...d.rs))
    }
  })
  it('os níveis usam as topologias previstas', () => {
    const por: Record<number, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set() }
    for (const n of NIVEIS) for (const s of SEMENTES) por[n]!.add(gerarEquivalente(rng(s, n), n).dados!.topologia)
    expect([...por[1]!].sort()).toEqual(['paralelo', 'serie'])
    expect([...por[3]!].sort()).toEqual(['misto', 'misto2'])
  })
})

describe('Corrente e ddp', () => {
  it('nível 1 usa a lei de Ohm com conversão de unidades', () => {
    for (const s of SEMENTES) {
      const inst = gerarCorrente(rng(s, 1), 1)
      const d = inst.dados!
      if (d.pede === 'i-mA') expect(inst.resposta).toBeCloseTo((d.V! / d.rs[0]!) * 1000, 9)
      else {
        // R em kΩ: a corrente correspondente (V/R) em mA é um número simples
        expect(inst.resposta).toBeCloseTo(d.rs[0]! / 1000, 9)
        const iMa = d.V! / inst.resposta
        expect(Math.abs(iMa - Math.round(iMa))).toBeLessThan(1e-9)
      }
    }
  })
  it('nível 2: série dá a corrente total; paralelo, a do ramo (fórmulas fechadas)', () => {
    for (const s of SEMENTES) {
      const inst = gerarCorrente(rng(s, 2), 2)
      const d = inst.dados!
      const [a, b] = d.rs as [number, number]
      if (d.topologia === 'serie') {
        expect(d.pede).toBe('i-total')
        expect(inst.resposta).toBeCloseTo(d.V! / (a + b), 9)
      } else {
        expect(d.pede).toBe('i-ramo')
        expect(inst.resposta).toBeCloseTo(d.V! / d.rs[d.alvo!]!, 9)
      }
    }
  })
  it('nível 3: leis dos nós e das malhas no circuito misto', () => {
    for (const s of SEMENTES) {
      const inst = gerarCorrente(rng(s, 3), 3)
      const d = inst.dados!
      const [a, b, c] = d.rs as [number, number, number]
      const V = d.V!
      let Vs: number[]
      let is: number[]
      if (d.topologia === 'misto') {
        const rp = par(b, c)
        const iT = V / (a + rp)
        const Vp = iT * rp
        Vs = [iT * a, Vp, Vp]
        is = [iT, Vp / b, Vp / c]
      } else {
        // a ‖ (b + c)
        const iRamo = V / (b + c)
        Vs = [V, iRamo * b, iRamo * c]
        is = [V / a, iRamo, iRamo]
      }
      expect(inst.resposta).toBeCloseTo(d.pede === 'V-resistor' ? Vs[d.alvo!]! : is[d.alvo!]!, 9)
    }
  })
  it('erros típicos válidos e resposta certa aceita', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) {
      const inst = gerarCorrente(rng(s, n), n)
      expect(inst.erros.length).toBeGreaterThanOrEqual(2)
      for (const e of inst.erros) expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
      expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
    }
  })
})

describe('Conta de luz', () => {
  it('as respostas conferem com cálculo direto (em Wh, depois dividido por 1000)', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) {
      const inst = gerarConta(rng(s, n), n)
      const d = inst.dados!
      const wh = (a: { W: number; h: number }) => a.W * a.h * d.dias
      if (d.variante === 'kwh') expect(inst.resposta).toBeCloseTo(wh(d.aparelhos[0]!) / 1000, 9)
      else if (d.variante === 'custo') expect(inst.resposta).toBeCloseTo((d.aparelhos.reduce((x, a) => x + wh(a), 0) / 1000) * d.tarifa!, 9)
      else if (d.variante === 'economia') expect(inst.resposta).toBeCloseTo(((wh(d.aparelhos[0]!) - wh(d.aparelhos[1]!)) / 1000) * d.tarifa!, 9)
      else if (d.variante === 'chuveiro-P') expect(inst.resposta).toBeCloseTo(d.aparelhos[0]!.W / 4, 9)
      else expect(inst.resposta).toBeCloseTo(220 ** 2 / d.aparelhos[0]!.W, 9)
    }
  })
  it('os erros típicos nunca coincidem e há pelo menos dois', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) {
      const inst = gerarConta(rng(s, n), n)
      expect(inst.erros.length).toBeGreaterThanOrEqual(2)
      for (const e of inst.erros) expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
      expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
    }
  })
  it('o nível 3 cobre as três variantes', () => {
    const v = new Set(SEMENTES.map((s) => gerarConta(rng(s, 3), 3).dados!.variante))
    expect([...v].sort()).toEqual(['chuveiro-P', 'chuveiro-R', 'economia'])
  })
})
