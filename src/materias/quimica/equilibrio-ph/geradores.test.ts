import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { REACOES_EQ, especies, reacaoEq, type Perturbacao } from './calculo'
import { equacaoEq, gerarEquilibrio, gerarFraco, gerarKc, gerarPh, sci } from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 120 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 4409 + n)
const arred = (x: number) => Math.round(x * 1e6) / 1e6

describe('notação científica', () => {
  it('escreve potências de dez legíveis', () => {
    expect(sci(1e-5)).toBe('10⁻⁵')
    expect(sci(2e-4)).toBe('2 × 10⁻⁴')
    expect(sci(1.5e-3)).toBe('1,5 × 10⁻³')
    expect(sci(0.1)).toBe('10⁻¹')
  })
})

describe('Qual é o pH?', () => {
  it('as respostas conferem com logaritmos exatos calculados à parte', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarPh(rng(s, n), n)
        const d = inst.dados!
        let exato: number
        if (d.variante === 'forte') exato = d.base ? 14 - d.k! : d.k!
        else if (d.variante === 'log') {
          const x = d.a! * 10 ** -d.k!
          exato = d.base ? 14 + Math.log10(x) : -Math.log10(x)
        } else if (d.variante === 'diluicao') {
          const [ini, fim] = d.etapas!
          exato = -Math.log10((ini!.c! * ini!.volume!) / fim!.volume!)
        } else {
          const [ac, ba] = d.etapas!
          const molH = (ac!.c! * ac!.volume!) / 1000
          const molOH = (ba!.c! * ba!.volume!) / 1000
          const Vt = (ac!.volume! + ba!.volume!) / 1000
          exato = Math.abs(molH - molOH) < 1e-12 ? 7 : molH > molOH ? -Math.log10((molH - molOH) / Vt) : 14 + Math.log10((molOH - molH) / Vt)
        }
        expect(Math.abs(inst.resposta - exato), `${d.variante} ${inst.enunciado}`).toBeLessThan(0.012)
      }
  })
  it('níveis: 1 forte; 2 com mantissa; 3 diluição ou neutralização', () => {
    expect(new Set(SEMENTES.map((s) => gerarPh(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['forte']))
    expect(new Set(SEMENTES.map((s) => gerarPh(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['log']))
    expect(new Set(SEMENTES.map((s) => gerarPh(rng(s, 3), 3).dados!.variante))).toEqual(new Set(['diluicao', 'neutralizacao']))
  })
  it('bases e ácidos aparecem; o pH de ácido é menor que 7 e o de base é maior', () => {
    let acidos = 0
    let bases = 0
    for (const n of [1, 2] as const)
      for (const s of SEMENTES) {
        const inst = gerarPh(rng(s, n), n)
        if (inst.dados!.base) {
          bases++
          expect(inst.resposta).toBeGreaterThan(7)
        } else {
          acidos++
          expect(inst.resposta).toBeLessThan(7)
        }
      }
    expect(acidos).toBeGreaterThan(40)
    expect(bases).toBeGreaterThan(40)
  })
  it('na neutralização aparecem excessos de ácido, de base e a mistura exata (pH 7)', () => {
    const rs = SEMENTES.map((s) => gerarPh(rng(s, 3), 3)).filter((i) => i.dados!.variante === 'neutralizacao')
    expect(rs.some((i) => i.resposta === 7)).toBe(true)
    expect(rs.some((i) => i.resposta < 7)).toBe(true)
    expect(rs.some((i) => i.resposta > 7)).toBe(true)
  })
  it('erros típicos válidos (≥ 2) e a resposta certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarPh(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(e.valor).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
  })
})

describe('Le Chatelier', () => {
  /** comparação numérica Q × K escrita à parte (concentrações todas iguais a 1, então K = 1) */
  function numerico(id: string, p: Perturbacao): 'direta' | 'inversa' | 'nenhum' {
    const r = reacaoEq(id)
    const todas = especies(r)
    const nr = r.reag.length
    if (p.tipo === 'T') {
      const K2 = Math.exp((-(r.dH * 1000) / 8.314) * (1 / (p.sobe ? 330 : 270) - 1 / 300))
      return K2 > 1 ? 'direta' : 'inversa'
    }
    const fator = (i: number) => {
      const e = todas[i]!
      const ativa = e.fase === 'g' || e.fase === 'aq'
      if (!ativa) return 1
      if (p.tipo === 'add') return i === p.especie ? 2 : 1
      if (p.tipo === 'remove') return i === p.especie ? 0.5 : 1
      if (p.tipo === 'P') return e.fase === 'g' ? (p.aumenta ? 2 : 0.5) : 1
      return 1
    }
    let Q = 1
    todas.forEach((e, i) => {
      if (e.fase === 's' || e.fase === 'l') return
      Q *= fator(i) ** (i < nr ? -e.c : e.c)
    })
    return Math.abs(Q - 1) < 1e-9 ? 'nenhum' : Q < 1 ? 'direta' : 'inversa'
  }
  const ROTULO = { direta: 'Para a direita (favorece os produtos)', inversa: 'Para a esquerda (favorece os reagentes)', nenhum: 'Não há deslocamento' }

  it('a alternativa certa confere com a comparação numérica de Q com K', () => {
    let vistas = 0
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarEquilibrio(rng(s, n), n)
        const d = inst.dados!
        if (d.pergunta !== 'sentido') continue
        vistas++
        expect(inst.opcoes.find((o) => o.id === inst.certa)!.rotulo, `${equacaoEq(reacaoEq(d.reacao))} ${JSON.stringify(d.perturbacao)}`).toBe(ROTULO[numerico(d.reacao, d.perturbacao)])
      }
    expect(vistas).toBeGreaterThan(250)
  })
  it('pergunta sobre Kc: só a temperatura muda a constante, e no sentido do sinal de ΔH', () => {
    let vistas = 0
    for (const s of SEMENTES) {
      const inst = gerarEquilibrio(rng(s, 3), 3)
      const d = inst.dados!
      if (d.pergunta !== 'constante') continue
      vistas++
      const r = reacaoEq(d.reacao)
      const p = d.perturbacao
      const certo = inst.opcoes.find((o) => o.id === inst.certa)!.rotulo
      if (p.tipo === 'T') {
        const K2 = Math.exp((-(r.dH * 1000) / 8.314) * (1 / (p.sobe ? 330 : 270) - 1 / 300))
        expect(certo).toBe(K2 > 1 ? 'Kc aumenta' : 'Kc diminui')
      } else expect(certo).toBe('Kc não se altera')
    }
    expect(vistas).toBeGreaterThan(15)
  })
  it('níveis: concentração; depois T, P e catalisador; depois sólido, gás inerte e constante', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarEquilibrio(rng(s, n), n).dados!.perturbacao.tipo))
    expect([...tipos(1)].sort()).toEqual(['add', 'remove'])
    expect(tipos(2).has('T') && tipos(2).has('P') && tipos(2).has('cat')).toBe(true)
    expect(tipos(3).has('inerte')).toBe(true)
    expect(new Set(SEMENTES.map((s) => gerarEquilibrio(rng(s, 3), 3).dados!.reacao)).has('calcario')).toBe(true)
  })
  it('só se adiciona ou retira espécies gasosas ou dissolvidas, exceto nos casos de sólido do nível 3', () => {
    for (const s of SEMENTES) {
      const d = gerarEquilibrio(rng(s, 1), 1).dados!
      if (d.perturbacao.tipo === 'add' || d.perturbacao.tipo === 'remove') expect(especies(reacaoEq(d.reacao))[d.perturbacao.especie]!.fase).toBe('g')
    }
  })
  it('alternativas distintas, a certa aceita e cada errada com explicação e motivo', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarEquilibrio(rng(s, n), n)
        expect(new Set(inst.opcoes.map((o) => o.rotulo)).size).toBe(3)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]!.length).toBeGreaterThan(40)
          expect(c.motivo).not.toBe('opção errada')
        }
      }
  })
  it('as reações da biblioteca têm ΔH com o sinal esperado', () => {
    expect(REACOES_EQ.find((r) => r.id === 'n2o4')!.dH).toBeGreaterThan(0)
    expect(REACOES_EQ.find((r) => r.id === 'haber')!.dH).toBeLessThan(0)
  })
})

