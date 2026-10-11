import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { criarRng } from '@/lib/rng'
import { classificar, somaPA, somaPG, somaPGInfinita, termoPA, termoPG } from './calculo'
import { gerarSequencia, gerarSoma, gerarTermo } from './geradores'

const NIVEIS: Nivel[] = [1, 2, 3]
const rodar = (f: (rng: () => number, n: Nivel, s: number) => void) => {
  for (let s = 1; s <= 120; s++) for (const n of NIVEIS) f(criarRng(s * 7919 + n), n, s)
}

describe('gerarSequencia', () => {
  it('uma única alternativa é verdadeira, e as explicações de cada uma existem', () => {
    rodar((rng, n) => {
      const i = gerarSequencia(rng, n)
      const d = i.dados!
      expect(i.opcoes.length).toBe(4)
      expect(new Set(i.opcoes.map((o) => o.id)).size).toBe(4)
      expect(i.opcoes.map((o) => o.id)).toContain(i.certa)
      const c = classificar(d.termos)
      expect(c.tipo).toBe(d.tipo)
      expect(i.certa).toBe(d.tipo === 'nenhuma' ? 'nenhuma' : `${d.tipo}:${c.razao}`)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
      }
    })
  })
  it('o nível 3 inclui, em algum momento, "nem PA nem PG", PG de razão negativa e PA fracionária', () => {
    const tipos = new Set<string>()
    rodar((rng, n) => {
      if (n !== 3) return
      const d = gerarSequencia(rng, n).dados!
      tipos.add(d.tipo === 'nenhuma' ? 'nenhuma' : `${d.tipo}${(d.razao as number) < 0 ? '-' : (d.razao as number) % 1 !== 0 ? 'frac' : '+'}`)
    })
    expect(tipos).toContain('nenhuma')
    expect(tipos).toContain('PG-')
    expect(tipos).toContain('PAfrac')
  })
})

describe('gerarTermo', () => {
  it('a resposta bate com o termo geral e o erro típico (n em vez de n−1) é distinto', () => {
    rodar((rng, nivel) => {
      const i = gerarTermo(rng, nivel)
      const d = i.dados!
      const esperado = d.tipo === 'PG' ? termoPG(d.a1, d.razao as number, d.n as number) : termoPA(d.a1, d.razao as number, d.n as number)
      expect(i.resposta).toBeCloseTo(esperado, 6)
      expect(Number.isFinite(i.resposta)).toBe(true)
      expect(Math.abs(i.resposta)).toBeLessThan(1e7)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) {
        expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
        expect(corrigirNum(i, String(e.valor)).feedback).toBe(e.frase)
      }
    })
  })
  it('os termos mostrados formam a sequência declarada', () => {
    rodar((rng, nivel) => {
      const d = gerarTermo(rng, nivel).dados!
      expect(classificar(d.termos).tipo).toBe(d.tipo)
    })
  })
})

describe('gerarSoma', () => {
  it('soma de PA, PG finita e PG infinita batem com as fórmulas', () => {
    rodar((rng, nivel) => {
      const i = gerarSoma(rng, nivel)
      const d = i.dados!
      let esperado: number
      if (nivel === 1) esperado = somaPA(d.a1, d.razao as number, d.n as number)
      else if (nivel === 2) esperado = somaPG(d.a1, d.razao as number, d.n as number)
      else esperado = somaPGInfinita(d.a1, d.razao as number) as number
      expect(i.resposta).toBeCloseTo(esperado, 6)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
    })
  })
})
