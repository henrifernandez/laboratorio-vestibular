import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { massaMolar } from '../comum/elementos'
import { coefDe, formulaDe, reacao } from './calculo'
import { desafioBalancear, gerarLimitante, gerarMassa, gerarSobra } from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 120 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 7919 + n)

/** simula a reação passo a passo (frações de equação) até algum reagente acabar */
function simular(coefs: number[], mols: number[]) {
  const passo = 1 / 64
  const restante = [...mols]
  let avancos = 0
  for (;;) {
    if (restante.some((n, i) => n - (coefs[i] as number) * passo < -1e-9)) break
    restante.forEach((n, i) => (restante[i] = n - (coefs[i] as number) * passo))
    avancos += passo
  }
  return { avancos, restante }
}

describe('Balancear: correção', () => {
  const inst = (id: string) => ({ reacaoId: id, nivel: 1 as const })
  it('aceita os coeficientes certos', () => {
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const i = desafioBalancear.gerar(s, nivel)
        expect(desafioBalancear.corrigir(i, reacao(i.reacaoId).coefs).correto).toBe(true)
      }
  })
  it('sorteia reações diferentes e cobre o pool de cada nível', () => {
    for (const nivel of NIVEIS) {
      const ids = new Set(SEMENTES.map((s) => desafioBalancear.gerar(s, nivel).reacaoId))
      expect(ids.size).toBeGreaterThanOrEqual(8)
    }
  })
  it('equação balanceada mas não simplificada não conta como certa', () => {
    const c = desafioBalancear.corrigir(inst('amonia'), [2, 6, 4])
    expect(c.correto).toBe(false)
    expect(c.parcial).toBeGreaterThan(0.5)
    expect(c.feedback).toMatch(/dividir|divida/i)
  })
  it('aponta o elemento que não confere', () => {
    const c = desafioBalancear.corrigir(inst('agua'), [1, 1, 1])
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/O \(/)
    expect(c.motivo).toContain('O')
    expect(c.motivo).not.toContain('H')
  })
  it('tudo 1 recebe orientação própria', () => {
    expect(desafioBalancear.corrigir(inst('metano'), [1, 1, 1, 1]).feedback).toMatch(/valem 1/)
  })
  it('coeficientes inválidos são recusados', () => {
    expect(desafioBalancear.corrigir(inst('agua'), [0, 1, 2]).correto).toBe(false)
    expect(desafioBalancear.corrigir(inst('agua'), [1.5, 1, 2]).correto).toBe(false)
  })
  it('cada dica e a explicação existem', () => {
    const i = desafioBalancear.gerar(3, 3)
    expect(desafioBalancear.dicas(i)).toHaveLength(3)
    expect(desafioBalancear.explicar(i)).toContain('→')
  })
})

describe('Massa de produto', () => {
  it('a resposta confere com o cálculo pela razão de massas', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarMassa(rng(s, n), n)
        const d = inst.dados!
        const r = reacao(d.reacaoId)
        const mmDe = massaMolar(formulaDe(r, d.de))
        const mmPara = massaMolar(formulaDe(r, d.para))
        const razao = (coefDe(r, d.para) * mmPara) / (coefDe(r, d.de) * mmDe)
        if (d.variante === 'mol') expect(inst.resposta).toBeCloseTo(d.dado * (coefDe(r, d.para) / coefDe(r, d.de)), 9)
        else if (d.variante === 'massa') expect(inst.resposta).toBeCloseTo(d.dado * razao, 9)
        else if (d.variante === 'rendimento') expect(inst.resposta).toBeCloseTo(d.dado * razao * (d.percentual! / 100), 9)
        else expect(inst.resposta).toBeCloseTo(d.dado * (d.percentual! / 100) * razao, 9)
      }
  })
  it('o nível 3 alterna rendimento e pureza; o nível 1 usa mols e o 2, gramas', () => {
    const v3 = new Set(SEMENTES.map((s) => gerarMassa(rng(s, 3), 3).dados!.variante))
    expect([...v3].sort()).toEqual(['pureza', 'rendimento'])
    expect(new Set(SEMENTES.map((s) => gerarMassa(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['mol']))
    expect(new Set(SEMENTES.map((s) => gerarMassa(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['massa']))
  })
  it('números "bonitos": uma casa decimal no máximo', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarMassa(rng(s, n), n)
        expect(Math.abs(inst.resposta * 10 - Math.round(inst.resposta * 10))).toBeLessThan(1e-6)
        expect(Math.abs(inst.dados!.dado * 10 - Math.round(inst.dados!.dado * 10))).toBeLessThan(1e-6)
      }
  })
  it('erros típicos válidos (≥ 2) e a resposta certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarMassa(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(e.valor)).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
  })
})