describe('Constante de equilíbrio', () => {
  /** Kc calculado à parte, com Math.pow */
  function kcIndependente(id: string, conc: number[]): number {
    const r = reacaoEq(id)
    const nr = r.reag.length
    let num = 1
    let den = 1
    especies(r).forEach((e, i) => {
      if (e.fase === 's' || e.fase === 'l') return
      if (i < nr) den *= Math.pow(conc[i] as number, e.c)
      else num *= Math.pow(conc[i] as number, e.c)
    })
    return num / den
  }
  it('nível 1: Kc confere com o cálculo independente', () => {
    for (const s of SEMENTES) {
      const inst = gerarKc(rng(s, 1), 1)
      const d = inst.dados!
      expect(inst.resposta).toBeCloseTo(kcIndependente(d.reacao, d.equilibrio as number[]), 9)
    }
  })
  it('nível 2: o balanço de massa da tabela fecha e Kc confere', () => {
    for (const s of SEMENTES) {
      const inst = gerarKc(rng(s, 2), 2)
      const d = inst.dados!
      const r = reacaoEq(d.reacao)
      const nr = r.reag.length
      const eq = d.equilibrio as number[]
      const ini = d.inicial as number[]
      // todos os reagentes consumidos na proporção dos coeficientes, igual ao avanço dos produtos
      const avancos = r.reag.map((e, i) => ((ini[i] as number) - (eq[i] as number)) / e.c)
      const avancosProd = r.prod.map((e, i) => (eq[nr + i] as number) / e.c)
      for (const a of [...avancos, ...avancosProd]) expect(a).toBeCloseTo(avancos[0] as number, 9)
      expect(inst.resposta).toBeCloseTo(kcIndependente(d.reacao, eq), 9)
      expect(avancos[0]).toBeGreaterThan(0)
    }
  })
  it('nível 3: a resposta satisfaz Kc (bisseção independente do avanço)', () => {
    for (const s of SEMENTES) {
      const inst = gerarKc(rng(s, 3), 3)
      const d = inst.dados!
      const a = (d.inicial as number[])[0] as number
      const K = d.K as number
      const hi = d.reacao === 'hi'
      let lo = 0
      let up = a
      for (let i = 0; i < 100; i++) {
        const x = (lo + up) / 2
        const Q = hi ? (2 * x) ** 2 / (a - x) ** 2 : x ** 2 / (a - x) ** 2
        if (Q < K) lo = x
        else up = x
      }
      const x = (lo + up) / 2
      const eq = hi ? [a - x, a - x, 2 * x] : [a - x, a - x, x, x]
      const idx = (d.equilibrio as (number | null)[]).findIndex((v) => v === null)
      expect(inst.resposta).toBeCloseTo(eq[idx] as number, 6)
    }
  })
  it('níveis usam as variantes previstas', () => {
    for (const [n, v] of [[1, 'direto'], [2, 'ice'], [3, 'resolver']] as const) expect(new Set(SEMENTES.map((s) => gerarKc(rng(s, n), n).dados!.variante))).toEqual(new Set([v]))
  })
  it('erros típicos válidos e resposta certa aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarKc(rng(s, n), n)
        expect(inst.erros.length, `${n} ${s}`).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(arred(e.valor)).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(arred(inst.resposta)).replace('.', ',')).correto).toBe(true)
      }
  })
})

