import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { criarRng } from '@/lib/rng'
import type { Nivel } from '@/desafios/tipos'
import { montanteComposto, montanteSimples, variacaoTotal } from './calculo'
import { gerarCruz, gerarMontante, gerarRegime, gerarSucessivos } from './geradores'

const NIVEIS: Nivel[] = [1, 2, 3]
const rodar = (f: (rng: () => number, n: Nivel, s: number) => void) => {
  for (let s = 1; s <= 80; s++) for (const n of NIVEIS) f(criarRng(s * 7919 + n), n, s)
}

describe('gerarCruz', () => {
  it('o mês da resposta é de fato o primeiro em que o composto passa o simples', () => {
    rodar((rng, n) => {
      const i = gerarCruz(rng, n)
      const d = i.dados!
      expect(montanteComposto(d.capital, d.jComposto / 100, d.mes)).toBeGreaterThan(montanteSimples(d.capital, d.iSimples / 100, d.mes))
      if (d.mes > 1) {
        expect(montanteComposto(d.capital, d.jComposto / 100, d.mes - 1)).toBeLessThanOrEqual(montanteSimples(d.capital, d.iSimples / 100, d.mes - 1) + 1e-9)
      }
      expect(i.resposta).toBe(d.mes)
      expect(d.jComposto).toBeLessThan(d.iSimples)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
    })
  })
  it('erros típicos (mês anterior e seguinte) têm feedback específico e não são a resposta', () => {
    rodar((rng, n) => {
      const i = gerarCruz(rng, n)
      for (const e of i.erros) {
        expect(e.valor).not.toBe(i.resposta)
        const c = corrigirNum(i, String(e.valor))
        expect(c.correto).toBe(false)
        expect(c.feedback).toBe(e.frase)
      }
    })
  })
})

describe('gerarSucessivos', () => {
  it('a resposta bate com a multiplicação dos fatores e difere da soma ingênua', () => {
    rodar((rng, n) => {
      const i = gerarSucessivos(rng, n)
      const d = i.dados!
      const esperado = d.pedeVariacao ? variacaoTotal(d.passos) : d.preco * (1 + variacaoTotal(d.passos) / 100)
      expect(i.resposta).toBeCloseTo(esperado, 6)
      expect(d.passos).toHaveLength(n === 1 ? 2 : 3)
      expect(d.pedeVariacao).toBe(n === 3)
      expect(corrigirNum(i, String(Math.round(i.resposta * 100) / 100)).correto).toBe(true)
      for (const e of i.erros) expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
    })
  })
  it('nível 1: 10% de aumento e 10% de desconto não voltam ao inicial', () => {
    const rng = () => 0.5
    void rng
    const r = variacaoTotal([10, -10])
    expect(r).not.toBe(0)
  })
  it('somar percentuais gera o feedback do erro típico', () => {
    rodar((rng, n) => {
      const i = gerarSucessivos(rng, n)
      const e = i.erros[0]!
      const c = corrigirNum(i, String(e.valor))
      expect(c.feedback).toMatch(/somou os percentuais/)
    })
  })
})

describe('gerarMontante', () => {
  it('a resposta bate com a fórmula do regime pedido', () => {
    rodar((rng, n) => {
      const i = gerarMontante(rng, n)
      const d = i.dados!
      const m = d.regime === 'simples' ? montanteSimples(d.capital, d.taxa / 100, d.tempo) : montanteComposto(d.capital, d.taxa / 100, d.tempo)
      expect(i.resposta).toBeCloseTo(d.pedeJuros ? m - d.capital : m, 2)
      expect(d.regime).toBe(n === 1 ? 'simples' : 'composto')
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
    })
  })
})

describe('gerarRegime', () => {
  it('uma única opção certa, e todas as opções têm explicação', () => {
    rodar((rng, n) => {
      const i = gerarRegime(rng, n)
      expect(i.opcoes.map((o) => o.id)).toContain(i.certa)
      expect(i.opcoes).toHaveLength(n === 1 ? 2 : 4)
      expect(new Set(i.opcoes.map((o) => o.id)).size).toBe(i.opcoes.length)
      for (const o of i.opcoes) expect(i.porque[o.id]).toBeTruthy()
      expect(corrigirMulti(i, i.certa).correto).toBe(true)
      for (const o of i.opcoes.filter((x) => x.id !== i.certa)) expect(corrigirMulti(i, o.id).correto).toBe(false)
    })
  })
  it('a tabela mostra diferenças constantes (simples) ou razões constantes (composto)', () => {
    rodar((rng, n) => {
      const i = gerarRegime(rng, n)
      const v = i.dados!.valores
      const difs = v.slice(1).map((x, k) => x - (v[k] as number))
      const razoes = v.slice(1).map((x, k) => x / (v[k] as number))
      const simples = i.certa.startsWith('simples')
      if (simples) difs.forEach((d) => expect(d).toBeCloseTo(difs[0] as number, 1))
      else razoes.forEach((r) => expect(r).toBeCloseTo(razoes[0] as number, 2))
    })
  })
})
