import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { massaMolar } from '../comum/elementos'
import { curva } from './calculo'
import { gerarConcentracao, gerarCristal, gerarDiluicao, gerarSolubilidade } from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 120 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 6151 + n)

/** interpolação escrita à parte, pelos pontos da tabela */
function sol(id: string, T: number): number {
  const p = curva(id).pontos
  for (let i = 0; i < p.length - 1; i++) {
    const [t0, s0] = p[i] as [number, number]
    const [t1, s1] = p[i + 1] as [number, number]
    if (T >= t0 && T <= t1) return s0 + ((T - t0) / (t1 - t0)) * (s1 - s0)
  }
  throw new Error('fora da tabela')
}

const numeros = (txt: string) => [...txt.replace(/(\d)\.(\d{3})/g, '$1$2').matchAll(/(\d+(?:,\d+)?)/g)].map((m) => Number((m[1] as string).replace(',', '.')))

describe('Concentração', () => {
  it('as respostas conferem com o caminho inverso (massa = concentração × volume)', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarConcentracao(rng(s, n), n)
        const d = inst.dados!
        if (d.variante === 'gL') expect(inst.resposta * (d.volumeMl / 1000)).toBeCloseTo(d.massa, 9)
        else if (d.variante === 'molL') expect(inst.resposta * (d.volumeMl / 1000) * massaMolar(d.substancia!)).toBeCloseTo(d.massa, 9)
        else if (d.variante === 'ppm') expect(inst.resposta * (d.volumeMl / 1000)).toBeCloseTo(d.massa, 9)
        else {
          // 1 L de solução: massa total 1000·d g, soluto τ %: mols = massa de soluto / MM
          const massaSoluto = (1000 * d.densidade! * d.titulo!) / 100
          expect(inst.resposta).toBeCloseTo(massaSoluto / massaMolar(d.substancia!), 9)
        }
      }
  })
  it('cada nível usa as variantes previstas', () => {
    expect(new Set(SEMENTES.map((s) => gerarConcentracao(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['gL']))
    expect(new Set(SEMENTES.map((s) => gerarConcentracao(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['molL', 'ppm']))
    expect(new Set(SEMENTES.map((s) => gerarConcentracao(rng(s, 3), 3).dados!.variante))).toEqual(new Set(['titulo']))
  })
  it('números simples e dados "bonitos"', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarConcentracao(rng(s, n), n)
        expect(Math.abs(inst.resposta * 100 - Math.round(inst.resposta * 100))).toBeLessThan(1e-6)
        if (n < 3) expect(Math.abs(inst.dados!.massa * 100 - Math.round(inst.dados!.massa * 100))).toBeLessThan(1e-6)
      }
  })
  it('erros típicos válidos e a resposta certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarConcentracao(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(e.valor).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
  })
})

describe('Diluição e mistura', () => {
  it('a quantidade de soluto (mols) se conserva em todos os casos', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarDiluicao(rng(s, n), n)
        const d = inst.dados!
        const e = d.etapas
        const mol = (i: number) => ((e[i]!.c as number) * (e[i]!.volume as number)) / 1000
        if (d.variante === 'c2') expect(inst.resposta * (e[1]!.volume as number) / 1000).toBeCloseTo(mol(0), 9)
        else if (d.variante === 'agua') expect((e[1]!.c as number) * ((e[0]!.volume as number) + inst.resposta) / 1000).toBeCloseTo(mol(0), 9)
        else if (d.variante === 'v2') expect((e[1]!.c as number) * inst.resposta / 1000).toBeCloseTo(mol(0), 9)
        else if (d.variante === 'mistura') expect((inst.resposta * (e[2]!.volume as number)) / 1000).toBeCloseTo(mol(0) + mol(1), 9)
        else if (d.variante === 'evaporar') expect((inst.resposta * (e[1]!.volume as number)) / 1000).toBeCloseTo(mol(0), 9)
        else expect((inst.resposta * (e[2]!.volume as number)) / 1000).toBeCloseTo(mol(0) + mol(1), 9)
      }
  })
  it('o enunciado traz os mesmos números que os dados', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarDiluicao(rng(s, n), n)
        const nums = numeros(inst.enunciado)
        for (const et of inst.dados!.etapas) {
          if (et.c !== null && inst.dados!.variante !== 'agua' && inst.dados!.variante !== 'v2') expect(nums, `${et.rotulo} c`).toContain(et.c)
        }
      }
  })
  it('níveis: 1 = diluição simples; 2 = mistura; 3 = evaporar ou mistura + água', () => {
    expect(new Set(SEMENTES.map((s) => gerarDiluicao(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['mistura']))
    expect(new Set(SEMENTES.map((s) => gerarDiluicao(rng(s, 3), 3).dados!.variante))).toEqual(new Set(['evaporar', 'dupla']))
    expect(new Set(SEMENTES.map((s) => gerarDiluicao(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['c2', 'agua', 'v2']))
  })
  it('no nível 2 os volumes são diferentes, então a média simples é um erro de verdade', () => {
    for (const s of SEMENTES) {
      const inst = gerarDiluicao(rng(s, 2), 2)
      const [a, b] = inst.dados!.etapas
      expect(a!.volume).not.toBe(b!.volume)
      expect(inst.erros.some((e) => e.motivo === 'média simples das concentrações')).toBe(true)
    }
  })
  it('erros típicos válidos e a resposta certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarDiluicao(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(e.valor).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
        expect(Math.abs(inst.resposta * 100 - Math.round(inst.resposta * 100))).toBeLessThan(1e-6)
      }
  })
})

