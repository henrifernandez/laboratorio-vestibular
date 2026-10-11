import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { criarRng } from '@/lib/rng'
import { media, mediaPonderada, mediana, moda } from './calculo'
import { CENARIOS, gerarExtremo, gerarHistograma, gerarMedida, gerarRepresentativa } from './geradores'

const NIVEIS: Nivel[] = [1, 2, 3]
const rodar = (f: (rng: () => number, n: Nivel, s: number) => void) => {
  for (let s = 1; s <= 100; s++) for (const n of NIVEIS) f(criarRng(s * 7919 + n), n, s)
}

describe('gerarExtremo', () => {
  it('o valor extremo mexe muito mais na média do que na mediana (a alternativa certa é verdadeira)', () => {
    rodar((rng, n) => {
      const i = gerarExtremo(rng, n)
      const d = i.dados!
      expect(media(d.antes)).toBeCloseTo(d.mediaAntes)
      expect(media(d.depois)).toBeCloseTo(d.mediaDepois)
      expect(mediana(d.depois)).toBeCloseTo(d.medianaDepois)
      const dMedia = Math.abs(d.mediaDepois - d.mediaAntes)
      const dMed = Math.abs(d.medianaDepois - d.medianaAntes)
      expect(dMedia).toBeGreaterThanOrEqual(3 * dMed + 2 - 1e-9)
      expect(d.acao).toBe(n === 2 ? 'retirou' : 'adicionou')
      expect(corrigirMulti(i, i.certa).correto).toBe(true)
      expect(new Set(i.opcoes.map((o) => o.id)).size).toBe(4)
      for (const o of i.opcoes) expect(i.porque[o.id]).toBeTruthy()
    })
  })
  it('nível 3 acrescenta um valor baixo (a média diminui)', () => {
    rodar((rng, n) => {
      if (n !== 3) return
      const d = gerarExtremo(rng, n).dados!
      expect(d.mediaDepois).toBeLessThan(d.mediaAntes)
    })
  })
})

describe('gerarMedida', () => {
  it('a resposta bate com o cálculo independente e os erros típicos diferem dela', () => {
    rodar((rng, n) => {
      const i = gerarMedida(rng, n)
      const d = i.dados!
      let esperado: number
      if (d.medida === 'media') esperado = media(d.valores as number[])
      else if (d.medida === 'mediana') esperado = mediana(d.valores as number[])
      else if (d.medida === 'mediaPonderada') esperado = Math.round(mediaPonderada(d.tabela!) * 100) / 100
      else esperado = mediana((d.tabela as { valor: number; freq: number }[]).flatMap((t) => Array(t.freq).fill(t.valor) as number[]))
      expect(i.resposta).toBeCloseTo(esperado, 6)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) {
        expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
        expect(corrigirNum(i, String(e.valor)).feedback).toBe(e.frase)
      }
    })
  })
  it('nível 1: a média é exata (soma divisível pela quantidade)', () => {
    rodar((rng, n) => {
      if (n !== 1) return
      const v = gerarMedida(rng, n).dados!.valores as number[]
      expect(v.reduce((s, x) => s + x, 0) % v.length).toBe(0)
    })
  })
  it('nível 2: mediana com quantidade par de valores desordenados', () => {
    rodar((rng, n) => {
      if (n !== 2) return
      const v = gerarMedida(rng, n).dados!.valores as number[]
      expect(v.length % 2).toBe(0)
    })
  })
})

describe('gerarHistograma', () => {
  it('a resposta bate com a leitura das classes', () => {
    rodar((rng, n) => {
      const i = gerarHistograma(rng, n)
      const d = i.dados!
      expect(d.total).toBe(d.classes.reduce((s, c) => s + c.freq, 0))
      expect(d.classes).toHaveLength(5)
      expect(Number.isFinite(i.resposta)).toBe(true)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
      if (n === 1) expect(d.classes.map((c) => c.freq)).toContain(i.resposta)
      if (n === 3) {
        const est = mediaPonderada(d.classes.map((c) => ({ valor: (c.de + c.ate) / 2, freq: c.freq })))
        expect(i.resposta).toBeCloseTo(est, 1)
      }
    })
  })
})

describe('gerarRepresentativa', () => {
  it('a medida certa é coerente com os dados de cada cenário', () => {
    for (const c of CENARIOS) {
      if (c.categorias) {
        expect(c.certa).toBe('moda')
        continue
      }
      const m = media(c.dados)
      const med = mediana(c.dados)
      if (c.certa === 'mediana') expect(Math.abs(m - med) / med).toBeGreaterThan(0.3)
      if (c.certa === 'media') expect(Math.abs(m - med) / med).toBeLessThan(0.05)
      if (c.certa === 'moda') expect(moda(c.dados).length).toBeGreaterThan(0)
    }
  })
  it('gera para todos os níveis, com explicação em cada alternativa', () => {
    rodar((rng, n) => {
      const i = gerarRepresentativa(rng, n)
      expect(i.opcoes).toHaveLength(3)
      for (const o of i.opcoes) expect(i.porque[o.id]).toBeTruthy()
      expect(corrigirMulti(i, i.certa).correto).toBe(true)
      for (const o of i.opcoes.filter((x) => x.id !== i.certa)) expect(corrigirMulti(i, o.id).correto).toBe(false)
    })
  })
})
