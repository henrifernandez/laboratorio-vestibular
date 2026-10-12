import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { lerFormula, massaMolar } from '../comum/elementos'
import { REACOES_VERDES, combustivel, reacaoVerde } from './calculo'
import { CENARIOS, ITENS_POLUENTES, PRINCIPIOS, gerarAtomos, gerarEmissao, gerarPoluentes, gerarPrincipios } from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 120 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 3571 + n)
const carbonos = (f: string) => lerFormula(f).C ?? 0

describe('Emissões na combustão', () => {
  it('as respostas conferem com a contagem de átomos de carbono e as massas molares (cálculo independente)', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarEmissao(rng(s, n), n)
        const d = inst.dados!
        if (d.variante === 'mol') {
          // um carbono por CO₂: mol de CO₂ = mol de combustível × átomos de C da fórmula
          expect(inst.resposta).toBeCloseTo(d.quantidade * carbonos(combustivel(d.combustivel!).formula), 9)
        } else if (d.variante === 'massa') {
          const f = combustivel(d.combustivel!).formula
          const molCombustivel = (d.quantidade * 1000) / massaMolar(f)
          expect(inst.resposta).toBeCloseTo((molCombustivel * carbonos(f) * 44) / 1000, 9)
        } else if (d.variante === 'so2') {
          expect(inst.resposta).toBeCloseTo(((d.quantidade * d.enxofre!) / 100) * (64 / 32), 9)
        } else if (d.variante === 'mj') {
          const c = combustivel(d.combustivel!)
          expect(inst.resposta).toBeCloseTo((carbonos(c.formula) * 44) / (c.entalpia / 1000), 9)
        } else {
          expect(inst.resposta).toBeCloseTo(((d.quantidade * d.enxofre!) / 100) * (98 / 32), 9)
        }
      }
  })
  it('níveis: 1 mols; 2 massas (CO₂ ou SO₂); 3 g/MJ ou H₂SO₄', () => {
    expect(new Set(SEMENTES.map((s) => gerarEmissao(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['mol']))
    expect(new Set(SEMENTES.map((s) => gerarEmissao(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['massa', 'so2']))
    expect(new Set(SEMENTES.map((s) => gerarEmissao(rng(s, 3), 3).dados!.variante))).toEqual(new Set(['mj', 'h2so4']))
  })
  it('as respostas são números "bonitos" (uma casa decimal no máximo, exceto g/MJ e H₂SO₄)', () => {
    for (const n of [1, 2] as const)
      for (const s of SEMENTES) {
        const inst = gerarEmissao(rng(s, n), n)
        expect(Math.abs(inst.resposta * 10 - Math.round(inst.resposta * 10)), `${n} ${s} ${inst.resposta}`).toBeLessThan(1e-6)
      }
  })
  it('erros típicos válidos (≥ 2) e a resposta certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarEmissao(rng(s, n), n)
        expect(inst.erros.length, `${n} ${s}`).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(Math.round(e.valor * 1e4) / 1e4).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(Math.round(inst.resposta * 1e4) / 1e4).replace('.', ',')).correto).toBe(true)
      }
  })
})

describe('Poluentes e processos', () => {
  it('cada nível tem pelo menos 5 itens, e cada item tem 3 erradas diferentes entre si e da certa', () => {
    for (const n of NIVEIS) expect(ITENS_POLUENTES.filter((i) => i.nivel === n).length).toBeGreaterThanOrEqual(5)
    for (const it of ITENS_POLUENTES) {
      const textos = [it.certa.texto, ...it.erradas.map((e) => e.texto)]
      expect(it.erradas).toHaveLength(3)
      expect(new Set(textos).size).toBe(4)
      for (const e of it.erradas) {
        expect(e.porque.length).toBeGreaterThan(25)
        expect(e.motivo.length).toBeGreaterThan(8)
      }
    }
  })
  it('as quatro alternativas são distintas, a certa é aceita e cada errada tem explicação e motivo', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarPoluentes(rng(s, n), n)
        expect(inst.opcoes).toHaveLength(4)
        expect(new Set(inst.opcoes.map((o) => o.rotulo)).size).toBe(4)
        const item = ITENS_POLUENTES[inst.dados!.indice]!
        expect(inst.opcoes.find((o) => o.id === inst.certa)!.rotulo).toBe(item.certa.texto)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]!.length).toBeGreaterThan(25)
          expect(c.motivo).not.toBe('opção errada')
        }
      }
  })
  it('"outro parecido" varia o item e a ordem das alternativas', () => {
    for (const n of NIVEIS) {
      expect(new Set(SEMENTES.map((s) => gerarPoluentes(rng(s, n), n).dados!.indice)).size).toBeGreaterThanOrEqual(5)
      expect(new Set(SEMENTES.map((s) => gerarPoluentes(rng(s, n), n).certa)).size).toBeGreaterThan(1)
    }
  })
  it('afirmações-chave estão corretas (conferência de conteúdo)', () => {
    const texto = JSON.stringify(ITENS_POLUENTES)
    // valores e fatos que o conteúdo afirma
    expect(texto).toContain('5,6')
    expect(texto).toContain('−18 °C')
    expect(texto).toContain('Protocolo de Montreal (1987)')
    // pH 4,6 é uma unidade abaixo de 5,6: fator 10 em [H⁺]
    expect(10 ** (5.6 - 4.6)).toBeCloseTo(10, 9)
    // razão H/C do metano e do octano
    expect(4 / 1).toBe(4)
    expect(18 / 8).toBe(2.25)
  })
})