describe('Classificar a solução', () => {
  const rotuloCerto = (inst: ReturnType<typeof gerarSolubilidade>) => inst.opcoes.find((o) => o.id === inst.certa)!.rotulo
  it('mistura: a classificação confere com a comparação massa de sal × capacidade', () => {
    let vistas = 0
    for (const n of [1, 2] as const)
      for (const s of SEMENTES) {
        const inst = gerarSolubilidade(rng(s, n), n)
        const d = inst.dados!
        if (d.sal === undefined) continue
        vistas++
        const cap = (sol(d.curva, d.T1) * d.agua!) / 100
        const esperado = Math.abs(d.sal - cap) < 1e-9 ? 'Saturada, sem sal no fundo' : d.sal < cap ? 'Insaturada, sem sal no fundo' : 'Saturada, com sal no fundo'
        expect(rotuloCerto(inst)).toBe(esperado)
      }
    expect(vistas).toBeGreaterThan(150)
  })
  it('mudança de temperatura: o sentido da curva decide', () => {
    let vistas = 0
    for (const n of [2, 3] as const)
      for (const s of SEMENTES) {
        const inst = gerarSolubilidade(rng(s, n), n)
        const d = inst.dados!
        if (d.T2 === undefined || /cristal de/.test(inst.enunciado) || /nenhum sólido aparece/.test(inst.enunciado)) continue
        vistas++
        const sobe = sol(d.curva, d.T2) > sol(d.curva, d.T1)
        expect(rotuloCerto(inst)).toBe(sobe ? 'Insaturada, sem sal no fundo' : 'Saturada, com sal no fundo')
      }
    expect(vistas).toBeGreaterThan(60)
  })
  it('supersaturada: só quando a saturada muda de temperatura sem cristalizar', () => {
    let vistas = 0
    let cristais = 0
    for (const s of SEMENTES) {
      const inst = gerarSolubilidade(rng(s, 3), 3)
      const d = inst.dados!
      if (/nenhum sólido aparece/.test(inst.enunciado)) {
        vistas++
        expect(rotuloCerto(inst)).toBe('Supersaturada (instável)')
        // a curva realmente deixa a água com menos capacidade na temperatura final
        expect(sol(d.curva, d.T2!)).toBeLessThan(sol(d.curva, d.T1))
      }
      if (/cristal de/.test(inst.enunciado)) {
        cristais++
        const excesso = ((sol(d.curva, d.T1) - sol(d.curva, d.T2!)) * d.agua!) / 100
        expect(inst.opcoes.find((o) => o.id === inst.certa)!.rotulo).toContain(String(excesso).replace('.', ','))
      }
    }
    expect(vistas).toBeGreaterThan(15)
    expect(cristais).toBeGreaterThan(15)
  })
  it('toda alternativa errada tem explicação e motivo; a certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarSolubilidade(rng(s, n), n)
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
  })
  it('as massas do enunciado são as dos dados', () => {
    for (const s of SEMENTES) {
      const inst = gerarSolubilidade(rng(s, 1), 1)
      const nums = numeros(inst.enunciado)
      expect(nums).toContain(inst.dados!.sal)
      expect(nums).toContain(inst.dados!.agua)
    }
  })
})

describe('Quanto cristaliza', () => {
  /** balanço de massa escrito à parte: sal que cabe antes − sal que cabe depois */
  function esperado(d: NonNullable<ReturnType<typeof gerarCristal>['dados']>): number {
    const cap = (T: number, agua: number) => (sol(d.curva, T) * agua) / 100
    if (d.variante === 'resfriar' || d.variante === 'aquecer' || d.variante === 'solucao') return cap(d.T1, d.agua) - cap(d.T2!, d.agua)
    if (d.variante === 'evaporar') return cap(d.T1, d.evaporada!)
    return cap(d.T1, d.agua) - cap(d.T2!, d.agua - d.evaporada!)
  }
  it('as respostas conferem com o balanço de sal dissolvido', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarCristal(rng(s, n), n)
        expect(inst.resposta).toBeCloseTo(esperado(inst.dados!), 9)
        expect(inst.resposta).toBeGreaterThan(0)
      }
  })
  it('a massa da solução saturada confere (nível 2)', () => {
    let vistas = 0
    for (const s of SEMENTES) {
      const d = gerarCristal(rng(s, 2), 2).dados!
      if (d.variante !== 'solucao') continue
      vistas++
      expect(d.massaSolucao).toBeCloseTo(d.agua + (sol(d.curva, d.T1) * d.agua) / 100, 9)
    }
    expect(vistas).toBeGreaterThan(30)
  })
  it('níveis usam as variantes previstas; o sal C só aparece aquecendo', () => {
    expect(new Set(SEMENTES.map((s) => gerarCristal(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['resfriar', 'aquecer']))
    expect(new Set(SEMENTES.map((s) => gerarCristal(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['solucao', 'evaporar']))
    expect(new Set(SEMENTES.map((s) => gerarCristal(rng(s, 3), 3).dados!.variante))).toEqual(new Set(['resfriar-evaporar']))
    for (const s of SEMENTES) {
      const d = gerarCristal(rng(s, 1), 1).dados!
      expect(d.curva === 'C').toBe(d.variante === 'aquecer')
    }
  })
  it('erros típicos válidos e a resposta certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarCristal(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(e.valor).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
        expect(Math.abs(inst.resposta * 10 - Math.round(inst.resposta * 10))).toBeLessThan(1e-6)
      }
  })
})
