import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { criarRng } from '@/lib/rng'
import { volume } from './calculo'
import { gerarArea, gerarPlanificacao, gerarTriangulo, gerarVolume } from './geradores'
import { ehPlanificacaoDeCubo } from './redeCubo'
import { areaPeca, rede } from './redes'

const NIVEIS: Nivel[] = [1, 2, 3]
const rodar = (f: (rng: () => number, n: Nivel, s: number) => void, ate = 150) => {
  for (let s = 1; s <= ate; s++) for (const n of NIVEIS) f(criarRng(s * 7919 + n), n, s)
}
const PI = 3.14

describe('gerarPlanificacao', () => {
  it('opções únicas, explicadas, com uma só certa', () => {
    rodar((rng, n) => {
      const i = gerarPlanificacao(rng, n)
      expect(i.opcoes.map((o) => o.id)).toContain(i.certa)
      expect(new Set(i.opcoes.map((o) => o.id)).size).toBe(i.opcoes.length)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
      }
    })
  })
  it('nível 1: a resposta é o sólido da rede mostrada', () => {
    rodar((rng, n) => {
      if (n !== 1) return
      const i = gerarPlanificacao(rng, n)
      expect(i.certa).toBe(i.dados!.rede!.solido)
      expect(i.dados!.rede!.defeito).toBe('correta')
    })
  })
  it('nível 2: exatamente uma figura sem defeito, as outras com defeito', () => {
    rodar((rng, n) => {
      if (n !== 2) return
      const d = gerarPlanificacao(rng, n).dados!
      const redes = Object.entries(d.redes!)
      expect(redes).toHaveLength(4)
      expect(redes.filter(([, r]) => r.defeito === 'correta')).toHaveLength(1)
      expect(new Set(redes.map(([, r]) => r.defeito)).size).toBe(4)
    })
  })
  it('nível 3: só uma figura dobra num cubo (conferido pelo verificador)', () => {
    rodar((rng, n) => {
      if (n !== 3) return
      const i = gerarPlanificacao(rng, n)
      const figs = Object.entries(i.dados!.figuras!)
      expect(figs).toHaveLength(4)
      expect(figs.filter(([, f]) => ehPlanificacaoDeCubo(f)).map(([id]) => id)).toEqual([i.certa])
    })
  })
})

describe('gerarVolume', () => {
  it('a resposta é o volume do sólido e a tolerância é de 10%', () => {
    rodar((rng, n) => {
      const i = gerarVolume(rng, n)
      const d = i.dados!
      expect(i.resposta).toBeCloseTo(volume(d.solido, d.dim), 9)
      expect(i.tolerancia).toBeCloseTo(i.resposta * 0.1, 9)
      expect(corrigirNum(i, String(Math.round(i.resposta * 1.05))).correto).toBe(true)
      expect(corrigirNum(i, String(Math.round(i.resposta * 1.3))).correto).toBe(false)
      for (const e of i.erros) expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
    })
  })
  it('níveis usam os sólidos esperados', () => {
    const por: Record<number, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set() }
    rodar((rng, n) => por[n]!.add(gerarVolume(rng, n).dados!.solido))
    expect([...por[1]!].sort()).toEqual(['cilindro', 'prisma'])
    expect([...por[2]!].sort()).toEqual(['cone', 'piramide'])
    expect([...por[3]!]).toEqual(['esfera'])
  })
})

describe('gerarArea — conferida pela soma das áreas das peças da planificação', () => {
  it('a resposta bate com a área da rede (e com π = 3,14 nos sólidos de revolução)', () => {
    rodar((rng, n) => {
      const i = gerarArea(rng, n)
      const d = i.dados!
      const pecas = rede(d.solido, d.dim)
      const soma = pecas.filter((p) => d.pede === 'total' || p.lateral).reduce((acc, p) => acc + areaPeca(p), 0)
      const usaPi = d.solido === 'cilindro' || d.solido === 'cone'
      const esperado = usaPi ? (soma * PI) / Math.PI : soma
      expect(i.resposta).toBeCloseTo(esperado, 1)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) {
        expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
        const primeiro = i.erros.find((x) => Math.abs(x.valor - e.valor) <= i.tolerancia)!
        expect(corrigirNum(i, String(e.valor)).feedback).toBe(primeiro.frase)
      }
    })
  })
})

describe('gerarTriangulo', () => {
  it('Pitágoras, semelhança e sombra batem com as relações', () => {
    const vistos = new Set<string>()
    rodar((rng, n) => {
      const i = gerarTriangulo(rng, n)
      const d = i.dados!
      vistos.add(d.modo)
      if (d.modo === 'pitagoras') {
        const { a, b, c } = d.lados!
        expect(a * a + b * b).toBe(c * c)
        expect(i.resposta).toBe({ a, b, c }[d.incognita!])
      } else if (d.modo === 'semelhanca' && d.incognita) {
        const k = (d.maior![0] as number) / (d.menor![0] as number)
        for (let j = 0; j < 3; j++) expect((d.maior![j] as number) / (d.menor![j] as number)).toBeCloseTo(k, 9)
        const idx = ['a', 'b', 'c'].indexOf(d.incognita)
        expect(i.resposta).toBeCloseTo(d.maior![idx] as number, 9)
      } else if (d.modo === 'semelhanca') {
        const k = (d.maior![0] as number) / (d.menor![0] as number)
        const areaMenor = ((d.menor![0] as number) * (d.menor![1] as number)) / 2
        expect(i.resposta).toBeCloseTo(areaMenor * k * k, 9)
      } else {
        expect(i.resposta / d.vara!).toBeCloseTo(d.sombraArvore! / d.sombraVara!, 9)
      }
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
    })
    expect([...vistos].sort()).toEqual(['pitagoras', 'semelhanca', 'sombra'])
  })
  it('nível 1 tem hipotenusa e catetos como incógnita', () => {
    const inc = new Set<string>()
    rodar((rng, n) => {
      if (n === 1) inc.add(gerarTriangulo(rng, n).dados!.incognita!)
    })
    expect([...inc].sort()).toEqual(['a', 'b', 'c'])
  })
})