describe('Reagente limitante', () => {
  it('o limitante bate com a simulação passo a passo', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarLimitante(rng(s, n), n)
        const d = inst.dados!
        const r = reacao(d.reacaoId)
        const sim = simular(r.coefs, d.mols)
        const zerados = sim.restante.slice(0, 2).map((x) => x < 1e-6)
        const esperado = zerados[0] && zerados[1] ? 'nenhum' : zerados[0] ? '0' : '1'
        expect(inst.certa).toBe(esperado)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
      }
  })
  it('as massas do enunciado correspondem aos mols guardados', () => {
    for (const n of [2, 3] as const)
      for (const s of SEMENTES) {
        const d = gerarLimitante(rng(s, n), n).dados!
        const r = reacao(d.reacaoId)
        d.massas!.forEach((m, i) => expect(m / massaMolar(formulaDe(r, i))).toBeCloseTo(d.mols[i]!, 9))
      }
  })
  it('níveis 2 e 3 têm a armadilha: o limitante é o de maior massa (exceto proporção exata)', () => {
    let vistas = 0
    for (const n of [2, 3] as const)
      for (const s of SEMENTES) {
        const d = gerarLimitante(rng(s, n), n).dados!
        if (d.limitante === -1) continue
        vistas++
        const maior = d.massas![0]! > d.massas![1]! ? 0 : 1
        expect(maior).toBe(d.limitante)
      }
    expect(vistas).toBeGreaterThan(150)
  })
  it('proporção exata aparece de vez em quando, mas não domina', () => {
    const certas = SEMENTES.map((s) => gerarLimitante(rng(s, 2), 2).certa)
    expect(certas).toContain('nenhum')
    expect(certas.filter((c) => c === 'nenhum').length).toBeLessThan(40)
  })
  it('toda alternativa errada tem explicação e motivo próprios', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarLimitante(rng(s, n), n)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]!.length).toBeGreaterThan(30)
          expect(c.motivo).not.toBe('opção errada')
        }
      }
  })
})

describe('Quanto se forma e quanto sobra', () => {
  it('as respostas conferem com a simulação passo a passo', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarSobra(rng(s, n), n)
        const d = inst.dados!
        const r = reacao(d.reacaoId)
        const sim = simular(r.coefs, d.mols)
        if (d.variante === 'sobra-mol') expect(inst.resposta).toBeCloseTo(sim.restante[d.alvo!]!, 9)
        else if (d.variante === 'sobra-g') expect(inst.resposta).toBeCloseTo(sim.restante[d.alvo!]! * massaMolar(formulaDe(r, d.alvo!)), 9)
        else {
          const k = d.produto!
          const bruto = sim.avancos * coefDe(r, k)
          if (d.variante === 'produto-mol') expect(inst.resposta).toBeCloseTo(bruto, 9)
          else {
            const g = bruto * massaMolar(formulaDe(r, k))
            const rend = /rendimento de (\d+) %/.exec(inst.enunciado)
            expect(inst.resposta).toBeCloseTo(rend ? (g * Number(rend[1])) / 100 : g, 9)
          }
        }
      }
  })
  it('níveis: 1 em mols; 2 em gramas; 3 com rendimento em parte dos casos', () => {
    expect(new Set(SEMENTES.map((s) => gerarSobra(rng(s, 1), 1).unidade))).toEqual(new Set(['mol']))
    expect(new Set(SEMENTES.map((s) => gerarSobra(rng(s, 2), 2).unidade))).toEqual(new Set(['g']))
    const comRend = SEMENTES.filter((s) => /rendimento/.test(gerarSobra(rng(s, 3), 3).enunciado)).length
    expect(comRend).toBeGreaterThan(5)
  })
  it('erros típicos válidos e a resposta certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarSobra(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(e.valor)).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
  })
  it('as respostas são números simples (uma casa decimal)', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarSobra(rng(s, n), n)
        expect(Math.abs(inst.resposta * 10 - Math.round(inst.resposta * 10))).toBeLessThan(1e-6)
      }
  })
})