describe('Ácido fraco', () => {
  it('as respostas conferem com as relações Ka = [H⁺]²/C', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarFraco(rng(s, n), n)
        const d = inst.dados!
        if (d.variante === 'ph') expect(inst.resposta).toBeCloseTo(-Math.log10(Math.sqrt(d.ka! * d.c)), 6)
        else if (d.variante === 'alfa') expect(inst.resposta).toBeCloseTo((Math.sqrt(d.ka! * d.c) / d.c) * 100, 6)
        else expect(inst.resposta).toBeCloseTo(-Math.log10(10 ** (-2 * d.ph!) / d.c), 6)
      }
  })
  it('o grau de ionização fica abaixo de 6 %, onde a aproximação vale', () => {
    for (const s of SEMENTES) expect(gerarFraco(rng(s, 2), 2).resposta).toBeLessThan(6)
    for (const s of SEMENTES) {
      const d = gerarFraco(rng(s, 1), 1).dados!
      expect(Math.sqrt(d.ka! * d.c) / d.c).toBeLessThan(0.06)
    }
  })
  it('erros típicos válidos e resposta certa aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarFraco(rng(s, n), n)
        expect(inst.erros.length, `${n} ${s}`).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(arred(e.valor)).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(arred(inst.resposta)).replace('.', ',')).correto).toBe(true)
      }
  })
})