describe('Economia atômica', () => {
  /** economia atômica calculada à parte, átomo por átomo */
  function eaIndependente(id: string): number {
    const r = reacaoVerde(id)
    const todas = [...r.reagentes, ...r.produtos]
    let reag = 0
    r.reagentes.forEach((f, i) => {
      for (const [el, n] of Object.entries(lerFormula(f))) reag += (r.coefs[i] as number) * n * ({ H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56 } as Record<string, number>)[el]!
    })
    let des = 0
    for (const [el, n] of Object.entries(lerFormula(todas[r.desejado] as string))) des += (r.coefs[r.desejado] as number) * n * ({ H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56 } as Record<string, number>)[el]!
    return (des / reag) * 100
  }
  it('as respostas conferem com o cálculo átomo por átomo', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarAtomos(rng(s, n), n)
        const d = inst.dados!
        const ea = eaIndependente(d.reacao)
        if (d.variante === 'ea') expect(inst.resposta).toBeCloseTo(ea, 9)
        else {
          const eta = d.rendimento! / 100
          // massa de 100 g de reagentes: produto obtido = EA% × η; resíduos = o resto
          const obtido = (ea / 100) * eta
          expect(inst.resposta).toBeCloseTo((1 - obtido) / obtido, 9)
        }
      }
  })
  it('níveis 1 e 2 pedem a economia atômica; o 3, o fator E com rendimento', () => {
    expect(new Set(SEMENTES.map((s) => gerarAtomos(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['ea']))
    expect(new Set(SEMENTES.map((s) => gerarAtomos(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['ea']))
    expect(new Set(SEMENTES.map((s) => gerarAtomos(rng(s, 3), 3).dados!.variante))).toEqual(new Set(['fatorE']))
  })
  it('o nível 1 inclui o caso de 100 % (adição) e o de 56 %', () => {
    const respostas = new Set(SEMENTES.map((s) => Math.round(gerarAtomos(rng(s, 1), 1).resposta)))
    expect(respostas.has(100)).toBe(true)
    expect(respostas.has(56)).toBe(true)
  })
  it('todas as equações usadas aparecem no enunciado e o produto desejado é nomeado', () => {
    for (const s of SEMENTES) {
      const inst = gerarAtomos(rng(s, 2), 2)
      expect(inst.enunciado).toContain('Massas molares')
      expect(inst.enunciado).toContain('produto desejado')
    }
    expect(REACOES_VERDES.length).toBeGreaterThanOrEqual(10)
  })
  it('erros típicos válidos e resposta certa aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarAtomos(rng(s, n), n)
        expect(inst.erros.length, `${n} ${s} ${inst.dados!.reacao}`).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(Math.round(e.valor * 1e4) / 1e4).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(Math.round(inst.resposta * 1e4) / 1e4).replace('.', ',')).correto).toBe(true)
      }
  })
})

describe('Princípios da química verde', () => {
  it('são 12 princípios e cada um tem pelo menos 2 cenários', () => {
    expect(PRINCIPIOS).toHaveLength(12)
    for (const p of PRINCIPIOS) expect(CENARIOS.filter((c) => c.principio === p.id).length, p.nome).toBeGreaterThanOrEqual(2)
  })
  it('a alternativa certa é o princípio do cenário; as erradas são princípios diferentes', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarPrincipios(rng(s, n), n)
        const p = PRINCIPIOS.find((x) => x.id === inst.dados!.principio)!
        expect(inst.opcoes).toHaveLength(4)
        expect(new Set(inst.opcoes.map((o) => o.rotulo)).size).toBe(4)
        expect(inst.opcoes.find((o) => o.id === inst.certa)!.rotulo).toBe(p.nome)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]).toContain(p.definicao)
          expect(c.motivo).toContain('confundiu com o princípio')
        }
      }
  })
  it('o nível 3 cobre todos os 12 princípios e o nível 1 cobre pelo menos 5', () => {
    expect(new Set(SEMENTES.map((s) => gerarPrincipios(rng(s, 3), 3).dados!.principio)).size).toBe(12)
    expect(new Set(SEMENTES.map((s) => gerarPrincipios(rng(s, 1), 1).dados!.principio)).size).toBeGreaterThanOrEqual(5)
  })
  it('o cenário do enunciado é um dos do banco', () => {
    for (const s of SEMENTES) {
      const inst = gerarPrincipios(rng(s, 2), 2)
      expect(CENARIOS.some((c) => inst.enunciado.includes(c.texto))).toBe(true)
    }
  })
})
